import express from "express";
import morgan from "morgan";
import errorHandling from "./middleware/errorHandling.js";
import cors from "cors";
import history from "connect-history-api-fallback";
import staticDir from "./config/staticPath.js";
import bodyParser from "body-parser";
import localeMiddleware from "express-locale";
import db from "./db.js";
import routes from "./routes/index.js";
import schedule from "node-schedule";
import moment from "moment-timezone";
import Booking from "./models/booking.js";
import { capturePaymentIntent } from "./services/stripe.js";
// check connection
db.once("open", () => {
  global.logger.info(`Connnected to mongodb`);
});
db.on("error", (err) => {
  global.logger.error(err);
});

const app = express();
app.use(express.static(staticDir));
app.use(express.json({ limit: "500mb" }));

//Nos sirve para pintar las peticiones HTTP request que se solicitan a nuestro aplicación.
app.use(morgan("tiny"));
//Para realizar solicitudes de un servidor externo e impedir el bloqueo por CORS

app.use(cors());

app.use(localeMiddleware());

app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({extended: true}));

app.use("/", routes);
app.get("/", (req, res) => {
  const htmlResponse = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SOS-API</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 0;
        background-color: #f5f5f5;
      }
  
      .container {
        width: 80%;
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
        background-color: #fff;
        box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
      }
  
      header {
        text-align: center;
        margin-bottom: 40px;
      }
  
      h1 {
        color: #333;
        margin-bottom: 10px;
      }
  
      p {
        color: #777;
        font-size: 18px;
      }
  
      .api-description {
        margin-top: 30px;
      }
  
      .cta-button {
        display: inline-block;
        padding: 10px 20px;
        background-color: #007bff;
        color: #fff;
        text-decoration: none;
        border-radius: 5px;
        font-weight: bold;
        transition: background-color 0.3s ease;
      }
  
      .cta-button:hover {
        background-color: #0056b3;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <header>
        <h1>Welcome to SOS API</h1>
        <p>Your source for amazing API services.</p>
      </header>
      <div class="api-description">
        <h2>What SOS API Offers:</h2>
        <p>Our API provides a wide range of functionalities to make your development process smoother and more efficient.</p>
      </div>
      <div class="cta">
        <a href="https://app.theneo.io/sos/sos-api" class="cta-button">Ver documentación</a>
      </div>
    </div>
  </body>
  </html>
  `;
  res.send(htmlResponse);
});

// Programa una tarea para ejecutarse cada 2 minutos entre las 9 AM y las 10 PM
const rule = new schedule.RecurrenceRule();
rule.tz = "America/Sao_Paulo"; // Zona horaria de Brasil
rule.minute = new schedule.Range(0, 59, 58); // Cada 58 minutos
rule.hour = new schedule.Range(9, 22); // Entre las 9 AM y las 10 PM

const job = schedule.scheduleJob(rule, async function () {
  global.logger.info("---CHANGE TO AVAILABLE---");
  // tomar todos los booking en requested creados hace media hora o mas y cambiarlos a available
  try {
    const now = moment().tz("America/Sao_Paulo");
    console.log("Hola, la hora actual en Brasil es: " + now.format("HH:mm:ss"));
    console.log(moment().subtract(60, "minutes").toDate());
    const result = await Booking.updateMany(
      {
        status: "requested",
        createdAt: {
          $lte: moment().subtract(30, "minutes").toDate(),
        },
      },
      {
        status: "available",
      }
    );
    console.log(result);
    console.log({ msg: "ok", updatedCount: result.nModified });
  } catch (err) {
    console.error(err);
  }
});
// Puedes cancelar la tarea usando job.cancel()
// job.cancel();

//Ahora quiero una función que cambie todos los bookings en confirmed a completed a las 01:00 AM de brasil todos los dias
const rule2 = new schedule.RecurrenceRule();
rule2.tz = "America/Sao_Paulo"; // Zona horaria de Brasil
rule2.minute = 10; //  minutos
rule2.hour = 1; // hora
const job2 = schedule.scheduleJob(rule2, async function () {
  global.logger.info("---CHANGE TO COMPLETED---");
  // tomar todos los booking en confrimerd creados hace media hora o mas y cambiarlos a completed
  try {
    const now = moment().tz("America/Sao_Paulo");
    console.log("Hola, la hora actual en Brasil es: " + now.format("HH:mm:ss"));
    const result = await Booking.find({
      status: "confirmed",
    });
    for (let booking of result) {
      const brazilTime = moment().tz("America/Sao_Paulo");
      const completedData = {
        completedBy: "SOSTEAM",
        completedAtUTC: brazilTime,
        timeZone: "America/Sao_Paulo",
        previusStatus: booking.status,
      };
      const newBooking = await capturePaymentIntent(
        booking,
        1, // percentage
        "completed", // statusBooking
        null, // canceledData,
        completedData // completedData
      );
    }
    console.log(result);
    console.log({ msg: "ok", updatedCount: result.nModified });
  } catch (err) {
    console.error(err);
  }
});
// job2.cancel();

//ahora lo que quiero es que cada 30 min entre las 9 am y 10 pm se revise si hay booking en requested o available que comienzen en 30 min o menos y se cambien a canceled
const rule3 = new schedule.RecurrenceRule();
rule3.tz = "America/Sao_Paulo"; // Zona horaria de Brasil
rule3.minute = new schedule.Range(0, 59, 15); // Cada 30 minutos
rule3.hour = new schedule.Range(9, 22); // Entre las 9 AM y las 10 PM
const job3 = schedule.scheduleJob(rule3, async function () {
  global.logger.info("---CHANGE TO CANCELED---");
  // tomar todos los booking en requested creados hace media hora o mas y cambiarlos a available
  try {
    const now = moment().tz("America/Sao_Paulo");
    console.log("Hola, la hora actual en Brasil es: " + now.format("HH:mm:ss"));
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
      {
        status: "canceled",
      }
    );
    console.log(result);
    console.log({ msg: "ok", updatedCount: result.nModified });
  } catch (err) {
    console.error(err);
  }
});

app.use(errorHandling);
app.use(history());
//app.use(express.static(path.join(__dirname, 'public')));

export default app;
