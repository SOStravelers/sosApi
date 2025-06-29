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
    newAbout: {
      en: {
        type: String,
        default: "",
      },
      es: {
        type: String,
        default: "",
      },
      pt: {
        type: String,
        default: "",
      },
      fr: {
        type: String,
        default: "",
      },
      de: {
        type: String,
        default: "",
      },
    },
    reviewScore: { type: Number, default: 0 },
    numberBookings: { type: Number, default: 0 },
    language: {
      type: String,
      default: "EN",
      enum: ["EN", "ES", "FR", "BR"],
    },
    personalData: {
      isActive: { type: Boolean, default: true },
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
      isMyServicesOk: { type: Boolean, default: false },
      isAboutmeOk: { type: Boolean, default: false },
      isMySchedulesOk: { type: Boolean, default: false },
      isMyWorkplacesOk: { type: Boolean, default: true },
      isActive: { type: Boolean, default: false },
      phone: { type: String },
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
          id: { type: mongoose.Schema.Types.ObjectId, ref: "Service" },
          _id: false,
          subServices: Array({
            type: mongoose.Schema.Types.ObjectId,
            ref: "Subservice",
          }),
          gallery: { type: Array },
        },
      ],
    },
    businessData: {
      isActive: { type: Boolean, default: false },
      category: {
        type: String,
        enum: ["category1", "category2", "category3"],
        default: "category1",
      },
      details: {
        en: {
          type: String,
          default: "",
        },
        es: {
          type: String,
          default: "",
        },
        fr: {
          type: String,
          default: "",
        },
        pt: {
          type: String,
          default: "",
        },
      },
      location: {
        _id: false,
        country: { type: String },
        city: { type: String },
        url: { type: String },
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
          _id: false,
          service: { type: mongoose.Schema.Types.ObjectId, ref: "Service" },
          isActive: { type: Boolean, default: true },
          schedule: { type: mongoose.Schema.Types.ObjectId, ref: "Schedule" },
        },
      ],
    },
    paymentData: {
      isActive: { type: Boolean, default: false },
      stripeCustomerId: { type: String },
      stripeAccountId: { type: String, default: null },
      paypalAccountId: { type: String },
      paypalClientId: { type: String },
      paypalClientSecret: { type: String },
      paypalRefreshToken: { type: String },
      paypalAccessToken: { type: String },
      paypalExpiresIn: { type: Number },
    },
    currency: { type: mongoose.Schema.Types.ObjectId, ref: "Currency" },
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
  const user = await User.findById(id, "password").exec();
  let valid = false;
  try {
    valid = bcrypt.compareSync(password, user.password);
  } catch (err) {
    valid = false;
  }

  return valid;
};
