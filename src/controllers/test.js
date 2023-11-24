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
  global.logger.info("--EMAIL CONFIRMATION AWS--");
  try {
    const data = req.body;
    sendEmailPaymentConfirmation(data);
    res.send("email sent");
  } catch (err) {
    next(err);
  }
};

export const sendTestEmail = async (req, res, next) => {
  global.logger.info("--EMAIL TEST AWS--");
  try {
    exampleEmail();
    res.send("email sent");
  } catch (err) {
    next(err);
  }
};

export const createTestTemplate = async (req, res, next) => {
  global.logger.info("--CREATE TEMPLATE AWS--");
  try {
    const params = req.body;
    createTemplate(params);
    res.send("new template created");
  } catch (err) {
    next(err);
  }
};

export const createTestTemplateFile = async (req, res, next) => {
  global.logger.info("--NEW TEMPLATE FILE AWS--");
  try {
    const params = req.body;
    createTemplateFile(params);
    res.send("new template created");
  } catch (err) {
    next(err);
  }
};

export const getTemplateFile = async (req, res, next) => {
  global.logger.info("--GET TEMPLATE FILE AWS--");
  try {
    const name = req.body.name;
    const response = await getTemplate(name);
    res.send(response.Template);
  } catch (err) {
    if (err instanceof Error && err.$metadata) {
      throw createError(err.$metadata.httpStatusCode, err.Error.message);
    } else {
      next(err);
    }
  }
};

export const sendTestTemplate = async (req, res, next) => {
  global.logger.info("--SEND TEMPLATE AWS--");
  try {
    sendTemplateExample();
    res.send("templated sent");
  } catch (err) {
    next(err);
  }
};

export const updateTestTemplate = async (req, res, next) => {
  global.logger.info("--UPDATE TEMPLATE AWS--");
  try {
    const params = req.body;
    updateTemplate(params);
    res.send("template updated");
  } catch (err) {
    next(err);
  }
};

export const deleteTestTemplate = async (req, res, next) => {
  global.logger.info("--DELETE TEMPLATE AWS--");
  try {
    const name = req.body.name;
    const response = await deleteTemplate(name);
    res.send(response);
  } catch (err) {
    if (err instanceof Error && err.$metadata) {
      throw createError(err.$metadata.httpStatusCode, err.Error.message);
    } else {
      next(err);
    }
  }
};
