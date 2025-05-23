import path, { join } from 'path';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  mode: 'development',
  devServer: {
    static: {
      directory: join(__dirname, 'public'),
    },
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Resource-Policy': 'cross-origin' // Add this for resource loading
    },
    compress: true,
    port: 3000,
    hot: true,
    historyApiFallback: true,
    https: process.env.HTTPS === 'true' ? {
      key: readFileSync(join(__dirname, 'certs/localhost-key.pem')),
      cert: readFileSync(join(__dirname, 'certs/localhost.pem')),
    } : false,
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react']
          }
        }
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader', 'postcss-loader'],
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx']
  }
};

/*
Instructions to generate self-signed certificates for local development:

1. Create a directory named 'certs' in your project root.

2. Generate a private key and certificate using OpenSSL:

   openssl req -x509 -newkey rsa:4096 -nodes -out certs/server.crt -keyout certs/server.key -days 365

3. When prompted, enter appropriate values or leave blank.

4. Restart your webpack dev server.

5. Access your app at https://localhost:3000

Note: Your browser may warn about the self-signed certificate. You can add an exception to proceed.
*/
