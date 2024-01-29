const path = require('path');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const APP_PATH = path.resolve(__dirname, 'src');

module.exports = (env) => {
    console.log("=>(webpack.config.js:9) env", env);
    const isDev = env.mode === 'development';
    return {
        mode: isDev ? 'development' : 'production',
        entry: isDev ? APP_PATH : path.join(APP_PATH, './bridge.tsx'),
        output: {
            path: path.resolve(__dirname, 'dist'),
            filename: 'app.bundle.js'
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
        performance: {
            hints: false
        },
        plugins: [
            new HtmlWebpackPlugin({ inject: true, template: path.join(APP_PATH, 'index.html') }),
            new ForkTsCheckerWebpackPlugin(),
        ],
        devtool: 'eval-source-map',
        devServer: {
            open: true,
        }
    }
};