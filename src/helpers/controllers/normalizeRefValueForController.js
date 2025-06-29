import mongoose from "mongoose";

// Solo convierte referencias string/oid a ObjectId; NO limpia fechas ni borra nada.
export function normalizeRefValueForController(val) {
  if (val && typeof val === "object" && val.$oid) val = val.$oid;
  if (val && typeof val === "object" && val._bsontype === "ObjectID")
    return val;
  if (typeof val === "string" && mongoose.Types.ObjectId.isValid(val)) {
    return mongoose.Types.ObjectId(val);
  }
  return val;
}

export function normalizeObjectIdReferencesForController(obj, refPaths) {
  for (const path of refPaths) {
    normalizeByPathForController(obj, path);
  }
  return obj;
}

function normalizeByPathForController(obj, path) {
  const keys = path.split(".");
  function recurse(current, ki) {
    if (!current) return;
    const key = keys[ki];
    if (Array.isArray(current)) {
      for (let el of current) recurse(el, ki);
      return;
    }
    if (ki === keys.length - 1) {
      if (current[key] !== undefined) {
        if (Array.isArray(current[key])) {
          current[key] = current[key].map(normalizeRefValueForController);
        } else {
          current[key] = normalizeRefValueForController(current[key]);
        }
      }
    } else {
      recurse(current[key], ki + 1);
    }
  }
  recurse(obj, 0);
}
