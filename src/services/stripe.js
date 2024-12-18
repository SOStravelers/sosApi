import User from "../models/user.js";
import envar from "../config/envar.js";
import Stripe from "stripe";
import Booking from "../models/booking.js";
const stripe = new Stripe(envar().STRIPE_SECRET_KEY);

const populate = [
  {
    path: "businessUser",
    select: "businessData personalData img",
  },
  {
    path: "workerUser",
    select: "workerData personalData img",
  },
  {
    path: "service",
    select: "name isActive coverImg",
  },
  {
    path: "subservice",
    select: "name isActive coverImg duration",
  },
  {
    path: "clientUser",
    select: "personalData img",
  },
];

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
      capture_method: "manual", // esto es para que no se capture automaticamente. se hace con el capturePaymentIntent hasta 7 dias despues
      description: "Service booking SOS app",
      automatic_payment_methods: { enabled: true },
      // setup_future_usage: "off_session",
      //customer: user.paymentData.stripeCustomerId,
    };
    if (userDB.paymentData && userDB.paymentData.stripeCustomerId) {
      data.customer = userDB.paymentData.stripeCustomerId;
    }
    const paymentIntent = await stripe.paymentIntents.create(objeto);
    console.log(paymentIntent);
    return paymentIntent;
  } catch (error) {
    throw error;
  }
};

//CAPTURE PAYMENT INTENT
export const capturePaymentIntent = async (
  booking,
  percentage = 1,
  statusBooking = "confirmed",
  canceledData = null,
  completedData = null
) => {
  logger.info("---CAPTURE PAYMENT INTENT STRIPE ---");
  try {
    if (!envar().STRIPE_SECRET_KEY) {
      throw new Error("MISSING_API_CREDENTIALS");
    }

    // Captura el pago
    console.log("el precio", booking.price);
    const finalCost = booking.payment.price * 100 * percentage;
    const paymentIntent = await stripe.paymentIntents.capture(
      booking.payment.paymentId,
      {
        amount_to_capture: finalCost, // Captura solo $10.00 del monto autorizado
      }
    );
    // Obtiene el cargo y balanceTransaction
    const chargeId = paymentIntent.latest_charge;
    const charge = await stripe.charges.retrieve(chargeId);
    const balanceTransaction = await stripe.balanceTransactions.retrieve(
      charge.balance_transaction
    );
    console.log(balanceTransaction.net / 100);
    console.log(balanceTransaction.currency);

    //Update booking
    booking.payment.status = "paid";
    booking.status = statusBooking;
    booking.payment.priceBRL = balanceTransaction.net / 100;
    canceledData ? (booking.canceledData = canceledData) : "";
    completedData ? (booking.completedData = completedData) : "";
    const updatedBooking = await Booking.findByIdAndUpdate(
      booking._id,
      booking,
      { new: true }
    )
      .populate(populate)
      .exec();
    return updatedBooking;

    // const invoiceItem = await stripe.invoiceItems.create({
    //   customer: paymentIntent.customer,
    //   amount: paymentIntent.amount,
    //   currency: paymentIntent.currency,
    //   description: paymentIntent.description,
    // });
    // // Crea una factura para el InvoiceItem
    // const invoice = await stripe.invoices.create({
    //   customer: paymentIntent.customer,
    //   auto_advance: true, // Auto-finalize this draft after ~1 hour
    //   items: [{ invoiceitem: invoiceItem.id }], // Asociar el InvoiceItem con la factura
    // });

    // // Finaliza la factura y envíala por correo electrónico
    // await stripe.invoices.finalizeInvoice(invoice.id);

    // console.log("invoice", invoice);
  } catch (error) {
    throw error;
  }
};

//CREATE PAYMENT INTENT AUTOMATIC FOR DIFERENTS USERS
// CREATE PAYMENT INTENT WITH IMMEDIATE CHARGE AND PAYMENT SPLIT
export const createPaymentIntentAutomatic = async (data, user) => {
  logger.info("--- CREATE PAYMENT INTENT AUTOMATIC STRIPE ---");
  try {
    if (!envar().STRIPE_SECRET_KEY) {
      throw new Error("MISSING_API_CREDENTIALS");
    }

    const userDB = await User.findById(user._id.toString());
    const customerId = userDB.paymentData?.stripeCustomerId || null;

    // Lógica de cálculo
    const totalAmount = data.amount; // Monto total en centavos
    console.log("Monto total:", totalAmount);
    console.log("la data", data);
    // Crear el PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: data.currency || "usd",
      customer: customerId,
      description: data.service + "-" + data.subservice,
      metadata: {
        clientName:
          user?.personalData?.name?.first +
          " " +
          user?.personalData?.name?.last,
        service: data?.service,
        subservice: data?.subservice,
        date: data?.date,
        startTime: data?.startTime?.isoTime,
        clientsNumber: data?.clientsNumber,
        language: data?.language,
      },
      payment_method_types: ["card"], // Solo tarjetas de crédito
      automatic_payment_methods: { enabled: false }, // Desactiva métodos automáticos con redirecciones
    });

    console.log("PaymentIntent creado:", paymentIntent.id);
    return paymentIntent;
  } catch (error) {
    console.error("Error creando PaymentIntent:", error);
    throw error;
  }
};

export const transferPaymentsStripe = async (data) => {
  logger.info("--- CREATE TRANSFERS STRIPE ---");
  try {
    const { paymentIntentId } = data;

    if (!paymentIntentId) {
      throw new Error("PaymentIntent ID is required.");
    }
    console.log("la id", paymentIntentId);
    // Recuperar el PaymentIntent
    let paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    console.log("el payment", paymentIntent);
    // Verificar estado
    if (paymentIntent.status !== "succeeded") {
      if (paymentIntent.status === "requires_capture") {
        console.log("Capturando el PaymentIntent...");
        await stripe.paymentIntents.capture(paymentIntentId);
        paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      } else {
        throw new Error(
          `El PaymentIntent no está en un estado procesable: ${paymentIntent.status}`
        );
      }
    }
    console.log("paso1");
    // Verificar cargos
    if (!paymentIntent.latest_charge) {
      throw new Error("No se encontraron cargos para este PaymentIntent.");
    }

    const chargeId = paymentIntent.latest_charge;
    console.log("Charge ID:", chargeId);
    console.log("el precio", paymentIntent.amount);
    // Calcular divisiones
    const totalAmount = paymentIntent.amount;
    const providerShare = Math.round(totalAmount * 0.5);
    const ownerShare = Math.round(totalAmount * 0.4);

    // Realizar transferencias
    const transferProvider = await stripe.transfers.create({
      amount: providerShare,
      currency: paymentIntent.currency,
      destination: "acct_1QXAPQQmwgOl0zRD",
      source_transaction: chargeId,
      description: "W-" + paymentIntent.description,
    });

    const loginLink1 = await stripe.accounts.createLoginLink(
      "acct_1QXAPQQmwgOl0zRD"
    );
    console.log("Login Link:", loginLink1.url);

    const transferOwner = await stripe.transfers.create({
      amount: ownerShare,
      currency: paymentIntent.currency,
      destination: "acct_1QXB9kH25M0VH3l6",
      source_transaction: chargeId,
      description: "B-" + paymentIntent.description,
    });

    const loginLink2 = await stripe.accounts.createLoginLink(
      "acct_1QXB9kH25M0VH3l6"
    );
    console.log("Login Link:", loginLink2.url);

    logger.info("Transferencias realizadas con éxito:", {
      provider: transferProvider,
      owner: transferOwner,
    });

    return { provider: transferProvider, owner: transferOwner };
  } catch (error) {
    logger.error("Error realizando transferencias:", error.message);
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

export const getLoginLink = async (idAccount) => {
  try {
    const link = await stripe.accounts.createLoginLink(idAccount);
    return link;
  } catch (err) {
    throw err;
  }
};
export const getPaymentIntent = async (paymentIntentId) => {
  try {
    let paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return paymentIntent;
  } catch (err) {
    throw err;
  }
};
