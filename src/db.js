import mongoose from "mongoose";
import envar from "./config/envar.js";

const dbConfig = {
  local: `mongodb://localhost:27017/sosLocal`,
  dev: `mongodb+srv://${envar().DB_USER}:${envar().DB_PASS}@${envar().DB_DEV}`,
  test: `mongodb+srv://${envar().DB_USER}:${envar().DB_PASS}@${
    envar().DB_TEST
  }`,
  production: `mongodb+srv://${envar().DB_USER}:${envar().DB_PASS}@${
    envar().DB_PROD
  }`,
};

const env = process.env.NODE_ENV || "dev";
console.log(`Conectando... DB:${process.env.NODE_ENV}`);
mongoose.set("strictQuery", false);
mongoose.connect(dbConfig[env], {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  // useFindAndModify: false,
  // useCreateIndex: true
});

let db = mongoose.connection;

export default db;
