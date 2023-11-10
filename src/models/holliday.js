import mongoose from "mongoose";
const Schema = mongoose.Schema;

const HollidaySchema = new Schema(
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
    creator: { type: String, ref: "User" },
  },
  { timestamps: true }
);

const Holliday = mongoose.model("Holliday", HollidaySchema);
export default Holliday;
