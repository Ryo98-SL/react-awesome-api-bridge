import webpack from "webpack";
import yargs from "yargs";
import {hideBin} from "yargs/helpers";
import {FactoryArgument} from "./configs/webpack.common.config";
import WebpackDevServer from 'webpack-dev-server'

const args = yargs(hideBin(process.argv)).option('env', {
    demandOption: true,
    type: "string",
    alias: 'e',
})
    .strict()
    .help()
    .parse();



(async function () {
    const {env} = await  Promise.resolve(args);
    const factoryArg: FactoryArgument = {
       env
    }

    const serveConfig = (await import('./configs/webpack.serve.config')).default(factoryArg);

    const compiler = webpack(serveConfig);

    const devServerOptions = { ...serveConfig.devServer, open: true };
    const server = new WebpackDevServer(devServerOptions, compiler);

    await server.start();
    console.log("=>(serve.ts:33) server started", );
})()
