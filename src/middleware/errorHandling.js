import { createError } from "../config/error.js";

export default function errorHandlingMiddleware(err, req, res, next) {
  global.logger.error({
    message: `${err.message} - Status: ${err.statusCode || 500}`,
    path: req.path,
    method: req.method,
    body: req.body,
    stack: err.stack,
  });
  if (!(err instanceof Error) || !err.statusCode) {
    err = createError();
  }
  res.status(err.statusCode || 500).json({ error: err.message });
}
