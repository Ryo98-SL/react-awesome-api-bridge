
import yargs from "yargs";
import {hideBin} from "yargs/helpers";
import webpack from "webpack";
import '@ungap/with-resolvers';
import {FactoryArgument} from "./configs/webpack.common.config";
import {exec} from "child_process";
import { ROOT_PATH} from "./paths";


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
    .strict()
    .help()
    .parse();


(async function (){
    const {watch, env} = await Promise.resolve(args);

    const bundleConfigModule = await import('./configs/webpack.build.config');
    const {default: bundleConfigFactory} = bundleConfigModule;

    const factoryArg: FactoryArgument = {env};

    const bundleConfig =  bundleConfigFactory(factoryArg);


    const compiler = webpack(bundleConfig);
    const { resolve, reject, promise: bundleDone } = Promise.withResolvers();

    if(watch) {
        const watching = compiler.watch({
            aggregateTimeout: 300,
            poll: undefined
        } , (err, stats) => {
            if(err) {
                reject(err);
            }
            resolve('watch');
            stats && console.log(stats.toString({colors: true, chunks: true}))
        });
        // watching.close((closeErr) => {
        //
        // })
    } else {
        compiler.run((err, stats) => {
            if(err) {
                reject(err)
            }
            resolve('')
            stats && console.log(stats.toString({colors: true, chunks: true}))
            compiler.close((closeError) => {

            });
        });
    }

    await bundleDone;

    console.log('has built')

    exec(`npm run build:types`, {
        cwd: ROOT_PATH
    });

})()
