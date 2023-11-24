import User from "../models/user.js";
import Schedule from "../models/schedule.js";
import envar from "../config/envar.js";
import { sendEmailTemplate } from "../services/aws_ses.js";
import { createError } from "../config/error.js";
import { refreshTokenGen, accessTokenGen } from "../middleware/auth.js";
import { procesarNombre } from "../utils/data.js";
// import logger from "../config/logger.js";

import {
  generarNumero4Digitos,
  generarCodigoAleatorio,
} from "../utils/code.js";

//Create user personal/workers/business
export const createUser = async (req, res, next) => {
  console.log("--- CREATE NEW USER-WORKER-BUSINESS ---");
  try {
    let user = new User(req.body);
    user.email = user.email.toLowerCase().trim();
    const theUser = await User.findOne({ email: user.email }).exec();
    if (theUser) {
      let err = createError(409, "This email is already in use");
      next(err);
      return res.status(409).json(err);
    }
    user.type = req.body.type || "personal";
    let name = procesarNombre(req.body.name);
    if (name.length > 1) {
      user.personalData.name.first =
        name[0].charAt(0).toUpperCase() + name[0].slice(1).toLowerCase().trim();
      user.personalData.name.last =
        name[1].charAt(0).toUpperCase() + name[1].slice(1).toLowerCase().trim();
    } else {
      user.personalData.name.first =
        name[0].charAt(0).toUpperCase() + name[0].slice(1).toLowerCase().trim();
    }

    if (user.password) {
      user.password = User.hash(user.password);
      user.isActive = true;
      user.security.hasPassword = true;
      user.security.updatedAt = new Date();
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
    console.log("saving user...");
    const newUser = await user.save();
    res.json(newUser);
  } catch (err) {
    if (!err.statusCode) {
      err = create();
    }
    next(err);
    res.status(500).json({ message: "Internal server error." });
  }
};
//Register user
export const registerEmail = async (req, res, next) => {
  global.logger.info({
    message: "--- REGISTER NEW USER AND CREATE TOKEN ---",
  });
  try {
    const accessTime = req.body.accessTime ? req.body.accessTime : "1d";
    const refreshTime = req.body.refreshTime ? req.body.refreshTime : "30d";
    req.body.accessTime ? delete req.body.accessTime : "";
    req.body.refreshTime ? delete req.body.refreshTime : "";
    let theEmail = req.body.email.toLowerCase().trim();
    let theUser = await User.findOne({ email: theEmail }).exec();
    if (theUser) {
      throw createError(409, "This email is already in use");
    }
    let user = new User(req.body);
    if (req.body.password) {
      user.password = User.hash(req.body.password);
      user.isActive = true;
      user.security.hasPassword = true;
      user.security.updatedAt = new Date();
    }
    user.type = req.body.type || "personal";
    let name = procesarNombre(req.body.name);
    if (name.length > 1) {
      user.personalData.name.first =
        name[0].charAt(0).toUpperCase() + name[0].slice(1).toLowerCase().trim();
      user.personalData.name.last =
        name[1].charAt(0).toUpperCase() + name[1].slice(1).toLowerCase().trim();
    } else {
      user.personalData.name.first =
        name[0].charAt(0).toUpperCase() + name[0].slice(1).toLowerCase().trim();
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
    await user.save();
    const newUser = await User.findOne({ email: user.email }).select(
      "about email img language personalData type username workerData _id security.hasPassword"
    );
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
};
//Login user by email
export const loginEmail = async (req, res, next) => {
  global.logger.info({
    message: "--- LOGIN USER BY EMAIL AND REFRESH TOKEN ---",
  });
  try {
    let { email, password } = req.body;
    email = email.toLowerCase().trim();
    const user = await User.findOne({ email }).exec();
    const msg401 = "User not found or invalid credentials";
    if (!user) {
      throw createError(401, msg401);
    }
    if (!user.security.hasPassword) {
      throw createError(400, "has Not password");
    }
    const isValid =
      typeof password !== "undefined"
        ? await User.validPassword(user._id.toString(), password)
        : false;
    if (!isValid) {
      throw createError(401, msg401);
    }
    user.lastLogin = Date.now();
    user.lastLoginType = "email";
    const updatedUser = await User.findOneAndUpdate(
      { email },
      { lastLogin: Date.now(), lastLoginType: "email" },
      { new: true }
    ).select(
      "about email img type language personalData username workerData _id security.hasPassword"
    );
    delete updatedUser.password;
    let userToCreateToken = {
      _id: updatedUser._id,
      username: updatedUser.username,
    };
    res.send({
      msg: "login success",
      access_token: accessTokenGen(userToCreateToken, true),
      refresh_token: refreshTokenGen(userToCreateToken),
      user: updatedUser,
    });
  } catch (err) {
    next(err);
  }
};
//login y registro por google
export const loginGoogle = async (req, res, next) => {
  global.logger.info({
    message: "--- LOGIN/REGISTER USER BY GOOGLE AND REFRESH TOKEN ---",
  });
  try {
    let { email, name, image } = req.body;
    console.log("IMAGE", image);
    email = email.toLowerCase().trim();
    var user = await User.findOne({ email }).exec();
    User.findOne({ email }).exec();
    let newValue = false;
    if (!user) {
      console.log("nuevo");
      newValue = true;
      user = new User();
      user.email = email;
      var partes = name.split(" ");
      var names = [partes[0], partes.slice(1).join(" ")];
      user.personalData.name.first = names[0];
      user.personalData.name.last = names[1];
      !user.type ? (user.type = "personal") : "";
      user.username = user.email
        .toLowerCase()
        .trim()
        .replace(/@/g, "_")
        .replace(".", "_");
    }
    !user.img.imgUrl ? (user.img.imgUrl = image) : "";
    user.lastLogin = Date.now();
    user.lastLoginType = "google";
    user.isActive = true;
    user.isValidate = true;
    if (newValue) {
      console.log("new");
      await user.save();
      const newUser = await User.findOne({ email: user.email }).select(
        "about email img language personalData type username workerData _id security.hasPassword"
      );
      let userToCreateToken = {
        _id: newUser._id,
        username: newUser.username,
      };
      let userRefresh = {
        _id: newUser._id,
      };
      res.json({
        access_token: accessTokenGen(userToCreateToken, true),
        refresh_token: refreshTokenGen(userRefresh),
        user: newUser,
      });
    } else {
      console.log("obteniendo");
      let newUser = await User.findByIdAndUpdate(user._id, user, {
        new: true,
      }).select(
        "about email img language personalData username type workerData _id security.hasPassword"
      );
      console.log("caca", newUser.type);
      delete newUser.password;
      // USER (TO CREATE TOKEN)
      let userToCreateToken = {
        _id: newUser._id,
        username: newUser.username,
      };
      res.status(200).json({
        msg: "login success",
        access_token: accessTokenGen(userToCreateToken, true),
        refresh_token: refreshTokenGen(userToCreateToken),
        user: newUser,
      });
    }
  } catch (err) {
    next(err);
  }
};
// función para crear contraseña para usuario que no tienen creada
export const createPassword = async (req, res, next) => {
  global.logger.info({
    message: "--- CREATE PASSWORD ---",
  });
  try {
    const id = req.params.id;
    const newPassword = req.body.password.trim();
    if (!newPassword) {
      throw createError(400, "a field is missing");
    }
    const encryptPassword = await User.hash(newPassword);
    const updatedUser = await User.findOneAndUpdate(
      { _id: id },
      {
        password: encryptPassword,
        isActive: true,
        "security.hasPassword": true,
        "security.updatedAt": new Date(),
      },
      { new: true }
    ).select("isActive _id isValidate security email personalData _id img");

    let userToCreateToken = {
      _id: updatedUser._id,
      username: updatedUser.username,
    };
    let userRefresh = {
      _id: updatedUser._id,
    };
    res.json({
      access_token: accessTokenGen(userToCreateToken, true),
      refresh_token: refreshTokenGen(userRefresh),
      user: updatedUser,
    });
  } catch (err) {
    next(err);
  }
};
//Obtener usuario por ID
export const getById = async (req, res, next) => {
  console.log("--- GET USER BY ID ---", req.params);
  try {
    const user = await User.findOne({ _id: req.params.id })
      .select(
        "about email img language personalData username workerData _id security.hasPassword"
      )
      .populate({
        path: "workerData.services.id",
        select: "name _id",
      })
      .populate({
        path: "workerData.services.subServices",
        select: "name _id",
      });
    console.log(user);
    if (!user) {
      let err = createError(404, "User not found");
      next(err);
      return res.status(404).json(err);
    } else {
      res.send(user);
    }
  } catch (err) {
    next(err);
    res.status(500).json({ message: "Internal server error." });
  }
};
//Obtener usuario por ID
export const getBussinesId = async (req, res, next) => {
  console.log("--- GET USER  BUSINESS BY ID ---", req.params);
  try {
    const user = await User.findOne({ _id: req.params.id, type: "business" })
      .select(
        "about email  img language personalData username  businessData.services businessData.location businessData.name _id "
      )
      .populate({
        path: "businessData.services.service",
        select: "name _id",
      });
    console.log("el user", user ? user.businessData : null);
    if (!user) {
      let err = createError(404, "User not found");
      next(err);
      return res.status(404).json(err);
    } else {
      res.send(user);
    }
  } catch (err) {
    next(err);
    res.status(500).json({ message: "Internal server error." });
  }
};
export const getWorkerId = async (req, res, next) => {
  console.log("--- GET USER Worker BY ID ---", req.params);
  try {
    const user = await User.findOne({ _id: req.params.id, type: "worker" })
      .select(
        "about email img language personalData username workerData _id _id "
      )
      .populate({
        path: "workerData.services.id",
        select: "name _id",
      })
      .populate({
        path: "workerData.services.subServices",
        select: "name _id",
      });
    console.log(user);
    if (!user) {
      let err = createError(404, "User not found");
      next(err);
      return res.status(404).json(err);
    } else {
      res.send(user);
    }
  } catch (err) {
    next(err);
    res.status(500).json({ message: "Internal server error." });
  }
};

//Verificar si existe el email
export const verifyEmail = async (req, res, next) => {
  console.log("--- Find Email ---");
  try {
    const email = req.body.email;
    let checkUser = await User.findOne({
      email: email.toLowerCase().trim(),
    }).exec();
    if (checkUser) {
      let err = createError(409, "The email is not available.");
      next(err);
      return res.status(409).json(err);
    } else {
      return res.status(200).json({ message: "The email is available" });
    }
  } catch (err) {
    next(err);
    res.status(500).json({ message: "Internal server error." });
  }
};

//Función para encontrar usuario por email
export const findByEmail = async (req, res, next) => {
  console.log("--- FIND BY EMAIL ---");
  try {
    var text = decodeURIComponent(req.body.email);
    const email = text.trim().toLowerCase();
    const user = await User.findOne({
      email: email,
    }).select("isActive isValidate security email personalData _id");
    if (!user) {
      let err = createError(404, "email not found");
      next(err);
      return res.status(404).json(err);
    } else {
      res.send(user);
    }
  } catch (err) {
    next(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
// envia correo con codigo de validación por tiempo definido
export const sendValidationCode = async (req, res, next) => {
  console.log("--- SEND VALIDATION CODE ---");
  try {
    const { id, email } = req.query;
    console.log(id, email);
    const user = await User.findById(id).exec();
    if (!user) {
      let err = createError(404, "User not found or invalid credentials");
      next(err);
      return res.status(404).json(err);
    }
    const code = generarNumero4Digitos();
    const urlCode = generarCodigoAleatorio(30);
    const digitosArray = Array.from(String(code), Number);
    const expTime = 5;
    const date = new Date();
    console.log(date);
    const updatedUser = await User.findOneAndUpdate(
      { _id: user._id }, // Filtro para encontrar el usuario por su ID
      {
        "validation.code": code,
        "validation.urlcode": urlCode,
        "validation.expTime": expTime,
        "validation.time": date,
      },
      { new: true } // Opcional: para obtener el documento actualizado como resultado
    );

    const params = {
      Source: envar().SES_EMAIL_AUTH, // Dirección de correo verificada con AWS
      Destination: {
        ToAddresses: [updatedUser.email], // Lista de destinatarios
        CcAddresses: [envar().SES_EMAIL_AUTH], // Lista de copias
      },
      Template: "validationCode", // Nombre del template a usar
      SubjectPart: "wena",
      TemplateData: JSON.stringify({
        number1: digitosArray[0],
        number2: digitosArray[1],
        number3: digitosArray[2],
        number4: digitosArray[3],
      }),
    };
    await sendEmailTemplate(params);
    res.send({ msg: "code sent" });
  } catch (err) {
    if (err instanceof Error && err.$metadata) {
      next(err);
      res
        .status(err.$metadata.httpStatusCode)
        .json({ error: err.Error.message });
    } else {
      next(err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
};
//validar codigo para validar correo
export const verifyValidationCode = async (req, res, next) => {
  console.log("--- VERIFY VALIDATION CODE ---");
  try {
    console.log(req.body.code);
    const number = req.body.code;
    const id = req.params.id;
    const user = await User.findById(id).exec();
    if (!user) {
      let err = createError(404, "User not found or invalid credentials");
      next(err);
      return res.status(404).json(err);
    }
    const diferenciaEnMilisegundos = new Date() - user.validation.time;
    const diferenciaEnMinutos = diferenciaEnMilisegundos / 60000;
    console.log(diferenciaEnMinutos);
    if (
      diferenciaEnMinutos < user.validation.expTime &&
      number == user.validation.code
    ) {
      const updatedUser = await User.findOneAndUpdate(
        { _id: user._id },
        {
          isValidate: true,
          isActive: true,
        },
        { new: true }
      ).select("isActive isValidate security email personalData _id");

      // Realiza cualquier operación adicional aquí, como la conexión a SES AWS
      res.send(updatedUser);
    } else {
      let err = createError(
        400,
        "Authentication failed: Incorrect or expired code"
      );
      next(err);
      return res.status(400).json(err);
    }
  } catch (err) {
    next(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

//Obtener usuarios con paginate por tipos y activados
export const getUsers = async (req, res, next) => {
  console.log("--- GET USERS ---");
  try {
    let body = {};
    Object.assign(body, req.query);
    console.log("query", body);
    let options = {
      // populate,
      select:
        "personalData img _id username businessData.name businessData.location",
      page: body.page || 1,
      limit: body.limit || 10,
      sort: { updatedAt: -1 },
    };
    let query = {
      // Agregar una condición para excluir los documentos con type="personal"
      type: { $ne: "personal" },
    };
    body.type ? (query.type = body.type) : "";
    body.isActive ? (query.isActive = body.isActive) : "";

    User.paginate(query, options, (err, items) => {
      if (err) return next(err);
      res.send(items);
    });
  } catch (err) {
    next(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

//Entrega trabajadores segun hora solicitada y subservicio solicitado
export const workerByTimeAndService = async (req, res, next) => {
  try {
    const { startTime, day, subservice, page, limit } = req.body;
    const query = {
      $and: [
        { isActive: true },
        { "workerData.isActive": true },
        { "workerData.services.subServices": subservice },
      ],
    };
    const options = {
      populate: {
        path: "workerData.services.id",
        select: "name",
      },
      select: "personalData workerData img _id username",
      page: page || 1,
      limit: limit || 100,
      sort: { updatedAt: -1 },
    };

    const response = await User.paginate(query, options);
    var workersAvailable = [];
    if (response && response.docs) {
      for (let worker of response.docs) {
        console.log("startTime", startTime);
        const schedule = await Schedule.findOne({
          "schedules.isActive": true,
          user: worker._id.toString(),
          "schedules.day": day,
          "schedules.intervals": {
            $elemMatch: {
              formatStartTime: {
                $lte: startTime,
              },
              formatEndTime: {
                $gte: startTime,
              },
            },
          },
        }).exec();
        if (schedule) {
          console.log(schedule);
          workersAvailable.push(worker);
        }
      }
      res.send(workersAvailable);
    } else {
      res.send(response);
    }
  } catch (err) {
    next(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

//Entrega trabajadores segun hora solicitada y subservicio solicitado
export const businessByService = async (req, res, next) => {
  console.log("--- GET BUSINESS BY SERVICE ---");
  try {
    const { service, page, limit } = req.query;
    console.log(service, page, limit);
    const query = {
      $and: [
        { isActive: true },
        { type: "business" },
        { "businessData.isActive": true },
        { "businessData.services.service": service },
      ],
    };
    const options = {
      select: "businessData img _id username",
      page: page || 1,
      limit: limit || 100,
      sort: { updatedAt: -1 },
    };
    console.log(query);
    const response = await User.paginate(query, options);
    res.send(response);
  } catch (err) {
    next(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
