import { createError } from "../config/error.js";
import Booking from "../models/booking.js";
import User from "../models/user.js";
import Subservice from "../models/subservice.js";
import { sendEmailPaymentConfirmation } from "../services/aws_ses.js";
import moment from "moment-timezone";
import { refund } from "../services/stripe.js";

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
    select: "payment idKey startTime currency status endTime date duration",
    page: page || 1,
    limit: limit || 5,
    sort: { updatedAt: -1 },
  };
}

const validateFormatDate = (dateString, dateEndString) => {
  const formatDateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (dateEndString) {
    if (
      !formatDateRegex.test(dateString) ||
      !formatDateRegex.test(dateEndString)
    )
      throw createError(400, "invalid date format");
  } else if (!formatDateRegex.test(dateString))
    throw createError(404, "invalid date format");
};

function buildBookingStatisticsQuery(startDate, endDate, userId) {
  if (startDate != null && endDate != null) {
    return [
      {
        $match: {
          'date.isoDate': {
            $gte: startDate,
            $lte: endDate,
          },
          'businessUser': userId,
          "status": { $in: ['canceled', 'completed', 'failed', "confirmed"] },
          'payment.status': { $in: ['paid'] }
        }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$payment.priceBRL' },
          totalBookings: { $sum: 1 }
        }
      }
    ];
  }

  return [
    {
      $match: {
        'businessUser': userId,
        "status": { $in: ['canceled', 'completed', 'failed', "confirmed"] },
        'payment.status': { $in: ['paid'] }
      }
    },
    {
      $sort: {
        'date.isoDate': -1  // Ordenar en orden descendente por la fecha
      }
    },
    {
      $group: {
        _id: null,
        date: { $first: '$date.isoDate' },
        totalAmount: { $sum: '$payment.priceBRL' },
        totalBookings: { $sum: 1 }
      }
    }
  ];
}

function getFirstDayOfMonth(dateString) {
  const date = new Date(dateString + "T00:00:00Z");
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const firstDayOfMonth = new Date(Date.UTC(year, month, 1));
  return firstDayOfMonth.toISOString().split("T")[0];
}

function calculateDaysRemainingInMonth(dateString) {
  const currentDate = new Date(dateString + "T00:00:00Z");
  const year = currentDate.getUTCFullYear();
  const month = currentDate.getUTCMonth();
  const lastDayOfMonth = new Date(Date.UTC(year, month + 1, 0));
  const daysPassed = Math.floor((currentDate - new Date(Date.UTC(year, month, 1))) / (24 * 60 * 60 * 1000));
  const daysRemaining = Math.floor((lastDayOfMonth - currentDate) / (24 * 60 * 60 * 1000));

  return {
    daysPassed,
    daysRemaining,
  };
}


function calculateMonthsPassedRemainingInYear(dateString) {
  const currentDate = new Date(dateString + "T00:00:00Z");
  const year = currentDate.getUTCFullYear();
  const monthsPassed = currentDate.getUTCMonth();
  const monthsRemaining = 11 - monthsPassed; // Indices de meses van de 0 a 11
  return {
    monthsPassed,
    monthsRemaining,
  };
}

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
      // Buscar el último booking ordenado por idKey en orden descendente
      let lastBooking = await Booking.findOne().sort({ idKey: -1 });

      let newIdKey;
      if (!lastBooking || !lastBooking.idKey) {
        // Si no hay bookings, o si el último booking no tiene un idKey, usar "B-1000" como el primer idKey
        newIdKey = "B-1000";
      } else {
        // Si hay bookings, incrementar el número en el último idKey en 1
        let lastIdNumber = Number(lastBooking.idKey.split("-")[1]);
        newIdKey = "B-" + (lastIdNumber + 1);
      }

      // Asignar el nuevo idKey al booking
      booking.idKey = newIdKey;
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
    let options = optionsBooking(page, limit);
    let query = {
      clientUser: user._id.toString(),
      "date.stringData": date,
    };
    const booking = await Booking.paginate(query, options);
    if (!booking) throw createError(404, "Client booking not found ");
    res.status(200).json(booking);
  } catch (err) {
    next(err);
  }
};

/* get last days client */
export const getLastDayClientId = async (req, res, next) => {
  global.logger.info("---GET LAST DAY CLIENT---");
  try {
    const user = req.user;
    /*   if (user.type != "personal") throw createError(401, "Unauthorized"); */
    const { date, page, limit } = req.query;
    validateFormatDate(date);
    let options = optionsBooking(page, limit);
    let query = {
      clientUser: user._id.toString(),
      "date.stringData": { $lt: date },
    };
    const booking = await Booking.paginate(query, options);
    if (!booking) throw createError(404, "Client booking not found ");
    res.status(200).json(booking);
  } catch (err) {
    next(err);
  }
};

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
      clientUser: user._id.toString(),
      "date.isoDate": {
        $gte: startDate,
        $lte: endDate,
      },
    };
    const booking = await Booking.paginate(query, options);
    if (!booking) throw createError(404, "Client booking not found");
    res.status(200).json(booking);
  } catch (err) {
    next(err);
  }
};

/*  get all bookings for client  */
export const getAllClientsId = async (req, res, next) => {
  global.logger.info("---GET TO CLIENT ALL BOOKING---");
  try {
    const user = req.user;
    console.log(user)
    /* if (user.type != "personal") throw createError(401, "Unauthorized"); */
    const { page, limit } = req.query;
    let options = optionsBooking(page, limit);
    let query = {
      clientUser: user._id.toString(),
    };
    const booking = await Booking.paginate(query, options);
    if (!booking) throw createError(404, "Client booking not found");
    res.status(200).json(booking);
  } catch (err) {
    next(err);
  }
};

/* get all workers */
export const getAllworkers = async (req, res, next) => {
  global.logger.info("---GET TO WORKER ALL BOOKING---");
  try {
    const user = req.user;
    /* if (user.type != "worker") throw createError(401, "Unauthorized"); */
    const { page, limit } = req.query;
    let options = optionsBooking(page, limit);
    let query = {
      workerUser: user._id.toString(),
    };
    const booking = await Booking.paginate(query, options);
    if (!booking) throw createError(404, "Worker booking not found");
    res.status(200).json(booking);
  } catch (err) {
    next(err);
  }
};

/* get day by worker  */
export const getDayWorkers = async (req, res, next) => {
  global.logger.info("---GET DAY TO WORKER BOOKING---");
  try {
    const user = req.user;
    /*   if (user.type != "personal") throw createError(401, "Unauthorized"); */
    const { date, page, limit } = req.query;
    validateFormatDate(date);
    let options = optionsBooking(page, limit);
    let query = {
      workerUser: user._id.toString(),
      "date.stringData": date,
    };
    const booking = await Booking.paginate(query, options);
    if (!booking) throw createError(404, "Client booking not found ");
    res.status(200).json(booking);
  } catch (err) {
    next(err);
  }
};

/* get list day by worker */
export const getListDayWorkers = async (req, res, next) => {
  global.logger.info("---GET LIST DAYS TO WORKER BOOKING---");
  try {
    const user = req.user;
    /* if (user.type != "worker") throw createError(401, "Unauthorized"); */
    const { date, page, limit } = req.query;
    validateFormatDate(date);
    const [year, month, day] = date.split("-");
    const startDate = new Date(Date.UTC(year, month - 1, parseInt(day)));
    let endDate = new Date(Date.UTC(year, month - 1, parseInt(day) + 3));
    if (endDate.getMonth() !== month - 1)
      endDate = new Date(Date.UTC(year, month, 3));
    let options = optionsBooking(page, limit);
    let query = {
      workerUser: user._id.toString(),
      "date.isoDate": {
        $gte: startDate,
        $lte: endDate,
      },
    };
    const booking = await Booking.paginate(query, options);
    if (!booking) throw createError(404, "Worker booking not found");
    res.status(200).json(booking);
  } catch (err) {
    next(err);
  }
};

/* get month by worker ###########*/
export const getMonthWorkers = async (req, res, next) => {
  global.logger.info("---GET WORKER MONTH BOOKING---");
  try {
    const user = req.user;
    /*  if (user.type != "worker") throw createError(401, "Unauthorized"); */
    const { date, page, limit } = req.query;
    validateFormatDate(date);
    let options = optionsBooking(page, limit);
    const [year, month, day] = date.split("-");
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 0));
    const query = {
      workerUser: user._id.toString(),
      "date.isoDate": {
        $gte: startDate,
        $lte: endDate,
      },
    };
    const booking = await Booking.paginate(query, options);
    if (!booking) throw createError(404, "Worker booking not found");
    res.status(200).json(booking);
  } catch (err) {
    next(err)
  }
}

/* get last worker ############*/
export const getLastWorkers = async (req, res, next) => {

  try {
    const user = req.user;
    /*   if (user.type != "worker") throw createError(401, "Unauthorized"); */
    const { date, page, limit } = req.query;
    validateFormatDate(date);
    let options = optionsBooking(page, limit);
    let query = {
      workerUser: user._id.toString(),
      "date.stringData": { $lt: date },
    };
    const booking = await Booking.paginate(query, options);
    if (!booking) throw createError(404, "Worker booking not found ");
    res.status(200).json(booking);
  } catch (err) {
    next(err)
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
    const startDate = new Date(
      Date.UTC(year_start, month_start - 1, parseInt(day_start))
    );
    const endDate = new Date(
      Date.UTC(year_end, month_end - 1, parseInt(day_end))
    );
    let options = optionsBooking(page, limit);
    let query = {
      businessUser: user._id.toString(),
      "date.isoDate": {
        $gte: startDate,
        $lte: endDate,
      },
      /*  "status": { $in: ['canceled', 'completed', 'failed', "confirmed"] }, */
    };
    const booking = await Booking.paginate(query, options);
    if (!booking)
      throw createError(404, "Booking specific date to business not found");
    res.status(200).json(booking);
  } catch (err) {
    next(err);
  }
};

/* get last all business */
export const getAllBusiness = async (req, res, next) => {
  global.logger.info("---GET ALL BUSINESS BOOKING---");
  try {
    const user = req.user;
    /* if (user.type != "business") throw createError(401, "Unauthorized"); */
    const { page, limit, date } = req.query;
    const [year, month, day] = date.split("-");
    const endDate = new Date(Date.UTC(year, month - 1, day));
    console.log(endDate)
    let options = optionsBooking(page, limit);

    let query = {
      businessUser: user._id.toString(),
      "status": { $in: ['canceled', 'completed', 'failed', "confirmed"] },
      "date.stringData": { $lt: date },
    };
    const booking = await Booking.paginate(query, options);
    if (!booking) throw createError(404, "Booking business not found");
    res.status(200).json(booking);
  } catch (err) {
    next(err);
  }
};

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
      businessUser: user._id.toString(),
      "date.isoDate": {
        $gte: startDate,
        $lte: endDate,
      },
      /*   "status": { $in: ['canceled', 'completed', 'failed'] } */
    };
    const booking = await Booking.paginate(query, options);
    if (!booking) throw createError(404, "Booking business not found");
    res.status(200).json(booking);
  } catch (err) {
    next(err);
  }
};

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
      businessUser: user._id.toString(),
      "date.isoDate": {
        $gte: startDate,
        $lte: endDate,
      },
      /*   "status": { $in: ['canceled', 'completed', 'failed'] } */
    };
    const booking = await Booking.paginate(query, options);
    if (!booking) throw createError(404, "Month business booking not found");
    res.status(200).json(booking);
  } catch (err) {
    next(err);
  }
};

/* get next date booking business*/
export const getNextDaysBusiness = async (req, res, next) => {
  global.logger.info("---GET DAY BUSINESS BOOKING---");
  try {
    const user = req.user;
    /*   if (user.type != "personal") throw createError(401, "Unauthorized"); */
    const { date, page, limit } = req.query;
    validateFormatDate(date);
    let options = optionsBooking(page, limit);
    let query = {
      businessUser: user._id.toString(),
      "date.stringData": date,
    };
    const booking = await Booking.paginate(query, options);
    if (!booking) throw createError(404, "Client booking not found ");
    res.status(200).json(booking);
  } catch (err) {
    next(err);
  }
};

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
      businessUser: user._id.toString(),
      "date.isoDate": {
        $gte: startDate,
        $lte: endDate,
      },
    };
    const booking = await Booking.paginate(query, options);
    if (!booking) throw createError(404, "Month business booking not found");
    res.status(200).json(booking);
  } catch (err) {
    next(err);
  }
};

export const cancelBooking = async (req, res, next) => {
  global.logger.info("---CANCEL BOOKING---");
  try {
    const id = req.user._id;

    const user = await User.findOne({ _id: id }).exec();
    if (user.type == "business") throw createError(401, "Unauthorized");
    const bookingId = req.params.bookingId;
    const booking = await Booking.findOne({ _id: bookingId }).exec();
    if (!booking) throw createError(404, "Booking not found");
    if (booking.status === "canceled")
      throw createError(400, "Booking already canceled");
    if (booking.status === "completed")
      throw createError(400, "Booking already completed");
    if (booking.status === "failed")
      throw createError(400, "Booking already failed");

    var brazilTime = moment().tz("America/Sao_Paulo");
    console.log("hora actual", brazilTime);
    console.log("hora booking", booking.startTime.isoTime);
    if (user.type == "worker") {
      console.log("worker");
      var bookingStartTime = moment(booking.startTime.isoTime).subtract(
        4,
        "hours"
      );
      if (brazilTime.isSameOrAfter(bookingStartTime))
        throw createError(400, "You can't cancel this booking");
    }
    if (user.type == "personal") {
      console.log("personal");
      var bookingStartTime = moment(booking.startTime.isoTime).subtract(
        12,
        "hours"
      );
      if (brazilTime.isSameOrAfter(bookingStartTime))
        throw createError(400, "You can't cancel this booking");
    }

    // const subservice= await Subservice.findOne({_id:booking.subservice}).exec()
    // let originalPrice = subservice.price

    // let amount = booking.currency != "BRL" ? o * 100 : 0;

    booking.status = "canceled";
    const data = {
      id: booking.payment.paymentId,
      amount: booking.payment.price * 100 * 0.93,
    };
    const refundData = await refund(data);
    console.log("el refund", refundData);
    await booking.save();
    res.status(200).json(booking);
  } catch (err) {
    next(err);
  }
};


/* monthly number of services and money incoming business */
export const getMonthServiceMoney = async (req, res, next) => {
  global.logger.info("---GET MONTHLY BUSINESS SERVICE AND INCOMING BOOKING---");
  try {
    const user = req.user;
    if (user.type != "business") throw createError(401, "Unauthorized");
    const { date } = req.query;
    validateFormatDate(date);
    const [year, month, day] = date.split("-");
    const startDate = new Date(Date.UTC(year, month, 1));
    const endDate = new Date(Date.UTC(year, month, 0));
    console.log(startDate, endDate);
    let query = buildBookingStatisticsQuery(startDate, endDate, user._id.toString());
    const result = await Booking.aggregate(query);
    console.log(result, result.length);
    if (!result) throw createError(404, "Monthly business service and incoming booking not found");
    if (result.length === 0) res.status(200).json({ totalAmount: 0, totalBookings: 0 });
    else res.status(200).json({ totalAmount: result[0].totalAmount, totalBookings: result[0].totalBookings });
  } catch (err) {
    next(err)
  }
}

/* monthly avegare business*/
export const getMonthAvegare = async (req, res, next) => {
  global.logger.info("---GET MONTHLY BUSINESS AVERAGE BOOKING ---");
  try {
    const user = req.user;
    if (user.type != "business") throw createError(401, "Unauthorized");
    const { date } = req.query;
    validateFormatDate(date);
    const find = user._id.toString();
    const userDoc = await User.findById(find)
      .select('createdAt')
      .exec();
    if (!userDoc) throw createError(404, "Monthly business average booking not found");
    const date_start = new Date(userDoc.createdAt);
    const [year_start, month_start, day_start] = date_start.toISOString().split("T")[0].split("-");
    const [year_end, month_end, day_end] = date.split("-");
    const monthsDifference = (year_end - year_start) * 12 + (month_end - month_start);
    console.log("Number of months:", monthsDifference);
    let query = [];
    if (monthsDifference === 0) {
      const endDate = new Date(Date.UTC(year_end, month_end, day_end));
      const startDate = new Date(Date.UTC(year_start, month_start, day_start));
      query = buildBookingStatisticsQuery(startDate, endDate, user._id.toString());
      monthsDifference = 1;
    } else if (monthsDifference > 11) {
      let newStartDate = new Date(Date.UTC(year_end, month_end - 1, day_end));
      newStartDate.setMonth(newStartDate.getMonth() - 11);
      const endDate = new Date(Date.UTC(year_end, month_end - 1, 0));
      query = buildBookingStatisticsQuery(newStartDate, endDate, user._id.toString());
    } else {
      const endDate = new Date(Date.UTC(year_end, month_end, 0));
      const startDate = new Date(Date.UTC(year_start, month_start - 1, day_start));
      console.log(endDate, startDate);
      query = buildBookingStatisticsQuery(startDate, endDate, user._id.toString());
    }
    const result = await Booking.aggregate(query);
    if (!result) throw createError(404, "Monthly business average booking not found");
    let average = 0;
    const resultOp = { average: average }
    console.log(result, result.length)
    if (result.length != 0) average = result[0].totalAmount / monthsDifference;
    /* console.log(result[0].totalAmount, result); */
    resultOp.average = average;
    res.status(200).json(resultOp);
  } catch (err) {
    next(err);
  }
}

/* monthly projection business*/
export const getMonthProjection = async (req, res, next) => {
  global.logger.info("---GET MONTHLY BUSINESS PROJECTION BOOKING---");
  try {
    const user = req.user;
    if (user.type != "business") throw createError(401, "Unauthorized");
    const { date } = req.query;
    validateFormatDate(date);
    let firstDay = getFirstDayOfMonth(date);
    const [year_start, month_start, day_start] = firstDay.split("T")[0].split("-");
    const [year_end, month_end, day_end] = date.split("-");
    const startDate = new Date(Date.UTC(year_start, month_start - 1, parseInt(day_start)));
    const endDate = new Date(Date.UTC(year_end, month_end - 1, parseInt(day_end)));
    let query = buildBookingStatisticsQuery(startDate, endDate, user._id.toString());
    const result = await Booking.aggregate(query);
    if (!result) throw createError(404, "Monthly business projection booking not found");
    const { daysPassed, daysRemaining } = calculateDaysRemainingInMonth(date);
    console.log(result);
    console.log(daysPassed);
    console.log(daysRemaining);
    console.log(result[0].totalAmount);
    let projection = 0;
    const resultOp = { projection: projection }
    if (result.length != 0) projection = (result[0].totalAmount / daysPassed) * (daysPassed + daysRemaining + 1);
    resultOp.projection = projection;
    res.status(200).json(resultOp);
  } catch (err) {
    next(err)
  }
}

/* year number of services and money incoming business */
export const getYearServiceMoney = async (req, res, next) => {
  global.logger.info("---GET YEAR BUSINESS NUMBER SERVICE AND INCOMING BOOKING BOOKING---");
  try {
    const user = req.user;
    if (user.type != "business") throw createError(401, "Unauthorized");
    const { date } = req.query;
    validateFormatDate(date);
    const [year, month, day] = date.split("-");
    const startDate = new Date(Date.UTC(year, 0, 1));
    const endDate = new Date(Date.UTC(year, 11, 31));
    let query = buildBookingStatisticsQuery(startDate, endDate, user._id.toString());
    const result = await Booking.aggregate(query)
    if (!result) throw createError(404, "Year business service and incoming booking not found");
    console.log(result, result.length);
    if (result.length === 0) res.status(200).json({ totalAmount: 0, totalBookings: 0 });
    else res.status(200).json({ totalAmount: result[0].totalAmount, totalBookings: result[0].totalBookings });
  } catch (err) {
    next(err)
  }
}

/* year avegare business */
export const getYearAvegare = async (req, res, next) => {
  global.logger.info("---GET YEAR BUSINESS AVERAGE BOOKING---");
  try {
    const user = req.user;
    if (user.type != "business") throw createError(401, "Unauthorized");
    const { date } = req.query;
    validateFormatDate(date);
    const find = user._id.toString();
    const userDoc = await User.findById(find)
      .select('createdAt')
      .exec();
    if (!userDoc) throw createError(404, "Year business average booking not found");
    const date_start = new Date(userDoc.createdAt);
    const [year_start, month_start, day_start] = date_start.toISOString().split("T")[0].split("-");
    const [year_end, month_end, day_end] = date.split("-");
    const monthsDifference = (year_end - year_start) * 12 + (month_end - month_start);
    console.log("Number of months:", monthsDifference);
    let query = [];
    if (monthsDifference === 0) {
      const endDate = new Date(Date.UTC(year_end, month_end, day_end));
      const startDate = new Date(Date.UTC(year_start, month_start, day_start));
      query = buildBookingStatisticsQuery(startDate, endDate, user._id.toString());
      console.log(startDate, endDate)
    } else if (monthsDifference < 13) {
      const endDate = new Date(Date.UTC(year_end, month_end - 2, day_end));
      const startDate = new Date(Date.UTC(year_start, month_start - 1, day_start));
      console.log("Years Average < 12", startDate, endDate);
      query = buildBookingStatisticsQuery(startDate, endDate, user._id.toString());
    } else {
      let newStartDate = new Date(Date.UTC(year_end, month_end - 1, day_end));
      newStartDate.setMonth(newStartDate.getMonth() - 12);
      const endDate = new Date(Date.UTC(year_end, month_end - 1, 0));
      console.log("Years Average > 12", newStartDate, endDate);
      query = buildBookingStatisticsQuery(newStartDate, endDate, user._id.toString());
    }
    const result = await Booking.aggregate(query);
    if (!result) throw createError(404, "Monthly Year average booking not found");
    let average = 0;
    const resultOp = { average: average }
    console.log(result, result.length)
    if (result.length != 0) average = result[0].totalAmount / monthsDifference;
    resultOp.average = average;
    res.status(200).json(resultOp);
  } catch (err) {
    next(err)
  }
}

/* year projection business */
export const getYearProjection = async (req, res, next) => {
  global.logger.info("---GET YEAR BUSINESS PROJECTION BOOKING---");
  try {
    const user = req.user;
    if (user.type != "business") throw createError(401, "Unauthorized");
    const { date } = req.query;
    validateFormatDate(date);
    const find = user._id.toString();
    const userDoc = await User.findById(find)
      .select('createdAt')
      .exec();
    if (!userDoc) throw createError(404, "Year business projection booking not found");
    const date_start = new Date(userDoc.createdAt);
    const [year_start, month_start, day_start] = date_start.toISOString().split("T")[0].split("-");
    const [year_end, month_end, day_end] = date.split("-");
    const monthsDifference = (year_end - year_start) * 12 + (month_end - month_start);
    console.log("Number of months:", monthsDifference);
    let query = [];
    if (monthsDifference === 0) {
      const endDate = new Date(Date.UTC(year_end, month_end, day_end));
      const startDate = new Date(Date.UTC(year_start, month_start, day_start));
      query = buildBookingStatisticsQuery(startDate, endDate, user._id.toString());
      console.log(startDate, endDate)
    } else if (monthsDifference < 13) {
      const endDate = new Date(Date.UTC(year_end, month_end - 2, day_end));
      const startDate = new Date(Date.UTC(year_start, month_start - 1, day_start));
      console.log("Years Average < 12", startDate, endDate);
      query = buildBookingStatisticsQuery(startDate, endDate, user._id.toString());
    } else {
      let newStartDate = new Date(Date.UTC(year_end, month_end - 1, day_end));
      newStartDate.setMonth(newStartDate.getMonth() - 12);
      const endDate = new Date(Date.UTC(year_end, month_end - 1, 0));
      console.log("Years Average > 12", newStartDate, endDate);
      query = buildBookingStatisticsQuery(newStartDate, endDate, user._id.toString());
    }
    const result = await Booking.aggregate(query);
    if (!result) throw createError(404, "Year business projection booking not found");
    const { monthsPassed, monthsRemaining } = calculateMonthsPassedRemainingInYear(date);
    console.log(result, monthsPassed, monthsRemaining);
    let projection = 0;
    const resultOp = { projection: projection }
    if (result.length != 0) projection = (result[0].totalAmount / monthsPassed) * (monthsPassed + monthsRemaining + 1);
    resultOp.projection = projection;
    res.status(200).json(resultOp);
  } catch (err) {
    next(err)
  }
}

/* all time number of services and money incoming business */
export const getAlltimeServiceMoney = async (req, res, next) => {
  global.logger.info("---GET ALL TIME BUSINESS SERVICE MONEY BOOKING---");
  try {
    const user = req.user;
    if (user.type != "business") throw createError(401, "Unauthorized");
    let query = buildBookingStatisticsQuery(null, null, user._id.toString());
    const result = await Booking.aggregate(query)
    console.log(result, result.length);
    if (!result) throw createError(404, "All time business service and incoming booking not found");
    if (result.length === 0) res.status(200).json({ totalAmount: 0, totalBookings: 0 });
    else res.status(200).json({ totalAmount: result[0].totalAmount, totalBookings: result[0].totalBookings });
  } catch (err) {
    next(err)
  }
}

/* all time avegare business */
export const getAlltimeAverage = async (req, res, next) => {
  global.logger.info("---GET ALL TIME BUSINESS AVERAGE BOOKING---");
  try {
    const user = req.user;
    if (user.type !== "business") throw createError(401, "Unauthorized");
    const find = user._id.toString();
    const userDoc = await User.findById(find).select('createdAt').exec();
    if (!userDoc) throw createError(404, "All time avegare booking not found");
    const date_start = new Date(userDoc.createdAt);
    const [year_start, month_start, day_start] = date_start.toISOString().split("T")[0].split("-");
    const query = buildBookingStatisticsQuery(null, null, user._id.toString());
    const result = await Booking.aggregate(query);
    if (!result || result.length === 0) throw createError(404, "All time avegare booking not found");
    let average = 0;
    const resultOp = { average };
    const date_end = new Date(result[0].date);
    const [year_end, month_end, day_end] = date_end.toISOString().split("T")[0].split("-");
    const monthsDifference = (year_end - year_start) * 12 + (month_end - month_start);
    console.log("Number of months:", monthsDifference, date_start, date_end);
    average = result[0].totalAmount / monthsDifference;
    resultOp.average = average;
    res.status(200).json(resultOp);
  } catch (err) {
    next(err)
  }
}

/* all time projection business */
export const getAlltimeProjection = async (req, res, next) => {
  global.logger.info("---GET ALL TIME BUSINESS PROJECTION BOOKING---");
  try {
    const user = req.user;
    if (user.type != "business") throw createError(401, "Unauthorized");
    const find = user._id.toString();
    const userDoc = await User.findById(find)
      .select('createdAt')
      .exec();
    if (!userDoc) throw createError(404, "All time business projection booking not found");
    const date_start = new Date(userDoc.createdAt);
    const [year_start, month_start, day_start] = date_start.toISOString().split("T")[0].split("-");
    const query = buildBookingStatisticsQuery(null, null, user._id.toString());
    const result = await Booking.aggregate(query);
    if (!result) throw createError(404, "All time business projection booking not found");
    const date_end = new Date(result[0].date);
    const [year_end, month_end, day_end] = date_end.toISOString().split("T")[0].split("-");
    const monthsDifference = (year_end - year_start) * 12 + (month_end - month_start);
    console.log("Number of months:", monthsDifference, date_start, date_end);
    console.log(result);
    let projection = 0;
    const resultOp = { projection: projection }
    if (result.length != 0) projection = (result[0].totalAmount / monthsDifference) * (monthsDifference);
    resultOp.projection = projection;
    res.status(200).json(resultOp);
  } catch (err) {
    next(err)
  }

}

/* specific time number of services and money incoming business */
export const getSpecificServiceMoney = async (req, res, next) => {
  global.logger.info("---GET SPECIFIC BUSINESS SERVICE AND INCOMING BOOKING---");
  try {
    const user = req.user;
    if (user.type != "business") throw createError(401, "Unauthorized");
    const { date_start, date_end } = req.query;
    validateFormatDate(date_start, date_end);
    const [year_start, month_start, day_start] = date_start.split("-");
    const [year_end, month_end, day_end] = date_end.split("-");
    const monthsDifference = (year_end - year_start) * 12 + (month_end - month_start);
    console.log("Number of months:", monthsDifference);
    const startDate = new Date(
      Date.UTC(year_start, month_start - 1, parseInt(day_start))
    );
    const endDate = new Date(
      Date.UTC(year_end, month_end - 1, parseInt(day_end))
    );
    let query = buildBookingStatisticsQuery(startDate, endDate, user._id.toString());
    const result = await Booking.aggregate(query)
    console.log(result, result.length);
    if (!result) throw createError(404, "Specific business service and incoming booking not found");
    if (result.length === 0) res.status(200).json({ totalAmount: 0, totalBookings: 0 });
    else res.status(200).json({ totalAmount: result[0].totalAmount, totalBookings: result[0].totalBookings });
  } catch (err) {
    next(err)
  }
}

/* specific time avegare business */
export const getSpecificAverage = async (req, res, next) => {
  global.logger.info("---GET SPECIFIC BUSINESS AVERAGE BOOKING---");
  try {
    const user = req.user;
    if (user.type != "business") throw createError(401, "Unauthorized");
    const { date_start, date_end } = req.query;
    validateFormatDate(date_start, date_end);
    const [year_start, month_start, day_start] = date_start.split("-");
    const [year_end, month_end, day_end] = date_end.split("-");
    const monthsDifference = (year_end - year_start) * 12 + (month_end - month_start);
    console.log("Number of months:", monthsDifference);
    const startDate = new Date(
      Date.UTC(year_start, month_start - 1, parseInt(day_start))
    );
    const endDate = new Date(
      Date.UTC(year_end, month_end - 1, parseInt(day_end))
    );
    let query = buildBookingStatisticsQuery(startDate, endDate, user._id.toString());
    const result = await Booking.aggregate(query);
    if (!result || result.length === 0) throw createError(404, "All time avegare booking not found");
    let average = 0;
    const resultOp = { average };
    average = result[0].totalAmount / monthsDifference;
    resultOp.average = average;
    // Hacer algo con resultOp, por ejemplo, devolverlo en la respuesta
    res.status(200).json(resultOp);
  } catch (err) {
    next(err)
  }
}

/* specific time projection business */
export const getSpecificProjection = async (req, res, next) => {
  global.logger.info("---GET SPECIFIC BUSINESS PROJECTION BOOKING---");
  try {
    const user = req.user;
    if (user.type != "business") throw createError(401, "Unauthorized");
    const { date_start, date_end } = req.query;
    validateFormatDate(date_start, date_end);
    const [year_start, month_start, day_start] = date_start.split("-");
    const [year_end, month_end, day_end] = date_end.split("-");
    const monthsDifference = (year_end - year_start) * 12 + (month_end - month_start);
    console.log("Number of months:", monthsDifference);
    const startDate = new Date(
      Date.UTC(year_start, month_start - 1, parseInt(day_start))
    );
    const endDate = new Date(
      Date.UTC(year_end, month_end - 1, parseInt(day_end))
    );
    let query = buildBookingStatisticsQuery(startDate, endDate, user._id.toString());
    const result = await Booking.aggregate(query);
    console.log(result);
    let projection = 0;
    const resultOp = { projection: projection }
    if (result.length != 0) projection = (result[0].totalAmount / monthsDifference) * (monthsDifference);
    resultOp.projection = projection;
    res.status(200).json(resultOp);
  } catch (err) {
    next(err)
  }

}

