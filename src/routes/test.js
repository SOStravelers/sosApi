import Router from "express";
const router = Router();
import validateParams from "../middleware/validate.js";

import {
  createTestTemplate,
  createTestTemplateFile,
  deleteTestTemplate,
  sendEmailConfirmation,
  sendTestEmail,
  sendTestTemplate,
  updateTestTemplate,
  getTemplateFile,
} from "../controllers/test.js";

router.get("/emailTest", sendTestEmail);
router.get("/createTestTemplate", createTestTemplate);
router.get("/sendTestTemplate", sendTestTemplate);
router.get("/deleteTestTemplate", deleteTestTemplate);
router.get("/updateTestTemplate", updateTestTemplate);
router.post(
  "/createTestTemplateFile",
  validateParams(
    [
      {
        param_key: "TemplateName",
        required: true,
        type: "string",
      },
      {
        param_key: "SubjectPart",
        required: true,
        type: "string",
      },
    ],
    "body"
  ),
  createTestTemplateFile
);
//para obtener HTML de template guardado en
router.post(
  "/templatefile",
  validateParams(
    [
      {
        param_key: "name",
        required: true,
        type: "string",
      },
    ],
    "body"
  ),
  getTemplateFile
);
router.post("/sendEmailPaymentConfirmation", sendEmailConfirmation);

export default router;
