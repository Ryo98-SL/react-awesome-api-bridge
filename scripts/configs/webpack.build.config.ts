import path from 'path';

import {merge} from 'webpack-merge';
import webpack from "webpack";
import {SRC_PATH, commonFactory, FactoryArgument} from "./webpack.common.config";
import {getWorkspaceRoot} from "../utils";


const factory = (arg: FactoryArgument) => {
    process.env.NODE_ENV = arg.env;
    const isDev = arg.env === 'development' ;

    const commonConfig = commonFactory(arg);

    const configuration = merge(
        commonConfig,
        {
            entry: path.join(SRC_PATH, './bridge.tsx'),
            output: {
                globalObject: 'this',
                clean: true,
                path: path.join(getWorkspaceRoot(), 'dist'),
                filename: 'bridge.js',
                library: {
                    name: 'RAABridge',
                    type: 'umd',
                    umdNamedDefine: true,
                }
            },
            externals: {
                'react': {
                    commonjs: 'react',
                    commonjs2: 'react',
                    amd: 'react',
                    root: 'React'
                }
            },
        },
        isDev ? devConfig : proConfig,
    );

    return configuration;
};
export default factory;



const devConfig:webpack.Configuration = {
    mode: 'development',
    devtool: 'eval-source-map',
};


const proConfig:webpack.Configuration = {
    mode: 'production'
}
