import User from "../apiServices/users/model.js";
import envar from "../config/envar.js";
import Stripe from "stripe";
import Booking from "../apiServices/bookings/model.js";
const stripe = new Stripe(envar().STRIPE_SECRET_KEY);
import { byPassPolMauro } from "../utils/changeId.js";
import Subservice from "../apiServices/subservices/model.js";

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
  logger.info(">>>CREATE CUSTOMER ID STRIPE <<<");
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
export const createPaymentIntent = async (data, user, subservice) => {
  logger.info(">>> CREATE PAYMENT INTENT STRIPE <<<");
  try {
    if (!envar().STRIPE_SECRET_KEY) {
      throw new Error("MISSING_API_CREDENTIALS");
    }
    let userDB = null;
    if (user) {
      userDB = await User.findById(user._id);

      // Crear customer si no existe
      if (!userDB.paymentData?.stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.name,
        });

        userDB.paymentData.stripeCustomerId = customer.id;
        await userDB.save();
      }
    }
    const language = data.language || "en";

    const dataToSent = {
      amount: data.amount,
      currency: data.currency,
      capture_method: "manual",
      description: subservice.name.en + " - " + subservice.service.name.en,
      automatic_payment_methods: { enabled: true },
      setup_future_usage: "off_session",
      metadata: {
        clientName: data?.clientData?.name.trim(),
        clientEmail: data?.clientData?.email.trim(),
        clientPhone:
          data?.clientData?.phoneCode + "-" + data?.clientData?.phone,
        subservice: subservice._id.toString(),
        service: subservice.service._id.toString(),
        startTime: data?.startTime?.isoTime,
        language: language,
      },
    };

    userDB ? (dataToSent.customer = userDB.paymentData.stripeCustomerId) : null;

    const paymentIntent = await stripe.paymentIntents.create(dataToSent);

    // 🔐 Si ya vino con método de pago (caso off_session), lo guardamos
    if (paymentIntent.payment_method && userDB) {
      userDB.paymentData.paymentMethodId = paymentIntent.payment_method;
      console.log("payment Method", paymentIntent.payment_method);
      await userDB.save();
    }

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

export const askWasCapturedPayment = async (paymentIntentId) => {
  logger.info(">>> ASK CAPTURED PAYMENT INTENT STRIPE <<<");
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    const status = paymentIntent.status;
    console.log("status", paymentIntent.status);
    const captureMethod = paymentIntent.capture_method;

    if (status === "succeeded" && paymentIntent?.amount_received) {
      return {
        status: "capturado",
        amount: paymentIntent.amount,
        amount_received: paymentIntent.amount_received,
        currency: paymentIntent.currency,
      };
    }

    if (
      (status === "requires_capture" || status === "processing") &&
      captureMethod === "manual"
    ) {
      return {
        status: "autorizado",
        amount: paymentIntent.amount,
        amount_received: paymentIntent.amount_received,
        currency: paymentIntent.currency,
      };
    }

    return "fallido"; // incluye casos cancelados, rechazados, o sin charge aún
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
    let userDB = null;
    if (user && user._id) {
      userDB = await User.findById(user._id.toString());
    }
    const customerId = userDB?.paymentData?.stripeCustomerId || null;
    console.log("la ides", customerId);
    // Lógica de cálculo
    const totalAmount = data.amount; // Monto total en centavos
    console.log("Monto total:", totalAmount);
    console.log("la data", data);
    // Crear el PaymentIntent
    const dataPayment = {
      amount: totalAmount,
      currency: data.currency || "usd",
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
    };

    // Agregar customer solo si no es null
    if (customerId) {
      dataPayment.customer = customerId;
    }

    const paymentIntent = await stripe.paymentIntents.create(dataPayment);

    console.log("PaymentIntent creado:", paymentIntent.id);
    return paymentIntent;
  } catch (error) {
    console.error("Error creando PaymentIntent:", error);
    throw error;
  }
};

export const transferPaymentsStripe = async (data, user) => {
  logger.info("--- CREATE TRANSFERS STRIPE ---");
  console.log("dataStripe", data);
  try {
    let allData = byPassPolMauro(data);
    let { paymentIntentId, partner, workerUser, service, subService } = allData;
    console.log("la data", allData);
    if (!paymentIntentId) {
      throw new Error("PaymentIntent ID is required.");
    }
    console.log("la id", paymentIntentId);
    // Recuperar el PaymentIntent
    let paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    // console.log("el payment", paymentIntent);
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

    //cambiar el workerUser si es un subservicio especifico
    const subServiceNow = await Subservice.findById(subService);
    if (subServiceNow.partner) {
      workerUser = subServiceNow.partner;
    }

    console.log("bl3", workerUser, partner);

    const worker = await User.findOne({ _id: workerUser }).select(
      "paymentData email"
    );
    const workerStripeId = worker?.paymentData?.stripeAccountId || null;

    const partnerUser = await User.findOne({ username: partner }).select(
      "paymentData email"
    );

    const partnerStripeId = partnerUser?.paymentData?.stripeAccountId || null;

    console.log(
      "bla",
      worker._id,
      workerStripeId,
      partnerUser._id,
      partnerStripeId
    );

    let priceBRL = 0;

    // Verificar cargos
    if (!paymentIntent.latest_charge) {
      throw new Error("No se encontraron cargos para este PaymentIntent.");
    }

    const chargeId = paymentIntent.latest_charge;
    console.log("Charge ID:", chargeId);
    console.log("el precio", paymentIntent.amount);

    const charge = await stripe.charges.retrieve(chargeId);
    const balanceTransaction = await stripe.balanceTransactions.retrieve(
      charge.balance_transaction
    );

    priceBRL = balanceTransaction.net / 100;

    // Calcular divisiones
    const totalAmount = paymentIntent.amount;

    //se hace transferencia al proveedor
    if (workerStripeId) {
      const providerShare = partnerStripeId
        ? Math.round(totalAmount * 0.8)
        : Math.round(totalAmount * 0.9);

      // Realizar transferencias
      const transferProvider = await stripe.transfers.create({
        amount: providerShare,
        currency: paymentIntent.currency,
        destination: workerStripeId,
        source_transaction: chargeId,
        description: "W - " + paymentIntent.description + " - " + worker.email,
        metadata: {
          paymentIntentId: paymentIntentId,
          clientName: paymentIntent.metadata.clientName,
          service: paymentIntent.metadata.service,
          subservice: paymentIntent.metadata.subservice,
          date: paymentIntent.metadata.date,
          startTime: paymentIntent.metadata.startTime,
          clientsNumber: paymentIntent.metadata.clientsNumber,
          language: paymentIntent.metadata.language,
        },
      });

      const loginLink1 = await stripe.accounts.createLoginLink(workerStripeId);

      logger.info(
        "Transferencias worker realizada",
        transferProvider,
        loginLink1
      );
    }
    //se hace transferencia al partner
    if (partnerStripeId) {
      const partnerShare = Math.round(totalAmount * 0.1);

      // Realizar transferencias
      const transferPartner = await stripe.transfers.create({
        amount: partnerShare,
        currency: paymentIntent.currency,
        destination: partnerStripeId,
        source_transaction: chargeId,
        description:
          "P - " + paymentIntent.description + " - " + partnerUser.email,
        metadata: {
          paymentIntentId: paymentIntentId,
          clientName: paymentIntent.metadata.clientName,
          service: paymentIntent.metadata.service,
          subservice: paymentIntent.metadata.subservice,
          date: paymentIntent.metadata.date,
          startTime: paymentIntent.metadata.startTime,
          clientsNumber: paymentIntent.metadata.clientsNumber,
          language: paymentIntent.metadata.language,
        },
      });

      const loginLink2 = await stripe.accounts.createLoginLink(partnerStripeId);
      logger.info("Transferencias partner realizada", {
        provider: transferPartner,
        link: loginLink2,
      });
    }
    return { priceBRL };
  } catch (error) {
    logger.error("Error realizando transferencias:", error.message);
    throw error;
  }
};
//minicambio
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

export const addIdBookingtoPI = async (PI, idBooking, bookingNumber) => {
  logger.info(">>> ADD METADATA PAYMENT INTENT STRIPE <<<");
  console.log("data", PI, idBooking, bookingNumber);
  try {
    await stripe.paymentIntents.update(PI, {
      metadata: {
        bookingId: idBooking, // ID del booking
        bookingNumber: bookingNumber, // Número del booking
      },
    });
  } catch (err) {
    throw err;
  }
};

export const createDirectPaymentIntent = async (data) => {
  logger.info("---CREATE DIRECT PAYMENT INTENT STRIPE ---");

  try {
    let paymentMethodId;

    // 1. Intentar usar el default_payment_method
    const customer = await stripe.customers.retrieve(data.customer);
    if (customer.invoice_settings?.default_payment_method) {
      paymentMethodId = customer.invoice_settings.default_payment_method;
    } else {
      // 2. Si no hay, buscar uno manualmente
      const methods = await stripe.paymentMethods.list({
        customer: data.customer,
        type: "card",
      });

      if (!methods.data.length) {
        throw new Error("No se encontró ningún método de pago guardado.");
      }

      paymentMethodId = methods.data[0].id;
    }

    // 3. Crear nuevo PaymentIntent con ese método
    const intent = await stripe.paymentIntents.create({
      amount: data.price * 100,
      currency: data.currency || "usd",
      customer: data.customer,
      payment_method: paymentMethodId,
      off_session: true,
      confirm: true,
    });

    return intent;
  } catch (error) {
    logger.error("Fallo en cobro directo:", error.message);
    throw error;
  }
};
