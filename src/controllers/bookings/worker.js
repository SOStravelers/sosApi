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

import { 
  awsCompletedWorker, 
  awsUpdateTemplate 
} from "../../services/emails/worker.js";

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
      status: {
        $in: [
          "canceled",
          "completed",
          "failed",
          "confirmed",
          "requested",
          "available",
        ],
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
    let query = countWeekBookings(
      "workerUser",
      user._id.toString(),
      startWeek,
      endWeek
    );
    query[0].$match.status = {
      $in: [
        "canceled",
        "completed",
        "requested",
        "failed",
        "confirmed",
        "available",
      ],
    };
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
      status: { $in: ["requested", "confirmed", "available"] },
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
      status: {
        $in: [
          "canceled",
          "completed",
          "requested",
          "failed",
          "confirmed",
          "available",
        ],
      },
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
    const userServices = user.workerData.services.map((service) => service.id);
    const query = {
      status: "available",
      service: { $in: userServices },
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
      // await cancelPaymentIntent(booking.payment.paymentId);
      const newBooking = await Booking.findOneAndUpdate(
        {
          _id: bookingId,
        },
        {
          status: "available",
          canceledData: canceledData,
          // payment: {
          //   ...booking.payment,
          //   status: "canceled",
          // },
        },
        {
          new: true,
        }
      ).populate(populate);
      // cancelBookingNotification(newBooking);
      return res.status(200).json(newBooking);
    }
  } catch (err) {
    next(err);
  }
};

//Crear booking por el worker by cash
export const createBookingWorker = async (req, res, next) => {
  global.logger.info("---CREATE NEW  BOOKING WORKER---");
  try {
    const bookingData = req.body;
    let booking = new Booking(bookingData);
    booking.firstWorker = booking.workerUser;
    booking.creatorUser = req.user._id.toString();
    booking.workerUser = req.user._id.toString();

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
    booking.status = "completed";
    booking.payment.status = "paid";
    booking.payment.method = "cash";

    if (!req.body.clientName && req.body.clientEmail) {
      throw createError(400, "clientName and clientEmail is required");
    }
    console.log("el user1", req.body.clientEmail);
    const user = await User.findOne({ email: req.body.clientEmail }).exec();
    console.log("el user", user);
    if (user) {
      console.log("hay user");
      booking.clientUser = user._id;
    } else {
      console.log("no hay user");
      // necesito una variable que sea un array que separe el nombre en dos la primera palabra y el resto y elimine los espacios alfinal y el principio
      const name = req.body.clientName.split(" ");
      const firstName = name[0];
      const lastName = name[1];
      const clientUser = new User({
        email: req.body.clientEmail,
        personalData: {
          name: {
            first: firstName,
            last: lastName,
          },
        },
        username: Math.random().toString(36).substring(2, 12),
      });
      await clientUser.save();
      booking.clientUser = clientUser._id;
    }

    const newBooking = await booking.save();
    const theBooking = await Booking.findOne({ _id: newBooking._id })
      .populate(populate)
      .exec();

    //creando notificaciones:
    //notification User and Worker
    // newBookingNotification(theBooking);

    // if (emailData) sendEmailPaymentConfirmation(emailData);
    res.status(201).json({ booking: theBooking, msg: "new Document" });
  } catch (err) {
    next(err);
  }
};

export const updateTemplateWorker = async (req, res, next) => {
  try {
    const {type, subject}  = req.query;
    if(type === 'completed'){
       awsUpdateTemplate({
        template:'completedBookingWorker', 
        subject: subject
      });
       res.status(201).json({msg: "the worker template was updated"});
    }else if(type === 'cancel'){
      awsUpdateTemplate('canceldBookingWorker', subject);
      res.status(201).json({msg: "the worker template was updated"});
    }else if(type === 'confirmed'){
      awsUpdateTemplate('confirmedBookingWorker', subject);
      res.status(201).json({msg: "the worker template was updated"});
    }else if(type === 'availability'){
      awsUpdateTemplate('availabilityBookingWorker', subject);
      res.status(201).json({msg: "the worker template was updated"});
    }
  } catch (error) {
    console.log(error);
  }
  

}