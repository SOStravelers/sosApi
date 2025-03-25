import Subservice from "../models/subservice.js";
import User from "../models/user.js";
import ScheduleMultiple from "../models/scheduleMultiple.js";
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
      select:
        "name price duration imgUrl details multiple shortDescription goChat isoTime",
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

    const businessUser = await User.findById(req.query.user)
      .select("businessData")
      .exec();
    console.log("perro", businessUser.businessData.category);
    const price = subservice.price[businessUser.businessData.category] || 0;
    const currencyBase = "BRL";
    const othersCurrency = await botcurrency(price, currencyBase);
    console.log(othersCurrency);
    res.status(200).json(othersCurrency);
  } catch (err) {
    next(err);
  }
};

export const infoSubserviceByWorker = async (req, res, next) => {
  global.logger.info("---GET INFO SUBSERVICE BY WORKER---");

  let onlySubservice = strToBool(req.query.onlySubservice);
  let info = null;
  function strToBool(str) {
    return str.toLowerCase() === "true";
  }
  if (onlySubservice) {
    console.log("caso 1");
    info = await Subservice.findOne({
      _id: req.query.subservice,
    });
  } else {
    console.log("caso2");
    info = await ScheduleMultiple.findOne({
      subService: req.query.subservice,
      user: req.query.user,
    })
      .select("duration locationInfo mapUrl price details")
      .lean();
    const currencyBase = info?.currencyCode || "BRL";
    const thePrice = info?.price || 5;
    const othersCurrency = await botcurrency(thePrice, currencyBase);
    info.prices = othersCurrency;

    const subservice = await Subservice.findOne({
      _id: req.query.subservice,
    });
    console.log("chao", subservice.imgUrl);

    info.imgUrl = subservice.imgUrl;
  }

  return res.status(200).json(info);
};

export const getByEmail = async (req, res, next) => {
  try {
    const { email } = req.params;
    if (!email) {
      return res.status(400).json({ error: "Email es requerido" });
    }

    const message = await sendTextSubservices({ email, isActive: true });

    res.status(200).send(message);
  } catch (err) {
    next(err);
  }
};

//Activar o desactivar multiples usuarios
export const sendTextSubservices = async (body) => {
  const { email, isActive } = body;
  global.logger.info(
    "---GET SERVICES AND SUBSERVICES BY EMAIL (TEXT OUTPUT)---"
  );
  console.log("el body", body);

  try {
    const arrayServices = [
      {
        name: "Experience",
        _id: "67d39901d2112e5164f10902",
      },
      {
        name: "Trips-Transfers",
        _id: "6757137ad2b2668720116ec9",
      },
      {
        name: "Tour",
        _id: "67c11cc117c3a7a2c353cb1c",
      },
    ];

    if (!email || !Array.isArray(arrayServices)) {
      throw createError(400, "Email y arrayServices son requeridos.");
    }

    // Obtener el usuario por email
    const user = await User.findOne({ email });
    if (!user) {
      throw createError(404, "Usuario no encontrado");
    }

    const serviceIds = arrayServices.map((s) => s._id);

    // Buscar subservicios activos
    const subServices = await Subservice.find({
      partner: user._id,
      service: { $in: serviceIds },
      isActive: isActive !== undefined ? isActive : true,
    }).select("_id name service");

    // Construir respuesta en texto
    let message = "";

    arrayServices.forEach((service) => {
      const subservicesForThisService = subServices.filter(
        (sub) => sub.service.toString() === service._id
      );

      if (subservicesForThisService.length > 0) {
        message += `\n*${service.name}:*\n\n`; // Título del servicio

        subservicesForThisService.forEach((sub) => {
          const subName = sub.name?.es || "Sin nombre";
          message += `  ${subName}\n  id: ${sub._id}\n\n`;
        });
      }
    });
    if (!message) {
      message = "No se encontraron subservicios para este usuario.";
    }
    return message;
  } catch (err) {
    throw err;
  }
};
