import User from "../models/user.js";
import Schedule from "../models/schedule.js";
import ScheduleMultiple from "../models/scheduleMultiple.js";
import Holiday from "../models/holliday.js";
import envar from "../config/envar.js";
import { sendEmailTemplate } from "../services/aws_ses.js";
import { createError } from "../config/error.js";
import { refreshTokenGen, accessTokenGen } from "../middleware/auth.js";
import { procesarNombre } from "../utils/data.js";
import { createCustomerId } from "../services/stripe.js";
import { resendEmail } from "../services/resend.js";
import Booking from "../models/booking.js";

import {
  generarNumero4Digitos,
  generarCodigoAleatorio,
} from "../utils/code.js";
import Subservice from "../models/subservice.js";

//Create user personal/workers/business
export const createUser = async (req, res, next) => {
  global.logger.info({ message: "--- CREATE NEW USER-WORKER-BUSINESS ---" });
  try {
    let user = new User(req.body);
    user.email = user.email.toLowerCase().trim();
    const theUser = await User.findOne({ email: user.email }).exec();
    if (theUser) {
      throw createError(409, "This email is already in use");
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
    user.username = Math.random().toString(36).substring(2, 12);
    console.log("saving user...");
    const newUser = await user.save();
    res.status(200).json(newUser);
  } catch (err) {
    next(err);
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
    console.log("el name", name);
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
    user.username = Math.random().toString(36).substring(2, 12);
    await user.save();
    const newUser = await User.findOne({ email: user.email }).select(
      "about email type img language personalData type username workerData _id security.hasPassword"
    );
    console.log("el item", newUser);
    let userToCreateToken = {
      _id: newUser._id,
      username: newUser.username,
      type: newUser.type,
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
    console.log(!user);
    if (!user || user.type == "business") {
      throw createError(401, msg401);
    }
    if (!user.security.hasPassword) {
      throw createError(400, "has Not password");
    }
    const isValid =
      typeof password !== "undefined"
        ? await User.validPassword(user._id.toString(), password)
        : false;
    console.log(isValid);
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
      "about email img type language  personalData username workerData _id security.hasPassword"
    );
    delete updatedUser.password;
    let userToCreateToken = {
      _id: updatedUser._id,
      username: updatedUser.username,
      type: updatedUser.type,
    };
    await resendEmail();
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
//Login user by email only businness
export const loginEmailBusiness = async (req, res, next) => {
  global.logger.info({
    message: "--- LOGIN USER BY EMAIL AND REFRESH TOKEN BUSINESS ---",
  });
  try {
    let { email, password } = req.body;
    email = email.toLowerCase().trim();
    const user = await User.findOne({ email }).exec();
    const msg401 = "User not found or invalid credentials";
    if (!user || user.type != "business") {
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
      "about email img type language personalData businessData username workerData _id security.hasPassword"
    );
    delete updatedUser.password;
    let userToCreateToken = {
      _id: updatedUser._id,
      username: updatedUser.username,
      type: updatedUser.type,
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
    console.log(req.body);
    email = email.toLowerCase().trim();
    var user = await User.findOne({ email: email }).exec();
    let newValue = false;
    console.log(user);
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
      user.username = Math.random().toString(36).substring(2, 12);
    }
    console.log("existe");
    !user.img.imgUrl ? (user.img.imgUrl = image) : "";
    user.lastLogin = Date.now();
    user.lastLoginType = "google";
    user.isActive = true;
    user.isValidate = true;
    if (newValue) {
      await user.save();
      const newUser = await User.findOne({ email: user.email }).select(
        "about email type img language personalData type username workerData _id security.hasPassword"
      );
      let userToCreateToken = {
        _id: newUser._id,
        username: newUser.username,
      };
      let userRefresh = {
        _id: newUser._id,
      };
      await createCustomerId(newUser._id);
      res.status(200).json({
        msg: "login success",
        access_token: accessTokenGen(userToCreateToken, true),
        refresh_token: refreshTokenGen(userRefresh),
        user: newUser,
      });
    } else {
      let newUser = await User.findByIdAndUpdate(user._id, user, {
        new: true,
      }).select(
        "about email img language personalData username type workerData _id security.hasPassword"
      );
      delete newUser.password;
      // USER (TO CREATE TOKEN)
      let userToCreateToken = {
        _id: newUser._id,
        username: newUser.username,
        type: newUser.type,
      };
      await createCustomerId(newUser._id);
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
    console.log("el user", updatedUser);
    let userToCreateToken = {
      _id: updatedUser._id,
      username: updatedUser.username,
      type: updatedUser.type,
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
// función para crear contraseña para usuario que no tienen creada
export const createPassToken = async (req, res, next) => {
  global.logger.info({
    message: "--- CREATE PASSWORD TOKEN ---",
  });
  try {
    const id = req.user._id.toString();
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
    console.log("el user", updatedUser);
    let userToCreateToken = {
      _id: updatedUser._id,
      username: updatedUser.username,
      type: updatedUser.type,
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
  global.logger.info({
    message: "--- GET USER BY ID ---",
  });
  console.log(req.params.id);
  try {
    const user = await User.findOne({ _id: req.params.id })
      .select(
        "about email img language personalData username workerData _id security.hasPassword"
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
      });
    if (!user) {
      throw createError(404, "User not found");
    } else {
      res.status(200).json(user);
    }
  } catch (err) {
    next(err);
  }
};
//Obtener usuario por ID
export const getBussinesId = async (req, res, next) => {
  console.log("--- GET USER  BUSINESS BY ID ---", req.params);
  try {
    const user = await User.findOne({ _id: req.params.id, type: "business" })
      .select(
        "about email  img language personalData username businessData.owner  businessData.services businessData.details businessData.location businessData.name _id "
      )
      .populate({
        path: "businessData.services.service",
        select: "name _id",
      });
    console.log("el user", user ? user.businessData : null);
    if (!user) {
      throw createError(404, "User not found");
    } else {
      res.send(user);
    }
  } catch (err) {
    next(err);
  }
};
export const getWorkerId = async (req, res, next) => {
  console.log("--- GET USER Worker BY ID ---", req.params);
  try {
    const user = await User.findOne({ _id: req.params.id, type: "worker" })
      .select("about email img language personalData username workerData  _id ")
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
      throw createError(404, "User not found");
    } else {
      res.send(user);
    }
  } catch (err) {
    next(err);
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
      throw createError(409, "The email is not available.");
    } else {
      return res.status(200).json({ message: "The email is available" });
    }
  } catch (err) {
    next(err);
  }
};
//Función para encontrar usuario por email
export const findByEmail = async (req, res, next) => {
  global.logger.info({
    message: "--- FIND BY EMAIL ---",
  });
  try {
    var text = decodeURIComponent(req.body.email);
    const email = text.trim().toLowerCase();
    const user = await User.findOne({
      email: email,
    }).select("isActive isValidate security email personalData _id");
    if (!user) {
      throw createError(404, "email not found");
    } else {
      res.send(user);
    }
  } catch (err) {
    next(err);
  }
};
// envia correo con codigo de validación por tiempo definido
export const sendValidationCode = async (req, res, next) => {
  global.logger.info({
    message: "--- SEND VALIDATION CODE ---",
  });
  try {
    const { id, email, newEmail } = req.query;
    const user = await User.findById(id).exec();
    if (!user) {
      throw createError(404, "User not found or invalid credentials");
    }
    const code = generarNumero4Digitos();
    const urlCode = generarCodigoAleatorio(30);
    const digitosArray = Array.from(String(code), Number);
    const expTime = 5;
    const date = new Date();
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
        ToAddresses: [newEmail ? newEmail : updatedUser.email], // Lista de destinatarios
        CcAddresses: [envar().SES_EMAIL_AUTH], // Lista de copias
      },
      Template: "validationCode", // Nombre del template a usar
      TemplateData: JSON.stringify({
        number1: digitosArray[0],
        number2: digitosArray[1],
        number3: digitosArray[2],
        number4: digitosArray[3],
      }),
    };

    //Funcion de amazon
    //await sendEmailTemplate(params);
    //Funcion de resend
    var elEmail = "";
    newEmail != "null" ? (elEmail = newEmail) : (elEmail = updatedUser.email);

    resendEmail(elEmail, {
      number1: digitosArray[0],
      number2: digitosArray[1],
      number3: digitosArray[2],
      number4: digitosArray[3],
    });
    res.status(200).json({ msg: "code sent" });
  } catch (err) {
    if (err instanceof Error && err.$metadata) {
      throw createError(err.$metadata.httpStatusCode, err.Error.message);
    } else {
      next(err);
    }
  }
};
//validar codigo para validar correo
export const verifyValidationCode = async (req, res, next) => {
  global.logger.info({
    message: "--- VERIFY VALIDATION CODE ---",
  });
  try {
    const number = req.body.code;
    const id = req.params.id;
    const user = await User.findById(id).exec();
    if (!user) {
      throw createError(404, "User not found or invalid credentials");
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
          ...(req.body.email && req.body.email != ""
            ? { email: req.body.email }
            : {}),
        },
        { new: true }
      ).select("isActive isValidate security email personalData _id");

      let userToCreateToken = {
        _id: updatedUser._id,
        username: updatedUser.username,
        type: updatedUser.type,
      };

      res.send({
        msg: "login success",
        access_token: accessTokenGen(userToCreateToken, true),
      });
    } else {
      throw createError(
        400,
        "Authentication failed: Incorrect or expired code"
      );
    }
  } catch (err) {
    next(err);
  }
};
//Obtener usuarios con paginate por tipos y activados
export const getUsers = async (req, res, next) => {
  global.logger.info({
    message: "--- GET USERS ---",
  });

  //pasar el service id en la query
  const service_id = "64f5d3e97e27ca17eb1e47ec"; //delete this, test

  try {
    let body = {};
    Object.assign(body, req.query);
    let options = {
      select:
        "personalData img _id username businessData.name businessData.location workerData",
      populate: [
        {
          path: "workerData.services.id",
          select: "name imgUrl ",
          model: "Service",
          match: { isActive: true },
        },
        {
          path: "workerData.services.subServices",
          select: "name imgUrl duration price ",
          model: "Subservice",
          match: { isActive: true },
        },
      ],

      page: body.page || 1,
      limit: body.limit || 10,
      sort: { updatedAt: -1 },
    };
    let query = {
      // Agregar una condición para excluir los documentos con type="personal"
      type: { $ne: "personal" },
      /*isActive: true, //si type es de tipo business continuar con el query, pero pierde el sentido rest api
      "businessData.services": {
        $elemMatch: { service: service_id, isActive: true },
      },*/
    };
    body.type ? (query.type = body.type) : "";
    body.isActive ? (query.isActive = body.isActive) : "";

    console.log(body, query, options);
    const response = await User.paginate(query, options);
    console.log(response);
    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
};

export const getWorkerForBook = async (req, res, next) => {
  const { serviceId, subserviceId } = req.params;
  const { day, page, limit } = req.body;

  const query = {
    type: "worker",
    isActive: true,
    "workerData.services.id": serviceId,
    "workerData.services.subServices": subserviceId,
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

  try {
    const { docs: workers } = await User.paginate(query, options);

    if (!workers) {
      return res.status(404).json({ message: "No workers were found" });
    }

    const scheduleQuery = {
      isActive: true,
      user: { $in: workers.map((worker) => worker._id.toString()) },
    };

    const schedule = await Schedule.find(scheduleQuery);

    if (!schedule.length) {
      return res
        .status(404)
        .json({ message: "No workers were found for this service" });
    }

    const holidays = await Holiday.find(scheduleQuery);

    const dateDay = new Date(day);
    let availableWorkers = [];

    for (const worker of workers) {
      let skipLoop = false;

      const workerSchedule = schedule.findIndex(
        (time) => time.user === worker._id.toString()
      );

      if (workerSchedule < 0) continue;

      const scheduleIndex = schedule[workerSchedule].schedules.findIndex(
        (time) =>
          time.isActive &&
          time.day === (dateDay.getDay() === 0 ? 7 : dateDay.getDay())
      );

      if (scheduleIndex < 0) continue;

      console.log("preparado para saltar, veamos si anda de vacaiones...");
      skipLoop = true;

      for (const hours of schedule[workerSchedule].schedules[scheduleIndex]
        .intervals) {
        const startDate = new Date(hours.startTimeIso);
        const endDate = new Date(hours.endTimeIso);

        startDate.setFullYear(dateDay.getFullYear());
        startDate.setMonth(dateDay.getMonth());
        startDate.setDate(dateDay.getDate());

        endDate.setFullYear(dateDay.getFullYear());
        endDate.setMonth(dateDay.getMonth());
        endDate.setDate(dateDay.getDate());

        if (dateDay >= startDate && dateDay <= endDate) {
          skipLoop = false;
          break;
        }
      }

      if (skipLoop) continue;

      if (holidays) {
        const holidayIndex = holidays.findIndex(
          (holy) => holy.user === worker._id
        );

        if (holidayIndex >= 0) {
          for (const holy of holidays[holidayIndex].range) {
            if (day >= holy.from && day <= holy.to) {
              skipLoop = true;
              break;
            }
          }
        }
      }

      if (skipLoop) continue;
      availableWorkers.push(worker);
    }

    res.status(200).json(availableWorkers);
  } catch (err) {
    next(err);
  }
};
//Por trabajar

//Entrega trabajadores segun hora solicitada y subservicio solicitado, vacaciones, calendario, booking
export const workerByTimeAndService = async (req, res, next) => {
  global.logger.info({
    message: "--- GET WORKERS BY TIME AND SERVICE ---",
  });
  try {
    let { startTime, endTime, subservice, page, limit } = req.body;

    // subservice = "6547f61545d6ccde7ac65fd0"; // SubService ID
    const bookingStartTime = new Date(startTime.isoTime);
    const bookingEndTime = new Date(endTime.isoTime);

    const theSubservice = await Subservice.findById(subservice);
    console.log(
      "el multiple",
      theSubservice.multiple,
      theSubservice.hasLimit,
      theSubservice.limit
    );
    //Users
    const query = {
      $and: [
        { isActive: true },
        { type: "worker" },
        { "workerData.isActive": true },
        { "workerData.services.subServices": subservice },
      ],
    };
    const options = {
      populate: {
        path: "workerData.services.id",
        select: "name",
      },
      select: "personalData.name email  workerData.services img.imgUrl _id ",
      page: page || 1,
      limit: limit || 100,
      sort: { updatedAt: -1 },
    };
    let users = await User.paginate(query, options);
    let workers = users.docs;
    console.log("cantidad de usuarios", workers.length);
    //schedules
    const scheduleQuery = {
      isActive: true,
      subService: theSubservice._id.toString(),
      user: { $in: workers.map((worker) => worker._id.toString()) },
    };
    let schedules = null;
    schedules = await ScheduleMultiple.find(scheduleQuery);
    if (!schedules) {
      console.log("no hay calendarios");
      workers = [];
      return res.send({ workers });
    }
    console.log("calendarios", schedules.length);
    //Hollidays
    const holidays = await Holiday.find();
    //booking
    console.log("el isoTime", bookingStartTime);
    const bookingQuery = {
      workerUser: { $in: workers.map((worker) => worker._id.toString()) },
      subservice: subservice,
      "startTime.isoTime": bookingStartTime,
    };
    console.log("la query", bookingQuery);
    let bookings = [];
    bookings = await Booking.find(bookingQuery);
    console.log("bookings encontrados", bookings.length);
    for (let worker of workers) {
      console.log("---worker--------------", worker.email);
      //aqui va la validacion de hollidays
      const indexHolliday = holidays.findIndex(
        (holliday) => holliday.user === worker._id.toString()
      );
      if (indexHolliday >= 0) {
        console.log("hay vacaciones");
        const holliday = holidays[indexHolliday];
        const hollidayIndex = holliday.range.findIndex(
          (time) =>
            new Date(time.from).getTime() <= bookingStartTime.getTime() &&
            new Date(time.to).getTime() >= bookingEndTime.getTime()
        );
        if (hollidayIndex >= 0) {
          console.log("hay vacaciones en el rango");
          workers = workers.filter(
            (item) => item._id.toString() != worker._id.toString()
          );
          continue;
        }
      }
      console.log("no hay problemas de vacaciones, vamos a ver si hay booking");
      const indexBooking = bookings.findIndex(
        (booking) => booking.workerUser === worker._id.toString()
      );
      //coincidencias
      const matches = bookings.filter(
        (booking) => booking.workerUser === worker._id.toString()
      );

      const indexSchedule = schedules.findIndex(
        (schedule) => schedule.user === worker._id.toString()
      );

      if (indexSchedule == -1) {
        console.log("no tiene schedule");
        workers = workers.filter(
          (item) => item._id.toString() != worker._id.toString()
        );
        continue;
      }

      if (indexBooking >= 0) {
        console.log("hay booking");
        const schedule = schedules[indexSchedule];
        // Si no hay un límite, pasa al siguiente trabajador
        if (!schedule.hasLimit) continue;
        console.log(
          "tiene limite",
          schedule.limit,
          matches.length,
          matches.length >= schedule.limit
        );
        // Si se supera el límite, elimina al trabajador y pasa al siguiente
        if (matches.length >= schedule.limit) {
          console.log("excede el limite");
          workers = workers.filter(
            (item) => item._id.toString() !== worker._id.toString()
          );
          continue;
        }
      }
      console.log("no hay problema de booking, analizando calendario");
      console.log("cantidad de calendarios", schedules.length);
      console.log("workerId", worker._id);

      if (indexSchedule >= 0) {
        console.log("hay calendario", startTime);
        const timeFormat = startTime.isoTime.split("T");
        const hora = "T" + timeFormat[1];
        const schedule = schedules[indexSchedule];
        console.log("hay calendario");
        const scheduleIndex = schedule.schedules.findIndex(
          (time) =>
            time.isActive &&
            time.day === bookingStartTime.getUTCDay() &&
            time.iso === hora
        );

        if (scheduleIndex >= 0) {
          console.log("dia calendario activado");
          continue;
        } else {
          console.log("dia esta apagado");
          workers = workers.filter(
            (item) => item._id.toString() != worker._id.toString()
          );
          continue;
        }
      }
    }
    return res.status(200).json({ workers });
  } catch (err) {
    next(err);
  }
};

//Entrega trabajadores segun hora solicitada y subservicio solicitado, vacaciones, calendario, booking
export const workerByTimeAndService2 = async (req, res, next) => {
  global.logger.info({
    message: "--- GET WORKERS BY TIME AND SERVICE ---",
  });
  try {
    const { startTime, endTime, subservice, page, limit } = req.body;
    const bookingStartTime = new Date(startTime.isoTime);
    const bookingEndTime = new Date(endTime.isoTime);
    //Users
    const query = {
      $and: [
        { isActive: true },
        { type: "worker" },
        { "workerData.isActive": true },
        { "workerData.services.subServices": subservice },
      ],
    };
    const options = {
      populate: {
        path: "workerData.services.id",
        select: "name",
      },
      select: "personalData.name email  workerData.services img.imgUrl _id ",
      page: page || 1,
      limit: limit || 100,
      sort: { updatedAt: -1 },
    };
    let users = await User.paginate(query, options);
    console.log("usuarios encontrados", users.docs.length);
    let workers = users.docs;
    //schedules
    const scheduleQuery = {
      isActive: true,
      user: { $in: workers.map((worker) => worker._id.toString()) },
    };
    const schedules = await Schedule.find(scheduleQuery);
    if (!schedules) {
      console.log("no hay calendarios");
      workers = [];
      return res.send({ workers });
    }
    //Hollidays
    const holidays = await Holiday.find(scheduleQuery);
    //booking
    const bookingQuery = {
      workerUser: { $in: workers.map((worker) => worker._id.toString()) },
      subservice: subservice,
      $or: [
        {
          "startTime.isoTime": { $gte: bookingStartTime },
          "endTime.isoTime": { $lte: bookingEndTime },
        },
        {
          "startTime.isoTime": { $lt: bookingStartTime },
          "endTime.isoTime": { $gt: bookingStartTime, $lte: bookingEndTime },
        },
        {
          "startTime.isoTime": {
            $gte: bookingStartTime,
            $lt: bookingEndTime,
          },
          "endTime.isoTime": { $gt: bookingEndTime },
        },
        {
          "startTime.isoTime": { $lt: bookingStartTime },
          "endTime.isoTime": { $gt: bookingEndTime },
        },
      ],
    };
    let bookings = [];
    bookings = await Booking.find(bookingQuery);
    console.log("bookings encontrados", bookings.length);
    for (let worker of workers) {
      console.log("---worker--------------", worker.email);
      //aqui va la validacion de hollidays
      const indexHolliday = holidays.findIndex(
        (holliday) => holliday.user === worker._id.toString()
      );
      if (indexHolliday >= 0) {
        console.log("hay vacaciones");
        const holliday = holidays[indexHolliday];
        console.log(holliday);
        const hollidayIndex = holliday.range.findIndex(
          (time) =>
            new Date(time.from).getTime() <= bookingStartTime.getTime() &&
            new Date(time.to).getTime() >= bookingEndTime.getTime()
        );
        if (hollidayIndex >= 0) {
          console.log("hay vacaciones en el rango");
          workers = workers.filter(
            (item) => item._id.toString() != worker._id.toString()
          );
          continue;
        }
      }
      console.log("no hay problemas de vacaciones, vamos a ver si hay booking");
      const indexBooking = bookings.findIndex(
        (booking) => booking.workerUser === worker._id.toString()
      );
      if (indexBooking >= 0) {
        console.log("hay booking");
        workers = workers.filter(
          (item) => item._id.toString() != worker._id.toString()
        );
        continue;
      }
      console.log("no hay problema de booking, analizando calendario");
      const indexSchedule = schedules.findIndex(
        (schedule) => schedule.user === worker._id.toString()
      );
      if (indexSchedule >= 0) {
        console.log("hay calendario");
        const schedule = schedules[indexSchedule];
        console.log("hay calendario");
        const scheduleIndex = schedule.schedules.findIndex(
          (time) => time.isActive && time.day === bookingStartTime.getUTCDay()
        );
        if (scheduleIndex >= 0) {
          console.log("dia calendario activado");
          const intervals = schedule.schedules[scheduleIndex].intervals;
          console.log("analizando intervalos");
          let contador = 0;
          for (let interval of intervals) {
            console.log(intervals, bookingStartTime, bookingEndTime);
            const intervalStartTime = stripDate(interval.startTimeIso);
            const intervalEndTime = stripDate(interval.endTimeIso);
            const strippedBookingStartTime = stripDate(bookingStartTime);
            const strippedBookingEndTime = stripDate(bookingEndTime);
            console.log(
              intervalStartTime.getTime(),
              intervalEndTime.getTime(),
              strippedBookingStartTime.getTime(),
              strippedBookingEndTime.getTime()
            );
            console.log(
              intervalStartTime.getTime() <= strippedBookingStartTime.getTime()
            );
            console.log(
              intervalEndTime.getTime() >= strippedBookingEndTime.getTime()
            );
            const intervalIndex = intervals.findIndex(
              (time) =>
                stripDate(time.startTimeIso).getTime() <=
                  strippedBookingStartTime.getTime() &&
                stripDate(time.endTimeIso).getTime() >=
                  strippedBookingEndTime.getTime()
            );
            if (
              intervalIndex >= 0 &&
              schedule.schedules[scheduleIndex].isActive
            ) {
              console.log("intervalo disponible");
              continue;
            } else {
              console.log("intervalo no disponible");
              contador++;
            }
          }
          if (contador == intervals.length) {
            workers = workers.filter(
              (item) => item._id.toString() != worker._id.toString()
            );
            continue;
          }
        } else {
          console.log("dia esta apagado");
          workers = workers.filter(
            (item) => item._id.toString() != worker._id.toString()
          );
          continue;
        }
      } else {
        console.log("no tiene schedule");
        workers = workers.filter(
          (item) => item._id.toString() != worker._id.toString()
        );
        continue;
      }
      console.log("----------------------");
    }
    return res.status(200).json({ workers });
  } catch (err) {
    next(err);
  }
};

//Entrega hostels segun servicio solicitado y subservicio solicitado
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
        {
          "businessData.services": {
            $elemMatch: { service: service, isActive: true },
          },
        },
      ],
    };
    const options = {
      select: "businessData img _id username",
      populate: {
        path: "businessData.services.service", // Poblar el campo "id" dentro de "services"
        select: "name imgUrl ",
        model: "Service", // Modelo de "Service"
        match: { isActive: true }, // Solo selecciona los servicios activos
      },
      page: page || 1,
      limit: limit || 100,
      sort: { updatedAt: -1 },
    };
    console.log(query);
    const response = await User.paginate(query, options);
    res.send(response);
  } catch (err) {
    next(err);
  }
};

export const getRandomUsers = async (req, res, next) => {
  try {
    global.logger.info({
      message: "--- GET RANDOM USERS ---",
    });

    const user = await User.findOne({ _id: "65312a63c0b1e1658a5a712c" })
      .select("_id personalData workerData.services img.imgUrl")
      .populate([
        {
          path: "workerData.services.id",
          select: "name isActive",
          match: { isActive: true },
          model: "Service",
        },
        {
          path: "workerData.services.subServices",
          select: "name imgUrl duration price isActive multiple goChat",
          model: "Subservice",
          match: { isActive: true },
        },
      ]);
    console.log("el usuario", user._id, user.workerData.services);
    const finalArray = [];
    console.log("length", user.workerData.services.length);
    for (let i = 0; i < user.workerData.services.length; i++) {
      const usernew = {
        ...user,
        workerData: {
          ...user.workerData,
          services: [...user.workerData.services],
        },
      };
      usernew.workerData.services = usernew.workerData.services.filter(
        (_, index) => index === i
      );
      console.log("usuario2", usernew.workerData.services[0].id);
      if (usernew.workerData.services[0].id) {
        finalArray.push(usernew);
      }
    }
    res.send(finalArray);

    return;

    const schedules = await ScheduleMultiple.aggregate([
      { $sample: { size: 4 } },
    ]);

    // Obtener todos los IDs de usuario
    const userIds = await User.find({
      type: "worker",
      isActive: true,
      "workerData.isActive": true,
    }).select("_id");

    console.log(userIds.length);

    // Función para seleccionar aleatoriamente IDs sin duplicados
    const selectRandomIds = (ids, count) => {
      const randomIds = [];
      const availableIds = [...ids];
      for (let i = 0; i < count && availableIds.length > 0; i++) {
        const randomIndex = Math.floor(Math.random() * availableIds.length);
        randomIds.push(availableIds[randomIndex]);
        availableIds.splice(randomIndex, 1); // Eliminar el ID seleccionado
      }
      return randomIds;
    };

    let filteredUsers = [];
    let attempts = 0;

    // Intentar garantizar que se obtengan al menos 4 usuarios válidos
    while (filteredUsers.length < 4 && attempts < 5) {
      attempts++;

      // Seleccionar un mayor número de IDs al azar para aumentar las probabilidades
      const randomIds = selectRandomIds(userIds, 10);
      console.log("casa", randomIds);
      // Buscar usuarios y poblar campos
      const randomUsers = await User.find({ _id: { $in: randomIds } })
        .select("_id personalData workerData.services img.imgUrl")
        .populate([
          {
            path: "workerData.services.id",
            select: "name isActive",
            match: { isActive: true },
            model: "Service",
          },
          {
            path: "workerData.services.subServices",
            select: "name imgUrl duration price isActive multiple",
            model: "Subservice",
            match: { isActive: true },
          },
        ]);

      // Filtrar subservicios activos y mantener solo los relevantes
      const validUsers = await Promise.all(
        randomUsers.map(async (user) => {
          const updatedServices = await Promise.all(
            user.workerData.services.map(async (service) => {
              const activeSubServices = await ScheduleMultiple.find({
                user: user._id,
                subService: { $in: service.subServices.map((sub) => sub._id) },
                isActive: true,
                "schedules.isActive": true,
              }).select("subService");
              console.log("encontro", activeSubServices);
              const activeSubServiceIds = activeSubServices.map(
                (schedule) => schedule.subService
              );

              // Filtrar los subservices activos
              const filteredSubServices = service.subServices.filter((sub) =>
                activeSubServiceIds.includes(sub._id.toString())
              );

              // Retornar solo si hay subservices activos
              return filteredSubServices.length > 0
                ? {
                    ...service.toObject(),
                    subServices: filteredSubServices,
                  }
                : null;
            })
          );

          // Filtrar servicios sin subservices activos
          user.workerData.services = updatedServices.filter(
            (service) => service
          );

          return user.workerData.services.length > 0 ? user : null;
        })
      );

      // Filtrar usuarios no válidos
      filteredUsers = validUsers.filter((user) => user);

      // Si hay al menos 4 usuarios válidos, detener el bucle
      if (filteredUsers.length >= 4) break;
    }

    // Limitar a un máximo de 6 usuarios antes de enviar
    res.send(filteredUsers.slice(0, 6));
  } catch (err) {
    next(err);
  }
};

function stripDate(date) {
  return new Date(
    1970,
    0,
    1,
    date.getHours(),
    date.getMinutes(),
    date.getSeconds()
  );
}
