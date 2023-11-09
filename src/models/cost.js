import mongoose from "mongoose";
const Schema = mongoose.Schema;
import uniqueValidator from "mongoose-unique-validator";
import mongoosePaginate from "mongoose-paginate-v2";
import paginateConfig from "../config/paginate.js";

const costSchema = new Schema(
  {
    number: { type: Number },
    isActive: { type: Boolean, default: true },
    country: { type: String },
    subservices: [
      {
        subservice: { type: String, ref: "Subservice" },
        price: { type: Number },
      },
    ],
  },
  { timestamps: true }
);

costSchema.plugin(mongoosePaginate);
mongoosePaginate.paginate.options = paginateConfig;
const Cost = mongoose.model("Cost", costSchema);
export default Cost;
