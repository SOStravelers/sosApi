import mongoose from "mongoose";
const Schema = mongoose.Schema;
import uniqueValidator from "mongoose-unique-validator";
import mongoosePaginate from "mongoose-paginate-v2";
import paginateConfig from "../config/paginate.js";

const subserviceDetailSchema = new Schema(
  {
    subService: { type: String, ref: "subService" },
    workerUser: { type: Boolean, default: true },
    duration: { type: Number },
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
subserviceDetailSchema.plugin(uniqueValidator, {
  message: "This {PATH} is already in use.",
});
subserviceSchema.plugin(mongoosePaginate);
mongoosePaginate.paginate.options = paginateConfig;
const SubserviceDetail = mongoose.model(
  "SubserviceDetail",
  subserviceDetailSchema
);
export default SubserviceDetail;
