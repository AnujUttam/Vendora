const Redis = require("ioredis");

let redisClient = null;
let isRedisConnected = false;

// Fallback high-speed in-memory store if Redis server isn't active
const memoryStore = new Map();
const memoryExpiry = new Map();

const initRedis = () => {
  const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";
  try {
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      retryStrategy: (times) => {
        if (times > 2) {
          return null; // Stop retrying and stay on memory fallback
        }
        return 1000;
      },
      connectTimeout: 2000,
      lazyConnect: true
    });

    redisClient.connect().then(() => {
      isRedisConnected = true;
      console.log("Redis connected successfully.");
    }).catch((err) => {
      isRedisConnected = false;
      console.warn("Redis not available locally, utilizing in-memory cache fallback:", err.message);
    });

    redisClient.on("error", (err) => {
      isRedisConnected = false;
    });
  } catch (err) {
    isRedisConnected = false;
    console.warn("Redis initialization warning:", err.message);
  }
};

initRedis();

/**
 * Get item from Redis or memory fallback
 */
const getCache = async (key) => {
  if (isRedisConnected && redisClient) {
    try {
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch (err) {
      console.warn("Redis GET error:", err.message);
    }
  }

  // Memory fallback
  const exp = memoryExpiry.get(key);
  if (exp && Date.now() > exp) {
    memoryStore.delete(key);
    memoryExpiry.delete(key);
    return null;
  }
  const item = memoryStore.get(key);
  return item ? JSON.parse(JSON.stringify(item)) : null;
};

/**
 * Set item in Redis or memory fallback with TTL in seconds
 */
const setCache = async (key, value, ttlSeconds = 86400) => {
  if (isRedisConnected && redisClient) {
    try {
      await redisClient.set(key, JSON.stringify(value), "EX", ttlSeconds);
      return;
    } catch (err) {
      console.warn("Redis SET error:", err.message);
    }
  }

  // Memory fallback
  memoryStore.set(key, value);
  memoryExpiry.set(key, Date.now() + ttlSeconds * 1000);
};

/**
 * Delete key from cache
 */
const deleteCache = async (key) => {
  if (isRedisConnected && redisClient) {
    try {
      await redisClient.del(key);
    } catch (err) {
      console.warn("Redis DEL error:", err.message);
    }
  }

  memoryStore.delete(key);
  memoryExpiry.delete(key);
};

// Cart specific helpers
const getCartKey = (userId) => `cart:${userId}`;

const getCachedCart = async (userId) => {
  return await getCache(getCartKey(userId));
};

const setCachedCart = async (userId, cartData) => {
  // Cache for 7 days
  return await setCache(getCartKey(userId), cartData, 7 * 24 * 3600);
};

const clearCachedCart = async (userId) => {
  return await deleteCache(getCartKey(userId));
};

module.exports = {
  getCache,
  setCache,
  deleteCache,
  getCachedCart,
  setCachedCart,
  clearCachedCart,
  getIsRedisConnected: () => isRedisConnected
};
