import { captureOrder, createOrderPaypal } from "../services/paypal.js";
import {
  cancelPaymentIntent,
  capturePaymentIntent,
  updatedPaymentIntent,
  createPaymentIntent,
  createPaymentIntentAutomatic,
  refund,
  transferPaymentsStripe,
  getLoginLink,
  getPaymentIntent,
} from "../services/stripe.js";
import Booking from "../models/booking.js";

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

export const paymentIntentStripe = async (req, res, next) => {
  try {
    const data = req.body;
    console.log("INTENTANDO");
    const user = req.user;
    const paymentIntent = await createPaymentIntentAutomatic(data, user);
    res.status(200).json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    next(error);
  }
};

export const transferPayments = async (req, res, next) => {
  try {
    const data = req.body;
    const user = req.user;
    const message = await transferPaymentsStripe(data, user);
    res.status(200).json({ message: message });
  } catch (error) {
    next(error);
  }
};

//Capture payment intent change to charge
export const capturePaymentStripe = async (req, res, next) => {
  try {
    const id = req.params.id; // Hay que buscarla por la id del booking y ahi la id del payment intent
    const booking = await Booking.findById(id);
    console.log(booking.payment);
    const paymentIntent = await capturePaymentIntent(booking);
    res.status(200).json(paymentIntent);
  } catch (err) {
    next(err);
  }
};
export const updatedPaymentIntentStripe = async (req, res, next) => {
  try {
    const data = req.body;
    const paymentIntent = await updatedPaymentIntent(data);
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
  console.log("refund", req.body);
  try {
    const data = req.body;
    const result = await refund(data);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const getStripeLink = async (req, res, next) => {
  try {
    const id = req.params.id;
    const link = await getLoginLink(id);
    res.status(200).json(link);
  } catch (err) {
    next(err);
  }
};

export const getPaymentIntentById = async (req, res, next) => {
  try {
    const paymentIntentId = req.params.id;
    const link = await getPaymentIntent(paymentIntentId);
    res.status(200).json(link);
  } catch (err) {
    next(err);
  }
};
//-----------------
