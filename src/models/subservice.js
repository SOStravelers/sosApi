import mongoose from "mongoose";
const Schema = mongoose.Schema;
import uniqueValidator from "mongoose-unique-validator";
import mongoosePaginate from "mongoose-paginate-v2";
import paginateConfig from "../config/paginate.js";

const subserviceSchema = new Schema(
  {
    name: {
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
    shortDescription: {
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
    service: { type: String, ref: "Service" },
    isActive: { type: Boolean, default: true },
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
    imgUrl: { type: String },
    creator: { type: String, ref: "User" },
    updated: {
      updatedAt: {
        type: Date,
        default: new Date(),
      },
      updatedBy: { type: String, ref: "User" },
    },
    price: {
      _id: false,
      category1: { type: Number, default: 0 },
      category2: { type: Number, default: 0 },
      category3: { type: Number, default: 0 },
    },
    type: { type: String, default: "personal", enum: ["personal", "group"] },
    limit: { type: Number, default: 1 },
    multiple: { type: Boolean, default: false },
    hasLimit: { type: Boolean, default: false },
    goChat: { type: Boolean, default: false },
    partner: { type: String, ref: "User" },
    isoDate: { type: String },
    stringData: { type: String },
    //hloa
  },
  { timestamps: true }
);
subserviceSchema.plugin(uniqueValidator, {
  message: "This {PATH} is already in use.",
});
subserviceSchema.plugin(mongoosePaginate);
mongoosePaginate.paginate.options = paginateConfig;
const Subservice = mongoose.model("Subservice", subserviceSchema);
export default Subservice;
