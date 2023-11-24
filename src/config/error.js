const create = (statusCode = 500, message = "Internal server error.") => {
  let err = new Error();
  err.message = message;
  err.statusCode = statusCode;
  return err;
};

export const createError = create;

export const notFoundError = (target) =>
  create(404, `${target || "Document(s)"} not found.`);
export const missingData = (msg = "Missing data") => create(400, msg);
export const duplicateData = (msg = "Duplicate data") => create(400, msg);
