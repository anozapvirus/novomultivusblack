import { Router } from "express";
import isAuth from "../middleware/isAuth";

import * as SubscriptionController from "../controllers/SubscriptionController";

const subscriptionRoutes = Router();

// Rotas de assinatura
subscriptionRoutes.post("/subscription", isAuth, SubscriptionController.createSubscription);
subscriptionRoutes.get("/subscription/check/:paymentId", isAuth, SubscriptionController.checkPaymentStatus);
subscriptionRoutes.post("/subscription/webhook/:type?", SubscriptionController.webhook);

export default subscriptionRoutes;
