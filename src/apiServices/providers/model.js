import mongoose from "mongoose";
const Schema = mongoose.Schema;

const ProviderSchema = new Schema(
  {
    user: { type: String, ref: "User" },
    isActive: { type: Boolean, default: true },
    range: [
      {
        _id: false,
        from: {
          type: Date,
        },
        to: {
          type: Date,
        },
      },
    ],
  },
  { timestamps: true }
);

const Provider = mongoose.model("Provider", ProviderSchema);
export default Provider;
