import Router from "express";
import {
  create,
  getById,
  getBookings,
  updateOne,
  /* getDayClientId, */
 /*  getMonthClientId, */
 /*  getAllClientsId, */
 /*  getLastDayClientId, */
 /*  getAllworkers, */
 /*  getDayWorkers, */
 /*  getMonthWorkers, */
 /*  getListDayWorkers, */
 /*  getLastWorkers, */
 /*  getTimeBusiness, */
 /*  getAllBusiness, */
 /*  getYearBusiness, */
  /* getMonthBusiness, */
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

import {
  getLastDaysClientId, 
  getDayClientId, 
  getNextDaysClientId,
  getWeekClientId,
  getMonthClientId, 
  getAllClientsId
} from "../controllers/bookings/personal.js"

import {
  getAllworkers,
  getNextWorkers,
  getMonthWorkers,
  getWeekWorkers,
  getListDayWorkers,
  getDayWorkers,
  getLastWorkers,
}from "../controllers/bookings/worker.js"

import {
  getAllBusiness,
  getTimeBusiness,
  getYearBusiness,
  getMonthBusiness,
  getWeekBusiness,
  getDayBusiness,
  getNextBusiness,
  getLastBusiness

} from "../controllers/bookings/business.js"

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

// personal last days
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
  getLastDaysClientId
);

// personal day 
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

// personal next days
router.get(
  "/client/nextdays",
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
  getNextDaysClientId
);

// personal week
router.get(
  "/client/week",
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
  getWeekClientId
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
  "/clients/allbookings",
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

/* get day workers */
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

/* get next workers */
router.get("/worker/nextdays",
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
getNextWorkers
);

/* get  three days next of the date worker*/
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

/* get week workers */
router.get(
  "/worker/week",
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
  getWeekWorkers
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
getMonthWorkers);

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
getLastWorkers);

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

/* get week business */
router.get(
  "/business/week",
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
  getWeekBusiness
);

/* get day business */
router.get(
  "/business/day",
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
  getDayBusiness
);

/* get next business */
router.get("/business/nextdays",
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
getNextBusiness
);

/* get last business */
router.get("/business/lastbusiness",
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
getLastBusiness);

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
