import moment from "moment-timezone";
import Booking from "../../models/booking.js";
/* import User from "../../models/user.js"; */
import { createError } from "../../config/error.js"
import { optionsBooking, validateFormatDate, countWeekBookings, daysOfweek } from "./helper.js";

export const getAllClientsId = async (req, res, next) => {
    global.logger.info("---GET TO CLIENT ALL BOOKING---");
    try {
        const user = req.user;
        if (user.type != "personal") throw createError(401, "Unauthorized");
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

export const getMonthClientId = async (req, res, next) => {
    global.logger.info("---GET CLIENT MONTH BOOKING---");
    try {
        const user = req.user;
        if (user.type != "personal") throw createError(401, "Unauthorized");
        const { date, page, limit } = req.query;
        validateFormatDate(date);
        let options = optionsBooking(page, limit);
        const query = {
            clientUser: user._id.toString(),
            "date.isoDate": {
                $gte: moment(date, 'YYYY-MM-DD').startOf('month'),
                $lte: moment(date, 'YYYY-MM-DD').endOf('month'),
            },
        };
        const booking = await Booking.paginate(query, options);
        if (!booking) throw createError(404, "Client month booking not found");
        res.status(200).json(booking);
    } catch (err) {
        next(err);
    }
};

export const getWeekClientId = async (req, res, next) => {
    global.logger.info("---GET WEEK BOOKING BY CLIENT---");
    try {
        const user = req.user;
        if (user.type != "personal") throw createError(401, "Unauthorized");
        const { date} = req.query;
        validateFormatDate(date);
        const dateMoment = moment(date, 'YYYY-MM-DD').add(7, 'day').format('YYYY-MM-DD');
        const startWeek = moment.utc(date).format();
        const endWeek = moment.utc(dateMoment).format();
        const query = countWeekBookings('clientUser', user._id.toString(), startWeek, endWeek);
        const result = await Booking.aggregate(query);
        if (!result) throw createError(404, "Personal week booking not found ");
        const response = daysOfweek(result, startWeek);
        res.status(200).json(response);
    } catch (err) {
        next(err);
    }
};

export const getNextDaysClientId = async (req, res, next) => {
    global.logger.info("---GET NEXT DAYS CLIENT---");
    try {
        const user = req.user;
        if (user.type != "personal") throw createError(401, "Unauthorized");
        const { date, page, limit } = req.query;
        validateFormatDate(date);
        let options = optionsBooking(page, limit);
        const dateMoment = moment(date, 'YYYY-MM-DD').subtract(1, 'day').format('YYYY-MM-DD');
        let query = {
            clientUser: user._id.toString(),
            "date.stringData": { $gt: dateMoment },
        };
        const booking = await Booking.paginate(query, options);
        if (!booking) throw createError(404, "Client next booking not found ");
        res.status(200).json(booking);
    } catch (err) {
        next(err);
    }
};

export const getDayClientId = async (req, res, next) => {
    global.logger.info("---GET DAY BOOKING BY CLIENT---");
    try {
        const user = req.user;
        if (user.type != "personal") throw createError(401, "Unauthorized");
        const { date, page, limit } = req.query;
        validateFormatDate(date);
        let options = optionsBooking(page, limit);
        let query = {
            clientUser: user._id.toString(),
            "date.stringData": date,
        };
        const booking = await Booking.paginate(query, options);
        if (!booking) throw createError(404, "Client day booking not found ");
        res.status(200).json(booking);
    } catch (err) {
        next(err);
    }
};

export const getLastDaysClientId = async (req, res, next) => {
    global.logger.info("---GET LAST DAY CLIENT---");
    try {
        const user = req.user;
        if (user.type != "personal") throw createError(401, "Unauthorized");
        const { date, page, limit } = req.query;
        validateFormatDate(date);
        let options = optionsBooking(page, limit);
        const dateMoment = moment(date, 'YYYY-MM-DD').add(1, 'day').format('YYYY-MM-DD');
        let query = {
            clientUser: user._id.toString(),
            "date.stringData": { $lt: dateMoment },
        };
        const booking = await Booking.paginate(query, options);
        if (!booking) throw createError(404, "Client booking not found ");
        res.status(200).json(booking);
    } catch (err) {
        next(err);
    }
};


