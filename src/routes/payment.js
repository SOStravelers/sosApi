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
  transferPayments,
  getStripeLink,
  getPaymentIntentById,
} from "../controllers/payment.js";

const router = Router();

//------PAYPAL------
router.post("/newOrder", createOrder);
router.post("/approvedOrder", aprovedOrder);

//------STRIPE------
router.post(
  "/stripe/payment-intents",
  validateParams(
    [
      {
        param_key: "amount",
        required: false,
        type: "number",
      },
      {
        param_key: "currency",
        required: false,
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

router.post(
  "/stripe/transfer-payments",
  validateParams(
    [
      {
        param_key: "paymentIntentId",
        required: true,
        type: "string",
      },
      {
        param_key: "workerUser",
        required: true,
        type: "string",
      },
      {
        param_key: "service",
        required: true,
        type: "string",
      },
      {
        param_key: "partner",
        required: false,
        type: "string",
      },
    ],
    "body"
  ),
  transferPayments
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
        param_key: "metadata",
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
router.put(
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

router.get(
  "/stripe/getLink/:id",
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
  getStripeLink
);

router.get(
  "/stripe/getPaymentIntent/:id",
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
  getPaymentIntentById
);

export default router;
