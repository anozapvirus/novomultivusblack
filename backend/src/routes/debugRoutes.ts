import express from "express";
import isAuth from "../middleware/isAuth";
import debugAuth from "../middleware/debugAuth";
import * as DebugController from "../controllers/DebugController";
import * as DiagnosticController from "../controllers/DiagnosticController";

const debugRoutes = express.Router();

debugRoutes.get("/debug/schedule", debugAuth, DebugController.debugSchedule);
debugRoutes.get("/debug/system", debugAuth, DiagnosticController.diagnosticSystem);
debugRoutes.post("/debug/test-outofhours", debugAuth, DebugController.testOutOfHoursMessage);

export default debugRoutes; 