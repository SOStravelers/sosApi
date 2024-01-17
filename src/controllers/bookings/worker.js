import moment from "moment-timezone";
import Booking from "../../models/booking.js";
import User from "../../models/user.js";
import {
  optionsBooking,
  validateFormatDate,
  countWeekBookings,
  daysOfweek,
} from "./helper.js";
import { createError } from "../../config/error.js";

import {
  cancelPaymentIntent,
  capturePaymentIntent,
  refund,
} from "../../services/stripe.js";

import {
  cancelBookingNotification,
  completeBookingNotification,
  confirmBookingNotification,
} from "../../services/notification.js";

const populate = [
  {
    path: "businessUser",
    select: "businessData personalData img",
  },
  {
    path: "workerUser",
    select: "workerData personalData img",
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
    select: "personalData img",
  },
];

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
      status: { $in: ["requested", "confirmed"] },
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
    let query = countWeekBookings(
      "workerUser",
      user._id.toString(),
      startWeek,
      endWeek
    );
    const result = await Booking.aggregate(query);
    if (!result) throw createError(404, "Worker week booking not found ");
    const response = daysOfweek(result, startWeek);
    res.status(200).json(response);
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
      .add(7, "day")
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
      status: { $in: ["requested", "confirmed"] },
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
      status: { $in: ["requested", "confirmed"] },
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

export const availableBookings = async (req, res, next) => {
  global.logger.info("---AVAILABLE BOOKING WORKER---");
  try {
    const userId = req.user._id;
    const user = await User.findOne({ _id: userId }).exec();
    if (user.type != "worker") throw createError(401, "Unauthorized");
    const { page, limit } = req.query;
    let options = optionsBooking(page, limit);
    const query = {
      status: "available",
    };
    const bookings = await Booking.paginate(query, options);
    if (!bookings) throw createError(404, "Available booking not found");
    res.status(200).json(bookings);
  } catch (err) {
    next(err);
  }
};

//------------------WORKER BOOKING STATUS---------------------------
export const completeBookingWorker = async (req, res, next) => {
  global.logger.info("---COMPLETE BOOKING WORKER---");
  try {
    const userId = req.user._id;
    const bookingId = req.params.bookingId;
    console.log(userId, bookingId);
    const user = await User.findOne({ _id: userId }).exec();
    const booking = await Booking.findOne({ _id: bookingId }).exec();
    if (user && user.type != "worker") throw createError(401, "Unauthorized");
    if (user && user._id.toString() != booking.workerUser)
      throw createError(401, "Unauthorized");
    if (!booking) throw createError(404, "Booking not found");
    if (booking.status != "confirmed")
      throw createError(400, "Booking can't be completed");
    const brazilTime = moment().tz("America/Sao_Paulo");
    const completedData = {
      completedBy: userId,
      completedAtUTC: brazilTime,
      timeZone: "America/Sao_Paulo",
      previusStatus: booking.status,
    };
    const newBooking = await capturePaymentIntent(
      booking,
      1, // percentage
      "completed", // statusBooking
      null, // canceledData,
      completedData // completedData
    );
    completeBookingNotification(newBooking);
    res.status(200).json(newBooking);
  } catch (err) {
    next(err);
  }
};


export const confirmBookingWorker = async (req, res, next) => {
  global.logger.info("---CONFIRM BOOKING WORKER---");
  try {
    const userId = req.user._id;
    const bookingId = req.params.bookingId;
    console.log(userId, bookingId);
    const user = await User.findOne({ _id: userId }).exec();
    const booking = await Booking.findOne({ _id: bookingId }).exec();
    if (user && user.type != "worker") throw createError(401, "Unauthorized");
    if (user && user._id.toString() != booking.workerUser)
      throw createError(401, "Unauthorized");
    if (!booking) throw createError(404, "Booking not found");
    if (booking.status != "requested") {
      throw createError(400, "Booking can't be confirmed");
    }

    const newBooking = await Booking.findOneAndUpdate(
      {
        _id: bookingId,
      },
      { status: "confirmed" },
      {
        new: true,
      }
    ).populate(populate);
    confirmBookingNotification(newBooking);
    res.status(200).json(newBooking);
  } catch (err) {
    next(err);
  }
};
export const confirmBookingWorkerExternal = async (req, res, next) => {
  global.logger.info("---CONFIRM BOOKING WORKER EXTERNAL---");
  try {
    const userId = req.user._id;
    const bookingId = req.params.bookingId;
    console.log(userId, bookingId);
    const user = await User.findOne({ _id: userId.toString() }).exec();
    const booking = await Booking.findOne({ _id: bookingId }).exec();
    if (user && user.type != "worker") throw createError(401, "Unauthorized");
    if (!booking) throw createError(404, "Booking not found");
    if (booking.status != "available") {
      console.log(booking.status);
      throw createError(400, "Booking can't be confirmed");
    }

    const newBooking = await Booking.findOneAndUpdate(
      {
        _id: bookingId,
      },
      { status: "confirmed", wokerId: userId.toString() },
      {
        new: true,
      }
    ).populate(populate);
    confirmBookingNotification(newBooking);
    res.status(200).json(newBooking);
  } catch (err) {
    next(err);
  }
};
export const cancelBookingWorker = async (req, res, next) => {
  global.logger.info("---CANCEL BOOKING WORKER---");
  try {
    const userId = req.user._id;
    const bookingId = req.params.bookingId;
    console.log(userId, bookingId);
    const user = await User.findOne({ _id: userId }).exec();
    const booking = await Booking.findOne({ _id: bookingId }).exec();
    if (user && user.type != "worker") throw createError(401, "Unauthorized");
    if (user && user._id.toString() != booking.workerUser)
      throw createError(401, "Unauthorized");
    if (!booking) throw createError(404, "Booking not found");
    if (booking.status != "confirmed" && booking.status != "requested") {
      throw createError(400, "Booking can't be cancel");
    }

    const brazilTime = moment().tz("America/Sao_Paulo");

    var bookingSaveTime = moment(booking.startTime.isoTime).subtract(
      2,
      "hours"
    );

    const canceledData = {
      canceledBy: userId,
      canceledAtUTC: brazilTime,
      timeZone: "America/Sao_Paulo",
      previusStatus: booking.status,
    };
    if (booking.status === "confirmed") {
      console.log("cancelar el booking y el pago de un booking confirmado");
      //si la hora actual es mayor a la hora de inicio de la reserva menos 4 horas
      if (!brazilTime.isSameOrAfter(bookingSaveTime)) {
        console.log("puede cancelar sin penalidad de plata");
        await cancelPaymentIntent(booking.payment.paymentId);
        const newBooking = await Booking.findOneAndUpdate(
          {
            _id: bookingId,
          },
          {
            status: "canceled",
            canceledData: canceledData,
            payment: {
              ...booking.payment,
              status: "canceled",
            },
          },
          {
            new: true,
          }
        ).populate(populate);
        cancelBookingNotification(newBooking);
        return res.status(200).json(newBooking);
      } else {
        throw createError(400, "Booking can't be cancel");
      }
    } else {
      console.log(
        "cancelar el booking y el pago de un booking requested o available"
      );
      await cancelPaymentIntent(booking.payment.paymentId);
      const newBooking = await Booking.findOneAndUpdate(
        {
          _id: bookingId,
        },
        {
          status: "canceled",
          canceledData: canceledData,
          payment: {
            ...booking.payment,
            status: "canceled",
          },
        },
        {
          new: true,
        }
      ).populate(populate);
      cancelBookingNotification(newBooking);
      return res.status(200).json(newBooking);
    }
  } catch (err) {
    next(err);
  }
};
