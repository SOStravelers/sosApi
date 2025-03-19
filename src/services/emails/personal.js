import { Resend } from "resend";
const resend = new Resend(process.env.RESEND_API_KEY);
import Handlebars from "handlebars";
import { templateHtml } from "../../utils/externalFiles.js";

export const resendConfirmPersonal = async (info) => {
  try {
    const {
      email,
      emailWorker,
      name,
      subservice,
      service,
      language,
      workerPhone,
      clientPhone,
      workerName,
      clientName,
      date,
      startTime,
      priceUnitService,
      clientsNumber,
      price,
      priceBRL,
      finalPrice,
      isWorker,
    } = info;
    console.log("*** resend confirmed ***", isWorker ? emailWorker : email);
    console.log("subservice", subservice);
    const htmlString = isWorker
      ? templateHtml("confirmBookingWorkerMultiple")
      : templateHtml("confirmBooking");
    const template = Handlebars.compile(htmlString);
    const htmlToSend = template({
      name: name,
      service: service,
      workerPhone: workerPhone,
      clientPhone: clientPhone,
      workerName: workerName,
      subservice: subservice,
      language: language,
      clientName: clientName,
      date: date,
      startTime: startTime,
      priceUnitService: priceUnitService,
      clientsNumber: clientsNumber,
      price: price,
      priceBRL: priceBRL,
      finalPrice: finalPrice,
    });
    const toSend = isWorker ? emailWorker : email;
    const data = await resend.emails.send({
      from: "SOS Travelers <booking@sostvl.com>",
      to: [toSend], // va dirigido al usuario
      subject: "SOS Travelers - Confirm booking",
      html: htmlToSend,
    });
  } catch (error) {
    console.error(error);
  }
};

export const resendCancelPersonal = async (info) => {
  try {
    const { email, name, subservice, service } = info;
    console.log("***resend cancel ***");
    const htmlString = templateHtml("cancelBooking");
    const template = Handlebars.compile(htmlString);
    const htmlToSend = template({
      name: name,
      service: service,
      subservice: subservice,
    });
    const data = await resend.emails.send({
      from: "SOS Travelers <booking@sostvl.com>",
      to: [email], // va dirigido al usuario
      subject: "SOS Travelers - Your booking was canceled",
      html: htmlToSend,
    });
  } catch (error) {
    console.log(error);
  }
};

export const resendCompletedPersonal = async (info) => {
  try {
    const { email, name, subservice, service } = info;
    console.log("***resend  ***", info);
    const htmlString = templateHtml("completedBooking");
    const template = Handlebars.compile(htmlString);
    const htmlToSend = template({
      name: name,
      service: service,
      subservice: subservice,
    });
    const data = await resend.emails.send({
      from: "SOS Travelers <booking@sostvl.com>",
      to: [email], // va dirigido al usuario
      subject: "SOS Travelers - A booking has been generated SOS",
      html: htmlToSend,
    });
  } catch (error) {
    console.log(error);
  }
};

export const resendExternalPersonal = async (info) => {
  try {
    const { email, name, subservice, service } = info;
    console.log("*** Resend completed ***");
    const htmlString = templateHtml("availabilityBooking");
    const template = Handlebars.compile(htmlString);
    const htmlToSend = template({
      name: name,
      service: service,
      subservice: subservice,
    });
    const data = await resend.emails.send({
      from: "SOS Travelers <booking@sostvl.com>",
      to: [email], // va dirigido al usuario
      subject:
        "SOS Travelers - Reservations have been changed due to availability",
      html: htmlToSend,
    });
  } catch (error) {
    console.log(error);
  }
};
