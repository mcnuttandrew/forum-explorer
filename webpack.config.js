// const isProd = process.env.NODE_ENV === 'production'; // eslint-disable-line
// const webpack = require('webpack');

// const plugins = [
//   new webpack.DefinePlugin({
//     'process.env': {
//       NODE_ENV: JSON.stringify('production')
//     }
//   }),
//   new webpack.optimize.UglifyJsPlugin()
// ];

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
  // plugins: isProd ? plugins : [],
  // devtool: 'source-maps',
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development'  // eslint-disable-line
};
