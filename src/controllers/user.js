import User from "../models/user.js";
import Holliday from "../models/holliday.js";
import Booking from "../models/booking.js";
import Jimp from "jimp";
import Schedule from "../models/schedule.js";

import { n64tobuffer } from "../utils/externalFiles.js";
import { AwsUploadFile } from "../services/aws_s3.js";
import { procesarNombre } from "../utils/data.js";
import { fakeReq } from "../utils/externalFiles.js";

import { notFoundError, createError, missingData } from "../config/error.js";
import { refreshTokenGen, accessTokenGen } from "../middleware/auth.js";

export const getWokersByBusiness = async (req, res, next) => {
  const query = {
    type: "worker",
    //set the businnes id
    "businessData.services.0": { $exists: true },
  };

  const options = {
    sort: { updatedAt: -1 },
    page: req.query.page || 1,
    limit: req.query.limit || 20,
    select:
      "img.imgUrl type workerData.services businessData.name businessData.isActive businessData.services businessData.type personalData.name personalData.isActive",
  };

  // No hay en la db alguna forma de filtrar en cuales/cual hostales trabaja

  User.paginate(query, options, (err, workers) => {
    if (err) return next(err);
    res.send(workers);
  });
};

//Encontrar usuario por el token
export const findUserToken = async (req, res, next) => {
  global.logger.info("---FIND USER TOKEN---");
  const userId = req.user._id.toString();
  const user = await User.findOne({ _id: userId })
    .select("type isActive username email rating img personalData security")
    .populate({
      path: "workerData.services.id", // Poblar el campo "id" dentro de "services"
      model: "Service", // Modelo de "Service"
    })
    .populate({
      path: "businessData.services.service", // Poblar el campo "id" dentro de "services"
      model: "Service", // Modelo de "Service"
    });

  if (!user) {
    throw createError(404, "User not found");
  }
  res.status(200).json(user);
};

//Obtener usuarios con paginate por tipos y activados
export const getUsers = async (req, res, next) => {
  global.logger.info("---GET USERS---");
  try {
    let body = {};
    Object.assign(body, req.query);
    let options = {
      // populate,
      // select,
      page: body.page || 1,
      limit: body.limit || 20,
      sort: { updatedAt: -1 },
    };
    let query = {};
    body.type ? (query.type = body.type) : "";
    body.isActive ? (query.isActive = body.isActive) : "";
    User.paginate(query, options, (err, items) => {
      if (err) return next(err);
      res.send(items);
    });
  } catch (err) {
    next(err);
  }
};
//Obtener usuarios con paginate por tipos y activados
export const contacts = async (req, res, next) => {
  global.logger.info("---GET CONTACTS---");
  try {
    let body = {};
    Object.assign(body, req.query);
    console.log("query", body);
    let options = {
      // populate,
      // select,
      page: body.page || 1,
      limit: body.limit || 20,
      sort: { updatedAt: -1 },
    };
    let query = {
      $and: [
        // Utilizamos $and para agregar múltiples condiciones
        body.type ? { type: body.type } : {}, // Condición para type
        body.isActive ? { isActive: body.isActive } : {}, // Condición para isActive
        { _id: { $ne: req.user._id } }, // Excluir documentos con _id igual a req.user._id
        { type: { $ne: "business" } }, // Excluir documentos con _id igual a req.user._id
      ],
    };
    const users = await User.paginate(query, options);
    res.send(users);
  } catch (err) {
    next(err);
  }
};
//Obtener usuario por ID
export const getById = async (req, res, next) => {
  global.logger.info("---GET USER BY ID---");
  try {
    const user = await User.findOne({ _id: req.params.id })
      .select(
        "about email img language personalData username workerData _id security.hasPassword"
      )
      .populate({
        path: "workerData.services.id", // Poblar el campo "id" dentro de "services"
        model: "Service", // Modelo de "Service"
      })
      .populate({
        path: "workerData.services.subServices", // Poblar "subServices" dentro de "services"
        model: "SubServices", // Modelo de "SubServices"
      });
    if (!user) {
      throw createError(404, "User not found");
    } else {
      res.send(user);
    }
  } catch (err) {
    next(err);
  }
};

//Obtener usuarios business con paginate por servicios
export const getBusinesByService = async (req, res, next) => {
  const { id: serviceId } = req.params;

  const query = {
    isActive: true,
    type: "business",
    "businessData.services.isActive": true,
    "businessData.services.service": serviceId,
  };

  const options = {
    page: req.query.page || 1,
    limit: req.query.limit || 20,
  };

  User.paginate(query, options, (err, workers) => {
    if (err) return next(err);
    res.status(200).json(workers);
  });
};

//Obtener usuarios business con paginate por nombre
export const findbusinessbyname = async (req, res, next) => {
  global.logger.info("---FIND BUSINESS BY NAME---");
  try {
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

    const users = await User.paginate(query, options);
    res.send(users);
  } catch (err) {
    next(err);
  }
};

//Actualizar data de un usuario por ID
export const setWorker = async (req, res, next) => {
  global.logger.info("---SET WORKER---");
  try {
    let id = req.user._id.toString();
    let newUser = await User.findOneAndUpdate(
      {
        _id: id,
      },
      { type: "worker" },
      {
        new: true,
      }
    ).exec();
    res.send(newUser);
  } catch (err) {
    next(err);
  }
};

//Actualizar data de un usuario por ID
export const updateOne = async (req, res, next) => {
  global.logger.info("---UPDATE USER---");
  try {
    let { user } = req.body;
    let newUser = await User.findOneAndUpdate(
      {
        _id: req.params.id,
      },
      user,
      {
        new: true,
      }
    )
      .populate({
        path: "workerData.services.id", // Poblar el campo "id" dentro de "services"
        select: "name imgUrl ",
        model: "Service", // Modelo de "Service"
        match: { isActive: true }, // Solo selecciona los servicios activos
      })
      .populate({
        path: "workerData.services.subServices", // Poblar "subServices" dentro de "services"
        select: "name imgUrl duration price ",
        model: "Subservice", // Modelo de "SubServices"
        match: { isActive: true }, // Solo selecciona los subservicios activos
      })
      .populate({
        path: "businessData.services.service", // Poblar el campo "id" dentro de "services"
        select: "name imgUrl ",
        model: "Service", // Modelo de "Service"
        match: { isActive: true }, // Solo selecciona los servicios activos
      })
      .exec();
    res.send(newUser);
  } catch (err) {
    next(err);
  }
};
//Eliminar usuario por ID
export const deleteById = async (req, res, next) => {
  global.logger.info("---DELETE USER---");
  try {
    let removeUser = await User.findOneAndRemove({
      _id: req.params.id,
    }).exec();
    res.send({ removeUser, message: "user deleted" });
  } catch (err) {
    next(err);
  }
};
//Activar o desactivar multiples usuarios
export const activateMany = async (req, res, next) => {
  global.logger.info("---ACTIVATE/DESACTIVATE MANY USERS---");
  try {
    const users = await User.updateMany(
      { _id: { $in: req.body.users } },
      { isActive: req.body.isActive ? req.body.isActive : true }
    ).exec();
    res.status(200).json(users);
  } catch (err) {
    next(err);
  }
};
//crear o cambiar foto de perfil worker
export const profilePhoto = async (req, res, next) => {
  try {
    console.log("---UPLOAD PROFILE FOTO---");
    let file = req.file ? req.file : fakeReq.file;
    let elbuffer = await n64tobuffer(req.body.file);
    // console.log("elbuffer", elbuffer);
    // Jimp.read(file.buffer)
    Jimp.read(elbuffer)
      .then(async (image) => {
        // console.log("imafen", image);
        image
          .resize(320, Jimp.AUTO) // resize
          .quality(70); // set JPEG quality
        let imagenReducida = await image.getBufferAsync(Jimp.MIME_JPEG);
        // console.log("imagenReducida", imagenReducida);
        let lastIndex = file.originalname.lastIndexOf(".");
        let name = file.originalname.slice(0, lastIndex);
        let ext = file.originalname.slice(lastIndex + 1);
        let resp = await AwsUploadFile({
          fileName: `users/${req.user._id}/profile/${req.user._id}.${ext}`,
          buffer: imagenReducida,
        });
        // console.log("respuesta", resp);
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
          throw createError(400, "Create error");
        }
      })
      .catch((err) => {
        next(err);
      });
  } catch (err) {
    next(err);
  }
};
//crear o cambiar fotos de galeria worker
export const galleryPhoto = async (req, res, next) => {
  global.logger.info("---UPLOAD GALLERY FOTO---");
  try {
    console.log("gato", req.file);
    let paramsNumber = Number(req.params.number);
    // VALIDACION PARA SOLO SUBIR UN MAXIMO DE 6 FOTOS
    if (isNaN(paramsNumber) || paramsNumber >= 10 || paramsNumber < 0) {
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
        console.log("el numero", paramsNumber);
        let resp = await AwsUploadFile({
          fileName: `users/${req.user._id}/gallery/photo${paramsNumber}.${ext}`,
          buffer: imagenReducida,
        });
        if (resp.results.$metadata.httpStatusCode == 200) {
          let user = await User.findOne({
            _id: req.user._id.toString(),
          }).select("img");
          let gallery = user.img.gallery;
          console.log("la url", resp.url);
          console.log(paramsNumber);
          gallery[paramsNumber] = resp.url;
          if (gallery?.length > 0) {
            const filledArray = Array.from(
              { length: 10 },
              (_, index) => user.img.gallery[index] || null
            );
            gallery = filledArray;
          } else {
            const emptyArray = Array.from({ length: 10 }, () => null);
            gallery = emptyArray;
          }
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
          res.send(updateUser);
        } else {
          throw createError(500, "Error while saving data");
        }
      })
      .catch((err) => {
        next(err);
      });
  } catch (err) {
    next(err);
  }
};
export const updateGallery = async (req, res, next) => {
  global.logger.info("---UPDATE GALLERY---");
  try {
    let updateUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        "img.gallery": req.body.array,
      },
      {
        new: true,
      }
    )
      .select("img")
      .exec();
    res.status(200).send(updateUser);
  } catch (err) {
    next(err);
  }
};
// función para crear contraseña para usuario que no tienen creada
export const hasPassword = async (req, res, next) => {
  global.logger.info("---HAS PASSWORD---");
  try {
    let user = await User.findOne({
      _id: req.user._id.toString(),
    }).select("security");
    if (user.security && user.security.hasPassword) {
      res.status(200).send({ hasPassword: true });
    } else {
      res.status(200).send({ hasPassword: false });
    }
  } catch (err) {
    next(err);
  }
};
// función para crear contraseña para usuario que no tienen creada
export const changePassword = async (req, res, next) => {
  global.logger.info("---CHANGE PASSWORD---");
  try {
    const newPassword = req.body.newPassword;
    const currentPassword = req.body.currentPassword;
    if (!newPassword) {
      throw createError(400, "a field is missing");
    }
    const validPass = await User.validPassword(
      req.user._id.toString(),
      currentPassword
    );
    if (!validPass) {
      throw createError(400, "current password wrong");
    }
    const encryptPassword = await User.hash(newPassword);
    const updatedUser = await User.findOneAndUpdate(
      { _id: req.user._id.toString() }, // Filtro para encontrar el usuario por su ID
      {
        password: encryptPassword,
        isActive: true,
        "security.hasPassword": true,
        "security.updatedAt": new Date(),
      },
      { new: true } // Opcional: para obtener el documento actualizado como resultado
    ).select("isActive isValidate security email personalData _id img");
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

export const inactiveMode = async (req, res, next) => {
  global.logger.info("---INACTIVE MODE---");
  try {
    const isActive = req.body.isActive;
    const id = req.user._id.toString();
    const updatedUser = await User.findOneAndUpdate(
      { _id: id },
      {
        isActive: isActive,
      },
      { new: true }
    ).select("isActive isValidate security email personalData _id img");
    res.status(200).json(updatedUser);
  } catch (err) {
    next(err);
  }
};

export const getServicesWorker = async (req, res, next) => {
  global.logger.info("---GET SERVICES BY WORKER---");
  try {
    const id = req.user._id.toString();
    console.log(id);
    const user = await User.findOne({ _id: id })
      .select("workerData.services type")
      .populate({
        path: "workerData.services.id", // Poblar el campo "id" dentro de "services"
        select: "name imgUrl ",
        model: "Service", // Modelo de "Service"
        match: { isActive: true }, // Solo selecciona los servicios activos
      })
      .populate({
        path: "workerData.services.subServices", // Poblar "subServices" dentro de "services"
        select: "name imgUrl duration price ",
        model: "Subservice", // Modelo de "SubServices"
        match: { isActive: true }, // Solo selecciona los subservicios activos
      })
      .exec();
    if (!user) {
      throw createError(404, "User not found");
    }
    if (user && user.type != "worker") {
      throw createError(409, "you dont have the credentials");
    }

    res.status(200).json(user?.workerData?.services || []);
  } catch (err) {
    next(err);
  }
};

export const getServicesBusiness = async (req, res, next) => {
  global.logger.info("---GET SERVICES BY Business---");
  try {
    const id = req.user._id.toString();
    console.log(id);
    const user = await User.findById(id)
      .select("businessData type")
      .populate({
        path: "businessData.services.service", // Poblar el campo "id" dentro de "services"
        select: "name imgUrl ",
        model: "Service", // Modelo de "Service"
        match: { isActive: true }, // Solo selecciona los servicios activos
      })
      .exec();
    if (!user) {
      throw createError(404, "User not found");
    }
    if (user && user.type != "business") {
      throw createError(409, "you dont have the credentials");
    }

    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
};

//Actualizar data de un usuario por ID
export const updateOneBusiness = async (req, res, next) => {
  global.logger.info("---UPDATE USER BUSINESS---");
  try {
    let user = req.body;
    console.log("user", user.personalData.name);
    let newUser = await User.findOneAndUpdate(
      {
        _id: req.params.id,
      },
      user,
      {
        new: true,
      }
    )
      .populate({
        path: "businessData.services.service", // Poblar el campo "id" dentro de "services"
        select: "name imgUrl ",
        model: "Service", // Modelo de "Service"
        match: { isActive: true }, // Solo selecciona los servicios activos
      })
      .exec();
    console.log("newuser", newUser.personalData.name);
    res.send(newUser);
  } catch (err) {
    next(err);
  }
};

export const findWorkerMainFlow = async (req, res, next) => {
  console.log("get all workers");
  const date = "2023-12-26T00:00:00.000Z";
  const startTime = "13:20";
  const endTime = "13:55";
  const serviceId = "64f5d3d77e27ca17eb1e47ea";
  const subserviceId = "6534056da77bbf1f725d10d6";
  const dayOfWeek =
    new Date(date).getUTCDay() === 0 ? 7 : new Date(date).getUTCDay(); // Convertir el día de la semana de 0-6 a 1-7

  const startDateTime = new Date(`${date.split("T")[0]}T${startTime}:00.000Z`);
  const endDateTime = new Date(`${date.split("T")[0]}T${endTime}:00.000Z`);

  // Trae todos los calendarios con sus usuarios que tienen la fecha y hora habilitada para trabajar
  const schedules = await Schedule.find({
    isActive: true,
    "schedules.isActive": true,
    service: serviceId,
    "schedules.day": dayOfWeek,
    "schedules.isActive": true,
    schedules: {
      $elemMatch: {
        day: dayOfWeek,
        isActive: true,
        intervals: {
          $elemMatch: {
            startTime: { $lte: startTime },
            endTime: { $gte: endTime },
          },
        },
      },
    },
  }).populate({
    path: "user",
    select: "workerData type personalData img.imgUrl",
  });
  // Trae todos los holliday con sus usuarios que tienen bloqueo por fecha y hora
  const hollidays = await Holliday.find({
    isActive: true,
    range: {
      $not: {
        $elemMatch: {
          from: { $lt: endDateTime },
          to: { $gt: startDateTime },
        },
      },
    },
  }).populate({
    path: "user",
    select: "workerData type personalData img.imgUrl",
  });

  console.log(startDateTime, endDateTime);

  // Trae todos los bookings con sus usuarios que tienen bloqueo por fecha y hora
  const bookings = await Booking.find({
    "startTime.isoTime": {
      $lte: endDateTime,
    },
    "endTime.isoTime": {
      $gte: startDateTime,
    },
    "date.isoDate": date,
    service: serviceId,
    subservice: subserviceId,
  }).populate({
    path: "workerUser",
    select: "workerData type personalData img.imgUrl",
  });

  // Extraer los usuarios de schedules y hollidays
  const scheduleUsers = schedules.map((schedule) => schedule.user);
  const hollidayUsers = hollidays.map((holliday) => holliday.user);

  // Combinar los usuarios de schedules y hollidays
  let combinedUsers = [...scheduleUsers, ...hollidayUsers];

  // Extraer los usuarios de bookings
  const bookingUsers = bookings.map((booking) => booking.user);

  // Filtrar el array combinado para eliminar los usuarios que también están en bookings
  combinedUsers = combinedUsers.filter((user) => !bookingUsers.includes(user));

  // Eliminar duplicados
  const uniqueUsers = [...new Set(combinedUsers)];

  res.send({ uniqueUsers });
};
