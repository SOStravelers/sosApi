import mongoose from "mongoose";
const Schema = mongoose.Schema;

const scheduleSchema = new Schema(
  {
    user: { type: String, ref: "User" },
    service: { type: String, ref: "Service" },
    location: { type: String },
    timeZone: { type: String },
    schedules: [
      {
        day: {
          type: Number,
          required: true,
          min: 0,
          max: 6,
        },
        intervals: [
          {
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
    isActive: { type: Boolean, default: true },
    details: { type: String },
  },
  { timestamps: true }
);

const Schedule = mongoose.model("Schedule", scheduleSchema);
export default Schedule;
