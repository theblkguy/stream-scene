<<<<<<< HEAD
import path from 'path';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import webpack from 'webpack';
import Dotenv from 'dotenv-webpack';
=======
<<<<<<< HEAD
=======
import path from 'path';
import { fileURLToPath } from 'url';
<<<<<<< HEAD
=======
import HtmlWebpackPlugin from 'html-webpack-plugin'; 
>>>>>>> 57eb40fd (Next step in rebase)
>>>>>>> 4ab83d6d (Fix/ Changed build script to reflect changes to the webpack)

<<<<<<< HEAD
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

<<<<<<< HEAD
export default (env, argv) => {
  const isProduction = argv.mode === 'production';

  return {
    entry: './client/index.tsx',
    mode: argv.mode || 'development',
    target: 'web',
    output: {
      path: path.resolve('./public'),
      filename: 'bundle.js',
      publicPath: '/',
      clean: true,
    },
    optimization: {
      minimize: isProduction,
      splitChunks: false, // Disable code splitting to reduce memory usage
    },
    performance: {
      hints: false, // Disable performance warnings
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx'],
      fallback: {
        "process": false,
        "buffer": false,
      }
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: {
            loader: 'ts-loader',
            options: {
              transpileOnly: true, // Faster compilation, skip type checking
            }
          },
          exclude: /node_modules/,
        },
        {
          test: /\.css$/i,
          use: ['style-loader', 'css-loader', 'postcss-loader'],
        },
      ],
    },
    ...(isProduction ? {} : {
      devServer: {
        port: 8000,
        host: '0.0.0.0',
        hot: true,
        historyApiFallback: true,
        allowedHosts: 'all',
      },
    }),
    plugins: [
      new HtmlWebpackPlugin({
        template: './client/index.html',
      }),
      new webpack.ProvidePlugin({
        process: 'process/browser.js',
        Buffer: ['buffer', 'Buffer'],
      }),
      new Dotenv({
        systemvars: true, // Load system environment variables
        safe: false, // Don't require a .env.example file
        allowEmptyValues: true,
        defaults: false,
      }),
    ],
    devtool: isProduction ? false : 'eval-cheap-module-source-map',
  };
};
=======
=======
>>>>>>> a3169de1 (fixed server issue, made task form on front end)
export default {
  entry: './client/index.tsx',
  output: {
    path: path.resolve('./dist'),
    filename: 'bundle.js',
    publicPath: '/',
    clean: true,
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
  },
  module: {
    rules: [
      {
<<<<<<< HEAD
        test: /\.(ts|tsx)$/,
=======
        test: /\.tsx?$/,
>>>>>>> a3169de1 (fixed server issue, made task form on front end)
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader', 'postcss-loader'],
      },
    ],
  },
<<<<<<< HEAD
<<<<<<< HEAD
=======
  plugins: [ 
=======
  devServer: {
    port: 3001,
    static: {
      directory: path.join(process.cwd(), 'dist'),
    },
    historyApiFallback: true, 
    proxy: {
      '/api': 'http://localhost:8000',
      '/auth': 'http://localhost:8000',
    },
  },
  plugins: [
>>>>>>> a3169de1 (fixed server issue, made task form on front end)
    new HtmlWebpackPlugin({
      template: './client/index.html',
    }),
  ],
<<<<<<< HEAD
>>>>>>> 57eb40fd (Next step in rebase)
  devtool: 'source-map',
  devServer: {
    static: {
      directory: path.resolve(__dirname, 'dist/public'),
    },
    port: 8000,
    hot: true,
    open: true,
    historyApiFallback: true,
  },
=======
  mode: 'development',
>>>>>>> a3169de1 (fixed server issue, made task form on front end)
};
>>>>>>> 92762c45 (Fix/ fixing rebase conflicts)
>>>>>>> 4ab83d6d (Fix/ Changed build script to reflect changes to the webpack)
