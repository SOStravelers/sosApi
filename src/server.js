import express, { Router } from "express";
import morgan from "morgan";
import cors from "cors";
import history from "connect-history-api-fallback";
import staticDir from "./config/staticPath.js";
import bodyParser from "body-parser";
import localeMiddleware from "express-locale";
import db from "./db.js";
import routes from "./routes/index.js";

// check connection
db.once("open", () => {
  console.log(`Connnected to mongodb`);
});
db.on("error", (err) => {
  console.log(err);
});

const app = express();
const router = Router();
app.use(express.static(staticDir));

//Nos sirve para pintar las peticiones HTTP request que se solicitan a nuestro aplicación.
app.use(morgan("tiny"));
//Para realizar solicitudes de un servidor externo e impedir el bloqueo por CORS

app.use(cors());

// app.use((req, res, next) => {
//   res.header("Access-Control-Allow-Origin", "*");
//   res.header(
//     "Access-Control-Allow-Headers",
//     "Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method"
//   );
//   res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
//   res.header("Allow", "GET, POST, OPTIONS, PUT, DELETE");
//   next();
// });

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
// Middleware para Vue.js router modo history
app.use(history());
//app.use(express.static(path.join(__dirname, 'public')));

export default app;
1;
