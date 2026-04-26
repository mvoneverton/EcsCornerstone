import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createProxyMiddleware } from 'http-proxy-middleware';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

// Forward /api/* to the API service.
// Set API_URL in the Railway marketing service environment to the
// public URL of the API service (e.g. https://ecscornerstone-api.up.railway.app).
const API_URL = process.env.API_URL || 'http://localhost:3001';

app.use(
  '/api',
  createProxyMiddleware({
    target: API_URL,
    changeOrigin: true,
  })
);

app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Marketing site running on port ${PORT}`);
  console.log(`API proxy → ${API_URL}`);
});
