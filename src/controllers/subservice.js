import Subservice from "../models/subservice.js";
import User from "../models/user.js";
import Price from "../models/price.js";
import { createError } from "../config/error.js";
import { botcurrency } from "../services/botcurrency.js";

//Crear subServicio
export const create = async (req, res, next) => {
  global.logger.info("---CREATE NEW SUBSERVICE---", req.body);
  try {
    let subservice = new Subservice(req.body);
    subservice.name = req.body.name.toLowerCase();
    subservice.creator = req.body.user;
    const newsubService = await subservice.save();
    res.json(newsubService);
  } catch (err) {
    next(err);
  }
};
//obtener los subservicios por servicio
export const getByService = async (req, res, next) => {
  global.logger.info("---GET SUBSERVICES BY SERVICE---");
  try {
    let options = {
      // populate,
      select: "name price duration imgUrl details multiple shortDescription",
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 50,
      sort: { updatedAt: -1 },
    };
    let query = {};
    query.isActive = true;
    query.service = req.query.id;

    const subservices = await Subservice.paginate(query, options);
    res.status(200).json(subservices);
  } catch (err) {
    next(err);
  }
};
//Obtener subService por id
export const getById = async (req, res, next) => {
  global.logger.info("---GET SUBSERVICE BY ID---");
  try {
    const subService = await Subservice.findOne({ _id: req.params.id }).exec();
    if (!subService) throw createError(404, "subService not found");
    res.status(200).json(subService);
  } catch (err) {
    next(err);
  }
};
//Obtener all services con paginate segun varias metricas
export const getAll = async (req, res, next) => {
  global.logger.info("---GET ALL SUBSERVICES---");
  try {
    let query = {};
    Object.assign(query, req.query);
    let options = {
      // populate,
      // select,
      page: query.page || 1,
      limit: query.limit || 50,
      sort: { updatedAt: -1 },
    };
    const subservices = await Subservice.paginate(query, options);
    res.status(200).json(subservices);
  } catch (err) {
    next(err);
  }
};
//Actualizar data de un subservicio
export const updateOne = async (req, res, next) => {
  global.logger.info("---UPDATE SUBSERVICE---");
  try {
    let data = req.body;
    const subservice = await Subservice.findOneAndUpdate(
      {
        _id: req.params.id,
      },
      data,
      {
        new: true,
      }
    ).exec();
    if (!subservice) throw createError(404, "subService not found");
    res.status(200).json(subservice);
  } catch (err) {
    next(err);
  }
};
//Activar o desactivar multiples usuarios
export const activateMany = async (req, res, next) => {
  global.logger.info("---ACTIVATE/DESACTIVATE MANY SUBSERVICES---");
  try {
    const subServices = await Subservice.updateMany(
      { _id: { $in: req.body.subServices } },
      { isActive: req.body.isActive ? req.body.isActive : true }
    ).exec();
    res.status(200).json(subServices);
  } catch (err) {
    next(err);
  }
};

export const getPrice = async (req, res, next) => {
  global.logger.info("---GET PRICE SUBSERVICE---");
  console.log("query", req.query);
  try {
    const subservice = await Subservice.findById(req.query.subservice)
      .select("price multiple")
      .exec();

    if (!subservice.multiple) {
      const businessUser = await User.findById(req.query.user)
        .select("businessData")
        .exec();
      console.log("perro", businessUser.businessData.category);
      const price = subservice.price[businessUser.businessData.category] || 0;
      const currencyBase = "BRL";
      const othersCurrency = await botcurrency(price, currencyBase);
      console.log(othersCurrency);
      res.status(200).json(othersCurrency);
    } else {
      const price = await Price.findOne({
        subservice: req.query.subservice,
        user: req.query.user,
      });
      const currencyBase = price?.currencyCode || "BRL";
      const thePrice = price?.value || 1;
      const othersCurrency = await botcurrency(thePrice, currencyBase);
      console.log(othersCurrency);
      res.status(200).json(othersCurrency);
    }
  } catch (err) {
    next(err);
  }
};
