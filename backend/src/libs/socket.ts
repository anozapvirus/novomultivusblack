import { Server as SocketIO } from "socket.io";
import { Server } from "http";
import AppError from "../errors/AppError";
import logger from "../utils/logger";
import { instrument } from "@socket.io/admin-ui";
import User from "../models/User";
import Ticket from "../models/Ticket";
import { typeSimulation } from "../services/WbotServices/SendWhatsAppMediaFlow";

let io: SocketIO;

// Cache para armazenar conexões ativas por namespace
const activeConnections = new Map<string, Set<string>>();

export const initIO = (httpServer: Server): SocketIO => {
  io = new SocketIO(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL
    },
    // Configurações de performance
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket', 'polling'],
    allowEIO3: true,
    // Limitar número de conexões por namespace
    maxHttpBufferSize: 1e6,
    // Configurações de rate limiting
    connectTimeout: 45000,
    // Cleanup automático de conexões inativas
    cleanupEmptyChildNamespaces: true
  });

  if (process.env.SOCKET_ADMIN && JSON.parse(process.env.SOCKET_ADMIN)) {
    User.findByPk(1).then(
      (adminUser) => {
        instrument(io, {
          auth: {
            type: "basic",
            username: adminUser.email,
            password: adminUser.passwordHash
          },
          mode: "development",
        });
      }
    ); 
  }  
  
  const workspaces = io.of(/^\/\w+$/);
  
  workspaces.on("connection", socket => {
    const { userId } = socket.handshake.query;
    const namespace = socket.nsp.name;
    
    // Registrar conexão ativa
    if (!activeConnections.has(namespace)) {
      activeConnections.set(namespace, new Set());
    }
    activeConnections.get(namespace)!.add(socket.id);
    
    logger.info(`Client connected: ${socket.id} to namespace ${namespace}`);

    socket.on("joinChatBox", (ticketId: string) => {
      socket.join(ticketId);
      logger.debug(`Client ${socket.id} joined ticket channel: ${ticketId}`);
    });

    socket.on("joinNotification", () => {
      socket.join("notification");
      logger.debug(`Client ${socket.id} joined notification channel`);
    });

    socket.on("joinTickets", (status: string) => {
      socket.join(status);
      logger.debug(`Client ${socket.id} joined tickets channel: ${status}`);
    });

    socket.on("joinTicketsLeave", (status: string) => {
      socket.leave(status);
      logger.debug(`Client ${socket.id} left tickets channel: ${status}`);
    });

    socket.on("joinChatBoxLeave", (ticketId: string) => {
      socket.leave(ticketId);
      logger.debug(`Client ${socket.id} left ticket channel: ${ticketId}`);
    });

    socket.on("disconnect", (reason) => {
      // Remover conexão do cache
      const namespaceConnections = activeConnections.get(namespace);
      if (namespaceConnections) {
        namespaceConnections.delete(socket.id);
        if (namespaceConnections.size === 0) {
          activeConnections.delete(namespace);
        }
      }
      
      logger.info(`Client disconnected: ${socket.id} from namespace ${namespace}, reason: ${reason}`);
    });

    // Escutando o evento de digitação do usuário
    socket.on("user_typing", async ({ ticketId }) => {
      try {
        const ticket = await Ticket.findOne({ where: { id: ticketId } }); 
        if (ticket) {
            await typeSimulation(ticket, 'composing');
        }
      } catch (error) {
        logger.error(`Error handling user_typing event: ${error}`);
      }
  });

    // Heartbeat para manter conexões ativas
    socket.on("ping", () => {
      socket.emit("pong");
    });

    // Limpeza de salas quando necessário
    socket.on("cleanup_rooms", () => {
      const rooms = Array.from(socket.rooms);
      rooms.forEach(room => {
        if (room !== socket.id) {
          socket.leave(room);
        }
      });
    });
  });

  // Cleanup periódico de conexões inativas
  setInterval(() => {
    const now = Date.now();
    workspaces.sockets.forEach((socket) => {
      const handshakeTime = typeof socket.handshake.time === 'number' ? socket.handshake.time : Date.now();
    if (now - handshakeTime > 300000) { // 5 minutos
        socket.disconnect(true);
      }
    });
  }, 60000); // Verificar a cada minuto

  return io;
};

export const getIO = (): SocketIO => {
  if (!io) {
    throw new AppError("Socket.IO not initialized");
  }
  return io;
};

// Função para limpar todas as conexões de um namespace
export const cleanupNamespace = (namespace: string): void => {
  const namespaceConnections = activeConnections.get(namespace);
  if (namespaceConnections) {
    namespaceConnections.forEach(socketId => {
      const socket = io.of(namespace).sockets.get(socketId);
      if (socket) {
        socket.disconnect(true);
      }
    });
    activeConnections.delete(namespace);
  }
};

// Função para obter estatísticas de conexões
export const getConnectionStats = () => {
  const stats = {};
  activeConnections.forEach((connections, namespace) => {
    stats[namespace] = connections.size;
  });
  return stats;
};