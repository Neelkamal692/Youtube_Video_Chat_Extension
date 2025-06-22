const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');

module.exports = {
  entry: {
    popup: './popup.js',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'popup.html', to: 'popup.html' },
        { from: 'manifest.json', to: 'manifest.json' },
        { from: 'ChatTube Icon Logo.png', to: 'ChatTube Icon Logo.png' },
      ],
    }),
    // This makes the 'Buffer' class available to other modules
    new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
    }),
    // This plugin will strip the 'node:' prefix from imports, which is
    // the cause of the final build error.
    new webpack.NormalModuleReplacementPlugin(
      /^node:/,
      (resource) => {
        resource.request = resource.request.replace(/^node:/, "");
      }
    )
  ],
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  resolve: {
    fallback: {
      "stream": require.resolve("stream-browserify"),
      "https": require.resolve("https-browserify"),
      "http": require.resolve("stream-http"),
      "url": require.resolve("url/"),
      "crypto": require.resolve("crypto-browserify"),
      "os": require.resolve("os-browserify/browser"),
      "buffer": require.resolve("buffer/"),
      "zlib": require.resolve("browserify-zlib"),
      "vm": require.resolve("vm-browserify"),
      "fs": false, // We don't need file system access in the browser
      "path": require.resolve("path-browserify"),
      "net": false, // We don't need a polyfill for 'net' in the browser
      "tls": false,  // We don't need a polyfill for 'tls' in the browser
      "assert": require.resolve("assert/"),
      "util": require.resolve("util/")
    }
  },
}; 