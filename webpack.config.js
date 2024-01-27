const path = require('path');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const APP_PATH = path.resolve(__dirname, 'src');

module.exports = {
    entry: APP_PATH,
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
    devServer: {
        open: true
    }
};