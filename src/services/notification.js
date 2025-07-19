import Notification from "../apiServices/notifications/model.js";
import { createError } from "../config/error.js";
import Booking from "../apiServices/bookings/model.js";
import User from "../apiServices/users/model.js";

export const newBookingNotification = async (booking, multiple) => {
  try {
    global.logger.info("---NEW BOOKING NOTIFICATION---");
    console.log("boookingsss", booking);
    const bodyClient = multiple
      ? `New reservation with : ${booking.workerUser.personalData.name.first}`
      : `New reservation at : ${booking.businessUser.businessData.name}`;
    const notificationClient = new Notification({
      title: "New booking",
      body: bodyClient,
      to: [booking.clientUser._id.toString()],
      type: "booking",
      booking: booking._id,
    });
    const bodyWorker = multiple
      ? `Nova reserva of : ${booking.clientUser.personalData.name.first}`
      : `Nova reserva of : ${booking.businessUser.businessData.name}`;
    const notificationWorker = new Notification({
      title: "Nova reserva",
      body: bodyWorker,
      to: [booking.workerUser._id.toString()],
      type: "booking",
      booking: booking._id,
    });
    notificationClient.save();
    notificationWorker.save();
  } catch (err) {
    throw err;
  }
};

// notificacion de cancelacion de reserva
export const cancelBookingNotification = async (booking) => {
  try {
    const notificationClient = new Notification({
      title: "Cancelled booking",
      body: `Your booking has been canceled at : ${booking.businessUser.businessData.name}`,
      to: [booking.clientUser._id.toString()],
      type: "booking",
      booking: booking._id,
    });
    const notificationWorker = new Notification({
      title: "Reserva cancelada",
      body: `Sua reserva foi cancelada em : ${booking.businessUser.businessData.name}`,
      to: [booking.workerUser._id.toString()],
      type: "booking",
      booking: booking._id,
    });
    notificationClient.save();
    notificationWorker.save();
  } catch (err) {
    throw err;
  }
};
//cambio
// notificacion de confirmacion de reserva
export const confirmBookingNotification = async (
  booking,
  multiple,
  language
) => {
  try {
    let notificationClient;
    let notificationWorker;

    if (multiple) {
      notificationClient = new Notification({
        title: "Confirmed booking",
        body: `Your reservation has been confirmed : ${
          booking?.subservice?.name[language] || ""
        }`,
        to: [booking.clientUser._id.toString()],
        type: "booking",
        booking: booking._id,
      });
      notificationWorker = new Notification({
        title: "Confirmed booking",
        body: `New reservation confirmed for: ${booking?.subservice?.name[language]}`,
        to: [booking.workerUser._id.toString()],
        type: "booking",
        booking: booking._id,
      });
    } else {
      notificationClient = new Notification({
        title: "Confirmed booking",
        body: `Your reservation has been confirmed at : ${
          booking?.businessUser?.businessData?.name || ""
        }`,
        to: [booking.clientUser._id.toString()],
        type: "booking",
        booking: booking._id,
      });
      notificationWorker = new Notification({
        title: "Reserva confirmada",
        body: `Sua reserva foi confirmada em: ${booking.businessUser.businessData.name}`,
        to: [booking.workerUser._id.toString()],
        type: "booking",
        booking: booking._id,
      });
    }
    notificationClient.save();
    notificationWorker.save();
  } catch (err) {
    throw err;
  }
};

// notificacion de completar reserva
export const completeBookingNotification = async (booking) => {
  try {
    const notificationClient = new Notification({
      title: "Completed booking",
      body: `Your reservation has been completed at : ${booking.businessUser.businessData.name}`,
      to: [booking.clientUser._id.toString()],
      type: "booking",
      booking: booking._id,
    });
    const notificationWorker = new Notification({
      title: "Reserva terminada",
      body: `Sua reserva foi terminada em : ${booking.businessUser.businessData.name}`,
      to: [booking.workerUser._id.toString()],
      type: "booking",
      booking: booking._id,
    });
    notificationClient.save();
    notificationWorker.save();
  } catch (err) {
    throw err;
  }
};
