
import { createClient } from 'redis';
import { readFileSync } from 'fs';
import { logger } from './v1/middleware/logger.js'; // Adjust the import path as necessary

export async function createRedisClient(env) {
 let redisClient;

 if (env !== 'test') {
    redisClient = await createClient({
      username: process.env.USERNAME,
      password: process.env.PASSWORD,
      socket: {
        host: process.env.HOST,
        port: process.env.REDISPORT,
        tls: true,
        key: readFileSync(`./${process.env.PRIKEY}`),
        cert: readFileSync(`./${process.env.CRT}`),
        ca: [readFileSync(`./${process.env.PEMFILE}`)],
        reconnectStrategy: retries => {
          if (retries > 10) return new Error('Max reconnection attempts exceeded');
          return Math.min(retries * 50, 2000);
        },
      },
    })
      .on('error', err => logger.error('Redis Client Error', err))
      .connect();
 } else {
    redisClient = await createClient({
      socket: {
        reconnectStrategy: retries => {
          if (retries > 10) return new Error('Max reconnection attempts exceeded');
          return Math.min(retries * 50, 2000);
        },
      },
    })
      .on('error', err => logger.error('Redis Client Error', err))
      .connect();
 }

 return redisClient;
}
