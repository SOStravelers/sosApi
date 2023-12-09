import User from "../models/user.js";
import Holiday from "../models/holliday.js";
import Schedule from "../models/schedule.js";
import { template } from "../lib/schedule.js";
import { createError } from "../config/error.js";
import Subservice from "../models/subservice.js";
import { convertirHoraAMinutos, convertirMinutosAHora } from "../utils/time.js";

//Crear horario
export const create = async (req, res, next) => {
  global.logger.info("---CREATE NEW SCHEDULE---");
  try {
    let schedule = new Schedule(req.body);
    const newSchedule = await schedule.save();
    res.status(201).json(newSchedule);
  } catch (err) {
    next(err);
  }
};
export const addUpdateDefault = async (req, res, next) => {
  global.logger.info("---ADD UPDATE  SCHEDULE DEFAULT---");
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
      res.status(200).json(updatedSchedule);
    } else {
      let schedule = new Schedule(template);
      const newSchedule = await schedule.save();
      res.status(201).json(newSchedule);
    }
  } catch (err) {
    next(err);
  }
};
// Crear/Actualizar schedule worker
export const addOrUpdate = async (req, res, next) => {
  global.logger.info("---ADD NEW SCHEDULE OR UPDATE---");
  try {
    const id = req.user._id.toString();
    const schedules = req.body;
    const user = await User.findOne({ _id: id });
    if (!user) {
      throw createError(409, "User not exist");
    }
    if (user && user.type == "personal") {
      throw createError(409, "you dont have the credentials");
    }
    const schedule = await Schedule.findOne({ user: id });
    if (schedule) {
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
      res.status(200).json(updatedSchedule);
    } else {
      let newSchedule = new Schedule(schedules);
      newSchedule.user = id;
      newSchedule.creator = id;
      newSchedule.save();
      res.status(200).json(newSchedule);
    }
  } catch (err) {
    next(err);
  }
};
//Para crear horarios de servicio en negocios
export const addOrUpdateBusiness = async (req, res, next) => {
  global.logger.info("---ADD NEW SCHEDULE OR UPDATE BUSINESS---");
  try {
    const id = req.user._id.toString();
    const service = req.body.service;
    const schedules = req.body.schedules;
    const user = await User.findOne({ _id: id });
    if (!user || user.type != "business") {
      throw createError(409, "you dont have the credentials");
    }
    const schedule = await Schedule.findOne({ user: id, service: service });
    if (schedule) {
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
      res.status(200).json(updatedSchedule);
    } else {
      let newSchedule = new Schedule(schedules);
      newSchedule.user = id;
      newSchedule.creator = id;
      newSchedule.service = service;
      newSchedule.save();
      res.status(200).json(newSchedule);
    }
  } catch (err) {
    next(err);
  }
};
//Obtener horarios por usuario y si estan activos
export const getByUser = async (req, res, next) => {
  global.logger.info("---GET SCHEDULE BY USER ID---");
  try {
    const id = req.user._id.toString();
    let query = { user: id };

    // Si req.query.idService está presente, añadirlo a la consulta
    if (req.query.service) {
      query.service = req.query.service;
    }

    const schedule = await Schedule.findOne(query).exec();
    if (schedule) {
      res.send(schedule);
    } else {
      const schedule = await Schedule.findOne({ default: true }).exec();
      schedule.schedules ? res.send(schedule) : res.send({ schedules: [] });
    }
  } catch (err) {
    next(err);
  }
};
//Obtener schedule por ID
export const getById = async (req, res, next) => {
  global.logger.info("---GET SCHEDULE BY ID---");
  try {
    const schedule = await Schedule.findOne({ _id: req.params.id })
      .populate([
        {
          path: "hotel",
          //   select: "isActive name  email phone creator user imgUrl emails type",
        },
      ])
      .exec();
    if (!schedule) throw createError(404, "Schedule not found");
    res.status(200).json(schedule);
  } catch (err) {
    next(err);
  }
};
//Actualizar data de un schedule
export const updateOne = async (req, res, next) => {
  global.logger.info("---UPDATE SCHEDULE---");
  try {
    let data = req.body;
    const schedule = await Schedule.findOneAndUpdate(
      {
        _id: req.params.id,
      },
      data,
      {
        new: true,
      }
    ).exec();
    res.status(200).json(schedule);
  } catch (err) {
    next(err);
  }
};
//Activar o desactivar multiples schedules
export const activateMany = async (req, res, next) => {
  global.logger.info("---ACTIVATE MANY SCHEDULE---");
  try {
    const schedules = await Schedule.updateMany(
      { _id: { $in: req.body.schedules } },
      { isActive: req.body.isActive ? req.body.isActive : true }
    ).exec();
    res.status(200).json(schedules);
  } catch (err) {
    next(err);
  }
};

//refactoring of scheduleBusinessbyService
export const getScheduleByBusiness = async (req, res, next) => {
  const nextDays = 16; //until now + 15 days after
  const { businessId, serviceId, subserviceId } = req.params;

  Schedule.findOne({
    isActive: true,
    user: businessId,
    service: serviceId,
  })
    .then((schedule) => {
      Subservice.findOne({
        _id: subserviceId,
      })
        .then((subservice) => {
          const allTimes = [];

          Holiday.findOne({
            user: businessId,
          })
            .then((holidays) => {
              for (const i in Array(nextDays).fill()) {
                const dateDay = new Date();
                dateDay.setDate(dateDay.getDate() + Number(i));
                const formatedDay =
                  dateDay.getDay() === 0 ? 7 : dateDay.getDay();

                const scheduleIndex = schedule.schedules.findIndex(
                  (time) => time.day === formatedDay && time.isActive
                );
                if (scheduleIndex < 0) continue;

                const time = schedule.schedules[scheduleIndex];

                let skipLoop = false;
                const allIntervals = [];

                if (holidays && holidays.range) {
                  for(const holiday of holidays.range) {
                    if(dateDay >= holiday.from && dateDay <= holiday.to) {
                      skipLoop = true;
                      break;
                    };
                  }
                }

                if(skipLoop) continue;

                for (const inverval of time.intervals) {
                  const endHourDate = new Date(inverval.endTimeIso);
                  const startHourDate = new Date(inverval.startTimeIso);

                  for (
                    let hour = startHourDate;
                    hour <= endHourDate;
                    hour.setHours(hour.getHours() + 1)
                  ) {
                    //check if that hours isn't booked
                    const endHour = new Date(hour);
                    endHour.setMinutes(
                      endHour.getMinutes() + subservice.duration
                    );

                    allIntervals.push({
                      startTimeIso: hour.toISOString(),
                      startTime: hour.toISOString().slice(11, 16),
                      endtime: endHour.toISOString().slice(11, 16),
                      endTimeIso: endHour.toISOString(),
                    });
                  }
                }

                allTimes.push({
                  day: dateDay,
                  intervals: allIntervals,
                });
              }
              res.status(200).json(allTimes);
            })
            .catch((err) => next(err));
        })
        .catch((err) => next(err));
    })
    .catch((err) => next(err));
};

//Por revisar:

//Obtener horarios por hotel y si estan activos
export const scheduleBusinessbyService = async (req, res, next) => {
  global.logger.info("---GET SCHEDULES BUSINESS BY SERVICE---");
  let body = {};
  Object.assign(body, req.query);
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
