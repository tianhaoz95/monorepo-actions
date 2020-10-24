import * as core from '@actions/core';
import * as io from '@actions/io';
import * as glob from '@actions/glob';
import * as exec from '@actions/exec';
import fs from 'fs';

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
    await exec.exec('git', ['config', 'user.email', email]);
    await exec.exec('git', ['config', 'user.name', username]);
    await exec.exec('git', ['config', 'user.password', token]);
}

const maybeDupFile = async (target: string, destFiles: string[]): Promise<boolean> => {
    const targetContent = fs.readFileSync(target, 'utf8');
    let outdated = false;
    for (const destFile of destFiles) {
        const destContent = fs.readFileSync(destFile, 'utf8');
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

const uploadChanges = async (): Promise<void> => {
    const method = core.getInput('method');
    const branch = core.getInput('branch');
    if (method === 'push') {
        await exec.exec('git', ['add', '-A']);
        await exec.exec('git', ['commit', '-m', 'chore: duplicate files']);
        await exec.exec('git', ['push', '-u', 'origin']);
    } else if (method === 'pull_request') {
        await exec.exec('git', ['checkout', '-b', branch]);
        await exec.exec('git', ['add', '-A']);
        await exec.exec('git', ['commit', '-m', 'chore: duplicate files']);
        await exec.exec('git', ['push', '-u', 'origin', branch]);
    } else if (method === 'dry_run') {
        await exec.exec('git', ['checkout', '-b', branch]);
        await exec.exec('git', ['add', '-A']);
        await exec.exec('git', ['commit', '-m', 'chore: duplicate files']);
    } else {
        throw Error(`Method ${method} not found.`);
    }
}

const main = async (): Promise<void> => {
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
        if (await maybeDupFile(target, globalConfig['target'])) {
            outdated = true;
        }
    }
    if (outdated) {
        await uploadChanges();
    } else {
        core.info('No change needed. Skip.');
    }
}

main();