import mongoose from "mongoose";
const Schema = mongoose.Schema;
import uniqueValidator from "mongoose-unique-validator";
import mongoosePaginate from "mongoose-paginate-v2";
import paginateConfig from "../config/paginate.js";

const subserviceSchema = new Schema(
  {
    //---Informacion basica---//
    name: {
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
      de: {
        type: String,
        default: "",
      },
    },
    shortDescription: {
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
      de: {
        type: String,
        default: "",
      },
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
      de: {
        type: String,
        default: "",
      },
    },
    route: [
      {
        _id: false,
        name: {
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
          de: {
            type: String,
            default: "",
          },
        },
        mapLocation: { type: String },
      },
    ],
    includedList: [
      {
        _id: false,
        name: {
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
          de: {
            type: String,
            default: "",
          },
        },
      },
    ],
    restrictions: [
      {
        _id: false,
        name: {
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
          de: {
            type: String,
            default: "",
          },
        },
      },
    ],
    service: { type: mongoose.Schema.Types.ObjectId, ref: "Service" },
    isActive: { type: Boolean, default: true },
    archived: { type: Boolean, default: false },
    duration: { type: Number },
    imgUrl: { type: String },
    videoUrl: { type: String },
    gallery: {
      _id: false,
      images: [{ type: String }],
      videos: [{ type: String }],
    },
    creator: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    rate: { type: Number, default: 5 },
    rateCount: { type: Number, default: 10 },
    commentsCount: { type: Number, default: 3 },
    recommended: { type: Boolean, default: false },
    worker: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    multiple: { type: Boolean, default: false }, // cambiar nombre como a limites por dias

    //nuevas
    currency: { type: mongoose.Schema.Types.ObjectId, ref: "Currency" },
    country: { type: mongoose.Schema.Types.ObjectId, ref: "Country" },
    canCancel: { type: Boolean },
    timeUntilCancel: { type: Number },
    typeService: {
      type: String,
      enum: ["tour", "event", "food", "other"],
    },
    tourData: {
      _id: false,
      hasChildren: { type: Boolean, default: false },
      adultPrice: {
        brl: {
          value: { type: Number },
          format: { type: String },
        },
        usd: {
          value: { type: Number },
          formated: { type: String },
        },
        eur: {
          value: { type: Number },
          formated: { type: String },
        },
      },
      childrenPrice: {
        brl: {
          value: { type: Number },
          format: { type: String },
        },
        usd: {
          value: { type: Number },
          formated: { type: String },
        },
        eur: {
          value: { type: Number },
          formated: { type: String },
        },
      },
      limit: { type: Number },
      hasLimit: { type: Boolean },
    },
    eventData: {
      _id: false,
      hasWoman: { type: Boolean, default: false },
      hasMan: { type: Boolean, default: false },
      hasChildren: { type: Boolean, default: false },
      tieredPricing: { type: Boolean, default: false },
      prices: {
        early_bird: {
          _id: false,
          womanPrice: { type: Number, default: 0 },
          manPrice: { type: Number, default: 0 },
          childrenPrice: { type: Number, default: 0 },
          timeUntilEvent: { type: String, default: "" },
          limit: { type: Number, default: 1 },
          hasLimit: { type: Boolean, default: false },
        },
        general: {
          _id: false,
          womanPrice: { type: Number, default: 0 },
          manPrice: { type: Number, default: 0 },
          childrenPrice: { type: Number, default: 0 },
          timeUntilEvent: { type: String, default: "" },
        },
        LastMinute: {
          _id: false,
          womanPrice: { type: Number, default: 0 },
          manPrice: { type: Number, default: 0 },
          childrenPrice: { type: Number, default: 0 },
          timeUntilEvent: { type: String, default: "" },
          limit: { type: Number, default: 1 },
          hasLimit: { type: Boolean, default: false },
        },
      },
    },
    foodData: {
      _id: false,
    },
  },
  { timestamps: true }
);
subserviceSchema.plugin(uniqueValidator, {
  message: "This {PATH} is already in use.",
});
subserviceSchema.plugin(mongoosePaginate);
mongoosePaginate.paginate.options = paginateConfig;
const Subservice = mongoose.model("Subservice", subserviceSchema);
export default Subservice;
