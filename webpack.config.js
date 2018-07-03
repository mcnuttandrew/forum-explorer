const path = require('path');

module.exports = {
  entry: {
    app: './src/app.js'
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
    filename: 'bundle.js',
    path: path.join(__dirname, './')
  },
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development'  // eslint-disable-line
};
