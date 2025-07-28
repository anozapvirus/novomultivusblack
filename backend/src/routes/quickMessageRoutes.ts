import express from "express";
import isAuth from "../middleware/isAuth";

import * as QuickMessageController from "../controllers/QuickMessageController";
import multer from "multer";
import uploadConfig from "../config/upload";

const upload = multer(uploadConfig);

const routes = express.Router();

routes.get("/quick-messages", isAuth, QuickMessageController.index);

routes.get("/quick-messages/:id", isAuth, QuickMessageController.show);

routes.post("/quick-messages", isAuth, QuickMessageController.store);

routes.put("/quick-messages/:id", isAuth, QuickMessageController.update);

routes.delete("/quick-messages/:id", isAuth, QuickMessageController.remove);

// Novas rotas para gerenciamento de pastas
routes.post("/quick-messages/folders", isAuth, QuickMessageController.createFolder);

routes.get("/quick-messages/folders", isAuth, QuickMessageController.listFolders);

routes.delete("/quick-messages/folders/:folderPath", isAuth, QuickMessageController.removeFolder);

routes.post("/quick-messages/move-file", isAuth, QuickMessageController.moveFileToFolder);

routes.post("/quick-messages/organize-files", isAuth, QuickMessageController.organizeFiles);

routes.get("/quick-messages/folder-stats", isAuth, QuickMessageController.getFolderStats);

// Rotas para contatos
routes.get("/quick-messages/contacts/search", isAuth, QuickMessageController.findContacts);

// Rota para incrementar uso
routes.post("/quick-messages/:id/increment-usage", isAuth, QuickMessageController.incrementUsage);

// Rota para buscar por pasta
routes.get("/quick-messages/by-folder", isAuth, QuickMessageController.findByFolder);

export default routes;
