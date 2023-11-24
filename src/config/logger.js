import winston, { createLogger, format, transports } from "winston";

const { combine, timestamp, printf, colorize } = format;

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6,
};

winston.addColors({
  error: "red",
  warn: "yellow",
  info: "cyan",
  // http: "brightBlue",
  http: "yellow",
  debug: "green",
});

const myFormat = printf(({ level, message, timestamp, stack }) => {
  return stack
    ? `${timestamp} ${level}: ${message}\n${stack}`
    : `${timestamp} ${level}: ${message}`;
});
const logger = createLogger({
  level: "http", // Cambia esto a "silly" para registrar mensajes de todos los niveles
  format: combine(colorize({ all: true }), timestamp(), myFormat),
  defaultMeta: { service: "user-service" },
  transports: [
    new transports.File({ filename: "error.log", level: "error" }),
    new transports.File({ filename: "combined.log" }),
  ],
});

if (process.env.NODE_ENV !== "production") {
  logger.add(new transports.Console());
}

export default logger;
