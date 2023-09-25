import {
  testEmailAWS,
  sendTemplate,
  createTemplate,
  deleteTemplate,
  updateTemplate,
  createTemplateFile,
  sendEmailPaymentConfirmation,
} from "../services/aws_ses_test.js";

export const sendEmailConfirmation = async (req, res, _) => {
  const data = req.body;
  sendEmailPaymentConfirmation(data);
  const response = {
    message: "Email confirmation send",
  };
  res.send(response);
};

export const sendTestEmail = async (req, res, next) => {
  console.log("--EMAIL TEST AWS--");
  testEmailAWS();
  res.send("email sent");
};

export const createTestTemplate = async (req, res, next) => {
  console.log("--NEW TEMPLATE AWS--");
  createTemplate();
  res.send("new template created");
};

export const createTestTemplateFile = async (req, res, next) => {
  console.log("--NEW TEMPLATE FILE HTML AWS--");
  createTemplateFile();
  res.send("new template created");
};

export const sendTestTemplate = async (req, res, next) => {
  console.log("--SEND TEMPLATE AWS--");
  sendTemplate();
  res.send("templated sent");
};

export const updateTestTemplate = async (req, res, next) => {
  console.log("--UPDATE TEMPLATE AWS--");
  updateTemplate();
  res.send("template updated");
};

export const deleteTestTemplate = async (req, res, next) => {
  console.log("--DELETE TEMPLATE AWS--");
  deleteTemplate();
  res.send("template deleted");
};
