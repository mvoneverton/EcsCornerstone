import { createClient } from 'redis';

const client = createClient({
  url: process.env.REDIS_URL ?? 'redis://localhost:6379',
});

client.on('error', (err) => console.error('[redis] client error:', err));
client.on('connect', () => console.log('[redis] connected'));

// Connect eagerly — the process exits if this fails
client.connect().catch((err) => {
  console.error('[redis] failed to connect:', err);
  process.exit(1);
});

export default client;
