export default function extractReferencePaths(schema, pathPrefix = "") {
  let paths = [];
  for (const [key, value] of Object.entries(schema.paths)) {
    if (
      value.instance === "Array" &&
      value.caster &&
      value.caster.options &&
      value.caster.options.ref
    ) {
      paths.push(pathPrefix ? `${pathPrefix}.${key}` : key);
    } else if (value.options && value.options.ref) {
      paths.push(pathPrefix ? `${pathPrefix}.${key}` : key);
    } else if (value.schema) {
      const nested = extractReferencePaths(
        value.schema,
        pathPrefix ? `${pathPrefix}.${key}` : key
      );
      paths = paths.concat(nested);
    }
  }
  return paths;
}
