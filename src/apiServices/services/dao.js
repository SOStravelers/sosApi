import Service from "./model.js";
import Subservice from "../subservices/model.js";
import { AwsUploadFile } from "../../services/aws_s3.js";
import Jimp from "jimp";
import { createError } from "../../config/error.js";

//Crear Servicio
export const create = async (data) => {
  logger.info("*** CREATE NEW SERVICE DAO ***");
  try {
    let service = new Service(data);
    service.name = data.name.toLowerCase();
    service.creator = data.user;
    const newService = await service.save();
    return newService;
  } catch (err) {
    throw err;
  }
};
//Obtener servicios con paginate por tipos y activados
export const getServices = async (data) => {
  logger.info("*** GET SERVICES SERVICE DAO ***");
  try {
    let body = {};
    Object.assign(body, data);
    let options = {
      // select,
      page: body.page || 1,
      limit: body.limit || 50,
      sort: { updatedAt: -1 },
    };
    let query = {};
    body.isActive ? (query.isActive = body.isActive) : (query.isActive = true);
    const services = await Service.paginate(query, options);
    return services;
  } catch (err) {
    throw err;
  }
};
//Obtener servicio por ID
export const getById = async (id) => {
  logger.info("*** GET BY ID SERVICE DAO ***");
  try {
    const service = await Service.findOne({ _id: id }).exec();
    if (!service) throw createError(404, "Service not found");
    res.status(200).json(service);
  } catch (err) {
    throw err;
  }
};
//Actualizar data de un servicio
export const updateOne = async (data, id) => {
  logger.info("*** UPDATE SERVICE DAO ***");
  try {
    const service = await Service.findOneAndUpdate(
      {
        _id: id,
      },
      data,
      {
        new: true,
      }
    ).exec();
    return service;
  } catch (err) {
    throw err;
  }
};

// Actualizar status isActive de un servicio
export const changeStatus = async (data, id) => {
  logger.info("*** UPDATE STATUS SERVICE DAO ***");
  try {
    const service = await Service.findOneAndUpdate(
      {
        _id: id,
      },
      {
        isActive: data.isActive,
      },
      {
        new: true,
      }
    ).exec();
    if (!service) throw createError(404, "service not found");
    return service;
  } catch (err) {
    throw err;
  }
};
//Activar o desactivar multiples usuarios
export const activateMany = async (data) => {
  logger.info("*** ACTIVATE/DESACTIVATE MANY SERVICES ***");
  try {
    const services = await Service.updateMany(
      { _id: { $in: data.services } },
      { isActive: data.isActive ? data.isActive : true }
    ).exec();
    res.status(200).json(services);
  } catch (err) {
    throw err;
  }
};
export const uploadIconService = async (data, file) => {
  logger.info("*** UPLOAD ICON SERVICE/SUBSERVICE  SERVICE DAO***");
  try {
    const id = data.id;
    const type = data.type;
    if (type != "service" && type != "subservice") {
      let err = createError(400, "type not valid");
      next(err);
      return res.status(404).json(err);
    }
    console.log("buffer", file);
    let file = file ? file : fakeReq.file;
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
          if (data.type == "service") {
            let service = await Service.findByIdAndUpdate(
              data.id,
              {
                imgUrl: resp.url,
              },
              {
                new: true,
              }
            )
              .select("imgUrl")
              .exec();
            return service;
          } else if (data.type == "subservice") {
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
            return subservice;
          }
        }
      })
      .catch((err) => {
        if (err instanceof Error && err.$metadata) {
          throw createError(err.$metadata.httpStatusCode, err.Error.message);
        } else {
          throw err;
        }
      });
  } catch (err) {
    throw err;
  }
};
//obtener los subservicios por servicio
export const serviceAndSubservice = async () => {
  logger.info("*** GET ALL SERVICES WITH SUBSERVICE  SERVICE DAO ***");
  try {
    let services = await Service.find({ isActive: true }).select("_id name");
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
      return result;
    }
  } catch (err) {
    throw err;
  }
};
