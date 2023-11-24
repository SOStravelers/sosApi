import { captureOrder, createOrderPaypal } from "../services/paypal.js";
import { createPaymentIntent } from "../services/stripe.js";

export const createOrder = async (req, res, next) => {
  global.logger.info("---CREATE ORDER---");
  try {
    let data = req.body;
    let response = await createOrderPaypal(data);
    res.send(response.data);
  } catch (err) {
    next(err);
  }
};

export const aprovedOrder = async (req, res, next) => {
  global.logger.info("---APROVED ORDER---");
  try {
    let data = req.body;
    let response = await captureOrder(data);
    res.status(200).json(response.data);
  } catch (err) {
    next(err);
  }
};

export const stripeCreatePaymentIntent = async (req, res, next) => {
  global.logger.info("--CREATE PAYMENT INTENT--");
  try {
    const data = req.body;
    const paymentIntent = await createPaymentIntent(data);
    const response = {
      paymentIntent: { client_secret: paymentIntent.client_secret },
    };
    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
};
