import path from "path";
import {
  SendEmailCommand,
  CreateTemplateCommand,
  SendTemplatedEmailCommand,
  DeleteTemplateCommand,
  UpdateTemplateCommand,
} from "@aws-sdk/client-ses";
import { SES } from "./awsClient.js";
import envar from "../config/envar.js";
import fs from "fs";
import staticDir from "../config/staticPath.js";

const filePath = path.join(staticDir, "emailPrueba.html");
const templateHtml = fs.readFileSync(filePath, "utf8");

// Definir los parámetros del correo electrónico
const params = {
  Source: envar().SES_EMAIL_AUTH, // Dirección de correo verificada con AWS
  Destination: {
    ToAddresses: ["jschacosta@gmail.com"], // Lista de destinatarios
    CcAddresses: [envar().SES_EMAIL_AUTH], // Lista de copias
    //BccAddresses: ["copiaoculta@example.com"], // Lista de copias ocultas
  },
  Message: {
    Subject: {
      Data: "Asunto del correo", // Asunto del correo
    },
    Body: {
      Text: {
        Data: "Hola, este es un correo  de prueba enviado desde Node.js usando AWS SES v3", // Cuerpo del correo en texto plano
      },
    },
  },
};
export const testEmailAWS = async (file) => {
  console.log("entrando1");
  // Create an object and upload it to the Amazon S3 bucket.
  try {
    // Crear el comando para enviar el correo electrónico
    const command = new SendEmailCommand(params);
    // Ejecutar el comando usando el cliente de SES
    SES.send(command, (err, data) => {
      if (err) {
        console.error(err); // Mostrar el error si ocurre
      } else {
        console.log(data); // Mostrar la respuesta de AWS si tiene éxito
      }
    });
  } catch (err) {
    console.log("Error", err);
  }
};

//NO UTILIZAR

// Definir los parámetros del template prueba
const templateParams = {
  Template: {
    TemplateName: "MiTemplate", // Nombre del template
    SubjectPart: "Hola {{name}}", // Asunto del correo con una variable {{name}}
    TextPart:
      "Este es un correo de prueba actuzalizado usando un template de AWS SES. Tu edad es {{age}}.", // Cuerpo del correo en texto plano con una variable {{age}}
  },
};
export const testEmailAWS = async (file) => {
  console.log("entrando1");
  // Create an object and upload it to the Amazon S3 bucket.
  try {
    // Crear el comando para enviar el correo electrónico
    const command = new SendEmailCommand(params);
    // Ejecutar el comando usando el cliente de SES
    SES.send(command, (err, data) => {
      if (err) {
        console.error(err); // Mostrar el error si ocurre
      } else {
        console.log(data); // Mostrar la respuesta de AWS si tiene éxito
      }
    });
  } catch (err) {
    console.log("Error", err);
  }
};
// Crear el comando para crear el template
export const createTemplate = async (file) => {
  console.log("entrando2", templateParams);
  // Create an object and upload it to the Amazon S3 bucket.
  try {
    // Crear el comando para crear el template
    const command = new CreateTemplateCommand(templateParams);
    // Ejecutar el comando usando el cliente de SES
    SES.send(command, (err, data) => {
      if (err) {
        console.error(err); // Mostrar el error si ocurre
      } else {
        console.log(data); // Mostrar la respuesta de AWS si tiene éxito
      }
    });
  } catch (err) {
    console.log("Error", err);
  }
};
// Crear el comando para crear el template desde un archivo html desde otra carpeta
export const createTemplateFile = async (file) => {
  console.log("entrando3", templateParams);
  // Definir los parámetros para crear el template
  const createParams = {
    Template: {
      TemplateName: "MiTemplateHTML", // Nombre del template a crear
      SubjectPart: "Template SOS prueba", // Asunto del correo con una variable {{name}}
      HtmlPart: templateHtml, // Cuerpo del correo en HTML con CSS
    },
  };
  try {
    // Crear el comando para crear el template
    const command = new CreateTemplateCommand(createParams);
    // Ejecutar el comando usando el cliente de SES
    SES.send(command, (err, data) => {
      if (err) {
        console.error(err); // Mostrar el error si ocurre
      } else {
        console.log(data); // Mostrar la respuesta de AWS si tiene éxito
      }
    });
  } catch (err) {
    console.log("Error", err);
  }
};
// Crear el comando para enviar el template
export const sendTemplate = async (file) => {
  console.log("entrando4");
  // Create an object and upload it to the Amazon S3 bucket.
  try {
    // Definir los parámetros del correo electrónico usando el template
    const emailParams = {
      Source: envar().SES_EMAIL_AUTH, // Dirección de correo verificada con AWS
      Destination: {
        ToAddresses: ["jschacosta@gmail.com", "methalcon@gmail.com"], // Lista de destinatarios
        CcAddresses: [envar().SES_EMAIL_AUTH], // Lista de copias
      },
      Template: "MiTemplateHTML", // Nombre del template a usar
      TemplateData: JSON.stringify({
        name: "Juan", // Valor de la variable {{name}}
        age: 25, // Valor de la variable {{age}}
      }),
    };
    // Crear el comando para enviar el correo electrónico usando el template
    const command = new SendTemplatedEmailCommand(emailParams);
    // Ejecutar el comando usando el cliente de SES
    SES.send(command, (err, data) => {
      if (err) {
        console.error(err); // Mostrar el error si ocurre
      } else {
        console.log(data); // Mostrar la respuesta de AWS si tiene éxito
      }
    });
  } catch (err) {
    console.log("Error", err);
  }
};
// Crear el comando para actualizar el template
export const updateTemplate = async (file) => {
  console.log("entrando5");
  try {
    // Crear el comando para borrar el template
    const updateCommand = new UpdateTemplateCommand(templateParams);

    // Ejecutar el comando usando el cliente de SES
    SES.send(updateCommand, (err, data) => {
      if (err) {
        console.error(err); // Mostrar el error si ocurre
      } else {
        console.log(data); // Mostrar la respuesta de AWS si tiene éxito
      }
    });
  } catch (err) {
    console.log("Error", err);
  }
};
// Crear el comando para borrar el template
export const deleteTemplate = async (file) => {
  console.log("entrando6");
  try {
    // Definir los parámetros para borrar el template
    const deleteParams = {
      TemplateName: "MiTemplateHTML", // Nombre del template a borrar
    };

    // Crear el comando para borrar el template
    const deleteCommand = new DeleteTemplateCommand(deleteParams);

    // Ejecutar el comando usando el cliente de SES
    SES.send(deleteCommand, (err, data) => {
      if (err) {
        console.error(err); // Mostrar el error si ocurre
      } else {
        console.log(data); // Mostrar la respuesta de AWS si tiene éxito
      }
    });
  } catch (err) {
    console.log("Error", err);
  }
};

export const sendEmailPaymentConfirmation = async (data) => {
  const params = {
    Source: envar().SES_EMAIL_AUTH, // Dirección de correo verificada con AWS
    Destination: {
      ToAddresses: [data.email], // Lista de destinatarios
      // CcAddresses: [envar().SES_EMAIL_AUTH], // Lista de copias
      //BccAddresses: ["copiaoculta@example.com"], // Lista de copias ocultas
    },
    Message: {
      Subject: {
        Data: "¡Gracias por tu compra!",
      },
      Body: {
        Text: {
          Data: `Usuario: ${data.name}\nServicie: ${data.service}\nSubservice: ${data.subService}\nWorker: ${data.worker}\nDate: ${data.date}\nHour: ${data.hour}\n`,
        },
      },
    },
  };

  try {
    const command = new SendEmailCommand(params);
    SES.send(command, (err, data) => {
      if (err) {
        console.error(err); // Mostrar el error si ocurre
      } else {
        console.log(data); // Mostrar la respuesta de AWS si tiene éxito
      }
    });
  } catch (err) {
    console.log("Error", err);
  }
};
