import User from "../models/user.js";
import envar from "../config/envar.js";
import Stripe from "stripe";
const stripe = new Stripe(envar().STRIPE_SECRET_KEY);

// export const createPaymentIntent = async (data) => {
//   try {
//     if (!envar().STRIPE_SECRET_KEY) {
//       throw new Error("MISSING_API_CREDENTIALS");
//     }
//     const stripe = new Stripe(envar().STRIPE_SECRET_KEY);
//     const paymentIntent = await stripe.paymentIntents.create({
//       amount: data.amount * 100,
//       currency: "usd",
//       automatic_payment_methods: { enabled: true },
//     });
//     return paymentIntent;
//   } catch (error) {
//     throw err;
//   }
// };

export const createPaymentIntent = async (req, res) => {
  const { amount } = req.body;
  const user = req.user;

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      customer: user.paymentData.stripeCustomerId,
      currency: "usd",
      setup_future_usage: "off_session",
    });
    console.log(paymentIntent);
    res.status(200).json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const chargeCustomer = async (customerId, amount) => {
  try {
    if (!envar().STRIPE_SECRET_KEY) {
      throw new Error("MISSING_API_CREDENTIALS");
    }
    const stripe = new Stripe(envar().STRIPE_SECRET_KEY);
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100,
      currency: "usd",
      customer: customerId,
    });
    return paymentIntent;
  } catch (error) {
    throw error;
  }
};

export const createCustomerId = async (id) => {
  const user = await User.findById(id);
  if (user) {
    if (
      user.paymentData &&
      (!user.paymentData.stripeCustomerId ||
        user.paymentData.stripeCustomerId == "")
    ) {
      const customer = await stripe.customers.create();
      user.paymentData.stripeCustomerId = customer.id;
      user.save();
      return customer.id;
    }
  }
};

export const capturePaymentIntent = async (id) => {
  try {
    const paymentIntent = await stripe.paymentIntents.capture(id);
    return paymentIntent;
  } catch (error) {
    throw error;
  }
};
