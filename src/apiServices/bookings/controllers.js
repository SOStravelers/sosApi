import * as BOOKING_DAO from "./dao.js";
import { decodeTokenSimple } from "../../middleware/auth.js";

//Crear booking
export const createBooking = async (req, res, next) => {
  try {
    const data = req.body;
    const response = await BOOKING_DAO.createBooking(data);
    if (response) {
      res.status(200).json(response);
    } else {
      throw err;
    }
  } catch (err) {
    next(err);
  }
};
//Obtiene info del booking por token para mostrar post compra
export const getByToken = async (req, res, next) => {
  try {
    const token = req.query.token;
    const decodedData = decodeTokenSimple(token);
    const data = decodedData.id;
    const response = await BOOKING_DAO.getByToken(data);
    if (response) {
      res.status(200).json(response);
    } else {
      throw err;
    }
  } catch (err) {
    next(err);
  }
};
//Obtienes info de id,foto y name del booking por token
export const getByTokenMin = async (req, res, next) => {
  try {
    const token = req.query.token;
    const decodedData = decodeTokenSimple(token);
    const data = decodedData.id;
    const response = await BOOKING_DAO.getByTokenMin(data);
    if (response) {
      res.status(200).json(response);
    } else {
      throw err;
    }
  } catch (err) {
    next(err);
  }
};
//Obtienes toda la info booking por usuario registrado
export const getMyBooking = async (req, res, next) => {
  try {
    const user = req.user;
    const idBooking = req.params.id;
    const response = await BOOKING_DAO.getMyBooking(idBooking, user);
    if (response) {
      res.status(200).json(response);
    } else {
      throw err;
    }
  } catch (err) {
    next(err);
  }
};
//Obtiene todos los booking de un usuario con multiples filtros
export const getBookingsByRange = async (req, res, next) => {
  try {
    const data = req.query;
    const user = req.user;
    console.log("data", data);
    console.log("user", user);
    const response = await BOOKING_DAO.getBookingsByRange(data, user);
    if (response) {
      res.status(200).json(response);
    } else {
      throw err;
    }
  } catch (err) {
    next(err);
  }
};
//Obtienes info del proximo booking en fecha mas cercana
export const getNextBooking = async (req, res, next) => {
  try {
    const user = req.user;
    const response = await BOOKING_DAO.getNextBooking();
    if (response) {
      res.status(200).json(response);
    } else {
      throw err;
    }
  } catch (err) {
    next(err);
  }
};

//http://localhost:3000/booking-link/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ODRmMjBkYzZkZWY4NWI3ZThhZDkxMSIsImlhdCI6MTc1MzU0MzE4MX0.Y0rSJ1zXDT2Kf3FANDTeQPvtooPtiz-egZ7fjSQCb08
