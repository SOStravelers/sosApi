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
    details: { type: String },
    imgUrl: { type: String },
    creator: { type: String, ref: "User" },
    updated: {
      updatedAt: {
        type: Date,
        default: new Date(),
      },
      updatedBy: { type: String, ref: "User" },
    },
    // price: {
    //   value: { type: String, default: "$ 0" },
    //   lastValue: { type: String, default: "$ 0" },
    //   number: { type: Number, default: 0 },
    //   lastNumber: { type: Number, default: 0 },
    // },
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
