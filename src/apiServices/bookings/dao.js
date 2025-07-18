import Booking from "./model.js";
import User from "../../apiServices/users/model.js";
import Subservice from "../../apiServices/subservices/model.js";
import { createError } from "../../config/error.js";
import { addIdBookingtoPI } from "../../services/stripe.js";
import moment from "moment-timezone";
import {
  newBookingNotification,
  confirmBookingNotification,
} from "../../services/notification.js";

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
export const create = async (data, user) => {
  global.logger.info("*** CREATE NEW BOOKING DAO ***");
  try {
    const emailData = req.body.emailData;
    const language = req.body.language;
    let bookingData = req.body;
    bookingData.emailData = null;
    console.log("telefono 1", req.body.clientPhone);
    console.log("el booking1", bookingData);
    console.log("el booking3", bookingData);
    const subService = await Subservice.findById(req.body.subservice);
    const multiple = subService.multiple;
    let booking = new Booking(bookingData);

    if (subService.partner) {
      booking.workerUser = subService.partner;
    }

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
      const newBooking = await booking.save();
      await User.findByIdAndUpdate(
        req.user._id.toString(),
        {
          phone: newBooking.clientNumber,
        },
        { new: true }
      );

      const theBooking = await Booking.findOne({ _id: newBooking._id })
        .populate(populate)
        .exec();
      console.log("el booking creado", theBooking._id);
      //creando notificaciones:

      if (emailData) sendEmailPaymentConfirmation(emailData);
      const brazilTime = moment().tz("America/Sao_Paulo");
      if (booking.multiple) {
        const completedData = {
          canceledBy: req.user._id,
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
      console.log("telefono", theBooking.clientPhone);
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
          clientNumber: theBooking.clientNumber,
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
          emailWorker: worker.email,
          // emailWorker: "jschacosta@gmail.com",
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
          clientNumber: theBooking.clientNumber,
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
