import NodeCache from 'node-cache';
import logger from '../utils/logger';

// Cache para mensagens com TTL de 5 minutos
export const messageCache = new NodeCache({
  stdTTL: 300, // 5 minutos
  maxKeys: 10000,
  checkperiod: 60,
  useClones: false,
  deleteOnExpire: true
});

// Cache para contatos com TTL de 10 minutos
export const contactCache = new NodeCache({
  stdTTL: 600, // 10 minutos
  maxKeys: 5000,
  checkperiod: 120,
  useClones: false,
  deleteOnExpire: true
});

// Cache para tickets com TTL de 2 minutos
export const ticketCache = new NodeCache({
  stdTTL: 120, // 2 minutos
  maxKeys: 2000,
  checkperiod: 30,
  useClones: false,
  deleteOnExpire: true
});

// Cache para configurações com TTL de 30 minutos
export const configCache = new NodeCache({
  stdTTL: 1800, // 30 minutos
  maxKeys: 1000,
  checkperiod: 300,
  useClones: false,
  deleteOnExpire: true
});

// Cache para sessões WhatsApp com TTL de 1 hora
export const sessionCache = new NodeCache({
  stdTTL: 3600, // 1 hora
  maxKeys: 10000, // Aumentado de 100 para 10000
  checkperiod: 600,
  useClones: false,
  deleteOnExpire: true
});

// Função para obter estatísticas de todos os caches
export const getCacheStats = () => {
  return {
    messageCache: {
      keys: messageCache.keys().length,
      hits: messageCache.getStats().hits,
      misses: messageCache.getStats().misses,
      keyspace: messageCache.keys().length
    },
    contactCache: {
      keys: contactCache.keys().length,
      hits: contactCache.getStats().hits,
      misses: contactCache.getStats().misses,
      keyspace: contactCache.keys().length
    },
    ticketCache: {
      keys: ticketCache.keys().length,
      hits: ticketCache.getStats().hits,
      misses: ticketCache.getStats().misses,
      keyspace: ticketCache.keys().length
    },
    configCache: {
      keys: configCache.keys().length,
      hits: configCache.getStats().hits,
      misses: configCache.getStats().misses,
      keyspace: configCache.keys().length
    },
    sessionCache: {
      keys: sessionCache.keys().length,
      hits: sessionCache.getStats().hits,
      misses: sessionCache.getStats().misses,
      keyspace: sessionCache.keys().length
    }
  };
};

// Função para limpar todos os caches
export const clearAllCaches = () => {
  messageCache.flushAll();
  contactCache.flushAll();
  ticketCache.flushAll();
  configCache.flushAll();
  sessionCache.flushAll();
  logger.info('Todos os caches foram limpos');
};

// Função para limpar cache por padrão
export const clearCacheByPattern = (pattern: string) => {
  const caches = [messageCache, contactCache, ticketCache, configCache, sessionCache];
  
  caches.forEach(cache => {
    const keys = cache.keys();
    const matchingKeys = keys.filter(key => key.includes(pattern));
    matchingKeys.forEach(key => cache.del(key));
  });
  
  logger.info(`Cache limpo para padrão: ${pattern}`);
};

// Função para deletar por padrão (compatibilidade com código existente)
export const delFromPattern = async (pattern: string) => {
  clearCacheByPattern(pattern);
};

// Função para set (compatibilidade com código existente)
export const set = async (key: string, value: any, ttl?: number) => {
  // Usar sessionCache como cache principal para compatibilidade
  sessionCache.set(key, value, ttl);
};

// Função para get (compatibilidade com código existente)
export const get = async (key: string) => {
  return sessionCache.get(key);
};

// Função para del (compatibilidade com código existente)
export const del = async (key: string) => {
  sessionCache.del(key);
};

// Middleware para monitorar performance do cache
export const cacheMiddleware = (req: any, res: any, next: any) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (duration > 1000) { // Log requests que demoram mais de 1 segundo
      logger.warn(`Request lenta: ${req.method} ${req.path} - ${duration}ms`);
    }
  });
  
  next();
};

// Função para pré-carregar dados frequentes
export const preloadFrequentData = async (companyId: number) => {
  try {
    // Aqui você pode adicionar lógica para pré-carregar dados que são acessados frequentemente
    // Por exemplo, configurações da empresa, filas, etc.
    
    logger.info(`Dados pré-carregados para empresa ${companyId}`);
  } catch (error) {
    logger.error(`Erro ao pré-carregar dados para empresa ${companyId}: ${error}`);
  }
};

// Função para otimizar cache baseado no uso
export const optimizeCache = () => {
  const stats = getCacheStats();
  
  // Ajustar TTL baseado na taxa de hit
  Object.entries(stats).forEach(([cacheName, cacheStats]) => {
    const hitRate = cacheStats.hits / (cacheStats.hits + cacheStats.misses);
    
    if (hitRate < 0.5) {
      logger.warn(`Cache ${cacheName} com baixa taxa de hit: ${(hitRate * 100).toFixed(2)}%`);
    }
  });
};

// Executar otimização a cada 10 minutos
setInterval(optimizeCache, 600000);

export default {
  messageCache,
  contactCache,
  ticketCache,
  configCache,
  sessionCache,
  getCacheStats,
  clearAllCaches,
  clearCacheByPattern,
  delFromPattern,
  set,
  get,
  del,
  cacheMiddleware,
  preloadFrequentData,
  optimizeCache
};