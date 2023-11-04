import envar from "../config/envar.js";

export const template_CodeEmail = {
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
