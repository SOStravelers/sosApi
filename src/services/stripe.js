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
        const objeto = {};
        user.phone ? (objeto.phone = user.phone) : "";
        user.email ? (objeto.email = user.email) : "";
        user.personalData
          ? (objeto.name =
              user.personalData.name.first + " " + user.personalData.name.last)
          : "";
        console.log("casa");
        console.log("el objetossss", objeto);
        const customer = await stripe.customers.create(objeto);
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
export const createPaymentIntent = async (data, user) => {
  logger.info("---CREATE PAYMENT INTENT STRIPE ---");
  console.log("data", data);
  console.log("user", user);
  try {
    if (!envar().STRIPE_SECRET_KEY) {
      throw new Error("MISSING_API_CREDENTIALS");
    }
    const userDB = await User.findById(user._id.toString());
    const objeto = {
      amount: data.amount,
      currency: data.currency ? data.currency : "usd",
      // currency: "usd",
      // capture_method: "manual",
      description: "Service booking SOS app",
      automatic_payment_methods: { enabled: true },
      // setup_future_usage: "off_session",
      // customer: user.paymentData.stripeCustomerId,
    };
    userDB && userDB.paymentData && userDB.paymentData.stripeCustomerId
      ? (objeto.customer = userDB.paymentData.stripeCustomerId)
      : "";
    const paymentIntent = await stripe.paymentIntents.create(objeto);
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
    // Crea un InvoiceItem para el PaymentIntent
    const invoiceItem = await stripe.invoiceItems.create({
      customer: paymentIntent.customer,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      description: paymentIntent.description,
    });
    // Crea una factura para el InvoiceItem
    const invoice = await stripe.invoices.create({
      customer: paymentIntent.customer,
      auto_advance: true, // Auto-finalize this draft after ~1 hour
      items: [{ invoiceitem: invoiceItem.id }], // Asociar el InvoiceItem con la factura
    });

    // Finaliza la factura y envíala por correo electrónico
    await stripe.invoices.finalizeInvoice(invoice.id);

    console.log("invoice", invoice);

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
