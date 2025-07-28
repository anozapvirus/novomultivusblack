import { Router } from "express";
import isAuth from "../middleware/isAuth";

import * as QueueIntegrationController from "../controllers/QueueIntegrationController";

const queueIntegrationRoutes = Router();

queueIntegrationRoutes.get("/queueIntegration", isAuth, QueueIntegrationController.index);

queueIntegrationRoutes.post("/queueIntegration", isAuth, QueueIntegrationController.store);

queueIntegrationRoutes.get("/queueIntegration/:queueIntegrationId", isAuth, QueueIntegrationController.show);

queueIntegrationRoutes.put("/queueIntegration/:queueIntegrationId", isAuth, QueueIntegrationController.update);

queueIntegrationRoutes.delete("/queueIntegration/:queueIntegrationId", isAuth, QueueIntegrationController.remove);

queueIntegrationRoutes.post("/queueIntegration/test", isAuth, QueueIntegrationController.test);

export default queueIntegrationRoutes;