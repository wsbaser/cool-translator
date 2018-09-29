const path = require('path');

const MiniCssExtractPlugin = require("mini-css-extract-plugin");

let EXTENSION_ID = process.env.NODE_ENV=='development' ? 'ppgnibapoaghkefnghplaanppljbhboo':'cifbpdjhjkopeekabdgfjgmcbcgloioi';

module.exports = {
  context: path.resolve(__dirname, "./src"),
  entry: {
    background: "./js/background",
    content: "./js/content",
    popupde: "./js/popup/de",    
    popuplogin: "./js/popup/login"
  },

  output: {
    path: __dirname + '/public/assets',
    publicPath: 'chrome-extension://' + EXTENSION_ID + '/assets/',
    filename: "[name].js",
    library: "[name]"
  },
  
  resolve: {
    modules: [path.resolve(__dirname, './src/js/utils'),path.resolve(__dirname, './src/js'),path.resolve(__dirname, './src/styles'),'node_modules'],
    extensions: ['.js', '.sass']
  },

  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      },
      {
         test: /\.sass$/,
         use: [
           process.env.NODE_ENV !== 'production' ? 'style-loader' : MiniCssExtractPlugin.loader,
           'css-loader',
           "sass-loader"
         ]
      },
      {
        test:   /\.(png|gif|jpg|svg|ttf|eot|woff|woff2)$/,
        loader: 'file-loader?name=[path][name].[ext]'
      }
    ]
  },

  plugins: [
    new MiniCssExtractPlugin({
      // Options similar to the same options in webpackOptions.output
      // both options are optional
      filename: "[name].css",
      chunkFilename: "[id].css"
    })
  ]

};