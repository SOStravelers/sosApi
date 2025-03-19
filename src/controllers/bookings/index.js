import { createError } from "../../config/error.js";
import Booking from "../../models/booking.js";
import User from "../../models/user.js";
import { byPassPolMauro } from "../../utils/changeId.js";
import {
  newBookingNotification,
  confirmBookingNotification,
} from "../../services/notification.js";
import {
  resendCompletedPersonal,
  resendConfirmPersonal,
} from "../../services/emails/personal.js";
import {
  awsCompletedWorker,
  awsConfirmWorker,
} from "../../services/emails/worker.js";
import { sendEmailPaymentConfirmation } from "../../services/aws_ses.js";
import {
  capturePaymentIntent,
  addIdBookingtoPI,
} from "../../services/stripe.js";
import moment from "moment-timezone";
import Subservice from "../../models/subservice.js";

const populate = [
  {
    path: "businessUser",
    select: "businessData personalData img",
  },
  {
    path: "workerUser",
    select: "workerData personalData img email",
    populate: {
      path: "workerData.services.id", //details
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
    select: "name isActive coverImg duration details imgUrl",
  },
  {
    path: "clientUser",
    select: "personalData img, email",
  },
];

//Crear booking
export const create = async (req, res, next) => {
  global.logger.info("---CREATE NEW BOOKING---");
  try {
    const emailData = req.body.emailData;
    const language = req.body.language;
    const phoneNumber = req.body.phoneNumber;
    let bookingData = req.body;
    bookingData.emailData = null;

    console.log("el booking1", bookingData);
    bookingData = byPassPolMauro(bookingData);
    console.log("el booking3", bookingData);
    const subService = await Subservice.findById(req.body.subservice);
    const multiple = subService.multiple;
    let booking = new Booking(bookingData);
    console.log("el booking2", booking);
    booking.firstWorker = booking.workerUser;
    let query = {};
    if (!subService.multiple) {
      query = {
        $and: [
          {
            businessUser: booking.businessUser,
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
    }
    let exists = await Booking.findOne(query, {}).exec();
    console.log(
      "wena wena wena",
      exists,
      subService.multiple,
      exists && !subService.multiple
    );
    if (exists && !subService.multiple) {
      throw createError(409, "booking already exists");
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
      booking.multiple ? (booking.status = "confirmed") : "";
      booking.clientNumber = phoneNumber;
      const newBooking = await booking.save();
      const theBooking = await Booking.findOne({ _id: newBooking._id })
        .populate(populate)
        .exec();
      console.log("el booking creado", theBooking._id);
      //creando notificaciones:

      if (emailData) sendEmailPaymentConfirmation(emailData);
      const brazilTime = moment().tz("America/Sao_Paulo");
      if (booking.multiple) {
        const completedData = {
          canceledBy: req.user._id.toString(),
          canceledAtUTC: brazilTime,
          timeZone: "America/Sao_Paulo",
          previusStatus: booking.status,
        };

        addIdBookingtoPI(
          booking?.payment?.paymentId,
          booking?._id.toString(),
          booking?.idKey
        );

        // const newBooking = await capturePaymentIntent(
        //   booking,
        //   1, // percentage
        //   "confirmed", // statusBooking
        //   null, // canceledData,
        //   completedData // completedData
        // );
      }

      if (booking.multiple) {
        const worker = await User.findById(booking.workerUser);

        const finalPrice = newBooking?.payment.partner
          ? (newBooking?.payment.price * 0.8).toFixed(2)
          : (newBooking?.payment.price * 0.9).toFixed(2);
        confirmBookingNotification(theBooking, multiple, language);
        console.log("el cliente", req.user);
        resendConfirmPersonal({
          email: theBooking.clientUser.email,
          // email: "jschacosta@gmail.com",
          name: theBooking.clientUser.personalData.name.first,
          emailWorker: worker.email,
          workerName:
            worker?.personalData?.name?.first +
            " " +
            worker?.personalData?.name?.last,
          clientName:
            req.user?.personalData?.name?.first +
            " " +
            req.user?.personalData?.name?.last,
          workerPhone: worker?.workerData?.phone,
          service: theBooking.service.name[language],
          clientsNumber: theBooking.clientsNumber,
          priceUnitService: theBooking.priceUnitService,
          subservice: theBooking.subservice.name[language],
          language: language,
          date: theBooking.date.stringData,
          startTime: theBooking.startTime.stringData,
          price: theBooking.payment.price,
          priceBRL: newBooking.payment.priceBRL,
          finalPrice: finalPrice,
        });
        resendConfirmPersonal({
          isWorker: true,
          email: worker.email,
          // email: "jschacosta@gmail.com",
          name:
            worker.personalData.name.first +
            " " +
            worker.personalData.name.last,
          // emailWorker: worker.email,
          emailWorker: "jschacosta@gmail.com",
          workerName:
            worker?.personalData?.name?.first +
            " " +
            worker?.personalData?.name?.last,
          clientName:
            req.user?.personalData?.name?.first +
            " " +
            req.user?.personalData?.name?.last,
          workerPhone: worker?.workerData?.phone,
          clientPhone: theBooking.clientPhone,
          service: theBooking.service.name[language],
          subservice: theBooking.subservice.name[language],
          clientsNumber: theBooking.clientsNumber,
          priceUnitService: theBooking.priceUnitService,
          price: theBooking.payment.price,
          language: language,
          date: theBooking.date.stringData,
          startTime: theBooking.startTime.stringData,
          priceBRL: newBooking.payment.priceBRL,
          finalPrice: finalPrice,
        });
        // awsConfirmWorker({
        //   email: theBooking.workerUser.email,
        //   name: theBooking.workerUser.personalData.name.first,
        //   service: theBooking.service.name,
        //   subservice: theBooking.subservice.name,
        //   language: language,
        // });
      } else {
        //notification User and Worker
        newBookingNotification(theBooking, multiple);
        resendCompletedPersonal({
          email: theBooking.clientUser.email,
          name: theBooking.clientUser.personalData.name.first,
          service: theBooking.service.name,
          subservice: theBooking.subservice.name,
          language: language,
        });
        // awsCompletedWorker({
        //   email: theBooking.workerUser.email,
        //   name: theBooking.workerUser.personalData.name.first,
        //   service: theBooking.service.name,
        //   subservice: theBooking.subservice.name,
        //   language: language,
        // });
      }
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
