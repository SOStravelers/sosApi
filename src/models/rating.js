import mongoose from "mongoose";
const Schema = mongoose.Schema;
import uniqueValidator from "mongoose-unique-validator";
import mongoosePaginate from "mongoose-paginate-v2";
import paginateConfig from "../config/paginate.js";

const ratingSchema = new Schema(
  {
    isActive: { type: Boolean },
    emisor: { type: String, ref: "User" },
    receptor: { type: String, ref: "User" },
    message: { type: String },
    points: {
      value: { type: String },
      number: { type: Number },
    },
  },
  { timestamps: true }
);

ratingSchema.plugin(mongoosePaginate);
mongoosePaginate.paginate.options = paginateConfig;
const Rating = mongoose.model("Rating", ratingSchema);
export default Rating;
