import { createError } from "../../config/error.js";
import Booking from "../../models/booking.js";
import User from "../../models/user.js";
import { newBookingNotification } from "../../services/notification.js";
import { resendCompletedPersonal } from "../../services/resend/personal.js";
import { sendEmailPaymentConfirmation } from "../../services/aws_ses.js";
import moment from "moment-timezone";

const populate = [
  {
    path: "businessUser",
    select: "businessData personalData img",
  },
  {
    path: "workerUser",
    select: "workerData personalData img",
    populate: {
      path: "workerData.services.id",
      select: "name",
      model: "Service", // Asegúrate de que este es el nombre correcto de tu modelo de servicio
    },
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

//Crear booking
export const create = async (req, res, next) => {
  global.logger.info("---CREATE NEW BOOKING---");
  try {
    const emailData = req.body.emailData;
    const bookingData = req.body;
    bookingData.emailData = null;

    let booking = new Booking(bookingData);
    booking.firstWorker = booking.workerUser;
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
      const theBooking = await Booking.findOne({ _id: newBooking._id })
        .populate(populate)
        .exec();

      //creando notificaciones:
      //notification User and Worker
      newBookingNotification(theBooking);
      resendCompletedPersonal({name: req.user.username, email: req.user.email});
      if (emailData) sendEmailPaymentConfirmation(emailData);
      res.status(201).json({ booking: theBooking, msg: "new Document" });
    }
  } catch (err) {
    next(err);
  }
};
//Obtener reserva por ID
export const getById = async (req, res, next) => {
  global.logger.info("---GET BOOKING BY Id---");
  try {
    const booking = await Booking.findOne({ _id: req.params.id })
      .populate(populate)
      .exec();
    if (!booking) throw createError(404, "Booking not found");
    res.send(booking);
  } catch (err) {
    next(err);
  }
};

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
