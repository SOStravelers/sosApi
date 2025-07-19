import mongoose from "mongoose";
const Schema = mongoose.Schema;
import uniqueValidator from "mongoose-unique-validator";
import mongoosePaginate from "mongoose-paginate-v2";
import paginateConfig from "../../config/paginate.js";
const notificationSchema = new Schema(
  {
    title: { type: Object, required: true },
    subtitle: { type: Object },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
    type: { type: String, required: true },
    body: { type: Object, required: true },
    isRead: { type: Boolean, default: false },
    toWorkers: { type: Boolean, default: false },
    toBusiness: { type: Boolean, default: false },
    toUsers: { type: Boolean, default: false },
    to: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", _id: false }],
    link: { type: String },
    imgUrl: { type: String },
  },
  { timestamps: true }
);
notificationSchema.plugin(uniqueValidator, {
  message: "This {PATH} is already in use.",
});
notificationSchema.plugin(mongoosePaginate);
mongoosePaginate.paginate.options = paginateConfig;
const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
