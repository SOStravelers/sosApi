import mongoose from "mongoose";
const Schema = mongoose.Schema;
import uniqueValidator from "mongoose-unique-validator";
import mongoosePaginate from "mongoose-paginate-v2";
import paginateConfig from "../config/paginate.js";

const favoriteSchema = new Schema(
  {
    isActive: { type: Boolean },
    emisor: { type: String, ref: "User" },
    receptor: { type: String, ref: "User" },
    type: {
      type: String,
      enum: ["hostel", "worker", "hotel"],
    },
  },
  { timestamps: true }
);

favoriteSchema.plugin(mongoosePaginate);
mongoosePaginate.paginate.options = paginateConfig;
const Favorite = mongoose.model("Favorite", favoriteSchema);
export default Favorite;
