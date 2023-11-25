import Router from "express";

import {
  aprovedOrder,
  createOrder,
  createPaymentIntent,
  capturePayment,
} from "../controllers/payment.js";
import { captureOrder } from "../services/paypal.js";

const router = Router();

router.post("/newOrder", createOrder);
router.post("/approvedOrder", aprovedOrder);

router.post("/stripe/payment-intents", createPaymentIntent);

router.get("/capture/:id", capturePayment);
export default router;
