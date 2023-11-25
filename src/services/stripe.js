import User from "../models/user.js";
import envar from "../config/envar.js";
import Stripe from "stripe";
const stripe = new Stripe(envar().STRIPE_SECRET_KEY);

//CREATE CUSTOMER ID
export const createCustomerId = async (id) => {
  logger.info("---CREATE CUSTOMER ID STRIPE ---");
  try {
    const user = await User.findById(id);
    if (user) {
      if (
        user.paymentData &&
        (!user.paymentData.stripeCustomerId ||
          user.paymentData.stripeCustomerId == "")
      ) {
        if (!envar().STRIPE_SECRET_KEY) {
          throw new Error("MISSING_API_CREDENTIALS");
        }
        const customer = await stripe.customers.create();
        user.paymentData.stripeCustomerId = customer.id;
        user.save();
        return customer.id;
      }
    }
  } catch (error) {
    throw error;
  }
};
//CREATE PAYMENT INTENT
export const createPaymentIntent = async (data) => {
  logger.info("---CREATE PAYMENT INTENT STRIPE ---");
  try {
    if (!envar().STRIPE_SECRET_KEY) {
      throw new Error("MISSING_API_CREDENTIALS");
    }
    const paymentIntent = await stripe.paymentIntents.create({
      amount: data.amount,
      currency: data.currency,
      // currency: "usd",
      capture_method: "manual",
      // automatic_payment_methods: { enabled: true },
      // setup_future_usage: "off_session",
      // customer: user.paymentData.stripeCustomerId,
    });
    console.log(paymentIntent);
    return paymentIntent;
  } catch (error) {
    throw error;
  }
};
//CAPTURE PAYMENT INTENT
export const capturePaymentIntent = async (id) => {
  logger.info("---CAPTURE PAYMENT INTENT STRIPE ---");
  try {
    if (!envar().STRIPE_SECRET_KEY) {
      throw new Error("MISSING_API_CREDENTIALS");
    }
    const paymentIntent = await stripe.paymentIntents.capture(id);
    return paymentIntent;
  } catch (error) {
    throw error;
  }
};
//UPDATE PAYMENT INTENT WITH METADATA
export const updatedPaymentIntent = async (data) => {
  logger.info("---UPDATE PAYMENT INTENT STRIPE ---");
  try {
    if (!envar().STRIPE_SECRET_KEY) {
      throw new Error("MISSING_API_CREDENTIALS");
    }
    const paymentIntent = await stripe.paymentIntents.update(
      data.id, // ID del PaymentIntent que quieres actualizar
      {
        metadata: data.metadata,
        // metadata: {
        //   order_id: '123',
        //   user_id: '456'
        // }
      }
    );
    return paymentIntent;
  } catch (err) {
    throw err;
  }
};
//CANCEL PAYMENT INTENT
export const cancelPaymentIntent = async (id) => {
  logger.info("---CANCEL PAYMENT INTENT STRIPE---");
  try {
    if (!envar().STRIPE_SECRET_KEY) {
      throw new Error("MISSING_API_CREDENTIALS");
    }
    const canceledPaymentIntent = await stripe.paymentIntents.cancel(id);
    return canceledPaymentIntent;
  } catch (error) {
    throw error;
  }
};

//REFUND PAYMENT INTENT
export const refund = async (data) => {
  console.log("refund", data);
  logger.info("---REFUND CHARGE STRIPE---", data);
  try {
    if (!envar().STRIPE_SECRET_KEY) {
      throw new Error("MISSING_API_CREDENTIALS");
    }
    console.log("id", data.id);
    const paymentIntent = await stripe.paymentIntents.retrieve(data.id);
    console.log(paymentIntent);
    const chargeId = paymentIntent.latest_charge;
    if (chargeId) {
      console.log("encontro charge");
      const refund = await stripe.refunds.create({
        charge: chargeId,
        amount: data.amount, // cantidad en la moneda más pequeña (centavos para USD)
        //charge: "ch_1J2QIK2eZvKYlo2CZtE9nqeu",
        //amount: 500,
      });
      return refund;
    }
  } catch (err) {
    throw err;
  }
};
