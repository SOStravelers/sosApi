import Router from "express";
const router = Router();
import validateParams from "../middleware/validate.js";
import { addOrUpdate, getByUser } from "../controllers/holliday.js";

router.post(
  "/add",
  // validateParams(
  //   [
  //     {
  //       param_key: "schedules",
  //       required: true,
  //       type: "array",
  //     },
  //   ],
  //   "body"
  // ),
  addOrUpdate
);
//get By user
router.get("/get", getByUser);

export default router;
