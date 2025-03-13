import mongoose from "mongoose";
const Schema = mongoose.Schema;
import uniqueValidator from "mongoose-unique-validator";

const wmessageSchema = new Schema(
  {
    number: { type: String, required: true },
    body: { type: String },
  },
  { timestamps: true }
);

const Wmessage = mongoose.model("Wmessage", wmessageSchema);

export default Wmessage;
