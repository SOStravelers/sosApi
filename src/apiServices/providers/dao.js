import { createError } from "../../config/error.js";
import Provider from "./model.js";
import sharp from "sharp";
import { AwsUploadFile } from "../../services/aws_s3.js";
import { isValidImage } from "../../config/uploadTypes.js";
// Crear proveedor
export const createProvider = async (data, files) => {
  logger.info("*** CREATE PROVIDER DAO ***");
  try {
    const findProvider = await Provider.findOne({ email: data.email });

    if (findProvider) throw createError(400, "Email already exists");

    if (files.imgUrl) {
      const img = files.imgUrl[0];
      if (!isValidImage(img.mimetype)) {
        throw createError(415, `Unsupported image type: ${img.mimetype}`);
      }

      const buf = await sharp(img.buffer)
        .resize({ width: 800, withoutEnlargement: true })
        .jpeg({ quality: 70 })
        .toBuffer();

      const key = `providers/${data.email}/img.jpg`;
      const { url } = await AwsUploadFile({ fileName: key, buffer: buf });
      data.imgUrl = url;
    }

    let provider = new Provider(data);
    provider.isActive = true;

    const newProvider = await provider.save();
    return newProvider;
  } catch (err) {
    throw err;
  }
};
// Actualizar data del proveedor
export const updateDataProvider = async (id, data) => {
  logger.info("*** UPDATE PROVIDER DAO ***");
  try {
    delete data._id;
    delete data.imgUrl;
    const provider = await Provider.findOneAndUpdate(
      {
        _id: id,
      },
      data,
      {
        new: true,
      }
    ).exec();
    if (!provider) throw createError(404, "Provider not found");
    return provider;
  } catch (err) {
    throw err;
  }
};
// Encontrar proveedor por id
export const getProviderById = async (id) => {
  logger.info("*** GET PROVIDER BY ID DAO ***");
  try {
    const provider = await Provider.findOne({ _id: id }).exec();
    if (!provider) throw createError(404, "Provider not found");
    return provider;
  } catch (err) {
    throw err;
  }
};
// Actualizar imagen del proveedor
export const updateImgProvider = async (id, files) => {
  logger.info("*** UPDATE IMG PROVIDER DAO ***");
  try {
    const findUser = await Provider.findOne({ _id: id });
    if (!findUser) throw createError(404, "Provider not found");

    let imgUrl = findUser.imgUrl;

    if (files.imgUrl) {
      const img = files.imgUrl[0];
      if (!isValidImage(img.mimetype)) {
        throw createError(415, `Unsupported image type: ${img.mimetype}`);
      }

      const buf = await sharp(img.buffer)
        .resize({ width: 800, withoutEnlargement: true })
        .jpeg({ quality: 70 })
        .toBuffer();

      const key = `providers/${id}/img.jpg`;
      const { url } = await AwsUploadFile({ fileName: key, buffer: buf });
      imgUrl = url;
    }
    if (!imgUrl) throw createError(404, "Image not found");
    const provider = await Provider.findOneAndUpdate(
      {
        _id: id,
      },
      { imgUrl: imgUrl },
      {
        new: true,
      }
    ).exec();
    return provider;
  } catch (err) {
    throw err;
  }
};
// cambiar is Active del proveedor
export const activeProvider = async (id, state) => {
  logger.info("*** ACTIVE PROVIDER DAO ***");
  try {
    const provider = await Provider.findOneAndUpdate(
      {
        _id: id,
      },
      { isActive: state },
      {
        new: true,
      }
    ).exec();
    return provider;
  } catch (err) {
    throw err;
  }
};
