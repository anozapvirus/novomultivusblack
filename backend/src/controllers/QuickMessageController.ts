import { Request, Response } from "express";
import * as Yup from "yup";
import AppError from "../errors/AppError";
import { getIO } from "../libs/socket";

import CreateQuickMessageService from "../services/QuickMessageService/CreateService";
import DeleteQuickMessageService from "../services/QuickMessageService/DeleteService";
import ListService from "../services/QuickMessageService/ListService";
import ShowQuickMessageService from "../services/QuickMessageService/ShowService";
import UpdateQuickMessageService from "../services/QuickMessageService/UpdateService";
import Contact from "../models/Contact";
import QuickMessage from "../models/QuickMessage";
import { 
  createFolder as createFolderService, 
  listFolders as listFoldersService, 
  deleteFolder as deleteFolderService, 
  moveFile as moveFileService, 
  organizeFiles as organizeFilesService, 
  getFolderStats as getFolderStatsService 
} from "../services/QuickMessageService/FolderService";
import { Op } from "sequelize";

interface IndexQuery {
  searchParam: string;
  pageNumber: string;
}

interface StoreData {
  shortcode: string;
  message: string;
  isMedia: boolean;
  mediaPath?: string;
  geral: boolean;
  visao: boolean;
  folder?: string;
  subfolder?: string;
  isContact?: boolean;
  contactName?: string;
  contactNumber?: string;
  contactEmail?: string;
  tags?: string;
}

interface UpdateData {
  shortcode?: string;
  message?: string;
  isMedia?: boolean;
  mediaPath?: string;
  geral?: boolean;
  visao?: boolean;
  folder?: string;
  subfolder?: string;
  isContact?: boolean;
  contactName?: string;
  contactNumber?: string;
  contactEmail?: string;
  tags?: string;
}

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { searchParam, pageNumber } = req.query as any;
  const { companyId, id: userId } = req.user;

  const { records, count, hasMore } = await ListService({
    searchParam,
    pageNumber,
    companyId,
    userId
  });

  return res.json({ records, count, hasMore });
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const data = req.body as StoreData;

  const schema = Yup.object().shape({
    shortcode: Yup.string().required(),
    message: data.isMedia ? Yup.string().notRequired() : Yup.string().required(),
    isContact: Yup.boolean().optional(),
    contactName: Yup.string().when('isContact', {
      is: true,
      then: Yup.string().required('Nome do contato é obrigatório')
    }),
    contactNumber: Yup.string().when('isContact', {
      is: true,
      then: Yup.string().required('Número do contato é obrigatório')
    })
  });

  try {
    await schema.validate(data);
  } catch (err: any) {
    throw new AppError(err.message);
  }

  const record = await CreateQuickMessageService({
    ...data,
    companyId,
    userId: req.user.id
  });

  const io = getIO();
  io.of(String(companyId))
    .emit(`company-${companyId}-quickmessage`, {
      action: "create",
      record
    });

  return res.status(200).json(record);
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;

  const record = await ShowQuickMessageService(id);

  return res.status(200).json(record);
};

export const update = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;
  const { companyId } = req.user;
  const data = req.body as UpdateData;

  const schema = Yup.object().shape({
    shortcode: Yup.string().min(1),
    message: data.isMedia ? Yup.string().notRequired() : Yup.string().min(1),
    isContact: Yup.boolean().optional(),
    contactName: Yup.string().when('isContact', {
      is: true,
      then: Yup.string().required('Nome do contato é obrigatório')
    }),
    contactNumber: Yup.string().when('isContact', {
      is: true,
      then: Yup.string().required('Número do contato é obrigatório')
    })
  });

  try {
    await schema.validate(data);
  } catch (err: any) {
    throw new AppError(err.message);
  }

  const record = await UpdateQuickMessageService({
    id,
    shortcode: data.shortcode || "",
    message: data.message || "",
    userId: req.user.id,
    geral: data.geral || false,
    mediaPath: data.mediaPath,
    visao: data.visao || false
  });

  const io = getIO();
  io.of(String(companyId))
    .emit(`company-${companyId}-quickmessage`, {
      action: "update",
      record
    });

  return res.status(200).json(record);
};

export const remove = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;
  const { companyId } = req.user;

  await DeleteQuickMessageService(id);

  const io = getIO();
  io.of(String(companyId))
    .emit(`company-${companyId}-quickmessage`, {
      action: "delete",
      id: +id
    });

  return res.status(200).json({ message: "Quick message deleted" });
};

// Novos endpoints para gerenciamento de pastas

export const createFolder = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const { folderName, parentFolder } = req.body;

  const folder = await createFolderService({
    companyId,
    folderName,
    parentFolder
  });

  return res.status(200).json(folder);
};

export const listFolders = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;

  const folders = await listFoldersService(companyId);

  return res.status(200).json(folders);
};

export const removeFolder = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const { folderPath } = req.params;

  await deleteFolderService(companyId, folderPath);

  return res.status(200).json({ message: "Folder deleted" });
};

export const moveFileToFolder = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const { fileName, sourceFolder, targetFolder } = req.body;

  await moveFileService(companyId, fileName, sourceFolder, targetFolder);

  return res.status(200).json({ message: "File moved successfully" });
};

export const organizeFiles = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;

  await organizeFilesService(companyId);

  return res.status(200).json({ message: "Files organized successfully" });
};

export const getFolderStats = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;

  const stats = await getFolderStatsService(companyId);

  return res.status(200).json(stats);
};

// Endpoint para buscar contatos para mensagens rápidas
export const findContacts = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const { searchParam } = req.query as { searchParam: string };

  const whereCondition = {
    companyId,
    ...(searchParam && {
      [Op.or]: [
        { name: { [Op.like]: `%${searchParam}%` } },
        { number: { [Op.like]: `%${searchParam}%` } }
      ]
    })
  };

  const contacts = await Contact.findAll({
    where: whereCondition,
    limit: 20,
    order: [["name", "ASC"]]
  });

  return res.status(200).json(contacts);
};

// Endpoint para incrementar contador de uso
export const incrementUsage = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;
  const { companyId } = req.user;

  const quickMessage = await QuickMessage.findOne({
    where: { id, companyId }
  });

  if (!quickMessage) {
    throw new AppError("Quick message not found");
  }

  await quickMessage.update({
    usageCount: quickMessage.usageCount + 1,
    lastUsed: new Date()
  });

  return res.status(200).json(quickMessage);
};

// Endpoint para buscar mensagens rápidas por pasta
export const findByFolder = async (req: Request, res: Response): Promise<Response> => {
  const { companyId, id: userId } = req.user;
  const { folder, subfolder } = req.query as { folder: string; subfolder?: string };

  const whereCondition: any = {
    companyId,
    folder,
    [Op.or]: [
      { visao: true },
      { userId }
    ]
  };

  if (subfolder) {
    whereCondition.subfolder = subfolder;
  }

  const records = await QuickMessage.findAll({
    where: whereCondition,
    order: [["shortcode", "ASC"]]
  });

  return res.status(200).json(records);
};
