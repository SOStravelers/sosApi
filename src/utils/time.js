import { DateTime } from "luxon";
import { createError } from "../config/error.js";
export const convertirHoraAMinutos = (hora) => {
  const [hh, mm] = hora.split(":");
  const amPm = hora.slice(-2);
  const hhInt = parseInt(hh, 10);
  const mmInt = parseInt(mm, 10);

  if (!isNaN(hhInt) && !isNaN(mmInt)) {
    if (amPm === "PM") {
      if (hhInt === 12) {
        return 720; // Convertir "12:00 PM" a 720 minutos
      } else {
        return (hhInt + 12) * 60 + mmInt;
      }
    } else if (amPm === "AM") {
      if (hhInt === 12) {
        return mmInt; // Convertir "12:00 AM" a 0 minutos
      } else {
        return hhInt * 60 + mmInt;
      }
    }
  }

  return NaN; // Devolver NaN si la entrada no es válida
};
// Función para formatear minutos como HH:MM AM/PM
export const convertirMinutosAHora = (minutos) => {
  const hh = Math.floor(minutos / 60) % 12 || 12;
  const mm = minutos % 60;
  const amPm = minutos < 720 ? "AM" : "PM";
  return `${hh.toString().padStart(2, "0")}:${mm
    .toString()
    .padStart(2, "0")} ${amPm}`;
};

const meses = {
  en: [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ],
  es: [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ],
  pt: [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ],
  fr: [
    "Janvier",
    "Février",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juillet",
    "Août",
    "Septembre",
    "Octobre",
    "Novembre",
    "Décembre",
  ],
  de: [
    "Januar",
    "Februar",
    "März",
    "April",
    "Mai",
    "Juni",
    "Juli",
    "August",
    "September",
    "Oktober",
    "November",
    "Dezember",
  ],
};

export function formatRangeFromISO({
  isoTime,
  language = "en",
  timeZone = "America/Sao_Paulo",
  duration = 0,
}) {
  console.log("format Time");
  if (!isoTime) throw createError(400, "isoTime is missing");
  const start = DateTime.fromISO(isoTime, { zone: timeZone });
  const end = start.plus({ minutes: duration });

  const monthStart = meses[language][start.month - 1];
  const monthEnd = meses[language][end.month - 1];

  const formattedStart = `${monthStart} ${start.day}, ${
    start.year
  }, ${start.toFormat("HH")}h`;
  const formattedEnd = `${monthEnd} ${end.day}, ${end.year}, ${end.toFormat(
    "HH"
  )}h`;

  return {
    start: formattedStart,
    end: formattedEnd,
  };
}
