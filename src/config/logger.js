import winston, { createLogger, format, transports } from "winston";

const { combine, timestamp, printf, colorize } = format;

winston.addColors({
  error: "red",
  warn: "yellow",
  info: "cyan",
  http: "blue",
  debug: "green",
  verbose: "magenta",
  silly: "gray",
});

const myFormat = printf(({ level, message, timestamp, stack }) => {
  return stack
    ? `${timestamp} ${level}: ${message}\n${stack}`
    : `${timestamp} ${level}: ${message}`;
});

const logger = createLogger({
  level: "silly", // Para ver todos los niveles
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
