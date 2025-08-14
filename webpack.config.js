<<<<<<< HEAD
=======
import path from 'path';
import { fileURLToPath } from 'url';
<<<<<<< HEAD
=======
import HtmlWebpackPlugin from 'html-webpack-plugin'; 
>>>>>>> 57eb40fd (Next step in rebase)

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  entry: './client/client/src/index.tsx',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist/public'),
    publicPath: '/',
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader', 'postcss-loader'],
      },
    ],
  },
<<<<<<< HEAD
=======
  plugins: [ 
    new HtmlWebpackPlugin({
      template: './client/client/index.html',
    }),
  ],
>>>>>>> 57eb40fd (Next step in rebase)
  devtool: 'source-map',
  devServer: {
    static: {
      directory: path.resolve(__dirname, 'dist/public'),
    },
    port: 3000,
    hot: true,
    open: true,
    historyApiFallback: true,
  },
};
>>>>>>> 92762c45 (Fix/ fixing rebase conflicts)
