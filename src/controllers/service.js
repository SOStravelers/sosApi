import Service from "../models/service.js";
import mongoose from "mongoose";
import { AwsUploadFile } from "../services/aws_s3.js";
import Jimp from "jimp";
import {
  notFoundError,
  createError,
  missingData,
  duplicateData,
} from "../config/error.js";
import Subservice from "../models/subservice.js";

//Crear Servicio
export const create = async (req, res, next) => {
  console.log("---CREATE NEW SERVICE---", req.user);
  let service = new Service(req.body);
  service.name = req.body.name.toLowerCase();
  service.creator = req.body.user;

  try {
    console.log("saving...", service);
    const newService = await service.save();
    console.log("nuevo servicio", newService);
    res.json(newService);
  } catch (err) {
    next(err);
    return res.status(400).send({
      status: 400,
      err: err,
      result: `Duplicate data ${service.name}`,
    });
  }
};
//Obtener servicios con paginate por tipos y activados
export const getServices = async (req, res, next) => {
  console.log("---GET SERVICES---");
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
  try {
    Service.paginate(query, options, (err, items) => {
      if (err) return next(err);
      res.send(items);
    });
  } catch (err) {
    next(err);
  }
};
//Obtener usuario por ID
export const getById = async (req, res, next) => {
  console.log("---GET SERVICE BY ID---");
  Service.findOne({ _id: req.params.id }).exec((err, user) => {
    if (err) return next(err);
    if (user) {
      res.send(user);
    } else {
      return next(createError(404, req.lg.user.notFound));
    }
  });
};
//Actualizar data de un usuario
export const updateOne = (req, res, next) => {
  console.log("---UPDATE SERVICE---");
  let data = req.body;
  Service.findOneAndUpdate(
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
//Activar o desactivar multiples usuarios
export const activateMany = (req, res, next) => {
  console.log(req.body);
  Service.updateMany(
    { _id: { $in: req.body.services } },
    { isActive: req.body.isActive ? req.body.isActive : true }
  ).exec((err, data) => {
    if (err) next(err);
    res.send(data);
  });
  // res.send("buena")
};

export const uploadIconService = async (req, res, next) => {
  try {
    console.log("---UPLOAD ICON SERVICE/SUBSERVICE---", req.query);
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
