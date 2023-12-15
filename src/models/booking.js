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
    startTime: { type: String },
    endTime: { type: String },
    date: {
      stringData: { type: String },
      isoDate: { type: Date },
    },
    title: { type: String, default: "new Event" },
    details: { type: String },
    paymentMethod: {
      type: String,
      default: "stripe",
      enum: ["cash", "paypal", "stripe"],
    },
    paymentId: { type: String, ref: "Payment" },
    duration: { type: Number },
    suggestedDuration: { type: Number },
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
