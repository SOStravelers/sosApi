import User from "../models/user.js";
import Jimp from "jimp";
import mongoose from "mongoose";
import { AwsUploadFile } from "../services/aws_s3.js";
import fs from "fs";
import path from "path";
import { notFoundError, createError, missingData } from "../config/error.js";
import {
  getTokenByRefresh,
  refreshTokenGen,
  accessTokenGen,
  tokenEmail,
  decode,
} from "../config/auth.js";
import staticDir from "../config/staticPath.js";

// TESTING IMAGENES//
const imagePath = path.join(staticDir, "img", "casa.jpeg");
const imageBuffer = fs.readFileSync(imagePath);
// Convierte la imagen en base64
const base64Image = imageBuffer.toString("base64");
// Crea un objeto simulado de solicitud (req) con la imagen base64
const fakeReq = {
  file: {
    buffer: Buffer.from(base64Image, "base64"), // Convierte la base64 de nuevo a un buffer
    originalname: "sostravel.jpg", // Establece un nombre de archivo de prueba
  },
  // Otras propiedades de req que puedas necesitar para tu función
  body: {
    // ...
  },
};
function procesarNombre(nombre) {
  const partes = nombre.split(" "); // Dividir el string en partes utilizando el espacio como separador

  if (partes.length > 2) {
    // Si hay más de dos partes, unir las partes después de la primera
    const restoDelNombre = partes.slice(1).join(" ");
    return [partes[0], restoDelNombre];
  } else {
    // Si no hay más de dos partes, devolver el nombre original
    return [nombre];
  }
}
//----FUNCTIONS ROUTES----//
//Create user personal/workers/business
export const create = async (req, res, next) => {
  console.log("---CREATE NEW USER-WORKER-BUSINESS---");
  let user = new User(req.body);
  user.email = user.email.toLowerCase().trim();
  User.findOne({ email: user.email }).exec(async (err, theUser) => {
    if (theUser) {
      let error = createError(409, "This email is already in use");
      return res.status(409).json(error);
    } else {
      user.type = req.body.type || "personal";
      user.personalData.name.first =
        user.personalData.name.first.charAt(0).toUpperCase() +
        user.personalData.name.first.slice(1).toLowerCase().trim();
      user.personalData.name.last =
        user.personalData.name.last.charAt(0).toUpperCase() +
        user.personalData.name.last.slice(1).toLowerCase().trim();

      if (user.password) {
        user.password = User.hash(user.password);
      }
      if (user.username && user.username.length > 0) {
        let exists = await User.findOne({
          username: user.username,
        }).exec();
        if (exists) {
          // user.username= mongoose.Types.ObjectId()
          user.username = user.email
            .toLowerCase()
            .trim()
            .replace(/@/g, "_")
            .replace(".", "_");
        } else {
          user.username = user.username.toLowerCase().trim();
        }
      } else {
        user.username = user.email
          .toLowerCase()
          .trim()
          .replace(/@/g, "_")
          .replace(".", "_");
      }
      try {
        console.log("saving...", user);
        const newUser = await user.save();
        console.log("el item", newUser);
        res.json(newUser);
        // user.save((err, item) => {
        //   if (err) next(err);
        //   res.send("hola")
        // });
      } catch (err) {
        next(err);
      }
    }
  });
};
//Register user
export const registerEmail = async (req, res, next) => {
  console.log(
    "============= REGISTER NEW USER AND CREATE TOKEN   ============="
  );
  console.log(req.body);
  const accessTime = req.body.accessTime ? req.body.accessTime : "1d";
  const refreshTime = req.body.refreshTime ? req.body.refreshTime : "30d";
  req.body.accessTime ? delete req.body.accessTime : "";
  req.body.refreshTime ? delete req.body.refreshTime : "";
  let theEmail = req.body.email.toLowerCase().trim();
  User.findOne({ email: theEmail }).exec(async (err, theUser) => {
    if (theUser) {
      let error = createError(409, "This email is already in use");
      return res.status(409).json(error);
    } else {
      let user = new User(req.body);
      if (req.body.password) {
        user.password = User.hash(req.body.password);
      }
      user.type = req.body.type || "personal";
      let name = procesarNombre(req.body.name);
      console.log("name", name);
      if (name.length > 1) {
        user.personalData.name.first =
          name[0].charAt(0).toUpperCase() +
          name[0].slice(1).toLowerCase().trim();
        user.personalData.name.last =
          name[1].charAt(0).toUpperCase() +
          name[1].slice(1).toLowerCase().trim();
      } else {
        user.personalData.name.first =
          name[0].charAt(0).toUpperCase() +
          name[0].slice(1).toLowerCase().trim();
      }
      user.email = theEmail;
      if (user.username && user.username.length > 0) {
        let exists = await User.findOne({
          username: user.username,
        }).exec();
        if (exists) {
          // user.username= mongoose.Types.ObjectId()
          user.username = user.email
            .toLowerCase()
            .trim()
            .replace(/@/g, "_")
            .replace(".", "_");
        } else {
          user.username = user.username.toLowerCase().trim();
        }
      } else {
        user.username = user.email
          .toLowerCase()
          .trim()
          .replace(/@/g, "_")
          .replace(".", "_");
      }
      try {
        console.log("saving...", user);
        const newUser = await user.save();
        console.log("el item", newUser);
        let userToCreateToken = {
          _id: newUser._id,
          username: newUser.username,
        };
        let userRefresh = {
          _id: newUser._id,
        };
        res.json({
          access_token: accessTokenGen(userToCreateToken, true, accessTime),
          refresh_token: refreshTokenGen(userRefresh, refreshTime),
          user: newUser,
        });
      } catch (err) {
        next(err);
      }
    }
  });
};
//Login user by email
export const loginEmail = async (req, res, next) => {
  console.log(
    "============= LOGIN USER BY EMAIL AND REFRESH TOKEN   ============="
  );
  let { email, password } = req.body;
  email = email.toLowerCase().trim();
  User.findOne({ email })
    // .populate("users")
    .exec(async (err, user) => {
      if (err) return next(err);
      if (!user) {
        let error = createError(401, "User not found or invalid credentials");
        return res.status(401).json(error);
      }
      const isValid =
        typeof password !== "undefined"
          ? await User.validPassword(user._id.toString(), password)
          : false;
      if (!isValid) {
        let error = createError(404, "User not found or invalid credentials");
        return res.status(404).json(error);
      }
      user.lastLogin = Date.now();
      user.save(async (err, user) => {
        if (err) next(err);
        delete user.password;
        // USER (TO CREATE TOKEN)
        let userToCreateToken = {
          _id: user._id,
          username: user.username,
        };
        console.log(user);
        res.status(200).json({
          msg: "login success",
          access_token: accessTokenGen(userToCreateToken, true),
          refresh_token: refreshTokenGen(userToCreateToken),
          user,
        });
      });
    });
};
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
//Obtener usuario por ID
export const getById = async (req, res, next) => {
  console.log("---GET USER BY ID---");
  User.findOne({ _id: req.params.id }).exec((err, user) => {
    console.log(err, user);
    if (err) {
      let error = createError(400, "Invalid ID format");
      console.log(error);
      return res.status(400).json(error);
    } else if (user) {
      res.send(user);
    } else {
      let error = createError(404, "User not found");
      return res.status(401).json(error);
    }
  });
};
//Actualizar data de un usuario por ID
export const updateOne = (req, res, next) => {
  console.log("---UPDATE USER---");
  let data = req.body;
  User.findOneAndUpdate(
    {
      _id: req.params.id,
    },
    data,
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
    console.log("gato", req.file);
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
    console.log("---UPLOAD GALLERY FOTO---");
    console.log("params", req.params.number);
    console.log("gato", req.file);
    let paramsNumber = Number(req.params.number);
    //VALIDACION PARA SOLO SUBIR UN MAXIMO DE 6 FOTOS
    if (!paramsNumber || paramsNumber >= 7 || paramsNumber == NaN) {
      paramsNumber = 1;
    }
    let file = req.file ? req.file : fakeReq.file;
    Jimp.read(file.buffer)
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
