import * as PAYPAL_SERVICE from "../../services/paypal.js";
import * as STRIPE_SERVICE from "../../services/stripe.js";
import Booking from "../bookings/model.js";
import { createError } from "../../config/error.js";
import Subservice from "../subservices/model.js";

//-----------------
//------STRIPE-----
//-----------------

const validatePriceTour = async (price, tourData, selectedData, currency) => {
  logger.info("*** VALIDATE PRICE TOUR STRIPE PAYMENT DAO ***");
  try {
    const totalAdult =
      selectedData?.amountAdults * tourData?.adultPrice[currency] || 0;
    const totalChildren =
      selectedData?.amountChildren * tourData?.childrenPrice[currency] || 0;
    console.log("totals", totalAdult, totalChildren);
    const totalSelected = totalAdult + totalChildren;
    if (price / 100 == totalSelected) {
      return true;
    } else {
      return false;
    }
  } catch (err) {
    throw err;
  }
};

export const paymentIntentStripe = async (data, user) => {
  logger.info("*** CREATE PAYMENT INTENT STRIPE PAYMENT DAO ***");
  try {
    console.log("la data", data);
    if (!data.subservice) throw createError(400, "Missing id subservice");
    const subservice = await Subservice.findById(data.subservice).populate({
      path: "service",
      select: "name",
    });
    console.log(subservice.service);
    if (!subservice) throw createError(404, "Subservice not found");
    const opciones = ["usd", "brl", "eur"];
    if (!opciones.includes(data.currency))
      throw createError(400, "Invalid currency");
    if (subservice.typeService == "tour") {
      const validate = await validatePriceTour(
        data.amount,
        subservice.tourData,
        data.selectedData,
        data.currency
      );
      if (!validate) throw createError(400, "Invalid price");
    }
    const paymentIntent = await STRIPE_SERVICE.createPaymentIntent(
      data,
      user,
      subservice
    );
    return { clientSecret: paymentIntent.client_secret };
  } catch (err) {
    throw err;
  }
};
//---------------
export const transferPayments = async (data, user) => {
  logger.info("*** TRANSFER PAYMENTS STRIPE PAYMENT DAO ***");
  try {
    const result = await STRIPE_SERVICE.transferPaymentsStripe(data, user);
    return result;
  } catch (err) {
    throw err;
  }
};
//---------------
//Capture payment intent change to charge
export const capturePaymentStripe = async (idBooking) => {
  logger.info("*** CAPTURE PAYMENT INTENT STRIPE PAYMENT DAO ***");
  try {
    const booking = await Booking.findById(idBooking);
    console.log(booking.payment);
    const paymentIntent = await STRIPE_SERVICE.capturePaymentIntent(booking);
    return paymentIntent;
  } catch (err) {
    throw err;
  }
};
//---------------
export const updatedPaymentIntentStripe = async (data) => {
  logger.info("*** UPDATE PAYMENT INTENT STRIPE PAYMENT DAO ***");
  try {
    const paymentIntent = await STRIPE_SERVICE.updatedPaymentIntent(data);
    return paymentIntent;
  } catch (err) {
    throw err;
  }
};
//---------------
export const cancelPaymentIntentStripe = async (id) => {
  logger.info("*** CANCEL PAYMENT INTENT STRIPE PAYMENT DAO ***");
  try {
    const paymentIntent = await STRIPE_SERVICE.cancelPaymentIntent(id);
    return paymentIntent;
  } catch (err) {
    throw err;
  }
};
//---------------
export const refundStripe = async (data) => {
  logger.info("*** REFUND PAYMENT STRIPE PAYMENT DAO ***");
  try {
    const result = await STRIPE_SERVICE.refund(data);
    return result;
  } catch (err) {
    throw err;
  }
};
//---------------
export const getStripeLink = async (id) => {
  logger.info("*** GET LINK STRIPE PAYMENT DAO ***");
  try {
    const link = await STRIPE_SERVICE.getLoginLink(id);
    return link;
  } catch (err) {
    throw err;
  }
};
//-----------------

export const getPaymentIntentById = async (id) => {
  logger.info("*** GET PAYMENT INTENT BY ID STRIPE PAYMENT DAO ***");
  try {
    const link = await STRIPE_SERVICE.getPaymentIntent(id);
    return link;
  } catch (err) {
    throw err;
  }
};

//-----------------

export const creteDirectPaymentStripe = async (data) => {
  logger.info("*** GET PAYMENT INTENT BY ID STRIPE PAYMENT DAO ***");
  try {
    const link = await STRIPE_SERVICE.createDirectPaymentIntent(data);
    return link;
  } catch (err) {
    throw err;
  }
};

//-----------------
//------PAYPAL-----
//-----------------
export const createOrderPaypal = async (data) => {
  logger.info("*** CREATE ORDER PAYPAL PAYMENT DAO ***");
  try {
    let response = await PAYPAL_SERVICE.createOrderPaypal(data);
    return response;
  } catch (err) {
    throw err;
  }
};

export const aproveOrderPaypal = async (data) => {
  logger.info("*** APROVE ORDER PAYPAL PAYMENT DAO ***");
  try {
    let response = await PAYPAL_SERVICE.captureOrderPaypal(data);
    return response;
  } catch (err) {
    throw err;
  }
};
