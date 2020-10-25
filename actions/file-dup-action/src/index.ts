import * as core from '@actions/core';
import * as io from '@actions/io';
import * as glob from '@actions/glob';
import * as exec from '@actions/exec';
import fs from 'fs';
import path from 'path';

interface ActionConfig {
    method: 'push' | 'pull_request' | 'dry_run',
    specifyBase: boolean;
    baseBranch: string;
    specifyHead: boolean;
    headBranch: string;
};

const createDefaultConfig = (): ActionConfig => {
    return {
        method: 'pull_request',
        specifyBase: false,
        baseBranch: 'default',
        specifyHead: false,
        headBranch: 'default',
    };
}

const cpOptions = {
    recursive: true,
    force: true,
};

const globOptions = {
    followSymbolicLinks: false,
};

const configureGit = async (): Promise<void> => {
    const email = core.getInput('email');
    const username = core.getInput('username');
    const token = core.getInput('token');
    core.info('Configure git profile.');
    await exec.exec('git', ['config', 'user.email', email]);
    await exec.exec('git', ['config', 'user.name', username]);
    await exec.exec('git', ['config', 'user.password', token]);
    core.info('Configure GitHub CLI.');
}

const maybeDupFile = async (target: string, destFiles: string[]): Promise<boolean> => {
    const targetFilename = path.join(process.env['GITHUB_WORKSPACE'] as string, target);
    core.info(`Read ${targetFilename}.`);
    const targetContent = fs.readFileSync(targetFilename, 'utf8');
    let outdated = false;
    for (const destFile of destFiles) {
        const destFilename = path.join(process.env['GITHUB_WORKSPACE'] as string, destFile);
        core.info(`Read ${destFilename}.`);
        const destContent = fs.readFileSync(destFilename, 'utf8');
        core.info(`Check the content of ${target} and ${destFile}.`);
        if (targetContent === destContent) {
            core.info(`The content of ${target} and ${destFile} is the same. Skip.`);
        } else {
            await io.cp(target, destFile, cpOptions);
            outdated = true;
        }
    }
    return outdated;
}

const getBaseBranch = (config: ActionConfig): void => {
    const base = core.getInput('base');
    if (base === undefined) {
        config.specifyBase = false;
    } else {
        config.specifyBase = true;
        config.baseBranch = base;
    }
}

const getHeadBranch = (config: ActionConfig): void => {
    const head = core.getInput('head');
    if (head === undefined) {
        config.specifyHead = false;
    } else {
        config.specifyHead = true;
        config.headBranch = head;
    }
}

const openPullRequest = async (config: ActionConfig): Promise<void> => {
    let ghArgs: string[] = ['pr', 'create'];
    if (config.specifyBase) {
        ghArgs = [...ghArgs, '--base', config.baseBranch];
    }
    if (config.specifyHead) {
        ghArgs = [...ghArgs, '--head', config.headBranch];
    }
    await exec.exec('gh', ghArgs);
}

const uploadChanges = async (config: ActionConfig): Promise<void> => {
    const method = core.getInput('method');
    const head = core.getInput('head');
    if (method === 'push') {
        await exec.exec('git', ['add', '-A']);
        await exec.exec('git', ['commit', '-m', 'chore: duplicate files']);
        await exec.exec('git', ['push', '-f', '-u', 'origin']);
    } else if (method === 'pull_request') {
        await exec.exec('git', ['checkout', '-b', head]);
        await exec.exec('git', ['add', '-A']);
        await exec.exec('git', ['commit', '-m', 'chore: duplicate files']);
        await exec.exec('git', ['push', '-f', '-u', 'origin', head]);
        await openPullRequest(config);
        core.info('Pull request opened.');
    } else if (method === 'dry_run') {
        await exec.exec('git', ['checkout', '-b', head]);
        await exec.exec('git', ['add', '-A']);
        await exec.exec('git', ['commit', '-m', 'chore: duplicate files']);
        await exec.exec('gh', ['issue', 'list']);
    } else {
        throw Error(`Method ${method} not found.`);
    }
}

const main = async (): Promise<void> => {
    const config = createDefaultConfig();
    getHeadBranch(config);
    getBaseBranch(config);
    await configureGit();
    const configFiles = core.getInput('config_files');
    const globber = glob.create(configFiles, globOptions);
    const globalConfig: Record<string, string[]> = {};
    let outdated = false;
    for await (const file of (await globber).globGenerator()) {
        core.info(`Use ${file} as a configuration file.`);
        const configContent = fs.readFileSync(file, 'utf8');
        core.info(`Found config with content: ${configContent}`);
        const parsedConfig: Record<string, string[]> = JSON.parse(configContent);
        for (const targetFile in parsedConfig) {
            globalConfig[targetFile] = parsedConfig[targetFile];
        }
    }
    for (const target in globalConfig) {
        const dupFiles = globalConfig[target];
        core.info(`Config entry ${target} => ${JSON.stringify(dupFiles)}`);
        if (await maybeDupFile(target, dupFiles)) {
            outdated = true;
        }
    }
    if (outdated) {
        await uploadChanges(config);
    } else {
        core.info('No change needed. Skip.');
    }
}

main();