import express from "express";
import morgan from "morgan";
import errorHandling from "./middleware/errorHandling.js";
import cors from "cors";
import history from "connect-history-api-fallback";
import staticDir from "./config/staticPath.js";
import bodyParser from "body-parser";
import localeMiddleware from "express-locale";
import db from "./db.js";
import schedule from "node-schedule";
import moment from "moment-timezone";
import Booking from "./apiServices/bookings/model.js";
import { capturePaymentIntent } from "./services/stripe.js";

//Modelo
import loadModels from "./helpers/loadModels.js";
await loadModels();
// await loadModels({ excludeFolders: ["demo", "test"] });

// Rutas (después de modelos)
import routes from "./routes/index.js";

// check connection
db.once("open", () => {
  global.logger.debug(`Connnected to mongodb`);
});
db.on("error", (err) => {
  global.logger.error(err);
});

const app = express();
app.use(express.static(staticDir));
app.use(express.json({ limit: "500mb" }));
app.use(morgan("tiny"));
app.use(cors());
app.use(localeMiddleware());
app.use(bodyParser.json());

app.use("/server", routes);

app.get("/", (req, res) => {
  const htmlResponse = `<!DOCTYPE html>...`; // tu HTML completo aquí
  res.send(htmlResponse);
});

// 🕒 Cron #1: requested -> available
const rule = new schedule.RecurrenceRule();
rule.tz = "America/Sao_Paulo";
rule.minute = new schedule.Range(0, 59, 58);
rule.hour = new schedule.Range(9, 22);
schedule.scheduleJob(rule, async function () {
  global.logger.info("---CHANGE TO AVAILABLE---");
  try {
    const result = await Booking.updateMany(
      {
        status: "requested",
        createdAt: {
          $lte: moment().subtract(30, "minutes").toDate(),
        },
      },
      { status: "available" }
    );
    console.log("terminado");
  } catch (err) {
    console.error(err);
  }
});

// 🕐 Cron #2: confirmed -> completed (1:10am)
const rule2 = new schedule.RecurrenceRule();
rule2.tz = "America/Sao_Paulo";
rule2.minute = 10;
rule2.hour = 1;
schedule.scheduleJob(rule2, async function () {
  global.logger.info("---CHANGE TO COMPLETED---");
  try {
    const result = await Booking.find({ status: "confirmed" });
    for (let booking of result) {
      const completedData = {
        completedBy: "SOSTEAM",
        completedAtUTC: moment().tz("America/Sao_Paulo"),
        timeZone: "America/Sao_Paulo",
        previusStatus: booking.status,
      };
      await capturePaymentIntent(booking, 1, "completed", null, completedData);
    }
    console.log({ msg: "ok", updatedCount: result.length });
  } catch (err) {
    console.error(err);
  }
});

// 🕒 Cron #3: cancelar bookings que están por empezar
const rule3 = new schedule.RecurrenceRule();
rule3.tz = "America/Sao_Paulo";
rule3.minute = new schedule.Range(0, 59, 15);
rule3.hour = new schedule.Range(9, 22);
schedule.scheduleJob(rule3, async function () {
  global.logger.info("---CHANGE TO CANCELED---");
  try {
    const result = await Booking.updateMany(
      {
        $or: [
          {
            status: "requested",
            "date.isoDate": {
              $lte: moment().add(15, "minutes").toDate(),
            },
          },
          {
            status: "available",
            "date.isoDate": {
              $lte: moment().add(15, "minutes").toDate(),
            },
          },
        ],
      },
      { status: "canceled" }
    );
    console.log("terminado");
  } catch (err) {
    console.error(err);
  }
});

app.use(errorHandling);
app.use(history());

export default app;
