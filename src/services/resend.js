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
      to: [email],
      subject: "SOS Travelers - Validate your email address",
      html: htmlToSend,
    });

    console.log(data);
  } catch (error) {
    console.error(error);
  }
};

export const resendSupport = async (message, subject, email, name, user) => {
  const sName = name ? name : user.personalData.name.first;
  const sEmail = email ? email : user.email;
  const htmlString = templateHtml("supportEmail");
  const template = Handlebars.compile(htmlString);
  const htmlToSend = template({
    message: message,
    sName: sName,
    userType: user.type,
  });

  console.log("resendSupport");
  try {
    const mailData = await resend.emails.send({
      from: "Support prueba SOS <support.prueba@sostvl.com>",
      to: "sostravelbr@gmail.com",
      subject: subject + sEmail,
      html: htmlToSend,
    });

    console.log(mailData);
  } catch (error) {
    console.error(error);
  }
};
