import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { request as httpReq } from 'node:http';
import { request as httpsReq } from 'node:https';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// Proxy /api/* to the API service.
// Set API_URL in Railway → marketing service → Variables to the public
// URL of your API service (e.g. https://ecscornerstone-api.up.railway.app).
const API_URL = process.env.API_URL || 'http://localhost:3001';

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', (req, res) => {
  const target   = new URL(API_URL);
  const isHttps  = target.protocol === 'https:';
  const port     = target.port ? Number(target.port) : (isHttps ? 443 : 80);
  const reqFn    = isHttps ? httpsReq : httpReq;

  const headers  = { ...req.headers, host: target.host };
  delete headers['content-length']; // let Node recalculate

  const proxyReq = reqFn(
    {
      hostname: target.hostname,
      port,
      path:     `/api${req.url}`,
      method:   req.method,
      headers,
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode ?? 502, proxyRes.headers);
      proxyRes.pipe(res, { end: true });
    },
  );

  proxyReq.on('error', (err) => {
    console.error('[proxy] error', err.message);
    if (!res.headersSent) res.status(502).json({ error: 'API unavailable' });
  });

  req.pipe(proxyReq, { end: true });
});

app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Marketing site running on port ${PORT}`);
  console.log(`API proxy → ${API_URL}`);
});
