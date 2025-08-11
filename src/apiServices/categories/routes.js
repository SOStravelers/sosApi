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
router.get("/all/products/all", ITEM_CONTROLLERS.getAllCategoriesWithProducts);
export default router;
