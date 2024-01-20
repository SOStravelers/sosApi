import { Resend } from "resend";
const resend = new Resend(process.env.RESEND_API_KEY);
import { templateHtml } from "../utils/externalFiles.js";
import Handlebars from "handlebars";

export const resendEmail = async (email, numbers) => {
  const htmlString = templateHtml("validationCode");
  const template = Handlebars.compile(htmlString);
  const htmlToSend = template(numbers);
  console.log("resendEmail");
  try {
    console.log("el email", email);
    const data = await resend.emails.send({
      from: "SOS Travelers <info@sostvl.com>",
      to: [email], // va dirigido al usuario
      subject: "SOS Travelers - Validate your email address",
      html: htmlToSend,
    });
  } catch (error) {
    console.error(error);
  }
};

export const resendSupport = async (data) => {
  const { subject, message, name, email, user } = data;
  const sName =
    name ?? user.personalData.name.first + " " + user.personalData.name.last;
  const sEmail = email ?? data.user.email;
  const sType = user ? user.type : "not registered";

  // definir templateHtml
  const htmlString = templateHtml("supportEmail");
  const template = Handlebars.compile(htmlString);
  const htmlToSend = template({
    // variables que envio al template del html
    message: message,
    sName: sName,
    userType: sType,
    Email: sEmail,
  });

  try {
    const mailData = await resend.emails.send({
      from: "Support prueba SOS <support@sostvl.com>",
      to: "sostravelbr@gmail.com", // email va dirigido siempre a SOS travelers
      subject: subject,
      html: htmlToSend,
    });

    console.log("resendSupport data: ", mailData);
  } catch (error) {
    console.error(error);
  }
};
