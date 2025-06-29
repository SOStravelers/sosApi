import mongoose from "mongoose";

// Chequea si algo es ObjectId válido (acepta string y ObjectId)
function isValidObjectId(val) {
  if (val && typeof val === "object" && val.$oid) val = val.$oid;
  return typeof val === "string"
    ? mongoose.Types.ObjectId.isValid(val)
    : val instanceof mongoose.Types.ObjectId;
}

// Convierte string (o $oid) a ObjectId. Si no es válido, retorna null
function normalizeRefValue(val) {
  if (val instanceof mongoose.Types.ObjectId) return val;
  if (typeof val === "string" && mongoose.Types.ObjectId.isValid(val)) {
    return new mongoose.Types.ObjectId(val);
  }
  if (
    val &&
    typeof val === "object" &&
    val.$oid &&
    mongoose.Types.ObjectId.isValid(val.$oid)
  ) {
    return new mongoose.Types.ObjectId(val.$oid);
  }
  if (val && typeof val === "object" && typeof val.toHexString === "function") {
    // Es un "fake ObjectId" (ej. import desde bson/lib/objectid)
    const str = val.toHexString();
    if (mongoose.Types.ObjectId.isValid(str)) {
      return new mongoose.Types.ObjectId(str);
    }
  }
  return null;
}

// Recorrido profundo para los campos de referencia, limpiando subdocs corruptos (eliminando OBJETO)
export function normalizeByPath(obj, path) {
  console.log("el path", path);
  const keys = path.split(".");
  function recurse(current, ki) {
    if (current == null) return;
    const key = keys[ki];
    if (Array.isArray(current)) {
      for (const el of current) recurse(el, ki);
      return;
    }
    if (ki === keys.length - 1) {
      if (current[key] !== undefined) {
        // Si es array de referencias
        if (Array.isArray(current[key])) {
          current[key] = current[key].map(normalizeRefValue);
        } else {
          console.log("wenino", key, "-------", current[key]);

          current[key] = normalizeRefValue(current[key]);
          console.log("casa", normalizeRefValue(current[key].toString()));
        }
      }
    } else if (current[key] !== undefined) {
      recurse(current[key], ki + 1);
    }
  }
  recurse(obj, 0);
}

export function normalizeObjectIdReferences(obj, refPaths) {
  for (const path of refPaths) {
    normalizeByPath(obj, path);
  }
  return obj;
}

// --- Para fechas basura en migración masiva ---
const EXPLICIT_DATE_KEYS = [
  "updatedAt",
  "createdAt",
  "lastLogin",
  "lastLoginType",
  "time",
];
export function fixInvalidDates(obj) {
  if (Array.isArray(obj)) {
    obj.forEach(fixInvalidDates);
    return;
  }
  if (!obj || typeof obj !== "object") return;

  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (
      val &&
      typeof val === "object" &&
      !Array.isArray(val) &&
      Object.keys(val).length === 0 &&
      (EXPLICIT_DATE_KEYS.includes(key) ||
        key.toLowerCase().includes("date") ||
        key.toLowerCase().includes("updatedat") ||
        key.toLowerCase().includes("createdat"))
    ) {
      obj[key] = null;
    } else if (typeof val === "object") {
      fixInvalidDates(val);
    }
  }
}

export default {
  isValidObjectId,
  normalizeRefValue,
  normalizeObjectIdReferences,
  fixInvalidDates,
};
