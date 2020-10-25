import * as core from '@actions/core';
import * as exec from '@actions/exec';

let myOutput = '';
let myError = '';

const options: exec.ExecOptions = {
    listeners: {
        stdout: (data: Buffer) => {
            myOutput += data.toString();
        },
        stderr: (data: Buffer) => {
            myError += data.toString();
        }
    },
};

const main = async (): Promise<void> => {
    if (!process.env['GITHUB_TOKEN']) {
        core.error('GITHUB_TOKEN not found.');
    } else {
        await exec.exec('gh', ['auth', 'login'], options);
    }
}

main();