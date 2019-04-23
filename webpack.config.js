const path = require('path');

module.exports = {
  entry: {
    app: './src/app.js',
    background: './src/extension-dispatch.js'
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader'
        ]
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: [/node_modules/],
        query: {
          presets: ['es2017']
        }
      }
    ]
  },
  output: {
    filename: '[name]-bundle.js',
    path: path.join(__dirname, './')
  },
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development'  // eslint-disable-line
};
