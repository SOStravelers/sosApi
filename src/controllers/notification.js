import Notification from "../models/notification.js";
import User from "../models/user.js";
import webpush from "web-push";

const populateBooking = [
  {
    path: "booking",
    select: "businessUser service subservice startTime createdAt",
    populate: [
      {
        path: "businessUser.businessData",
        select: "name location",
      },
      {
        path: "service",
        select: "name",
      },
      {
        path: "subservice",
        select: "name",
      },
    ],
  },
];
export const getByUser = async (req, res, next) => {
  global.logger.info("=== GET NOTIFICATIONS BY USER ===");
  try {
    const userId = req.user._id.toString();
    const options = {
      sort: { createdAt: -1 },
      limit: req.query.limit || 10,
      page: req.query.page || 1,
      select: "title booking type body isRead to link imgUrl createdAt",
      populate: populateBooking,
    };
    console.log(options);
    const notifications = await Notification.paginate({ to: userId }, options);
    res.send(notifications);
  } catch (err) {
    next(err);
  }
};
//actualiza el campo isRead a true
export const setIsRead = async (req, res, next) => {
  global.logger.info("=== SET IS READ NOTIFICATION ===");
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );
    res.send(notification);
  } catch (err) {
    next(err);
  }
};
//funcion para saber si un usuario tiene notificaciones sin leer (is Read = false)
export const checkNotification = async (req, res) => {
  global.logger.info("=== CHECK NOTIFICATION ===");
  const userId = req.user._id.toString(); // o quizás req.user._id, dependiendo de tu configuración
  const notifications = await Notification.find({
    to: userId,
    isRead: false,
  }).exec();
  const result = notifications.length > 0;
  return res.send(result);
};

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
