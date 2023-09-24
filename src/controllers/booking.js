//import { sendMailTest } from "../lib/mailer.js";
import { notFoundError, createError, missingData } from "../config/error.js";
import Booking from "../models/booking.js";

//Crear booking
export const create = async (req, res, next) => {
  console.log("---CREATE NEW BOOKING---");

  let booking = new Booking(req.body);
  console.log("booking", booking);
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
  console.log("la query", query);
  let exists = await Booking.findOne(query, {}).exec();
  console.log("exists", exists);
  if (exists) {
    console.log("ya existe");
    res.send({ booking: exists, msg: "document already exists" });
  } else {
    console.log("no existe");
    try {
      const newBooking = await booking.save();
      console.log("nueva reserva", newBooking);
      res.send({ booking: newBooking, msg: "new Document" });
    } catch (err) {
      next(err);
    }
  }
};
//Obtener reserva por ID
export const getById = async (req, res, next) => {
  console.log("---GET BOOKING BY ID---");
  Booking.findOne({ _id: req.params.id }).exec((err, booking) => {
    if (err) next(err);
    if (booking) {
      booking.populate([
        {
          path: "hotel",
          //   select: "isActive name  email phone creator user imgUrl emails type",
        },
        {
          path: "service",
          //   select: "isActive name  email phone creator user imgUrl emails type",
        },
        {
          path: "client",
          //   select: "isActive name  email phone creator user imgUrl emails type",
        },
      ]);
      res.send(booking);
    } else {
      console.log("se viene error");
      return next(err);
    }
  });
};
//Obtener bookings con paginate por cliente, hotel, Worker,
export const getBookings = async (req, res, next) => {
  console.log("---GET bookings---");
  let body = {};
  Object.assign(body, req.query);
  console.log("query", body);

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
  try {
    Booking.paginate(query, options, (err, items) => {
      if (err) return next(err);
      res.send(items);
    });
  } catch (err) {
    next(err);
  }
};
//Actualizar data de un booking
export const updateOne = (req, res, next) => {
  console.log("---UPDATE Booking---");
  let data = req.body;
  Booking.findOneAndUpdate(
    {
      _id: req.params.id,
    },
    data,
    {
      new: true,
    }
  ).exec((err, service) => {
    if (err) return next(err);
    res.send(service);
  });
};
