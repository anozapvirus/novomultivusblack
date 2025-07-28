import { Request, Response } from "express";
import Whatsapp from "../models/Whatsapp";
import { getWbot } from "../libs/wbot";
import { REDIS_URI_MSG_CONN } from "../config/redis";
import BullQueue from "../libs/queue";
import logger from "../utils/logger";

export const diagnosticSystem = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { companyId } = req.user;
    
    // 1. Verificar conexões WhatsApp
    const whatsapps = await Whatsapp.findAll({
      where: { companyId },
      attributes: ["id", "name", "status", "session", "qrcode"]
    });

    const whatsappStatus = whatsapps.map(w => ({
      id: w.id,
      name: w.name,
      status: w.status,
      hasSession: !!w.session,
      hasQrCode: !!w.qrcode,
      wbotExists: !!getWbot(w.id)
    }));

    // 2. Verificar Redis
    const redisStatus = {
      configured: REDIS_URI_MSG_CONN !== '',
      uri: REDIS_URI_MSG_CONN || 'Não configurado'
    };

    // 3. Verificar filas
    let queueStatus = { available: false, error: null };
    if (REDIS_URI_MSG_CONN !== '') {
      try {
        const Bull = require('bull');
        const testQueue = new Bull("test", REDIS_URI_MSG_CONN);
        await testQueue.add("test", { test: true });
        await testQueue.close();
        queueStatus.available = true;
      } catch (error) {
        queueStatus.error = error.message;
      }
    }

    // 4. Verificar processamento de mensagens
    const messageProcessingStatus = {
      usingRedis: REDIS_URI_MSG_CONN !== '',
      fallbackEnabled: true
    };

    return res.status(200).json({
      timestamp: new Date().toISOString(),
      companyId,
      whatsappConnections: whatsappStatus,
      redis: redisStatus,
      queues: queueStatus,
      messageProcessing: messageProcessingStatus,
      recommendations: generateRecommendations(whatsappStatus, redisStatus, queueStatus)
    });

  } catch (error) {
    logger.error(`Erro no diagnóstico: ${error}`);
    return res.status(500).json({
      error: "Erro ao executar diagnóstico",
      details: error.message
    });
  }
};

const generateRecommendations = (whatsapps: any[], redis: any, queues: any) => {
  const recommendations = [];

  // Verificar conexões WhatsApp
  const connectedWhatsapps = whatsapps.filter(w => w.status === 'CONNECTED');
  if (connectedWhatsapps.length === 0) {
    recommendations.push({
      type: "CRITICAL",
      message: "Nenhuma conexão WhatsApp conectada. Conecte pelo menos uma conexão.",
      action: "Acesse Conexões > Conectar"
    });
  }

  // Verificar Redis
  if (!redis.configured) {
    recommendations.push({
      type: "INFO",
      message: "Redis não configurado. Mensagens serão processadas diretamente.",
      action: "Configure REDIS_URI_ACK no .env para melhor performance"
    });
  } else if (!queues.available) {
    recommendations.push({
      type: "WARNING",
      message: "Redis configurado mas filas não funcionando. Verifique a conexão Redis.",
      action: "Verifique se o Redis está rodando e acessível"
    });
  }

  return recommendations;
}; 