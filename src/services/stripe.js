import envar from "../config/envar.js";

import Stripe from "stripe";

export const createPaymentIntent = async (data) => {
  try {
    if (!envar().STRIPE_SECRET_KEY) {
      throw new Error("MISSING_API_CREDENTIALS");
    }
    const stripe = new Stripe(envar().STRIPE_SECRET_KEY);
    const paymentIntent = await stripe.paymentIntents.create({
      amount: data.amount * 100,
      currency: "usd",
      automatic_payment_methods: { enabled: true },
    });
    return paymentIntent;
  } catch (error) {
    console.error("Failed to generate Access Token:", error);
  }
};
