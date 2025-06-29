import mongoose from "mongoose";
const Schema = mongoose.Schema;
import uniqueValidator from "mongoose-unique-validator";
import mongoosePaginate from "mongoose-paginate-v2";
import paginateConfig from "../config/paginate.js";
const ProductSchema = new Schema(
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
    imgUrl: { type: Number, default: 0 },
    subservice: { type: String, ref: "Subservice" },
    prices: [
      {
        _id: false,
        currency: { type: String, ref: "Currency" },
        value: { type: Number, default: 0 },
        valueFormated: { type: String, default: "" },
      },
    ],
  },
  { timestamps: true }
);

ProductSchema.plugin(uniqueValidator, {
  message: "This {PATH} is already in use.",
});
ProductSchema.plugin(mongoosePaginate);
mongoosePaginate.paginate.options = paginateConfig;
const Product = mongoose.model("Price", ProductSchema);
export default Product;
