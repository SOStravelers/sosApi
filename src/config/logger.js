import winston from "winston";

const myCustomLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
    success: 4,
  },
  colors: {
    error: "red",
    warn: "yellow",
    info: "blue",
    debug: "grey",
    success: "green",
  },
};

winston.addColors(myCustomLevels.colors);

const logger = winston.createLogger({
  levels: myCustomLevels.levels,
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp(),
    winston.format.printf(
      (info) =>
        `${info.timestamp} ${info.level}: ${info.message}${
          info.stack ? `\n${info.stack}` : ""
        }`
    )
  ),
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
  ],
});

if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize()),
    })
  );
}

export default logger;
