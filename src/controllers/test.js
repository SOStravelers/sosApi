import {
  exampleEmail,
  sendTemplateExample,
  createTemplate,
  deleteTemplate,
  updateTemplate,
  createTemplateFile,
  getTemplate,
  sendEmailPaymentConfirmation,
} from "../services/aws_ses.js";

export const sendEmailConfirmation = async (req, res, next) => {
  const data = req.body;
  sendEmailPaymentConfirmation(data);
  const response = {
    message: "Email confirmation send",
  };
  res.send(response);
};

export const sendTestEmail = async (req, res, next) => {
  console.log("--EMAIL TEST AWS--");
  exampleEmail();
  res.send("email sent");
};

export const createTestTemplate = async (req, res, next) => {
  console.log("--NEW TEMPLATE AWS--");
  createTemplate();
  res.send("new template created");
};

export const createTestTemplateFile = async (req, res, next) => {
  console.log("--NEW TEMPLATE FILE HTML AWS--");
  const params = req.body;
  createTemplateFile(params);
  res.send("new template created");
};

export const getTemplateFile = async (req, res, next) => {
  try {
    console.log("--GET TEMPLATE AWS SES--");
    const name = req.body.name;
    const response = await getTemplate(name);
    res.send(response.Template);
  } catch (err) {
    if (err instanceof Error) {
      res
        .status(err.$metadata.httpStatusCode)
        .json({ error: err.Error.message });
    } else {
      res.status(500).json({ error: "Error interno del servidor" });
    }
  }
};

export const sendTestTemplate = async (req, res, next) => {
  console.log("--SEND TEMPLATE AWS--");
  sendTemplateExample();
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
