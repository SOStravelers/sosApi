import { createTemplateFile, getTemplate, sendEmailTemplate } from "../aws_ses.js";
import envar from "../../config/envar.js";


export const resendConfirmWorker = async (email, info) => {
  try {

  } catch (error) {

  }

};

export const resendCancelWorker = async (email, info) => {
  try {

  } catch (error) {

  };

}

export const completedWorker = async (info) => {
  try {
    //verificar si existe el template 
    console.log('###### completedWorker verificate template ######');
    const { email, name, service } = info;
    const response = await getTemplate('completedBookingWorker')
    console.log(response, 'from my controller')
    if (response === null) {
      // crear el templete
      createTemplateFile({
        TemplateName: 'completedBookingWorker',
        SubjectPart: 'SOS Travelers - confirmação do seu serviço'
      });
    }
    console.log("*** send email ***");
    const emailParams = {
      Source: envar().SES_EMAIL_AUTH, // Dirección de correo verificada con AWS
      Destination: {
        ToAddresses: [email], // Lista de destinatarios
        CcAddresses: [envar().SES_EMAIL_AUTH], // Lista de copias
      },
      Template: "completedBookingWorker", // Nombre del template a usar
      TemplateData: JSON.stringify({
        name: name, // Valor de la variable {{name}}
        service: service, // Valor de la variable {{service}}
      }),
    };
    sendEmailTemplate(emailParams)
    console.log('*** send email ***');
    console.log('###### completedWorker verificate template ######');
  } catch (error) {
    console.log(error);
  }
}


