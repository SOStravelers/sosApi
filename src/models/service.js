// import mongoose from "mongoose";
// const Schema = mongoose.Schema;
// import uniqueValidator from "mongoose-unique-validator";
// import mongoosePaginate from "mongoose-paginate-v2";
// import paginateConfig from "../config/paginate.js";

// const serviceSchema = new Schema(
//   {
//     name: {
//       en: {
//         type: String,
//         default: "",
//       },
//       es: {
//         type: String,
//         default: "",
//       },
//       fr: {
//         type: String,
//         default: "",
//       },
//       pt: {
//         type: String,
//         default: "",
//       },
//       de: {
//         type: String,
//         default: "",
//       },
//     },
//     isActive: { type: Boolean, default: true },
//     archived: { type: Boolean, default: false },
//     details: { type: String },
//     imgUrl: { type: String },
//     icon: { type: String },
//     creator: { type: String, ref: "User" },
//     updated: {
//       updatedAt: {
//         type: Date,
//         default: new Date(),
//       },
//       updatedBy: { type: String, ref: "User" },
//     },
//   },

//   { timestamps: true }
// );
// serviceSchema.plugin(uniqueValidator, {
//   message: "This {PATH} is already in use.",
// });
// serviceSchema.plugin(mongoosePaginate);
// mongoosePaginate.paginate.options = paginateConfig;
// const Service = mongoose.model("Service", serviceSchema);
// export default Service;
