import Notification from "./model.js";
import { createError } from "../../config/error.js";
import languageData from "../../languages/notification.js";
import webpush from "web-push";
// const populateBooking = [
//   {
//     path: "booking",
//     select: "businessUser service subservice startTime createdAt",
//     populate: [
//       {
//         path: "businessUser.businessData",
//         select: "name location",
//       },
//       {
//         path: "service",
//         select: "name",
//       },
//       {
//         path: "subservice",
//         select: "name",
//       },
//     ],
//   },
// ];
//Crea nueva notificacion
export const newBookingNotification = async (booking, idUser) => {
  logger.info("*** NEW BOOKING NOTIFICATION DAO ***");
  try {
    if (!booking) createError(400, "Booking not found");
    let bodyClient = null;
    if (booking.typeService == "tour") {
      bodyClient = booking.subserviceData.name;
    } else {
      if (booking.eventData) {
        bodyClient = booking.eventData.name;
      } else {
        bodyClient = booking.subserviceData.name;
      }
    }

    const notificationClient = new Notification({
      title: languageData.booking.newBooking.title,
      body: bodyClient,
      to: [idUser.toString()],
      type: "booking",
      booking: booking._id,
      imgUrl: booking.imgUrl,
      link: "/service-details/" + booking.serviceId._id + "/",
    });
    notificationClient.save();
  } catch (err) {
    throw err;
  }
};
//obtiene todas las notificaiones del usuario
export const getByUser = async (data, userId) => {
  logger.info("*** GET BY USER NOTIFICATION ***");
  try {
    const options = {
      sort: { createdAt: -1 },
      limit: data.limit || 10,
      page: data.page || 1,
      select: "title booking type body isRead to link imgUrl createdAt",
      // populate: populateBooking,
    };
    console.log(options);
    const notifications = await Notification.paginate({ to: userId }, options);
    return notifications;
  } catch (err) {
    throw err;
  }
};
//actualiza el campo isRead a true
export const setIsRead = async (id) => {
  logger.info("*** SET IS READ NOTIFICATION ***");
  try {
    const notification = await Notification.findByIdAndUpdate(
      id,
      { isRead: true },
      { new: true }
    );
    return notification;
  } catch (err) {
    throw err;
  }
};
//funcion para saber si un usuario tiene notificaciones sin leer (is Read = false)
export const checkNotification = async (userId) => {
  logger.info("*** CHECK NOTIFICATION DAO ***");
  try {
    const notifications = await Notification.find({
      to: userId,
      isRead: false,
    }).exec();
    const result = notifications.length > 0;
    return result;
  } catch (err) {
    throw err;
  }
};

//---------------------------web socket

export const getPublicKey = async (req, res) => {
  global.logger.info("=== GET PUBLIC KEY ===");
  const publicKey = process.env.PUBLIC_KEY;
  return res.status(200).send({ publicKey });
};

export const sendExampleNotification = async (req, res) => {
  global.logger.info("=== SEND EXAMPLE NOTIFICATION ===");
  console.log(process.env.NODE_ENV);
  const subscription = req.body;
  const vapidKeys = {
    publicKey: process.env.PUBLIC_KEY,
    privateKey: process.env.PRIVATE_KEY,
  };

  webpush.setVapidDetails(
    "mailto:info@sostvl.com",
    vapidKeys.publicKey,
    vapidKeys.privateKey
  );

  const notificationPayload = {
    notification: {
      title: "New Notification",
      body: "Notificacion de prueba",
      // icon: 'icon.png'
    },
  };
  webpush
    .sendNotification(subscription, JSON.stringify(notificationPayload))
    .catch((err) => console.error("Error sending notification, reason: ", err));
  console.log("hola", webpush, notificationPayload, subscription);
};
