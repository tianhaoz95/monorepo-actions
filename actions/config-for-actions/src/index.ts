import * as core from '@actions/core';
import * as glob from '@actions/glob';

const main = async (): Promise<void> => {
    const globOptions = {
        followSymbolicLinks: false,
    }
    const configFiles = core.getInput('config_files');
    const globber = glob.create(configFiles, globOptions);
    for await (const file of (await globber).globGenerator()) {
        console.log(file)
    }
}

main();

