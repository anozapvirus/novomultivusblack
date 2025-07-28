import AppError from "../../errors/AppError";
import QueueIntegrations from "../../models/QueueIntegrations";
import ShowQueueIntegrationService from "./ShowQueueIntegrationService";

interface Request {
  id: string | number;
  companyId: number;
}

const DeleteQueueIntegrationService = async ({
  id,
  companyId
}: Request): Promise<void> => {
  const queueIntegration = await ShowQueueIntegrationService(id, companyId);

  await queueIntegration.destroy();
};

export default DeleteQueueIntegrationService;