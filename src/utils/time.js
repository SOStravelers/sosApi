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
