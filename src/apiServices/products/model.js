import mongoose from "mongoose";
const Schema = mongoose.Schema;
import uniqueValidator from "mongoose-unique-validator";
import mongoosePaginate from "mongoose-paginate-v2";
import paginateConfig from "../../config/paginate.js";

const ProductSchema = new Schema(
  {
    item: { type: mongoose.Schema.Types.ObjectId, ref: "Item" },
    order: { type: Number },
    name: { type: String },
    default: { type: Boolean, default: false },
    imgUrl: { type: String },
    isActive: { type: Boolean, default: true },
    hasQuantity: { type: Boolean, default: false },
    hasLimitTime: { type: Boolean, default: false },
    limitTime: { type: Number, default: 0 },
    min: { type: Number, default: 1 },
    max: { type: Number, default: 1 },
    price: {
      usd: { type: Number },
      eur: { type: Number },
      brl: { type: Number },
    },
  },
  { timestamps: true }
);

ProductSchema.plugin(uniqueValidator, {
  message: "This {PATH} is already in use.",
});
ProductSchema.plugin(mongoosePaginate);
mongoosePaginate.paginate.options = paginateConfig;
const Product = mongoose.model("Product", ProductSchema);
export default Product;
