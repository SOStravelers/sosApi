import mongoose from "mongoose";
const Schema = mongoose.Schema;
import uniqueValidator from "mongoose-unique-validator";
const ProviderSchema = new Schema(
  {
    user: { type: String, ref: "User" },
    isActive: { type: Boolean, default: true },
    name: { type: String, required: true },
    phone: { type: String },
    phoneCode: { type: String },
    phoneCountry: { type: String },
    email: { type: String, required: true, unique: true },
    imgUrl: { type: String, required: true },
  },
  { timestamps: true }
);

const Provider = mongoose.model("Provider", ProviderSchema);
ProviderSchema.plugin(uniqueValidator, {
  message: "This {PATH} is already in use.",
});
export default Provider;
