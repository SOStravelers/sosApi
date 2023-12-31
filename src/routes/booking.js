import Router from "express";
import {
  create,
  getById,
  getBookings,
  updateOne,
  getDayClientId,
  getMonthClientId,
  getAllClientsId,
  getLastDayClientId,
  getAllworkers,
  getDayWorkers,
  getMonthWorkers,
  getListDayWorkers,
  getLastWorkers,
  getTimeBusiness,
  getAllBusiness,
  getYearBusiness,
  getMonthBusiness,
  getNextDaysBusiness,
  getNextMonthBusiness,
  getMonthServiceMoney,
  getMonthAvegare,
  getMonthProjection,
  getYearServiceMoney,
  getYearAvegare,
  getYearProjection,
  getAlltimeServiceMoney,
  getAlltimeAverage,
  getAlltimeProjection,
  getSpecificServiceMoney,
  getSpecificProjection,
  getSpecificAverage,
  
  cancelBooking,
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
router.get(
  "/client/day",
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
);

router.get(
  "/client/lastdays",
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
  getLastDayClientId
);

/* get month */
router.get(
  "/client/month",
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
);

/* get all clients */
router.get(
  "/clients/allclients",
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
);

/* get workers */
router.get(
  "/worker/day",
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
);

router.get(
  "/worker/listdays",
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
  getListDayWorkers
);

/* get MonthWorkers */

router.get("/worker/month",
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
getMonthWorkers)

/* get LastWorkers */
router.get("/worker/lastworker",
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
getLastWorkers)

/* get allworkers  */
router.get(
  "/worker/allworkers",
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
);

/* get specific place */
router.get(
  "/business/time",
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
);

/* get all business */
router.get(
  "/business/allbusiness",
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
);

/* get year business */
router.get(
  "/business/year",
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
);

/* get month business */
router.get(
  "/business/month",
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
);

/* get any date business */
router.get(
  "/business/anydate",
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
  getNextDaysBusiness
);

/* get any month business */
router.get(
  "/business/anymonth",
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
  getNextMonthBusiness
);

router.put(
  "/cancel/:bookingId",
  validateParams(
    [
      {
        param_key: "bookingId",
        required: true,
        type: "string",
      },
    ],
    "params"
  ),
  cancelBooking
);

/* get money service */
router.get("/business/getMSM",
validateParams(
  [
    {
      param_key: "date",
      required: true,
      type: "string",
    }
  ],
  "query"),
getMonthServiceMoney);

/* get Month Avegare */
router.get("/business/getMA",
validateParams(
  [
    {
      param_key: "date",
      required: true,
      type: "string",
    }
  ],
  "query"),
getMonthAvegare);

/* get Month Projection */
router.get("/business/getMP",
validateParams(
  [
    {
      param_key: "date",
      required: true,
      type: "string",
    }
  ],
  "query"),
getMonthProjection
);

/* get year service money */
router.get("/business/getYSM",
validateParams(
  [
    {
      param_key: "date",
      required: true,
      type: "string",
    }
  ],
  "query"),
getYearServiceMoney);

/* get Year Avegare */
router.get("/business/getYA",
validateParams(
  [
    {
      param_key: "date",
      required: true,
      type: "string",
    }
  ],
  "query"),
getYearAvegare);

/* get Year Projection */
router.get("/business/getYP",
validateParams(
  [
    {
      param_key: "date",
      required: true,
      type: "string",
    }
  ],
  "query"),
getYearProjection);

/* get All time Service Money */
router.get("/business/getATSM",
getAlltimeServiceMoney);

/* get all time average */
router.get("/business/getATA", 
getAlltimeAverage);

/* get All time Projection */
router.get("/business/getATP", 
getAlltimeProjection);


/* get Specific Service Money */

router.get("/business/getSSM", 
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
    }
  ],
  "query"
),
getSpecificServiceMoney);


/* getSpecificAverage */
router.get("/business/getSA", 
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
    }
  ],
  "query"
),
getSpecificAverage);

/* getSpecificProjection */

router.get("/business/getSP",
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
    }
  ],
  "query"
),
getSpecificProjection)


export default router;
