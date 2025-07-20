import mongoose from "mongoose";
const Schema = mongoose.Schema;
import mongoosePaginate from "mongoose-paginate-v2";
import paginateConfig from "../../config/paginate.js";

const bookingSchema = new Schema(
  {
    workerUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    clientUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    clientEmail: { type: String },
    clientPhone: { type: String },
    imgUrl: { type: String },
    videoUrl: { type: String },
    country: { type: String },
    eventData: { type: Object },
    tourData: { type: Object },
    categories: { type: Array },
    typeService: { type: String, enum: ["tour", "product"] },
    othersClients: [
      {
        name: { type: String },
        email: { type: String },
        typeDocument: { type: String },
        document: { type: String },
        phone: { type: String },
      },
    ],
    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: "Service" },
    serviceData: { type: Object },
    subserviceId: { type: mongoose.Schema.Types.ObjectId, ref: "Subservice" },
    subserviceData: { type: Object },

    idKey: { type: String },
    startTime: {
      stringData: { type: String },
      isoTime: { type: Date },
    },
    endTime: {
      stringData: { type: String },
      isoTime: { type: Date },
    },
    duration: { type: Number },
    title: { type: String, default: "new Event" },
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: "Payment" },
    canceledData: {
      canceledBy: { type: String, ref: "User" },
      canceledAtUTC: { type: Date },
      timeZone: { type: String },
      previusStatus: { type: String },
    },

    status: {
      type: String,
      default: "requested",
      enum: ["requested", "confirmed", "canceled", "completed"],
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
