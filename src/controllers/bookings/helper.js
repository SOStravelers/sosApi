import moment from "moment-timezone";
import { createError } from "../../config/error.js";

export const optionsBooking = (page, limit) => {
  const populate = [
    {
      path: "businessUser",
      select: "businessData personalData img",
    },
    {
      path: "workerUser",
      select: "workerData personalData img",
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
      select: "personalData",
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


export const countDateBookings = (startDate, endDate, userId) => {
  return {
    "date.isoDate": {
      $gte: moment.utc(startDate).format(),
      $lte: moment.utc(endDate).format(),
    },
    businessUser: userId,
    status: { $in: ["canceled", "completed", "failed", "confirmed"] },
    "payment.status": { $in: ["paid"] },
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
  return [
    {
      $match: {
        [`${typeUser}`]: userId,
        "date.isoDate": {
          $gte: new Date(moment.utc(startDate).toISOString()),
          $lte: new Date(moment.utc(endDate).toISOString()),
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

const sumDays = (date, day) => {
  return moment(date).add(day, "days").format("YYYY-MM-DD");
};

export const daysOfweek = (result, startWeek) => {
  if (result.length < 7) {
  let days = 1, response = [];
  while (days <= 7) {
    const position = result.findIndex(
      (e) => e.day === sumDays(startWeek, days)
    );
    if (position !== -1) {
      response.push({
        day: sumDays(startWeek, days),
        bookings: result[position].bookings.length,
      });
    } else {
      response.push({ day: sumDays(startWeek, days), bookings: 0 });
    }
    days++;
  }
  return response;
}
};


