import mongoose from "mongoose";
const Schema = mongoose.Schema;
import mongoosePaginate from "mongoose-paginate-v2";
import paginateConfig from "../config/paginate.js";

const bookingSchema = new Schema(
  {
    businessUser: { type: String, ref: "User" },
    workerUser: { type: String, ref: "User" },
    clientUser: { type: String, ref: "User" },
    creatorUser: { type: String, ref: "User" },
    service: { type: String, ref: "Service" },
    subservice: { type: String, ref: "Subservice" },
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
    details: { type: String },
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
    },
    duration: { type: Number },
    coverImg: { type: String, default: "" },
    status: {
      type: String,
      default: "requested",
      enum: ["requested", "matched", "canceled", "completed", "failed"],
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
