import logger from './logger';
import { getCacheStats } from '../libs/cache';

interface PerformanceMetric {
  operation: string;
  duration: number;
  timestamp: Date;
  metadata?: any;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics = 1000;
  private slowThreshold = 1000; // 1 segundo

  // Decorator para medir performance de funções
  static measure(operationName: string) {
    return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
      const method = descriptor.value;

      descriptor.value = async function (...args: any[]) {
        const start = Date.now();
        try {
          const result = await method.apply(this, args);
          const duration = Date.now() - start;
          
          PerformanceMonitor.getInstance().addMetric({
            operation: `${operationName}.${propertyName}`,
            duration,
            timestamp: new Date(),
            metadata: { success: true }
          });
          
          return result;
        } catch (error) {
          const duration = Date.now() - start;
          
          PerformanceMonitor.getInstance().addMetric({
            operation: `${operationName}.${propertyName}`,
            duration,
            timestamp: new Date(),
            metadata: { success: false, error: error.message }
          });
          
          throw error;
        }
      };
    };
  }

  // Função para medir performance de operações específicas
  static async measureOperation<T>(
    operationName: string,
    operation: () => Promise<T>,
    metadata?: any
  ): Promise<T> {
    const start = Date.now();
    try {
      const result = await operation();
      const duration = Date.now() - start;
      
      PerformanceMonitor.getInstance().addMetric({
        operation: operationName,
        duration,
        timestamp: new Date(),
        metadata: { ...metadata, success: true }
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      
      PerformanceMonitor.getInstance().addMetric({
        operation: operationName,
        duration,
        timestamp: new Date(),
        metadata: { ...metadata, success: false, error: error.message }
      });
      
      throw error;
    }
  }

  private static instance: PerformanceMonitor;

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  addMetric(metric: PerformanceMetric) {
    this.metrics.push(metric);
    
    // Manter apenas as últimas métricas
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
    
    // Log de operações lentas
    if (metric.duration > this.slowThreshold) {
      logger.warn(`Operação lenta detectada: ${metric.operation} - ${metric.duration}ms`, metric.metadata);
    }
  }

  getMetrics(operation?: string, timeRange?: { start: Date; end: Date }) {
    let filteredMetrics = this.metrics;
    
    if (operation) {
      filteredMetrics = filteredMetrics.filter(m => m.operation.includes(operation));
    }
    
    if (timeRange) {
      filteredMetrics = filteredMetrics.filter(m => 
        m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
      );
    }
    
    return filteredMetrics;
  }

  getStats(operation?: string) {
    const metrics = this.getMetrics(operation);
    
    if (metrics.length === 0) {
      return {
        count: 0,
        avgDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        slowOperations: 0
      };
    }
    
    const durations = metrics.map(m => m.duration);
    const slowOperations = metrics.filter(m => m.duration > this.slowThreshold).length;
    
    return {
      count: metrics.length,
      avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      slowOperations,
      successRate: metrics.filter(m => m.metadata?.success !== false).length / metrics.length
    };
  }

  getTopSlowOperations(limit: number = 10) {
    const operationStats = new Map<string, { total: number; count: number; max: number }>();
    
    this.metrics.forEach(metric => {
      const stats = operationStats.get(metric.operation) || { total: 0, count: 0, max: 0 };
      stats.total += metric.duration;
      stats.count += 1;
      stats.max = Math.max(stats.max, metric.duration);
      operationStats.set(metric.operation, stats);
    });
    
    return Array.from(operationStats.entries())
      .map(([operation, stats]) => ({
        operation,
        avgDuration: stats.total / stats.count,
        maxDuration: stats.max,
        count: stats.count
      }))
      .sort((a, b) => b.avgDuration - a.avgDuration)
      .slice(0, limit);
  }

  generateReport() {
    const now = Date.now();
    const lastHour = new Date(now - 60 * 60 * 1000);
    const lastDay = new Date(now - 24 * 60 * 60 * 1000);
    
    const hourlyStats = this.getStats();
    const dailyStats = this.getStats();
    const topSlow = this.getTopSlowOperations(5);
    const cacheStats = getCacheStats();
    
    const report = {
      timestamp: new Date(),
      overall: hourlyStats,
      topSlowOperations: topSlow,
      cacheStats,
      recommendations: this.generateRecommendations(hourlyStats, topSlow, cacheStats)
    };
    
    logger.info('Relatório de Performance Gerado', report);
    return report;
  }

  private generateRecommendations(stats: any, topSlow: any[], cacheStats: any) {
    const recommendations = [];
    
    if (stats.avgDuration > 500) {
      recommendations.push('Considerar otimização de queries de banco de dados');
    }
    
    if (stats.slowOperations > stats.count * 0.1) {
      recommendations.push('Muitas operações lentas detectadas - revisar lógica de negócio');
    }
    
    if (topSlow.length > 0 && topSlow[0].avgDuration > 2000) {
      recommendations.push(`Operação mais lenta: ${topSlow[0].operation} - considerar cache ou otimização`);
    }
    
    Object.entries(cacheStats).forEach(([cacheName, cacheData]: [string, any]) => {
      const hitRate = cacheData.hits / (cacheData.hits + cacheData.misses);
      if (hitRate < 0.5) {
        recommendations.push(`Cache ${cacheName} com baixa taxa de hit (${(hitRate * 100).toFixed(1)}%) - revisar estratégia de cache`);
      }
    });
    
    return recommendations;
  }

  clear() {
    this.metrics = [];
  }
}

// Middleware para monitorar performance de requests HTTP
export const performanceMiddleware = (req: any, res: any, next: any) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    PerformanceMonitor.getInstance().addMetric({
      operation: `http.${req.method}.${req.path}`,
      duration,
      timestamp: new Date(),
      metadata: {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        userAgent: req.get('User-Agent')
      }
    });
  });
  
  next();
};

// Gerar relatório a cada hora
setInterval(() => {
  PerformanceMonitor.getInstance().generateReport();
}, 60 * 60 * 1000);

export default PerformanceMonitor; 