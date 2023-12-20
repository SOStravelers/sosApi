import { createError } from "../config/error.js";
import Booking from "../models/booking.js";
import { sendEmailPaymentConfirmation } from "../services/aws_ses.js";

//Crear booking
export const create = async (req, res, next) => {
  global.logger.info("---CREATE NEW BOOKING---");
  try {
    const bookingData = req.body;
    let booking = new Booking(bookingData);
    const newBooking = await booking.save();
    return res.status(201).json({ booking: newBooking, msg: "new Document" });
    let query = {
      $and: [
        {
          location: booking.location,
        },
        {
          subService: booking.subService,
        },
        {
          date: booking.date,
        },
        {
          startTime: booking.startTime,
        },
      ],
    };
    let exists = await Booking.findOne(query, {}).exec();
    if (exists) {
      throw createError(409, "document already exists");
    } else {
      const newBooking = await booking.save();
      if (emailData) sendEmailPaymentConfirmation(emailData);
      res.status(201).json({ booking: newBooking, msg: "new Document" });
    }
  } catch (err) {
    next(err);
  }
};
//Obtener reserva por ID
export const getById = async (req, res, next) => {
  global.logger.info("---GET BOOKING BY ID---");
  try {
    const booking = await Booking.findOne({ _id: req.params.id }).exec();
    if (!booking) throw createError(404, "Booking not found");
    res.send(booking);
  } catch (err) {
    next(err);
  }
};
//Obtener bookings con paginate por cliente, hotel, Worker,
export const getBookings = async (req, res, next) => {
  global.logger.info("---GET BOOKINGS---");
  try {
    let body = {};
    Object.assign(body, req.query);
    const populate = [
      {
        path: "hotel",
        //   select: "isActive name  email phone creator user imgUrl emails type",
      },
      {
        path: "worker",
      },
      {
        path: "client",
      },
      {
        path: "creator",
      },
    ];
    let options = {
      // populate,
      // select,
      page: body.page || 1,
      limit: body.limit || 50,
      sort: { updatedAt: -1 },
    };
    let query = {};
    body.isActive ? (query.isActive = body.isActive) : "";
    body.client ? (query.client = body.client) : "";
    body.hotel ? (query.hotel = body.hotel) : "";
    body.worker ? (query.worker = body.worker) : "";
    body.creator ? (query.creator = body.creator) : "";

    const bookings = await Booking.paginate(query, options);
    res.status(200).json(bookings);
  } catch (err) {
    next(err);
  }
};
//Actualizar data de un booking
export const updateOne = async (req, res, next) => {
  global.logger.info("---UPDATE BOOKING---");
  try {
    let data = req.body;

    const booking = await Booking.findOneAndUpdate(
      {
        _id: req.params.id,
      },
      data,
      {
        new: true,
      }
    ).exec();
    if (!booking) throw createError(404, "Booking not found");
    res.status(200).json(booking);
  } catch (err) {
    next(err);
  }
};
