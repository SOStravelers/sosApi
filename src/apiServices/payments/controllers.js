import * as PAYMENT_DAO from "./dao.js";
//------STRIPE------
//Crear payment Intent tradicional
export const paymentIntentStripe = async (req, res, next) => {
  try {
    const user = req.user;
    const data = req.body;
    const response = await PAYMENT_DAO.paymentIntentStripe(data, user);
    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
};
// Obtener metodos de pago de un customer Id de stripe
export const listMethodsPaymentClient = async (req, res, next) => {
  try {
    const customerId = req.params.customerId;
    const response = await PAYMENT_DAO.listMethodsPaymentClient(customerId);
    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
};
//Crear Payment Intent con el uso de un customer Id de stripe
export const paymentIntentClient = async (req, res, next) => {
  try {
    const data = req.body;
    const response = await PAYMENT_DAO.paymentIntentClient(data);
    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
};
//Crear link de pago custom
export const createCheckoutLink = async (req, res, next) => {
  try {
    const data = req.body;
    const response = await PAYMENT_DAO.createCheckoutLink(data);
    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
};

//Crear payment Intent booking
export const capturePaymentBooking = async (req, res, next) => {
  try {
    const id = req.params.id;
    const response = await PAYMENT_DAO.capturePaymentBooking(id);
    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
};

export const transferPayments = async (req, res, next) => {
  try {
    const user = req.user;
    const data = req.body;
    const response = await PAYMENT_DAO.transferPayments(data, user);
    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
};

export const capturePaymentStripe = async (req, res, next) => {
  try {
    const idBooking = req.params.id;
    const response = await PAYMENT_DAO.capturePaymentStripe(idBooking);
    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
};

export const updatedPaymentIntentStripe = async (req, res, next) => {
  try {
    const data = req.body;
    const response = await PAYMENT_DAO.updatedPaymentIntentStripe(data);
    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
};

export const cancelPaymentIntentStripe = async (req, res, next) => {
  try {
    const id = req.params.id;
    const response = await PAYMENT_DAO.cancelPaymentIntentStripe(id);
    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
};

export const refundStripe = async (req, res, next) => {
  try {
    const data = req.body;
    const response = await PAYMENT_DAO.refundStripe(data);
    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
};

export const getStripeLink = async (req, res, next) => {
  try {
    const id = req.params.id;
    const response = await PAYMENT_DAO.getStripeLink(id);
    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
};

export const getPaymentIntentById = async (req, res, next) => {
  try {
    const id = req.params.id;
    const response = await PAYMENT_DAO.getPaymentIntentById(id);
    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
};

export const creteDirectPaymentStripe = async (req, res, next) => {
  try {
    const data = req.body;
    const response = await PAYMENT_DAO.creteDirectPaymentStripe(data);
    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
};
//-----------------
//------PAYPAL-----
//-----------------
export const createOrderPaypal = async (req, res, next) => {
  try {
    const data = req.body;
    const response = await PAYMENT_DAO.createOrderPaypal(data);
    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
};

export const aproveOrderPaypal = async (req, res, next) => {
  try {
    const data = req.body;
    const response = await PAYMENT_DAO.aproveOrderPaypal(data);
    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
};
