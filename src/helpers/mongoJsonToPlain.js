// Convierte { $oid: ... } y { $date: ... } a string/Date/valor plano
export default function mongoJsonToPlain(obj) {
  if (Array.isArray(obj)) {
    return obj.map(mongoJsonToPlain);
  } else if (obj && typeof obj === "object") {
    if (Object.keys(obj).length === 1 && obj.$oid) return obj.$oid;
    if (Object.keys(obj).length === 1 && obj.$date) return obj.$date;
    const out = {};
    for (const key in obj) {
      out[key] = mongoJsonToPlain(obj[key]);
    }
    return out;
  } else {
    return obj;
  }
}
