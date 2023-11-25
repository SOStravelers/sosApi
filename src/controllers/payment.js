import { captureOrder, createOrderPaypal } from "../services/paypal.js";
import {
  cancelPaymentIntent,
  capturePaymentIntent,
  createPaymentIntent,
  refund,
  updatedPaymentIntent,
} from "../services/stripe.js";

//------PAYPAL------
export const createOrder = async (req, res, next) => {
  global.logger.info("---CREATE ORDER---");
  console.log(req.body);
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
//-----------------

//------STRIPE------

export const paymentIntentStripe = async (req, res) => {
  const data = req.body;
  try {
    const paymentIntent = await createPaymentIntent(data);
    res.status(200).json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    next(error);
  }
};

//Capture payment intent change to charge
export const capturePaymentStripe = async (req, res, next) => {
  try {
    const id = req.params.id; // Hay que buscarla por la id del booking y ahi la id del payment intent
    const paymentIntent = await capturePaymentIntent(id);
    res.status(200).json(paymentIntent);
  } catch (err) {
    next(err);
  }
};
export const updatedPaymentIntentStripe = async (req, res, next) => {
  try {
    const metadata = req.body;
    const paymentIntent = await updatedPaymentIntent(metadata);
    res.status(200).json(paymentIntent);
  } catch (err) {
    next(err);
  }
};
export const cancelPaymentIntentStripe = async (req, res, next) => {
  try {
    const id = req.params.id;
    const paymentIntent = await cancelPaymentIntent(id);
    res.status(200).json(paymentIntent);
  } catch (err) {
    next(err);
  }
};
export const refundStripe = async (req, res, next) => {
  try {
    const data = req.body;
    const result = await refund(data);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};
//-----------------
