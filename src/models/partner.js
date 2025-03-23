import mongoose from "mongoose";
const Schema = mongoose.Schema;
import uniqueValidator from "mongoose-unique-validator";
import mongoosePaginate from "mongoose-paginate-v2";
import paginateConfig from "../config/paginate.js";
const partnerSchema = new Schema(
  {
    clientId: { type: String, unique: true },
    partner: { type: String },
    lastPartner: { type: String },
    lastConection: { type: Date },
    firstConection: { type: Date },
  },
  { timestamps: true }
);
partnerSchema.plugin(uniqueValidator, {
  message: "This {PATH} is already in use.",
});
partnerSchema.plugin(mongoosePaginate);
mongoosePaginate.paginate.options = paginateConfig;
const Partner = mongoose.model("Partner", partnerSchema);
export default Partner;
