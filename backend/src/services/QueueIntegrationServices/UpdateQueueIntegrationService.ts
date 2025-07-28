import * as Yup from "yup";
import { Op } from "sequelize";
import AppError from "../../errors/AppError";
import QueueIntegrations from "../../models/QueueIntegrations";
import ShowQueueIntegrationService from "./ShowQueueIntegrationService";

interface QueueIntegrationData {
  type: string;
  name: string;
  projectName: string;
  jsonContent: string;
  language: string;
  urlN8N: string;
  typebotSlug?: string;
  typebotExpires?: number;
  typebotKeywordFinish?: string;
  typebotUnknownMessage?: string;
  typebotDelayMessage?: number;
  typebotKeywordRestart?: string;
  typebotRestartMessage?: string;
  geminiApiKey?: string;
  geminiPrompt?: string;
  geminiMaxTokens?: number;
  geminiTemperature?: number;
  geminiMaxMessages?: number;
  geminiTestPhone?: string;
}

interface Request {
  integrationId: string | number;
  companyId: number;
  queueIntegrationData: QueueIntegrationData;
}

const UpdateQueueIntegrationService = async ({
  integrationId,
  companyId,
  queueIntegrationData
}: Request): Promise<QueueIntegrations> => {
  const { type, name, projectName, jsonContent, language, urlN8N, typebotDelayMessage, typebotExpires, typebotKeywordFinish, typebotKeywordRestart, typebotRestartMessage, typebotSlug, typebotUnknownMessage, geminiApiKey, geminiPrompt, geminiMaxTokens, geminiTemperature, geminiMaxMessages, geminiTestPhone } = queueIntegrationData;

  const queueIntegration = await ShowQueueIntegrationService(integrationId, companyId);

  const schema = Yup.object().shape({
    name: Yup.string()
      .min(2)
      .test(
        "Check-name",
        "This QueueIntegrations name is already used.",
        async value => {
          if (!value) return true;
          const nameExists = await QueueIntegrations.findOne({
            where: { name: value, companyId, id: { [Op.not]: integrationId } }
          });
          return !nameExists;
        }
      )
  });

  try {
    await schema.validate({
      name
    });
  } catch (err) {
    throw new AppError(err.message);
  }

  await queueIntegration.update({
    type,
    name,
    projectName,
    jsonContent,
    language,
    urlN8N,
    typebotDelayMessage,
    typebotExpires,
    typebotKeywordFinish,
    typebotKeywordRestart,
    typebotRestartMessage,
    typebotSlug,
    typebotUnknownMessage,
    geminiApiKey,
    geminiPrompt,
    geminiMaxTokens,
    geminiTemperature,
    geminiMaxMessages,
    geminiTestPhone
  });

  return queueIntegration;
};

export default UpdateQueueIntegrationService;