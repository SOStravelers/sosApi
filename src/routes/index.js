import express from "express";
const routes = express.Router();
import booking from "./booking.js";
import auth from "./auth.js";
import service from "./service.js";
import subservice from "./subservice.js";
import test from "./test.js";
import payment from "./payment.js";
import user from "./user.js";
import notification from "./notification.js";
import favorite from "./favorite.js";
import admin from "./admin.js";
import schedule from "./schedule.js";
import holliday from "./holliday.js";
import support from "./support.js";
import partner from "./partner.js";
import {
  isAuth,
  isAdmin,
  isAuthOptional,
  renewToken,
} from "../middleware/auth.js";
import Holliday from "../models/holliday.js";

routes.get("/isAuth", isAuth, (req, res) => {
  res.statusMessage = "authenticated";
  res.send(req.user.getUser());
});

routes.post("/renew", renewToken);
routes.use("/auth", auth);

routes.use("/notification", notification);

routes.use("/notificationAuth", isAuth, notification);

routes.use("/users", isAuth, user);
routes.use("/usersfree", user);
routes.use("/admin", isAuth, isAdmin, admin);

routes.use("/bookings", booking);
routes.use("/bookingAuth", isAuth, booking);
routes.use("/boookingAdmin", isAuth, isAdmin, booking);

routes.use("/services", service);
routes.use("/services2", isAuth, service);
routes.use("/serviceAdmin", isAuth, isAdmin, service);
routes.use("/subservices", subservice);

routes.use("/schedules", isAuth, schedule);
routes.use("/schedules2", schedule);

routes.use("/hollidays", isAuth, holliday);

routes.use("/favorites", isAuth, favorite);

routes.use("/partners", partner);
routes.use("/partnersAuth", isAuth, partner);

routes.use("/tests", test);

routes.use("/payments", isAuth, payment);
routes.use("/paymentsAuth", payment);

//rutas metal
routes.use("/support", support);

export default routes;
