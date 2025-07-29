import mongoose from "mongoose";
const Schema = mongoose.Schema;
import mongoosePaginate from "mongoose-paginate-v2";
import paginateConfig from "../../config/paginate.js";
import uniqueValidator from "mongoose-unique-validator";
const bookingSchema = new Schema(
  {
    workerUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    provider: { type: mongoose.Schema.Types.ObjectId, ref: "Provider" },
    clientUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    currency: { type: mongoose.Schema.Types.ObjectId, ref: "Currency" },
    clientData: { type: Object },
    clientEmail: { type: String },
    clientPhone: { type: String },
    imgUrl: { type: String },
    videoUrl: { type: String },
    country: { type: Schema.Types.ObjectId },
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
    price: {
      netAmount: { type: Number },
      taxes: { type: Number },
      percentage: { type: Number },
      grossAmount: { type: Number },
    },
    idKey: { type: String },
    purchaseOrder: { type: String, unique: true, sparse: true },
    startTime: {
      formatedDate: { type: String },
      formatedTime: { type: String },
      isoTime: { type: Date },
    },
    endTime: {
      stringData: { type: String },
      isoTime: { type: Date },
    },
    duration: { type: Number },
    title: { type: String, default: "new Event" },
    payments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Payment" }],

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
    paymentStatus: {
      type: String,
      default: "requested",
      enum: ["unpaid", "paid", "refund", "canceled"],
    },
    canCancel: { type: Boolean },
    timeUntilCancel: { type: Number },

    observations: Array({
      creator: { type: String, ref: "User" },
      observation: Array({ type: String, default: null }),
    }),
  },
  { timestamps: true }
);
//Validate unique value message
bookingSchema.plugin(uniqueValidator, {
  message: "This {PATH} is already in use.",
});
bookingSchema.plugin(mongoosePaginate);
mongoosePaginate.paginate.options = paginateConfig;
const Booking = mongoose.model("Booking", bookingSchema);
export default Booking;
