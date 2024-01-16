import Notification from "../models/notification.js";
import { createError } from "../config/error.js";
import Booking from "../models/booking.js";
import User from "../models/user.js";

export const newBookingNotification = async (booking) => {
  try {
    global.logger.info("---NEW BOOKING NOTIFICATION---");
    const notificationClient = new Notification({
      title: "New booking",
      body: `New reservation at : ${booking.businessUser.businessData.name}`,
      to: [booking.clientUser._id.toString()],
      type: "booking",
      booking: booking._id,
    });
    const notificationWorker = new Notification({
      title: "Nova reserva",
      body: `Nova reserva em : ${booking.businessUser.businessData.name}`,
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
      to: [booking.clientUser],
      type: "booking",
      booking: booking._id,
    });
    const notificationWorker = new Notification({
      title: "Reserva cancelada",
      body: `Sua reserva foi cancelada em : ${booking.businessUser.businessData.name}`,
      to: [booking.workerUser],
      type: "booking",
      booking: booking._id,
    });
    notificationClient.save();
    notificationWorker.save();
  } catch (err) {
    throw err;
  }
};

// notificacion de confirmacion de reserva
export const confirmBookingNotification = async (booking) => {
  try {
    const notificationClient = new Notification({
      title: "Confirmed booking",
      body: `Your reservation has been confirmed at : ${booking.businessUser.businessData.name}`,
      to: [booking.clientUser],
      type: "booking",
      booking: booking._id,
    });
    const notificationWorker = new Notification({
      title: "Reserva confirmada",
      body: `Sua reserva foi confirmada em: ${booking.businessUser.businessData.name}`,
      to: [booking.workerUser],
      type: "booking",
      booking: booking._id,
    });
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
      to: [booking.clientUser],
      type: "booking",
      booking: booking._id,
    });
    const notificationWorker = new Notification({
      title: "Reserva terminada",
      body: `Sua reserva foi terminada em : ${booking.businessUser.businessData.name}`,
      to: [booking.workerUser],
      type: "booking",
      booking: booking._id,
    });
    notificationClient.save();
    notificationWorker.save();
  } catch (err) {
    throw err;
  }
};
