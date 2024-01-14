import moment from "moment-timezone";
import Booking from "../../models/booking.js";
import {
  optionsBooking,
  countDateBookings,
  validateFormatDate,
  countWeekBookings,
  countAllBookings,
  daysOfweek,
} from "./helper.js";
import { createError } from "../../config/error.js";

export const getTimeBusiness = async (req, res, next) => {
  global.logger.info("---GET SPECIFIC DATE TO BUSINESS BOOKING---");
  try {
    const user = req.user;
    if (user.type !== "business") throw createError(401, "Unauthorized");
    const { date_start, date_end, page, limit } = req.query;
    validateFormatDate(date_start, date_end);
    const startDate = moment.utc(date_start).format();
    const endDate = moment.utc(date_end).format();
    let options = optionsBooking(page, limit);
    let query = {
      businessUser: user._id.toString(),
      "date.isoDate": {
        $gte: startDate,
        $lte: endDate,
      },
      status: { $in: ["canceled", "completed", "failed", "confirmed"] },
    };
    const booking = await Booking.paginate(query, options);
    if (!booking)
      throw createError(404, "Booking specific date to business not found");
    res.status(200).json(booking);
  } catch (err) {
    next(err);
  }
};

export const getAllBusiness = async (req, res, next) => {
  global.logger.info("---GET ALL BUSINESS BOOKING---");
  try {
    const user = req.user;
    if (user.type != "business") throw createError(401, "Unauthorized");
    const { page, limit, date } = req.query;
    let options = optionsBooking(page, limit);
    let query = {
      businessUser: user._id.toString(),
      status: { $in: ["canceled", "completed", "failed", "confirmed"] },
    };
    const booking = await Booking.paginate(query, options);
    if (!booking) throw createError(404, "Booking business not found");
    res.status(200).json(booking);
  } catch (err) {
    next(err);
  }
};

export const getYearBusiness = async (req, res, next) => {
  global.logger.info("---GET YEAR TO BUSINESS BOOKING---");
  try {
    const user = req.user;
    if (user.type != "business") throw createError(401, "Unauthorized");
    const { date, page, limit } = req.query;
    validateFormatDate(date);
    const year = moment.utc(date, "YYYY-MM-DD").year();
    let options = optionsBooking(page, limit);
    let query = {
      businessUser: user._id.toString(),
      "date.isoDate": {
        $gte: moment.utc(`${year}-01-01`).format(),
        $lte: moment.utc(`${year}-12-31`).format(),
      },
      status: { $in: ["canceled", "completed", "failed", "confirmed"] },
    };
    const booking = await Booking.paginate(query, options);
    if (!booking) throw createError(404, "Booking business not found");
    res.status(200).json(booking);
  } catch (err) {
    next(err);
  }
};

export const getMonthBusiness = async (req, res, next) => {
  global.logger.info("---GET MONTH BUSINESS BOOKING---");
  try {
    const user = req.user;
    if (user.type != "business") throw createError(401, "Unauthorized");
    const { date, page, limit } = req.query;
    validateFormatDate(date);
    let options = optionsBooking(page, limit);
    const query = {
      businessUser: user._id.toString(),
      "date.isoDate": {
        $gte: moment(date, "YYYY-MM-DD").startOf("month"),
        $lte: moment(date, "YYYY-MM-DD").endOf("month"),
      },
      status: {
        $in: ["canceled", "completed", "failed", "confirmed"],
      },
    };
    const booking = await Booking.paginate(query, options);
    if (!booking) throw createError(404, "Month business booking not found");
    res.status(200).json(booking);
  } catch (err) {
    next(err);
  }
};

export const getWeekBusiness = async (req, res, next) => {
  global.logger.info("---GET WEEK BOOKING BY BUSINESS---");
  try {
    const user = req.user;
    if (user.type != "business") throw createError(401, "Unauthorized");
    const { date } = req.query;
    validateFormatDate(date);
    const dateMoment = moment(date, "YYYY-MM-DD")
      .add(7, "day")
      .format("YYYY-MM-DD");
    const startWeek = moment.utc(date).format();
    const endWeek = moment.utc(dateMoment).format();
    let query = countWeekBookings(
      "businessUser",
      user._id.toString(),
      startWeek,
      endWeek
    );
    query[0].$match.status = {
      $in: ["canceled", "completed", "failed", "confirmed"],
    };
    const result = await Booking.aggregate(query);
    if (!result) throw createError(404, "Business week booking not found ");
    const response = daysOfweek(result, startWeek);
    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
};

export const getNextBusiness = async (req, res, next) => {
  global.logger.info("---GET NEXT DAYS BUSINESS---");
  try {
    const user = req.user;
    if (user.type != "business") throw createError(401, "Unauthorized");
    const { date, page, limit } = req.query;
    validateFormatDate(date);
    let options = optionsBooking(page, limit);
    const dateMoment = moment(date, "YYYY-MM-DD")
      .subtract(1, "day")
      .format("YYYY-MM-DD");
    console.log(user);
    let query = {
      businessUser: user._id.toString(),
      "date.stringData": { $gt: dateMoment },
      status: { $in: ["canceled", "completed", "failed", "confirmed"] },
    };
    const booking = await Booking.paginate(query, options);
    if (!booking) throw createError(404, "Business next booking not found ");
    res.status(200).json(booking);
  } catch (err) {
    next(err);
  }
};

export const getNextMonthBusiness = async (req, res, next) => {
  global.logger.info("---GET NEXT MONTH BUSINESS BOOKING---");
  try {
    const user = req.user;
    if (user.type != "business") throw createError(401, "Unauthorized");
    const { date, page, limit } = req.query;
    validateFormatDate(date);
    const newDate = moment.utc(date, "YYYY-MM-DD").add(1, "month");
    let options = optionsBooking(page, limit);
    const query = {
      businessUser: user._id.toString(),
      "date.isoDate": {
        $gte: moment(newDate, "YYYY-MM-DD").startOf("month"),
        $lte: moment(newDate, "YYYY-MM-DD").endOf("month"),
      },
      status: { $in: ["canceled", "completed", "failed", "confirmed"] },
    };
    const booking = await Booking.paginate(query, options);
    if (!booking)
      throw createError(404, "Next month business booking not found");
    res.status(200).json(booking);
  } catch (err) {
    next(err);
  }
};

export const getDayBusiness = async (req, res, next) => {
  global.logger.info("---GET DAY TO BUSINESS BOOKING---");
  try {
    const user = req.user;
    if (user.type != "business") throw createError(401, "Unauthorized");
    const { date, page, limit } = req.query;
    validateFormatDate(date);
    let options = optionsBooking(page, limit);
    let query = {
      businessUser: user._id.toString(),
      "date.stringData": date,
      status: { $in: ["canceled", "completed", "failed", "confirmed"] },
    };
    const booking = await Booking.paginate(query, options);
    if (!booking) throw createError(404, "Business booking not found ");
    res.status(200).json(booking);
  } catch (err) {
    next(err);
  }
};

export const getLastBusiness = async (req, res, next) => {
  global.logger.info("---GET NEXT BUSINESS BY BOOKING---");
  try {
    const user = req.user;
    if (user.type != "business") throw createError(401, "Unauthorized");
    const { date, page, limit } = req.query;
    validateFormatDate(date);
    const dateMoment = moment(date, "YYYY-MM-DD")
      .add(1, "day")
      .format("YYYY-MM-DD");
    let options = optionsBooking(page, limit);
    let query = {
      businessUser: user._id.toString(),
      "date.stringData": { $lt: dateMoment },
      status: { $in: ["canceled", "completed", "failed", "confirmed"] },
    };
    const booking = await Booking.paginate(query, options);
    if (!booking) throw createError(404, "Business booking not found ");
    res.status(200).json(booking);
  } catch (err) {
    next(err);
  }
};

/* Indicators */

const calculateAvegare = async (pastMonth, user) => {
  console.log("*** Function calculate averange ***");
  const initMonth = await Booking.findOne(
    { businessUser: user },
    { "date.isoDate": 1, _id: 0 }
  ).sort({ "date.isoDate": 1 });
  if (!initMonth) return 0;
  const init = moment(initMonth.date.isoDate).startOf("month").add(1, "month");
  let months = pastMonth.diff(init, "month");
  if (months < 2) months = 1;
  else if (months == 11) months++;
  const query = countDateBookings(init, pastMonth, user);
  const result = await Booking.find(query);
  const sumTotal = result.reduce(
    (count, price) => count + price.payment.priceBRL,
    0
  );
  return sumTotal / months;
};

const countBookingsForMonth = (dateMonth, user) => {
  const startMonth = moment(dateMonth, "YYYY-MM-DD").startOf("month");
  const endMOnth = moment(dateMonth, "YYYY-MM-DD").endOf("month");
  return countDateBookings(startMonth, endMOnth, user);
};

const countBookingsForYear = (dateYear, userId) => {
  const year = moment.utc(dateYear, "YYYY-MM-DD").year();
  const startOfYear = moment.utc(`${year}-01-01`).format();
  const endOfYear = moment.utc(`${year}-12-31`).format();
  return countDateBookings(startOfYear, endOfYear, userId);
};

const countBookingsForSpecific = (dateInit, dateFinish, user) => {
  const startDate = moment(dateInit, "YYYY-MM-DD");
  if (dateFinish == undefined) throw createError(400, "not found date_end");
  const endDate = moment(dateFinish, "YYYY-MM-DD").add(1, "day");
  return countDateBookings(startDate, endDate, user);
};

const calculateBookingProjection = async (
  date,
  dateBefore,
  dateAfter,
  user
) => {
  const startMonth = moment(date, "YYYY-MM-DD").startOf("month");
  const query = countDateBookings(startMonth, date, user);
  const result = await Booking.find(query);
  if (!result || result.length === 0) return 0;
  const sumTotal = result.reduce(
    (count, price) => count + price.payment.priceBRL,
    0
  );
  const dateTotal = dateBefore + dateAfter;
  return (sumTotal / dateBefore) * dateTotal;
};

export const getIndicators = async (req, res, next) => {
  global.logger.info("---GET INDICATORS BOOKINGS---");
  try {
    const user = req.user;
    if (user.type != "business") throw createError(401, "Unauthorized");
    const { date_start, date_end, duration } = req.query;
    let query = {},
      avegare = 0;
    validateFormatDate(date_start);
    if (duration === "month") {
      query = countBookingsForMonth(date_start, user._id.toString());
    } else if (duration === "year") {
      query = countBookingsForYear(date_start, user._id.toString());
    } else if (duration === "alltime") {
      query = countAllBookings(user._id.toString());
    } else if (duration === "specific") {
      if (date_end == undefined) throw createError(400, "not found date_end");
      query = countBookingsForSpecific(
        date_start,
        date_end,
        user._id.toString()
      );
      avegare = await calculateAvegare(
        moment(date_start, "YYYY-MM-DD").endOf("month"),
        user._id.toString()
      );
    } else throw createError(400, "invalid duration format");
    const result = await Booking.find(query);
    if (!result)
      throw createError(
        404,
        "Monthly business service and incoming booking not found"
      );
    const sumTotal = result.reduce(
      (count, price) => count + price.payment.priceBRL,
      0
    );
    if (avegare == 0)
      avegare = await calculateAvegare(
        moment(date_start, "YYYY-MM-DD").startOf("month"),
        user._id.toString()
      );
    const diasPasados = moment(date_start, "YYYY-MM-DD").date();
    const diasEnElMes = moment(date_start, "YYYY-MM-DD").daysInMonth();
    const diasRestantes = diasEnElMes - diasPasados;
    const projection = await calculateBookingProjection(
      date_start,
      diasPasados,
      diasRestantes,
      user._id.toString()
    );
    res.status(200).json({
      NBookings: result.length,
      MoneyIncoming: sumTotal,
      Average: avegare,
      Projection: projection,
    });
  } catch (err) {
    next(err);
  }
};
