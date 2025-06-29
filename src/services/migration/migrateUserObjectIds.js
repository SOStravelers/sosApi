import mongoose from "mongoose";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import User from "../../models/user.js"; // Ajusta el path si tu modelo está en otro lado
import extractReferencePaths from "../../helpers/extractReferencePaths.js";
import {
  normalizeObjectIdReferences,
  fixInvalidDates,
} from "../../helpers/migration/normalizeReferencesForMigration.js";
import mongoJsonToPlain from "../../helpers/mongoJsonToPlain.js";
import envar from "../../config/envar.js";

// Configuración de tu base de datos
const config = envar();
const dbConfig = {
  local: "mongodb://localhost:27017/sosLocal",
  dev: `mongodb+srv://${config.DB_USER}:${config.DB_PASS}@${config.DB_DEV}`,
  test: `mongodb+srv://${config.DB_USER}:${config.DB_PASS}@${config.DB_TEST}`,
  production: `mongodb+srv://${config.DB_USER}:${config.DB_PASS}@${config.DB_PROD}`,
};
const env = process.env.NODE_ENV || "dev";
const MONGO_URI = dbConfig[env];

// Lectura robusta de data.json (en mismo folder que este archivo)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dataPath = resolve(__dirname, "data.json");
const fileRaw = fs.readFileSync(dataPath, "utf8");
const items = JSON.parse(fileRaw);

async function migrateUserObjectIds() {
  await mongoose.connect(MONGO_URI);

  // Extrae los paths de referencias automáticamente desde el esquema
  const paths = extractReferencePaths(User.schema);

  let updates = 0,
    errores = 0;

  for (const item of items) {
    // 1. Limpieza: saca los $oid/$date, etc.
    console.log("el item", item._id);
    let raw = mongoJsonToPlain(item);
    // 2. Corrige fechas vacías
    fixInvalidDates(raw);
    // 3. Normaliza references
    const normalized = normalizeObjectIdReferences(raw, paths);

    // 4. No intentes setear _id
    const { _id, ...toUpdate } = normalized;

    try {
      await User.updateOne({ _id: _id }, toUpdate, { upsert: false });
      updates++;
      console.log(`✅ Migrado: ${_id}`);
    } catch (err) {
      errores++;
      console.error(`❌ Error actualizando: ${_id}`);
      console.error(err);
    }
  }

  console.log(
    `\n---\nMigración completada.\nDocumentos actualizados: ${updates}\nErrores: ${errores}`
  );
  await mongoose.disconnect();
}

migrateUserObjectIds().catch((err) => {
  console.error(err);
  process.exit(1);
});
