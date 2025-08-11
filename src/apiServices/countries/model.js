import mongoose from "mongoose";
const Schema = mongoose.Schema;

const CountrySchema = new Schema(
  {
    name: {
      spanish: { type: String },
      english: { type: String },
      french: { type: String },
      german: { type: String },
      italian: { type: String },
      portuguese: { type: String },
    },
    code: { type: String },
    timeZone: { type: String },
    place_id: { type: String },
    currency: { type: Schema.Types.ObjectId, ref: "Currency", default: null },
    language: { type: Schema.Types.ObjectId, ref: "Language", default: null },
  },
  { timestamps: true }
);

const Country = mongoose.model("Country", CountrySchema);
export default Country;
