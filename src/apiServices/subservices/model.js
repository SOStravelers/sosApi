import mongoose from "mongoose";
const Schema = mongoose.Schema;
import uniqueValidator from "mongoose-unique-validator";
import mongoosePaginate from "mongoose-paginate-v2";
import paginateConfig from "../../config/paginate.js";

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

    hasEvent: { type: Boolean, default: false },
    eventData: {
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
      available: { type: Boolean, default: true },
      isoTime: { type: Date },
    },
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
    startTimeIso: { type: Date },
    //nuevas
    currency: { type: mongoose.Schema.Types.ObjectId, ref: "Currency" },
    country: { type: mongoose.Schema.Types.ObjectId, ref: "Country" },
    canCancel: { type: Boolean },
    timeUntilCancel: { type: Number },
    haveLimitTime: { type: Boolean, default: false },
    timeLimitBook: { type: Number },
    withTicket: { type: Boolean, default: false },
    order: { type: Number },

    typeService: {
      type: String,
      enum: ["tour", "event", "product"],
    },
    tourData: {
      _id: false,
      hasChildren: { type: Boolean, default: false },
      adultPrice: {
        usd: { type: Number },
        eur: { type: Number },
        brl: { type: Number },
      },
      childrenPrice: {
        usd: { type: Number },
        eur: { type: Number },
        brl: { type: Number },
      },
      limit: { type: Number },
      hasLimit: { type: Boolean },
    },
    categories: [
      {
        _id: false,
        category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
        default: { type: Boolean, default: false },
        type: { type: String, required: true, enum: ["select", "free"] },
        products: [
          {
            _id: false,
            product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
            price: {
              usd: { type: Number },
              eur: { type: Number },
              brl: { type: Number },
            },
            default: { type: Boolean, default: false },
          },
        ],
      },
    ],
    chipData: {
      es: {
        type: String,
      },
      en: {
        type: String,
      },
      pt: {
        type: String,
      },
      fr: {
        type: String,
      },
      de: {
        type: String,
      },
    },
    provider: { type: mongoose.Schema.Types.ObjectId, ref: "Provider" },
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
