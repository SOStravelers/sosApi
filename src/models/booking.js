import mongoose from "mongoose";
const Schema = mongoose.Schema;
import mongoosePaginate from "mongoose-paginate-v2";
import paginateConfig from "../config/paginate.js";

const bookingSchema = new Schema(
  {
    businessUser: { type: String, ref: "User" },
    workerUser: { type: String, ref: "User" },
    firstWorker: { type: String, ref: "User" },
    clientUser: { type: String, ref: "User" },
    clientPhone: { type: String },
    multiple: { type: Boolean, default: false },
    clients: [
      {
        name: { type: String },
        email: { type: String },
        typeDocument: { type: String },
        document: { type: String },
        phone: { type: String },
      },
    ],
    clientsNumber: { type: Number, default: 1 },
    price: { type: Number, default: 0 },
    limit: { type: Number },
    type: { type: String, default: "personal", enum: ["personal", "group"] },
    creatorUser: { type: String, ref: "User" },
    service: { type: String, ref: "Service" },
    subservice: { type: String, ref: "Subservice" },
    idKey: { type: String },
    startTime: {
      stringData: { type: String },
      isoTime: { type: Date },
    },
    endTime: {
      stringData: { type: String },
      isoTime: { type: Date },
    },
    date: {
      stringData: { type: String },
      isoDate: { type: Date },
    },
    title: { type: String, default: "new Event" },
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
    priceUnitService: { type: Number },
    payment: {
      method: {
        type: String,
        default: "stripe",
        enum: ["cash", "paypal", "stripe"],
      },
      status: {
        type: String,
        default: "pending",
        enum: ["pending", "paid", "failed", "canceled", "refunded"],
      },
      paymentId: { type: String, ref: "Payment" },
      price: { type: Number },
      priceBRL: { type: Number },
      partner: { type: String, ref: "User", default: null },
      currency: { type: String, default: "BRL" },
    },
    duration: { type: Number },
    coverImg: { type: String, default: "" },
    canceledData: {
      canceledBy: { type: String, ref: "User" },
      canceledAtUTC: { type: Date },
      timeZone: { type: String },
      previusStatus: { type: String },
    },
    completedData: {
      completedBy: { type: String, ref: "User" },
      completedSOS: { type: Boolean, default: false },
      completedAtUTC: { type: Date },
      timeZone: { type: String },
      previusStatus: { type: String },
    },
    status: {
      type: String,
      default: "requested",
      enum: [
        "requested",
        "available",
        "confirmed",
        "canceled",
        "completed",
        "failed",
      ],
    },
    observations: Array({
      creator: { type: String, ref: "User" },
      observation: Array({ type: String, default: null }),
    }),
  },
  { timestamps: true }
);

bookingSchema.plugin(mongoosePaginate);
mongoosePaginate.paginate.options = paginateConfig;
const Booking = mongoose.model("Booking", bookingSchema);
export default Booking;
