const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

// ✅ Environment detection
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = !isProduction;

module.exports = {
  mode: isProduction ? 'production' : 'development',
  cache: false, // ✅ Disable webpack cache to ensure fresh builds
  devtool: false, // ✅ Disabled source maps to prevent runtime errors
  entry: './src/renderer/index.tsx',
  target: 'web', // ✅ Changed from 'electron-renderer' - needed for contextIsolation: true
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'renderer.js', // ✅ Fixed filename (no hash for Electron)
    clean: true, // ✅ Clean dist folder before build
    publicPath: isDevelopment ? '/' : './', // ✅ Dev server needs '/', production needs './'
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    modules: [path.resolve(__dirname, 'node_modules'), 'node_modules'],
    // No fallbacks needed - PDF processing now in Main Process via IPC
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'ts-loader',
          options: {
            // ✅ Use tsconfig.json settings (now with strict mode)
            transpileOnly: isDevelopment, // Type-check in production
            configFile: 'tsconfig.json',
          },
        },
      },
      {
        // ✅ Handle JSX files from genesis-engine
        test: /\.jsx$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-react'],
          },
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader', 'postcss-loader'],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/renderer/index.html',
      publicPath: './', // ✅ Force relative paths for Electron
      minify: isProduction
        ? {
            removeComments: true,
            collapseWhitespace: true,
            removeRedundantAttributes: true,
            useShortDoctype: true,
            removeEmptyAttributes: true,
            removeStyleLinkTypeAttributes: true,
            keepClosingSlash: true,
            minifyJS: true,
            minifyCSS: true,
            minifyURLs: true,
          }
        : false,
    }),
  ],
  optimization: {
    minimize: isProduction,
    // ✅ DISABLED splitChunks for Electron compatibility
    // Single bundle is more reliable in ASAR packaging
    splitChunks: false,
  },
  performance: {
    hints: isProduction ? 'warning' : false,
    maxEntrypointSize: 25 * 1024 * 1024, // 25MB (large due to TensorFlow)
    maxAssetSize: 25 * 1024 * 1024, // 25MB
  },
  devServer: {
    port: 8080,
    hot: true,
    static: {
      directory: path.join(__dirname, 'public'),
    },
  },
};