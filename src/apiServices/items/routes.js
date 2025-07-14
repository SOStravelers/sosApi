import Router from "express";
const router = Router();
import validateParams from "../../middleware/validate.js";
import * as ITEM_CONTROLLERS from "./controllers.js";

//POST ITEMS WITH PRODUCTS IN A SUBSERVICE
router.post(
  "/createItemsAndProducts/:id",
  validateParams(
    [
      {
        param_key: "id",
        required: true,
        type: "string",
      },
    ],
    "params"
  ),
  ITEM_CONTROLLERS.createItemsAndProducts
);
//GET ITEMS WITH PRODUCTS IN A SUBSERVICE
router.get(
  "/get/byService/:id",
  validateParams(
    [
      {
        param_key: "id",
        required: true,
        type: "string",
      },
    ],
    "params"
  ),
  validateParams(
    [
      {
        param_key: "date",
        required: false,
        type: "string",
      },
    ],
    "query"
  ),
  ITEM_CONTROLLERS.getAllItemBySubservice
);
export default router;
