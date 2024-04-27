import path from 'path';
import ForkTsCheckerWebpackPlugin  from 'fork-ts-checker-webpack-plugin'
import HtmlWebpackPlugin from 'html-webpack-plugin';

const APP_PATH = path.resolve(__dirname, 'src');
import {merge} from 'webpack-merge';
import webpack from "webpack";
import "webpack-dev-server"

const factory = (env: Record<string, string>) => {
    const isDev = env.mode === 'development';

    console.log("=>(webpack.config.js:9) isDev", isDev);

    const commonConfig: webpack.Configuration = {
        output: {
            globalObject: 'this',
            clean: true,
            path: path.resolve(__dirname, 'dist'),
            filename: 'bridge.js',
            library:{
                name: 'RAABridge',
                type: 'umd',
                umdNamedDefine: true,
            }

        },
        resolve: {
            extensions: ['.ts', '.tsx', '.js', '.json']
        },
        module: {
            rules: [{
                test: /\.(ts|js)x?$/,
                exclude: /node_modules/,
                loader: 'babel-loader',
            }],
        },
        plugins: [
            new ForkTsCheckerWebpackPlugin(),
        ],
        performance: {
            hints: false
        }
    }


    return merge(commonConfig, isDev ? devConfig : proConfig);
};
export default factory;

const devConfig:webpack.Configuration = {
    mode: 'development',
    entry: APP_PATH,
    plugins: [
        new HtmlWebpackPlugin({ inject: true, template: path.join(APP_PATH, 'index.html') }),
    ],
    devtool: 'eval-source-map',
    devServer: {
        open: true,
    }
};

const proConfig:webpack.Configuration = {
    mode: 'production',
    entry: path.join(APP_PATH, './bridge.tsx'),
    externals: {
        'react': {
            commonjs: 'react',
            commonjs2: 'react',
            amd: 'react',
            root: 'React'
        }
    },
}
