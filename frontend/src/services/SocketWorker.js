import io from "socket.io-client";

class SocketWorker {
  constructor(companyId, userId) {
    if (!SocketWorker.instance) {
      this.companyId = companyId;
      this.userId = userId;
      this.socket = null;
      this.eventListeners = new Map(); // Usar Map para melhor performance
      this.reconnectAttempts = 0;
      this.maxReconnectAttempts = 10;
      this.reconnectDelay = 1000;
      this.isConnecting = false;
      this.isDisconnected = false;
      
      this.configureSocket();
      SocketWorker.instance = this;
    }

    return SocketWorker.instance;
  }

  configureSocket() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.socket = io(`${process.env.REACT_APP_BACKEND_URL}/${this?.companyId}`, {
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: this.reconnectDelay,
      reconnectionAttempts: this.maxReconnectAttempts,
      timeout: 20000,
      forceNew: false,
      transports: ['websocket', 'polling'],
      query: { userId: this.userId }
    });

    this.socket.on("connect", () => {
      console.log("Conectado ao servidor Socket.IO");
      this.reconnectAttempts = 0;
      this.isConnecting = false;
      this.isDisconnected = false;
    });

    this.socket.on("disconnect", (reason) => {
      console.log("Desconectado do servidor Socket.IO:", reason);
      this.isDisconnected = true;
      
      if (reason === 'io server disconnect') {
        // Reconexão manual necessária
        this.reconnectAfterDelay();
      }
    });

    this.socket.on("connect_error", (error) => {
      console.error("Erro de conexão Socket.IO:", error);
      this.isConnecting = false;
    });

    this.socket.on("reconnect", (attemptNumber) => {
      console.log(`Reconectado após ${attemptNumber} tentativas`);
      this.reconnectAttempts = 0;
    });

    this.socket.on("reconnect_attempt", (attemptNumber) => {
      console.log(`Tentativa de reconexão ${attemptNumber}`);
      this.reconnectAttempts = attemptNumber;
    });

    this.socket.on("reconnect_error", (error) => {
      console.error("Erro na reconexão:", error);
    });

    this.socket.on("reconnect_failed", () => {
      console.error("Falha na reconexão após todas as tentativas");
    });

    // Heartbeat para manter conexão ativa
    setInterval(() => {
      if (this.socket && this.socket.connected) {
        this.socket.emit("ping");
      }
    }, 30000); // Ping a cada 30 segundos
  }

  reconnectAfterDelay() {
    if (this.isConnecting || this.reconnectAttempts >= this.maxReconnectAttempts) {
      return;
    }

    this.isConnecting = true;
    setTimeout(() => {
      if (this.socket && !this.socket.connected) {
        this.socket.connect();
      }
    }, this.reconnectDelay * Math.pow(2, this.reconnectAttempts));
  }

  connect() {
    if (!this.socket || this.socket.disconnected) {
      this.configureSocket();
    }
    return this.socket;
  }

  // Registra um ouvinte de evento com melhor gerenciamento
  on(event, callback) {
    this.connect();
    
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    
    this.eventListeners.get(event).add(callback);
    this.socket.on(event, callback);
    
    return () => this.off(event, callback); // Retorna função de cleanup
  }

  // Desconecta um ou mais ouvintes de eventos
  off(event, callback) {
    this.connect();
    
    if (this.eventListeners.has(event)) {
      if (callback) {
        // Desconecta um ouvinte específico
        this.socket.off(event, callback);
        this.eventListeners.get(event).delete(callback);
        
        // Remove o evento se não há mais listeners
        if (this.eventListeners.get(event).size === 0) {
          this.eventListeners.delete(event);
        }
      } else {
        // Desconecta todos os ouvintes do evento
        const listeners = this.eventListeners.get(event);
        listeners.forEach(cb => this.socket.off(event, cb));
        this.eventListeners.delete(event);
      }
    }
  }

  // Emite um evento
  emit(event, data) {
    this.connect();
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn(`Socket não conectado, evento ${event} não enviado`);
    }
  }

  // Limpa todos os listeners de um evento específico
  removeAllListeners(event) {
    this.connect();
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event);
      listeners.forEach(cb => this.socket.off(event, cb));
      this.eventListeners.delete(event);
    }
  }

  // Limpa todos os listeners
  removeAllListeners() {
    this.connect();
    this.eventListeners.forEach((listeners, event) => {
      listeners.forEach(cb => this.socket.off(event, cb));
    });
    this.eventListeners.clear();
  }

  // Desconecta completamente
  disconnect() {
    if (this.socket) {
      this.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
      this.isDisconnected = true;
      console.log("Socket desconectado manualmente");
    }
    
    // Limpar instância singleton
    SocketWorker.instance = null;
  }

  // Verifica se está conectado
  isConnected() {
    return this.socket && this.socket.connected;
  }

  // Obtém estatísticas de conexão
  getStats() {
    return {
      connected: this.isConnected(),
      eventListeners: this.eventListeners.size,
      reconnectAttempts: this.reconnectAttempts,
      isDisconnected: this.isDisconnected
    };
  }

  // Cleanup automático quando a página é fechada
  setupCleanup() {
    window.addEventListener('beforeunload', () => {
      this.disconnect();
    });
  }
}

export default SocketWorker;