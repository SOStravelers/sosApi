import * as PAYPAL_SERVICE from "../../services/paypal.js";
import * as STRIPE_SERVICE from "../../services/stripe.js";
import Booking from "../bookings/model.js";
import Currency from "../currencies/model.js";
import Payment from "../payments/model.js";
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

    return price == totalSelected;
  } catch (err) {
    throw err;
  }
};

const validatePriceProduct = async (
  price,
  categories,
  selectedData,
  currency
) => {
  try {
    let totalCalculated = 0;

    // Recorremos cada sección seleccionada por el usuario
    for (const section of selectedData) {
      const categoryId = section.sectionId;

      // Buscamos la categoría correspondiente
      const category = categories.find(
        (c) => c.category._id.toString() === categoryId
      );
      if (!category) continue;

      for (const userProduct of section.products) {
        const productId = userProduct.productId;

        // Buscamos el producto dentro de la categoría
        const product = category.products.find(
          (p) => p.product._id.toString() === productId
        );
        if (!product) continue;

        const unitPrice = product.price?.[currency] || 0;
        const qty = userProduct.qty || 0;

        totalCalculated += unitPrice * qty;
      }
    }

    const totalStripe = price;

    console.log(
      "🧮 TOTAL en base de datos:",
      totalCalculated,
      "| Solicitado a enviar a stripe:",
      totalStripe
    );

    return totalStripe === totalCalculated;
  } catch (error) {
    throw error;
  }
};

const opciones = ["usd", "brl", "eur"];

//---------------
//-----FUNCIONES
//---------------

export function isBeforeHoursThreshold(
  dateString,
  hoursBefore,
  language = "pt"
) {
  const targetDate = new Date(dateString);

  if (isNaN(targetDate.getTime())) {
    console.error("❌ Fecha inválida:", dateString);
    return {
      isBefore: false,
      cancelTime: {
        isoTime: null,
        stringData: "",
      },
    };
  }

  // Calcular la fecha límite
  const thresholdDate = new Date(
    targetDate.getTime() - hoursBefore * 60 * 60 * 1000
  );

  const now = new Date(); // ya es en UTC

  return now < thresholdDate;
}

//Crear payment Intent tradicional
export const paymentIntentStripe = async (data, user) => {
  logger.info("*** CREATE PAYMENT INTENT STRIPE PAYMENT DAO ***");
  try {
    //---------------Validaciones------------------------
    const isoTime = data.isoTime;
    const isPast = new Date(isoTime) < new Date();
    if (isPast) throw createError(400, "Invalid isoTime");

    if (!opciones.includes(data.currency))
      throw createError(400, "Invalid currency");
    //---------------A buscar data-----------------------
    const subservice = await Subservice.findById(data.subservice)
      .populate({
        path: "service",
        select: "name",
      })
      .populate("categories.category", "title")
      .populate("categories.products.product", "name")
      .lean();
    if (!subservice) throw createError(404, "Subservice not found");
    //---------------------------------------------------
    //--------Analizar si data no fue adulterada---------
    console.log("el precio", data.amount);
    console.log("el tipo de servicio", subservice.typeService);
    if (subservice.typeService == "tour") {
      const validate = await validatePriceTour(
        data.amountService,
        subservice.tourData,
        data.selectedData,
        data.currency
      );
      if (!validate) throw createError(400, "Invalid price");
    } else if (subservice.typeService == "product") {
      if (data.selectedData.length == 0)
        throw createError(400, "Invalid price");

      const validate = await validatePriceProduct(
        data.amount,
        subservice.categories,
        data.selectedData,
        data.currency
      );
      if (!validate) throw createError(400, "Invalid price");
    } else {
      throw createError(400, "Invalid type service");
    }
    let chargeValidate = false;

    if (subservice.service._id.toString() == "67c11c4917c3a7a2c353cb1b") {
      chargeValidate = true;
    } else if (subservice.withTicket) {
      throw createError(400, "Invalid type service");
    } else {
      const hasCancel = isBeforeHoursThreshold(
        service.startTime.isoTime,
        service.timeUntilCancel
      );
      hasCancel ? (chargeValidate = true) : (chargeValidate = false);
    }

    //----------------Envio a Stripe--------------------
    const paymentIntents = await STRIPE_SERVICE.createPaymentIntent(
      data,
      user,
      subservice,
      chargeValidate
    );
    console.log("los payments", paymentIntents);
    // const dataPayment = {
    //   paymentMethod: "stripe",
    //   status: "pending",
    //   amount: paymentIntents[0].amount,
    //   amountPaid: paymentIntent.amount,
    //   pricePaid: 0,
    //   transactionId: paymentIntent.id,
    // };
    // const currency = await Currency.findOne({ code: data.currency });
    // dataPayment.currency = currency._id;

    // const newPayment = new Payment(dataPayment);
    // await newPayment.save();
    //---------------------------------------------------
    return { clientSecret: paymentIntents[0].paymentIntent.client_secret };
    // return { clientSecret: paymentIntents[0] };
  } catch (err) {
    throw err;
  }
};
// Obtener metodos de pago de un customer Id de stripe
export const listMethodsPaymentClient = async (customerId) => {
  logger.info("*** LIST METHODS PAYMENT CLIENT STRIPE PAYMENT DAO ***");
  try {
    const methods = await STRIPE_SERVICE.MethodsPaymentClient(customerId);
    return methods;
  } catch (err) {
    throw err;
  }
};
//Crear Payment Intent con el uso de un customer Id de stripe
export const paymentIntentClient = async (data) => {
  logger.info("*** PAYMENT INTENT CLIENT STRIPE PAYMENT DAO ***");
  try {
    const { customerId, savedPaymentMethodId, currency, amount, automatic } =
      data;
    if (!opciones.includes(currency))
      throw createError(400, "Invalid currency");
    const paymentIntent = await STRIPE_SERVICE.paymentIntentClient({
      customerId,
      savedPaymentMethodId,
      currency,
      amount,
      automatic,
    });
    return paymentIntent;
  } catch (err) {
    throw err;
  }
};
//Crear link de pago custom
export const createCheckoutLink = async (data) => {
  logger.info("*** CREATE CHECKOUT LINK STRIPE PAYMENT DAO ***");
  try {
    const { name, description, amount, defaultQty, maxQty, minQty } = data;
    const link = await STRIPE_SERVICE.createCheckoutLinkStripe({
      name,
      description,
      amount,
      defaultQty,
      maxQty,
      minQty,
    });
    return link;
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
