import mongoose from "mongoose";
const Schema = mongoose.Schema;

const scheduleMultipleSchema = new Schema(
  {
    user: { type: String, ref: "User" },
    isActive: { type: Boolean, default: true },
    default: { type: Boolean, default: false },
    service: { type: String, ref: "Service" },
    subService: { type: String, ref: "Subservice" },
    timeZone: { type: String },
    duration: { type: Number, default: 0 },
    schedules: [
      {
        day: Number, // 0-6 (representando los días de la semana)
        isActive: Boolean, // Habilitado/deshabilitado para ese día
        iso: String, // Fecha y hora exacta del horario
        limitClients: { type: Number, default: 0 },
      },
    ],
    creator: { type: String, ref: "User" },
    details: {
      en: {
        type: String,
        default: "",
      },
      es: {
        type: String,
        default: "",
      },
      fr: {
        type: String,
        default: "",
      },
      pt: {
        type: String,
        default: "",
      },
      de: {
        type: String,
        default: "",
      },
    },
    locationInfo: {
      en: {
        type: String,
        default: "",
      },
      es: {
        type: String,
        default: "",
      },
      fr: {
        type: String,
        default: "",
      },
      pt: {
        type: String,
        default: "",
      },
      de: {
        type: String,
        default: "",
      },
    },
    mapUrl: { type: String },
    price: { type: Number, default: 0 },
    videoUrl: { type: String },
    imgUrl: { type: String },
    limit: { type: Number, default: 1 },
    multiple: { type: Boolean, default: false },
    hasLimit: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const ScheduleMultiple = mongoose.model(
  "ScheduleMultiple",
  scheduleMultipleSchema
);
export default ScheduleMultiple;
