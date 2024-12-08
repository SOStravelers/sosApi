import mongoose from "mongoose";
const Schema = mongoose.Schema;

const PriceSchema = new Schema(
  {
    user: { type: String, ref: "User" },
    subservice: { type: String, ref: "Subservice" },
    value: { type: Number, default: 0 },
    currencyCode: { type: String, default: "BRL" },
  },
  { timestamps: true }
);

const Price = mongoose.model("Price", PriceSchema);
export default Price;
