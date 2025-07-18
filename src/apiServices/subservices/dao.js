import Subservice from "./model.js";
import Product from "../products/model.js";
import Category from "../items/model.js";
import mongoose from "mongoose";
import User from "../users/model.js";
import sharp from "sharp";
import Schedule from "../schedules/model.js";
import { createError } from "../../config/error.js";
import { botcurrency } from "../../services/botcurrency.js";
import { isValidImage, isValidVideo } from "../../config/uploadTypes.js";
import { AwsUploadFile } from "../../services/aws_s3.js";
import { s3 } from "../../services/awsClient.js";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import extractReferencePaths from "../../helpers/extractReferencePaths.js";
const USER_REF_PATHS = extractReferencePaths(Subservice.schema);
import { normalizeObjectIdReferencesForController } from "../../helpers/controllers/normalizeRefValueForController.js";
import mongoJsonToPlain from "../../helpers/mongoJsonToPlain.js";
import Jimp from "jimp";
import envar from "../../config/envar.js";
import { populate } from "dotenv";
import Favorite from "../favorites/model.js";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
dayjs.extend(utc);
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

export const uploadAssets = async (id, files, body) => {
  const uploadedKeys = [];
  try {
    const sub = await Subservice.findById(id);
    if (!sub) throw createError(404, "Subservice no encontrado");

    const updates = {};
    const deletes = [];

    // 1. Borrados solicitados
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

    // 2. Imagen principal
    if (files.imgUrl) {
      const img = files.imgUrl[0];
      if (!isValidImage(img.mimetype)) {
        throw createError(415, `Unsupported image type: ${img.mimetype}`);
      }

      const buf = await sharp(img.buffer)
        .resize({ width: 800 })
        .jpeg({ quality: 80 })
        .toBuffer();

      const key = `subservices/${id}/img.jpg`;
      const { url } = await AwsUploadFile({ fileName: key, buffer: buf });
      uploadedKeys.push(key);
      updates.imgUrl = url;
    }

    // 3. Vídeo principal
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

    // 4. Galería de imágenes
    if (files.galleryImages) {
      const oldImgs = updates["gallery.images"] || sub.gallery.images;
      const newUrls = [];

      for (let i = 0; i < files.galleryImages.length; i++) {
        const file = files.galleryImages[i];
        if (!isValidImage(file.mimetype)) {
          throw createError(415, `Unsupported image type: ${file.mimetype}`);
        }

        const buf = await sharp(file.buffer)
          .resize({ width: 800 })
          .jpeg({ quality: 70 })
          .toBuffer();

        const key = `subservices/${id}/gallery/img_${Date.now()}_${i}.jpg`;
        const { url } = await AwsUploadFile({ fileName: key, buffer: buf });
        uploadedKeys.push(key);
        newUrls.push(url);
      }

      updates["gallery.images"] = [...oldImgs, ...newUrls];
    }

    // 5. Galería de vídeos
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

    // 6. Borrar antiguos
    await Promise.all(deletes.map((k) => awsDelete(k)));

    // 7. Guardar en MongoDB
    const updated = await Subservice.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true }
    );

    return updated;
  } catch (err) {
    // rollback
    if (Array.isArray(uploadedKeys) && uploadedKeys.length) {
      await Promise.all(uploadedKeys.map((k) => awsDelete(k))).catch(
        console.error
      );
    }
    throw err;
  }
};

//Obtener all services con VIDEOS
export const getWithVideos = async () => {
  logger.info("*** GET WITH VIDEOS SUBSERVICE DAO ***");
  try {
    const subservices = await Subservice.find({
      isActive: true,
      videoUrl: { $exists: true, $ne: null },
    });
    // .populate({
    //   path: "currency",
    // });
    return subservices;
  } catch (err) {
    throw err;
  }
};
//Obtener all services con paginate

export const getAll = async (data) => {
  try {
    let {
      keyword,
      minPrice,
      maxPrice,
      currency,
      service,
      page = 1,
      limit = 12,
    } = data;

    page = parseInt(page);
    limit = parseInt(limit);

    const query = { isActive: true }; // ← no filtramos por archived
    if (keyword && typeof keyword === "string" && keyword.trim() !== "") {
      const segments = buildKeywordSegments(keyword);
      query["$or"] = [];

      for (const field of NAME_FIELDS) {
        for (const seg of segments) {
          query["$or"].push({ [field]: { $regex: seg, $options: "i" } });
        }
      }
    }
    if (service) query.service = service;

    const options = {
      populate: [{ path: "service", select: "name" }],
      page,
      limit,
      lean: true,
      sort: { createdAt: -1 },
    };

    const result = await Subservice.paginate(query, options);
    const docs = result.docs;

    const filteredResults = [];

    const applyPriceFilter = currency || minPrice || maxPrice;
    if (currency) currency = currency.toLowerCase();
    if (minPrice) minPrice = parseFloat(minPrice);
    if (maxPrice) maxPrice = parseFloat(maxPrice);

    for (const doc of docs) {
      let match = false;
      let refPrice = null;

      const reducedDoc = {
        _id: doc._id,
        name: doc.name,
        imgUrl: doc.imgUrl,
        duration: doc.duration,
        videoUrl: doc.videoUrl,
        rate: doc.rate,
        rateCount: doc.rateCount,
        gallery: doc.gallery,
        service: { name: doc.service?.name },
        chipData: doc.chipData,
      };

      // ---- TOUR ----
      if (doc.typeService === "tour") {
        const price = doc.tourData?.adultPrice?.[currency];

        const priceMatch =
          !applyPriceFilter ||
          (price !== undefined &&
            (minPrice === undefined || price >= minPrice) &&
            (maxPrice === undefined || price <= maxPrice));

        if (priceMatch) {
          match = true;
          refPrice = doc?.tourData?.adultPrice || null;
          reducedDoc.tourData = {
            adultPrice: doc?.tourData?.adultPrice || null,
          };
        }
      }

      // ---- PRODUCT ----
      if (doc.typeService === "product") {
        const defaultCategory = doc.categories?.find(
          (c) =>
            c.default === true &&
            Array.isArray(c.products) &&
            c.products.length > 0
        );

        const defaultProduct = defaultCategory?.products?.find(
          (p) => p.default === true && p.price
        );

        if (defaultCategory && defaultProduct) {
          const price = defaultProduct.price?.[currency];

          const priceMatch =
            !applyPriceFilter ||
            (price !== undefined &&
              (minPrice === undefined || price >= minPrice) &&
              (maxPrice === undefined || price <= maxPrice));

          if (priceMatch) {
            match = true;
            refPrice = defaultProduct.price;
            reducedDoc.category = {
              type: defaultCategory.type,
              default: true,
              products: [
                {
                  price: defaultProduct.price,
                  default: true,
                },
              ],
            };
          }
        }
      }

      if (match || !applyPriceFilter) {
        reducedDoc.refPrice = refPrice;
        filteredResults.push(reducedDoc);
      }
    }

    const totalFiltered = filteredResults.length;
    const startIndex = (page - 1) * limit;
    const paginatedDocs = filteredResults.slice(startIndex, startIndex + limit);

    return {
      docs: paginatedDocs,
      totalDocs: totalFiltered,
      limit,
      page,
      totalPages: Math.ceil(totalFiltered / limit),
    };
  } catch (err) {
    throw err;
  }
};

//Obtener subService por id
export const getById = async (id) => {
  logger.info("*** GET BY ID SUBSERVICE DAO ***");
  try {
    const subService = await Subservice.findOne({ _id: id })
      .populate({
        path: "service",
        select: "name",
      })
      .lean()
      .exec();

    if (!subService) throw createError(404, "subService not found");

    const response = { ...subService, refPrice: null };

    if (subService.typeService === "tour") {
      if (subService.tourData?.adultPrice) {
        response.refPrice = subService.tourData.adultPrice;
      }
    }

    if (subService.typeService === "product") {
      const defaultCategory = subService.categories?.find(
        (c) =>
          c.default === true &&
          Array.isArray(c.products) &&
          c.products.length > 0
      );

      const defaultProduct = defaultCategory?.products?.find(
        (p) => p.default === true && p.price
      );

      if (defaultProduct?.price) {
        response.refPrice = defaultProduct.price;
      }
    }

    return response;
  } catch (err) {
    throw err;
  }
};

//Obtener all services con paginate segun varias metricas
export const getRecommendedSubservice = async () => {
  logger.info("*** GET RECOMENDED SUBSERVICES DAO ***");
  try {
    const subservices = await Subservice.aggregate([
      { $match: { recommended: true } },
      { $sample: { size: 7 } },
    ]);
    return subservices;
  } catch (err) {
    throw err;
  }
};

export const getProductCategoriesAndProducts = async (subserviceId, date) => {
  try {
    const subservice = await Subservice.findOne({
      _id: subserviceId,
      typeService: "product",
      isActive: true,
    }).lean();

    if (!subservice) {
      throw new Error("Subservicio no encontrado o no es del tipo 'product'");
    }

    // Fecha base
    let baseDate;
    if (subservice.multiple) {
      if (!date) throw new Error("date param is required for multiple=true");
      baseDate = dayjs.utc(date);
    } else {
      baseDate = dayjs.utc(subservice.startTime);
    }

    // IDs
    const allCategoryIds = subservice.categories
      .map((c) => c?.category?.toString())
      .filter(Boolean);

    const allProductIds = subservice.categories.flatMap((cat) =>
      (cat.products || []).map((p) => p?.product?.toString())
    );

    // Categorías válidas
    const validCategories = await Category.find({
      _id: { $in: allCategoryIds },
      isActive: true,
      archived: false,
    })
      .select("title subtitle shortDescription type")
      .lean();

    const categoryMap = {};
    validCategories.forEach((cat) => {
      categoryMap[cat._id.toString()] = cat;
    });

    // Productos válidos
    const rawProducts = await Product.find({
      _id: { $in: allProductIds },
      isActive: true,
    }).lean();

    const validProductsMap = {};
    rawProducts.forEach((prod) => {
      const limitHours = prod.limitTime || 0;
      const limitDate = baseDate.subtract(limitHours, "hour");
      const isValid = !prod.hasLimitTime || dayjs().isBefore(limitDate);
      if (isValid) {
        validProductsMap[prod._id.toString()] = prod;
      }
    });

    // Construcción
    const cleanCategories = subservice.categories
      .map((cat) => {
        const catId = cat.category?.toString();
        const realCat = categoryMap[catId];
        if (!realCat) return null;

        const cleanProducts = (cat.products || [])
          .map((p) => {
            const prodId = p?.product?.toString();
            const baseProduct = validProductsMap[prodId];
            if (!baseProduct) return null;

            return {
              ...baseProduct,
              price: p.price || baseProduct.price,
              default: p.default || false,
            };
          })
          .filter(Boolean);

        return {
          category: realCat,
          products: cleanProducts,
        };
      })
      .filter(Boolean);

    return cleanCategories;
  } catch (error) {
    console.error("Error al obtener categorías y productos:", error);
    throw error;
  }
};

///
////

// controllers/subservice.js
export const getAllByService = async (req, res, next) => {
  logger.info("*** GET ALL SUBSERVICES (small) BY SERVICE ---");
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

//Obtener todos los subservicios agrupados por servicios:

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
    info = await Schedule.findOne({
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
