import mongoose from "mongoose";
const Schema = mongoose.Schema;

const currencySchema = new Schema(
  {
    name: {
      spanish: { type: String },
      english: { type: String },
      french: { type: String },
      german: { type: String },
      italian: { type: String },
      portuguese: { type: String },
    },
    code: String,
    precision: { type: Number, min: 0, max: 10 },
    symbol: String,
    positionSymbol: { type: String, enum: ["left", "right"] },
    typeFormat: { type: String, enum: ["cl", "us"] },
  },
  { timestamps: true }
);

const Currency = mongoose.model("Currency", currencySchema);
export default Currency;
