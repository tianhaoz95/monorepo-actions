import * as core from '@actions/core';
import * as glob from '@actions/glob';
import fs from 'fs';

const main = async (): Promise<void> => {
    const globOptions = {
        followSymbolicLinks: false,
    }
    const configFiles = core.getInput('config_files');
    const globber = glob.create(configFiles, globOptions);
    const globalConfig: Record<string, string> = {};
    for await (const file of (await globber).globGenerator()) {
        core.info(`Use ${file} as a configuration file.`);
        const configContent = fs.readFileSync(file, 'utf8');
        const parsedConfig: Record<string, string> = JSON.parse(configContent);
        for (const configName in parsedConfig) {
            globalConfig[configName] = parsedConfig[configName];
        }
    }
    for (const configName in globalConfig) {
        const configValue = globalConfig[configName];
        core.info(`Set ${configName} to ${configValue}.`);
        core.setOutput(configName, configValue);
    }
}

main();

