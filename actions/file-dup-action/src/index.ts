import * as core from '@actions/core';
import * as io from '@actions/io';
import * as glob from '@actions/glob';
import fs from 'fs';

const cpOptions = {
  recursive: true,
  force: true,
};

const globOptions = {
  followSymbolicLinks: false,
};

const dupFile = async (target: string, destFiles: string[]): Promise<void> => {
  for (const destFile of destFiles) {
    await io.cp(target, destFile, cpOptions);
  }
}

const main = async (): Promise<void> => {
  const configFiles = core.getInput('config_files');
  const globber = glob.create(configFiles, globOptions);
  const globalConfig: Record<string, string[]> = {};
  for await (const file of (await globber).globGenerator()) {
    core.info(`Use ${file} as a configuration file.`);
    const configContent = fs.readFileSync(file, 'utf8');
    const parsedConfig: Record<string, string[]> = JSON.parse(configContent);
    for (const configName in parsedConfig) {
      globalConfig[configName] = parsedConfig[configName];
    }
  }
  for (const target in globalConfig) {
    await dupFile(target, globalConfig['target']);
  }
}

main();