import * as Yup from "yup";
import { Request, Response } from "express";
import { getIO } from "../libs/socket";
import { head } from "lodash";
import fs from "fs";
import path from "path";

import AppError from "../errors/AppError";

import CreateQueueIntegrationService from "../services/QueueIntegrationServices/CreateQueueIntegrationService";
import DeleteQueueIntegrationService from "../services/QueueIntegrationServices/DeleteQueueIntegrationService";
import ListQueueIntegrationService from "../services/QueueIntegrationServices/ListQueueIntegrationService";
import ShowQueueIntegrationService from "../services/QueueIntegrationServices/ShowQueueIntegrationService";
import UpdateQueueIntegrationService from "../services/QueueIntegrationServices/UpdateQueueIntegrationService";
import TestDialogflowSession from "../services/QueueIntegrationServices/TestSessionDialogflowService";

import QueueIntegration from "../models/QueueIntegrations";

interface DialogflowSessionRequest {
  projectName: string;
  jsonContent: string;
  language: string;
}

type IndexQuery = {
  searchParam: string;
  pageNumber: string;
};

type StoreData = {
  name: string;
  type: string;
  projectName: string;
  jsonContent: string;
  language: string;
  urlN8N: string;
  typebotSlug: string;
  typebotExpires: number;
  typebotKeywordFinish: string;
  typebotUnknownMessage: string;
  typebotDelayMessage: number;
  typebotKeywordRestart: string;
  typebotRestartMessage: string;
  geminiApiKey: string;
  geminiPrompt: string;
  geminiMaxTokens: number;
  geminiTemperature: number;
  geminiMaxMessages: number;
};

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { searchParam, pageNumber } = req.query as IndexQuery;
  const { companyId } = req.user;

  const { queueIntegrations, count, hasMore } = await ListQueueIntegrationService({
    searchParam,
    pageNumber,
    companyId
  });

  return res.json({ queueIntegrations, count, hasMore });
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { companyId, profile } = req.user;

  // Verifica se o usuário tem permissão (admin ou super)
  if (profile !== "admin" && profile !== "super") {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }

  const newQueueIntegration: StoreData = req.body;

  const queueIntegration = await CreateQueueIntegrationService({
    ...newQueueIntegration,
    companyId
  });

  const io = getIO();
  io.emit("queueIntegration", {
    action: "update",
    queueIntegration
  });

  return res.status(200).json(queueIntegration);
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { queueIntegrationId } = req.params;
  const { companyId } = req.user;

  const queueIntegration = await ShowQueueIntegrationService(queueIntegrationId, companyId);

  return res.status(200).json(queueIntegration);
};

export const update = async (req: Request, res: Response): Promise<Response> => {
  const { queueIntegrationId } = req.params;
  const { companyId, profile } = req.user;
  const queueIntegrationData = req.body;

  // Verifica se o usuário tem permissão (admin ou super)
  if (profile !== "admin" && profile !== "super") {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }

  const queueIntegration = await UpdateQueueIntegrationService({
    integrationId: queueIntegrationId,
    companyId,
    queueIntegrationData
  });

  const io = getIO();
  io.emit("queueIntegration", {
    action: "update",
    queueIntegration
  });

  return res.status(200).json(queueIntegration);
};

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { queueIntegrationId } = req.params;
  const { companyId, profile } = req.user;

  // Verifica se o usuário tem permissão (admin ou super)
  if (profile !== "admin" && profile !== "super") {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }

  await DeleteQueueIntegrationService({
    id: queueIntegrationId,
    companyId
  });

  const io = getIO();
  io.emit("queueIntegration", {
    action: "delete",
    queueIntegrationId
  });

  return res.status(200).json({ message: "Integration deleted" });
};

export const test = async (req: Request, res: Response): Promise<Response> => {
  const data = req.body as DialogflowSessionRequest;

  const result = await TestDialogflowSession({
    projectName: data.projectName,
    jsonContent: data.jsonContent,
    language: data.language
  });

  return res.status(200).json(result);
};