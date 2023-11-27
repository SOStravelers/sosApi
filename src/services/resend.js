import { Resend } from "resend";
const resend = new Resend(process.env.RESEND_API_KEY);
import { templateHtml } from "../utils/externalFiles.js";
import Handlebars from "handlebars";

// // Define los valores para las variables de la plantilla
// const variables = {
//   number1: "3",
//   number2: "4",
//   number3: "3",
//   number4: "6",
// };

export const resendEmail = async (email, numbers) => {
  const htmlString = templateHtml("validationCode");
  const template = Handlebars.compile(htmlString);
  const htmlToSend = template(numbers);
  console.log("resendEmail");
  try {
    console.log("el email", email);
    const data = await resend.emails.send({
      from: "SOS Travelers <info@sostvl.com>",
      to: [email],
      subject: "SOS Travelers - Validate your email address",
      html: htmlToSend,
    });

    console.log(data);
  } catch (error) {
    console.error(error);
  }
};
