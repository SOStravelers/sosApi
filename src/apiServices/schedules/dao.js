import Schedule from "./model.js";
import moment from "moment-timezone";

export const businessSchedule = async (data) => {
  console.log("Fetching schedules...");
  const { businessId, serviceId, subserviceId, workerId } = data;
  const subService = subserviceId;

  // Fechas en UTC
  const startDate = moment.utc().startOf("day").toDate();
  const endDate = moment.utc().add(240, "days").endOf("day").toDate();

  console.log(
    "SubService:",
    subService,
    "Start Date:",
    startDate,
    "End Date:",
    endDate
  );

  try {
    const schedules = await Schedule.find({
      subService,
      isActive: true,
      "schedules.isActive": true,
    });

    console.log("Schedules fetched:", schedules.length);

    const daysInRange = [];
    let currentDate = moment.utc(startDate);

    while (currentDate.toDate() <= endDate) {
      daysInRange.push({
        day: currentDate.day(),
        date: currentDate.clone().toDate(),
      });
      currentDate.add(1, "day");
    }

    const responseMap = {};

    schedules.forEach((schedule) => {
      daysInRange.forEach(({ day, date }) => {
        const matchedSchedules = schedule.schedules.filter(
          (entry) => entry.day === day && entry.isActive
        );

        if (matchedSchedules.length > 0) {
          const dateString = moment.utc(date).startOf("day").toISOString();
          if (!responseMap[dateString]) {
            responseMap[dateString] = [];
          }

          matchedSchedules.forEach((entry) => {
            const currentDateString = moment.utc(date).format("YYYY-MM-DD");
            const isoTime = entry.iso.slice(1); // "10:00:00.000Z"

            const intervalStart = moment
              .utc(`${currentDateString}T${isoTime}`)
              .toDate();

            // Validar si ya pasó (según hora local Brasil)
            const nowInBrazil = moment.tz("America/Sao_Paulo");
            const intervalStartInBrazil = moment
              .utc(intervalStart)
              .tz("America/Sao_Paulo");

            const isTodayInBrazil =
              nowInBrazil.format("YYYY-MM-DD") ===
              intervalStartInBrazil.format("YYYY-MM-DD");

            if (
              isTodayInBrazil &&
              intervalStartInBrazil.isBefore(nowInBrazil)
            ) {
              return; // Saltar este horario porque ya pasó en Brasil
            }

            const duration =
              typeof entry.duration === "number" ? entry.duration : 0;

            const intervalEnd = moment(intervalStart)
              .add(duration, "minutes")
              .toDate();

            if (isNaN(intervalEnd.getTime())) {
              console.error("Invalid intervalEnd:", {
                intervalStart,
                intervalEnd,
              });
              throw new Error("Invalid time value");
            }

            responseMap[dateString].push({
              startTimeIso: intervalStart.toISOString(),
              startTime: intervalStart.toISOString().split("T")[1].slice(0, 5),
              endTimeIso: intervalEnd.toISOString(),
              endTime: intervalEnd.toISOString().split("T")[1].slice(0, 5),
            });
          });
        }
      });
    });

    const response = [];
    daysInRange.forEach(({ date }) => {
      const dateString = moment.utc(date).startOf("day").toISOString();
      const intervals = responseMap[dateString] || [];
      if (intervals.length > 0) {
        response.push({
          day: dateString,
          intervals,
        });
      }
    });
    return response;
  } catch (error) {
    throw err;
  }
};
