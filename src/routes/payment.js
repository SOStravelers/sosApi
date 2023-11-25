import Router from "express";
import validateParams from "../middleware/validate.js";
import {
  aprovedOrder,
  createOrder,
  paymentIntentStripe,
  capturePaymentStripe,
  updatedPaymentIntentStripe,
  cancelPaymentIntentStripe,
  refundStripe,
} from "../controllers/payment.js";

const router = Router();

//------PAYPAL------
router.post("/newOrder", createOrder);
router.post("/approvedOrder", aprovedOrder);

//------STRIPE------
router.post(
  "/stripe/create",
  validateParams(
    [
      {
        param_key: "amount",
        required: true,
        type: "number",
      },
      {
        param_key: "currency",
        required: true,
        type: "string",
      },
    ],
    "body"
  ),
  paymentIntentStripe
);
router.get(
  "/stripe/capture/:id",
  validateParams(
    [
      {
        param_key: "id",
        required: true,
        type: "string",
      },
    ],
    "params"
  ),
  capturePaymentStripe
);
router.put(
  "/stripe/update",
  validateParams(
    [
      {
        param_key: "id",
        required: true,
        type: "string",
      },
      {
        param_key: "metadat",
        required: true,
        type: "object",
      },
    ],
    "body"
  ),
  updatedPaymentIntentStripe
);
router.get(
  "/stripe/cancel/:id",
  validateParams(
    [
      {
        param_key: "id",
        required: true,
        type: "string",
      },
    ],
    "params"
  ),
  cancelPaymentIntentStripe
);
router.post(
  "/stripe/refund",
  validateParams(
    [
      {
        param_key: "id",
        required: true,
        type: "string",
      },
      {
        param_key: "amount",
        required: true,
        type: "number",
      },
    ],
    "body"
  ),
  refundStripe
);

export default router;
