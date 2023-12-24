import User from "../models/user.js";
import Holiday from "../models/holliday.js";
import Booking from "../models/booking.js";
import Schedule from "../models/schedule.js";
import { template } from "../lib/schedule.js";
import { createError } from "../config/error.js";
import Subservice from "../models/subservice.js";
import { convertirHoraAMinutos, convertirMinutosAHora } from "../utils/time.js";
import moment from "moment-timezone";

//Crear horario
export const create = async (req, res, next) => {
  global.logger.info("---CREATE NEW SCHEDULE---");
  console.log("estoy en create");
  try {
    let schedule = new Schedule(req.body);
    const newSchedule = await schedule.save();
    res.status(201).json(newSchedule);
  } catch (err) {
    next(err);
  }
};
export const addUpdateDefault = async (req, res, next) => {
  global.logger.info("---ADD UPDATE SCHEDULE DEFAULT---");
  try {
    const templateSchedule = template;
    const schedule = await Schedule.findOne({ default: true }).exec();
    if (schedule) {
      let updatedSchedule = await Schedule.findOneAndUpdate(
        { _id: schedule._id },
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
// Crear /Actualizar schedule worker
export const addOrUpdateWorker = async (req, res, next) => {
  global.logger.info("---ADD NEW SCHEDULE OR UPDATE WORKER---");
  try {
    const id = req.user._id.toString();
    const schedules = req.body;
    const user = await User.findOne({ _id: id });
    if (!user) {
      throw createError(409, "User not exist");
    }
    if (!user || user.type != "worker") {
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
    console.log("body", req.body);
    const id = req.user._id.toString();
    const service = req.body.service;
    const schedules = req.body.schedules;
    const user = await User.findById(id);
    if (!user || user.type != "business") {
      throw createError(409, "you dont have the credentials");
    }
    const existSchedule = await Schedule.findOne({
      user: id,
      service: service,
    });
    if (existSchedule) {
      console.log("update", schedules);
      const update = {
        $set: { schedules: schedules },
      };

      let updatedSchedule = await Schedule.findOneAndUpdate(
        { user: id, service: service },
        update,
        {
          new: true,
        }
      ).exec();
      res.status(200).json(updatedSchedule);
    } else {
      let newSchedule = new Schedule(schedules);
      newSchedule.user = id;
      newSchedule.schedules = schedules;
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
      global.logger.info("---NEW DEFAULT SCHEDULE BY USER ID---");
      const schedule = await Schedule.findOne({ default: true }).exec();
      schedule.schedules ? res.send(schedule) : res.send({ schedules: [] });

      let newSchedule = new Schedule(template);
      newSchedule.user = id;
      newSchedule.creator = "default";
      newSchedule.save();
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
// Horario de negocio por servicio
export const businessSchedule = async (req, res, next) => {
  global.logger.info("---GET SCHEDULES BUSINESS BY SERVICE MAIN FLOW---");
  const { businessId, serviceId, subserviceId, workerId } = req.query;
  //----variables para bucles de dias-----
  const today = new Date(); // dia de hoy
  let dayContinue = 0; // variable para saber si saltar dias
  let nextDay = 0; // variable auxiliar para el bucle de dias
  const untilDays = 15; // dias maximos para ralizar el bucle de dias
  const allTimes = []; // array para guardar los dias y sus horarios
  const limitDate = today.setDate(today.getDate() + untilDays); // dias maximos a mostrar en el calendario
  // Variables para desfasar primera hora de booking posible. Es decir si tomo ahora, significa que puedo tomar desde dentro de 30 minutos
  let bookingPosible = true; //para activar o no ese desfase
  let minDesfase = 30; //minutos
  //-------------
  //Variable que permite la hora minima posible para agendar (independiente de las horas del calendario
  let horaMinDia = 9; //Variable que permite la hora minima posible para agendar (independiente)

  try {
    const user = await User.findById(businessId);
    if (user?.type != "business" || !user?.businessData?.isActive) {
      throw createError(404, "User is not active");
    }
    const schedule = await Schedule.findOne({
      isActive: true,
      user: businessId,
      service: serviceId,
    });
    if (!schedule) {
      return res.status(200).json([]);
    }
    const subservice = await Subservice.findOne({
      _id: subserviceId,
    });
    if (!subservice) {
      return res.status(200).json([]);
    }
    const holidays = await Holiday.findOne({
      user: businessId,
    });
    const startDate = new Date();
    startDate.setUTCHours(0, 0, 0, 0); // Set the time to 00:00:00.000

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 15); // Add 15 days
    endDate.setUTCHours(0, 0, 0, 0); // Set the time to 00:00:00.000
    console.log("wena", startDate, endDate, subserviceId, businessId, workerId);
    const bookings = await Booking.find({
      service: serviceId,
      businessUser: businessId,
      //subservice: subserviceId,
      "date.isoDate": { $gte: startDate, $lt: endDate },
    });
    console.log("bookings", bookings.length);

    //Busca bookings de un worker en especifico solo si viene la id
    var bookingWorker = [];
    if (workerId) {
      bookingWorker = await Booking.find({
        workerUser: workerId,
        "date.isoDate": { $gte: startDate, $lt: endDate },
      });
    }
    console.log("todos los booking worker", bookingWorker.length);

    while (dayContinue < untilDays) {
      const dateDay = new Date();
      dateDay.setDate(dateDay.getDate() + Number(nextDay));
      dateDay.setUTCHours(0, 0, 0, 0);
      if (dateDay > limitDate) {
        break;
      }
      const formatedDay = dateDay.getUTCDay();
      const scheduleIndex = schedule.schedules.findIndex(
        (time) => time.day === formatedDay && time.isActive
      );
      if (scheduleIndex < 0) {
        ++nextDay;
        continue;
      }
      const time = schedule.schedules[scheduleIndex];
      let skipLoop = false;
      const allIntervals = [];
      if (holidays && holidays.range) {
        for (const holiday of holidays.range) {
          if (dateDay >= holiday.from && dateDay <= holiday.to) {
            skipLoop = true;
            break;
          }
        }
      }
      if (skipLoop) {
        ++nextDay;
        continue;
      }
      console.log("buena", dateDay, time.intervals.length);
      for (const interval of time.intervals) {
        console.log(interval);
        const startHourDate = cambioHora(
          new Date(interval.startTimeIso),
          dateDay
        );
        startHourDate.setMilliseconds(0);
        const endHourDate = cambioHora(new Date(interval.endTimeIso), dateDay);
        endHourDate.setMilliseconds(0);
        for (
          let hour = startHourDate;
          hour <= endHourDate;
          hour.setMinutes(hour.getMinutes() + subservice.duration)
        ) {
          // Obtener la hora local actual en Brasil
          const horaLocalBrasil = moment()
            .tz("America/Sao_Paulo")
            .format("YYYY-MM-DDTHH:mm:ss.SSS[Z]");

          // Convertir la hora local de Brasil a objeto Date
          const fechaHoraLocalBrasil = new Date(horaLocalBrasil);
          // console.log("horas", hour, horaLocalBrasil);

          if (hour < fechaHoraLocalBrasil) {
            console.log("salto");
            continue;
          }

          const endHour = new Date(hour);
          endHour.setMinutes(endHour.getMinutes() + subservice.duration);
          //Si la hora actual es menor a la hora local de Brasil, se desfasa la hora para que lleguen workers
          if (
            bookingPosible &&
            hour - fechaHoraLocalBrasil < minDesfase * 60 * 1000
          ) {
            console.log("desfase");
            bookingPosible = false;
            hour.setMinutes(hour.getMinutes() + minDesfase);
            endHour.setMinutes(endHour.getMinutes() + minDesfase);
          }
          //Sirve para que una persona no pueda agendar el ultimo servicio del dia en menos tiempo que la duracion del servicio
          const maxHour = new Date(
            endHourDate.getTime() - subservice.duration * 60000 // Resta la duración en milisegundos
          );
          let bookingExists = false;
          for (let i = 0; i < bookings.length; i++) {
            const booking = bookings[i];
            const bookingStartHour = booking.startTime.isoTime;
            const bookingEndHour = booking.endTime.isoTime;

            const strippedDate1 = stripTime(bookingStartHour);
            const strippedDate2 = stripTime(hour);

            if (
              ((stripDate(bookingStartHour) >= stripDate(hour) &&
                stripDate(bookingStartHour) < stripDate(endHour)) ||
                (stripDate(bookingEndHour) > stripDate(hour) &&
                  stripDate(bookingEndHour) <= stripDate(endHour)) ||
                (stripDate(bookingStartHour) <= stripDate(hour) &&
                  stripDate(bookingEndHour) >= stripDate(endHour)) ||
                (stripDate(bookingStartHour) >= stripDate(hour) &&
                  stripDate(bookingEndHour) <= stripDate(endHour))) &&
              strippedDate1.getTime() === strippedDate2.getTime()
            ) {
              bookingExists = true;
              console.log("verdadero");
              break;
            }
          }
          // console.log("booking", bookingExists);
          const date = new Date(hour);
          const onlyHour = date.getUTCHours();

          const dayString = dateDay.toISOString().slice(0, 10);
          const bookingWorkerDay = bookingWorker.filter(
            (booking) => booking.date.stringData === dayString
          );
          console.log("bookings workerSSS", bookingWorkerDay.length);
          console.log(hour, endHour);
          if (bookingWorkerDay.length > 0) {
            console.log("ENTRANDOOOOO");
            const bookingWorkerStartHour =
              bookingWorkerDay[0].startTime.isoTime;
            const bookingWorkerEndHour = bookingWorkerDay[0].endTime.isoTime;
            const strippedDate1 = stripTime(bookingWorkerStartHour);
            const strippedDate2 = stripTime(hour);
            if (
              ((stripDate(bookingWorkerStartHour) >= stripDate(hour) &&
                stripDate(bookingWorkerStartHour) < stripDate(endHour)) ||
                (stripDate(bookingWorkerEndHour) > stripDate(hour) &&
                  stripDate(bookingWorkerEndHour) <= stripDate(endHour)) ||
                (stripDate(bookingWorkerStartHour) <= stripDate(hour) &&
                  stripDate(bookingWorkerEndHour) >= stripDate(endHour)) ||
                (stripDate(bookingWorkerStartHour) >= stripDate(hour) &&
                  stripDate(bookingWorkerEndHour) <= stripDate(endHour))) &&
              strippedDate1.getTime() === strippedDate2.getTime()
            ) {
              bookingExists = true;
              console.log("hay booking de worker");
              continue;
            }
          }

          //condicion final: solo se agregan si:
          //1. no existe un booking en ese horario
          //2. la hora final es menor o igual a la hora maxima
          //3. la hora inicial es mayor o igual a las 9am
          if (
            !bookingExists &&
            onlyHour >= horaMinDia &&
            startHourDate <= maxHour
          ) {
            allIntervals.push({
              startTimeIso: hour.toISOString(),
              startTime: hour.toISOString().slice(11, 16),
              endTime: endHour.toISOString().slice(11, 16),
              endTimeIso: endHour.toISOString(),
            });
          }
        }
      }

      allTimes.push({
        day: dateDay,
        intervals: allIntervals,
      });
      ++nextDay;
      ++dayContinue;
    }
    res.status(200).json(allTimes);
  } catch (err) {
    next(err);
  }
};

const cambioHora = (hour, dateDay) => {
  // Obtener partes de año, mes y día de 'dateDay'
  let yearMonthDayPart = dateDay.toISOString().slice(0, 10);

  // Obtener la parte de la hora de 'hour'
  let hourPart = hour.toISOString().slice(11, 19);

  // Crear la nueva variable 'hour' concatenando las partes
  let newHourString = yearMonthDayPart + "T" + hourPart + ".000Z";
  return new Date(newHourString);
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

function stripTime(date) {
  const newDate = new Date(date);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
}
