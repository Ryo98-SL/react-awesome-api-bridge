import yargs from "yargs";
import {hideBin} from "yargs/helpers";
import '@ungap/with-resolvers';
import {exec} from "node:child_process";
import {SCRIPTS_PATH} from "./paths";

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

(async function () {
        const {watch, serve, env} = await args;

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
                console.log(chunk);
            });

            serveProcess.stdout?.on('error', (err) => {
                console.error(err)
            });
        }
    }
)();
