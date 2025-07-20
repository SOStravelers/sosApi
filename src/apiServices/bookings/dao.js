import Booking from "./model.js";
import User from "../../apiServices/users/model.js";
import Subservice from "../../apiServices/subservices/model.js";
import Currency from "../currencies/model.js";
import Payment from "../payments/model.js";
import { createError } from "../../config/error.js";
import * as STRIPE_SERVICE from "../../services/stripe.js";
import * as NOTIFICATION_DAO from "../notifications/dao.js";

import { sendEmailPaymentConfirmation } from "../../services/aws_ses.js";

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
];
//Crear booking
export const createBooking = async (data, user) => {
  global.logger.info("*** CREATE NEW BOOKING DAO ***");
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
      startTime: data.startTime.isoTime,
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
      currency: subservice.currency,
      typeService: subservice.typeService,
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
    }
    // resendCompletedPersonal({
    //   email: theBooking.clientUser.email,
    //   name: theBooking.clientUser.personalData.name.first,
    //   service: theBooking.service.name,
    //   subservice: theBooking.subservice.name,
    //   language: language,
    // });

    // confirmBookingNotification(theBooking, multiple, language);

    // resendConfirmPersonal({
    //   email: theBooking.clientUser.email,
    //   // email: "jschacosta@gmail.com",
    //   name: theBooking.clientUser.personalData.name.first,
    //   emailWorker: worker.email,
    //   workerName:
    //     worker?.personalData?.name?.first +
    //     " " +
    //     worker?.personalData?.name?.last,
    //   clientName:
    //     req.user?.personalData?.name?.first +
    //     " " +
    //     req.user?.personalData?.name?.last,
    //   workerPhone: worker?.workerData?.phone,
    //   service: theBooking.service.name[language],
    //   clientNumber: theBooking.clientNumber,
    //   priceUnitService: theBooking.priceUnitService,
    //   subservice: theBooking.subservice.name[language],
    //   language: language,
    //   date: theBooking.date.stringData,
    //   startTime: theBooking.startTime.stringData,
    //   price: theBooking.payment.price,
    //   priceBRL: newBooking.payment.priceBRL,
    //   finalPrice: finalPrice,
    // });

    // awsCompletedWorker({
    //   email: theBooking.workerUser.email,
    //   name: theBooking.workerUser.personalData.name.first,
    //   service: theBooking.service.name,
    //   subservice: theBooking.subservice.name,
    //   language: language,
    // });

    return { booking: theBooking, msg: "new Document" };
  } catch (err) {
    throw err;
  }
};
