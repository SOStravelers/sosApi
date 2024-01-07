import moment from "moment-timezone";
import Booking from "../../models/booking.js";
import User from "../../models/user.js";
import { optionsBooking, countDateBookings, validateFormatDate, countAllBookings } from "./helper.js";
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
        const endWeek = moment.utc(dateMoment).format();
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
            "date.stringData": { $gt: dateMoment },
            "status": { $in: ['canceled', 'completed', 'failed', "confirmed"] },
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
        const newDate = moment.utc(date, 'YYYY-MM-DD').add(1, 'month');
        let options = optionsBooking(page, limit);
        const query = {
            businessUser: user._id.toString(),
            "date.isoDate": {
                $gte: moment(newDate, 'YYYY-MM-DD').startOf('month'),
                $lte: moment(newDate, 'YYYY-MM-DD').endOf('month'),
            },
            "status": { $in: ['canceled', 'completed', 'failed', "confirmed"] },
        };
        const booking = await Booking.paginate(query, options);
        if (!booking) throw createError(404, "Next month business booking not found");
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


/* todos los servicios divididos por parametros diferentes  */
export const getMonthServiceMoney = async (req, res, next) => {
    global.logger.info("---GET MONTHLY BUSINESS SERVICES---");
    try {
        const user = req.user;
        if (user.type != "business") throw createError(401, "Unauthorized");
        const { date_start, date_end, duration } = req.query;
        let query = {};
        validateFormatDate(date_start);
        if (duration === 'month') {
            const startDate = moment(date_start, 'YYYY-MM-DD').startOf('month');
            const endDate = moment(date_start, 'YYYY-MM-DD').endOf('month');
            query = countDateBookings(startDate, endDate, user._id.toString());
        }
        else if (duration === 'year') {
            const year = moment.utc(date_start, 'YYYY-MM-DD').year();
            const startDate = moment.utc(`${year}-01-01`).format();
            const endDate = moment.utc(`${year}-12-31`).format();
            query = countDateBookings(startDate, endDate, user._id.toString());
        }
        else if (duration === 'alltime') {
            query = countAllBookings(user._id.toString());
        }
        else if (duration === 'specific') {
            const startDate = moment(date_start, 'YYYY-MM-DD');
            const endDate = moment(date_end, 'YYYY-MM-DD').add(1, 'day');
            const greaterDate = endDate.isAfter(startDate);
            console.log(greaterDate, startDate, endDate)
            if (greaterDate) query = countDateBookings(startDate, endDate, user._id.toString());
            else throw createError(400, "invalid range of date");
        }
        else throw createError(400, "invalid duration format");
        const result = await Booking.countDocuments(query);
        if (!result) throw createError(404, "Monthly business service not found");
        else res.status(200).json({ totalBookings: result });
    } catch (err) {
        next(err)
    }
};


/* cantidad de dinero segun los parametros funciona para las 4 interfaces */
export const getMonthMoney = async (req, res, next) => {
    global.logger.info("---GET MONTHLY BUSINESS MONEY---");
    try {
        const user = req.user;
        if (user.type != "business") throw createError(401, "Unauthorized");
        const { date_start, date_end, duration } = req.query;
        let query = {};
        validateFormatDate(date_start);
        if (duration === 'month') {
            const startDate = moment(date_start, 'YYYY-MM-DD').startOf('month');
            const endDate = moment(date_start, 'YYYY-MM-DD').endOf('month');
            query = countDateBookings(startDate, endDate, user._id.toString());
        }
        else if (duration === 'year') {
            const year = moment.utc(date_start, 'YYYY-MM-DD').year();
            const startDate = moment.utc(`${year}-01-01`).format();
            const endDate = moment.utc(`${year}-12-31`).format();
            query = countDateBookings(startDate, endDate, user._id.toString());
        }
        else if (duration === 'alltime') {
            query = countAllBookings(user._id.toString());
        }
        else if (duration === 'specific') {
            const startDate = moment(date_start, 'YYYY-MM-DD');
            const endDate = moment(date_end, 'YYYY-MM-DD').add(1, 'day');
            const greaterDate = endDate.isAfter(startDate);
            console.log(greaterDate, startDate, endDate)
            if (greaterDate) query = countDateBookings(startDate, endDate, user._id.toString());
            else throw createError(400, "invalid range of date");
        }
        else throw createError(400, "invalid duration format");
        const result = await Booking.find(query);
        // console.log('result: ', result.length, result); 
        if (!result) throw createError(404, "Monthly business service and incoming booking not found");
        const sumaTotal = result.reduce((count, price) => count + price.payment.priceBRL, 0);
        res.status(200).json({ countBookings: result.length, totalAmount: sumaTotal });
    } catch (err) {
        next(err)
    }
};



/* Avegare  promedio mes*/

const calculateBookingAverage = async (query, divider, res) => {
    const result = await Booking.find(query);
    if (!result || result.length === 0) {
        throw createError(404, "Monthly business average booking not found");
    }

    const sumaTotal = result.reduce((count, price) => count + price.payment.priceBRL, 0);
    console.log(sumaTotal)
    const average = sumaTotal / divider;
    res.status(200).json({average: average});
};


const calculateBookingProjection = async (query, dateBefore, dateAfter, res) => {
    const result = await Booking.find(query);
    if (!result || result.length === 0) {
        throw createError(404, "Monthly business average booking not found");
    }
   const sumaTotal = result.reduce((count, price) => count + price.payment.priceBRL, 0);
   const dateTotal = dateBefore+dateAfter;
   console.log(sumaTotal)
   const projection = (sumaTotal/dateBefore) * dateTotal;
   res.status(200).json({projection: projection});
}

const countBookingsForYear = (year, userId) => {
    const startOfYear = moment.utc(`${year}-01-01`).format();
    const endOfYear = moment.utc(`${year}-12-31`).format();
    return countDateBookings(startOfYear, endOfYear, userId);
};

export const getMonthAvegare = async (req, res, next) => {
    global.logger.info("---GET MONTHLY BUSINESS AVERAGE BOOKING ---");
    try {
        const user = req.user;
        if (user.type !== "business") {
            throw createError(401, "Unauthorized");
        }
        const { date_start, date_end, duration } = req.query;
        validateFormatDate(date_start);
        const userDoc = await User.findById(user._id.toString()).select('createdAt').exec();
        if (!userDoc) {
            throw createError(404, "Monthly business average booking not found");
        }
        const originalDate = moment.utc(userDoc.createdAt);
        const date1 = originalDate.startOf('day');
        const date2 = moment.utc(date_start).startOf('day');
        const differenceInMonths = date2.diff(date1, 'months');
        const greaterDate = date2.isAfter(date1);
        if (duration === 'month') {
            if (greaterDate) {
                let query = {}, divider = 0;
                if (differenceInMonths === 0) {
                    const diferenciaEnDias = date2.diff(date1, 'days', false);
                    divider = diferenciaEnDias;
                    query = countDateBookings(date1, date2, user._id.toString());
                } else if (differenceInMonths > 11) {
                    divider = differenceInMonths;
                    query = countDateBookings(moment.utc(date_start).subtract(11, 'month').startOf('day').format(), date2, user._id.toString());
                } else {
                    const init = date1.startOf('month');
                    const finish = date2.startOf('month');
                    divider = differenceInMonths;
                    query = countDateBookings(init, finish, user._id.toString());
                }
                await calculateBookingAverage(query, divider, res);
            } else {
                throw createError(400, "Invalid range of date");
            }
        } else if (duration === 'year') {
            let query = {}, divider = 0;
            if (differenceInMonths === 0) {
                const diferenciaEnDias = date2.diff(date1, 'days', false);
                divider = diferenciaEnDias;
                query = countDateBookings(date1, date2, user._id.toString());
            } else {
                const year = moment.utc(date_start, 'YYYY-MM-DD').year();
                divider = 12;
                query = countBookingsForYear(year, user._id.toString());
            }
            await calculateBookingAverage(query, divider, res);
        } else if (duration === 'alltime') {
            const query = countAllBookings(user._id.toString());
            const result = await Booking.find(query);
            /* incognita  */
            const differenceInMonths = date2.diff(date1, 'months');

            if (!result || result.length === 0) {
                throw createError(404, "Monthly business average booking not found");
            }
            const sumaTotal = result.reduce((count, price) => count + price.payment.priceBRL, 0);
            const average = sumaTotal / differenceInMonths;
            res.status(200).json({average: average});
        } else if (duration === 'specific') {
            let query = {}, divider;
            const startDate = moment(date_start, 'YYYY-MM-DD');
            const endDate = moment(date_end, 'YYYY-MM-DD').add(1, 'day');
            const differenceInMonths = endDate.diff(startDate, 'months');
            const diferenciaEnDias = date2.diff(date1, 'days', false);
            if (differenceInMonths === 0) {
                divider = diferenciaEnDias;
            } else {
                divider = differenceInMonths;
            }
            const greaterDate = endDate.isAfter(startDate);
            if (greaterDate) {
                query = countDateBookings(startDate, endDate, user._id.toString());
            }
            await calculateBookingAverage(query, divider, res);
        }
    } catch (err) {
        next(err);
    }
};



/* Projection porjecion mes */


export const getMonthProjection = async (req, res, next) => {
    global.logger.info("---GET MONTHLY BUSINESS PROJECTION BOOKING---");
    try {
        const user = req.user;
        if (user.type != "business") throw createError(401, "Unauthorized");
        const { date_start, date_end, duration } = req.query;
        validateFormatDate(date_start);
        if(duration === 'month'){
            const startDate = moment(date_start, 'YYYY-MM-DD').startOf('month');
            const endDate = moment(date_start, 'YYYY-MM-DD').add(1, 'day');
            const query = countDateBookings(startDate, endDate, user._id.toString());
            const diasPasados = moment(date_start, 'YYYY-MM-DD').date();
            const diasEnElMes = moment(date_start, 'YYYY-MM-DD').daysInMonth();
            const diasRestantes = diasEnElMes - diasPasados;
            console.log(startDate, endDate);
            console.log(diasPasados, diasRestantes);
            await calculateBookingProjection(query, diasPasados, diasRestantes, res); 

        }else if(duration === 'year'){
            const userDoc = await User.findById(user._id.toString()).select('createdAt').exec();
            if (!userDoc) {
                throw createError(404, "Monthly business average booking not found");
            }
            const originalDate = moment.utc(userDoc.createdAt);
            const date1 = originalDate.startOf('day');
            const date2 = moment.utc(date_start).startOf('day');
            const greaterDate = date2.isAfter(date1);
            if (greaterDate){
                const year = moment.utc(date_start, 'YYYY-MM-DD').year();
                const query = countBookingsForYear(year, user._id.toString());
                const firstMonth = moment.utc(`${year}-01-01`);
                const dateMonth = moment.utc(date_start, 'YYYY-MM-DD');
                const mesesPasados = dateMonth.diff(firstMonth, 'months', false);
                const mesesRestantes = 11 - mesesPasados;
                await calculateBookingProjection(query, mesesPasados+1, mesesRestantes, res); 
            }else throw createError(404, "Monthly business average booking not found");        

        }else if(duration === 'alltime'){

            const userDoc = await User.findById(user._id.toString()).select('createdAt').exec();
            if (!userDoc) {
                throw createError(404, "Monthly business average booking not found");
            }
            const originalDate = moment.utc(userDoc.createdAt);
            const date2 = moment.utc(date_start);
            /* incognita */
            const dateBefore = date2.diff(originalDate, 'months', false);
            const differenceInMonths = date2.diff(originalDate, 'months');
            const dateAfter = differenceInMonths - dateBefore;
            const query = countAllBookings(user._id.toString());
            const result = await Booking.find(query);
            if (!result || result.length === 0) {
                throw createError(404, "Monthly business average booking not found");
            }
           const sumaTotal = result.reduce((count, price) => count + price.payment.priceBRL, 0);
           const dateTotal = dateBefore+dateAfter;
           const projection = (sumaTotal/dateBefore) * dateTotal;
           res.status(200).json({projection: projection});

        }else if(duration === 'specific'){

            const startDate = moment(date_start, 'YYYY-MM-DD');
            const endDate = moment(date_end, 'YYYY-MM-DD').add(1, 'day');
            const differenceInMonths = endDate.diff(startDate, 'months');
            let difer = 0;
            if (differenceInMonths === 0) {
                difer = 1;
            } else {
                difer = differenceInMonths;
            }
            let query = countDateBookings(startDate, endDate, user._id.toString());
            console.log(difer)
            await calculateBookingProjection(query, difer-1, 1, res); 
        }
      
    } catch (err) {
        next(err)
    }
}