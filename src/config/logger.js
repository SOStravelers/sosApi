import winston, { createLogger, format, transports } from "winston";
import envar from "../config/envar.js";
const { combine, timestamp, printf, colorize, uncolorize, errors, json } =
  format;

winston.addColors({
  error: "red",
  warn: "yellow",
  info: "cyan",
  http: "blue",
  debug: "green",
  verbose: "magenta",
  silly: "gray",
});

const myFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  const base = `${timestamp} [${level}]: ${message}`;
  const metaString = Object.keys(meta).length
    ? `\n${JSON.stringify(meta, null, 2)}`
    : "";
  return stack ? `${base}\n${stack}${metaString}` : `${base}${metaString}`;
});
const isLocal = process.env.COLOR_LOGS === "true";

const logger = createLogger({
  level: "silly",
  format: combine(
    errors({ stack: true }),
    timestamp(),
    isLocal ? colorize({ all: true }) : uncolorize(),
    myFormat
  ),
  // defaultMeta: { service: "user-service" }, // ← quítalo
  transports: [
    new transports.File({ filename: "error.log", level: "error" }),
    new transports.File({ filename: "combined.log" }),
  ],
});

// Agregar consola
logger.add(
  new transports.Console({
    format: combine(
      timestamp(),
      isLocal ? colorize({ all: true }) : uncolorize(),
      myFormat
    ),
  })
);

export default logger;
