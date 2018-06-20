const isProd = process.env.NODE_ENV === 'production'; // eslint-disable-line
const webpack = require('webpack');

const plugins = [
  new webpack.DefinePlugin({
    'process.env': {
      NODE_ENV: JSON.stringify('production')
    }
  }),
  new webpack.optimize.UglifyJsPlugin()
];

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
    filename: 'bundle.js'
  },
  plugins: isProd ? plugins : [],
  devtool: 'source-maps'
};
