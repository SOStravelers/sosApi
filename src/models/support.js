import mongoose from "mongoose";
const Schema = mongoose.Schema;
import uniqueValidator from "mongoose-unique-validator";
import mongoosePaginate from "mongoose-paginate-v2";
import paginateConfig from "../config/paginate.js";

const supportSchema = new Schema(
  {
    subject: { type: String },
    body: { type: String },
    name: { type: String },
    email: {
        type: String,
        trim: true,     // Eliminar espacios en blanco alrededor del email
        lowercase: true, // Convertir el email a minúsculas
        validate: {
          validator: function (valor) {
            // Utilizar una expresión regular para validar el formato del email
            return /^[^\s@]+@[^\s@]+.[^\s@]+$/.test(valor);
          },
        }
      },
      // Otros campos de tu esquema...
    
    user: { type: String , ref: "User" },
  },
  { timestamps: true }
);

supportSchema.plugin(mongoosePaginate);
mongoosePaginate.paginate.options = paginateConfig;
const support = mongoose.model("support", supportSchema);
export default support;