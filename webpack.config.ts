import path from 'path';
import { fileURLToPath } from 'url';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import type { Configuration as WebpackConfiguration } from 'webpack';
import type { Configuration as WebpackDevServerConfiguration } from 'webpack-dev-server';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Configuration extends WebpackConfiguration {
  devServer?: WebpackDevServerConfiguration;
}

const config: Configuration = {
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  entry: './src/index.tsx',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash].js',
    chunkFilename: '[name].[contenthash].chunk.js',
    publicPath: '/',
    clean: true,
  },
  optimization: {
    splitChunks: {
      chunks: 'all',
      maxInitialRequests: Infinity,
      minSize: 20000,
      cacheGroups: {
        // React core
        reactCore: {
          test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
          name: 'react-core',
          chunks: 'all',
          priority: 50,
        },
        // React Router
        reactRouter: {
          test: /[\\/]node_modules[\\/](react-router|react-router-dom)[\\/]/,
          name: 'react-router',
          chunks: 'all',
          priority: 40,
        },
        // Radix UI - Split by component
        radix: {
          test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
          name(module) {
            const match = module.context.match(/[\\/]node_modules[\\/]@radix-ui[\\/](.*?)([\\/]|$)/);
            return match ? `radix-${match[1]}` : 'radix';
          },
          chunks: 'all',
          priority: 30,
        },
        // Tanstack - Split by functionality
        tanstack: {
          test: /[\\/]node_modules[\\/]@tanstack[\\/]/,
          name(module) {
            const match = module.context.match(/[\\/]node_modules[\\/]@tanstack[\\/](.*?)([\\/]|$)/);
            return match ? `tanstack-${match[1]}` : 'tanstack';
          },
          chunks: 'all',
          priority: 20,
        },
        // API client
        api: {
          test: /[\\/]src[\\/]lib[\\/]api\.ts$/,
          name: 'api-client',
          chunks: 'all',
          priority: 15,
        },
        // UI components
        ui: {
          test: /[\\/]src[\\/]components[\\/]ui[\\/]/,
          name(module) {
            const match = module.context.match(/[\\/]src[\\/]components[\\/]ui[\\/](.*?)\.tsx$/);
            return match ? `ui-${match[1]}` : 'ui';
          },
          chunks: 'all',
          priority: 10,
        },
        // Page components
        pages: {
          test: /[\\/]src[\\/]pages[\\/]/,
          name(module) {
            const match = module.context.match(/[\\/]src[\\/]pages[\\/](.*?)\.tsx$/);
            return match ? `page-${match[1]}` : 'page';
          },
          chunks: 'all',
          priority: 5,
        },
        // Style files
        styles: {
          test: /\.css$/,
          name: 'styles',
          chunks: 'all',
          priority: 8,
        },
        // Utility functions
        utils: {
          test: /[\\/]src[\\/]lib[\\/]utils\.ts$/,
          name: 'utils',
          chunks: 'all',
          priority: 12,
        },
        // Contexts
        contexts: {
          test: /[\\/]src[\\/]contexts[\\/]/,
          name(module) {
            const match = module.context.match(/[\\/]src[\\/]contexts[\\/](.*?)\.tsx$/);
            return match ? `context-${match[1]}` : 'context';
          },
          chunks: 'all',
          priority: 7,
        },
        // Hooks
        hooks: {
          test: /[\\/]src[\\/]hooks[\\/]/,
          name(module) {
            const match = module.context.match(/[\\/]src[\\/]hooks[\\/](.*?)\.ts$/);
            return match ? `hook-${match[1]}` : 'hooks';
          },
          chunks: 'all',
          priority: 6,
        },
        // Other third-party libraries - Split by package name
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          name(module) {
            const match = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/);
            if (!match) return 'vendor';
            const packageName = match[1];
            // Exclude packages that are already handled separately
            if (packageName.startsWith('react') || 
                packageName.startsWith('@radix-ui') || 
                packageName.startsWith('@tanstack')) {
              return false;
            }
            return `vendor-${packageName}`;
          },
          chunks: 'all',
          priority: 1,
        },
      },
    },
    runtimeChunk: 'single',
    moduleIds: 'deterministic',
    minimize: process.env.NODE_ENV === 'production',
    usedExports: true,
    sideEffects: true,
    concatenateModules: true,
    removeEmptyChunks: true,
    mergeDuplicateChunks: true,
    flagIncludedChunks: true,
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'ts-loader',
          options: {
            transpileOnly: true,
          },
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader', 'postcss-loader'],
      },
      {
        test: /\.m?js$/,
        type: 'javascript/auto',
        resolve: {
          fullySpecified: false,
        },
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.mjs'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      // Add aliases for commonly used libraries to help with tree-shaking
      'react': path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
      '@radix-ui/react-dialog': path.resolve(__dirname, 'node_modules/@radix-ui/react-dialog'),
      '@radix-ui/react-dropdown-menu': path.resolve(__dirname, 'node_modules/@radix-ui/react-dropdown-menu'),
      '@tanstack/react-query': path.resolve(__dirname, 'node_modules/@tanstack/react-query'),
      '@tanstack/react-table': path.resolve(__dirname, 'node_modules/@tanstack/react-table'),
      '@tanstack/table-core': path.resolve(__dirname, 'node_modules/@tanstack/table-core'),
      // Add aliases for other large dependencies
      '@remix-run/router': path.resolve(__dirname, 'node_modules/@remix-run/router'),
      'bignumber.js': path.resolve(__dirname, 'node_modules/bignumber.js'),
      // Add alias for UI components
      '@ui': path.resolve(__dirname, 'src/components/ui'),
      // Add alias for page components
      '@pages': path.resolve(__dirname, 'src/pages'),
      // Add alias for context components
      '@contexts': path.resolve(__dirname, 'src/contexts'),
      // Add alias for utility functions
      '@utils': path.resolve(__dirname, 'src/lib/utils'),
      // Add alias for hooks
      '@hooks': path.resolve(__dirname, 'src/hooks'),
      // Add alias for API client
      '@api': path.resolve(__dirname, 'src/lib/api'),
    },
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
      scriptLoading: 'blocking',
      inject: true,
      preload: [
        {
          rel: 'preload',
          as: 'script',
          href: '/react-core.[contenthash].js',
        },
        {
          rel: 'preload',
          as: 'script',
          href: '/react-router.[contenthash].js',
        },
        {
          rel: 'preload',
          as: 'script',
          href: '/api-client.[contenthash].js',
        },
      ],
      prefetch: [
        {
          rel: 'prefetch',
          as: 'script',
          href: '/ui.[contenthash].js',
        },
        {
          rel: 'prefetch',
          as: 'script',
          href: '/page.[contenthash].js',
        },
      ],
    }),
    ...(process.env.ANALYZE ? [new BundleAnalyzerPlugin()] : []),
  ],
  devServer: {
    historyApiFallback: true,
    port: 3000,
    proxy: [{
      context: ['/api'],
      target: 'http://localhost:8182/',
      changeOrigin: true,
    }],
  },
  devtool: process.env.NODE_ENV === 'production' ? 'source-map' : 'eval-source-map',
  performance: {
    hints: process.env.NODE_ENV === 'production' ? 'warning' : false,
    maxEntrypointSize: 512000,
    maxAssetSize: 512000,
  },
};

export default config;