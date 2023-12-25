import Router from "express";
import {
  create,
  getById,
  getBookings,
  updateOne,
  getDayClientId,
  getMonthClientId,
  getAllClientsId,
  getAllworkers,
  getDayWorkers,
  getTimeBusiness,
  getAllBusiness,
  getYearBusiness,
  getMonthBusiness

} from "../controllers/booking.js";
import validateParams from "../middleware/validate.js";

const router = Router();

router.post(
  "/",
  validateParams(
    [
      // {
      //   param_key: "location",
      //   required: true,
      //   type: "string",
      // },
      // {
      //   param_key: "subservice",
      //   required: true,
      //   type: "string",
      // },
      {
        param_key: "businessUser",
        required: true,
        type: "string",
      },
      {
        param_key: "workerUser",
        required: true,
        type: "string",
      },
      {
        param_key: "clientUser",
        required: true,
        type: "string",
      },
      {
        param_key: "creatorUser",
        required: true,
        type: "string",
      },
      {
        param_key: "startTime",
        required: true,
        type: "object",
      },
      {
        param_key: "endTime",
        required: true,
        type: "object",
      },
      {
        param_key: "date",
        required: true,
        type: "object",
      },
    ],
    "body"
  ),
  create
);

router.get(
  "/allBookings/:body",
  validateParams(
    [
      {
        param_key: "body",
        required: true,
        type: "string",
      },
    ],
    "params"
  ),
  getBookings
);

router.get(
  "/:id",
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
  getById
);

router.put(
  "/:id",
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
  updateOne
);

// get day
router.get("/client/day",
  validateParams(
    [
      {
        param_key: "date",
        required: true,
        type: "string",
      },
      {
        param_key: "page",
        required: false,
        type: "string",
      },
      {
        param_key: "limit",
        required: false,
        type: "string",
      },
    ],
    "query"
  ),
  getDayClientId
)

/* get month */
router.get("/client/month",
validateParams(
  [
    {
      param_key: "date",
      required: true,
      type: "string",
    },
    {
      param_key: "page",
      required: false,
      type: "string",
    },
    {
      param_key: "limit",
      required: false,
      type: "string",
    },
  ],
  "query"
),
  getMonthClientId
)

/* get all clients */
router.get("/clients/allclients",
  validateParams(
    [
      {
        param_key: "page",
        required: false,
        type: "string",
      },
      {
        param_key: "limit",
        required: false,
        type: "string",
      },
    ],
    "params"
  ),
  getAllClientsId
)

/* get workers */
router.get("/worker/day",
  validateParams(
    [
      {
        param_key: "date",
        required: true,
        type: "string",
      },
      {
        param_key: "page",
        required: false,
        type: "string",
      },
      {
        param_key: "limit",
        required: false,
        type: "string",
      },

    ],
    "query"
  ),
  getDayWorkers
)

/* get allworkers  */
router.get("/worker/allworkers",
  validateParams(
    [
      {
        param_key: "page",
        required: false,
        type: "string",
      },
      {
        param_key: "limit",
        required: false,
        type: "string",
      },
    ],
    "params"
  ),
  getAllworkers
)

/* get specific place */
router.get("/business/time",
  validateParams(
    [
      {
        param_key: "date_start",
        required: true,
        type: "string",
      },

      {
        param_key: "date_end",
        required: true,
        type: "string",
      },
      {
        param_key: "page",
        required: false,
        type: "string",
      },
      {
        param_key: "limit",
        required: false,
        type: "string",
      },
    ],
    "query"
  ),
  getTimeBusiness
)

/* get all business */
router.get("/business/allbusiness",
  validateParams(
    [
      {
        param_key: "page",
        required: false,
        type: "string",
      },
      {
        param_key: "limit",
        required: false,
        type: "string",
      },
    ],
    "query"
  ),
  getAllBusiness
)

/* get year business */
router.get("/business/year",
  validateParams(
    [
      {
        param_key: "date",
        required: true,
        type: "string",
      },
      {
        param_key: "page",
        required: false,
        type: "string",
      },
      {
        param_key: "limit",
        required: false,
        type: "string",
      },
    ],
    "query"
  ),
  getYearBusiness
)

/* get month business */
router.get("/business/month",
  validateParams(
    [
      {
        param_key: "date",
        required: true,
        type: "string",
      },
      {
        param_key: "page",
        required: false,
        type: "string",
      },
      {
        param_key: "limit",
        required: false,
        type: "string",
      },
    ],
    "query"
  ),
  getMonthBusiness
)

export default router;