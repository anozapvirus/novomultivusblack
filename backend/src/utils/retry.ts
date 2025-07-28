import logger from './logger';

interface RetryOptions {
  maxAttempts?: number;
  delay?: number;
  backoff?: 'fixed' | 'exponential';
  factor?: number;
  onRetry?: (attempt: number, error: Error) => void;
  shouldRetry?: (error: Error) => boolean;
}

class RetryManager {
  private static instance: RetryManager;
  private retryStats = new Map<string, { attempts: number; failures: number; lastFailure: Date }>();

  static getInstance(): RetryManager {
    if (!RetryManager.instance) {
      RetryManager.instance = new RetryManager();
    }
    return RetryManager.instance;
  }

  async execute<T>(
    operation: () => Promise<T>,
    operationName: string,
    options: RetryOptions = {}
  ): Promise<T> {
    const {
      maxAttempts = 3,
      delay = 1000,
      backoff = 'exponential',
      factor = 2,
      onRetry,
      shouldRetry = () => true
    } = options;

    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = await operation();
        
        // Sucesso - atualizar estatísticas
        this.updateStats(operationName, attempt, true);
        
        return result;
      } catch (error) {
        lastError = error as Error;
        
        // Verificar se deve tentar novamente
        if (!shouldRetry(lastError)) {
          this.updateStats(operationName, attempt, false);
          throw lastError;
        }
        
        // Se não é a última tentativa, aguardar e tentar novamente
        if (attempt < maxAttempts) {
          const waitTime = backoff === 'exponential' 
            ? delay * Math.pow(factor, attempt - 1)
            : delay;
          
          logger.warn(`Tentativa ${attempt} falhou para ${operationName}, tentando novamente em ${waitTime}ms`, {
            error: lastError.message,
            operation: operationName,
            attempt
          });
          
          if (onRetry) {
            onRetry(attempt, lastError);
          }
          
          await this.sleep(waitTime);
        }
      }
    }
    
    // Todas as tentativas falharam
    this.updateStats(operationName, maxAttempts, false);
    
    logger.error(`Todas as ${maxAttempts} tentativas falharam para ${operationName}`, {
      error: lastError!.message,
      operation: operationName,
      attempts: maxAttempts
    });
    
    throw lastError!;
  }

  private updateStats(operationName: string, attempts: number, success: boolean) {
    const stats = this.retryStats.get(operationName) || {
      attempts: 0,
      failures: 0,
      lastFailure: new Date()
    };
    
    stats.attempts += attempts;
    if (!success) {
      stats.failures += 1;
      stats.lastFailure = new Date();
    }
    
    this.retryStats.set(operationName, stats);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getStats(operationName?: string) {
    if (operationName) {
      return this.retryStats.get(operationName);
    }
    
    return Object.fromEntries(this.retryStats);
  }

  getFailureRate(operationName: string): number {
    const stats = this.retryStats.get(operationName);
    if (!stats || stats.attempts === 0) {
      return 0;
    }
    
    return stats.failures / stats.attempts;
  }

  clearStats(operationName?: string) {
    if (operationName) {
      this.retryStats.delete(operationName);
    } else {
      this.retryStats.clear();
    }
  }
}

// Funções utilitárias para casos comuns
export const retryWithExponentialBackoff = <T>(
  operation: () => Promise<T>,
  operationName: string,
  maxAttempts: number = 3
): Promise<T> => {
  return RetryManager.getInstance().execute(operation, operationName, {
    maxAttempts,
    delay: 1000,
    backoff: 'exponential',
    factor: 2
  });
};

export const retryWithFixedDelay = <T>(
  operation: () => Promise<T>,
  operationName: string,
  maxAttempts: number = 3,
  delay: number = 1000
): Promise<T> => {
  return RetryManager.getInstance().execute(operation, operationName, {
    maxAttempts,
    delay,
    backoff: 'fixed'
  });
};

// Retry específico para operações de banco de dados
export const retryDatabaseOperation = <T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> => {
  return RetryManager.getInstance().execute(operation, operationName, {
    maxAttempts: 3,
    delay: 500,
    backoff: 'exponential',
    shouldRetry: (error) => {
      // Retry apenas para erros de conexão ou deadlock
      const errorMessage = error.message.toLowerCase();
      return errorMessage.includes('connection') ||
             errorMessage.includes('timeout') ||
             errorMessage.includes('deadlock') ||
             errorMessage.includes('lock');
    }
  });
};

// Retry específico para operações de API externa
export const retryApiOperation = <T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> => {
  return RetryManager.getInstance().execute(operation, operationName, {
    maxAttempts: 5,
    delay: 2000,
    backoff: 'exponential',
    shouldRetry: (error: any) => {
      // Retry para erros de rede ou 5xx
      if (error.response) {
        const status = error.response.status;
        return status >= 500 || status === 429; // Server error ou rate limit
      }
      
      const errorMessage = error.message.toLowerCase();
      return errorMessage.includes('network') ||
             errorMessage.includes('timeout') ||
             errorMessage.includes('econnreset') ||
             errorMessage.includes('enotfound');
    }
  });
};

// Retry específico para operações de WhatsApp
export const retryWhatsAppOperation = <T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> => {
  return RetryManager.getInstance().execute(operation, operationName, {
    maxAttempts: 3,
    delay: 1000,
    backoff: 'exponential',
    shouldRetry: (error) => {
      const errorMessage = error.message.toLowerCase();
      return errorMessage.includes('connection') ||
             errorMessage.includes('timeout') ||
             errorMessage.includes('disconnected') ||
             errorMessage.includes('session');
    }
  });
};

// Decorator para aplicar retry automaticamente
export const withRetry = (options: RetryOptions = {}) => {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const operationName = `${target.constructor.name}.${propertyName}`;
      
      return RetryManager.getInstance().execute(
        () => method.apply(this, args),
        operationName,
        options
      );
    };
  };
};

export default RetryManager; 