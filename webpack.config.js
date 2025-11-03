const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    publicPath: '/', // ✅ обязательно именно '/' — иначе dev-server иногда ломает пути
    clean: true,
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: 'public/assets', to: 'assets' },
        { from: 'public/*.css', to: '[name][ext]' },
      ],
    }),
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'public'), // ✅ serve public, не dist
    },
    port: 3000,
    open: true,
    hot: true, // ✅ HMR
    watchFiles: ['src/**/*', 'public/**/*'], // ✅ следит за всеми файлами
    historyApiFallback: true, // ✅ чтобы не было 404 при SPA reload
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              '@babel/preset-env',
              '@babel/preset-react',
            ],
          },
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|jpe?g|gif|svg|hdr)$/i,
        type: 'asset/resource',
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.jsx'],
  },
};
