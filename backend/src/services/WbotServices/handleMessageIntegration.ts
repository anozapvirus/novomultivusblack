import axios from 'axios';
import { proto } from '@whiskeysockets/baileys';
import Message from '../../models/Message';
import Ticket from '../../models/Ticket';
import Contact from '../../models/Contact';
import QueueIntegrations from '../../models/QueueIntegrations';
import Queue from '../../models/Queue';
import { getBodyMessage, verifyMessage } from './wbotMessageListener';
import * as Sentry from "@sentry/node";

// Tipo para a sessão do whatsapp
interface Session {
  id?: number;
  sendMessage: (jid: string, content: any) => Promise<any>;
  sendPresenceUpdate: (presence: string, jid: string) => Promise<any>;
}

// Função auxiliar para sanitizar nomes
const sanitizeName = (name: string): string => {
  return name
    .trim()
    .replace(/\s+/g, " ") // remover espaços extras
    .substring(0, 25); // limitar tamanho
};

// Helper para valor aleatório (se não existir em outro lugar)
const randomValue = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Helper para esperar usando setTimeout
const wait = (ms: number): Promise<void> => {
  console.log(`[Wait] Iniciando espera de ${ms}ms`);
  return new Promise((resolve, reject) => {
    try {
      setTimeout(() => {
        console.log(`[Wait] Espera de ${ms}ms concluída`);
        resolve();
      }, ms);
    } catch (error) {
      console.error("[Wait] Erro DENTRO do setTimeout:", error);
      reject(error);
    }
  });
};

// Função auxiliar para transferir para fila
const transferQueue = async (
  queueId: number,
  ticket: Ticket,
  contact: Contact
): Promise<void> => {
  try {
    await ticket.update({
      queueId,
      status: "pending"
    });
  } catch (error) {
    console.error("Erro ao transferir para fila:", error);
    Sentry.captureException(error);
  }
};

/**
 * Função responsável por processar mensagens usando a API do Gemini
 */
export async function handleGeminiMessage(
  msg: proto.IWebMessageInfo,
  wbot: Session,
  ticket: Ticket,
  contact: Contact,
  queueIntegration: QueueIntegrations
): Promise<void> {
  console.log(`[Gemini] Iniciando processamento para ticket ${ticket.id}`);
  try {
    // Obter a mensagem do corpo
    const bodyMessage = getBodyMessage(msg);
    if (!bodyMessage) {
      console.log("[Gemini] Mensagem sem corpo. Abortando.");
      return;
    }
    console.log(`[Gemini] Corpo da mensagem: "${bodyMessage}"`);
    
    // Verificar se o contato tem o bot desabilitado
    if (contact.disableBot) {
      console.log("[Gemini] Contato com bot desabilitado. Abortando.");
      return;
    }
    
    if (msg.messageStubType) {
      console.log("[Gemini] Mensagem é um stub. Abortando.");
      return;
    }
    
    // Verificar se a API key está definida
    if (!queueIntegration.geminiApiKey) {
      console.error("[Gemini] API key do Gemini não configurada.");
      return;
    }
    console.log("[Gemini] API Key encontrada.");
    
    // 1. Status "Digitando" Inicial
    console.log("[Gemini DEBUG] Antes de sendPresenceUpdate composing");
    await wbot.sendPresenceUpdate("composing", contact.remoteJid);
    console.log("[Gemini DEBUG] Depois de sendPresenceUpdate composing");
    console.log("[Gemini] Status 'composing' enviado (inicial)");

    // Buscar mensagens anteriores para contexto
    console.log("[Gemini DEBUG] Antes de Message.findAll");
    const messages = await Message.findAll({
      where: { ticketId: ticket.id },
      order: [["createdAt", "ASC"]],
      limit: queueIntegration.geminiMaxMessages || 20
    });
    console.log("[Gemini DEBUG] Depois de Message.findAll");
    console.log(`[Gemini] ${messages.length} mensagens encontradas para o contexto.`);
    
    // Construir o prompt do sistema
    const promptSystem = `Suas respostas devem ser SEMPRE em Português do Brasil. Nas respostas utilize o nome ${sanitizeName(
      contact.name || "Amigo(a)"
    )} para identificar o cliente.

Sua resposta deve usar no máximo ${queueIntegration.geminiMaxTokens || 1024} tokens e cuide para não truncar o final.

Sempre que possível, mencione o nome dele para ser mais personalizado o atendimento e mais educado. 

Quando a resposta requer uma transferência para atendimento humano, identifique qual seria o setor mais adequado baseado na conversa e use o seguinte formato:
"Ação: Transferir para NOME_DO_SETOR" (exemplo: "Ação: Transferir para Suporte Técnico", "Ação: Transferir para Financeiro", "Ação: Transferir para Vendas", etc)

${queueIntegration.geminiPrompt || ""}\n`;
    
    // Preparar o conteúdo para enviar à API do Gemini
    const contents = [
      {
        role: "user",
        parts: [{ text: promptSystem }]
      },
      {
        role: "model",
        parts: [{ text: "Entendido. Vou seguir essas instruções." }]
      }
    ];
    
    // Adicionar mensagens anteriores
    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      if (message.mediaType === "conversation" || message.mediaType === "extendedTextMessage") {
        if (message.fromMe) {
          contents.push({ 
            role: "model", 
            parts: [{ text: message.body }] 
          });
        } else {
          contents.push({ 
            role: "user", 
            parts: [{ text: message.body }] 
          });
        }
      }
    }
    console.log(`[Gemini] ${contents.length - 2} mensagens do histórico adicionadas ao contexto.`);
    
    // Adicionar a mensagem atual (garantir que seja a última)
    contents.push({ 
      role: "user", 
      parts: [{ text: bodyMessage }] 
    });
    console.log("[Gemini] Mensagem atual adicionada ao contexto.");
    
    // Configuração da requisição para a API do Gemini
    const apiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${queueIntegration.geminiApiKey}`;
    
    const requestBody = {
      contents,
      generationConfig: {
        maxOutputTokens: queueIntegration.geminiMaxTokens || 1024,
        temperature: queueIntegration.geminiTemperature || 0.7
      }
    };
    
    // 3. Chamada API
    console.log("[Gemini DEBUG] Antes de axios.post");
    try {
      const response = await axios.post(apiUrl, requestBody);
      console.log("[Gemini DEBUG] Depois de axios.post (sucesso)");
      console.log("[Gemini] Resposta recebida da API com sucesso");
      
      // Processar a resposta
      if (!response.data) {
        throw new Error("Resposta vazia da API");
      }
      
      // Verificar se a resposta contém erro
      if (response.data.error) {
        throw new Error(`Erro da API: ${response.data.error.message}`);
      }
      
      // Extrair o texto da resposta
      let responseText = "";
      if (response.data && 
          response.data.candidates && 
          response.data.candidates.length > 0 && 
          response.data.candidates[0].content && 
          response.data.candidates[0].content.parts && 
          response.data.candidates[0].content.parts.length > 0) {
        responseText = response.data.candidates[0].content.parts[0].text;
        console.log(`[Gemini] Texto da resposta extraído (${responseText.length} caracteres)`);
      } else {
        console.error("[Gemini] Formato de resposta inválido:", JSON.stringify(response.data));
        throw new Error("Formato de resposta inválido");
      }
      
      // Verificar se é necessário transferir para atendimento humano
      const transferPattern = /Ação: Transferir para ([^\n.]+)/i;
      const transferMatch = responseText.match(transferPattern);
      let targetQueue: Queue | null = null;
      
      if (transferMatch) {
        const sectorName = transferMatch[1].trim();
        console.log(`[Gemini] Ação de transferência detectada para setor: "${sectorName}"`);
        
        // Remover a ação da resposta
        const cleanedResponse = responseText.replace(transferPattern, "").trim();
          
        // Encontrar as filas disponíveis
        const queues = await Queue.findAll({
          where: { companyId: ticket.companyId }
        });
        
        // Procurar uma fila que corresponda ao setor mencionado
        targetQueue = null;
        for (const queue of queues) {
          if (queue.name.toLowerCase().includes(sectorName.toLowerCase()) ||
              sectorName.toLowerCase().includes(queue.name.toLowerCase())) {
            targetQueue = queue;
            break;
          }
        }
        
        // Se não encontrou uma fila específica, use a primeira disponível
        if (!targetQueue && queues.length > 0) {
          targetQueue = queues[0];
          console.log(`[Gemini] Setor específico não encontrado, usando fila padrão: ${targetQueue.name}`);
        }
        
        if (targetQueue) {
          console.log(`[Gemini] Transferindo para a fila ${targetQueue.id} (${targetQueue.name})`);
          console.log("[Gemini DEBUG] Antes de transferQueue");
          await transferQueue(targetQueue.id, ticket, contact);
          console.log("[Gemini DEBUG] Depois de transferQueue");
          
          console.log("[Gemini DEBUG] Antes de sendPresenceUpdate paused (transferência)");
          await wbot.sendPresenceUpdate("paused", contact.remoteJid);
          console.log("[Gemini DEBUG] Depois de sendPresenceUpdate paused (transferência)");
          
          if (cleanedResponse) {
            console.log(`[Gemini] Enviando resposta limpa pós-transferência: "${cleanedResponse.substring(0, 50)}..."`);
            const sentMessage = await wbot.sendMessage(
              `${contact.number}@c.us`,
              { text: cleanedResponse }
            );
            await verifyMessage(sentMessage, ticket, contact);
          }
          return;
        } else {
          console.warn("[Gemini] Nenhuma fila encontrada para transferência, enviando resposta padrão.");
          responseText = cleanedResponse || 
            "Desculpe, não foi possível transferir para um atendente. Por favor, tente novamente mais tarde.";
        }
      }
      
      // 4. Delay Pós-API (3-10 segundos)
      const postApiDelay = randomValue(3000, 10000);
      console.log(`[Gemini DEBUG] Antes do await new Promise(setTimeout ${postApiDelay}ms) final`);
      await new Promise(resolve => setTimeout(resolve, postApiDelay)); // Timeout direto
      console.log(`[Gemini DEBUG] Depois do await new Promise(setTimeout ${postApiDelay}ms) final`);
      console.log("[Gemini] Delay final concluído.");

      // 5. Status "Pausado"
      console.log("[Gemini DEBUG] Antes de sendPresenceUpdate paused final");
      await wbot.sendPresenceUpdate("paused", contact.remoteJid);
      console.log("[Gemini DEBUG] Depois de sendPresenceUpdate paused final");
      console.log("[Gemini] Status 'paused' enviado após delay final");

      // 6. Envio da Mensagem
      console.log("[Gemini DEBUG] Antes de sendMessage final");
      const sentMessage = await wbot.sendMessage(
        `${contact.number}@c.us`,
        { text: responseText }
      );
      console.log("[Gemini DEBUG] Depois de sendMessage final");
      
      console.log("[Gemini DEBUG] Antes de verifyMessage final");
      await verifyMessage(sentMessage, ticket, contact);
      console.log("[Gemini DEBUG] Depois de verifyMessage final");
      console.log("[Gemini] Resposta enviada e registrada com sucesso");
      
    } catch (apiError) {
      console.log("[Gemini DEBUG] Entrou no catch (apiError)");
      console.error("[Gemini] Erro na requisição à API:",
        apiError.response ? JSON.stringify(apiError.response.data) : apiError.message);
      Sentry.captureException(apiError);
      await wbot.sendPresenceUpdate("paused", contact.remoteJid); // Parar de digitar em caso de erro
      await wbot.sendMessage(`${contact.number}@c.us`, { text: "Desculpe, estou enfrentando problemas técnicos para processar sua mensagem. Por favor, tente novamente mais tarde." });
    }
    
  } catch (error) {
    console.log("[Gemini DEBUG] Entrou no catch (error geral)");
    console.error("[Gemini] Erro geral:", error);
    Sentry.captureException(error);
    
    try {
      await wbot.sendPresenceUpdate("paused", contact.remoteJid);
      await wbot.sendMessage(`${contact.number}@c.us`, { text: "Desculpe, ocorreu um erro inesperado. Por favor, tente novamente mais tarde." });
    } catch (sendError) {
      console.error("[Gemini] Erro ao enviar mensagem de erro geral:", sendError);
    }
  }
}

/*
// CÓDIGO ORIGINAL COMENTADO PARA TESTE
export async function handleGeminiMessage(
  msg: proto.IWebMessageInfo,
  wbot: Session,
  ticket: Ticket,
  contact: Contact,
  queueIntegration: QueueIntegrations
): Promise<void> {
  console.log(`[Gemini TESTE] Iniciando handleGeminiMessage para ticket ${ticket.id}`);
  
  try {
      console.log("[Gemini TESTE] Enviando 'composing'");
      await wbot.sendPresenceUpdate("composing", contact.remoteJid);
      console.log("[Gemini TESTE] 'composing' enviado.");

      console.log("[Gemini TESTE] Iniciando delay de 20 segundos...");
      await wait(20000); // Teste com 20 segundos
      console.log("[Gemini TESTE] Delay de 20 segundos concluído.");

      console.log("[Gemini TESTE] Enviando resposta de TESTE SIMPLES...");
      await wbot.sendPresenceUpdate("paused", contact.remoteJid);
      await wbot.sendMessage(`${contact.number}@c.us`, { text: "TESTE DELAY 20s CONCLUÍDO" });
      console.log("[Gemini TESTE] Resposta de teste enviada.");

  } catch (error) {
      console.error("[Gemini TESTE] Erro durante o teste:", error);
      Sentry.captureException(error);
      try {
          await wbot.sendPresenceUpdate("paused", contact.remoteJid);
          await wbot.sendMessage(`${contact.number}@c.us`, { text: "Erro no teste de delay." });
      } catch (sendError) {
          console.error("[Gemini TESTE] Erro ao enviar mensagem de erro de teste:", sendError);
      }
  }
  console.log(`[Gemini TESTE] Finalizando handleGeminiMessage para ticket ${ticket.id}`);
}
*/ 