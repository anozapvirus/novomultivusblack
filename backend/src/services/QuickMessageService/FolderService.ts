import fs from "fs";
import path from "path";
import { getIO } from "../../libs/socket";

interface FolderStructure {
  name: string;
  path: string;
  subfolders?: FolderStructure[];
  files?: string[];
}

interface CreateFolderRequest {
  companyId: number;
  folderName: string;
  parentFolder?: string;
}

interface FileInfo {
  name: string;
  path: string;
  size: number;
  type: string;
  lastModified: Date;
}

const getQuickMessageFolderPath = (companyId: number): string => {
  const publicFolder = path.resolve(__dirname, "..", "..", "..", "public");
  return path.join(publicFolder, `company${companyId}`, "quickMessage");
};

const ensureFolderExists = (folderPath: string): void => {
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
    fs.chmodSync(folderPath, 0o777);
  }
};

export const createFolder = async (data: CreateFolderRequest): Promise<FolderStructure> => {
  const { companyId, folderName, parentFolder } = data;
  
  const basePath = getQuickMessageFolderPath(companyId);
  ensureFolderExists(basePath);
  
  const folderPath = parentFolder 
    ? path.join(basePath, parentFolder, folderName)
    : path.join(basePath, folderName);
  
  ensureFolderExists(folderPath);
  
  const folderStructure: FolderStructure = {
    name: folderName,
    path: folderPath,
    subfolders: [],
    files: []
  };
  
  return folderStructure;
};

export const listFolders = async (companyId: number): Promise<FolderStructure[]> => {
  const basePath = getQuickMessageFolderPath(companyId);
  ensureFolderExists(basePath);
  
  const folders: FolderStructure[] = [];
  
  try {
    const items = fs.readdirSync(basePath);
    
    for (const item of items) {
      const itemPath = path.join(basePath, item);
      const stats = fs.statSync(itemPath);
      
      if (stats.isDirectory()) {
        const subfolders = fs.readdirSync(itemPath)
          .filter(subItem => {
            const subItemPath = path.join(itemPath, subItem);
            return fs.statSync(subItemPath).isDirectory();
          })
          .map(subItem => ({
            name: subItem,
            path: path.join(itemPath, subItem)
          }));
        
        const files = fs.readdirSync(itemPath)
          .filter(subItem => {
            const subItemPath = path.join(itemPath, subItem);
            return fs.statSync(subItemPath).isFile();
          });
        
        folders.push({
          name: item,
          path: itemPath,
          subfolders,
          files
        });
      }
    }
  } catch (error) {
    console.error("Error listing folders:", error);
  }
  
  return folders;
};

export const deleteFolder = async (companyId: number, folderPath: string): Promise<void> => {
  const basePath = getQuickMessageFolderPath(companyId);
  const fullPath = path.join(basePath, folderPath);
  
  if (fs.existsSync(fullPath)) {
    fs.rmSync(fullPath, { recursive: true, force: true });
  }
};

export const moveFile = async (
  companyId: number, 
  fileName: string, 
  sourceFolder: string, 
  targetFolder: string
): Promise<void> => {
  const basePath = getQuickMessageFolderPath(companyId);
  const sourcePath = path.join(basePath, sourceFolder, fileName);
  const targetPath = path.join(basePath, targetFolder, fileName);
  
  if (fs.existsSync(sourcePath)) {
    ensureFolderExists(path.dirname(targetPath));
    fs.renameSync(sourcePath, targetPath);
  }
};

export const getFileInfo = async (companyId: number, filePath: string): Promise<FileInfo> => {
  const basePath = getQuickMessageFolderPath(companyId);
  const fullPath = path.join(basePath, filePath);
  
  if (!fs.existsSync(fullPath)) {
    throw new Error("File not found");
  }
  
  const stats = fs.statSync(fullPath);
  
  return {
    name: path.basename(fullPath),
    path: filePath,
    size: stats.size,
    type: path.extname(fullPath),
    lastModified: stats.mtime
  };
};

export const organizeFiles = async (companyId: number): Promise<void> => {
  const basePath = getQuickMessageFolderPath(companyId);
  ensureFolderExists(basePath);
  
  // Criar pastas padrão se não existirem
  const defaultFolders = [
    "Imagens",
    "Documentos", 
    "Áudios",
    "Vídeos",
    "Contatos"
  ];
  
  for (const folder of defaultFolders) {
    const folderPath = path.join(basePath, folder);
    ensureFolderExists(folderPath);
  }
  
  // Organizar arquivos existentes por tipo
  const items = fs.readdirSync(basePath);
  
  for (const item of items) {
    const itemPath = path.join(basePath, item);
    const stats = fs.statSync(itemPath);
    
    if (stats.isFile()) {
      const ext = path.extname(item).toLowerCase();
      let targetFolder = "Documentos";
      
      if ([".jpg", ".jpeg", ".png", ".gif", ".bmp"].includes(ext)) {
        targetFolder = "Imagens";
      } else if ([".mp3", ".wav", ".ogg", ".m4a"].includes(ext)) {
        targetFolder = "Áudios";
      } else if ([".mp4", ".avi", ".mov", ".mkv"].includes(ext)) {
        targetFolder = "Vídeos";
      }
      
      const targetPath = path.join(basePath, targetFolder, item);
      if (!fs.existsSync(targetPath)) {
        fs.renameSync(itemPath, targetPath);
      }
    }
  }
};

export const getFolderStats = async (companyId: number): Promise<any> => {
  const basePath = getQuickMessageFolderPath(companyId);
  ensureFolderExists(basePath);
  
  let totalFiles = 0;
  let totalSize = 0;
  const folderStats: any = {};
  
  const calculateStats = (folderPath: string) => {
    const items = fs.readdirSync(folderPath);
    
    for (const item of items) {
      const itemPath = path.join(folderPath, item);
      const stats = fs.statSync(itemPath);
      
      if (stats.isDirectory()) {
        calculateStats(itemPath);
      } else {
        totalFiles++;
        totalSize += stats.size;
      }
    }
  };
  
  calculateStats(basePath);
  
  return {
    totalFiles,
    totalSize,
    totalSizeMB: Math.round((totalSize / 1024 / 1024) * 100) / 100
  };
}; 