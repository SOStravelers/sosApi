import * as NOTIFICATION_DAO from "./dao.js";

export const newBookingNotification = async (req, res, next) => {
  try {
    const userId = req.user._id.toString();
    const booking = req.body;
    const response = await NOTIFICATION_DAO.newBookingNotification(
      booking,
      userId
    );
    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
};

export const getByUser = async (req, res, next) => {
  try {
    const userId = req.user._id.toString();
    const data = req.query;
    const response = await NOTIFICATION_DAO.getByUser(data, userId);
    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
};

export const setIsRead = async (req, res, next) => {
  try {
    const id = req.params.id;
    const response = await NOTIFICATION_DAO.setIsRead(id);
    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
};

export const checkNotification = async (req, res, next) => {
  try {
    const idUser = req.user._id.toString();
    const response = await NOTIFICATION_DAO.checkNotification(idUser);
    res.status(200).json(response);
    if (response) {
    }
  } catch (err) {
    next(err);
  }
};
