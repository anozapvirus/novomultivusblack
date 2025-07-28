import AppError from "../../errors/AppError";
import Contact from "../../models/Contact";
import ContactCustomField from "../../models/ContactCustomField";
import CreateContactService from "./CreateContactService";

interface ExtraInfo extends ContactCustomField {
  name: string;
  value: string;
}

interface Request {
  name: string;
  number: string;
  companyId: number;
  email?: string;
  acceptAudioMessage?: boolean;
  active?: boolean;
  profilePicUrl?: string;
  extraInfo?: ExtraInfo[];
}

const GetContactService = async ({ name, number, companyId }) => {
  // Geração do remoteJid
  const remoteJid = number.includes("@") ? number : `${number}@s.whatsapp.net`;
  let contact = await Contact.findOne({ where: { remoteJid, companyId } });
  if (!contact) {
    // fallback para busca por number caso não encontre pelo remoteJid
    contact = await Contact.findOne({ where: { number, companyId } });
  }
  return contact;
};

export default GetContactService;
