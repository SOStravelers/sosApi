import mongoose from "mongoose";
const Schema = mongoose.Schema;

const scheduleMultipleSchema = new Schema(
  {
    user: { type: String, ref: "User" },
    isActive: { type: Boolean, default: true },
    default: { type: Boolean, default: false },

    service: { type: String, ref: "Service" },
    subService: { type: String, ref: "Subservice" },
    location: { type: String },
    timeZone: { type: String },
    duration: { type: Number, default: 0 },
    schedules: [
      {
        day: Number, // 0-6 (representando los días de la semana)
        isActive: Boolean, // Habilitado/deshabilitado para ese día
        iso: String, // Fecha y hora exacta del horario
      },
    ],
    creator: { type: String, ref: "User" },

    details: { type: String },
  },
  { timestamps: true }
);

const ScheduleMultiple = mongoose.model(
  "ScheduleMultiple",
  scheduleMultipleSchema
);
export default ScheduleMultiple;
