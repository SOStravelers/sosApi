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
import { generarCodigoUnicoOrdenCompra } from "../../helpers/bookings/ids.js";
import { formatRangeFromISO } from "../../utils/time.js";
import mongoose from "mongoose";
import { isBeforeHoursThreshold } from "../../utils/time.js";
import path from "path";

const populate = [
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
    select: "name code timeZone",
  },
  {
    path: "providerId",
  },
];
const optionsCurrency = ["usd", "brl", "eur"];
const optionsLanguage = ["es", "en", "pt", "fr", "de"];
//Crear booking
export const createBooking = async (data, user) => {
  logger.info("*** CREATE NEW BOOKING DAO ***");
  try {
    const subservice = await Subservice.findById(data.subservice).populate(
      "service country"
    );
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
      canCancel: subservice.canCancel,
      timeUntilCancel: subservice.timeUntilCancel,
      paymentStatus: "unpaid",
    };
    subservice.canCancel && subservice.timeUntilCancel
      ? (newData.timeUntilCancel = subservice.timeUntilCancel)
      : null;

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
    } else {
      newData.status = "requested";
    }
    subservice.provider
      ? (newData.providerId = subservice.provider)
      : (newData.providerId = "688f788e1a76f55812780b2a"); //si no hay se setea la de sos Travel

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

    const purchaseOrderNumber = await generarCodigoUnicoOrdenCompra();
    booking.purchaseOrder = purchaseOrderNumber;

    const newBooking = await booking.save();

    const theBooking = await Booking.findOne({ _id: newBooking._id })
      .populate(populate)
      .exec();

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
    const token = createTokenSimple({ id: theBooking._id.toString() });
    console.log("subservice", subservice.country);
    const timeService = formatRangeFromISO({
      isoTime: data.startTime.isoTime,
      language: data.language,
      timeZone: subservice.country.timeZone,
      duration: subservice.duration,
    });

    SENDEMAIL_SERVICE.resendConfirmPersonal(
      {
        imgUrl: subservice.imgUrl,
        email: data.clientData.email,
        nameClient: data.clientData.name,
        subserviceName: subservice.name[data.language],
        serviceName: subservice.service.name[data.language],
        numberOrder: purchaseOrderNumber,
        startService: timeService.start,
        endService: timeService.end,
        bookingLink:
          process.env.URL_FRONTEND +
          "/booking-link/" +
          token +
          "?lang=" +
          data.language,
      },
      data.language
    );
    return token;
  } catch (err) {
    throw err;
  }
};
//Funcion importante que permite asignar todos los booking a un nuevo usuario registrado
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
//Obtiene info del booking por token para mostrar post compra
export const getByToken = async (id) => {
  logger.info("*** GET ALL DATA BOOKING DAO ***");
  try {
    const booking = await Booking.findOne({ _id: id })
      .populate(populate)
      .exec();

    return booking;
  } catch (err) {
    throw err;
  }
};
//Obtienes info de id,foto y name del booking por token
export const getByTokenMin = async (id) => {
  logger.info("*** SET MIN DATA BOOKING DAO ***");
  try {
    const booking = await Booking.findOne({ _id: id })
      .select("imgUrl name")
      .exec();

    return booking;
  } catch (err) {
    throw err;
  }
};
//Obtienes toda la info booking por usuario registrado
export const getMyBooking = async (id, user) => {
  logger.info("*** GET USER BOOKING DAO ***");
  try {
    console.log("la idd", id);
    const booking = await Booking.findById(id).populate(populate).exec();
    console.log("userBooking", booking.clientUserId);
    if (booking.clientUserId._id.toString() != user._id.toString())
      throw createError(401, "Unauthorized");
    return booking;
  } catch (err) {
    throw err;
  }
};
//Obtiene todos los booking de un usuario con multiples filtros

export const getBookingsByRange = async (
  {
    isoTime,
    timeZone,
    range = "month",
    month,
    day,
    start,
    end,
    status,
    typeRequest,
    service, // <-- nuevo campo
  },
  user = null
) => {
  try {
    if (!isoTime || !timeZone) {
      throw new Error("Faltan isoTime o timeZone");
    }

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

    let startDate, endDate;

    if (range === "custom" && start && end) {
      startDate = DateTime.fromISO(start).toFormat("yyyy-MM-dd'T'HH:mm:ss");
      endDate = DateTime.fromISO(end).toFormat("yyyy-MM-dd'T'HH:mm:ss");
    } else {
      switch (range) {
        case "day":
          startDate = userDate.startOf("day").toFormat("yyyy-MM-dd'T'HH:mm:ss");
          endDate = userDate.endOf("day").toFormat("yyyy-MM-dd'T'HH:mm:ss");
          break;
        case "week":
          startDate = userDate
            .startOf("week")
            .toFormat("yyyy-MM-dd'T'HH:mm:ss");
          endDate = userDate.endOf("week").toFormat("yyyy-MM-dd'T'HH:mm:ss");
          break;
        case "month":
        default:
          startDate = userDate
            .startOf("month")
            .toFormat("yyyy-MM-dd'T'HH:mm:ss");
          endDate = userDate.endOf("month").toFormat("yyyy-MM-dd'T'HH:mm:ss");
          break;
      }
    }

    const statusFilter =
      status !== undefined
        ? Array.isArray(status)
          ? { $in: status }
          : status
        : { $in: ["confirmed", "requested"] };

    const matchConditions = {
      localStartTime: { $gte: startDate, $lte: endDate },
      ...(user?._id && { clientUserId: user._id }),
      status: statusFilter,
    };

    // Validar que service es un ObjectId válido
    if (service && mongoose.Types.ObjectId.isValid(service)) {
      matchConditions.serviceId = new mongoose.Types.ObjectId(service);
    }

    const basePipeline = [
      {
        $lookup: {
          from: "countries",
          localField: "country",
          foreignField: "_id",
          as: "countryData",
        },
      },
      { $unwind: "$countryData" },
      {
        $addFields: {
          localStartTime: {
            $dateToString: {
              date: "$startTime.isoTime",
              timezone: "$countryData.timeZone",
              format: "%Y-%m-%dT%H:%M:%S",
            },
          },
        },
      },
      {
        $match: matchConditions,
      },
    ];

    if (typeRequest !== "admin") {
      return await Booking.aggregate(basePipeline);
    }

    const adminLookups = [
      {
        $lookup: {
          from: "users",
          localField: "clientUserId",
          foreignField: "_id",
          as: "clientUser",
        },
      },
      {
        $unwind: {
          path: "$clientUser",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "services",
          localField: "serviceId",
          foreignField: "_id",
          as: "service",
        },
      },
      {
        $unwind: {
          path: "$service",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "subservices",
          localField: "subserviceId",
          foreignField: "_id",
          as: "subservice",
        },
      },
      {
        $unwind: {
          path: "$subservice",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "currencies",
          localField: "currency",
          foreignField: "_id",
          as: "currencyData",
        },
      },
      {
        $unwind: {
          path: "$currencyData",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "workerUser",
          foreignField: "_id",
          as: "workerUser",
        },
      },
      {
        $unwind: {
          path: "$workerUser",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "services",
          localField: "workerUser.workerData.services.id",
          foreignField: "_id",
          as: "workerUserServices",
        },
      },
    ];

    const fullPipeline = [...basePipeline, ...adminLookups];
    return await Booking.aggregate(fullPipeline);
  } catch (err) {
    console.error("Error en getBookingsByRange (AGGREGATE):", err);
    throw err;
  }
};
//Obtienes info del proximo booking en fecha mas cercana
export const getNextBooking = async (user = null) => {
  logger.info("*** NEXT BOOKING DAO ***");
  console.log("user", user);

  try {
    const nowUtc = DateTime.utc().toFormat("yyyy-MM-dd'T'HH:mm:ss");

    const pipeline = [
      {
        $lookup: {
          from: "countries",
          localField: "country",
          foreignField: "_id",
          as: "countryData",
        },
      },
      {
        $unwind: "$countryData",
      },
      {
        $addFields: {
          localStartTime: {
            $dateToString: {
              date: "$startTime.isoTime",
              timezone: "$countryData.timeZone",
              format: "%Y-%m-%dT%H:%M:%S",
            },
          },
        },
      },
      {
        $match: {
          localStartTime: { $gte: nowUtc },
          ...(user?._id && { clientUserId: user._id }),
          status: { $in: ["confirmed", "requested"] },
        },
      },
      {
        $sort: {
          localStartTime: 1,
        },
      },
      {
        $limit: 1,
      },
    ];

    console.log("pipeline", JSON.stringify(pipeline, null, 2));

    const result = await Booking.aggregate(pipeline).populate(populate);
    console.log("resultadosss", result);

    return result[0] || null;
  } catch (err) {
    console.error("Error en getNextBooking:", err);
    throw err;
  }
};
//Confirmar booking
export const confirmBooking = async (id) => {
  logger.info("*** CONFIRM BOOKING DAO ***");
  try {
    const booking = await Booking.findById(id);
    if (!booking) throw createError(404, "Booking not found");
    console.log("el booking", booking.status);
    if (booking.status != "requested") throw createError(400, "Invalid status");
    booking.status = "confirmed";
    booking.save();
    return booking;
  } catch (err) {
    throw err;
  }
};
//Completar booking
export const completeBooking = async (id) => {
  logger.info("*** COMPLETE BOOKING DAO ***");
  try {
    const booking = await Booking.findById(id);
    if (!booking) throw createError(404, "Booking not found");
    if (!booking.status !== "confirmed")
      throw createError(400, "Invalid status");
    booking.status = "confirmed";
    booking.save();
    return booking;
  } catch (err) {
    throw err;
  }
};

//Cancelar booking
export const cancelBooking = async (id) => {
  logger.info("*** CANCEL BOOKING DAO ***");
  try {
    const booking = await Booking.findById(id);
    if (!booking) throw createError(404, "Booking not found");
    console.log("paymentstatus", booking.paymentStatus);
    if (booking.paymentStatus != "unpaid")
      throw createError(400, "Invalid payment status");
    booking.status = "canceled";
    booking.save();
    return booking;
  } catch (err) {
    throw err;
  }
};
//Cancelar booking del usuario
export const cancelBookingUser = async (id, user) => {
  logger.info("*** CANCEL USER BOOKING DAO ***");
  try {
    const booking = await Booking.findById(id);
    if (!booking) throw createError(404, "Booking not found");
    if (booking.paymentStatus != "unpaid")
      throw createError(400, "Invalid payment status");
    if (booking.clientUserId != user._id)
      throw createError(401, "Unauthorized");
    const timeUntilCancel = booking.timeUntilCancel || 0;
    if (!isBeforeHoursThreshold(booking.startTime.isoTime, timeUntilCancel))
      throw createError(400, "Invalid time");
    booking.status = "cancelled";
    booking.save();
    return booking;
  } catch (err) {
    throw err;
  }
};
