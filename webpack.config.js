const path = require('path');

module.exports = {
    mode: 'development',
    entry: './src/index.js',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
    },
    module: {
        rules: [
            {
                test: /\.js$/, // Transpile JS files
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                },
            },
            {
                test: /\.css$/, // Add this rule for CSS files
                use: ['style-loader', 'css-loader'], // Loaders for CSS
            },
        ],
    },
    devServer: {
        static: {
            directory: path.join(__dirname, 'public'), // or wherever your static files are located
        },
        port: 3000,
    },
    resolve: {
        extensions: ['.js', '.jsx'], // Add .jsx if you're using it
    },
};