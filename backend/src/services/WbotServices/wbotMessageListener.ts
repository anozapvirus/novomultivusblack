import path, { join } from "path";
import { promisify } from "util";
import { readFile, writeFile } from "fs";
import fs from "fs";
import * as Sentry from "@sentry/node";
import { isNil, isNull } from "lodash";
import { REDIS_URI_MSG_CONN } from "../../config/redis";

import {
  downloadMediaMessage,
  extractMessageContent,
  getContentType,
  GroupMetadata,
  jidNormalizedUser,
  delay,
  MediaType,
  MessageUpsertType,
  proto,
  WAMessage,
  WAMessageStubType,
  WAMessageUpdate,
  WASocket,
  downloadContentFromMessage,
  AnyMessageContent,
  generateWAMessageContent,
  generateWAMessageFromContent
} from "@whiskeysockets/baileys";
import Contact from "../../models/Contact";
import Ticket from "../../models/Ticket";
import Message from "../../models/Message";
import { Mutex } from "async-mutex";
import { getIO } from "../../libs/socket";
import CreateMessageService from "../MessageServices/CreateMessageService";
import logger from "../../utils/logger";
import CreateOrUpdateContactService from "../ContactServices/CreateOrUpdateContactService";
import FindOrCreateTicketService from "../TicketServices/FindOrCreateTicketService";
import ShowWhatsAppService from "../WhatsappService/ShowWhatsAppService";
import { debounce } from "../../helpers/Debounce";
import UpdateTicketService from "../TicketServices/UpdateTicketService";
import formatBody from "../../helpers/Mustache";
import TicketTraking from "../../models/TicketTraking";
import UserRating from "../../models/UserRating";
import SendWhatsAppMessage from "./SendWhatsAppMessage";
import sendFaceMessage from "../FacebookServices/sendFacebookMessage";
import moment from "moment";
import Queue from "../../models/Queue";
import Company from "../../models/Company";
import FindOrCreateATicketTrakingService from "../TicketServices/FindOrCreateATicketTrakingService";
import VerifyCurrentSchedule from "../CompanyService/VerifyCurrentSchedule";
import Campaign from "../../models/Campaign";
import CampaignShipping from "../../models/CampaignShipping";
import { Op } from "sequelize";
import { campaignQueue, parseToMilliseconds, randomValue } from "../../queues";
import User from "../../models/User";
import { sayChatbot } from "./ChatBotListener";
import MarkDeleteWhatsAppMessage from "./MarkDeleteWhatsAppMessage";
import ListUserQueueServices from "../UserQueueServices/ListUserQueueServices";
import cacheLayer from "../../libs/cache";
import { addLogs } from "../../helpers/addLogs";
import SendWhatsAppMedia, { getMessageOptions } from "./SendWhatsAppMedia";

import ShowQueueIntegrationService from "../QueueIntegrationServices/ShowQueueIntegrationService";
import { createDialogflowSessionWithModel } from "../QueueIntegrationServices/CreateSessionDialogflow";
import { queryDialogFlow } from "../QueueIntegrationServices/QueryDialogflow";
import CompaniesSettings from "../../models/CompaniesSettings";
import CreateLogTicketService from "../TicketServices/CreateLogTicketService";
import Whatsapp from "../../models/Whatsapp";
import QueueIntegrations from "../../models/QueueIntegrations";
import ShowFileService from "../FileServices/ShowService";

import OpenAI from "openai";
import ffmpeg from "fluent-ffmpeg";
import {
  SpeechConfig,
  SpeechSynthesizer,
  AudioConfig
} from "microsoft-cognitiveservices-speech-sdk";
import typebotListener from "../TypebotServices/typebotListener";
import Tag from "../../models/Tag";
import TicketTag from "../../models/TicketTag";
import pino from "pino";
import BullQueues from "../../libs/queue";
import { Transform } from "stream";
import { msgDB } from "../../libs/wbot";
import { title } from "process";
import { FlowBuilderModel } from "../../models/FlowBuilder";
import { IConnections, INodes } from "../WebhookService/DispatchWebHookService";
import { FlowDefaultModel } from "../../models/FlowDefault";
import { ActionsWebhookService } from "../WebhookService/ActionsWebhookService";
import { WebhookModel } from "../../models/Webhook";
import { add, differenceInMilliseconds } from "date-fns";
import { FlowCampaignModel } from "../../models/FlowCampaign";
import {CheckSettings1, CheckCompanySetting} from "../../helpers/CheckSettings";
import ShowTicketService from "../TicketServices/ShowTicketService";
import { json } from "body-parser";
import { is } from "bluebird";

const os = require("os");

const request = require("request");

let i = 0;

setInterval(() => {
  i = 0
}, 5000);

type Session = WASocket & {
  id?: number;
};

interface ImessageUpsert {
  messages: proto.IWebMessageInfo[];
  type: MessageUpsertType;
}

interface IMe {
  name: string;
  id: string;
}

interface SessionOpenAi extends OpenAI {
  id?: number;
}
const sessionsOpenAi: SessionOpenAi[] = [];

const writeFileAsync = promisify(writeFile);

function removeFile(directory) {
  fs.unlink(directory, (error) => {
    if (error) throw error;
  });
}

const getTimestampMessage = (msgTimestamp: any) => {
  return msgTimestamp * 1
}

const multVecardGet = function (param: any) {
  let output = " "

  let name = param.split("\n")[2].replace(";;;", "\n").replace('N:', "").replace(";", "").replace(";", " ").replace(";;", " ").replace("\n", "")
  let inicio = param.split("\n")[4].indexOf('=')
  let fim = param.split("\n")[4].indexOf(':')
  let contact = param.split("\n")[4].substring(inicio + 1, fim).replace(";", "")
  let contactSemWhats = param.split("\n")[4].replace("item1.TEL:", "")
  //console.log(contact);
  if (contact != "item1.TEL") {
    output = output + name + ": 📞" + contact + "" + "\n"
  } else
    output = output + name + ": 📞" + contactSemWhats + "" + "\n"
  return output
}

const contactsArrayMessageGet = (msg: any,) => {
  let contactsArray = msg.message?.contactsArrayMessage?.contacts
  let vcardMulti = contactsArray.map(function (item, indice) {
    return item.vcard;
  });

  let bodymessage = ``
  vcardMulti.forEach(function (vcard, indice) {
    bodymessage += vcard + "\n\n" + ""
  })

  let contacts = bodymessage.split("BEGIN:")

  contacts.shift()
  let finalContacts = ""
  for (let contact of contacts) {
    finalContacts = finalContacts + multVecardGet(contact)
  }

  return finalContacts
}

const getTypeMessage = (msg: proto.IWebMessageInfo): string => {
  const msgType = getContentType(msg.message);
  if (msg.message?.extendedTextMessage && msg.message?.extendedTextMessage?.contextInfo && msg.message?.extendedTextMessage?.contextInfo?.externalAdReply) {
    return 'adMetaPreview'; // Adicionado para tratar mensagens de anúncios;
  }
  if (msg.message?.viewOnceMessageV2) {
    return "viewOnceMessageV2"
  }
  return msgType
};
const getAd = (msg: any): string => {
  if (msg.key.fromMe && msg.message?.listResponseMessage?.contextInfo?.externalAdReply) {
    let bodyMessage = `*${msg.message?.listResponseMessage?.contextInfo?.externalAdReply?.title}*`;

    bodyMessage += `\n\n${msg.message?.listResponseMessage?.contextInfo?.externalAdReply?.body}`;

    return bodyMessage;
  }
};

const getBodyButton = (msg: any): string => {
  try {
    if (msg?.messageType === "buttonsMessage" || msg?.message?.buttonsMessage?.contentText) {

      let bodyMessage = `[BUTTON]\n\n*${msg?.message?.buttonsMessage?.contentText}*\n\n`;
      // eslint-disable-next-line no-restricted-syntax
      for (const button of msg.message?.buttonsMessage?.buttons) {
        bodyMessage += `*${button.buttonId}* - ${button.buttonText.displayText}\n`;
      }

      return bodyMessage;
    }
    if (msg?.messageType === "listMessage" || msg?.message?.listMessage?.description) {
      let bodyMessage = `[LIST]\n\n*${msg?.message?.listMessage?.description}*\n\n`;
      // eslint-disable-next-line no-restricted-syntax
      for (const button of msg.message?.listMessage?.sections[0]?.rows) {
        bodyMessage += `${button.title}\n`;
      }

      return bodyMessage;
    }
  } catch (error) {
    logger.error(error);
  }
};

const msgLocation = (image, latitude, longitude) => {
  if (image) {
    var b64 = Buffer.from(image).toString("base64");

    let data = `data:image/png;base64, ${b64} | https://maps.google.com/maps?q=${latitude}%2C${longitude}&z=17&hl=pt-BR|${latitude}, ${longitude} `;
    return data;
  }
};

export const getBodyMessage = (msg: proto.IWebMessageInfo): string | null => {
  try {
    let type = getTypeMessage(msg);

    if (type === undefined) console.log(JSON.stringify(msg))

    const types = {
      conversation: msg.message?.conversation,
      imageMessage: msg.message?.imageMessage?.caption,
      videoMessage: msg.message?.videoMessage?.caption,
      extendedTextMessage: msg?.message?.extendedTextMessage?.text,
      buttonsResponseMessage: msg.message?.buttonsResponseMessage?.selectedDisplayText,
      listResponseMessage: msg.message?.listResponseMessage?.title || msg.message?.listResponseMessage?.singleSelectReply?.selectedRowId,
      templateButtonReplyMessage: msg.message?.templateButtonReplyMessage?.selectedId,
      messageContextInfo: msg.message?.buttonsResponseMessage?.selectedButtonId || msg.message?.listResponseMessage?.title,
      buttonsMessage: getBodyButton(msg) || msg.message?.listResponseMessage?.title,
      stickerMessage: "sticker",
      contactMessage: msg.message?.contactMessage?.vcard,
      contactsArrayMessage: (msg.message?.contactsArrayMessage?.contacts) && contactsArrayMessageGet(msg),
      //locationMessage: `Latitude: ${msg.message.locationMessage?.degreesLatitude} - Longitude: ${msg.message.locationMessage?.degreesLongitude}`,
      locationMessage: msgLocation(msg.message?.locationMessage?.jpegThumbnail, msg.message?.locationMessage?.degreesLatitude, msg.message?.locationMessage?.degreesLongitude),
      liveLocationMessage: `Latitude: ${msg.message?.liveLocationMessage?.degreesLatitude} - Longitude: ${msg.message?.liveLocationMessage?.degreesLongitude}`,
      documentMessage: msg.message?.documentMessage?.caption,
      audioMessage: "Áudio",
      listMessage: getBodyButton(msg) || msg.message?.listResponseMessage?.title,
      viewOnceMessage: getBodyButton(msg),
      reactionMessage: msg.message?.reactionMessage?.text || "reaction",
      senderKeyDistributionMessage: msg?.message?.senderKeyDistributionMessage?.axolotlSenderKeyDistributionMessage,
      documentWithCaptionMessage: msg.message?.documentWithCaptionMessage?.message?.documentMessage?.caption,
      viewOnceMessageV2: msg.message?.viewOnceMessageV2?.message?.imageMessage?.caption,
      adMetaPreview: msgAdMetaPreview(
        msg.message?.extendedTextMessage?.contextInfo?.externalAdReply?.thumbnail,
        msg.message?.extendedTextMessage?.contextInfo?.externalAdReply?.title,
        msg.message?.extendedTextMessage?.contextInfo?.externalAdReply?.body,
        msg.message?.extendedTextMessage?.contextInfo?.externalAdReply?.sourceUrl,
        msg.message?.extendedTextMessage?.text
      ), // Adicionado para tratar mensagens de anúncios;
      editedMessage:
        msg?.message?.protocolMessage?.editedMessage?.conversation ||
        msg?.message?.editedMessage?.message?.protocolMessage?.editedMessage?.conversation,
      ephemeralMessage: msg.message?.ephemeralMessage?.message?.extendedTextMessage?.text,
      imageWhitCaptionMessage: msg?.message?.ephemeralMessage?.message?.imageMessage,
      highlyStructuredMessage: msg.message?.highlyStructuredMessage,
      protocolMessage: msg?.message?.protocolMessage?.editedMessage?.conversation,
      advertising: getAd(msg) || msg.message?.listResponseMessage?.contextInfo?.externalAdReply?.title,
    };

    const objKey = Object.keys(types).find(key => key === type);

    if (!objKey) {
      logger.warn(`#### Nao achou o type 152: ${type} ${JSON.stringify(msg.message)}`);
      Sentry.setExtra("Mensagem", { BodyMsg: msg.message, msg, type });
      Sentry.captureException(
        new Error("Novo Tipo de Mensagem em getTypeMessage")
      );
    }
    return types[type];
  } catch (error) {
    Sentry.setExtra("Error getTypeMessage", { msg, BodyMsg: msg.message });
    Sentry.captureException(error);
    console.log(error);
  }
};

const msgAdMetaPreview = (image, title, body, sourceUrl, messageUser) => {
  if (image) {
    var b64 = Buffer.from(image).toString("base64");

    let data = `data:image/png;base64, ${b64} | ${sourceUrl} | ${title} | ${body} | ${messageUser}`;
    return data;
  }
};

export const getQuotedMessage = (msg: proto.IWebMessageInfo) => {
  const body = extractMessageContent(msg.message)[
    Object.keys(msg?.message).values().next().value
  ];

  if (!body?.contextInfo?.quotedMessage) return;
  const quoted = extractMessageContent(
    body?.contextInfo?.quotedMessage[
    Object.keys(body?.contextInfo?.quotedMessage).values().next().value
    ]
  );

  return quoted;
};

export const getQuotedMessageId = (msg: proto.IWebMessageInfo) => {
  const body = extractMessageContent(msg.message)[
    Object.keys(msg?.message).values().next().value
  ];
  let reaction = msg?.message?.reactionMessage
    ? msg?.message?.reactionMessage?.key?.id
    : "";

  return reaction ? reaction : body?.contextInfo?.stanzaId;
};

const getMeSocket = (wbot: Session): IMe => {
  return {
    id: jidNormalizedUser((wbot as WASocket).user.id),
    name: (wbot as WASocket).user.name
  }
};

const getSenderMessage = (
  msg: proto.IWebMessageInfo,
  wbot: Session
): string => {
  const me = getMeSocket(wbot);
  if (msg.key.fromMe) return me.id;

  const senderId =
    msg.participant || msg.key.participant || msg.key.remoteJid || undefined;

  return senderId && jidNormalizedUser(senderId);
};

const getContactMessage = async (msg: proto.IWebMessageInfo, wbot: Session) => {
  const isGroup = msg.key.remoteJid.includes("g.us");
  const rawNumber = msg.key.remoteJid.replace(/\D/g, "");
  return isGroup
    ? {
      id: getSenderMessage(msg, wbot),
      name: msg.pushName
    }
    : {
      id: msg.key.remoteJid, // usar remoteJid como identificador
      name: msg.key.fromMe ? rawNumber : msg.pushName
    };
};

function findCaption(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return null;
  }

  for (const key in obj) {
    if (key === 'caption' || key === 'text' || key === 'conversation') {
      return obj[key];
    }

    const result = findCaption(obj[key]);
    if (result) {
      return result;
    }
  }

  return null;
}

const getUnpackedMessage = (msg: proto.IWebMessageInfo) => {
  return (
    msg.message?.documentWithCaptionMessage?.message ||
    msg.message?.extendedTextMessage?.contextInfo?.quotedMessage ||
    msg.message?.ephemeralMessage?.message ||
    msg.message?.viewOnceMessage?.message ||
    msg.message?.viewOnceMessageV2?.message ||
    msg.message?.ephemeralMessage?.message ||
    msg.message?.templateMessage?.hydratedTemplate ||
    msg.message?.templateMessage?.hydratedFourRowTemplate ||
    msg.message?.templateMessage?.fourRowTemplate ||
    msg.message?.interactiveMessage?.header ||
    msg.message?.highlyStructuredMessage?.hydratedHsm?.hydratedTemplate ||
    msg.message
  )
}

const getMessageMedia = (message: proto.IMessage) => {
  return (
    message?.imageMessage ||
    message?.audioMessage ||
    message?.videoMessage ||
    message?.stickerMessage ||
    message?.documentMessage || null
  );
}

const downloadMedia = async (msg: proto.IWebMessageInfo, isImported: Date = null, wbot: Session, ticket: Ticket) => {

  const unpackedMessage = getUnpackedMessage(msg);
  const message = getMessageMedia(unpackedMessage);

  if (!message) {
    return null;
  }

  const fileLimit = parseInt(await CheckSettings1("downloadLimit", "15"), 10);
  if (wbot && message?.fileLength && +message.fileLength > fileLimit * 1024 * 1024) {
    const fileLimitMessage = {
      text: `\u200e*Mensagem Automática*:\nNosso sistema aceita apenas arquivos com no máximo ${fileLimit} MiB`
    };

    const sendMsg = await wbot.sendMessage(
      `${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
      fileLimitMessage
    );

    sendMsg.message.extendedTextMessage.text = "\u200e*Mensagem do sistema*:\nArquivo recebido além do limite de tamanho do sistema, se for necessário ele pode ser obtido no aplicativo do whatsapp.";

    // eslint-disable-next-line no-use-before-define
    await verifyMessage(sendMsg, ticket, ticket.contact);
    throw new Error("ERR_FILESIZE_OVER_LIMIT");
  }

  if (msg.message?.stickerMessage) {
    const urlAnt = "https://web.whatsapp.net";
    const directPath = msg.message?.stickerMessage?.directPath;
    const newUrl = "https://mmg.whatsapp.net";
    const final = newUrl + directPath;
    if (msg.message?.stickerMessage?.url?.includes(urlAnt)) {
      msg.message.stickerMessage.url = msg.message?.stickerMessage.url.replace(urlAnt, final);
    }
  }

  let buffer
  try {
    buffer = await downloadMediaMessage(
      msg,
      'buffer',
      {},
      {
        logger,
        reuploadRequest: wbot.updateMediaMessage,
      }
    )
  } catch (err) {
    if (isImported) {
      console.log("Falha ao fazer o download de uma mensagem importada, provavelmente a mensagem já não esta mais disponível")
    } else {
      console.error('Erro ao baixar mídia:', err);
    }
  }

  let filename = msg.message?.documentMessage?.fileName || "";

  const mineType =
    msg.message?.imageMessage ||
    msg.message?.audioMessage ||
    msg.message?.videoMessage ||
    msg.message?.stickerMessage ||
    msg.message?.ephemeralMessage?.message?.stickerMessage ||
    msg.message?.documentMessage ||
    msg.message?.documentWithCaptionMessage?.message?.documentMessage ||
    msg.message?.ephemeralMessage?.message?.audioMessage ||
    msg.message?.ephemeralMessage?.message?.documentMessage ||
    msg.message?.ephemeralMessage?.message?.videoMessage ||
    msg.message?.ephemeralMessage?.message?.imageMessage ||
    msg.message?.viewOnceMessage?.message?.imageMessage ||
    msg.message?.viewOnceMessage?.message?.videoMessage ||
    msg.message?.ephemeralMessage?.message?.viewOnceMessage?.message?.imageMessage ||
    msg.message?.ephemeralMessage?.message?.viewOnceMessage?.message?.videoMessage ||
    msg.message?.ephemeralMessage?.message?.viewOnceMessage?.message?.audioMessage ||
    msg.message?.ephemeralMessage?.message?.viewOnceMessage?.message?.documentMessage ||
    msg.message?.templateMessage?.hydratedTemplate?.imageMessage ||
    msg.message?.templateMessage?.hydratedTemplate?.documentMessage ||
    msg.message?.templateMessage?.hydratedTemplate?.videoMessage ||
    msg.message?.templateMessage?.hydratedFourRowTemplate?.imageMessage ||
    msg.message?.templateMessage?.hydratedFourRowTemplate?.documentMessage ||
    msg.message?.templateMessage?.hydratedFourRowTemplate?.videoMessage ||
    msg.message?.templateMessage?.fourRowTemplate?.imageMessage ||
    msg.message?.templateMessage?.fourRowTemplate?.documentMessage ||
    msg.message?.templateMessage?.fourRowTemplate?.videoMessage ||
    msg.message?.interactiveMessage?.header?.imageMessage ||
    msg.message?.interactiveMessage?.header?.documentMessage ||
    msg.message?.interactiveMessage?.header?.videoMessage;

  if (!filename) {
    const ext = mineType.mimetype.split("/")[1].split(";")[0];
    filename = `${new Date().getTime()}.${ext}`;
  } else {
    filename = `${new Date().getTime()}_${filename}`;
  }

  const media = {
    data: buffer,
    mimetype: mineType.mimetype,
    filename
  };

  return media;
}

const verifyContact = async (
  msgContact: IMe,
  wbot: Session,
  companyId: number
): Promise<Contact> => {
  const remoteJid = msgContact.id;
  const number = remoteJid.replace(/\D/g, "");
  
  let contact = await Contact.findOne({
    where: { remoteJid, companyId }
  });

  if (!contact) {
    // fallback para busca por number caso não encontre pelo remoteJid
    contact = await Contact.findOne({
      where: { number, companyId }
    });
  }

  if (!contact) {
    contact = await CreateOrUpdateContactService({
      name: msgContact.name,
      number, // apenas informativo
      remoteJid,
      profilePicUrl: "",
      isGroup: false,
      companyId,
      wbot
    });
  }

  return contact;
};

const verifyQuotedMessage = async (
  msg: proto.IWebMessageInfo
): Promise<Message | null> => {
  if (!msg) return null;
  const quoted = getQuotedMessageId(msg);

  if (!quoted) return null;

  const quotedMsg = await Message.findOne({
    where: { wid: quoted }
  });

  if (!quotedMsg) return null;

  return quotedMsg;
};

export const verifyMediaMessage = async (
  msg: proto.IWebMessageInfo,
  ticket: Ticket,
  contact: Contact,
  ticketTraking?: TicketTraking,
  isForwarded: boolean = false,
  isPrivate: boolean = false,
  wbot?: Session
): Promise<Message> => {
  const io = getIO();
  const quotedMsg = await verifyQuotedMessage(msg);
  const companyId = ticket.companyId;

  try {
  
    const media = await downloadMedia(msg, ticket?.imported, wbot, ticket);
  

    if (!media && ticket.imported) {
      const body =
        "*System:* \nFalha no download da mídia verifique no dispositivo";
      const messageData = {
        //mensagem de texto
        wid: msg.key.id,
        ticketId: ticket.id,
        contactId: msg.key.fromMe ? undefined : ticket.contactId,
        body,
        reactionMessage: msg.message?.reactionMessage,
        fromMe: msg.key.fromMe,
        mediaType: getTypeMessage(msg),
        read: msg.key.fromMe,
        quotedMsgId: quotedMsg?.id || msg.message?.reactionMessage?.key?.id,
        ack: msg.status,
        companyId: companyId,
        remoteJid: msg.key.remoteJid,
        participant: msg.key.participant,
        timestamp: getTimestampMessage(msg.messageTimestamp),
        createdAt: new Date(
          Math.floor(getTimestampMessage(msg.messageTimestamp) * 1000)
        ).toISOString(),
        dataJson: JSON.stringify(msg),
        ticketImported: ticket.imported,
        isForwarded,
        isPrivate
      };

      await ticket.update({
        lastMessage: body
      });
      logger.error(Error("ERR_WAPP_DOWNLOAD_MEDIA"));
      return CreateMessageService({ messageData, companyId: companyId });
    }

    if (!media) {
      throw new Error("ERR_WAPP_DOWNLOAD_MEDIA");
    }

    // if (!media.filename || media.mimetype === "audio/mp4") {
    //   const ext = media.mimetype === "audio/mp4" ? "m4a" : media.mimetype.split("/")[1].split(";")[0];
    //   media.filename = `${new Date().getTime()}.${ext}`;
    // } else {
    //   // ext = tudo depois do ultimo .
    //   const ext = media.filename.split(".").pop();
    //   // name = tudo antes do ultimo .
    //   const name = media.filename.split(".").slice(0, -1).join(".").replace(/\s/g, '_').normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    //   media.filename = `${name.trim()}_${new Date().getTime()}.${ext}`;
    // }
    if (!media.filename) {
      const ext = media.mimetype.split("/")[1].split(";")[0];
      media.filename = `${new Date().getTime()}.${ext}`;
    } else {
      // ext = tudo depois do ultimo .
      const ext = media.filename.split(".").pop();
      // name = tudo antes do ultimo .
      const name = media.filename.split(".").slice(0, -1).join(".").replace(/\s/g, '_').normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      media.filename = `${name.trim()}_${new Date().getTime()}.${ext}`;
    }


    try {

      const folder = path.resolve(__dirname, "..", "..", "..", "public", `company${companyId}`);

      // const folder = `public/company${companyId}`; // Correção adicionada por Altemir 16-08-2023
      if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder, { recursive: true }); // Correção adicionada por Altemir 16-08-2023
        fs.chmodSync(folder, 0o777)
      }

      await writeFileAsync(join(folder, media.filename), media.data.toString('base64'), "base64") // Correção adicionada por Altemir 16-08-2023

        .then(() => {

          // console.log("Arquivo salvo com sucesso!");
          if (media.mimetype.includes("audio")) {
            console.log(media.mimetype)
            const inputFile = path.join(folder, media.filename);
            let outputFile: string;

            if (inputFile.endsWith(".mpeg")) {
              outputFile = inputFile.replace(".mpeg", ".mp3");
            } else if (inputFile.endsWith(".ogg")) {
              outputFile = inputFile.replace(".ogg", ".mp3");
            } else {
              // Trate outros formatos de arquivo conforme necessário
              //console.error("Formato de arquivo não suportado:", inputFile);
              return;
            }

            return new Promise<void>((resolve, reject) => {
              ffmpeg(inputFile)
                .toFormat("mp3")
                .save(outputFile)
                .on("end", () => {
                  resolve();
                })
                .on("error", (err: any) => {
                  reject(err);
                });
            });
          }
        })
      // .then(() => {
      //   //console.log("Conversão concluída!");
      //   // Aqui você pode fazer o que desejar com o arquivo MP3 convertido.
      // })

    } catch (err) {
      Sentry.setExtra('Erro media', { companyId: companyId, ticket, contact, media, quotedMsg });
      Sentry.captureException(err);
      logger.error(err);
      console.log(msg)
    }

    const body = getBodyMessage(msg);

    const messageData = {
      wid: msg.key.id,
      ticketId: ticket.id,
      contactId: msg.key.fromMe ? undefined : contact.id,
      body: body || media.filename,
      fromMe: msg.key.fromMe,
      read: msg.key.fromMe,
      mediaUrl: media.filename,
      mediaType: media.mimetype.split("/")[0],
      quotedMsgId: quotedMsg?.id,
      ack: Number(String(msg.status).replace('PENDING', '2').replace('NaN', '1')) || 2,
      remoteJid: msg.key.remoteJid,
      participant: msg.key.participant,
      dataJson: JSON.stringify(msg),
      ticketTrakingId: ticketTraking?.id,
      createdAt: new Date(
        Math.floor(getTimestampMessage(msg.messageTimestamp) * 1000)
      ).toISOString(),
      ticketImported: ticket.imported,
      isForwarded,
      isPrivate
    };

    await ticket.update({
      lastMessage: body || media.filename
    });

    const newMessage = await CreateMessageService({
      messageData,
      companyId: companyId
    });

    if (!msg.key.fromMe && ticket.status === "closed") {
      await ticket.update({ status: "pending" });
      await ticket.reload({
        attributes: [
          "id",
          "uuid",
          "queueId",
          "isGroup",
          "channel",
          "status",
          "contactId",
          "useIntegration",
          "lastMessage",
          "updatedAt",
          "unreadMessages",
          "companyId",
          "whatsappId",
          "imported",
          "lgpdAcceptedAt",
          "amountUsedBotQueues",
          "useIntegration",
          "integrationId",
          "userId",
          "amountUsedBotQueuesNPS",
          "lgpdSendMessageAt",
          "isBot",
        ],
        include: [
          { model: Queue, as: "queue" },
          { model: User, as: "user" },
          { model: Contact, as: "contact" },
          { model: Whatsapp, as: "whatsapp" }
        ]
      });

      io.of(String(companyId))
        // .to("closed")
        .emit(`company-${companyId}-ticket`, {
          action: "delete",
          ticket,
          ticketId: ticket.id
        });
      // console.log("emitiu socket 902", ticket.id)
      io.of(String(companyId))
        // .to(ticket.status)
        //   .to(ticket.id.toString())
        .emit(`company-${companyId}-ticket`, {
          action: "update",
          ticket,
          ticketId: ticket.id
        });
    }

    return newMessage;
  } catch (error) {
    console.log(error);
    logger.warn("Erro ao baixar media: ", JSON.stringify(msg));
  }
};

export const verifyMessage = async (
  msg: proto.IWebMessageInfo,
  ticket: Ticket,
  contact: Contact,
  ticketTraking?: TicketTraking,
  isPrivate?: boolean,
  isForwarded: boolean = false
) => {
  const io = getIO();
  const quotedMsg = await verifyQuotedMessage(msg);
  const body = getBodyMessage(msg);
  const companyId = ticket.companyId;

  const messageData = {
    wid: msg.key.id,
    ticketId: ticket.id,
    contactId: msg.key.fromMe ? undefined : contact.id,
    body,
    fromMe: msg.key.fromMe,
    mediaType: getTypeMessage(msg),
    read: msg.key.fromMe,
    quotedMsgId: quotedMsg?.id,
    ack: Number(String(msg.status).replace('PENDING', '2').replace('NaN', '1')) || 2,
    remoteJid: msg.key.remoteJid,
    participant: msg.key.participant,
    dataJson: JSON.stringify(msg),
    ticketTrakingId: ticketTraking?.id,
    isPrivate,
    createdAt: new Date(
      Math.floor(getTimestampMessage(msg.messageTimestamp) * 1000)
    ).toISOString(),
    ticketImported: ticket.imported,
    isForwarded
  };

  await ticket.update({
    lastMessage: body
  });

  await CreateMessageService({ messageData, companyId: companyId });



  if (!msg.key.fromMe && ticket.status === "closed") {
    console.log("===== CHANGE =====")
    await ticket.update({ status: "pending" });
    await ticket.reload({
      include: [
        { model: Queue, as: "queue" },
        { model: User, as: "user" },
        { model: Contact, as: "contact" },
        { model: Whatsapp, as: "whatsapp" }
      ]
    });

    // io.to("closed").emit(`company-${companyId}-ticket`, {
    //   action: "delete",
    //   ticket,
    //   ticketId: ticket.id
    // });

    if (!ticket.imported) {
      io.of(String(companyId))
        // .to(ticket.status)
        // .to(ticket.id.toString())
        .emit(`company-${companyId}-ticket`, {
          action: "update",
          ticket,
          ticketId: ticket.id
        });

    }

  }
};

const isValidMsg = (msg: proto.IWebMessageInfo): boolean => {
  if (msg.key.remoteJid === "status@broadcast") return false;
  try {
    const msgType = getTypeMessage(msg);
    if (!msgType) {
      return;
    }

    const ifType =
      msgType === "conversation" ||
      msgType === "extendedTextMessage" ||
      msgType === "audioMessage" ||
      msgType === "videoMessage" ||
      msgType === "imageMessage" ||
      msgType === "documentMessage" ||
      msgType === "stickerMessage" ||
      msgType === "buttonsResponseMessage" ||
      msgType === "buttonsMessage" ||
      msgType === "messageContextInfo" ||
      msgType === "locationMessage" ||
      msgType === "liveLocationMessage" ||
      msgType === "contactMessage" ||
      msgType === "voiceMessage" ||
      msgType === "mediaMessage" ||
      msgType === "contactsArrayMessage" ||
      msgType === "reactionMessage" ||
      msgType === "ephemeralMessage" ||
      msgType === "protocolMessage" ||
      msgType === "listResponseMessage" ||
      msgType === "listMessage" ||
      msgType === "viewOnceMessage" ||
      msgType === "documentWithCaptionMessage" ||
      msgType === "viewOnceMessageV2" ||
      msgType === "editedMessage" ||
      msgType === "advertisingMessage" ||
      msgType === "highlyStructuredMessage" ||
      msgType === "adMetaPreview"; // Adicionado para tratar mensagens de anúncios;


    if (!ifType) {
      logger.warn(`#### Nao achou o type em isValidMsg: ${msgType}
${JSON.stringify(msg?.message)}`);
      Sentry.setExtra("Mensagem", { BodyMsg: msg.message, msg, msgType });
      Sentry.captureException(new Error("Novo Tipo de Mensagem em isValidMsg"));
    }

    return !!ifType;
  } catch (error) {
    Sentry.setExtra("Error isValidMsg", { msg });
    Sentry.captureException(error);



  }
};

const sendDialogflowAwswer = async (
  wbot: Session,
  ticket: Ticket,
  msg: WAMessage,
  contact: Contact,
  inputAudio: string | undefined,
  companyId: number,
  queueIntegration: QueueIntegrations
) => {

  const session = await createDialogflowSessionWithModel(
    queueIntegration
  );

  if (session === undefined) {
    return;
  }

  wbot.presenceSubscribe(contact.remoteJid);
  await delay(500)

  let dialogFlowReply = await queryDialogFlow(
    session,
    queueIntegration.projectName,
    contact.remoteJid,
    getBodyMessage(msg),
    queueIntegration.language,
    inputAudio
  );

  if (!dialogFlowReply) {
    wbot.sendPresenceUpdate("composing", contact.remoteJid);

    const bodyDuvida = formatBody(`\u200e *${queueIntegration?.name}:* Não consegui entender sua dúvida.`)


    await delay(1000);

    await wbot.sendPresenceUpdate('paused', contact.remoteJid)

    const sentMessage = await wbot.sendMessage(
      `${contact.number}@c.us`, {
      text: bodyDuvida
    }
    );

    await verifyMessage(sentMessage, ticket, contact);
    return;
  }

  if (dialogFlowReply.endConversation) {
    await ticket.update({
      contactId: ticket.contact.id,
      useIntegration: false
    });
  }

  const image = dialogFlowReply.parameters.image?.stringValue ?? undefined;

  const react = dialogFlowReply.parameters.react?.stringValue ?? undefined;

  const audio = dialogFlowReply.encodedAudio.toString("base64") ?? undefined;

  wbot.sendPresenceUpdate("composing", contact.remoteJid);
  await delay(500);

  let lastMessage;

  for (let message of dialogFlowReply.responses) {
    lastMessage = message.text.text[0] ? message.text.text[0] : lastMessage;
  }
  for (let message of dialogFlowReply.responses) {
    if (message.text) {
      await sendDelayedMessages(
        wbot,
        ticket,
        contact,
        message.text.text[0],
        lastMessage,
        audio,
        queueIntegration
      );
    }
  }
};

async function sendDelayedMessages(
  wbot: Session,
  ticket: Ticket,
  contact: Contact,
  message: string,
  lastMessage: string,
  audio: string | undefined,
  queueIntegration: QueueIntegrations
) {
  const companyId = ticket.companyId;
  // console.log("GETTING WHATSAPP SEND DELAYED MESSAGES", ticket.whatsappId, wbot.id)
  const whatsapp = await ShowWhatsAppService(wbot.id!, companyId);
  const farewellMessage = whatsapp.farewellMessage.replace(/[_*]/g, "");


  // if (react) {
  //   const test =
  //     /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/g.test(
  //       react
  //     );
  //   if (test) {
  //     msg.react(react);
  //     await delay(1000);
  //   }
  // }
  const sentMessage = await wbot.sendMessage(
    `${contact.number}@c.us`, {
    text: `\u200e *${queueIntegration?.name}:* ` + message
  }
  );


  await verifyMessage(sentMessage, ticket, contact);
  if (message != lastMessage) {
    await delay(500);
    wbot.sendPresenceUpdate("composing", contact.remoteJid);
  } else if (audio) {
    wbot.sendPresenceUpdate("recording", contact.remoteJid);
    await delay(500);


    // if (audio && message === lastMessage) {
    //   const newMedia = new MessageMedia("audio/ogg", audio);

    //   const sentMessage = await wbot.sendMessage(
    //     `${contact.number}@c.us`,
    //     newMedia,
    //     {
    //       sendAudioAsVoice: true
    //     }
    //   );

    //   await verifyMessage(sentMessage, ticket, contact);
    // }

    // if (sendImage && message === lastMessage) {
    //   const newMedia = await MessageMedia.fromUrl(sendImage, {
    //     unsafeMime: true
    //   });
    //   const sentMessage = await wbot.sendMessage(
    //     `${contact.number}@c.us`,
    //     newMedia,
    //     {
    //       sendAudioAsVoice: true
    //     }
    //   );

    //   await verifyMessage(sentMessage, ticket, contact);
    //   await ticket.update({ lastMessage: "📷 Foto" });
    // }

    if (farewellMessage && message.includes(farewellMessage)) {
      await delay(1000);
      setTimeout(async () => {
        await ticket.update({
          contactId: ticket.contact.id,
          useIntegration: true
        });
        await UpdateTicketService({
          ticketId: ticket.id,
          ticketData: { status: "closed" },
          companyId: companyId
        });
      }, 3000);
    }
  }
}
const handleOutsideBusinessHours = async (
  wbot: Session,
  msg: proto.IWebMessageInfo,
  ticket: Ticket,
  contact: Contact,
  settings?: any,
  ticketTraking?: TicketTraking
): Promise<boolean> => {
  
  let selectedOption;
  selectedOption =
    msg?.message?.buttonsResponseMessage?.selectedButtonId ||
    msg?.message?.listResponseMessage?.singleSelectReply.selectedRowId ||
    getBodyMessage(msg);

    console.log("=== VERIFICAÇÃO DE HORÁRIO DE FUNCIONAMENTO ===");
    console.log("selectedOption:", selectedOption);
 
    try {
      // Verifica se o sistema de horário está ativado
      if (!settings?.scheduleType || settings.scheduleType === "disabled") {
        console.log("Sistema de horário desabilitado");
      return false;
      }

      let currentSchedule = null;
      let outOfHoursMessage = "";

      // Verifica o tipo de configuração e busca o horário apropriado
      if (settings.scheduleType === "company") {
        // Horário por empresa
        const company = await Company.findByPk(ticket.companyId);
        if (company) {
          currentSchedule = await VerifyCurrentSchedule(ticket.companyId, 0, 0);
          outOfHoursMessage = company.outOfHoursMessage;
          console.log("Verificando horário da empresa:", company.name);
        }
      } else if (settings.scheduleType === "queue" && ticket.queueId) {
        // Horário por fila
    const queue = await Queue.findByPk(ticket.queueId);
    if (queue) {
          currentSchedule = await VerifyCurrentSchedule(ticket.companyId, ticket.queueId, 0);
          outOfHoursMessage = queue.outOfHoursMessage;
          console.log("Verificando horário da fila:", queue.name);
        }
      } else if (settings.scheduleType === "connection" && ticket.whatsappId) {
        // Horário por conexão
        const whatsapp = await Whatsapp.findByPk(ticket.whatsappId);
        if (whatsapp) {
          currentSchedule = await VerifyCurrentSchedule(ticket.companyId, 0, ticket.whatsappId);
          outOfHoursMessage = whatsapp.outOfHoursMessage;
          console.log("Verificando horário da conexão:", whatsapp.name);
      }
      }

      console.log("Current Schedule:", currentSchedule);
      console.log("Out of Hours Message:", outOfHoursMessage);

      // Se não encontrou configuração ou está fora do horário
      if (!currentSchedule || !currentSchedule.inActivity) {
        console.log("ENVIANDO MENSAGEM DE AUSÊNCIA - Fora do horário de funcionamento");
        
        const defaultMessage = "Estamos fora do horário de funcionamento. Retornaremos em breve.";
        const messageToSend = outOfHoursMessage || defaultMessage;
        
        const textMessage = {
          text: formatBody(messageToSend, ticket),
        };

              await wbot.sendMessage(
          `${ticket?.contact?.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
          textMessage
        );

        // Marca o ticket como fora do horário
        await ticket.update({
          isOutOfHour: true
        });

        console.log("Mensagem de ausência enviada com sucesso");
        return true; // Retorna true indicando que está fora do horário
      } else {
        console.log("Dentro do horário de funcionamento");
        // Se estava marcado como fora do horário, remove a marcação
        if (ticket.isOutOfHour) {
          await ticket.update({
            isOutOfHour: false
          });
        }
      return false; // Retorna false indicando que está dentro do horário
      }
    } catch (error) {
      console.error("Erro ao verificar horário de funcionamento:", error);
    return false; // Em caso de erro, assume que está dentro do horário
  }
};

const verifyQueue = async (
  wbot: Session,
  msg: proto.IWebMessageInfo,
  ticket: Ticket,
  contact: Contact,
  settings?: any,
  ticketTraking?: TicketTraking,
) => {
  const companyId = ticket.companyId;

  console.log("verifyQueue")
  // console.log("GETTING WHATSAPP VERIFY QUEUE", ticket.whatsappId, wbot.id)
  const { queues, greetingMessage, maxUseBotQueues, timeUseBotQueues } = await ShowWhatsAppService(wbot.id!, companyId);
 
  
  let chatbot = false;

  if (queues.length === 1) {
    console.log("log... 1186")
    chatbot = queues[0]?.chatbots.length > 1;
  }

  const enableQueuePosition = settings.sendQueuePosition === "enabled";

  if (queues.length === 1 && !chatbot) {
    const sendGreetingMessageOneQueues = settings.sendGreetingMessageOneQueues === "enabled" || false;

    console.log("log... 1195")

    //inicia integração dialogflow/n8n
    if (
      !msg.key.fromMe &&
      !ticket.isGroup &&
      queues[0].integrationId
    ) {

      const integrations = await ShowQueueIntegrationService(queues[0].integrationId, companyId);

      console.log("log... 1206")

      await handleMessageIntegration(msg, wbot, companyId, integrations, ticket, contact, ticket)

      if (msg.key.fromMe) {
        console.log("log... 1211")

        await ticket.update({
          typebotSessionTime: moment().toDate(),
          useIntegration: true,
          integrationId: integrations.id
        })
      }
      else {
        await ticket.update({
          useIntegration: true,
          integrationId: integrations.id
        })
      }

      // return;
    }

    if (greetingMessage.length > 1 && sendGreetingMessageOneQueues) {
      console.log("log... 1226")
      const body = formatBody(`${greetingMessage}`, ticket);

      if (ticket.whatsapp.greetingMediaAttachment !== null) {
        const filePath = path.resolve("public", `company${companyId}`, ticket.whatsapp.greetingMediaAttachment);

        const fileExists = fs.existsSync(filePath);

        if (fileExists) {
          console.log("log... 1235")
          const messagePath = ticket.whatsapp.greetingMediaAttachment
          const optionsMsg = await getMessageOptions(messagePath, filePath, String(companyId), body);
          const debouncedSentgreetingMediaAttachment = debounce(
            async () => {

              const sentMessage = await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, { ...optionsMsg });

              await verifyMediaMessage(sentMessage, ticket, contact, ticketTraking, false, false, wbot);
            },
            1000,
            ticket.id
          );
          debouncedSentgreetingMediaAttachment();
        } else {
          console.log("log... 1250")
          await wbot.sendMessage(
            `${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
            {
              text: body
            }
          );
        }
      } else {
        console.log("log... 1259")
        await wbot.sendMessage(
          `${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
          {
            text: body
          }
        );
      }
    }

    if (!isNil(queues[0].fileListId)) {
      console.log("log... 1278")
      try {
        const publicFolder = path.resolve(__dirname, "..", "..", "..", "public");

        const files = await ShowFileService(queues[0].fileListId, ticket.companyId)

        const folder = path.resolve(publicFolder, `company${ticket.companyId}`, "fileList", String(files.id))

        for (const [index, file] of files.options.entries()) {
          const mediaSrc = {
            fieldname: 'medias',
            originalname: file.path,
            encoding: '7bit',
            mimetype: file.mediaType,
            filename: file.path,
            path: path.resolve(folder, file.path),
          } as Express.Multer.File

          await SendWhatsAppMedia({ media: mediaSrc, ticket, body: file.name, isPrivate: false, isForwarded: false });
        };

      } catch (error) {
        logger.info(error);
      }
    }

    if (queues[0].closeTicket) {
      console.log("log... 1297")
      await UpdateTicketService({
        ticketData: {
          status: "closed",
          queueId: queues[0].id,
          // sendFarewellMessage: false
        },
        ticketId: ticket.id,
        companyId
      });

      return;
    } else {
      console.log("log... 1310")
      await UpdateTicketService({
        ticketData: { queueId: queues[0].id, status: ticket.status === "lgpd" ? "pending" : ticket.status },
        ticketId: ticket.id,
        companyId
      });
    }

    const count = await Ticket.findAndCountAll({
      where: {
        userId: null,
        status: "pending",
        companyId,
        queueId: queues[0].id,
        isGroup: false
      }
    });

    if (enableQueuePosition) {
      console.log("log... 1329")
      // Lógica para enviar posição da fila de atendimento
      const qtd = count.count === 0 ? 1 : count.count
      const msgFila = `${settings.sendQueuePositionMessage} *${qtd}*`;
      // const msgFila = `*Assistente Virtual:*\n{{ms}} *{{name}}*, sua posição na fila de atendimento é: *${qtd}*`;
      const bodyFila = formatBody(`${msgFila}`, ticket);
      const debouncedSentMessagePosicao = debounce(
        async () => {
          await wbot.sendMessage(
            `${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"
            }`,
            {
              text: bodyFila
            }
          );
        },
        3000,
        ticket.id
      );
      debouncedSentMessagePosicao();
    }

    return;
  }


  // REGRA PARA DESABILITAR O BOT PARA ALGUM CONTATO
  if (contact.disableBot) {
    return;
  }

  let selectedOption = "";

  if (ticket.status !== "lgpd") {
    console.log("log... 1367")
    selectedOption =
      msg?.message?.buttonsResponseMessage?.selectedButtonId ||
      msg?.message?.listResponseMessage?.singleSelectReply.selectedRowId ||
      getBodyMessage(msg);
  } else {
    if (!isNil(ticket.lgpdAcceptedAt))
      await ticket.update({
        status: "pending"
      });

    await ticket.reload();
  }

  if (String(selectedOption).toLocaleLowerCase() == "sair") {
    // Encerra atendimento

    console.log("log... 1384")

    const ticketData = {
      isBot: false,
      status: "closed",
      sendFarewellMessage: true,
      maxUseBotQueues: 0
    };


    await UpdateTicketService({ ticketData, ticketId: ticket.id, companyId })
    // await ticket.update({ queueOptionId: null, chatbot: false, queueId: null, userId: null, status: "closed"});
    //await verifyQueue(wbot, msg, ticket, ticket.contact);

    // const complationMessage = ticket.whatsapp?.complationMessage;

    // console.log(complationMessage)
    // const textMessage = {
    //   text: formatBody(`\u200e${complationMessage}`, ticket),
    // };

    // if (!isNil(complationMessage)) {
    //   const sendMsg = await wbot.sendMessage(
    //     `${ticket?.contact?.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
    //     textMessage
    //   );

    //   await verifyMessage(sendMsg, ticket, ticket.contact);
    // }

    return;
  }

  let choosenQueue = (chatbot && queues.length === 1) ? queues[+selectedOption] : queues[+selectedOption - 1];

  console.log("log... 1419")

  const typeBot = settings?.chatBotType || "text";

  // Serviço p/ escolher consultor aleatório para o ticket, ao selecionar fila.
  let randomUserId;

  if (choosenQueue) {
    console.log("log... 1427")
    try {
      const userQueue = await ListUserQueueServices(choosenQueue.id);

      if (userQueue.userId > -1) {
        randomUserId = userQueue.userId;
      }

    } catch (error) {
      console.error(error);
    }
  }

  // Ativar ou desativar opção de escolher consultor aleatório.
  /*   let settings = await CompaniesSettings.findOne({
      where: {
        companyId: companyId
      }
    }); */

  const botText = async () => {

    console.log("log... 1449")

    if (choosenQueue || (queues.length === 1 && chatbot)) {
      console.log("log... 1452")
      // console.log("entrou no choose", ticket.isOutOfHour, ticketTraking.chatbotAt)
      if (queues.length === 1) choosenQueue = queues[0]
      const queue = await Queue.findByPk(choosenQueue.id);

      console.log("log... 1457")

      if (ticket.isOutOfHour === false && ticketTraking.chatbotAt !== null) {
        console.log("log... 1460")
        await ticketTraking.update({
          chatbotAt: null
        });
        await ticket.update({
          amountUsedBotQueues: 0
        });
      }

      let currentSchedule;

      if (settings?.scheduleType === "queue") {
        console.log("log... 1472")
        currentSchedule = await VerifyCurrentSchedule(companyId, queue.id, 0);
      }

      if (
        settings?.scheduleType === "queue" && ticket.status !== "open" &&
        !isNil(currentSchedule) && (ticket.amountUsedBotQueues < maxUseBotQueues || maxUseBotQueues === 0)
        && (!currentSchedule || currentSchedule.inActivity === false)
        && (!ticket.isGroup || ticket.whatsapp?.groupAsTicket === "enabled")
      ) {
        if (timeUseBotQueues !== "0") {
          console.log("log... 1483")
          //Regra para desabilitar o chatbot por x minutos/horas após o primeiro envio
          //const ticketTraking = await FindOrCreateATicketTrakingService({ ticketId: ticket.id, companyId });
          let dataLimite = new Date();
          let Agora = new Date();


          if (ticketTraking.chatbotAt !== null) {
            console.log("log... 1491")
            dataLimite.setMinutes(ticketTraking.chatbotAt.getMinutes() + (Number(timeUseBotQueues)));

            if (ticketTraking.chatbotAt !== null && Agora < dataLimite && timeUseBotQueues !== "0" && ticket.amountUsedBotQueues !== 0) {
              return
            }
          }
          await ticketTraking.update({
            chatbotAt: null
          })
        }
        
        const outOfHoursMessage = queue.outOfHoursMessage;
        console.log("outOfHoursMessage",outOfHoursMessage)
        if (outOfHoursMessage !== "") {
          // console.log("entrei3");
          const body = formatBody(`${outOfHoursMessage}`, ticket);

          console.log("log... 1509")

          const debouncedSentMessage = debounce(
            async () => {
              await wbot.sendMessage(
                `${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"
                }`,
                {
                  text: body
                }
              );
            },
            1000,
            ticket.id
          );
          debouncedSentMessage();

          //atualiza o contador de vezes que enviou o bot e que foi enviado fora de hora
          // await ticket.update({
          //   queueId: queue.id,
          //   isOutOfHour: true,
          //   amountUsedBotQueues: ticket.amountUsedBotQueues + 1
          // });

          // return;

        }
        //atualiza o contador de vezes que enviou o bot e que foi enviado fora de hora
        await ticket.update({
          queueId: queue.id,
          isOutOfHour: true,
          amountUsedBotQueues: ticket.amountUsedBotQueues + 1
        });
        return;
      }

      await UpdateTicketService({
        ticketData: {
          // amountUsedBotQueues: 0, 
          queueId: choosenQueue.id
        },
        // ticketData: { queueId: queues.length ===1 ? null : choosenQueue.id },
        ticketId: ticket.id,
        companyId
      });
      // }

      if (choosenQueue.chatbots.length > 0 && !ticket.isGroup) {
        console.log("log... 1554")
        let options = "";
        choosenQueue.chatbots.forEach((chatbot, index) => {
          options += `*[ ${index + 1} ]* - ${chatbot.name}\n`;
        });

        const body = formatBody(
          `\u200e ${choosenQueue.greetingMessage}\n\n${options}\n*[ # ]* Voltar para o menu principal\n*[ Sair ]* Encerrar atendimento`,
          ticket
        );

        const sentMessage = await wbot.sendMessage(
          `${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,

          {
            text: body
          }
        );

        await verifyMessage(sentMessage, ticket, contact, ticketTraking);

        if (settings?.settingsUserRandom === "enabled") {
          console.log("log... 1576")
          await UpdateTicketService({
            ticketData: { userId: randomUserId },
            ticketId: ticket.id,
            companyId
          });
        }
      }

      if (!choosenQueue.chatbots.length && choosenQueue.greetingMessage.length !== 0) {
        console.log("log... 1586")
        console.log(choosenQueue.greetingMessage)
        const body = formatBody(
          `\u200e${choosenQueue.greetingMessage}`,
          ticket
        );
        const sentMessage = await wbot.sendMessage(
          `${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
          {
            text: body
          }
        );

        await verifyMessage(sentMessage, ticket, contact, ticketTraking);

      }


      if (!isNil(choosenQueue.fileListId)) {
        try {

          const publicFolder = path.resolve(__dirname, "..", "..", "..", "public");

          const files = await ShowFileService(choosenQueue.fileListId, ticket.companyId)

          const folder = path.resolve(publicFolder, `company${ticket.companyId}`, "fileList", String(files.id))

          for (const [index, file] of files.options.entries()) {
            const mediaSrc = {
              fieldname: 'medias',
              originalname: file.path,
              encoding: '7bit',
              mimetype: file.mediaType,
              filename: file.path,
              path: path.resolve(folder, file.path),
            } as Express.Multer.File

            // const debouncedSentMessagePosicao = debounce(
            //   async () => {
            const sentMessage = await SendWhatsAppMedia({ media: mediaSrc, ticket, body: `\u200e ${file.name}`, isPrivate: false, isForwarded: false });

            await verifyMediaMessage(sentMessage, ticket, ticket.contact, ticketTraking, false, false, wbot);
            //   },
            //   2000,
            //   ticket.id
            // );
            // debouncedSentMessagePosicao();
          };


        } catch (error) {
          logger.info(error);
        }
      }

      await delay(4000)


      //se fila está parametrizada para encerrar ticket automaticamente
      if (choosenQueue.closeTicket) {
        try {

          await UpdateTicketService({
            ticketData: {
              status: "closed",
              queueId: choosenQueue.id,
              // sendFarewellMessage: false,
            },
            ticketId: ticket.id,
            companyId,
          });
        } catch (error) {
          logger.info(error);
        }

        return;
      }

      const count = await Ticket.findAndCountAll({
        where: {
          userId: null,
          status: "pending",
          companyId,
          queueId: choosenQueue.id,
          whatsappId: wbot.id,
          isGroup: false
        }
      });

      console.log("======== choose queue ========")
      await CreateLogTicketService({
        ticketId: ticket.id,
        type: "queue",
        queueId: choosenQueue.id
      });

      if (enableQueuePosition && !choosenQueue.chatbots.length) {
        // Lógica para enviar posição da fila de atendimento
        const qtd = count.count === 0 ? 1 : count.count
        const msgFila = `${settings.sendQueuePositionMessage} *${qtd}*`;
        // const msgFila = `*Assistente Virtual:*\n{{ms}} *{{name}}*, sua posição na fila de atendimento é: *${qtd}*`;
        const bodyFila = formatBody(`${msgFila}`, ticket);
        const debouncedSentMessagePosicao = debounce(
          async () => {
            await wbot.sendMessage(
              `${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"
              }`,
              {
                text: bodyFila
              }
            );
          },
          3000,
          ticket.id
        );
        debouncedSentMessagePosicao();
      }


    } else {

      if (ticket.isGroup) return;

      if (maxUseBotQueues && maxUseBotQueues !== 0 && ticket.amountUsedBotQueues >= maxUseBotQueues) {
        // await UpdateTicketService({
        //   ticketData: { queueId: queues[0].id },
        //   ticketId: ticket.id
        // });

        return;
      }

      if (timeUseBotQueues !== "0") {
        //Regra para desabilitar o chatbot por x minutos/horas após o primeiro envio
        //const ticketTraking = await FindOrCreateATicketTrakingService({ ticketId: ticket.id, companyId });
        let dataLimite = new Date();
        let Agora = new Date();

        console.log("log... 1749")

        if (ticketTraking.chatbotAt !== null) {
          dataLimite.setMinutes(ticketTraking.chatbotAt.getMinutes() + (Number(timeUseBotQueues)));
          console.log("log... 1754")

          if (ticketTraking.chatbotAt !== null && Agora < dataLimite && timeUseBotQueues !== "0" && ticket.amountUsedBotQueues !== 0) {
            return
          }
        }
        await ticketTraking.update({
          chatbotAt: null
        })
      }

      // if (wbot.waitForSocketOpen()) {
      //   console.log("AGUARDANDO")
      //   console.log(wbot.waitForSocketOpen())
      // }

      wbot.presenceSubscribe(contact.remoteJid);


      let options = "";

      wbot.sendPresenceUpdate("composing", contact.remoteJid);

      console.log("============= queue menu =============")
      queues.forEach((queue, index) => {
        options += `*[ ${index + 1} ]* - ${queue.name}\n`;
      });
      options += `\n*[ Sair ]* - Encerrar atendimento`;

      const body = formatBody(
        `\u200e${greetingMessage}\n\n${options}`,
        ticket
      );

      await CreateLogTicketService({
        ticketId: ticket.id,
        type: "chatBot"
      });

      await delay(1000);

      await wbot.sendPresenceUpdate('paused', contact.remoteJid)

      if (ticket.whatsapp.greetingMediaAttachment !== null) {

        console.log("log... 1799")

        const filePath = path.resolve("public", `company${companyId}`, ticket.whatsapp.greetingMediaAttachment);

        const fileExists = fs.existsSync(filePath);
        // console.log(fileExists);
        if (fileExists) {
          const messagePath = ticket.whatsapp.greetingMediaAttachment
          const optionsMsg = await getMessageOptions(messagePath, filePath, String(companyId), body);

          console.log("log... 1809")

          const debouncedSentgreetingMediaAttachment = debounce(
            async () => {

              let sentMessage = await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, { ...optionsMsg });

              await verifyMediaMessage(sentMessage, ticket, contact, ticketTraking, false, false, wbot);

            },
            1000,
            ticket.id
          );
          debouncedSentgreetingMediaAttachment();
        } else {
          console.log("log... 1824")
          const debouncedSentMessage = debounce(
            async () => {
              const sentMessage = await wbot.sendMessage(
                `${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
                {
                  text: body
                }
              );

              await verifyMessage(sentMessage, ticket, contact, ticketTraking);
            },
            1000,
            ticket.id
          );
          debouncedSentMessage();

        }

        console.log("log... 1843")

        await UpdateTicketService({
          ticketData: {
            // amountUsedBotQueues: ticket.amountUsedBotQueues + 1 
          },
          ticketId: ticket.id,
          companyId
        });

        return
      } else {

        console.log("log... 1854")

        const debouncedSentMessage = debounce(
          async () => {
            const sentMessage = await wbot.sendMessage(
              `${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
              {
                text: body
              }
            );

            await verifyMessage(sentMessage, ticket, contact, ticketTraking);
          },
          1000,
          ticket.id
        );

        await UpdateTicketService({
          ticketData: {

          },
          ticketId: ticket.id,
          companyId
        });

        debouncedSentMessage();
      }
    }
  };


  if (typeBot === "text") {
    return botText();
  }

  if (typeBot === "button" && queues.length > 3) {
    return botText();
  }

};

export const verifyRating = (ticketTraking: TicketTraking) => {
  if (
    ticketTraking &&
    ticketTraking.finishedAt === null &&
    ticketTraking.closedAt !== null &&
    ticketTraking.userId !== null &&
    ticketTraking.ratingAt === null
  ) {
    return true;
  }
  return false;
};

export const handleRating = async (
  rate: number,
  ticket: Ticket,
  ticketTraking: TicketTraking
) => {
  const io = getIO();
  const companyId = ticket.companyId;

  // console.log("GETTING WHATSAPP HANDLE RATING", ticket.whatsappId, ticket.id)
  const { complationMessage } = await ShowWhatsAppService(
    ticket.whatsappId,

    companyId
  );

  let finalRate = rate;

  if (rate < 0) {
    finalRate = 0;
  }
  if (rate > 10) {
    finalRate = 10;
  }

  await UserRating.create({
    ticketId: ticketTraking.ticketId,
    companyId: ticketTraking.companyId,
    userId: ticketTraking.userId,
    rate: finalRate,
  });

  if (!isNil(complationMessage) && complationMessage !== "" && !ticket.isGroup) {
    const body = formatBody(`\u200e${complationMessage}`, ticket);
    if (ticket.channel === "whatsapp") {
      const msg = await SendWhatsAppMessage({ body, ticket });

      await verifyMessage(msg, ticket, ticket.contact, ticketTraking);

    }

    if (["facebook", "instagram"].includes(ticket.channel)) {
      await sendFaceMessage({ body, ticket });
    }
  }

  await ticket.update({
    isBot: false,
    status: "closed",
    amountUsedBotQueuesNPS: 0
  });

  //loga fim de atendimento
  await CreateLogTicketService({
    userId: ticket.userId,
    queueId: ticket.queueId,
    ticketId: ticket.id,
    type: "closed"
  });

  io.of(String(companyId))
    // .to("open")
    .emit(`company-${companyId}-ticket`, {
      action: "delete",
      ticket,
      ticketId: ticket.id,
    });

  io.of(String(companyId))
    // .to(ticket.status)
    // .to(ticket.id.toString())
    .emit(`company-${companyId}-ticket`, {
      action: "update",
      ticket,
      ticketId: ticket.id
    });

};

const sanitizeName = (name: string): string => {
  let sanitized = name.split(" ")[0];
  sanitized = sanitized.replace(/[^a-zA-Z0-9]/g, "");
  return sanitized.substring(0, 60);
};

const deleteFileSync = (path: string): void => {
  try {
    fs.unlinkSync(path);
  } catch (error) {
    console.error("Erro ao deletar o arquivo:", error);
  }
};

const convertTextToSpeechAndSaveToFile = (
  text: string,
  filename: string,
  subscriptionKey: string,
  serviceRegion: string,
  voice: string = "pt-BR-FabioNeural",
  audioToFormat: string = "mp3"
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const speechConfig = SpeechConfig.fromSubscription(
      subscriptionKey,
      serviceRegion
    );
    speechConfig.speechSynthesisVoiceName = voice;
    const audioConfig = AudioConfig.fromAudioFileOutput(`${filename}.wav`);
    const synthesizer = new SpeechSynthesizer(speechConfig, audioConfig);
    synthesizer.speakTextAsync(
      text,
      result => {
        if (result) {
          convertWavToAnotherFormat(
            `${filename}.wav`,
            `${filename}.${audioToFormat}`,
            audioToFormat
          )
            .then(output => {
              resolve();
            })
            .catch(error => {
              console.error(error);
              reject(error);
            });
        } else {
          reject(new Error("No result from synthesizer"));
        }
        synthesizer.close();
      },
      error => {
        console.error(`Error: ${error}`);
        synthesizer.close();
        reject(error);
      }
    );
  });
};

const convertWavToAnotherFormat = (
  inputPath: string,
  outputPath: string,
  toFormat: string
) => {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(inputPath)
      .toFormat(toFormat)
      .on("end", () => resolve(outputPath))
      .on("error", (err: { message: any }) =>
        reject(new Error(`Error converting file: ${err.message}`))
      )
      .save(outputPath);
  });
};

const keepOnlySpecifiedChars = (str: string) => {
  return str.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚâêîôûÂÊÎÔÛãõÃÕçÇ!?.,;:\s]/g, "");
};

const handleOpenAi = async (
  msg: proto.IWebMessageInfo,
  wbot: Session,
  ticket: Ticket,
  contact: Contact,
  mediaSent: Message | undefined,
  ticketTraking: TicketTraking
): Promise<void> => {

  // REGRA PARA DESABILITAR O BOT PARA ALGUM CONTATO
  if (contact.disableBot) {
    return;
  }
  const bodyMessage = getBodyMessage(msg);
  if (!bodyMessage) return;
  // console.log("GETTING WHATSAPP HANDLE OPENAI", ticket.whatsappId, ticket.id)
  const { prompt } = await ShowWhatsAppService(wbot.id, ticket.companyId);


  if (!prompt) return;

  if (msg.messageStubType) return;

  const publicFolder: string = path.resolve(
    __dirname,
    "..",
    "..",
    "..",
    "public",
    `company${ticket.companyId}`
  );

  let openai: OpenAI | any;
  const openAiIndex = sessionsOpenAi.findIndex(s => s.id === ticket.id);

  if (openAiIndex === -1) {
    // const configuration = new Configuration({
    //   apiKey: prompt.apiKey
    // });
    openai = new OpenAI({ apiKey: prompt.apiKey });
    openai.id = ticket.id;
    sessionsOpenAi.push(openai);
  } else {
    openai = sessionsOpenAi[openAiIndex];
  }

  const messages = await Message.findAll({
    where: { ticketId: ticket.id },
    order: [["createdAt", "ASC"]],
    limit: prompt.maxMessages
  });

  const promptSystem = `Nas respostas utilize o nome ${sanitizeName(
    contact.name || "Amigo(a)"
  )} para identificar o cliente.\nSua resposta deve usar no máximo ${prompt.maxTokens
    } tokens e cuide para não truncar o final.\nSempre que possível, mencione o nome dele para ser mais personalizado o atendimento e mais educado. Quando a resposta requer uma transferência para o setor de atendimento, comece sua resposta com 'Ação: Transferir para o setor de atendimento'.\n
  ${prompt.prompt}\n`;

  let messagesOpenAi = [];

  if (msg.message?.conversation || msg.message?.extendedTextMessage?.text) {
    messagesOpenAi = [];
    messagesOpenAi.push({ role: "system", content: promptSystem });
    for (
      let i = 0;
      i < Math.min(prompt.maxMessages, messages.length);
      i++
    ) {
      const message = messages[i];
      if (message.mediaType === "conversation" || message.mediaType === "extendedTextMessage") {
        if (message.fromMe) {
          messagesOpenAi.push({ role: "assistant", content: message.body });
        } else {
          messagesOpenAi.push({ role: "user", content: message.body });
        }
      }
    }
    messagesOpenAi.push({ role: "user", content: bodyMessage! });

    const chat = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-1106",
      messages: messagesOpenAi,
      max_tokens: prompt.maxTokens,
      temperature: prompt.temperature
    });

    let response = chat.choices[0].message?.content;

    if (response?.includes("Ação: Transferir para o setor de atendimento")) {
      await transferQueue(prompt.queueId, ticket, contact);
      response = response
        .replace("Ação: Transferir para o setor de atendimento", "")
        .trim();
    }

    if (prompt.voice === "texto") {
      const sentMessage = await wbot.sendMessage(msg.key.remoteJid!, {
        text: `\u200e ${response!}`
      });
      await verifyMessage(sentMessage!, ticket, contact);
    } else {
      const fileNameWithOutExtension = `${ticket.id}_${Date.now()}`;
      convertTextToSpeechAndSaveToFile(
        keepOnlySpecifiedChars(response!),
        `${publicFolder}/${fileNameWithOutExtension}`,
        prompt.voiceKey,
        prompt.voiceRegion,
        prompt.voice,
        "mp3"
      ).then(async () => {
        try {
          const sendMessage = await wbot.sendMessage(msg.key.remoteJid!, {
            audio: { url: `${publicFolder}/${fileNameWithOutExtension}.mp3` },
            mimetype: "audio/mpeg",
            ptt: true
          });
          await verifyMediaMessage(sendMessage!, ticket, contact, ticketTraking, false, false, wbot);
          deleteFileSync(`${publicFolder}/${fileNameWithOutExtension}.mp3`);
          deleteFileSync(`${publicFolder}/${fileNameWithOutExtension}.wav`);
        } catch (error) {
          console.log(`Erro para responder com audio: ${error}`);
        }
      });
    }
  } else if (msg.message?.audioMessage) {
    const mediaUrl = mediaSent!.mediaUrl!.split("/").pop();
    const file = fs.createReadStream(`${publicFolder}/${mediaUrl}`) as any;

    const transcription = await openai.audio.transcriptions.create({
      model: "whisper-1",
      file: file,
    });

    messagesOpenAi = [];
    messagesOpenAi.push({ role: "system", content: promptSystem });
    for (
      let i = 0;
      i < Math.min(prompt.maxMessages, messages.length);
      i++
    ) {
      const message = messages[i];
      if (message.mediaType === "conversation" || message.mediaType === "extendedTextMessage") {
        if (message.fromMe) {
          messagesOpenAi.push({ role: "assistant", content: message.body });
        } else {
          messagesOpenAi.push({ role: "user", content: message.body });
        }
      }
    }
    messagesOpenAi.push({ role: "user", content: transcription.text });
    const chat = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-1106",
      messages: messagesOpenAi,
      max_tokens: prompt.maxTokens,
      temperature: prompt.temperature
    });
    let response = chat.choices[0].message?.content;

    if (response?.includes("Ação: Transferir para o setor de atendimento")) {
      await transferQueue(prompt.queueId, ticket, contact);
      response = response
        .replace("Ação: Transferir para o setor de atendimento", "")
        .trim();
    }
    if (prompt.voice === "texto") {
      const sentMessage = await wbot.sendMessage(msg.key.remoteJid!, {
        text: `\u200e ${response!}`
      });
      await verifyMessage(sentMessage!, ticket, contact);
    } else {
      const fileNameWithOutExtension = `${ticket.id}_${Date.now()}`;
      convertTextToSpeechAndSaveToFile(
        keepOnlySpecifiedChars(response!),
        `${publicFolder}/${fileNameWithOutExtension}`,
        prompt.voiceKey,
        prompt.voiceRegion,
        prompt.voice,
        "mp3"
      ).then(async () => {
        try {
          const sendMessage = await wbot.sendMessage(msg.key.remoteJid!, {
            audio: { url: `${publicFolder}/${fileNameWithOutExtension}.mp3` },
            mimetype: "audio/mpeg",
            ptt: true
          });
          await verifyMediaMessage(sendMessage!, ticket, contact, ticketTraking, false, false, wbot);
          deleteFileSync(`${publicFolder}/${fileNameWithOutExtension}.mp3`);
          deleteFileSync(`${publicFolder}/${fileNameWithOutExtension}.wav`);
        } catch (error) {
          console.log(`Erro para responder com audio: ${error}`);
        }
      });
    }
  }
  messagesOpenAi = [];
};

const transferQueue = async (
  queueId: number,
  ticket: Ticket,
  contact: Contact
): Promise<void> => {
  await UpdateTicketService({
    ticketData: { queueId: queueId },
    ticketId: ticket.id,
    companyId: ticket.companyId
  });
};

const flowbuilderIntegration = async (
  msg: proto.IWebMessageInfo,
  wbot: Session,
  companyId: number,
  queueIntegration: QueueIntegrations,
  ticket: Ticket,
  contact: Contact,
  isFirstMsg?: Ticket,
  isTranfered?: boolean
) => {

  const io = getIO();
  const quotedMsg = await verifyQuotedMessage(msg);
  const body = getBodyMessage(msg);

  /*
  const messageData = {
    wid: msg.key.id,
    ticketId: ticket.id,
    contactId: msg.key.fromMe ? undefined : contact.id,
    body: body,
    fromMe: msg.key.fromMe,
    read: msg.key.fromMe,
    quotedMsgId: quotedMsg?.id,
    ack: Number(String(msg.status).replace('PENDING', '2').replace('NaN', '1')) || 2,
    remoteJid: msg.key.remoteJid,
    participant: msg.key.participant,
    dataJson: JSON.stringify(msg),
    createdAt: new Date(
      Math.floor(getTimestampMessage(msg.messageTimestamp) * 1000)
    ).toISOString(),
    ticketImported: ticket.imported,
  };


  await CreateMessageService({ messageData, companyId: ticket.companyId });

  */


  if (!msg.key.fromMe && ticket.status === "closed") {
    console.log("===== CHANGE =====")
    await ticket.update({ status: "pending" });
    await ticket.reload({
      include: [
        { model: Queue, as: "queue" },
        { model: User, as: "user" },
        { model: Contact, as: "contact" }
      ]
    });
    await UpdateTicketService({
      ticketData: { status: "pending", integrationId: ticket.integrationId },
      ticketId: ticket.id,
      companyId
    });

    io.of(String(companyId))
      .emit(`company-${companyId}-ticket`, {
        action: "delete",
        ticket,
        ticketId: ticket.id
      });

    io.to(ticket.status)
      .emit(`company-${companyId}-ticket`, {
        action: "update",
        ticket,
        ticketId: ticket.id
      });
  }

  if (msg.key.fromMe) {
    return;
  }

  const whatsapp = await ShowWhatsAppService(wbot.id!, companyId);


  console.log("whatsappId", whatsapp.id)

  const listPhrase = await FlowCampaignModel.findAll({
    where: {
      whatsappId: whatsapp.id,
    }
  });

  
  if (
    !isFirstMsg &&
    listPhrase.filter(item => item.phrase === body).length === 0
  ) {

    const flow = await FlowBuilderModel.findOne({
      where: {
        id: whatsapp.flowIdWelcome
      }
    });
    if (flow) {

      const nodes: INodes[] = flow.flow["nodes"];
      const connections: IConnections[] = flow.flow["connections"];

      const mountDataContact = {
        number: contact.number,
        name: contact.name,
        email: contact.email
      };

      // const worker = new Worker("./src/services/WebhookService/WorkerAction.ts");


      // // Enviar as variáveis como parte da mensagem para o Worker
      // console.log('DISPARO1')
      // const data = {
      //   idFlowDb: flowUse.flowIdWelcome,
      //   companyId: ticketUpdate.companyId,
      //   nodes: nodes,
      //   connects: connections,
      //   nextStage: flow.flow["nodes"][0].id,
      //   dataWebhook: null,
      //   details: "",
      //   hashWebhookId: "",
      //   pressKey: null,
      //   idTicket: ticketUpdate.id,
      //   numberPhrase: mountDataContact
      // };
      // worker.postMessage(data);
      // worker.on("message", message => {
      //   console.log(`Mensagem do worker: ${message}`);
      // });

      await ActionsWebhookService(
        whatsapp.id,
        whatsapp.flowIdWelcome,
        ticket.companyId,
        nodes,
        connections,
        flow.flow["nodes"][0].id,
        null,
        "",
        "",
        null,
        ticket.id,
        mountDataContact
      );

    }
  }



  const dateTicket = new Date(isFirstMsg?.updatedAt ? isFirstMsg.updatedAt : "");
  const dateNow = new Date();
  const diferencaEmMilissegundos = Math.abs(
    differenceInMilliseconds(dateTicket, dateNow)
  );
  const seisHorasEmMilissegundos = 1000;

  if (
    listPhrase.filter(item => item.phrase === body).length === 0 &&
    diferencaEmMilissegundos >= seisHorasEmMilissegundos &&
    isFirstMsg
  ) {
    console.log("2427", "handleMessageIntegration")

    const flow = await FlowBuilderModel.findOne({
      where: {
        id: whatsapp.flowIdNotPhrase
      }
    });


    if (flow) {

      const nodes: INodes[] = flow.flow["nodes"];
      const connections: IConnections[] = flow.flow["connections"];

      const mountDataContact = {
        number: contact.number,
        name: contact.name,
        email: contact.email
      };

      await ActionsWebhookService(
        whatsapp.id,
        whatsapp.flowIdNotPhrase,
        ticket.companyId,
        nodes,
        connections,
        flow.flow["nodes"][0].id,
        null,
        "",
        "",
        null,
        ticket.id,
        mountDataContact
      );

    }
  }


  // Campaign fluxo
  if (listPhrase.filter(item => item.phrase === body).length !== 0) {
    console.log("2470", "handleMessageIntegration")
    const flowDispar = listPhrase.filter(item => item.phrase === body)[0];
    const flow = await FlowBuilderModel.findOne({
      where: {
        id: flowDispar.flowId
      }
    });
    const nodes: INodes[] = flow.flow["nodes"];
    const connections: IConnections[] = flow.flow["connections"];

    const mountDataContact = {
      number: contact.number,
      name: contact.name,
      email: contact.email
    };

    //const worker = new Worker("./src/services/WebhookService/WorkerAction.ts");

    //console.log('DISPARO3')
    // Enviar as variáveis como parte da mensagem para o Worker
    // const data = {
    //   idFlowDb: flowDispar.flowId,
    //   companyId: ticketUpdate.companyId,
    //   nodes: nodes,
    //   connects: connections,
    //   nextStage: flow.flow["nodes"][0].id,
    //   dataWebhook: null,
    //   details: "",
    //   hashWebhookId: "",
    //   pressKey: null,
    //   idTicket: ticketUpdate.id,
    //   numberPhrase: mountDataContact
    // };
    // worker.postMessage(data);

    // worker.on("message", message => {
    //   console.log(`Mensagem do worker: ${message}`);
    // });

    await ActionsWebhookService(
      whatsapp.id,
      flowDispar.flowId,
      ticket.companyId,
      nodes,
      connections,
      flow.flow["nodes"][0].id,
      null,
      "",
      "",
      null,
      ticket.id,
      mountDataContact
    );
    return
  }

  if (ticket.flowWebhook) {
    const webhook = await WebhookModel.findOne({
      where: {
        company_id: ticket.companyId,
        hash_id: ticket.hashFlowId
      }
    });

    if (webhook && webhook.config["details"]) {
      const flow = await FlowBuilderModel.findOne({
        where: {
          id: webhook.config["details"].idFlow
        }
      });
      const nodes: INodes[] = flow.flow["nodes"];
      const connections: IConnections[] = flow.flow["connections"];

      // const worker = new Worker("./src/services/WebhookService/WorkerAction.ts");

      // console.log('DISPARO4')
      // // Enviar as variáveis como parte da mensagem para o Worker
      // const data = {
      //   idFlowDb: webhook.config["details"].idFlow,
      //   companyId: ticketUpdate.companyId,
      //   nodes: nodes,
      //   connects: connections,
      //   nextStage: ticketUpdate.lastFlowId,
      //   dataWebhook: ticketUpdate.dataWebhook,
      //   details: webhook.config["details"],
      //   hashWebhookId: ticketUpdate.hashFlowId,
      //   pressKey: body,
      //   idTicket: ticketUpdate.id,
      //   numberPhrase: ""
      // };
      // worker.postMessage(data);

      // worker.on("message", message => {
      //   console.log(`Mensagem do worker: ${message}`);
      // });

      await ActionsWebhookService(
        whatsapp.id,
        webhook.config["details"].idFlow,
        ticket.companyId,
        nodes,
        connections,
        ticket.lastFlowId,
        ticket.dataWebhook,
        webhook.config["details"],
        ticket.hashFlowId,
        body,
        ticket.id
      );
    } else {
      console.log("2586", "handleMessageIntegration")
      const flow = await FlowBuilderModel.findOne({
        where: {
          id: ticket.flowStopped
        }
      });

      const nodes: INodes[] = flow.flow["nodes"];
      const connections: IConnections[] = flow.flow["connections"];

      if (!ticket.lastFlowId) {
        return
      }

      const mountDataContact = {
        number: contact.number,
        name: contact.name,
        email: contact.email
      };

      // const worker = new Worker("./src/services/WebhookService/WorkerAction.ts");

      // console.log('DISPARO5')
      // // Enviar as variáveis como parte da mensagem para o Worker
      // const data = {
      //   idFlowDb: parseInt(ticketUpdate.flowStopped),
      //   companyId: ticketUpdate.companyId,
      //   nodes: nodes,
      //   connects: connections,
      //   nextStage: ticketUpdate.lastFlowId,
      //   dataWebhook: null,
      //   details: "",
      //   hashWebhookId: "",
      //   pressKey: body,
      //   idTicket: ticketUpdate.id,
      //   numberPhrase: mountDataContact
      // };
      // worker.postMessage(data);
      // worker.on("message", message => {
      //   console.log(`Mensagem do worker: ${message}`);
      // });

      await ActionsWebhookService(
        whatsapp.id,
        parseInt(ticket.flowStopped),
        ticket.companyId,
        nodes,
        connections,
        ticket.lastFlowId,
        null,
        "",
        "",
        body,
        ticket.id,
        mountDataContact
      );
    }
  }

}
export const handleMessageIntegration = async (
  msg: proto.IWebMessageInfo,
  wbot: Session,
  companyId: number,
  queueIntegration: QueueIntegrations,
  ticket: Ticket,
  contact: Contact,
  isFirstMsg?: Ticket,
  isTranfered?: boolean
): Promise<void> => {
  const msgType = getTypeMessage(msg);

  if (queueIntegration.type === "n8n" || queueIntegration.type === "webhook") {
    if (queueIntegration?.urlN8N) {
      const options = {
        method: "POST",
        url: queueIntegration?.urlN8N,
        headers: {
          "Content-Type": "application/json"
        },
        json: msg
      };
      
      setTimeout(async () => {
        await wbot.sendPresenceUpdate("composing", contact.remoteJid);
        
        try {
          request(options, function (error, response) {
            if (error) {
              throw new Error(error);
            }
            else {
              console.log(response.body);
            }
          });
        } catch (error) {
          throw new Error(error);
        }
      }, 10000);
    }

  } else if (queueIntegration.type === "dialogflow") {
    let inputAudio: string | undefined;

    if (msgType === "audioMessage") {
      let filename = `${msg.messageTimestamp}.ogg`;
      readFile(
        join(__dirname, "..", "..", "..", "public", `company${companyId}`, filename),
        "base64",
        (err, data) => {
          inputAudio = data;
          if (err) {
            logger.error(err);
          }
        }
      );
    } else {
      inputAudio = undefined;
    }

    const debouncedSentMessage = debounce(
      async () => {
        await sendDialogflowAwswer(
          wbot,
          ticket,
          msg,
          ticket.contact,
          inputAudio,
          companyId,
          queueIntegration
        );
      },
      500,
      ticket.id
    );
    debouncedSentMessage();
  } else if (queueIntegration.type === "typebot") {
    // await typebots(ticket, msg, wbot, queueIntegration);
    await typebotListener({ ticket, msg, wbot, typebot: queueIntegration });
  } else if (queueIntegration.type === "gemini") {
    await handleGeminiIntegration(
      msg,
      wbot,
      ticket,
      contact,
      queueIntegration
    );
  }
}

// Sessões do Gemini para cada ticket
const sessionsGemini = [];

const handleGeminiIntegration = async (
  msg: proto.IWebMessageInfo,
  wbot: Session,
  ticket: Ticket,
  contact: Contact,
  queueIntegration: QueueIntegrations
): Promise<void> => {
  console.log(`[Gemini] Iniciando handleGeminiIntegration para ticket ${ticket.id}`);
  try {
    // Obter a mensagem do corpo
    const bodyMessage = getBodyMessage(msg);
    if (!bodyMessage) {
      console.log("[Gemini] Mensagem sem corpo. Abortando.");
      return;
    }
    console.log(`[Gemini] Corpo da mensagem: ${bodyMessage}`);
    
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
      console.error("[Gemini] API key do Gemini não configurada. Abortando.");
      // Poderia enviar uma mensagem para o usuário avisando? Talvez não seja ideal.
      return;
    }
    console.log("[Gemini] API Key encontrada.");
    
    // Verificar se existe um número de telefone para teste configurado
    if (queueIntegration.geminiTestPhone && queueIntegration.geminiTestPhone.trim() !== '') {
      // Limpar números para comparação removendo caracteres não numéricos
      const cleanTestPhone = queueIntegration.geminiTestPhone.replace(/\D/g, '');
      const cleanContactPhone = contact.number.replace(/\D/g, '');
      
      console.log(`[Gemini] Verificando número de teste: ${cleanTestPhone} vs contato: ${cleanContactPhone}`);
      
      // Se o número de contato não corresponder ao número de teste, abortar
      if (cleanTestPhone !== cleanContactPhone) {
        console.log("[Gemini] Número do contato não corresponde ao número de teste configurado. Abortando.");
        return;
      }
      
      console.log("[Gemini] Número de teste validado. Prosseguindo com a integração.");
    }
    
    // Enviar status "digitando" para o WhatsApp
    await wbot.sendPresenceUpdate("composing", contact.remoteJid);
    console.log("[Gemini] Status 'composing' enviado.");
    
    // Fazer uma requisição HTTP para a API do Gemini em vez de usar o SDK
    const axios = require('axios');
    
    // Buscar mensagens anteriores para contexto
    console.log(`[Gemini] Buscando últimas ${queueIntegration.geminiMaxMessages || 20} mensagens para contexto.`);
    const messages = await Message.findAll({
      where: { ticketId: ticket.id },
      order: [["createdAt", "ASC"]],
      limit: queueIntegration.geminiMaxMessages || 20
    });
    console.log(`[Gemini] ${messages.length} mensagens encontradas.`);
    
    // Construir o prompt do sistema
    const promptSystem = `Suas respostas devem ser SEMPRE em Português do Brasil. Nas respostas utilize o nome ${sanitizeName(
      contact.name || "Amigo(a)"
    )} para identificar o cliente.\nSua resposta deve usar no máximo ${queueIntegration.geminiMaxTokens || 1024} tokens e cuide para não truncar o final.\nSempre que possível, mencione o nome dele para ser mais personalizado o atendimento e mais educado. Quando a resposta requer uma transferência para o setor de atendimento, comece sua resposta com 'Ação: Transferir para o setor de atendimento'.\n${queueIntegration.geminiPrompt || ""}\n`;
    console.log("[Gemini] Prompt do sistema construído.");
    
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
    for (let i = 0; i < messages.length; i++) { // Ajustado para usar o tamanho real das mensagens encontradas
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
    console.log(`[Gemini] ${messages.length} mensagens do histórico adicionadas ao conteúdo.`);
    
    // Adicionar a mensagem atual (não adicionar se já estiver no histórico buscado)
    if (!messages.find(m => m.wid === msg.key.id)) {
      contents.push({ 
        role: "user", 
        parts: [{ text: bodyMessage }] 
      });
      console.log("[Gemini] Mensagem atual adicionada ao conteúdo.");
    } else {
      console.log("[Gemini] Mensagem atual já estava no histórico.");
    }
    
    // Configuração da requisição para a API do Gemini
    const apiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${queueIntegration.geminiApiKey}`;
    
    const requestBody = {
      contents,
      generationConfig: {
        maxOutputTokens: queueIntegration.geminiMaxTokens || 1024,
        temperature: queueIntegration.geminiTemperature || 0.7
      }
    };
    
    console.log(`[Gemini] Enviando requisição para API: ${apiUrl}`);
    // console.log("[Gemini] Corpo da requisição:", JSON.stringify(requestBody, null, 2)); // Descomentar se precisar de mais detalhes
    
    // Fazer a requisição para a API do Gemini
    const response = await axios.post(apiUrl, requestBody);
    
    console.log("[Gemini] Resposta recebida da API.");
    // console.log("[Gemini] Dados da resposta:", JSON.stringify(response.data, null, 2)); // Descomentar se precisar de mais detalhes
    
    // Processar a resposta
    let responseText = "";
    if (response.data && 
        response.data.candidates && 
        response.data.candidates.length > 0 && 
        response.data.candidates[0].content && 
        response.data.candidates[0].content.parts && 
        response.data.candidates[0].content.parts.length > 0 &&
        response.data.candidates[0].content.parts[0].text) { // Verificar se 'text' existe
      responseText = response.data.candidates[0].content.parts[0].text;
      console.log(`[Gemini] Texto da resposta extraído: ${responseText}`);
    } else {
      console.error("[Gemini] Formato de resposta da API inválido ou sem texto:", JSON.stringify(response.data, null, 2));
      // Não lançar erro aqui, tentar enviar mensagem de erro para o usuário
      responseText = "Desculpe, não consegui processar a resposta da IA."; 
    }
    
    // Verificar se é necessário transferir para atendimento humano
    if (responseText.includes("Ação: Transferir para o setor de atendimento")) {
      console.log("[Gemini] Ação de transferência detectada.");
      const cleanedResponse = responseText
        .replace("Ação: Transferir para o setor de atendimento", "")
        .trim();
        
      // Encontrar uma fila para transferir (usando a primeira disponível)
      const queues = await Queue.findAll({
        where: { companyId: ticket.companyId }
      });
      
      if (queues.length > 0) {
        console.log(`[Gemini] Transferindo para a fila ${queues[0].id}.`);
        await transferQueue(queues[0].id, ticket, contact);
        
        // Enviar a resposta sem a tag de ação, se houver
        if (cleanedResponse) {
          console.log(`[Gemini] Enviando resposta limpa: ${cleanedResponse}`);
          await wbot.sendMessage(
            `${contact.number}@c.us`,
            { text: cleanedResponse }
          );
        } else {
          console.log("[Gemini] Nenhuma resposta adicional para enviar após transferência.");
        }
        
        return; // Finaliza após a transferência
      } else {
        console.warn("[Gemini] Nenhuma fila encontrada para transferência.");
        // Se não houver fila, talvez enviar a mensagem original sem a ação?
        // Ou enviar uma mensagem padrão?
        responseText = cleanedResponse || "Gostaria de transferir, mas não encontrei uma fila disponível.";
      }
    }
    
    // Pausar o status de digitação
    await wbot.sendPresenceUpdate("paused", contact.remoteJid);
    console.log("[Gemini] Status 'paused' enviado.");
    
    // Enviar a resposta
    console.log(`[Gemini] Enviando resposta final para o usuário: ${responseText}`);
    const sentMessage = await wbot.sendMessage(
      `${contact.number}@c.us`,
      { text: responseText }
    );
    
    // A próxima linha está causando duplicação de mensagens no painel
    // Comentando porque a mensagem já é salva pelo listener de mensagens do bot
    // await verifyMessage(sentMessage, ticket, contact);
    console.log("[Gemini] Mensagem enviada. O listener de mensagens do sistema já irá salvá-la.");
    
  } catch (error) {
    console.error("[Gemini] Erro na integração:", error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
    Sentry.captureException(error); // Captura o erro no Sentry
    
    // Tentar enviar mensagem de erro para o usuário
    try {
      await wbot.sendMessage(
        `${contact.number}@c.us`,
        { text: "Desculpe, estou enfrentando problemas técnicos no momento. Por favor, tente novamente mais tarde." }
      );
      console.log("[Gemini] Mensagem de erro enviada ao usuário.");
    } catch (sendError) {
      console.error("[Gemini] Erro ao enviar mensagem de erro para o usuário:", sendError);
    }
  }
}

const flowBuilderQueue = async (
  ticket: Ticket,
  msg: proto.IWebMessageInfo,
  wbot: Session,
  whatsapp: Whatsapp,
  companyId: number,
  contact: Contact,
  isFirstMsg: Ticket,
) => {
  const body = getBodyMessage(msg);

  const flow = await FlowBuilderModel.findOne({
    where: {
      id: ticket.flowStopped
    }
  });

  const mountDataContact = {
    number: contact.number,
    name: contact.name,
    email: contact.email
  };



  const nodes: INodes[] = flow.flow["nodes"]
  const connections: IConnections[] = flow.flow["connections"]

  if (!ticket.lastFlowId) {
    return
  }

  if (ticket.status === "closed" || ticket.status === "interrupted" || ticket.status === "open") {
    return;
  }

  await ActionsWebhookService(
    whatsapp.id,
    parseInt(ticket.flowStopped),
    ticket.companyId,
    nodes,
    connections,
    ticket.lastFlowId,
    null,
    "",
    "",
    body,
    ticket.id,
    mountDataContact
  );

  //const integrations = await ShowQueueIntegrationService(whatsapp.integrationId, companyId);
  //await handleMessageIntegration(msg, wbot, companyId, integrations, ticket, contact, isFirstMsg)



}

const handleMessage = async (
  msg: proto.IWebMessageInfo,
  wbot: Session,
  companyId: number,
  isImported: boolean = false,
): Promise<void> => {
  const remoteJid = msg.key.remoteJid;
  const number = remoteJid.replace(/\D/g, "");
  
  let contact = await Contact.findOne({
    where: { remoteJid, companyId }
  });

  if (!contact) {
    // fallback para busca por number caso não encontre pelo remoteJid
    contact = await Contact.findOne({
      where: { number, companyId }
    });
  }

  if (!contact) {
    // criar novo contato se não existir
    const msgContact = await getContactMessage(msg, wbot);
    contact = await verifyContact(msgContact, wbot, companyId);
  }

  console.log("log... 2874")

  if (!isValidMsg(msg)) {
    console.log("log... 2877")
    return;
  }

  try {
    let msgContact: IMe;
    let groupContact: Contact | undefined;
    let queueId: number = null;
    let tagsId: number = null;
    let userId: number = null;

    let bodyMessage = getBodyMessage(msg);
    const msgType = getTypeMessage(msg);

    console.log("log... 2891")

    const hasMedia =
      msg.message?.imageMessage ||
      msg.message?.audioMessage ||
      msg.message?.videoMessage ||
      msg.message?.stickerMessage ||
      msg.message?.documentMessage ||
      msg.message?.documentWithCaptionMessage?.message?.documentMessage ||
      // msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage ||
      // msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.videoMessage ||
      // msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.audioMessage ||
      msg.message?.ephemeralMessage?.message?.audioMessage ||
      msg.message?.ephemeralMessage?.message?.documentMessage ||
      msg.message?.ephemeralMessage?.message?.videoMessage ||
      msg.message?.ephemeralMessage?.message?.stickerMessage ||
      msg.message?.ephemeralMessage?.message?.imageMessage ||
      msg.message?.viewOnceMessage?.message?.imageMessage ||
      msg.message?.viewOnceMessage?.message?.videoMessage ||
      msg.message?.ephemeralMessage?.message?.viewOnceMessage?.message?.imageMessage ||
      msg.message?.ephemeralMessage?.message?.viewOnceMessage?.message?.videoMessage ||
      msg.message?.ephemeralMessage?.message?.viewOnceMessage?.message?.audioMessage ||
      msg.message?.ephemeralMessage?.message?.viewOnceMessage?.message?.documentMessage ||
      msg.message?.documentWithCaptionMessage?.message?.documentMessage ||
      msg.message?.templateMessage?.hydratedTemplate?.imageMessage ||
      msg.message?.templateMessage?.hydratedTemplate?.documentMessage ||
      msg.message?.templateMessage?.hydratedTemplate?.videoMessage ||
      msg.message?.templateMessage?.hydratedFourRowTemplate?.imageMessage ||
      msg.message?.templateMessage?.hydratedFourRowTemplate?.documentMessage ||
      msg.message?.templateMessage?.hydratedFourRowTemplate?.videoMessage ||
      msg.message?.templateMessage?.fourRowTemplate?.imageMessage ||
      msg.message?.templateMessage?.fourRowTemplate?.documentMessage ||
      msg.message?.templateMessage?.fourRowTemplate?.videoMessage ||
      msg.message?.interactiveMessage?.header?.imageMessage ||
      msg.message?.interactiveMessage?.header?.documentMessage ||
      msg.message?.interactiveMessage?.header?.videoMessage ||
      msg.message?.highlyStructuredMessage?.hydratedHsm?.hydratedTemplate?.documentMessage ||
      msg.message?.highlyStructuredMessage?.hydratedHsm?.hydratedTemplate?.videoMessage ||
      msg.message?.highlyStructuredMessage?.hydratedHsm?.hydratedTemplate?.imageMessage ||
      msg.message?.highlyStructuredMessage?.hydratedHsm?.hydratedTemplate?.locationMessage

    if (msg.key.fromMe) {
      if (/\u200e/.test(bodyMessage)) return;

      console.log("log... 2935")

      if (
        !hasMedia &&
        msgType !== "conversation" &&
        msgType !== "extendedTextMessage" &&
        msgType !== "contactMessage" &&
        msgType !== "reactionMessage" &&
        msgType !== "ephemeralMessage" &&
        msgType !== "protocolMessage" &&
        msgType !== "viewOnceMessage" &&
        msgType !== "editedMessage" &&
        msgType !== "hydratedContentText"
      )
        return;
      console.log("log... 2950")
      msgContact = await getContactMessage(msg, wbot);
    } else {
      console.log("log... 2953")
      msgContact = await getContactMessage(msg, wbot);
    }

    const isGroup = msg.key.remoteJid?.endsWith("@g.us");

    const whatsapp = await ShowWhatsAppService(wbot.id!, companyId);

    console.log("log... 2961")

    if (!whatsapp.allowGroup && isGroup) return;

    if (isGroup) {
      console.log("log... 2966")
      const grupoMeta = await wbot.groupMetadata(msg.key.remoteJid);
      const msgGroupContact = {
        id: grupoMeta.id,
        name: grupoMeta.subject
      };
      groupContact = await verifyContact(msgGroupContact, wbot, companyId);
    }

    const contact = await verifyContact(msgContact, wbot, companyId);

    let unreadMessages = 0;

    if (msg.key.fromMe) {
      console.log("log... 2980")
      await cacheLayer.set(`contacts:${contact.id}:unreads`, "0");
    } else {
      console.log("log... 2983")
      const unreads = await cacheLayer.get(`contacts:${contact.id}:unreads`);
      // Corrigir cálculo de unreadMessages para evitar NaN
      const currentUnreads = unreads ? parseInt(unreads.toString(), 10) : 0;
      unreadMessages = currentUnreads + 1;
      await cacheLayer.set(
        `contacts:${contact.id}:unreads`,
        `${unreadMessages}`
      );
    }

    const settings = await CompaniesSettings.findOne({
      where: { companyId }
    }
    )


    
    const enableLGPD = settings.enableLGPD === "enabled";

    const isFirstMsg = await Ticket.findOne({
      where: {
        contactId: groupContact ? groupContact.id : contact.id,
        companyId,
        whatsappId: whatsapp.id
      },
      order: [["id", "DESC"]]
    });


    const mutex = new Mutex();
    // Inclui a busca de ticket aqui, se realmente não achar um ticket, então vai para o findorcreate
    const ticket = await mutex.runExclusive(async () => {
      const result = await FindOrCreateTicketService(
        contact,
        whatsapp,
        unreadMessages,
        companyId,
        queueId,
        userId,
        groupContact,
        "whatsapp",
        isImported,
        false,
        settings,
      );
      return result;
    });



    let bodyRollbackTag = "";
    let bodyNextTag = "";
    let rollbackTag;
    let nextTag;
    let ticketTag = undefined;
    // console.log(ticket.id)
    if (ticket?.company?.plan?.useKanban) {
      ticketTag = await TicketTag.findOne({
        where: {
          ticketId: ticket.id
        }
      })

      if (ticketTag) {
        const tag = await Tag.findByPk(ticketTag.tagId)
        console.log("log... 3033")
        if (tag.nextLaneId) {
          nextTag = await Tag.findByPk(tag.nextLaneId);
          console.log("log... 3036")
          bodyNextTag = nextTag.greetingMessageLane;
        }
        if (tag.rollbackLaneId) {
          rollbackTag = await Tag.findByPk(tag.rollbackLaneId);
          console.log("log... 3041")
          bodyRollbackTag = rollbackTag.greetingMessageLane;
        }
      }
    }

    if (ticket.status === 'closed' || (
      unreadMessages === 0 &&
      whatsapp.complationMessage &&
      formatBody(whatsapp.complationMessage, ticket) === bodyMessage)
    ) {
      return;
    }

    if (rollbackTag && formatBody(bodyNextTag, ticket) !== bodyMessage && formatBody(bodyRollbackTag, ticket) !== bodyMessage) {
      await TicketTag.destroy({ where: { ticketId: ticket.id, tagId: ticketTag.tagId } });
      await TicketTag.create({ ticketId: ticket.id, tagId: rollbackTag.id });
    }



    if (isImported) {
      console.log("log... 3063")
      await ticket.update({
        queueId: whatsapp.queueIdImportMessages
      })
    }

    // console.log(msg.message?.editedMessage)
    // console.log(ticket)
    if (msgType === "editedMessage" || msgType === "protocolMessage") {
      const msgKeyIdEdited = msgType === "editedMessage" ? msg.message.editedMessage.message.protocolMessage.key.id : msg.message?.protocolMessage.key.id;
      let bodyEdited = findCaption(msg.message)

      console.log("log... 3075")

      // console.log("bodyEdited", bodyEdited)
      const io = getIO();
      try {
        const messageToUpdate = await Message.findOne({
          where: {
            wid: msgKeyIdEdited,
            companyId,
            ticketId: ticket.id
          }
        })

        if (!messageToUpdate) return

        await messageToUpdate.update({ isEdited: true, body: bodyEdited });

        await ticket.update({ lastMessage: bodyEdited })

        console.log("log... 3094")

        io.of(String(companyId))
          // .to(String(ticket.id))
          .emit(`company-${companyId}-appMessage`, {
            action: "update",
            message: messageToUpdate
          });

        io.of(String(companyId))
          // .to(ticket.status)
          // .to("notification")
          // .to(String(ticket.id))
          .emit(`company-${companyId}-ticket`, {
            action: "update",
            ticket
          });
      } catch (err) {
        Sentry.captureException(err);
        logger.error(`Error handling message ack. Err: ${err}`);
      }
      return
    }

    const ticketTraking = await FindOrCreateATicketTrakingService({
      ticketId: ticket.id,
      companyId,
      userId,
      whatsappId: whatsapp?.id
    });

    let useLGPD = false;

    try {
      if (!msg.key.fromMe) {
        //MENSAGEM DE FÉRIAS COLETIVAS

        console.log("log... 3131")

        if (!isNil(whatsapp.collectiveVacationMessage && !isGroup)) {
          const currentDate = moment();

          console.log("log... 3136")

          if (currentDate.isBetween(moment(whatsapp.collectiveVacationStart), moment(whatsapp.collectiveVacationEnd))) {

            console.log("log... 3140")

            if (hasMedia) {

              console.log("log... 3144")

              await verifyMediaMessage(msg, ticket, contact, ticketTraking, false, false, wbot);
            } else {
              console.log("log... 3148")
              await verifyMessage(msg, ticket, contact, ticketTraking);
            }

            console.log("log... 3152")
            wbot.sendMessage(contact.remoteJid, { text: whatsapp.collectiveVacationMessage })

            return
          }
        }

      }

    } catch (e) {
      Sentry.captureException(e);
      console.log(e);
    }

    const isMsgForwarded = msg.message?.extendedTextMessage?.contextInfo?.isForwarded ||
      msg.message?.imageMessage?.contextInfo?.isForwarded ||
      msg.message?.audioMessage?.contextInfo?.isForwarded ||
      msg.message?.videoMessage?.contextInfo?.isForwarded ||
      msg.message?.documentMessage?.contextInfo?.isForwarded

    let mediaSent: Message | undefined;

    if (!useLGPD) {
      console.log("log... 3391")
      if (hasMedia) {
        console.log("log... 3393")
        mediaSent = await verifyMediaMessage(msg, ticket, contact, ticketTraking, isMsgForwarded, false, wbot);
      } else {
        console.log("log... 3396")
        // console.log("antes do verifyMessage")
        await verifyMessage(msg, ticket, contact, ticketTraking, false, isMsgForwarded);
      }
    }


    // Atualiza o ticket se a ultima mensagem foi enviada por mim, para que possa ser finalizado. 
    try {
      console.log("log... 3258")
      await ticket.update({
        fromMe: msg.key.fromMe,
      });
    } catch (e) {
      Sentry.captureException(e);
      console.log(e);
    }

    let currentSchedule;

    if (settings.scheduleType === "company") {
      console.log("log... 3270")
      currentSchedule = await VerifyCurrentSchedule(companyId, 0, 0);
    } else if (settings.scheduleType === "connection") {
      console.log("log... 3273")
      currentSchedule = await VerifyCurrentSchedule(companyId, 0, whatsapp.id);
    }

    try {
      // Verificação de horário já foi feita acima para tickets novos
      // Esta verificação é apenas para tickets existentes que já têm fila
      if (!msg.key.fromMe && settings.scheduleType && ticket.queueId && (!ticket.isGroup || whatsapp.groupAsTicket === "enabled") && !["open", "group"].includes(ticket.status)) {
        /**
         * Tratamento para envio de mensagem quando a empresa está fora do expediente
         * (apenas para tickets que já têm fila atribuída)
         */
        console.log("log... 3280 - Verificação para ticket com fila existente")
        if (
          (settings.scheduleType === "company" || settings.scheduleType === "connection") &&
          !isNil(currentSchedule) &&
          (!currentSchedule || currentSchedule.inActivity === false)
        ) {

          console.log("log... 3289")
          if (whatsapp.maxUseBotQueues && whatsapp.maxUseBotQueues !== 0 && ticket.amountUsedBotQueues >= whatsapp.maxUseBotQueues) {
            // await UpdateTicketService({
            //   ticketData: { queueId: queues[0].id },
            //   ticketId: ticket.id
            // });

            return;
          }

          if (whatsapp.timeUseBotQueues !== "0") {
            console.log("log... 3300")
            if (ticket.isOutOfHour === false && ticketTraking.chatbotAt !== null) {
              console.log("log... 3302")
              await ticketTraking.update({
                chatbotAt: null
              });
              await ticket.update({
                amountUsedBotQueues: 0
              });
            }

            //Regra para desabilitar o chatbot por x minutos/horas após o primeiro envio
            let dataLimite = new Date();
            let Agora = new Date();


            if (ticketTraking.chatbotAt !== null) {
              dataLimite.setMinutes(ticketTraking.chatbotAt.getMinutes() + (Number(whatsapp.timeUseBotQueues)));
              console.log("log... 3318")
              if (ticketTraking.chatbotAt !== null && Agora < dataLimite && whatsapp.timeUseBotQueues !== "0" && ticket.amountUsedBotQueues !== 0) {
                return
              }
            }

            await ticketTraking.update({
              chatbotAt: null
            })
          }

          //atualiza o contador de vezes que enviou o bot e que foi enviado fora de hora
          await ticket.update({
            isOutOfHour: true,
            amountUsedBotQueues: ticket.amountUsedBotQueues + 1
          });

          return;
        }
      }
    } catch (e) {
      Sentry.captureException(e);
      console.log(e);
    }


    const flow = await FlowBuilderModel.findOne({
      where: {
        id: ticket.flowStopped
      }
    });

    let isMenu = false;
    if (flow) {
      isMenu = flow.flow["nodes"].find((node: any) => node.id === ticket.lastFlowId)?.type === "menu";
    }


  
    if (
      !ticket.fromMe &&
      isMenu &&
      (ticket.status !== "open" && ticket.status !== "closed") &&
      !isNaN(parseInt(ticket.lastMessage))
    ) {

      await flowBuilderQueue(ticket, msg, wbot, whatsapp, companyId, contact, isFirstMsg)
    }



    //flowbuilder na conexao
    if (
      !ticket.imported &&
      !msg.key.fromMe &&
      !ticket.isGroup &&
      !ticket.queue &&
      !ticket.user &&
      !isMenu &&
      (!ticket.dataWebhook || ticket.dataWebhook["status"] === "stopped") &&
      // ticket.isBot &&
      !isNil(whatsapp.integrationId) &&
      !ticket.useIntegration
    ) {
      const integrations = await ShowQueueIntegrationService(whatsapp.integrationId, companyId);

      console.log("flowbuilder")
      if (integrations.type === "flowbuilder") {
        await flowbuilderIntegration(msg, wbot, companyId, integrations, ticket, contact, isFirstMsg)
      }

    }
   
    const isQueueAndIntegration = (ticket.useIntegration && !ticket.queue) || (ticket.useIntegration && ticket.queue) || (!ticket.useIntegration && !ticket.queue);

    console.log("isQueueAndIntegration:", isQueueAndIntegration);
    
    console.log("Verify:",
      { 
        "ticket.imported": ticket.imported,
        "msg.key.fromMe": msg.key.fromMe,
        "ticket.isGroup": ticket.isGroup,
        "isQueueAndIntegration": isQueueAndIntegration,
        "ticket.user": ticket.user,
        "ticket.isBot": ticket.isBot,
        "isNil(whatsapp.integrationId)": isNil(whatsapp.integrationId),
        "ticket.useIntegration": ticket.useIntegration
      }
    );
    console.log("Very in falsy conditions:", {
      "ticket.imported (should be false)": !ticket.imported,
      "msg.key.fromMe (should be false)": !msg.key.fromMe,
      "ticket.isGroup (should be false)": !ticket.isGroup,
      "ticket.user (should be false)": !ticket.user,
      "isQueueAndIntegration (should be true)": isQueueAndIntegration,
      // "ticket.isBot (should be false)": !ticket.isBot,
      "whatsapp.integrationId isNil (should be false)": !isNil(whatsapp.integrationId),
    });
    
    //integraçao na conexao
    console.log("[Listener DEBUG] Verificando condições para integração na conexão...");
    console.log("[Listener DEBUG] Valores atuais:", {
      fromMe: msg.key.fromMe,
      userAssigned: !!ticket.user, // !! converte para boolean
      isGroup: ticket.isGroup,
      integrationIdExists: !isNil(whatsapp.integrationId)
    });

    // CONDIÇÃO CORRIGIDA:
    // - Mensagem deve ser do usuário (NÃO fromMe)
    // - Ticket NÃO pode ter agente (!ticket.user)
    // - NÃO pode ser grupo (!ticket.isGroup) - (Ajustar se necessário)
    // - Deve ter ID de integração na conexão
    if (
      !msg.key.fromMe &&
      !ticket.user &&
      !ticket.isGroup &&           // Remover se quiser bot em grupos
      !isNil(whatsapp.integrationId)
    ) {
      console.log("[Listener DEBUG] CONDIÇÕES CORRIGIDAS ATENDIDAS - Chamando integração na conexão");
      const integrations = await ShowQueueIntegrationService(whatsapp.integrationId, companyId);
      console.log("[Listener DEBUG] Antes de await handleMessageIntegration (condição corrigida)");
      await handleMessageIntegration(msg, wbot, companyId, integrations, ticket, contact, isFirstMsg)
      console.log("[Listener DEBUG] Depois de await handleMessageIntegration (condição corrigida)");
      return; // Sai após chamar a integração
    } else {
      console.log("[Listener DEBUG] CONDIÇÕES CORRIGIDAS NÃO ATENDIDAS para integração na conexão.");
    }


      // PRIMEIRO: Verificar horário de funcionamento para tickets novos
      if (!msg.key.fromMe && !ticket.userId && settings?.scheduleType && settings.scheduleType !== "disabled") {
        console.log("=== VERIFICANDO HORÁRIO DE FUNCIONAMENTO ===");
        const isOutsideHours = await handleOutsideBusinessHours(wbot, msg, ticket, contact, settings, ticketTraking);
        
        // Se está fora do horário, envia mensagem mas NÃO interrompe o fluxo
        if (isOutsideHours === true) {
          console.log("Fora do horário - mensagem enviada, continuando fluxo normal");
        }
      }

      console.log("antes do if do verifyqueue")
    console.log("Ticket Conditions:", {
      "No Queue": !ticket.queue,
      "Not a Group": !ticket.isGroup,
      "Not From Me": !msg.key.fromMe,
      "No User ID": !ticket.userId,
      "Queues Available": whatsapp.queues.length >= 1,
      "No Integration Usage": !ticket.useIntegration
    });
    if (
      !ticket.imported &&
      !ticket.queue &&
      (!ticket.isGroup || whatsapp.groupAsTicket === "enabled") &&
      !msg.key.fromMe &&
      !ticket.userId && 
      whatsapp.queues.length >= 1 &&
      !ticket.useIntegration
    ) {
      console.log("log... 3374")
      await verifyQueue(wbot, msg, ticket, contact, settings, ticketTraking);

      if (ticketTraking.chatbotAt === null) {
        await ticketTraking.update({
          chatbotAt: moment().toDate(),
        })
      }
    }

    if (ticket.queueId > 0) {
      console.log("log... 3385")
      await ticketTraking.update({
        queueId: ticket.queueId
      })
    }
    try {
      if (!msg.key.fromMe) {
        /**
         * Verifica se a mensagem pode ser processada
         */
       
        // Tratamento para avaliação do atendente (NPS)
        if (ticket.status === "nps" && ticketTraking !== null && verifyRating(ticketTraking)) {
          console.log("Status NPS:", ticket.status);
          if (!isNaN(parseFloat(bodyMessage))) {
            handleRating(parseFloat(bodyMessage), ticket, ticketTraking);
         
            await ticketTraking.update({
              ratingAt: moment().toDate(),
              finishedAt: moment().toDate(),
              rated: true,
            });
            
            return;
          } else {
            if (ticket.amountUsedBotQueuesNPS < whatsapp.maxUseBotQueuesNPS) {
              const bodyErrorRating = "Opção inválida, tente novamente.\n";
              const sentMessage = await wbot.sendMessage(
                `${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
                { text: bodyErrorRating }
              );
    
              verifyMessage(sentMessage, ticket, contact, ticketTraking);
    
              await delay(1000);
    
              const bodyRatingMessage = whatsapp.ratingMessage;
              const msg = await SendWhatsAppMessage({ body: bodyRatingMessage, ticket });
    
              await verifyMessage(msg, ticket, ticket.contact);
    
              await ticket.update({
                amountUseBotQueuesNPS: ticket.amountUsedBotQueuesNPS + 1,
              });
    
              return;
            }
          }
        }
    
        // Tratamento LGPD
        if (enableLGPD && ticket.status === "lgpd" && !isImported) {
          const choosenOption = parseInt(msg?.message?.conversation || "", 10);
    
          if (choosenOption === 1) {
            await contact.update({ lgpdAcceptedAt: moment().toDate() });
            await ticket.update({
              lgpdAcceptedAt: moment().toDate(),
              status: "pending",
              amountUsedBotQueues: 0,
            });
          } else if (choosenOption === 2) {
            if (whatsapp.complationMessage) {
              const sentMessage = await wbot.sendMessage(
                `${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
                { text: whatsapp.complationMessage }
              );
              verifyMessage(sentMessage, ticket, contact, ticketTraking);
            }
            await ticket.update({ status: "closed", amountUsedBotQueues: 0 });
            await ticketTraking.destroy();
            return;
          } else {
            if (ticket.amountUsedBotQueues < whatsapp.maxUseBotQueues) {
              await ticket.update({
                amountUsedBotQueues: ticket.amountUsedBotQueues + 1,
                lgpdSendMessageAt: null,
              });
            }
          }
    
          if (!ticket.lgpdSendMessageAt && !ticket.lgpdAcceptedAt) {
            const lgpdMessage = formatBody(settings?.lgpdMessage || "", ticket);
            const sentMessage = await wbot.sendMessage(
              `${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
              { text: lgpdMessage }
            );
    
            verifyMessage(sentMessage, ticket, contact, ticketTraking);
    
            await delay(1000);
    
            if (settings?.lgpdLink) {
              const bodyLink = formatBody(settings.lgpdLink, ticket);
              await wbot.sendMessage(
                `${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
                { text: bodyLink }
              );
            }
    
            const bodyBot =
              "Estou ciente sobre o tratamento dos meus dados pessoais.\n\n[1] Sim\n[2] Não";
    
            const sentMessageBot = await wbot.sendMessage(
              `${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
              { text: bodyBot }
            );
    
            await verifyMessage(sentMessageBot, ticket, contact, ticketTraking);
    
            await ticket.update({
              lgpdSendMessageAt: moment().toDate(),
              amountUsedBotQueues: ticket.amountUsedBotQueues + 1,
            });
    
            return;
          }
        }
      }
    } catch (error) {
      console.error("Erro ao processar mensagem:", error);
      Sentry.captureException(error);
    }
    

  } catch (err) {
    Sentry.captureException(err);
    console.log(err);
    logger.error(`Error handling whatsapp message: Err: ${err}`);
  }

}


const handleMsgAck = async (
  msg: WAMessage,
  chat: number | null | undefined
) => {
  await new Promise(r => setTimeout(r, 500));
  const io = getIO();

  try {
    const messageToUpdate = await Message.findOne({
      where: {
        wid: msg.key.id,
      },
      include: [
        "contact",
        {
          model: Ticket,
          as: "ticket",
          include: [
            {
              model: Contact,
              attributes: ["id", "name", "number", "email", "profilePicUrl", "acceptAudioMessage", "active", "urlPicture", "companyId"],
              include: ["extraInfo", "tags"]
            },
            {
              model: Queue,
              attributes: ["id", "name", "color"]
            },
            {
              model: Whatsapp,
              attributes: ["id", "name", "groupAsTicket"]
            },
            {
              model: User,
              attributes: ["id", "name"]
            },
            {
              model: Tag,
              as: "tags",
              attributes: ["id", "name", "color"]
            }
          ]
        },
        {
          model: Message,
          as: "quotedMsg",
          include: ["contact"],
        },
      ],
    });
    if (!messageToUpdate || messageToUpdate.ack > chat) return;

    await messageToUpdate.update({ ack: chat });
    io.of(messageToUpdate.companyId.toString())
      // .to(messageToUpdate.ticketId.toString())
      .emit(`company-${messageToUpdate.companyId}-appMessage`,
        {
          action: "update",
          message: messageToUpdate
        }
      );
  } catch (err) {
    Sentry.captureException(err);
    logger.error(`Error handling message ack. Err: ${err}`);
  }
};

const verifyRecentCampaign = async (
  message: proto.IWebMessageInfo,
  companyId: number
) => {
  const remoteJid = message.key.remoteJid;
  const number = remoteJid.replace(/\D/g, "");
  
  const contact = await Contact.findOne({
    where: { remoteJid, companyId }
  });

  if (!contact) {
    // fallback para busca por number caso não encontre pelo remoteJid
    return await Contact.findOne({
      where: { number, companyId }
    });
  }

  return contact;
};

const verifyCampaignMessageAndCloseTicket = async (message: proto.IWebMessageInfo, companyId: number, wbot: Session) => {
  const remoteJid = message.key.remoteJid;
  const number = remoteJid.replace(/\D/g, "");
  
  const contact = await Contact.findOne({
    where: { remoteJid, companyId }
  });

  if (!contact) {
    // fallback para busca por number caso não encontre pelo remoteJid
    return await Contact.findOne({
      where: { number, companyId }
    });
  }

  return contact;
};

const filterMessages = (msg: WAMessage): boolean => {
  msgDB.save(msg);

  if (msg.message?.protocolMessage?.editedMessage) return true;
  if (msg.message?.protocolMessage) return false;

  if (
    [
      WAMessageStubType.REVOKE,
      WAMessageStubType.E2E_DEVICE_CHANGED,
      WAMessageStubType.E2E_IDENTITY_CHANGED,
      WAMessageStubType.CIPHERTEXT
    ].includes(msg.messageStubType as any)
  )
    return false;

  return true;
};

const wbotMessageListener = (wbot: Session, companyId: number): void => {
  // Cache para evitar processamento duplicado de mensagens
  const processedMessages = new Set<string>();
  
  // Limpeza periódica do cache
  setInterval(() => {
    processedMessages.clear();
  }, 300000); // Limpar a cada 5 minutos

  wbot.ev.on("messages.upsert", async (messageUpsert: ImessageUpsert) => {
    const messages = messageUpsert.messages
      .filter(filterMessages)
      .map(async msg => {
        const remoteJid = msg.key.remoteJid;
        const number = remoteJid.replace(/\D/g, "");
        
        // Verificar se a mensagem já foi processada
        const messageKey = `${msg.key.id}-${companyId}`;
        if (processedMessages.has(messageKey)) {
          return null;
        }
        processedMessages.add(messageKey);
        
        // buscar contato por remoteJid primeiro
        let contact = await Contact.findOne({
          where: { remoteJid, companyId }
        });

        if (!contact) {
          // fallback para busca por number caso não encontre pelo remoteJid
          contact = await Contact.findOne({
            where: { number, companyId }
          });
        }

        if (!contact) {
          // criar novo contato se não existir
          const msgContact = await getContactMessage(msg, wbot);
          contact = await verifyContact(msgContact, wbot, companyId);
        }
        
        return { ...msg, contact };
      });
    
    const processedMessagesWithContacts = await Promise.all(messages);
    const validMessages = processedMessagesWithContacts.filter(msg => msg !== null);

    if (!validMessages || validMessages.length === 0) return;

    // Processar mensagens em lotes para melhor performance
    const batchSize = 10;
    for (let i = 0; i < validMessages.length; i += batchSize) {
      const batch = validMessages.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (message: proto.IWebMessageInfo) => {
        try {
      if (message?.messageStubParameters?.length && message.messageStubParameters[0].includes('absent')) {
        const msg = {
          companyId: companyId,
          whatsappId: wbot.id,
          message: message
        }
        logger.warn("MENSAGEM PERDIDA", JSON.stringify(msg));
      }
          
      const messageExists = await Message.count({
        where: { wid: message.key.id!, companyId }
      });

      if (!messageExists) {
        let isCampaign = false
        let body = await getBodyMessage(message);
        const fromMe = message?.key?.fromMe;
        if (fromMe) {
          isCampaign = /\u200c/.test(body)
        } else {
          if (/\u200c/.test(body))
            body = body.replace(/\u200c/, '')
          logger.debug('Validação de mensagem de campanha enviada por terceiros: ' + body)
        }

        if (!isCampaign) {
              if (REDIS_URI_MSG_CONN !== '') {
            try {
              await BullQueues.add(`${process.env.DB_NAME}-handleMessage`, { message, wbot: wbot.id, companyId }, {
                priority: 1,
                    jobId: `${wbot.id}-handleMessage-${message.key.id}`,
                    removeOnComplete: true,
                    removeOnFail: false
              });
            } catch (e) {
                  logger.error(`Erro ao adicionar mensagem à fila: ${e}`);
              Sentry.captureException(e);
                  // Fallback: processar diretamente se a fila falhar
                  console.log("Fallback: processando mensagem diretamente");
                  await handleMessage(message, wbot, companyId);
            }
          } else {
            await handleMessage(message, wbot, companyId);
          }
        }

        await verifyRecentCampaign(message, companyId);
        await verifyCampaignMessageAndCloseTicket(message, companyId, wbot);
      }
        } catch (error) {
          logger.error(`Erro ao processar mensagem ${message.key.id}: ${error}`);
          Sentry.captureException(error);
        }
      }));
    }

    // Processar mensagens de grupo separadamente
    const groupMessages = validMessages.filter(msg => msg.key.remoteJid?.endsWith("@g.us"));
    if (groupMessages.length > 0) {
      await Promise.all(groupMessages.map(async (message) => {
        try {
        if (REDIS_URI_MSG_CONN !== '') {
            await BullQueues.add(`${process.env.DB_NAME}-handleMessageAck`, { msg: message, chat: 2 }, {
            priority: 1,
              jobId: `${wbot.id}-handleMessageAck-${message.key.id}`,
              removeOnComplete: true,
              removeOnFail: false
            });
        } else {
            await handleMsgAck(message, 2);
        }
        } catch (error) {
          logger.error(`Erro ao processar ACK de grupo: ${error}`);
          Sentry.captureException(error);
        }
      }));
    }
  });

  wbot.ev.on("messages.update", (messageUpdate: WAMessageUpdate[]) => {
    if (messageUpdate.length === 0) return;
    
    // Processar atualizações em lotes
    const batchSize = 5;
    for (let i = 0; i < messageUpdate.length; i += batchSize) {
      const batch = messageUpdate.slice(i, i + batchSize);
      
      batch.forEach(async (message: WAMessageUpdate) => {
        try {
          (wbot as WASocket)!.readMessages([message.key]);

          const msgUp = { ...messageUpdate };

      if (msgUp['0']?.update.messageStubType === 1 && msgUp['0']?.key.remoteJid !== 'status@broadcast') {
            await MarkDeleteWhatsAppMessage(msgUp['0']?.key.remoteJid, null, msgUp['0']?.key.id, companyId);
      }

      let ack;
      if (message.update.status === 3 && message?.key?.fromMe) {
        ack = 2;
      } else {
        ack = message.update.status;
      }

      if (REDIS_URI_MSG_CONN !== '') {
            await BullQueues.add(`${process.env.DB_NAME}-handleMessageAck`, { msg: message, chat: ack }, {
          priority: 1,
              jobId: `${wbot.id}-handleMessageAck-${message.key.id}`,
              removeOnComplete: true,
              removeOnFail: false
            });
          } else {
            await handleMsgAck(message, ack);
      }
        } catch (error) {
          logger.error(`Erro ao processar atualização de mensagem: ${error}`);
          Sentry.captureException(error);
        }
      });
    }
  });

  wbot.ev.on("contacts.update", (contacts: any) => {
    if (!contacts || contacts.length === 0) return;
    
    contacts.forEach(async (contact: any) => {
      try {
        if (!contact?.id) return;

      if (typeof contact.imgUrl !== 'undefined') {
        const newUrl = contact.imgUrl === ""
          ? ""
            : await wbot!.profilePictureUrl(contact.id!).catch(() => null);
        const contactData = {
          name: contact.id.replace(/\D/g, ""),
          number: contact.id.replace(/\D/g, ""),
          isGroup: contact.id.includes("@g.us") ? true : false,
          companyId: companyId,
          remoteJid: contact.id,
          profilePicUrl: newUrl,
          whatsappId: wbot.id,
          wbot: wbot
          };

          await CreateOrUpdateContactService(contactData);
        }
      } catch (error) {
        logger.error(`Erro ao atualizar contato: ${error}`);
        Sentry.captureException(error);
      }
    });
  });

  wbot.ev.on("groups.update", (groupUpdate: GroupMetadata[]) => {
    if (!groupUpdate || groupUpdate.length === 0 || !groupUpdate[0]?.id) return;
    
    groupUpdate.forEach(async (group: GroupMetadata) => {
      try {
      const number = group.id.replace(/\D/g, "");
      const nameGroup = group.subject || number;

      let profilePicUrl: string = "";
        
      const contactData = {
        name: nameGroup,
        number: number,
        isGroup: true,
        companyId: companyId,
        remoteJid: group.id,
        profilePicUrl,
        whatsappId: wbot.id,
        wbot: wbot
      };

        await CreateOrUpdateContactService(contactData);
      } catch (error) {
        logger.error(`Erro ao atualizar grupo: ${error}`);
        Sentry.captureException(error);
      }
    });
  });
};

export { wbotMessageListener, handleMessage, isValidMsg, getTypeMessage, handleMsgAck };