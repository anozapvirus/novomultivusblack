import { Request, Response } from "express";
import Company from "../models/Company";
import CompaniesSettings from "../models/CompaniesSettings";
import Queue from "../models/Queue";
import Whatsapp from "../models/Whatsapp";
import VerifyCurrentSchedule from "../services/CompanyService/VerifyCurrentSchedule";
import { getWbot } from "../libs/wbot";
import logger from "../utils/logger";

export const debugSchedule = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { companyId } = req.user;
    
    // Buscar configurações da empresa
    const company = await Company.findByPk(companyId);
    if (!company) {
      return res.status(404).json({ error: "Empresa não encontrada" });
    }

    // Buscar configurações de horário da empresa
    const companySettings = await CompaniesSettings.findOne({
      where: { companyId }
    });

    // Testar verificação de horário por empresa
    const companySchedule = await VerifyCurrentSchedule(companyId, 0, 0);
    
    // Buscar filas da empresa
    const queues = await Queue.findAll({
      where: { companyId },
      attributes: ["id", "name", "schedules", "outOfHoursMessage"]
    });

    // Testar verificação de horário por fila
    const queueSchedules = await Promise.all(
      queues.map(async (queue) => {
        const schedule = await VerifyCurrentSchedule(companyId, queue.id, 0);
        return {
          id: queue.id,
          name: queue.name,
          schedule,
          outOfHoursMessage: queue.outOfHoursMessage
        };
      })
    );

    // Buscar conexões WhatsApp
    const whatsapps = await Whatsapp.findAll({
      where: { companyId },
      attributes: ["id", "name", "schedules", "outOfHoursMessage", "status"]
    });

    // Testar verificação de horário por conexão
    const whatsappSchedules = await Promise.all(
      whatsapps.map(async (whatsapp) => {
        const schedule = await VerifyCurrentSchedule(companyId, 0, whatsapp.id);
        return {
          id: whatsapp.id,
          name: whatsapp.name,
          status: whatsapp.status,
          schedule,
          outOfHoursMessage: whatsapp.outOfHoursMessage,
          wbotConnected: !!getWbot(whatsapp.id)
        };
      })
    );

    return res.status(200).json({
      timestamp: new Date().toISOString(),
      company: {
        id: company.id,
        name: company.name,
        scheduleType: companySettings?.scheduleType || "disabled",
        schedules: company.schedules,
        outOfHoursMessage: company.outOfHoursMessage,
        currentSchedule: companySchedule
      },
      queues: queueSchedules,
      whatsapps: whatsappSchedules,
      recommendations: generateScheduleRecommendations(company, companySettings, queueSchedules, whatsappSchedules)
    });

  } catch (error) {
    logger.error(`Erro no debug de horário: ${error}`);
    return res.status(500).json({
      error: "Erro ao executar debug de horário",
      details: error.message
    });
  }
};

export const testOutOfHoursMessage = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { companyId } = req.user;
    const { whatsappId, contactNumber } = req.body;

    if (!whatsappId || !contactNumber) {
      return res.status(400).json({
        error: "whatsappId e contactNumber são obrigatórios"
      });
    }

    // Buscar conexão WhatsApp
    const whatsapp = await Whatsapp.findByPk(whatsappId);
    if (!whatsapp || whatsapp.companyId !== companyId) {
      return res.status(404).json({ error: "Conexão WhatsApp não encontrada" });
    }

    // Verificar se está conectado
    const wbot = getWbot(whatsappId);
    if (!wbot) {
      return res.status(400).json({ error: "Conexão WhatsApp não está ativa" });
    }

    // Buscar configurações da empresa
    const company = await Company.findByPk(companyId);
    if (!company) {
      return res.status(404).json({ error: "Empresa não encontrada" });
    }

    // Buscar configurações de horário da empresa
    const companySettings = await CompaniesSettings.findOne({
      where: { companyId }
    });

    // Verificar horário atual
    const currentSchedule = await VerifyCurrentSchedule(companyId, 0, 0);
    const isOutsideHours = !currentSchedule || !currentSchedule.inActivity;

    // Buscar mensagem de ausência
    let outOfHoursMessage = "";
    if (companySettings?.scheduleType === "company") {
      outOfHoursMessage = company.outOfHoursMessage;
    } else if (companySettings?.scheduleType === "connection") {
      outOfHoursMessage = whatsapp.outOfHoursMessage;
    }

    const defaultMessage = "Estamos fora do horário de funcionamento. Retornaremos em breve.";
    const messageToSend = outOfHoursMessage || defaultMessage;

    // Enviar mensagem de teste
    try {
      await wbot.sendMessage(
        `${contactNumber}@s.whatsapp.net`,
        { text: messageToSend }
      );

      return res.status(200).json({
        success: true,
        message: "Mensagem de ausência enviada com sucesso",
        data: {
          isOutsideHours,
          messageSent: messageToSend,
          scheduleType: companySettings?.scheduleType || "disabled",
          currentSchedule
        }
      });

    } catch (error) {
      return res.status(500).json({
        error: "Erro ao enviar mensagem de teste",
        details: error.message
      });
    }

  } catch (error) {
    logger.error(`Erro no teste de mensagem de ausência: ${error}`);
    return res.status(500).json({
      error: "Erro ao executar teste",
      details: error.message
    });
  }
};

const generateScheduleRecommendations = (company: Company, companySettings: CompaniesSettings | null, queues: any[], whatsapps: any[]) => {
  const recommendations = [];

  // Verificar se o sistema está configurado
  if (!companySettings?.scheduleType || companySettings.scheduleType === "disabled") {
    recommendations.push({
      type: "INFO",
      message: "Sistema de horário desabilitado",
      action: "Configure o tipo de horário nas configurações da empresa"
    });
  }

  // Verificar mensagem de ausência
  if (companySettings?.scheduleType !== "disabled" && (!company.outOfHoursMessage || company.outOfHoursMessage.trim() === "")) {
    recommendations.push({
      type: "WARNING",
      message: "Mensagem de ausência não configurada",
      action: "Configure uma mensagem personalizada para quando estiver fora do horário"
    });
  }

  // Verificar conexões WhatsApp
  const connectedWhatsapps = whatsapps.filter(w => w.wbotConnected);
  if (connectedWhatsapps.length === 0) {
    recommendations.push({
      type: "CRITICAL",
      message: "Nenhuma conexão WhatsApp conectada",
      action: "Conecte pelo menos uma conexão WhatsApp"
    });
  }

  return recommendations;
}; 