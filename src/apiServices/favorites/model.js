import mongoose from "mongoose";
const Schema = mongoose.Schema;
import uniqueValidator from "mongoose-unique-validator";
import mongoosePaginate from "mongoose-paginate-v2";
import paginateConfig from "../../config/paginate.js";

const favoriteSchema = new Schema(
  {
    isActive: { type: Boolean },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    subservice: { type: mongoose.Schema.Types.ObjectId, ref: "Subservice" },
  },
  { timestamps: true }
);

favoriteSchema.plugin(mongoosePaginate);
mongoosePaginate.paginate.options = paginateConfig;
const Favorite = mongoose.model("Favorite", favoriteSchema);
export default Favorite;
