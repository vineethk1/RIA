const path = require('path');

module.exports = {
  entry: './src/index.js',
  output: {
  path: path.resolve(__dirname, 'dist'),
  filename: 'chatbot.js',
  library: 'ChatbotWidget',       
  libraryTarget: 'umd',           
  globalObject: 'this',           
  clean: true
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: 'babel-loader'
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: 'static/media/[name].[hash:8].[ext]',
              outputPath: 'public', 
            },
          },
        ],
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx']
  },
  devServer: {
    static: path.join(__dirname, 'public'),
    port: 3000,
    open: true
  },
};