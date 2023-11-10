import Schedule from "../models/schedule.js";
import User from "../models/user.js";
import Service from "../models/service.js";
import Subservice from "../models/subservice.js";
import mongoose from "mongoose";
import { convertirHoraAMinutos, convertirMinutosAHora } from "../utils/time.js";
import { template } from "../lib/schedule.js";
import {
  notFoundError,
  createError,
  missingData,
  duplicateData,
} from "../config/error.js";
import {
  time30Min,
  time45Min,
  time1Hour,
  time1Hour30,
  time2Hour,
} from "../lib/time.js";

//Crear horario
export const create = async (req, res, next) => {
  console.log("---CREATE NEW SCHEDULE---");
  let schedule = new Schedule(req.body);
  try {
    console.log("saving...", schedule);
    const newSchedule = await schedule.save();
    console.log("nuevo horario", newSchedule);
    res.json(newSchedule);
  } catch (err) {
    //console.log("El error: ",err.errors.hotel.properties.message)
    next(err);
  }
};
export const addUpdateDefault = async (req, res, next) => {
  console.log("---ADD UPDATE  SCHEDULE DEFAULT---");
  try {
    const templateSchedule = template;
    const schedule = await Schedule.findOne({ default: true }).exec();
    if (schedule) {
      let updatedSchedule = await Schedule.findOneAndUpdate(
        { user: id },
        templateSchedule,
        {
          new: true,
        }
      ).exec();
      res.json(updatedSchedule);
    } else {
      let schedule = new Schedule(template);
      console.log("saving...", schedule);
      const newSchedule = await schedule.save();
      console.log("nuevo horario", newSchedule);
      res.json(newSchedule);
    }
  } catch (err) {
    next(err);
    res.status(500).json({ message: "Internal server error." });
  }
};

// Crear/Actualizar schedule worker
export const addOrUpdate = async (req, res, next) => {
  console.log("---ADD NEW SCHEDULE OR UPDATE---");
  const user = req.user;
  const id = user._id.toString();
  console.log(id);
  const schedules = req.body;
  console.log("schedulesss", schedules.schedules);
  try {
    const user = await User.findOne({ _id: id });
    if (!user) {
      let err = createError(409, "User not exist");
      next(err);
      return res.status(409).json(err);
    }
    if (user && user.type != "worker") {
      let err = createError(409, "you dont have the credentials");
      next(err);
      return res.status(409).json(err);
    }
    const schedule = await Schedule.findOne({ user: id });
    if (schedule) {
      console.log("entro", schedule);
      const update = {
        $set: { schedules: schedules.schedules },
      };

      let updatedSchedule = await Schedule.findOneAndUpdate(
        { user: id },
        update,
        {
          new: true,
        }
      ).exec();
      console.log("cambiando", updatedSchedule);
      res.json(updatedSchedule);
    } else {
      let newSchedule = new Schedule(schedules);
      newSchedule.user = id;
      newSchedule.creator = id;
      newSchedule.save();
      res.json(newSchedule);
    }
  } catch (err) {
    next(err);
    res.status(500).json({ message: "Internal server error." });
  }
};

//Obtener horarios por hotel y si estan activos
export const scheduleBusinessbyService = async (req, res, next) => {
  console.log("---GET SCHEDULES BUSINESS BY SERVICE---");
  let body = {};
  Object.assign(body, req.query);
  console.log("query", body);
  let horario = await Schedule.findOne({
    creator: body.id,
    service: body.service,
    isActive: true,
  });
  let subService = await Subservice.findOne({
    _id: body.subService,
    isActive: true,
  });
  console.log("duracion servicio", subService.duration);
  // Obtén la fecha y hora actual en GMT-3 (hora de Brasilia, Brasil)
  var fechaActualBrasil = new Date().toLocaleString("en-US", {
    timeZone: "America/Sao_Paulo",
  });
  // Convierte la fecha y hora actual en una fecha de JavaScript
  var fechaHoraBrasil = new Date(fechaActualBrasil);
  console.log("BRASIL", fechaHoraBrasil);
  let fechaActual = fechaHoraBrasil;
  let horas = [];
  for (var i = 1; i <= 14; i++) {
    let date = fechaActual;
    let day = fechaActual.getDay();
    //console.log("EL DIA", day, date);
    var scheduleNew = [];
    for (let intervalo of horario.schedules[day].intervals) {
      // console.log("inicio", intervalo.startTime, intervalo.endTime);
      const startTimeMinutes = convertirHoraAMinutos(intervalo.startTime);
      const endTimeMinutes = convertirHoraAMinutos(intervalo.endTime);
      // console.log("min", startTimeMinutes, endTimeMinutes);
      let currentTimeMinutes = startTimeMinutes;
      const incrementoMinutos = 60; // Cambia esto para definir el incremento deseado

      while (currentTimeMinutes < endTimeMinutes) {
        const currentTime = convertirMinutosAHora(currentTimeMinutes);

        //-----Aqui vendria parte de ver si existen bookings en ese horario
        //console.log(currentTime);
        scheduleNew.push(currentTime);

        currentTimeMinutes += incrementoMinutos;
      }
    }
    let fecha = date.toISOString().split("T")[0];
    let enviar = {
      day: day,
      horas: fecha,
      intervals: scheduleNew,
    };
    horas.push(enviar);
    fechaActual.setDate(fechaActual.getDate() + 1);
  }

  res.send({ horas });
};
export const getByUser = async (req, res, next) => {
  try {
    console.log("---GET SCHEDULE BY USER ID---");
    const id = req.user._id.toString();
    const schedule = await Schedule.findOne({ user: id }).exec();
    if (schedule) {
      res.send(schedule);
    } else {
      const schedule = await Schedule.findOne({ default: true }).exec();
      schedule.schedules ? res.send(schedule) : res.send({ schedules: [] });
    }
  } catch (err) {
    next(err);
    res.status(500).json({ message: "Internal server error." });
  }
};
//Obtener usuario por ID
export const getById = async (req, res, next) => {
  console.log("---GET SCHEDULE BY ID---");
  Schedule.findOne({ _id: req.params.id }).exec((err, schedule) => {
    if (err) next(err);
    schedule.populate([
      {
        path: "hotel",
        //   select: "isActive name  email phone creator user imgUrl emails type",
      },
    ]);
    if (err) return next(err);
    if (schedule) {
      res.send(schedule);
    } else {
      return next(createError(404, req.lg.user.notFound));
    }
  });
};
//Actualizar data de un usuario
export const updateOne = (req, res, next) => {
  console.log("---UPDATE SCHEDULE---");
  let data = req.body;
  Schedule.findOneAndUpdate(
    {
      _id: req.params.id,
    },
    data,
    {
      new: true,
    }
  ).exec((err, schedule) => {
    if (err) return next(err);
    res.send(schedule);
  });
};
//Activar o desactivar multiples usuarios
export const activateMany = (req, res, next) => {
  console.log("---ACTIVATE MANY SCHEDULE---");
  console.log(req.body);
  Schedule.updateMany(
    { _id: { $in: req.body.schedules } },
    { isActive: req.body.isActive ? req.body.isActive : true }
  ).exec((err, data) => {
    if (err) next(err);
    res.send(data);
  });
  // res.send("buena")
};
