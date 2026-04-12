import Redis from 'ioredis';

let client;

export async function initRedis() {
  client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    lazyConnect: true,
    maxRetriesPerRequest: 3,
  });
  await client.connect();
  console.log('✅  Redis connected');
}

export function redis() {
  if (!client) throw new Error('Redis not initialised');
  return client;
}
