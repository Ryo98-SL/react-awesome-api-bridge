import webpack from "webpack";
import path from "path";
import ForkTsCheckerWebpackPlugin from "fork-ts-checker-webpack-plugin";
import {merge} from "webpack-merge";
import {commonFactory, FactoryArgument} from "./webpack.common.config";
import HtmlWebpackPlugin from "html-webpack-plugin";
import "webpack-dev-server"
import {BABEL_CONFIG_PATH, ROOT_PATH} from "../paths";


const serveFactory = (arg: FactoryArgument) => {
    const commonConfig = commonFactory(arg);
    return merge(
        commonConfig,
        {
            mode: arg.env === 'production' ? arg.env : 'development',
            entry: path.join(ROOT_PATH, './web-server-dev/index.tsx'),
            resolve:{
              extensions: ['.tsx', '.ts', '.js', '.cjs', '.mjs']
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
                new HtmlWebpackPlugin({ inject: true, template: path.join(ROOT_PATH, './web-server-dev/index.html') }),
            ],
            devServer: {
                open: true,
            },
        },
    )
};

export default serveFactory
