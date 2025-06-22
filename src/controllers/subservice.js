import Subservice from "../models/subservice.js";
import User from "../models/user.js";
import ScheduleMultiple from "../models/scheduleMultiple.js";
import { createError } from "../config/error.js";
import { botcurrency } from "../services/botcurrency.js";

import { AwsUploadFile } from "../services/aws_s3.js";
import { s3 } from "../services/awsClient.js";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import Jimp from "jimp";
import envar from "../config/envar.js";

async function awsDelete(key) {
  await s3.send(
    new DeleteObjectCommand({ Bucket: envar().BUCKET_NAME_FILES, Key: key })
  );
}

function extractKeyFromUrl(url) {
  try {
    const { pathname } = new URL(url);
    return pathname.startsWith("/") ? pathname.slice(1) : pathname;
  } catch {
    return url;
  }
}

export const uploadAssets = async (req, res, next) => {
  console.log("ha entrado");
  try {
    const { id } = req.params;
    const files = req.files || {};
    const body = req.body;

    // Obtener subservice actual
    const sub = await Subservice.findById(id);
    if (!sub) throw createError(404, "Subservice no encontrado");

    const updates = {};
    const deletes = [];

    // 1) Borrar imagen principal si se solicitó
    if (body.removeImg === "true" && sub.imgUrl) {
      console.log("caso1", body.removeImg, sub.imgUrl);
      deletes.push(extractKeyFromUrl(sub.imgUrl));
      updates.imgUrl = null;
    }

    // 2) Borrar vídeo principal
    if (body.removeVideo === "true" && sub.videoUrl) {
      console.log("caso2", body.removeVideo, sub.videoUrl);
      deletes.push(extractKeyFromUrl(sub.videoUrl));
      updates.videoUrl = null;
    }

    // 3) Borrar gallery images
    if (body.removeGalleryImages) {
      console.log("caso3", body.removeGalleryImages);
      const idxs = JSON.parse(body.removeGalleryImages);
      sub.gallery.images.forEach((url, i) => {
        if (idxs.includes(i)) deletes.push(extractKeyFromUrl(url));
      });
      updates["gallery.images"] = sub.gallery.images.filter(
        (_, i) => !idxs.includes(i)
      );
    }

    // 4) Borrar gallery videos
    if (body.removeGalleryVideos) {
      console.log("caso4", body.removeGalleryVideos);
      const idxs = JSON.parse(body.removeGalleryVideos);
      sub.gallery.videos.forEach((url, i) => {
        if (idxs.includes(i)) deletes.push(extractKeyFromUrl(url));
      });
      updates["gallery.videos"] = sub.gallery.videos.filter(
        (_, i) => !idxs.includes(i)
      );
    }

    // 5) Subir nueva imagen principal
    if (files.imgUrl) {
      const img = files.imgUrl[0];
      const image = await Jimp.read(img.buffer);
      image.resize(800, Jimp.AUTO).quality(80);
      const buf = await image.getBufferAsync(Jimp.MIME_JPEG);
      const resp = await AwsUploadFile({
        fileName: `subservices/${id}/img.${img.mimetype.split("/")[1]}`,
        buffer: buf,
      });
      updates.imgUrl = resp.url;
    }

    // 6) Subir nuevo vídeo principal
    if (files.videoUrl) {
      const vid = files.videoUrl[0];
      const ext = vid.originalname.split(".").pop();
      const resp = await AwsUploadFile({
        fileName: `subservices/${id}/video.${ext}`,
        buffer: vid.buffer,
      });
      updates.videoUrl = resp.url;
    }

    // 7) Subir nuevas gallery images
    if (files.galleryImages) {
      const oldImgs = updates["gallery.images"] || sub.gallery.images;
      const newUrls = [];
      for (let i = 0; i < files.galleryImages.length; i++) {
        const file = files.galleryImages[i];
        const image = await Jimp.read(file.buffer);
        image.resize(800, Jimp.AUTO).quality(70);
        const buf = await image.getBufferAsync(Jimp.MIME_JPEG);
        const resp = await AwsUploadFile({
          fileName: `subservices/${id}/gallery/img_${Date.now()}_${i}.jpg`,
          buffer: buf,
        });
        newUrls.push(resp.url);
      }
      updates["gallery.images"] = [...oldImgs, ...newUrls];
    }

    // 8) Subir nuevos gallery videos
    if (files.galleryVideos) {
      const oldVids = updates["gallery.videos"] || sub.gallery.videos;
      const newUrls = [];
      for (let i = 0; i < files.galleryVideos.length; i++) {
        const file = files.galleryVideos[i];
        const ext = file.originalname.split(".").pop();
        const resp = await AwsUploadFile({
          fileName: `subservices/${id}/gallery/vid_${Date.now()}_${i}.${ext}`,
          buffer: file.buffer,
        });
        newUrls.push(resp.url);
      }
      updates["gallery.videos"] = [...oldVids, ...newUrls];
    }

    // Ejecutar borrados en S3
    await Promise.all(deletes.map((key) => awsDelete(key)));

    // Actualizar MongoDB
    const updated = await Subservice.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    next(err);
  }
};

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
  global.logger.info("---GET SUBSERVICE BY IDs---");
  console.log(req.params);
  try {
    const subService = await Subservice.findOne({ _id: req.params.id })
      .populate({
        path: "service",
        select: "name",
      })
      .exec();
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
    console.log("options", options);
    console.log("la query", query);

    const subservices = await Subservice.paginate({ isActive: true }, options);
    res.status(200).json(subservices);
  } catch (err) {
    next(err);
  }
};

//Obtener todos los subservicios agrupados por servicios:
// controllers/subservice.js
export const getAllByService = async (req, res, next) => {
  global.logger.info("--- GET ALL SUBSERVICES (small) BY SERVICE ---");
  try {
    const data = await Subservice.aggregate([
      /* 1) convertir el id-texto al tipo ObjectId para el $lookup */
      { $addFields: { serviceObjId: { $toObjectId: "$service" } } },

      /* 2) unir con la colección services */
      {
        $lookup: {
          from: "services",
          localField: "serviceObjId",
          foreignField: "_id",
          as: "service",
        },
      },
      { $unwind: "$service" },

      /* 3) proyectar SOLO los campos que nos interesan */
      {
        $project: {
          _id: 1,
          name: 1,
          isActive: 1,
          service: {
            _id: "$service._id",
            name: "$service.name",
            isActive: "$service.isActive",
          },
        },
      },

      /* 4) agrupar subservicios bajo cada servicio */
      {
        $group: {
          _id: "$service._id",
          service: { $first: "$service" },
          subservices: {
            $push: { _id: "$_id", name: "$name", isActive: "$isActive" },
          },
        },
      },

      /* 5) ordenar por nombre en español (opcional) */
      { $sort: { "service.name.es": 1 } },
    ]);

    res.status(200).json(data);
  } catch (err) {
    next(err);
  }
};

//Obtener all services con paginate segun varias metricas
export const getWithVideos = async (req, res, next) => {
  global.logger.info("---GET SUBSERVICES WITH VIDEOS---");
  try {
    const subservices = await Subservice.find({
      isActive: true,
      videoUrl: { $exists: true, $ne: null },
    });
    res.status(200).json(subservices);
  } catch (err) {
    next(err);
  }
};

//Obtener all services con paginate segun varias metricas
export const getRecommendedSubservice = async (req, res, next) => {
  global.logger.info("---GET SUBSERVICES RECOMENDED---");
  try {
    const subservices = await Subservice.aggregate([
      { $match: { recommended: true } },
      { $sample: { size: 7 } },
    ]);
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
// Actualizar status isActive de un subservicio
export const changeStatus = async (req, res, next) => {
  global.logger.info("---UPDATE STATUS SUBSERVICE---");
  try {
    let data = req.body;
    const subservice = await Subservice.findOneAndUpdate(
      {
        _id: req.params.id,
      },
      {
        isActive: data.isActive,
      },
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
