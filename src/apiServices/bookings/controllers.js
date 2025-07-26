import * as BOOKING_DAO from "./dao.js";
import { decodeTokenSimple } from "../../middleware/auth.js";

//Crear booking
export const createBooking = async (req, res, next) => {
  try {
    const data = req.body;
    const response = await BOOKING_DAO.createBooking(data);
    res.status(200).json(response);
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
    res.status(200).json(response);
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
    res.status(200).json(response);
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
    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
};
//Obtiene todos los booking de un usuario con multiples filtros
export const getBookingsByRange = async (req, res, next) => {
  try {
    const data = req.query;
    const user = req.user;
    const response = await BOOKING_DAO.getBookingsByRange(data, user);
    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
};
//Obtienes info del proximo booking en fecha mas cercana
export const getNextBooking = async (req, res, next) => {
  try {
    const user = req.user;
    const response = await BOOKING_DAO.getNextBooking(user);
    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
};
