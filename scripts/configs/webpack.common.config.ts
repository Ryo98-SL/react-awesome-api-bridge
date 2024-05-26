import path from "path";
import webpack from "webpack";
import ForkTsCheckerWebpackPlugin from "fork-ts-checker-webpack-plugin";
import {getWorkspaceRoot} from "../utils";
export type FactoryArgument = {
    env: string;
}
export const SRC_PATH = path.resolve(getWorkspaceRoot(), 'src');

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
                    configFile: path.join(getWorkspaceRoot(), 'babel.config.js')
                }
            }],
        },
        plugins: [
            new webpack.EnvironmentPlugin({
                'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
            }),
            new ForkTsCheckerWebpackPlugin({
                typescript: {
                    configFile: path.join(getWorkspaceRoot(), 'tsconfig.json')
                }
            }),
        ],
        performance: {
            hints: false
        }
    }

    return commonConfig;
}
