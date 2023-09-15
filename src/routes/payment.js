import Router from "express";

import {
  aprovedOrder,
  createOrder,
  stripeCreatePaymentIntent,
} from "../controllers/payment.js";

const router = Router();

router.post("/newOrder", createOrder);
router.post("/approvedOrder", aprovedOrder);
router.post("/stripe/payment-intents", stripeCreatePaymentIntent);

export default router;
