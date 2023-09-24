import mongoose from "mongoose";
const Schema = mongoose.Schema;
import mongoosePaginate from "mongoose-paginate-v2";
import paginateConfig from "../config/paginate.js";

const bookingSchema = new Schema(
  {
    location: { type: String, ref: "User" },
    subService: { type: String, ref: "Service" },
    worker: { type: String, ref: "User" },
    client: { type: String, ref: "User" },
    creator: { type: String, ref: "User" },
    startTime: { type: String },
    endTime: { type: String },
    date: { type: String },

    title: { type: String, default: "new Event" },
    details: { type: String },
    payment: { type: String, default: "cash", enum: ["cash", "card"] },

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
