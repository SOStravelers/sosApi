import express from "express";
const routes = express.Router();
import booking from "./booking.js";
import service from "./service.js";
import subservice from "./subservice.js";
import test from "./test.js";
import payment from "./payment.js";
import user from "./user.js";
import notification from "./notification.js";
import schedule from "./schedule.js";
import { isAuth, isAdmin, isAuthOptional, renewToken } from "../config/auth.js";

routes.get("/isAuth", isAuth, (req, res) => {
  res.statusMessage = "authenticated";
  res.send(req.user.getUser());
});

routes.post("/renew", renewToken);

routes.use("/bookings", booking);
routes.use("/bookingAuth", isAuth, booking);
routes.use("/boookingAdmin", isAuth, isAdmin, booking);

routes.use("/serviceAdmin", isAuth, isAdmin, service);
routes.use("/services", service);
routes.use("/subservices", subservice);

routes.use("/users", user);
routes.use("/usersAuth", isAuth, user);
routes.use("/usersAdmin", isAuth, isAdmin, user);

routes.use("/notification", notification);

routes.use("/schedules", schedule);

routes.use("/tests", test);

routes.use("/payments", payment);

export default routes;
