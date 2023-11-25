import Stripe from "stripe";
import envar from "../config/envar.js";
const stripe = new Stripe(envar().STRIPE_SECRET_KEY);
import { captureOrder, createOrderPaypal } from "../services/paypal.js";
import { capturePaymentIntent } from "../services/stripe.js";

//PAYPAL
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

//STRIPE

export const createPaymentIntent = async (req, res) => {
  const { amount } = req.body;

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 2,
      currency: "usd",
      capture_method: "manual",
    });
    console.log(paymentIntent);
    res.status(200).json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const capturePayment = async (req, res, next) => {
  const id = req.params.id;
  try {
    const paymentIntent = await capturePaymentIntent(id);
    res.status(200).json(paymentIntent);
  } catch (err) {
    next(err);
  }
};
