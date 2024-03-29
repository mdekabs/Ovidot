
import dotenv from 'dotenv';
import { createRedisClient } from '../../redisClient.js'; // Adjust the import path as necessary
import { logger } from '../middleware/logger.js';

// Load environment variables
dotenv.config();

// Default constant for cache expiration time in seconds (20 days).
const CACHE_EXPIRATION_TIME = 20 * 86400;

// Initialize the Redis client at the module level
let redisClient;
(async () => {
 redisClient = await createRedisClient(process.env.ENVIR || "test");
})();

const redisManager = {
 cacheDel: async (hash, key) => {
    if (!redisClient) {
      logger.error('Redis client is not initialized');
      return; // Or throw an error, depending on your error handling strategy
    }
    try {
      await redisClient.hDel(hash, key);
      logger.info(`${key} cache data deleted`);
      return;
    } catch (err) {
      logger.error(err);
      return;
    }
 },

 cacheSet: async (hash, key, value) => {
    if (!redisClient) {
      logger.error('Redis client is not initialized');
      return; // Or throw an error, depending on your error handling strategy
    }
    try {
      await Promise.all([
        redisClient.hSet(hash, key, value),
        redisClient.expire(hash, CACHE_EXPIRATION_TIME)
      ]);
      logger.info(`${key} cache data created`);
      return;
    } catch (err) {
      logger.error(err);
      return;
    }
 },

 cacheGet: async (hash, key) => {
    if (!redisClient) {
      logger.error('Redis client is not initialized');
      return; // Or throw an error, depending on your error handling strategy
    }
    try {
      const data = await redisClient.hGet(hash, key);
      return data;
    } catch(err) {
      logger.error(err);
      return;
    }
 }
};

export default redisManager;
