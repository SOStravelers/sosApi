import Schedule from "../models/schedule.js";
import Service from "../models/service.js";
import Subservice from "../models/subservice.js";
import mongoose from "mongoose";
import { convertirHoraAMinutos, convertirMinutosAHora } from "../utils/time.js";
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
