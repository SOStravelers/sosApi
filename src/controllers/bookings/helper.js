import moment from "moment-timezone";
import "moment/locale/es.js";
import "moment/locale/fr.js";
import "moment/locale/de.js";
import "moment/locale/pt.js";
import { createError } from "../../config/error.js";

export const optionsBooking = (page, limit) => {
  const populate = [
    {
      path: "businessUser",
      select: "businessData personalData img email",
    },
    {
      path: "workerUser",
      select: "workerData personalData img email",
    },
    {
      path: "service",
      select: "name isActive coverImg",
    },
    {
      path: "subservice",
      select: "name isActive coverImg duration imgUrl",
    },
    {
      path: "clientUser",
      select: "personalData email",
    },
  ];
  return {
    populate: populate,
    select: "payment idKey startTime currency status endTime date duration ",
    page: page || 1,
    limit: limit || 100,
    sort: { "startTime.isoTime": 1 },
  };
};

export const bookingPopulate = () => {
  const populate = [
    {
      path: "businessUser",
      select: "businessData personalData img email",
    },
    {
      path: "workerUser",
      select: "workerData personalData img email",
    },
    {
      path: "service",
      select: "name isActive coverImg",
    },
    {
      path: "subservice",
      select: "name isActive coverImg duration",
    },
    {
      path: "clientUser",
      select: "personalData email",
    },
  ];
  return populate;
};

export const countDateBookings = (startDate, endDate, userId) => {
  return {
    "date.isoDate": {
      $gte: moment.utc(startDate).format(),
      $lte: moment.utc(endDate).add(1, "day").format(),
    },
    businessUser: userId,

    status: { $in: ["canceled", "completed", "failed", "confirmed"] },
  };
};

export const countAllDateBookings = (endDate, userId) => {
  return {
    "date.isoDate": {
      $lte: moment.utc(endDate).add(1, "day").format(),
    },
    businessUser: userId,

    status: { $in: ["canceled", "completed", "failed", "confirmed"] },
  };
};

export const countDateProjectionBookings = (startDate, endDate, userId) => {
  return {
    "date.isoDate": {
      $gte: moment.utc(startDate).format(),
      $lte: moment.utc(endDate).add(1, "day").format(),
    },
    businessUser: userId,
    $or: [
      {
        status: { $in: ["canceled", "completed", "failed"] },
        "payment.status": { $in: ["paid"] },
      },
      {
        status: { $in: ["confirmed"] },
        "payment.status": { $in: ["pending"] },
      },
    ],
  };
};

export const countAllBookings = (userId) => {
  return {
    businessUser: userId,
    status: { $in: ["canceled", "completed", "failed", "confirmed"] },
    "payment.status": { $in: ["paid"] },
  };
};

export const countWeekBookings = (typeUser, userId, startDate, endDate) => {
  console.log("countWeekBookings");

  console.log(moment.tz(startDate, "America/Sao_Paulo").toDate());
  console.log(moment.tz(endDate, "America/Sao_Paulo").toDate());
  return [
    {
      $match: {
        [`${typeUser}`]: userId,
        "date.isoDate": {
          $gte: new Date(moment.tz(startDate, "America/Sao_Paulo").toDate()),
          $lte: new Date(moment.tz(endDate, "America/Sao_Paulo").toDate()),
        },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$date.isoDate" },
          month: { $month: "$date.isoDate" },
          day: { $dayOfMonth: "$date.isoDate" },
        },
        bookings: { $push: "$$ROOT" },
      },
    },
    {
      $sort: {
        "_id.year": 1,
        "_id.month": 1,
        "_id.day": 1,
      },
    },
    {
      $project: {
        _id: 0,
        day: {
          $dateToString: {
            format: "%Y-%m-%d",
            date: {
              $dateFromString: {
                dateString: {
                  $concat: [
                    { $toString: "$_id.year" },
                    "-",
                    { $toString: "$_id.month" },
                    "-",
                    { $toString: "$_id.day" },
                  ],
                },
                format: "%Y-%m-%d",
              },
            },
          },
        },
        bookings: 1,
      },
    },
    {
      $sort: {
        day: 1,
      },
    },
  ];
};

export const validateFormatDate = (dateString, dateEndString) => {
  if (dateEndString) {
    if (
      !moment(dateString, "YYYY-MM-DD", true).isValid() ||
      !moment(dateEndString, "YYYY-MM-DD", true).isValid()
    ) {
      throw createError(400, "invalid date format");
    }
  } else if (!moment(dateString, "YYYY-MM-DD", true).isValid()) {
    throw createError(404, "invalid date format");
  }
};

const sumDay = (date, day, language) => {
  // Establecer el idioma según el parámetro `language`
  !language ? (language = "en") : (language = language);
  moment.locale(language);

  console.log("chabela", date, day, language);

  const formattedDate = moment(date).add(day, "days").format("YYYY-MM-DD");
  const formattedNumber = moment(date).add(day, "days").format("DD");
  const formattedDay = moment(date).add(day, "days").format("ddd"); // Obtiene las 3 primeras letras del día según el idioma

  console.log("wena", formattedDay);

  return { date: formattedDate, number: formattedNumber, day: formattedDay };
};

export const daysOfweek = (result, startWeek, language) => {
  if (result.length < 7) {
    let days = 0,
      response = [];
    while (days < 7) {
      const { date, number, day } = sumDay(startWeek, days, language);
      const position = result.findIndex((e) => e.day === date);
      if (position !== -1) {
        response.push({
          day: day,
          number: number,
          date: date,
          bookings: result[position].bookings.length,
        });
      } else {
        response.push({
          day: day,
          number: number,
          date: date,
          bookings: 0,
        });
      }
      days++;
    }
    return response;
  }
};
