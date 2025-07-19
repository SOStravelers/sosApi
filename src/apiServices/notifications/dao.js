import Notification from "./model.js";
import { createError } from "../../config/error.js";
import languageData from "../../languages/notification.js";

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
