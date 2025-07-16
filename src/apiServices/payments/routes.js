import Router from "express";
import validateParams from "../../middleware/validate.js";
import * as PAYMENT_CONTROLLERS from "./controllers.js";
import { isAuth } from "../../middleware/auth.js";
const router = Router();

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
  isAuth,
  PAYMENT_CONTROLLERS.paymentIntentStripe
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
  PAYMENT_CONTROLLERS.capturePaymentStripe
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
        param_key: "subService",
        required: false,
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
  PAYMENT_CONTROLLERS.transferPayments
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
  PAYMENT_CONTROLLERS.updatedPaymentIntentStripe
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
  PAYMENT_CONTROLLERS.cancelPaymentIntentStripe
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
  PAYMENT_CONTROLLERS.refundStripe
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
  PAYMENT_CONTROLLERS.getStripeLink
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
  PAYMENT_CONTROLLERS.getPaymentIntentById
);

router.post(
  "/stripe/direct-payment-intent",
  validateParams(
    [
      {
        param_key: "customer",
        required: true,
        type: "string",
      },
      {
        param_key: "currency",
        required: true,
        type: "string",
      },
      {
        param_key: "price",
        required: true,
        type: "number",
      },
    ],
    "body"
  ),
  PAYMENT_CONTROLLERS.creteDirectPaymentStripe
);

// //------PAYPAL------
router.post("/newOrder", PAYMENT_CONTROLLERS.createOrderPaypal);
router.post("/approvedOrder", PAYMENT_CONTROLLERS.aproveOrderPaypal);
export default router;
