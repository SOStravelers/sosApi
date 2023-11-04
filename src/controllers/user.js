import User from "../models/user.js";
import Jimp from "jimp";

import { n64tobuffer } from "../utils/externalFiles.js";
import { AwsUploadFile } from "../services/aws_s3.js";
import { procesarNombre } from "../utils/data.js";
import { fakeReq } from "../utils/externalFiles.js";

import { notFoundError, createError, missingData } from "../config/error.js";
import { refreshTokenGen, accessTokenGen } from "../middleware/auth.js";

//Obtener usuarios con paginate por tipos y activados
export const getUsers = async (req, res, next) => {
  console.log("---GET USERS---");
  let body = {};
  Object.assign(body, req.query);
  console.log("query", body);
  let options = {
    // populate,
    // select,
    page: body.page || 1,
    limit: body.limit || 10,
    sort: { updatedAt: -1 },
  };
  let query = {};
  body.type ? (query.type = body.type) : "";
  body.isActive ? (query.isActive = body.isActive) : "";
  try {
    User.paginate(query, options, (err, items) => {
      if (err) return next(err);
      res.send(items);
    });
  } catch (err) {
    next(err);
  }
};
//Obtener usuarios business con paginate por servicios
export const getBusinesByService = async (req, res, next) => {
  console.log("---GET BUSINESS BY SERVICE---", req.query);
  let body = {};
  Object.assign(body, req.query);
  try {
    const options = {
      page: body.page || 1,
      limit: body.limit || 10,
    };

    const query = {
      "businessData.services.service": body.id, // Filtra por la ID del servicio en el array
      "businessData.services.isActive": true, // Filtra por la ID del servicio en el array
      isActive: true, // Condición isActive=true
      type: "business", // Condición type="business"
    };
    console.log("query", query);
    const result = await User.paginate(query, options);
    res.send(result);
  } catch (error) {
    console.error("Error al buscar usuarios:", error);
    next(error);
  }
};
//Obtener usuarios business con paginate por nombre
export const findbusinessbyname = async (req, res, next) => {
  console.log("---FIND BUSINESS BY NAME---");
  let body = {};
  Object.assign(body, req.query);
  body.name = decodeURIComponent(body.name);
  console.log("query", body);
  const options = {
    page: body.page || 1,
    limit: body.limit || 10,
  };
  let query = {
    $and: [
      {
        $or: [
          {
            "businessData.name": {
              $regex: body.name,
              $options: "i",
            },
          },
        ],
      },
      {
        type: "business",
      },
      {
        isActive: "true",
      },
      {
        "businessData.services.isActive": true,
      },
      {
        "businessData.services.id": body.service,
      },
    ],
  };
  console.log(query["$and"][0]["$or"][0]);
  try {
    User.paginate(query, options, (err, users) => {
      console.log(users);
      if (err) {
        let error = createError(400, "not users found");
        console.log(error);
        return res.status(400).json(error);
      } else {
        res.status(200).send(users);
      }
    });
  } catch (err) {
    next(err);
  }
};

//Actualizar data de un usuario por ID
export const updateOne = (req, res, next) => {
  console.log("---UPDATE USER---", req.body);
  let { user } = req.body;
  User.findOneAndUpdate(
    {
      _id: req.params.id,
    },
    user,
    {
      new: true,
    }
  ).exec((err, user) => {
    if (err) {
      let error = createError(400, "Invalid ID format");
      console.log(error);
      return res.status(400).json(error);
    } else {
      res.send(user);
    }
  });
};
//Eliminar usuario por ID
export const deleteById = (req, res, next) => {
  console.log("---DELETE USER---");
  User.findOneAndRemove({
    _id: req.params.id,
  }).exec((err, user) => {
    if (err) {
      let error = createError(400, "Invalid ID format");
      console.log(error);
      return res.status(400).json(error);
    } else {
      res.send({ user, message: "user deleted" });
    }
  });
};
//Activar o desactivar multiples usuarios
export const activateMany = (req, res, next) => {
  console.log(req.body);
  User.updateMany(
    { _id: { $in: req.body.users } },
    { isActive: req.body.isActive ? req.body.isActive : false }
  ).exec((err, data) => {
    if (err) next(err);
    res.send(data);
  });
  // res.send("buena")
};
//crear o cambiar foto de perfil worker
export const profilePhoto = async (req, res, next) => {
  try {
    console.log("---UPLOAD PROFILE FOTO---");
    let file = req.file ? req.file : fakeReq.file;
    let elbuffer = await n64tobuffer(req.body.file);
    console.log("elbuffer", elbuffer);
    // Jimp.read(file.buffer)
    Jimp.read(elbuffer)
      .then(async (image) => {
        console.log("imafen", image);
        image
          .resize(320, Jimp.AUTO) // resize
          .quality(70); // set JPEG quality
        let imagenReducida = await image.getBufferAsync(Jimp.MIME_JPEG);
        console.log("imagenReducida", imagenReducida);
        let lastIndex = file.originalname.lastIndexOf(".");
        let name = file.originalname.slice(0, lastIndex);
        let ext = file.originalname.slice(lastIndex + 1);
        let resp = await AwsUploadFile({
          fileName: `users/${req.user._id}/profile/${req.user._id}.${ext}`,
          buffer: imagenReducida,
        });
        console.log("respuesta", resp);
        if (resp.results.$metadata.httpStatusCode == 200) {
          let user = await User.findByIdAndUpdate(
            req.user._id,
            {
              "img.imgUrl": resp.url,
            },
            {
              new: true,
            }
          )
            .select("img")
            .exec();
          console.log("respuesta", user);
          res.send(user);
        } else {
          let error = createError(400, "Create error");
          return res.status(400).json(error);
        }
      })
      .catch((err) => {
        console.error(err);
      });
  } catch (err) {
    next(err);
  }
};
//crear o cambiar fotos de galeria worker
export const galleryPhoto = async (req, res, next) => {
  try {
    console.log("---UPLOAD GALLERY FOTO---", req.params.number);
    console.log("gato", req.file);
    let paramsNumber = Number(req.params.number);
    //VALIDACION PARA SOLO SUBIR UN MAXIMO DE 6 FOTOS
    if (!paramsNumber || paramsNumber >= 7 || paramsNumber == NaN) {
      paramsNumber = 1;
    }
    let file = req.file ? req.file : fakeReq.file;
    let elbuffer = await n64tobuffer(req.body.file);
    //Jimp.read(file.buffer)
    Jimp.read(elbuffer)
      .then(async (image) => {
        image
          .resize(320, Jimp.AUTO) // resize
          .quality(70); // set JPEG quality
        let imagenReducida = await image.getBufferAsync(Jimp.MIME_JPEG);
        let lastIndex = file.originalname.lastIndexOf(".");
        let name = file.originalname.slice(0, lastIndex);
        let ext = file.originalname.slice(lastIndex + 1);
        let resp = await AwsUploadFile({
          fileName: `users/${req.user._id}/gallery/photo${paramsNumber}.${ext}`,
          buffer: imagenReducida,
        });
        if (resp.results.$metadata.httpStatusCode == 200) {
          let user = await User.findOne({
            _id: req.user._id.toString(),
          }).select("img");
          const gallery = user.img.gallery;
          // if (paramsNumber <= gallery.length) {

          // } else {
          //   gallery.push(resp.url);
          // }
          gallery[paramsNumber - 1] = resp.url;

          let updateUser = await User.findByIdAndUpdate(
            req.user._id,
            {
              "img.gallery": gallery,
            },
            {
              new: true,
            }
          )
            .select("img")
            .exec();
          console.log("respuesta", user);
          res.send(updateUser);
        } else {
          let error = createError(400, "Create error");
          return res.status(400).json(error);
        }
      })
      .catch((err) => {
        console.error(err);
      });
  } catch (err) {
    next(err);
  }
};

// función para crear contraseña para usuario que no tienen creada
export const changePassword = async (req, res, next) => {
  try {
    console.log("createPassword");
    const id = req.params.id;
    const newPassword = req.body.password;
    if (!newPassword) {
      let error = createError(400, "a field is missing");
      res.status(404).json(error);
      throw err;
    } else {
      const encryptPassword = await User.hash(newPassword);
      const updatedUser = await User.findOneAndUpdate(
        { _id: id }, // Filtro para encontrar el usuario por su ID
        {
          password: encryptPassword,
          isActive: true,
          "security.hasPassword": true,
          "security.updatedAt": new Date(),
        },
        { new: true } // Opcional: para obtener el documento actualizado como resultado
      ).select("isActive isValidate security email personalData _id img");

      if (!updatedUser) {
        let error = createError(500, "Internal Server Error");
        res.status(500).json(error);
      }
      let userToCreateToken = {
        _id: updatedUser._id,
        username: updatedUser.username,
      };
      let userRefresh = {
        _id: updatedUser._id,
      };
      res.json({
        access_token: accessTokenGen(userToCreateToken, true),
        refresh_token: refreshTokenGen(userToCreateToken),
        user: updatedUser,
      });
    }
  } catch (err) {
    console.log(err);
    let error = createError(500, "Internal Server Error");
    res.status(500).json(error);
  }
};
