import Booking from "./model.js";
import User from "../../apiServices/users/model.js";
import NoUser from "../../apiServices/nousers/model.js";
import Subservice from "../../apiServices/subservices/model.js";
import Currency from "../currencies/model.js";
import Payment from "../payments/model.js";
import { createError } from "../../config/error.js";
import * as STRIPE_SERVICE from "../../services/stripe.js";
import * as NOTIFICATION_DAO from "../notifications/dao.js";
import * as SENDEMAIL_SERVICE from "../../services/emails/personal.js";
import { createTokenSimple } from "../../middleware/auth.js";
import { sendEmailPaymentConfirmation } from "../../services/aws_ses.js";
import { DateTime } from "luxon";

const populate = [
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
    path: "serviceId",
    select: "name isActive coverImg",
  },
  {
    path: "subserviceId",
    select: "name isActive duration details imgUrl",
  },
  {
    path: "clientUserId",
    select: "personalData img, email",
  },
  {
    path: "currency",
    select: "name code ",
  },
];
const optionsCurrency = ["usd", "brl", "eur"];
const optionsLanguage = ["es", "en", "pt", "fr", "de"];
//Crear booking
export const createBooking = async (data, user) => {
  logger.info("*** CREATE NEW BOOKING DAO ***");
  try {
    const subservice = await Subservice.findById(data.subservice).populate(
      "service"
    );
    console.log;
    if (!subservice) throw createError(404, "Subservice not found");
    console.log("idUser", data.clientId);

    let clientUser = null;
    if (user) {
      clientUser = user;
    } else {
      const newUser = await User.findOne({
        email: data.clientData.email,
      });
      if (newUser) {
        clientUser = newUser;
      }
    }

    const newData = {
      clientUserId: clientUser?._id ? clientUser._id : null,
      clientEmail: data.clientData.email, //data.
      clientData: data.clientData,
      startTime: data.startTime,
      subserviceId: subservice._id,
      subserviceData: {
        name: subservice.name,
      },
      serviceId: subservice.service._id,
      serviceData: {
        name: subservice.service.name,
      },
      imgUrl: subservice.imgUrl,
      videoUrl: subservice.videoUrl,
      duration: subservice.duration,
      country: subservice.country,
      typeService: subservice.typeService,
    };

    if (!optionsCurrency.includes(data.currency))
      throw createError(400, "Invalid currency");
    const currency = await Currency.findOne({ code: data.currency });
    newData.currency = currency._id;

    const percentage = 0.1;
    const netAmount = data.amount / (1 + percentage);
    const taxes = netAmount * percentage;

    newData.price = {
      netAmount: netAmount.toFixed(2),
      taxes: taxes.toFixed(2),
      percentage: percentage * 100,
      grossAmount: data.amount,
    };

    if (subservice.typeService == "tour") {
      console.log("caso 1");
      newData.tourData = data.selectedData;
    } else {
      console.log("caso 1");
      newData.categories = data.selectedData;
    }
    if (subservice.eventData) {
      console.log("caso 3");
      newData.eventData = data.eventData;
    }

    if (subservice.service._id.toString() == "67c11c4917c3a7a2c353cb1b") {
      //partidos de futbol
      newData.status = "confirmed";
    }

    let booking = new Booking(newData);

    console.log("la ID payment Intent", data.paymentIntent);

    await Payment.findOneAndUpdate(
      { transactionId: data.paymentIntent },
      {
        $set: {
          bookingId: booking._id,
        },
      },
      { new: true } // opcional: devuelve el documento actualizado
    );
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
    console.log("el booking creado", theBooking._id);
    //creando notificaciones:

    const emailData = clientUser?.email || data.clientData.email;
    // sendEmailPaymentConfirmation(emailData);

    if (data.intentType == "payment") {
      STRIPE_SERVICE.addIdBookingtoPI(
        data?.paymentIntent,
        theBooking?._id.toString(),
        theBooking?.idKey
      );
    }
    if (clientUser) {
      NOTIFICATION_DAO.newBookingNotification(theBooking, clientUser._id);

      if (!optionsLanguage.includes(data.language))
        throw createError(400, "Invalid language");
    }

    if (subservice.service._id.toString() == "67c11c4917c3a7a2c353cb1b") {
      SENDEMAIL_SERVICE.resendConfirmPersonal(
        {
          imgUrl: subservice.imgUrl,
          email: data.clientData.email,
          nameClient: data.clientData.name,
          subserviceName: subservice.name[data.language],
          serviceName: subservice.service.name[data.language],
        },
        data.language
      );
    }

    return createTokenSimple({ id: theBooking._id.toString() });
  } catch (err) {
    throw err;
  }
};

export const setAllBookings = async (user) => {
  logger.info("*** SET ALL BOOKING DAO ***");
  try {
    const bookings = await Booking.updateMany(
      { clientEmail: user.email, clientUser: null },
      {
        $set: {
          clientUser: user._id,
        },
      },
      { new: true }
    );
    const noUser = await NoUser.findOneAndDelete({ email: user.email });
    return "success";
  } catch (err) {
    throw err;
  }
};

export const getByToken = async (id) => {
  logger.info("*** SET ALL BOOKING DAO ***");
  try {
    const booking = await Booking.findOne({ _id: id })
      .populate(populate)
      .exec();

    return booking;
  } catch (err) {
    throw err;
  }
};

export const getBookingsByRange = async (
  {
    isoTime,
    timeZone,
    range = "month",
    month, // { year: 2025, month: 7 }
    day, // { year: 2025, month: 7, day: 29 }
    status,
  },
  user = null
) => {
  try {
    if (!isoTime || !timeZone) {
      throw new Error("Faltan isoTime o timeZone");
    }

    // Determinar la fecha base
    let userDate;

    if (range === "day" && day?.year && day?.month && day?.day) {
      userDate = DateTime.fromObject(
        { year: day.year, month: day.month, day: day.day },
        { zone: timeZone }
      );
    } else if (range === "month" && month?.year && month?.month) {
      userDate = DateTime.fromObject(
        { year: month.year, month: month.month, day: 1 },
        { zone: timeZone }
      );
    } else {
      userDate = DateTime.fromISO(isoTime, { zone: timeZone });
    }

    // Rango de fechas
    let start, end;
    switch (range) {
      case "day":
        start = userDate.startOf("day").toUTC().toISO();
        end = userDate.endOf("day").toUTC().toISO();
        break;
      case "week":
        start = userDate.startOf("week").toUTC().toISO();
        end = userDate.endOf("week").toUTC().toISO();
        break;
      case "month":
      default:
        start = userDate.startOf("month").toUTC().toISO();
        end = userDate.endOf("month").toUTC().toISO();
        break;
    }

    // Construir query
    const query = {
      "startTime.isoTime": { $gte: start, $lte: end },
    };

    if (user?._id) {
      query.clientUserId = user._id;
    }

    if (status) {
      query.status = Array.isArray(status) ? { $in: status } : status;
    }

    console.log("Bookings query:", query);

    const bookings = await Booking.find(query);
    return bookings;
  } catch (err) {
    console.error("Error en getBookingsByRange:", err);
    throw err;
  }
};
