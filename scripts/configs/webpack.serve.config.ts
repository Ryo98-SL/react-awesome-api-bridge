import webpack from "webpack";
import path from "path";
import ForkTsCheckerWebpackPlugin from "fork-ts-checker-webpack-plugin";
import {merge} from "webpack-merge";
import {commonFactory, FactoryArgument} from "./webpack.common.config";
import HtmlWebpackPlugin from "html-webpack-plugin";
import "webpack-dev-server"
import { ROOT_PATH} from "../paths";


const serveFactory = (arg: FactoryArgument) => {
    const commonConfig = commonFactory(arg);
    return merge(
        commonConfig,
        {
            mode: arg.env === 'production' ? arg.env : 'development',
            entry: path.join(ROOT_PATH, './web-server-dev/index.tsx'),
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
