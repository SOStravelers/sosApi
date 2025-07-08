import Subservice from "../models/subservice.js";
import mongoose from "mongoose";

import User from "../models/user.js";
import ScheduleMultiple from "../models/scheduleMultiple.js";
import { createError } from "../config/error.js";
import { botcurrency } from "../services/botcurrency.js";
import { isValidImage, isValidVideo } from "../config/uploadTypes.js";
import { AwsUploadFile } from "../services/aws_s3.js";
import { s3 } from "../services/awsClient.js";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
const USER_REF_PATHS = extractReferencePaths(Subservice.schema);
import extractReferencePaths from "../helpers/extractReferencePaths.js";
import { normalizeObjectIdReferencesForController } from "../helpers/controllers/normalizeRefValueForController.js";
import mongoJsonToPlain from "../helpers/mongoJsonToPlain.js";
import Jimp from "jimp";
import envar from "../config/envar.js";
import { populate } from "dotenv";
import Favorite from "../models/favorite.js";
//hola

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

//subir y eliminar galeria de fotos, imgurl, videoUrl
export const uploadAssets = async (req, res, next) => {
  const uploadedKeys = []; // para rollback si algo falla

  try {
    const { id } = req.params;
    const files = req.files || {};
    const body = req.body;

    /* 1. Obtener subservicio */
    const sub = await Subservice.findById(id);
    if (!sub) throw createError(404, "Subservice no encontrado");

    const updates = {};
    const deletes = [];

    /* 2. Borrados solicitados ---------------------------------- */
    if (body.removeImg === "true" && sub.imgUrl) {
      deletes.push(extractKeyFromUrl(sub.imgUrl));
      updates.imgUrl = null;
    }
    if (body.removeVideo === "true" && sub.videoUrl) {
      deletes.push(extractKeyFromUrl(sub.videoUrl));
      updates.videoUrl = null;
    }
    if (body.removeGalleryImages) {
      const idxs = JSON.parse(body.removeGalleryImages);
      sub.gallery.images.forEach((url, i) => {
        if (idxs.includes(i)) deletes.push(extractKeyFromUrl(url));
      });
      updates["gallery.images"] = sub.gallery.images.filter(
        (_, i) => !idxs.includes(i)
      );
    }
    if (body.removeGalleryVideos) {
      const idxs = JSON.parse(body.removeGalleryVideos);
      sub.gallery.videos.forEach((url, i) => {
        if (idxs.includes(i)) deletes.push(extractKeyFromUrl(url));
      });
      updates["gallery.videos"] = sub.gallery.videos.filter(
        (_, i) => !idxs.includes(i)
      );
    }

    /* 3. Imagen principal -------------------------------------- */
    if (files.imgUrl) {
      const img = files.imgUrl[0];

      if (!isValidImage(img.mimetype)) {
        throw createError(415, `Unsupported image type: ${img.mimetype}`);
      }

      const jimp = await Jimp.read(img.buffer);
      jimp.resize(800, Jimp.AUTO).quality(80);
      const buf = await jimp.getBufferAsync(Jimp.MIME_JPEG);

      const key = `subservices/${id}/img.jpg`;
      const { url } = await AwsUploadFile({ fileName: key, buffer: buf });
      uploadedKeys.push(key);

      updates.imgUrl = url;
    }

    /* 4. Vídeo principal --------------------------------------- */
    if (files.videoUrl) {
      const vid = files.videoUrl[0];

      if (!isValidVideo(vid.mimetype)) {
        throw createError(415, `Unsupported video type: ${vid.mimetype}`);
      }

      const ext = vid.originalname.split(".").pop();
      const key = `subservices/${id}/video.${ext}`;
      const { url } = await AwsUploadFile({
        fileName: key,
        buffer: vid.buffer,
      });
      uploadedKeys.push(key);

      updates.videoUrl = url;
    }

    /* 5. Galería de imágenes ----------------------------------- */
    if (files.galleryImages) {
      const oldImgs = updates["gallery.images"] || sub.gallery.images;
      const newUrls = [];

      for (let i = 0; i < files.galleryImages.length; i++) {
        const file = files.galleryImages[i];

        if (!isValidImage(file.mimetype)) {
          throw createError(415, `Unsupported image type: ${file.mimetype}`);
        }

        const jimp = await Jimp.read(file.buffer);
        jimp.resize(800, Jimp.AUTO).quality(70);
        const buf = await jimp.getBufferAsync(Jimp.MIME_JPEG);

        const key = `subservices/${id}/gallery/img_${Date.now()}_${i}.jpg`;
        const { url } = await AwsUploadFile({ fileName: key, buffer: buf });
        uploadedKeys.push(key);
        newUrls.push(url);
      }
      updates["gallery.images"] = [...oldImgs, ...newUrls];
    }

    /* 6. Galería de vídeos ------------------------------------- */
    if (files.galleryVideos) {
      const oldVids = updates["gallery.videos"] || sub.gallery.videos;
      const newUrls = [];

      for (let i = 0; i < files.galleryVideos.length; i++) {
        const file = files.galleryVideos[i];

        if (!isValidVideo(file.mimetype)) {
          throw createError(415, `Unsupported video type: ${file.mimetype}`);
        }

        const ext = file.originalname.split(".").pop();
        const key = `subservices/${id}/gallery/vid_${Date.now()}_${i}.${ext}`;
        const { url } = await AwsUploadFile({
          fileName: key,
          buffer: file.buffer,
        });
        uploadedKeys.push(key);
        newUrls.push(url);
      }
      updates["gallery.videos"] = [...oldVids, ...newUrls];
    }

    /* 7. Ejecutar borrados solicitados -------------------------- */
    await Promise.all(deletes.map((k) => awsDelete(k)));

    /* 8. Guardar en MongoDB ------------------------------------- */
    const updated = await Subservice.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    /* 🔄 rollback: borrar lo que se subió en esta request */
    if (Array.isArray(uploadedKeys) && uploadedKeys.length) {
      await Promise.all(uploadedKeys.map((k) => awsDelete(k))).catch(
        console.error
      );
    }
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

const NAME_FIELDS = ["name.en", "name.es", "name.pt", "name.fr", "name.de"];

const buildKeywordSegments = (text = "") => {
  const words = text.trim().split(/\s+/);
  const out = [];
  for (let len = words.length; len >= 1; len--) {
    const seg = words.slice(0, len).join(" ");
    if (len === 1 && seg.length < 4) continue; // descarta 1-palabra <4
    out.push(seg);
  }
  return out;
};

export const getAll = async (req, res, next) => {
  console.log("---GET ALL SUBSERVICES---");
  try {
    req.query = mongoJsonToPlain(req.query);
    req.query = normalizeObjectIdReferencesForController(
      req.query,
      USER_REF_PATHS
    );

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    if (page < 1 || limit < 1)
      throw createError(400, "page y limit deben ser enteros positivos");

    const filter = { isActive: true };

    if (req.query.service) {
      filter.service = req.query.service;
    }

    const priceCond = {};
    if (req.query.minPrice !== undefined) {
      const min = Number(req.query.minPrice);
      if (!Number.isNaN(min)) priceCond.$gte = min;
    }
    if (req.query.maxPrice !== undefined) {
      const max = Number(req.query.maxPrice);
      if (!Number.isNaN(max)) priceCond.$lte = max;
    }
    if (Object.keys(priceCond).length) {
      filter["price.category1"] = priceCond;
    }

    if (req.query.keyword) {
      const segments = buildKeywordSegments(req.query.keyword);
      if (segments.length) {
        filter.$or = [];
        segments.forEach((seg) => {
          const regex = new RegExp(seg, "i");
          NAME_FIELDS.forEach((f) => filter.$or.push({ [f]: regex }));
        });
      }
    }

    const options = {
      page,
      limit,
      sort: { updatedAt: -1 },
      populate: { path: "currency" },
      lean: true, // necesario para modificar los docs directamente
    };

    const result = await Subservice.paginate(filter, options);

    if (result.docs.length === 0) {
      return res.status(200).json({ ...result, docs: [] });
    }

    if (req.user && mongoose.Types.ObjectId.isValid(req.user._id)) {
      const subserviceIds = result.docs.map((doc) => doc._id.toString());

      const favorites = await Favorite.find({
        user: req.user._id,
        subservice: { $in: subserviceIds },
        isActive: true,
      }).select("subservice");
      console.log(" losfavorites", favorites.length);

      const favoriteSet = new Set(
        favorites.map((f) => f.subservice.toString())
      );

      result.docs = result.docs.map((doc) => {
        return {
          ...doc,
          isFavorite: favoriteSet.has(doc._id.toString()),
        };
      });
    } else {
      result.docs = result.docs.map((doc) => ({
        ...doc,
        isFavorite: false,
      }));
    }

    res.status(200).json(result);
  } catch (err) {
    if (!(err instanceof Error) || !err.statusCode) {
      err = createError(500, "Error interno del servidor");
    }
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
    }).populate({
      path: "currency",
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
