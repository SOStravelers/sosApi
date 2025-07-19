import Notification from "./model.js";
import { createError } from "../../config/error.js";
import languageData from "../../languages/notification.js";

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
