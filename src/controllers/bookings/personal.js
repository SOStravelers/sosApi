import moment from "moment-timezone";
import Booking from "../../models/booking.js";
import User from "../../models/user.js";
import { createError } from "../../config/error.js";
import {
  optionsBooking,
  validateFormatDate,
  countWeekBookings,
  daysOfweek,
} from "./helper.js";

import {
  cancelPaymentIntent,
  capturePaymentIntent,
  refund,
} from "../../services/stripe.js";

import {
  cancelBookingNotification,
  completeBookingNotification,
} from "../../services/notification.js";

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
        $gte: moment(date, "YYYY-MM-DD").startOf("month"),
        $lte: moment(date, "YYYY-MM-DD").endOf("month"),
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
    const { date } = req.query;
    validateFormatDate(date);
    const dateMoment = moment(date, "YYYY-MM-DD")
      .add(7, "day")
      .format("YYYY-MM-DD");
    const startWeek = moment.utc(date).format();
    const endWeek = moment.utc(dateMoment).format();
    const query = countWeekBookings(
      "clientUser",
      user._id.toString(),
      startWeek,
      endWeek
    );
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
    const dateMoment = moment(date, "YYYY-MM-DD")
      .subtract(1, "day")
      .format("YYYY-MM-DD");
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
    const dateMoment = moment(date, "YYYY-MM-DD")
      .add(1, "day")
      .format("YYYY-MM-DD");
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

//------------------CLIENT BOOKING STATUS---------------------------
export const cancelBookingUser = async (req, res, next) => {
  global.logger.info("---CANCEL BOOKING USER---");
  try {
    const userId = req.user._id;
    const bookingId = req.params.bookingId;
    const user = await User.findOne({ _id: userId }).exec();
    const booking = await Booking.findOne({ _id: bookingId }).exec();
    if (user && user.type != "personal") throw createError(401, "Unauthorized");
    if (user && user._id.toString() != booking.clientUser)
      throw createError(401, "Unauthorized");
    if (!booking) throw createError(404, "Booking not found");
    if (
      booking.status != "confirmed" &&
      booking.status != "requested" &&
      booking.status != "available"
    )
      throw createError(400, "Booking can't be cancel");

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
        console.log("puede cancelar sin penalidad");
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
        console.log("no puede cancelar sin penalidad, 50% de penalidad");
        const newBooking = await capturePaymentIntent(
          booking,
          0.5, // percentage
          "canceled", // statusBooking
          canceledData, // canceledData
          null // completedData
        );
        console.log("el booking", newBooking);
        return res.status(200).json(newBooking);
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
export const completeBookingUser = async (req, res, next) => {
  global.logger.info("---COMPLETE BOOKING USER---");
  try {
    const userId = req.user._id;
    const bookingId = req.params.bookingId;
    console.log(userId, bookingId);
    const user = await User.findOne({ _id: userId }).exec();
    const booking = await Booking.findOne({ _id: bookingId }).exec();
    if (user && user.type != "personal") throw createError(401, "Unauthorized");
    if (user && user._id.toString() != booking.clientUser)
      throw createError(401, "Unauthorized");
    if (!booking) throw createError(404, "Booking not found");
    if (booking.status != "confirmed") {
      throw createError(400, "Booking can't be completed");
    }
    const completedData = {
      canceledBy: userId,
      canceledAtUTC: brazilTime,
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
