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
    updated: {
      updatedAt: {
        type: Date,
        default: new Date(),
      },
      updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
    rate: { type: Number, default: 5 },
    rateCount: { type: Number, default: 10 },
    commentsCount: { type: Number, default: 3 },
    recommended: { type: Boolean, default: false },
    partner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    limit: { type: Number, default: 1 },

    //variantes para tipos de subservicios

    //price por eliminar
    price: {
      _id: false,
      category1: { type: Number, default: 0 },
      category2: { type: Number, default: 0 },
      category3: { type: Number, default: 0 },
    },

    prices: [
      {
        _id: false,
        currency: { type: mongoose.Schema.Types.ObjectId, ref: "Currency" },
        value: { type: Number, default: 0 },
        valueFormated: { type: String, default: "" },
      },
    ],
    //seria si el usuario quiere que suban con el tiempo
    prices2: [
      {
        _id: false,
        currency: { type: mongoose.Schema.Types.ObjectId, ref: "Currency" },
        value: { type: Number, default: 0 },
        valueFormated: { type: String, default: "" },
      },
    ],
    hasLimit: { type: Boolean, default: false },

    hasProducts: { type: Boolean, default: false }, // sirve para tipo de eventos como gastronomia, fiestas,etc
    type: {
      type: String,
      default: "group",
      enum: ["personal", "group", "events", "food"],
    },
    multiple: { type: Boolean, default: false }, // cambiar nombre como a limites por dias
    goChat: { type: Boolean, default: false },
    isoDate: { type: String },
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
