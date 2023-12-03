import Service from "../models/service.js";
import Subservice from "../models/subservice.js";
import { AwsUploadFile } from "../services/aws_s3.js";
import Jimp from "jimp";
import { createError } from "../config/error.js";

//Crear Servicio
export const create = async (req, res, next) => {
  global.logger.info("--- CREATE NEW SERVICE ---");
  try {
    let service = new Service(req.body);
    service.name = req.body.name.toLowerCase();
    service.creator = req.body.user;
    const newService = await service.save();
    res.status(201).json(newService);
  } catch (err) {
    next(err);
  }
};
//Obtener servicios con paginate por tipos y activados
export const getServices = async (req, res, next) => {
  global.logger.info("--- GET SERVICES ---");
  try {
    let body = {};
    Object.assign(body, req.query);
    console.log("query", body);
    let options = {
      // select,
      page: body.page || 1,
      limit: body.limit || 50,
      sort: { updatedAt: -1 },
    };
    let query = {};
    body.isActive ? (query.isActive = body.isActive) : "";
    const services = await Service.paginate(query, options);
    res.status(200).json(services);
  } catch (err) {
    next(err);
  }
};
//Obtener servicio por ID
export const getById = async (req, res, next) => {
  global.logger.info("---GET SERVICE BY ID---");
  try {
    const service = await Service.findOne({ _id: req.params.id }).exec();
    if (!service) throw createError(404, "Service not found");
    res.status(200).json(service);
  } catch (err) {
    next(err);
  }
};
//Actualizar data de un servicio
export const updateOne = async (req, res, next) => {
  global.logger.info("---UPDATE SERVICE---");
  try {
    let data = req.body;
    const service = await Service.findOneAndUpdate(
      {
        _id: req.params.id,
      },
      data,
      {
        new: true,
      }
    ).exec();
    res.status(200).json(service);
  } catch (err) {
    next(err);
  }
};
//Activar o desactivar multiples usuarios
export const activateMany = async (req, res, next) => {
  global.logger.info("---ACTIVATE/DESACTIVATE MANY SERVICES---");
  try {
    const services = await Service.updateMany(
      { _id: { $in: req.body.services } },
      { isActive: req.body.isActive ? req.body.isActive : true }
    ).exec();
    res.status(200).json(services);
  } catch (err) {
    next(err);
  }
};
export const uploadIconService = async (req, res, next) => {
  console.log("--- UPLOAD ICON SERVICE/SUBSERVICE ---", req.query);
  try {
    const id = req.query.id;
    const type = req.query.type;
    if (type != "service" && type != "subservice") {
      let err = createError(400, "type not valid");
      next(err);
      return res.status(404).json(err);
    }
    console.log("buffer", req.file);
    let file = req.file ? req.file : fakeReq.file;
    Jimp.read(file.buffer)
      .then(async (image) => {
        image
          .resize(320, Jimp.AUTO) // resize
          .quality(70); // set JPEG quality
        let imagenReducida = await image.getBufferAsync(Jimp.MIME_JPEG);
        console.log("imagenReducida", imagenReducida);
        let lastIndex = file.originalname.lastIndexOf(".");
        let name = file.originalname.slice(0, lastIndex);
        let ext = file.originalname.slice(lastIndex + 1);
        let resp = await AwsUploadFile({
          fileName: `icons/${type}/${id}.${ext}`,
          buffer: imagenReducida,
        });

        if (resp.results.$metadata.httpStatusCode == 200) {
          if (req.query.type == "service") {
            let service = await Service.findByIdAndUpdate(
              req.query.id,
              {
                imgUrl: resp.url,
              },
              {
                new: true,
              }
            )
              .select("imgUrl")
              .exec();
            res.send(service);
          } else if (req.query.type == "subservice") {
            let subservice = await Subservice.findByIdAndUpdate(
              id,
              {
                imgUrl: resp.url,
              },
              {
                new: true,
              }
            )
              .select("imgUrl")
              .exec();
            res.send(subservice);
          }
        }
      })
      .catch((err) => {
        next(err);
        if (err instanceof Error && err.$metadata) {
          res
            .status(err.$metadata.httpStatusCode)
            .json({ error: err.Error.message });
        } else {
          next(err);
          res.status(500).json({ error: "Internal Server Error" });
        }
      });
  } catch (err) {
    next(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
//obtener los subservicios por servicio
export const serviceAndSubservice = async (req, res, next) => {
  global.logger.info("--- GET ALL SERVICES WITH SUBSERVICE ---");
  try {
    let services = await Service.find({}).select("_id name");
    if (services.length > 0) {
      let result = [];
      for (let [index, service] of services.entries()) {
        console.log(service._id.toString());
        let subservices = await Subservice.find({
          service: service._id.toString(),
        }).select("_id name");
        let serviceWithSubservices = {
          _id: service._id,
          name: service.name,
          subservices: subservices,
        };
        result.push(serviceWithSubservices);
      }
      res.status(200).json(result);
    }
  } catch (err) {
    next(err);
  }
};

export const getByUserId = async (req, res, next) => {
  global.logger.info("--- GET SERVICE BY USER ID ---");
  try {
    let services = await Service.find({ creator: req.params.id }).exec();
    res.status(200).json(services);
  } catch (err) {
    next(err);
  }
};
