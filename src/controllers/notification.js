import Notification from "../models/notification.js";
import User from "../models/user.js";

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
