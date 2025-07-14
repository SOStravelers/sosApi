import mongoose from "mongoose";
const Schema = mongoose.Schema;

const HolidaySchema = new Schema(
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

const Holiday = mongoose.model("Holliday", HolidaySchema);
export default Holiday;
