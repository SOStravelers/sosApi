import mongoose from "mongoose";
const Schema = mongoose.Schema;
import uniqueValidator from "mongoose-unique-validator";
import bcrypt from "bcryptjs";
const salt = bcrypt.genSaltSync(10);
import mongoosePaginate from "mongoose-paginate-v2";
import paginateConfig from "../config/paginate.js";

const userSchema = new Schema(
  {
    isActive: { type: Boolean, default: true },
    isValidate: { type: Boolean, default: false },
    password: {
      type: String,
      select: false,
      trim: true,
      minlength: 6,
      // required: [true, "Password requiere"],
    },
    validation: {
      code: { type: Number },
      urlcode: { type: String },
      expTime: { type: Number },
      time: Date,
    },
    security: {
      updatedAt: {
        type: Date,
        default: new Date(),
      },
      hasPassword: {
        type: Boolean,
        default: false,
      },
    },
    username: { type: String, unique: true },
    rating: { type: Number, default: 5 },
    email: { type: String, unique: true },
    isAdminUser: { type: Boolean },
    type: {
      type: String,
      default: "personal",
      enum: ["personal", "business", "worker"],
    },
    phone: { type: String },
    img: {
      imgUrl: { type: String, default: "" },
      coverImg: { type: String, default: "" },
      gallery: { type: Array, default: [] },
    },
    updatedAt: {
      type: Date,
      default: new Date(),
    },
    lastLogin: {
      type: Date,
      default: new Date(),
    },
    lastLoginType: {
      type: String,
      enum: ["email", "google", "other"],
    },
    about: { type: String, default: "" },
    language: {
      type: String,
      default: "EN",
      enum: ["EN", "ES", "FR", "BR"],
    },
    personalData: {
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
      nationality: { type: String },
      country: { type: String },
      idNumber: { type: String },
    },
    workerData: {
      isActive: { type: Boolean, default: false },
      languages: {
        main: {
          type: String,
          default: "EN",
          enum: ["EN", "ES", "FR", "BR"],
        },
        secondary: { type: Array },
      },
      services: [
        {
          id: { type: String, ref: "Service" },
          subServices: Array({
            type: String,
            ref: "Subservice",
          }),
          gallery: { type: Array },
        },
      ],
    },
    businessData: {
      isActive: { type: Boolean, default: false },
      category: { type: Number, enum: [1, 2, 3] },
      location: {
        country: { type: String },
        city: { type: String },
      },
      type: {
        type: String,
        enum: ["hotel", "hostel", "other"],
      },
      name: { type: String },
      owner: {
        name: {
          first: {
            type: String,
          },
          last: {
            type: String,
          },
        },
      },
      services: [
        {
          service: { type: String, ref: "Service" },
          isActive: { type: Boolean, default: true },
          schedule: { type: String, ref: "Schedule" },
        },
      ],
    },
    paymentData: {},
    currency: { type: String, ref: "Currency" },
  },
  { timestamps: true }
);

//Validate unique value message
userSchema.plugin(uniqueValidator, {
  message: "This {PATH} is already in use.",
});
userSchema.plugin(mongoosePaginate);
mongoosePaginate.paginate.options = paginateConfig;

const User = mongoose.model("User", userSchema);
export default User;

// Functions custom for model

User.hash = (password) => {
  return bcrypt.hashSync(password, salt, null);
};
User.validPassword = async (id, password) => {
  console.log("passss");
  const user = await User.findById(id, "password").exec();
  let valid = false;
  try {
    valid = bcrypt.compareSync(password, user.password);
  } catch (err) {
    valid = false;
  }

  return valid;
};
