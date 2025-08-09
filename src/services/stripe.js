import User from "../apiServices/users/model.js";
import envar from "../config/envar.js";
import Stripe from "stripe";
import Booking from "../apiServices/bookings/model.js";
const stripe = new Stripe(envar().STRIPE_SECRET_KEY);
import { byPassPolMauro } from "../utils/changeId.js";
import Subservice from "../apiServices/subservices/model.js";
import { createError } from "../config/error.js";

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

export const createStripeCustomer = async (data, shouldUpdate = true) => {
  logger.verbose(">>> CREATE OR GET STRIPE CUSTOMER <<<");
  if (!data.email) throw createError(400, "Email is required");
  try {
    const { customer, email, name, phone, description, userId, language } =
      data;

    const dataToSave = {};

    // Solo agregar si existen
    if (name) dataToSave.name = name;
    if (email) dataToSave.email = email;
    if (phone) dataToSave.phone = phone;
    if (description) dataToSave.description = description;

    // Metadata segura y filtrada
    const metadata = {};
    if (userId) metadata.userId = userId;
    if (language) metadata.language = language;

    if (Object.keys(metadata).length > 0) {
      dataToSave.metadata = metadata;
    }

    let customerId = customer;

    // 1. Si recibimos un customerId, validamos que exista
    if (customerId) {
      try {
        const existingCustomer = await stripe.customers.retrieve(customerId);
        if (shouldUpdate) {
          const updated = await stripe.customers.update(customerId, dataToSave);
          return updated.id;
        }
        return existingCustomer.id;
      } catch (err) {
        if (err.statusCode !== 404) throw err;
        customerId = null;
      }
    }

    // 2. Buscar por email
    const existing = await stripe.customers.list({ email, limit: 1 });
    if (existing.data.length > 0) {
      if (shouldUpdate) {
        const updated = await stripe.customers.update(
          existing.data[0].id,
          dataToSave
        );
        return updated.id;
      }
      return existing.data[0].id;
    }

    // 3. Crear nuevo si no existe
    const created = await stripe.customers.create(dataToSave);
    return created.id;
  } catch (error) {
    logger.error("Error creando o recuperando cliente:", error.message);
    throw error;
  }
};

//CREATE CUSTOMER ID
export const createCustomerId = async (id) => {
  logger.verbose(">>>CREATE CUSTOMER ID STRIPE <<<");
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
export const createPaymentIntent = async (
  data,
  user,
  subservice,
  chargeValidate
) => {
  logger.verbose(">>> CREATE PAYMENT INTENT STRIPE <<<");
  try {
    console.log("data", data);
    if (!envar().STRIPE_SECRET_KEY) {
      throw new Error("MISSING_API_CREDENTIALS");
    }
    //Organiza la data
    const dataToSent = {
      amount: data.amount * 100,
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
      },
    };
    //Se obtiene o crear customer en stripe
    const customerData = {
      email: user?.email || dataToSent.metadata.clientEmail,
      name: user?.name || dataToSent.metadata.clientName,
      phone: dataToSent.metadata.clientPhone,
    };
    if (user && user.paymentData?.stripe?.customer) {
      customerData.customer = user.paymentData.stripeCustomerId;
    }
    const savedCustomerId = await createStripeCustomer(customerData, true);
    console.log("id encontrada", savedCustomerId);
    const customer = savedCustomerId;
    dataToSent.customer = customer;
    dataToSent.metadata.language = data.language || "en";
    //Se analiza si hacer cargo a la tarjeta o solo validar
    let response = null;
    console.log("justo antes");
    if (chargeValidate) {
      console.log("caso 1");
      const setupIntent = await stripe.setupIntents.create({
        customer: customer,
      });
      response = {
        intent: setupIntent,
        customer: customer,
        typeIntent: "setup",
      };
    } else {
      console.log("caso 2");
      console.log("data to Sent", dataToSent);
      const paymentIntent = await stripe.paymentIntents.create(dataToSent);
      response = {
        intent: paymentIntent,
        customer: customer,
        typeIntent: "payment",
      };
    }
    console.log("hizo el payment");
    //Se guarda la info de tarjetas en el usuario
    const methods = await stripe.paymentMethods.list({
      customer: customer,
      type: "card",
    });
    if (methods && methods.data && user) {
      user.paymentData.stripe.methodIdDefault = methods?.data[0]?.id || null;
      user.paymentData.stripe.methods = methods.data;
      user.phone = data?.clientData?.phone;
      user.phoneCode = data?.clientData?.phoneCode;
      user.phoneCountry = data?.clientData?.phoneCountry;
      await user.save();
    }
    //Se manda respuesta
    return response;
  } catch (error) {
    throw error;
  }
};
//Test payment Intent
export const paymentIntentClient = async ({
  customerId,
  savedPaymentMethodId,
  currency,
  amount,
  automatic = false,
  data,
  subservice,
}) => {
  logger.verbose(">>> CREATE PAYMENT INTENT CLIENT STRIPE <<<");
  try {
    let method = savedPaymentMethodId;
    if (!method) {
      const methods = await stripe.paymentMethods.list({
        customer: customerId,
        type: "card",
      });
      method = methods.data[0].id;
    }
    if (!method) throw createError(400, "No se encontró ningún método de pago");

    let toSet = {
      amount: amount * 100,
      currency: currency,
      customer: customerId,
      confirm: true,
      off_session: true,
      payment_method: method,
      capture_method: automatic ? "automatic" : "manual",
      // application_fee_amount: 400,
      // transfer_data: {
      //   destination: connectAccountId,
      // },
    };
    if (data) {
      toSet.metadata = {
        clientName: data?.clientData?.name.trim(),
        clientEmail: data?.clientData?.email.trim(),
        clientPhone:
          data?.clientData?.phoneCode + "-" + data?.clientData?.phone,

        startTime: data?.startTime?.isoTime,
        language: data.language,
      };
      if (subservice) {
        toSet.metadata.subservice = subservice._id.toString();
        toSet.metadata.service = subservice.service._id.toString();
        toSet.description =
          subservice.name.en + " - " + subservice.service.name.en;
      }
    }
    const paymentIntent = await stripe.paymentIntents.create(toSet);
    return { msg: "Pago exitoso", id: paymentIntent.id };
  } catch (error) {
    if (error.code === "authentication_required") {
      throw createError(400, "El banco requiere autenticación");
      // Aquí puedes guardar el paymentIntent.id para intentar re-confirmarlo con el cliente presente más tarde
    } else {
      throw error;
    }
  }
};

export const createCheckoutLinkStripe = async ({
  name,
  description,
  amount,
  defaultQty,
  maxQty,
  minQty,
  email,
  connectAccountId,
}) => {
  logger.verbose(">>> CREATE CHECKOUT LINK STRIPE <<<");

  try {
    const paymentIntentData = {
      description: "LinkPayment - " + name,
    };

    if (connectAccountId) {
      paymentIntentData.application_fee_amount = Math.floor(amount * 0.1);
      paymentIntentData.transfer_data = {
        destination: connectAccountId,
      };
    }

    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: "brl",
            product_data: description ? { name, description } : { name },
            unit_amount: amount,
          },
          quantity: defaultQty || 1,
          ...(minQty &&
            maxQty && {
              adjustable_quantity: {
                enabled: true,
                minimum: minQty,
                maximum: maxQty,
              },
            }),
        },
      ],
      mode: "payment",
      ...(email && { customer_email: email }),
      success_url: process.env.URL_FRONTEND + "?success=success",
      cancel_url: process.env.URL_FRONTEND + "/error",
      payment_intent_data: paymentIntentData, // <-- siempre incluido
    });

    return session;
  } catch (error) {
    logger.error("Stripe error", error);
    throw error;
  }
};
//Buscar metodos de pagos de un cliente
export const MethodsPaymentClient = async (customerId) => {
  try {
    const methods = await stripe.paymentMethods.list({
      customer: customerId,
      type: "card",
    });
    return methods.data;
  } catch (err) {
    throw err;
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
  logger.verbose(">>> ASK CAPTURED PAYMENT INTENT STRIPE <<<");
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

export const transferPaymentsStripe = async (data, user) => {
  logger.verbose("--- CREATE TRANSFERS STRIPE ---");
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
  logger.verbose(">>> ADD METADATA PAYMENT INTENT STRIPE <<<");
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
  logger.verbose(">>> CREATE DIRECT PAYMENT INTENT STRIPE <<<");
  console.log("la data", data);
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

    const toSet = {
      amount: data.price * 100,
      currency: data.currency,
      customer: data.customer,
      payment_method: paymentMethodId,
      off_session: true,
      confirm: true,
    };
    if (data.connectAccountId) {
      toSet.transfer_data = {
        destination: connectAccountId,
      };
      toSet.application_fee_amount = Math.floor(
        (data.price * 100 * data.percentage) / 100
      );
    }
    toSet.transfer_data = {
      destination: "acct_1R15zD09YKLirZNL",
    };
    toSet.application_fee_amount = Math.floor(
      (data.price * 100 * data.percentage) / 100
    );
    console.log("el objeto", toSet);
    // 3. Crear nuevo PaymentIntent con ese método
    const intent = await stripe.paymentIntents.create(toSet);

    return intent;
  } catch (error) {
    logger.error("Fallo en cobro directo:", error.message);
    throw error;
  }
};
