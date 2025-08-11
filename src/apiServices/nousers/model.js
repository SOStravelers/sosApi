import mongoose from "mongoose";
const Schema = mongoose.Schema;
import uniqueValidator from "mongoose-unique-validator";
import mongoosePaginate from "mongoose-paginate-v2";
import paginateConfig from "../../config/paginate.js";
const noUserSchema = new Schema(
  {
    email: { type: String, required: true },
    name: {
      first: {
        type: String,
      },
      last: {
        type: String,
      },
      nickName: {
        type: String,
      },
    },
    phone: { type: String },
    country: { type: mongoose.Schema.Types.ObjectId, ref: "Country" },
    paymentData: {
      stripe: {
        customer: { type: String },
      },
    },
  },
  { timestamps: true }
);
noUserSchema.plugin(uniqueValidator, {
  message: "This {PATH} is already in use.",
});
noUserSchema.plugin(mongoosePaginate);
mongoosePaginate.paginate.options = paginateConfig;
const NoUser = mongoose.model("NoUser", noUserSchema);
export default NoUser;
