import * as Sentry from "@sentry/node";
import GetDefaultWhatsApp from "../../helpers/GetDefaultWhatsApp";
import { getWbot } from "../../libs/wbot";
import Contact from "../../models/Contact";
import logger from "../../utils/logger";
import ShowBaileysService from "../BaileysServices/ShowBaileysService";
import CreateContactService from "../ContactServices/CreateContactService";
import { isString, isArray } from "lodash";
import path from "path";
import fs from 'fs';

const ImportContactsService = async (companyId: number): Promise<void> => {
  const defaultWhatsapp = await GetDefaultWhatsApp(companyId);
  const wbot = getWbot(defaultWhatsapp.id);

  let phoneContacts = [];

  try {
    // Primeiro tenta buscar do banco Baileys
    let contactsString;
    try {
      contactsString = await ShowBaileysService(wbot.id);
    } catch (baileysError) {
      logger.warn(`No Baileys data found for whatsapp ${wbot.id}, trying direct WhatsApp access`);
      contactsString = null;
    }
    
    // Verificar se contacts existe e não é null/undefined
    if (contactsString && contactsString.contacts) {
      phoneContacts = JSON.parse(JSON.stringify(contactsString.contacts));
      logger.info(`Found ${phoneContacts.length} contacts in Baileys database`);
    } else {
      // Se não há dados no banco, tenta buscar diretamente do WhatsApp
      logger.info(`No contacts in Baileys database, trying to get from WhatsApp directly`);
      try {
        // Tentar obter contatos diretamente do WhatsApp
        const store = wbot.store;
        if (store && store.contacts) {
          const whatsappContacts = store.contacts;
          phoneContacts = Object.values(whatsappContacts)
            .filter((contact: any) => contact && contact.id && !contact.id.includes('@broadcast') && !contact.id.includes('@status'))
            .map((contact: any) => ({
              id: contact.id,
              name: contact.name || contact.id.split('@')[0],
              number: contact.id.split('@')[0]
            }));
          logger.info(`Found ${phoneContacts.length} contacts directly from WhatsApp`);
        } else {
          logger.warn(`No contacts available from WhatsApp store`);
          phoneContacts = [];
        }
      } catch (whatsappError) {
        logger.error(`Error getting contacts from WhatsApp: ${whatsappError}`);
        phoneContacts = [];
      }
    }

    // Criar diretório se não existir
    const publicFolder = path.resolve(__dirname, "..", "..", "..", "public");
    const companyFolder = path.join(publicFolder, `company${companyId}`);
    
    if (!fs.existsSync(companyFolder)) {
      fs.mkdirSync(companyFolder, { recursive: true });
    }

    const beforeFilePath = path.join(companyFolder, 'contatos_antes.txt');
    
    // Só escrever arquivo se phoneContacts não for undefined
    if (phoneContacts !== undefined) {
      fs.writeFile(beforeFilePath, JSON.stringify(phoneContacts, null, 2), (err) => {
        if (err) {
          logger.error(`Failed to write contacts to file: ${err}`);
        }
      });
    }

  } catch (err) {
    Sentry.captureException(err);
    logger.error(`Could not get whatsapp contacts from phone. Err: ${err}`);
    phoneContacts = [];
  }

  // Criar diretório se não existir
  const publicFolder = path.resolve(__dirname, "..", "..", "..", "public");
  const companyFolder = path.join(publicFolder, `company${companyId}`);
  
  if (!fs.existsSync(companyFolder)) {
    fs.mkdirSync(companyFolder, { recursive: true });
  }

  const afterFilePath = path.join(companyFolder, 'contatos_depois.txt');
  
  // Só escrever arquivo se phoneContacts não for undefined
  if (phoneContacts !== undefined) {
    fs.writeFile(afterFilePath, JSON.stringify(phoneContacts, null, 2), (err) => {
      if (err) {
        logger.error(`Failed to write contacts to file: ${err}`);
      }
    });
  }

  const phoneContactsList = isString(phoneContacts)
    ? JSON.parse(phoneContacts)
    : phoneContacts;

  if (isArray(phoneContactsList) && phoneContactsList.length > 0) {
    logger.info(`Importing ${phoneContactsList.length} contacts for company ${companyId}`);
    
    for (const contact of phoneContactsList) {
      try {
        if (!contact || !contact.number) {
          logger.warn(`Skipping invalid contact: ${JSON.stringify(contact)}`);
          continue;
        }

        const remoteJid = `${contact.number}@s.whatsapp.net`;
        const [newContact, created] = await Contact.findOrCreate({
          where: {
            remoteJid,
            companyId: companyId
          },
          defaults: { 
            ...contact, 
            remoteJid,
            companyId: companyId
          }
        });
        
        if (created) {
          logger.info(`Created new contact: ${contact.name} (${contact.number})`);
        }
      } catch (contactError) {
        logger.error(`Error processing contact ${contact?.number}: ${contactError}`);
        Sentry.captureException(contactError);
      }
    }
  } else {
    logger.warn(`No contacts to import for company ${companyId}`);
  }
};

export default ImportContactsService;
