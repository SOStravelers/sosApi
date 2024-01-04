import moment from "moment-timezone";
import Booking from "../../models/booking.js";
import User from "../../models/user.js";
import { optionsBooking, validateFormatDate } from "./helper.js";
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
            "status": { $in: ['canceled', 'completed', 'failed', "confirmed"] },
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
        const dateMoment = moment(date, 'YYYY-MM-DD').add(1, 'day').format('YYYY-MM-DD');
        let options = optionsBooking(page, limit);
        let query = {
            businessUser: user._id.toString(),
            "date.stringData": { $lt: dateMoment },
            "status": { $in: ['canceled', 'completed', 'failed', "confirmed"] },
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
      const year = moment.utc(date, 'YYYY-MM-DD').year();
      let options = optionsBooking(page, limit);
      let query = {
        businessUser: user._id.toString(),
        "date.isoDate": {
          $gte: moment.utc(`${year}-01-01`).format(),
          $lte: moment.utc(`${year}-12-31`).format(),
        },
        "status": { $in: ['canceled', 'completed', 'failed', "confirmed"] },
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
            $gte: moment(date, 'YYYY-MM-DD').startOf('month'),
            $lte: moment(date, 'YYYY-MM-DD').endOf('month'),
        },
        "status": { $in: ['canceled', 'completed', 'failed', "confirmed"] },
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
        const { date, page, limit } = req.query;
        validateFormatDate(date);
        const dateMoment = moment(date, 'YYYY-MM-DD').add(7, 'day').format('YYYY-MM-DD');
        const startWeek = moment.utc(date).format();
        const endWeek =  moment.utc(dateMoment).format();
        console.log(startWeek);
        console.log(endWeek);
        console.log(user);
        let options = optionsBooking(page, limit);
        let query = {
            businessUser: user._id.toString(),
            "date.isoDate": {
                $gte: startWeek,
                $lte: endWeek,
            },
            "status": { $in: ['canceled', 'completed', 'failed', "confirmed"] },
        };
        const booking = await Booking.paginate(query, options);
        if (!booking) throw createError(404, "Business week booking not found");
        res.status(200).json(booking);
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
        const dateMoment = moment(date, 'YYYY-MM-DD').subtract(1, 'day').format('YYYY-MM-DD');
        console.log(user);
        let query = {
            businessUser: user._id.toString(),
            "date.stringData": { $gt: dateMoment},
            "status": { $in: ['canceled', 'completed', 'failed', "confirmed"] },
        };
        const booking = await Booking.paginate(query, options);
        if (!booking) throw createError(404, "Business next booking not found ");
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
            "status": { $in: ['canceled', 'completed', 'failed', "confirmed"] },
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
        if (user.type != "Business") throw createError(401, "Unauthorized");
        const { date, page, limit } = req.query;
        validateFormatDate(date);
        const dateMoment = moment(date, 'YYYY-MM-DD').add(1, 'day').format('YYYY-MM-DD');
        let options = optionsBooking(page, limit);
        let query = {
            businessUser: user._id.toString(),
            "date.stringData": { $lt: dateMoment },
            "status": { $in: ['canceled', 'completed', 'failed', "confirmed"] },
        };
        const booking = await Booking.paginate(query, options);
        if (!booking) throw createError(404, "Business booking not found ");
        res.status(200).json(booking);
    } catch (err) {
        next(err)
    }
};  



