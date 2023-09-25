import envar from "../config/envar.js";
import axios from "axios";
import { sendEmailPaymentConfirmation } from "./aws_ses_test.js";

export const generateAccessToken = async () => {
  console.log("generate token paypal");
  try {
    if (!envar().PAYPAL_CLIENT_ID || !envar().PAYPAL_CLIENT_SECRET) {
      throw new Error("MISSING_API_CREDENTIALS");
    }

    const auth = Buffer.from(
      envar().PAYPAL_CLIENT_ID + ":" + envar().PAYPAL_CLIENT_SECRET
    ).toString("base64");

    const response = await axios.post(
      `${envar().PAYPAL_BASE_URL}/v1/oauth2/token`,
      "grant_type=client_credentials",
      {
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const data = response.data;
    return data.access_token;
  } catch (error) {
    console.error("Failed to generate Access Token:", error);
  }
};

export const createOrderPaypal = async (data) => {
  console.log("--create order paypal--", data);
  // use the cart information passed from the front-end to calculate the purchase unit details
  // console.log(
  //     "shopping cart information passed from the frontend createOrder() callback:",
  //     cart,
  // );
  const accessToken = await generateAccessToken();
  console.log(accessToken);
  const url = `${envar().PAYPAL_BASE_URL}/v2/checkout/orders`;
  const payload = {
    intent: "CAPTURE",
    purchase_units: [
      {
        amount: {
          currency_code: "USD",
          value: data.product.cost,
          description: data.product.description,
        },
      },
    ],
  };

  try {
    const response = await axios.post(url, payload, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        // Uncomment one of these to force an error for negative testing (in sandbox mode only). Documentation:
        // https://developer.paypal.com/tools/sandbox/negative-testing/request-headers/
        // "PayPal-Mock-Response": '{"mock_application_codes": "MISSING_REQUIRED_PARAMETER"}'
        // "PayPal-Mock-Response": '{"mock_application_codes": "PERMISSION_DENIED"}'
        // "PayPal-Mock-Response": '{"mock_application_codes": "INTERNAL_SERVER_ERROR"}'
      },
    });

    return response;
  } catch (error) {
    console.error(error);
    // Handle the error as needed
    // You can use "res.status()" and "res.send()" to send an appropriate response to the client
  }
};

export const captureOrder = async (data) => {
  console.log("-capture order paypal--", data);
  const accessToken = await generateAccessToken();
  console.log("access token", accessToken);
  console.log("id", data.orderID);
  const url = `${envar().PAYPAL_BASE_URL}/v2/checkout/orders/${
    data.orderID
  }/capture`;
  console.log(url);
  try {
    const response = await axios.post(url, null, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        // Uncomment one of these to force an error for negative testing (in sandbox mode only). Documentation:
        // https://developer.paypal.com/tools/sandbox/negative-testing/request-headers/
        // "PayPal-Mock-Response": '{"mock_application_codes": "MISSING_REQUIRED_PARAMETER"}'
        // "PayPal-Mock-Response": '{"mock_application_codes": "PERMISSION_DENIED"}'
        // "PayPal-Mock-Response": '{"mock_application_codes": "INTERNAL_SERVER_ERROR"}'
      },
    });
    sendEmailPaymentConfirmation({
      name: "Alberto Sanchez Martinez",
      email: "albersanmar4@gmail.com",
      service: "Haircut",
      subService: "Mal Beard Cut",
      hostel: "El Misti Hostel",
      worker: "Nicle Rodriguez",
      date: "2023-09-25",
      hour: "16:00",
    });
    return response; // Si esperas recibir datos JSON como respuesta
  } catch (error) {
    // Manejar errores aquí
    //console.error('Error al capturar la orden:', error);
    throw error;
  }
};
