
import yargs from "yargs";
import {hideBin} from "yargs/helpers";
import webpack from "webpack";
import '@ungap/with-resolvers';
import {FactoryArgument} from "./configs/webpack.common.config";
import {exec} from "child_process";
import {BRIDGE_PATH, DIST_PATH, ROOT_PATH, TS_CONFIG_PATH} from "./paths";
import esbuild from 'esbuild';


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
    .option('analyze', {
        describe: 'turn on the bundle analyzer',
        type: 'boolean',
        default: false,
    })
    .strict()
    .help()
    .parse();


type EsBuildOptions = Parameters<typeof esbuild.build>[0];
(async function (){
    const {watch, env, analyze} = await args;

    try {
        const start = performance.now();

        const commonConfigs: EsBuildOptions = {
            entryPoints: [BRIDGE_PATH],
            tsconfig: TS_CONFIG_PATH,
            jsx: "transform",
            bundle: true,
            outdir: DIST_PATH,
            external: ['react'],
            define: {
                'production': env
            }
        };

        const cjsConfig: EsBuildOptions = {
            ...commonConfigs,
            format: 'cjs',
        };

        const esmConfig: EsBuildOptions = {
            ...commonConfigs,
            format: 'esm',
            outExtension: {'.js': '.mjs'},
        };

        const processes = [
            cjsConfig,
            esmConfig
        ].map((config) => esbuild.build(config));

        await Promise.all(processes);

        console.log(`✔ esbuild built: ${performance.now() - start}ms`)

    } catch (e) {
        console.log('🤡 esbuild error:', e);
    }

    console.log('has built')

    exec(`npm run build:types`, {
        cwd: ROOT_PATH
    });

})()
