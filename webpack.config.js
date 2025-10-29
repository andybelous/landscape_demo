const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    clean: true, // очищает dist перед билдом
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html', // шаблон из public/
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: 'public/assets', to: 'assets' }, // копируем только assets
        { from: 'public/*.css', to: '[name][ext]' }, // копируем все css из public корня
      ],
    }),
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'), // отдаём сборку
    },
    port: 3000,
    open: true,
    hot: true, // ⚡ чтобы React не перезагружался полностью при изменениях
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/, // ⚡ поддержка .jsx тоже
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              '@babel/preset-env',
              '@babel/preset-react', // ⚡ нужно для JSX
            ],
          },
        },
      },
      {
        test: /\.css$/, // ⚡ если хочешь импортировать CSS напрямую
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|jpe?g|gif|svg)$/i, // ⚡ для текстур и изображений
        type: 'asset/resource',
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.jsx'], // ⚡ чтобы можно было импортировать без расширения
  },
};
