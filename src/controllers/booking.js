import { createError } from "../config/error.js";
import Booking from "../models/booking.js";
import { sendEmailPaymentConfirmation } from "../services/aws_ses.js";

function optionsBooking(page, limit) {
  const populate = [
    {
      path: "businessUser",
      select: "businessData personalData",
    },
    {
      path: "workerUser",
      select: "workerData personalData",
    },
    {
      path: "service",
      select: "name isActive coverImg",
    },
    {
      path: "subservice",
      select: "name isActive coverImg duration",
    },
    {
      path: "clientUser",
      select: "personalData",
    },
  ];
  return {
    populate: populate,
    select: "startTime endTime date duration",
    page: page || 1,
    limit: limit || 5,
    sort: { updatedAt: -1 },
  };
}

const validateFormatDate = (dateString, dateEndString) => {
  const formatDateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (dateEndString) {
    if (!formatDateRegex.test(dateString) || !formatDateRegex.test(dateEndString)) throw createError(400, "invalid date format");
  }
  else if (!formatDateRegex.test(dateString)) throw createError(404, "invalid date format");
};

//Crear booking
export const create = async (req, res, next) => {
  global.logger.info("---CREATE NEW BOOKING---");
  try {
    const emailData = req.body.emailData;
    const bookingData = req.body;
    bookingData.emailData = null;
    let booking = new Booking(bookingData);
    let query = {
      $and: [
        {
          location: booking.location,
        },
        {
          subService: booking.subService,
        },
        {
          date: booking.date,
        },
        {
          startTime: booking.startTime,
        },
      ],
    };
    let exists = await Booking.findOne(query, {}).exec();
    if (exists) {
      throw createError(409, "document already exists");
    } else {
      const newBooking = await booking.save();
      if (emailData) sendEmailPaymentConfirmation(emailData);
      res.status(201).json({ booking: newBooking, msg: "new Document" });
    }
  } catch (err) {
    next(err);
  }
};
//Obtener reserva por ID
export const getById = async (req, res, next) => {
  global.logger.info("---GET BOOKING BY ID---");
  try {
    const booking = await Booking.findOne({ _id: req.params.id }).exec();
    if (!booking) throw createError(404, "Booking not found");
    res.send(booking);
  } catch (err) {
    next(err);
  }
};
//Obtener bookings con paginate por cliente, hotel, Worker,
export const getBookings = async (req, res, next) => {
  global.logger.info("---GET BOOKINGS---");
  try {
    let body = {};
    Object.assign(body, req.query);
    const populate = [
      {
        path: "businessUser",
        //   select: "isActive name  email phone creator user imgUrl emails type",
      },
      {
        path: "workerUser",
      },
      {
        path: "clientUser",
      },
      {
        path: "creatorUser",
      },
    ];
    let options = {
      populate,
      // select,
      page: body.page || 1,
      limit: body.limit || 50,
      sort: { updatedAt: -1 },
    };
    let query = {};
    body.isActive ? (query.isActive = body.isActive) : "";
    body.client ? (query.client = body.client) : "";
    body.hotel ? (query.hotel = body.hotel) : "";
    body.worker ? (query.worker = body.worker) : "";
    body.creator ? (query.creator = body.creator) : "";
    const bookings = await Booking.paginate(query, options);
    res.status(200).json(bookings);
  } catch (err) {
    next(err);
  }
};
//Actualizar data de un booking
export const updateOne = async (req, res, next) => {

  global.logger.info("---UPDATE BOOKING---");

  try {

    let data = req.body;

    const booking = await Booking.findOneAndUpdate(
      {
        _id: req.params.id,
      },
      data,
      {
        new: true,
      }
    ).exec();
    if (!booking) throw createError(404, "Booking not found");
    res.status(200).json(booking);

  } catch (err) {

    next(err);
  }
};

/*  get day by client  */
export const getDayClientId = async (req, res, next) => {
  global.logger.info("---GET CLIENT BOOKING---");
  try {
    const user = req.user;
    /*   if (user.type != "personal") throw createError(401, "Unauthorized"); */
    const { date, page, limit } = req.query;
    validateFormatDate(date);
    let options = optionsBooking(page, limit)
    let query = {
      "clientUser": user._id.toString(),
      "date.stringData": date,
    };
    const booking = await Booking.paginate(query, options);
    if (!booking) throw createError(404, "Client booking not found ");
    res.status(200).json(booking);
  } catch (err) {
    next(err);
  }
}

/* get last days client */
export const getLastDayClientId = async (req, res, next) => {
  global.logger.info("---GET LAST DAY CLIENT---")
  try {
    const user = req.user;
    /*   if (user.type != "personal") throw createError(401, "Unauthorized"); */
    const { date, page, limit } = req.query;
    validateFormatDate(date);
    let options = optionsBooking(page, limit)
    let query = {
      "clientUser": user._id.toString(),
      "date.stringData": { $lt: date },
    };
    const booking = await Booking.paginate(query, options);
    if (!booking) throw createError(404, "Client booking not found ");
    res.status(200).json(booking);
  } catch (err) {
    next(err)
  }
}

/* get month by client  */
export const getMonthClientId = async (req, res, next) => {
  global.logger.info("---GET CLIENT MONTH BOOKING---");
  try {
    const user = req.user;
    /*  if (user.type != "personal") throw createError(401, "Unauthorized"); */
    const { date, page, limit } = req.query;
    validateFormatDate(date);
    let options = optionsBooking(page, limit);
    const [year, month, day] = date.split("-");
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 0));
    const query = {
      "clientUser": user._id.toString(),
      "date.isoDate": {
        $gte: startDate,
        $lte: endDate
      }
    };
    const booking = await Booking.paginate(query, options);
    if (!booking) throw createError(404, "Client booking not found");
    res.status(200).json(booking);
  } catch (err) {
    next(err);
  }
}

/*  get all bookings for client  */
export const getAllClientsId = async (req, res, next) => {
  global.logger.info("---GET TO CLIENT ALL BOOKING---");
  try {
    const user = req.user;
    /* if (user.type != "personal") throw createError(401, "Unauthorized"); */
    const { page, limit } = req.query;
    let options = optionsBooking(page, limit);
    let query = {
      "clientUser": user._id.toString()
    }
    const booking = await Booking.paginate(query, options);
    if (!booking) throw createError(404, "Client booking not found");
    res.status(200).json(booking);
  } catch (err) {
    next(err);
  }
}

/* get all workers */
export const getAllworkers = async (req, res, next) => {
  global.logger.info("---GET TO WORKER ALL BOOKING---");
  try {
    const user = req.user;
    /* if (user.type != "worker") throw createError(401, "Unauthorized"); */
    const { page, limit } = req.query;
    let options = optionsBooking(page, limit);
    let query = {
      "workerUser": user._id.toString(),
    };
    const booking = await Booking.paginate(query, options);
    if (!booking) throw createError(404, "Worker booking not found");
    res.status(200).json(booking);
  } catch (err) {
    next(err);
  }
}

/* get day by worker  */
export const getDayWorkers = async (req, res, next) => {
  global.logger.info("---GET DAY TO WORKER BOOKING---")
  try {
    const user = req.user;
    /*   if (user.type != "personal") throw createError(401, "Unauthorized"); */
    const { date, page, limit } = req.query;
    validateFormatDate(date);
    let options = optionsBooking(page, limit)
    let query = {
      "workerUser": user._id.toString(),
      "date.stringData": date,
    };
    const booking = await Booking.paginate(query, options);
    if (!booking) throw createError(404, "Client booking not found ");
    res.status(200).json(booking);
  } catch (err) {
    next(err);
  }
}

/* get list day by worker */
export const getListDayWorkers = async (req, res, next) => {
  global.logger.info("---GET LIST DAYS TO WORKER BOOKING---")
  try {
    const user = req.user;
    /* if (user.type != "worker") throw createError(401, "Unauthorized"); */
    const { date, page, limit } = req.query;
    validateFormatDate(date);
    const [year, month, day] = date.split("-");
    const startDate = new Date(Date.UTC(year, month - 1, parseInt(day)));
    let endDate = new Date(Date.UTC(year, month - 1, parseInt(day) + 3));
    if (endDate.getMonth() !== (month - 1)) endDate = new Date(Date.UTC(year, month, 3));
    let options = optionsBooking(page, limit);
    let query = {
      "workerUser": user._id.toString(),
      "date.isoDate": {
        $gte: startDate,
        $lte: endDate
      }
    };
    const booking = await Booking.paginate(query, options);
    if (!booking) throw createError(404, "Worker booking not found");
    res.status(200).json(booking);
  } catch (err) {
    next(err);
  }
}

/* get the business day for a specific place. */
export const getTimeBusiness = async (req, res, next) => {
  global.logger.info("---GET SPECIFIC DATE TO BUSINESS BOOKING---");
  try {
    const user = req.user;
    /* if (user.type !== "business") throw createError(401, "Unauthorized"); */
    const { date_start, date_end, page, limit } = req.query;
    validateFormatDate(date_start, date_end);
    const [year_start, month_start, day_start] = date_start.split("-");
    const [year_end, month_end, day_end] = date_end.split("-");
    const startDate = new Date(Date.UTC(year_start, month_start - 1, parseInt(day_start)));
    const endDate = new Date(Date.UTC(year_end, month_end - 1, parseInt(day_end)));
    let options = optionsBooking(page, limit);
    let query = {
      "businessUser": user._id.toString(),
      "date.isoDate": {
        $gte: startDate,
        $lte: endDate
      },
      /* "status": { $in: ['canceled', 'completed', 'failed'] }  */
    };
    const booking = await Booking.paginate(query, options);
    if (!booking) throw createError(404, "Booking specific date to business not found");
    res.status(200).json(booking);
  } catch (err) {
    next(err);
  }
}

/* get all business */
export const getAllBusiness = async (req, res, next) => {
  global.logger.info("---GET ALL BUSINESS BOOKING---");
  try {
    const user = req.user;
    /* if (user.type != "business") throw createError(401, "Unauthorized"); */
    const { page, limit } = req.query;
    let options = optionsBooking(page, limit);
    let query = {
      "businessUser": user._id.toString(),
      /*   "status": { $in: ['canceled', 'completed', 'failed'] } */
    };
    const booking = await Booking.paginate(query, options);
    if (!booking) throw createError(404, "Booking business not found");
    res.status(200).json(booking);
  } catch (err) {
    next(err);
  }
}

/* get year business */
export const getYearBusiness = async (req, res, next) => {
  global.logger.info("---GET YEAR TO BUSINESS BOOKING---");
  try {
    const user = req.user;
    /* if (user.type != "business") throw createError(401, "Unauthorized"); */
    const { date, page, limit } = req.query;
    validateFormatDate(date);
    const [year, month, day] = date.split("-");
    const startDate = new Date(Date.UTC(year, 0, 1));
    const endDate = new Date(Date.UTC(year, 11, 31));
    let options = optionsBooking(page, limit);
    let query = {
      "businessUser": user._id.toString(),
      "date.isoDate": {
        $gte: startDate,
        $lte: endDate
      },
      /*   "status": { $in: ['canceled', 'completed', 'failed'] } */
    }
    const booking = await Booking.paginate(query, options);
    if (!booking) throw createError(404, "Booking business not found");
    res.status(200).json(booking);
  } catch (err) {
    next(err);
  }
}

/* get month business */
export const getMonthBusiness = async (req, res, next) => {
  global.logger.info("---GET MONTH BUSINESS BOOKING---");
  try {
    const user = req.user;
    /*   if (user.type != "business") throw createError(401, "Unauthorized"); */
    const { date, page, limit } = req.query;
    validateFormatDate(date);
    const [year, month, day] = date.split("-");
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 0));
    let options = optionsBooking(page, limit);
    const query = {
      "businessUser": user._id.toString(),
      "date.isoDate": {
        $gte: startDate,
        $lte: endDate
      },
      /*   "status": { $in: ['canceled', 'completed', 'failed'] } */

    };
    const booking = await Booking.paginate(query, options);
    if (!booking) throw createError(404, "Month business booking not found");
    res.status(200).json(booking);
  } catch (err) {
    next(err);
  }
}

/* get next date booking business*/
export const getNextDaysBusiness = async (req, res, next) => {
  global.logger.info("---GET DAY BUSINESS BOOKING---")
  try {
    const user = req.user;
    /*   if (user.type != "personal") throw createError(401, "Unauthorized"); */
    const { date, page, limit } = req.query;
    validateFormatDate(date);
    let options = optionsBooking(page, limit)
    let query = {
      "businessUser": user._id.toString(),
      "date.stringData": date,
    };
    const booking = await Booking.paginate(query, options);
    if (!booking) throw createError(404, "Client booking not found ");
    res.status(200).json(booking);
  } catch (err) {
    next(err);
  }
}

/* get next date month booking business */
export const getNextMonthBusiness = async (req, res, next) => {
  global.logger.info("---GET NEXT MONTH BUSINESS BOOKING---");
  try {
    const user = req.user;
    /*   if (user.type != "business") throw createError(401, "Unauthorized"); */
    const { date, page, limit } = req.query;
    validateFormatDate(date);
    const [year, month, day] = date.split("-");
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 0));
    let options = optionsBooking(page, limit);
    const query = {
      "businessUser": user._id.toString(),
      "date.isoDate": {
        $gte: startDate,
        $lte: endDate
      },
    };
    const booking = await Booking.paginate(query, options);
    if (!booking) throw createError(404, "Month business booking not found");
    res.status(200).json(booking);
  } catch (err) {
    next(err);
  }
}