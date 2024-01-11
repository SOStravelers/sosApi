import moment from "moment-timezone";
import Booking from "../../models/booking.js";
import { optionsBooking, validateFormatDate, countWeekBookings } from "./helper.js";
import { createError } from "../../config/error.js";

export const getAllworkers = async (req, res, next) => {
  global.logger.info("---GET TO WORKER ALL BOOKING---");
  try {
    const user = req.user;
    console.log(user);
    if (user.type != "worker") throw createError(401, "Unauthorized");
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

export const getNextWorkers = async (req, res, next) => {
  global.logger.info("---GET NEXT DAYS WORKER---");
  try {
    const user = req.user;
    if (user.type != "worker") throw createError(401, "Unauthorized");
    const { date, page, limit } = req.query;
    validateFormatDate(date);
    let options = optionsBooking(page, limit);
    const dateMoment = moment(date, "YYYY-MM-DD")
      .subtract(1, "day")
      .format("YYYY-MM-DD");
    console.log(user);
    let query = {
      workerUser: user._id.toString(),
      "date.stringData": { $gt: dateMoment },
    };
    const booking = await Booking.paginate(query, options);
    if (!booking) throw createError(404, "Working next booking not found ");
    res.status(200).json(booking);
  } catch (err) {
    next(err);
  }
};

export const getNextMonthWorker = async (req, res, next) => {
  global.logger.info("---GET NEXT MONTH WORKER BOOKING---");
  try {
    const user = req.user;
    if (user.type != "worker") throw createError(401, "Unauthorized");
    const { date, page, limit } = req.query;
    validateFormatDate(date);
    const newDate = moment.utc(date, "YYYY-MM-DD").add(1, "month");
    let options = optionsBooking(page, limit);
    const query = {
      workerUser: user._id.toString(),
      "date.isoDate": {
        $gte: moment(newDate, "YYYY-MM-DD").startOf("month"),
        $lte: moment(newDate, "YYYY-MM-DD").endOf("month"),
      },
    };
    const booking = await Booking.paginate(query, options);
    if (!booking) throw createError(404, "Next month worker booking not found");
    res.status(200).json(booking);
  } catch (err) {
    next(err);
  }
};

export const getMonthWorkers = async (req, res, next) => {
  global.logger.info("---GET WORKER MONTH BOOKING---");
  try {
    const user = req.user;
    if (user.type != "worker") throw createError(401, "Unauthorized");
    const { date, page, limit } = req.query;
    validateFormatDate(date);
    let options = optionsBooking(page, limit);
    const query = {
      workerUser: user._id.toString(),
      "date.isoDate": {
        $gte: moment(date, "YYYY-MM-DD").startOf("month"),
        $lte: moment(date, "YYYY-MM-DD").endOf("month"),
      },
    };
    const booking = await Booking.paginate(query, options);
    if (!booking) throw createError(404, "Worker booking not found");
    res.status(200).json(booking);
  } catch (err) {
    next(err);
  }
};

export const getWeekWorkers = async (req, res, next) => {
  global.logger.info("---GET WEEK BOOKING BY WORKER---");
  try {
    const user = req.user;
    if (user.type != "worker") throw createError(401, "Unauthorized");
    const { date } = req.query;
    validateFormatDate(date);
    const dateMoment = moment(date, "YYYY-MM-DD")
      .add(7, "day")
      .format("YYYY-MM-DD");
    const startWeek = moment.utc(date).format();
    const endWeek = moment.utc(dateMoment).format(); 
    console.log(moment.utc(startWeek).toISOString());
    console.log(moment.utc(endWeek).format(), endWeek);
    let query = countWeekBookings('workerUser', user._id.toString(), startWeek, endWeek);
    const result = await Booking.aggregate(query);
    console.log('Resultados agrupados por día:', result);
    if (!result) throw createError(404, "Worker week booking not found ");
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const getListDayWorkers = async (req, res, next) => {
  global.logger.info("---GET LIST DAYS TO WORKER BOOKING---");
  try {
    const user = req.user;
    if (user.type != "worker") throw createError(401, "Unauthorized");
    const { date, page, limit } = req.query;
    validateFormatDate(date);
    const dateMoment = moment(date, "YYYY-MM-DD")
      .add(3, "day")
      .format("YYYY-MM-DD");
    const startDay = moment.utc(date).format();
    const lastDay = moment.utc(dateMoment).format();
    let options = optionsBooking(page, limit);
    let query = {
      workerUser: user._id.toString(),
      "date.isoDate": {
        $gte: startDay,
        $lte: lastDay,
      },
    };
    const booking = await Booking.paginate(query, options);
    if (!booking) throw createError(404, "Worker booking not found");
    res.status(200).json(booking);
  } catch (err) {
    next(err);
  }
};

export const getDayWorkers = async (req, res, next) => {
  global.logger.info("---GET DAY TO WORKER BOOKING---");
  try {
    const user = req.user;
    if (user.type != "worker") throw createError(401, "Unauthorized");
    const { date, page, limit } = req.query;
    validateFormatDate(date);
    let options = optionsBooking(page, limit);
    let query = {
      workerUser: user._id.toString(),
      "date.stringData": date,
    };
    const booking = await Booking.paginate(query, options);
    if (!booking) throw createError(404, "Worker booking not found ");
    res.status(200).json(booking);
  } catch (err) {
    next(err);
  }
};

export const getLastWorkers = async (req, res, next) => {
  global.logger.info("---GET NEXT WORKERS BY BOOKING---");
  try {
    const user = req.user;
    if (user.type != "worker") throw createError(401, "Unauthorized");
    const { date, page, limit } = req.query;
    validateFormatDate(date);
    const dateMoment = moment(date, "YYYY-MM-DD")
      .add(1, "day")
      .format("YYYY-MM-DD");
    let options = optionsBooking(page, limit);
    let query = {
      workerUser: user._id.toString(),
      "date.stringData": { $lt: dateMoment },
    };
    const booking = await Booking.paginate(query, options);
    if (!booking) throw createError(404, "Worker booking not found ");
    res.status(200).json(booking);
  } catch (err) {
    next(err);
  }
};
