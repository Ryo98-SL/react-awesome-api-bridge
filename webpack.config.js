const path = require('path');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const APP_PATH = path.resolve(__dirname, 'src');
const {merge} = require('webpack-merge');

module.exports = (env) => {
    const isDev = env.mode === 'development';

    console.log("=>(webpack.config.js:9) isDev", isDev);

    /**
     *
     * @type {import('webpack').Configuartion}
     */
    const commonConfig = {
        output: {
            clean: true,
            path: path.resolve(__dirname, 'dist'),
            filename: 'bridge.js',
            library:{
                name: 'ReactAwesomeAPIBridge',
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

/**
 *
 * @type {import('webpack').Configuartion}
 */
const devConfig = {
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

/**
 *
 * @type {import('webpack').Configuartion}
 */
const proConfig = {
    mode: 'production',
    entry: path.join(APP_PATH, './bridge.tsx'),
    externals: {
        react: 'umd react',
    }
}