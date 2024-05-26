import fs from 'fs';
import yargs from "yargs";
import {hideBin} from "yargs/helpers";
import webpack from "webpack";
import '@ungap/with-resolvers';
import {FactoryArgument} from "./configs/webpack.common.config";
import {exec, execFile} from "node:child_process";
import url from 'url';
import path from "path";
import {getWorkspaceRoot} from "./utils";
import {promisify} from "util";

const args = yargs(hideBin(process.argv))
    .option('env', {
        describe: 'node_env value',
        type: 'string',
        demandOption: true,
        alias: 'e',
    })
    .option('watch', {
        describe: 'watch the origin files',
        type: 'boolean',
        default: false,
        alias: 'w',
    })
    .option('serve', {
        describe: 'serve the examples',
        type: 'boolean',
        default: false,
        alias: 's'
    })
    .strict()
    .help()
    .parse();


type ScriptArg = typeof args;

run(args);
const _exec = promisify(exec)

const SCRIPTS_PATH = path.join(getWorkspaceRoot(), 'scripts');

async function run(args: ScriptArg) {
    const {watch, serve, env} = await Promise.resolve(args);

    const buildProcess  = exec(`npx tsx ./build.ts --env ${env} --watch ${watch || serve}`, {
        cwd: SCRIPTS_PATH,
    });

    const {resolve, reject, promise: buildDone} = Promise.withResolvers()

    buildProcess.stdout?.on('data', (chunk) => {
        console.log(chunk.toString() );
        if(chunk.match(/^has built/)) {
            resolve(1)
        }
    });

    buildProcess.stdout?.on('error', (err) => {
        reject(err)
    });

    await buildDone;
    if(serve) {
       const serveProcess = exec(`npx tsx ./serve.ts --env ${env}`, {
            cwd: SCRIPTS_PATH,
        });

        serveProcess.stdout?.on('data', (chunk) => {
            console.log(chunk.toString() );
        });

        serveProcess.stdout?.on('error', (err) => {
            reject(err)
        });
    }
}

