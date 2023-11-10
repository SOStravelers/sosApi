import mongoose from "mongoose";
const Schema = mongoose.Schema;

const scheduleSchema = new Schema(
  {
    user: { type: String, ref: "User" },
    isActive: { type: Boolean, default: true },
    default: { type: String, default: false },
    service: { type: String, ref: "Service" },
    location: { type: String },
    timeZone: { type: String },
    schedules: [
      {
        day: {
          type: Number,
          required: true,
          min: 1,
          max: 7,
        },
        isActive: { type: Boolean, default: true },
        intervals: [
          {
            _id: false,
            startTime: {
              type: String,
              required: true,
            },
            endTime: {
              type: String,
              required: true,
            },
          },
        ],
      },
    ],
    creator: { type: String, ref: "User" },

    details: { type: String },
  },
  { timestamps: true }
);

const Schedule = mongoose.model("Schedule", scheduleSchema);
export default Schedule;
