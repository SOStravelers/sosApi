import {
  createTemplateFile,
  getTemplate,
  sendEmailTemplate,
  updateTemplate,
} from "../aws_ses.js";
import envar from "../../config/envar.js";

export const awsConfirmWorker = async (info) => {
  try {
    // verificar si existe el template
    console.log("*** confirmedBookingWorker verificate template ***");
    const { email, name, service, subservice } = info;
    const response = await getTemplate("completedBookingWorker");
    if (response === null) {
      // crear el templete
      createTemplateFile({
        TemplateName: "confirmeddBookingWorker",
        SubjectPart: "SOS Travelers - confirmação de sua reserva",
      });
    }
    /* params del email */
    const emailParams = {
      Source: "booking@sostvl.com",
      Destination: {
        ToAddresses: [email],
        CcAddresses: "booking@sostvl.com",
      },
      Template: "completedBookingWorker",
      TemplateData: JSON.stringify({
        name: name,
        service: service,
        subservice: subservice,
      }),
    };
    /* Enviar el email */
    sendEmailTemplate(emailParams);
  } catch (error) {
    console.log(error);
  }
};

export const awsCancelWorker = async (info) => {
  try {
    // verificar si existe el template
    console.log("*** cancelBookingWorker verificate template ***");
    const { email, name, service, subservice } = info;
    const response = await getTemplate("completedBookingWorker");
    if (response === null) {
      // crear el templete
      createTemplateFile({
        TemplateName: "confirmeddBookingWorker",
        SubjectPart: "SOS Travelers - sua reserva foi cancelada",
      });
    }
    /* Generar los params */
    const emailParams = {
      Source: envar().SES_EMAIL_AUTH,
      Destination: {
        ToAddresses: [email],
        CcAddresses: ["booking@sostvl.com"],
      },
      Template: "completedBookingWorker",
      TemplateData: JSON.stringify({
        name: name,
        service: service,
        subservice: subservice,
      }),
    };

    sendEmailTemplate(emailParams);
  } catch (error) {
    console.log(error);
  }
};

export const awsCompletedWorker = async (info) => {
  try {
    //verificar si existe el template
    console.log("*** CompletedWorker verificate template ***");
    const { email, name, service, subservice } = info;
    const response = await getTemplate("completedBookingWorker");
    if (response === null) {
      // crear el templete
      createTemplateFile({
        TemplateName: "completedBookingWorker",
        SubjectPart: "SOS Travelers - Você tem uma nova reserva!",
      });
    }
    console.log("*** send email ***");
    const emailParams = {
      Source: envar().SES_EMAIL_AUTH, // Dirección de correo verificada con AWS
      Destination: {
        ToAddresses: [email],
        CcAddresses: ["booking@sostvl.com"],
      },
      Template: "completedBookingWorker",
      TemplateData: JSON.stringify({
        name: name,
        service: service,
        subservice: subservice,
      }),
    };
    /* Enviar el email */
    sendEmailTemplate(emailParams);
  } catch (error) {
    console.log(error);
  }
};

export const awsXternarWorker = async () => {
  try {
    //verificar si existe el template
    console.log("*** CompletedWorker verificate template ***");
    const { email, name, service, subservice } = info;
    const response = await getTemplate("availabilityBookingWorker");
    if (response === null) {
      // crear el templete
      createTemplateFile({
        TemplateName: "availabilityBookingWorker",
        SubjectPart:
          "SOS Travelers - Reserva foram alteradas devido à disponibilidade",
      });
    }
    console.log("*** send email ***");
    const emailParams = {
      Source: envar().SES_EMAIL_AUTH, // Dirección de correo verificada con AWS
      Destination: {
        ToAddresses: [email],
        CcAddresses: ["booking@sostvl.com"],
      },
      Template: "availabilityBookingWorker",
      TemplateData: JSON.stringify({
        name: name,
        service: service,
        subservice: subservice,
      }),
    };
    /* Enviar el email */
    sendEmailTemplate(emailParams);
  } catch (error) {
    console.log(error);
  }
};
/*  Para actualizar los templates de los emails de aws  */
export const awsUpdateTemplate = async (info) => {
  try {
    console.log("*** updateddWorker verificate template ***");
    const { template, subject } = info;
    console.log("*** ", template, " ***");
    // Tener en cuenta que la informacion viene del controlador
    const response = await getTemplate(template);
    if (response != null) {
      // actualizar el templete
      await updateTemplate({
        templateName: template,
        subject: subject,
      });
      return;
    }
  } catch (error) {
    console.log(error);
  }
};
