import path from "path";
import webpack from "webpack";
import ForkTsCheckerWebpackPlugin from "fork-ts-checker-webpack-plugin";
import {BABEL_CONFIG_PATH, TS_CONFIG_PATH} from "../paths";
export type FactoryArgument = {
    env: string;
}

export const commonFactory = (arg: FactoryArgument) => {
    process.env.NODE_ENV = arg.env;

    const commonConfig: webpack.Configuration = {
        resolve: {
            extensions: ['.ts', '.tsx', '.js', '.json']
        },
        module: {
            rules: [{
                test: /\.(ts|js)x?$/,
                exclude: /node_modules/,
                loader: 'babel-loader',
                options: {
                    configFile: BABEL_CONFIG_PATH
                }
            }],
        },
        plugins: [
            new webpack.EnvironmentPlugin({
                'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
            }),
            new ForkTsCheckerWebpackPlugin({
                typescript: {
                    configFile: TS_CONFIG_PATH
                }
            }),
        ],
        performance: {
            hints: false
        }
    }

    return commonConfig;
}
