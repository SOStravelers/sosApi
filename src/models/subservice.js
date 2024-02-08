import mongoose from "mongoose";
const Schema = mongoose.Schema;
import uniqueValidator from "mongoose-unique-validator";
import mongoosePaginate from "mongoose-paginate-v2";
import paginateConfig from "../config/paginate.js";

const subserviceSchema = new Schema(
  {
    name: { type: String, unique: true },
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
