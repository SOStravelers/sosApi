import Support from "../models/support.js";
import User from "../models/user.js";
import {
  resendSupport,
  resendRequest,
  resendJohann,
} from "../services/resend.js";

export const supportEmail = async (req, res, next) => {
  try {
    global.logger.info("---SEND EMAIL---");

    const data = req.body;

    const support = new Support(data);
    const respuesta = await support.save();
    const user = await Support.findById(support._id.toString()).populate({
      path: "user",
      select: "personalData email type",
    });
    const aux = {
      subject: data.subject,
      message: data.message,
      name: data.name,
      email: data.email,
      user: user.user,
    };
    // funcion que manda el email
    await resendSupport(aux);

    res.status(200).json({ msg: "email sent", respuesta: respuesta });
  } catch (err) {
    next(err);
  }
};

export const contactClient = async (req, res, next) => {
  try {
    global.logger.info("---SEND ClIENT EMAIL---");

    const aux = {
      subject: "Nueva solitud de parceria",
      message: "Nueva solitud de parceria",
      userType: req.body.hostel,
      email: req.body.email,
      user: req.body.name,
    };
    console.log("el aux", aux);
    // funcion que manda el email
    await resendRequest(aux);

    res.status(200).json({ msg: "email sent" });
  } catch (err) {
    next(err);
  }
};

export const johannEmail = async (req, res, next) => {
  try {
    global.logger.info("---SEND JOHANN EMAIL---");
    const data = req.body;
    const aux = {
      message: data.message,
      name: data.name,
      email: data.email,
    };
    const response = await resendJohann(aux);
    res.status(200).json(response);
  } catch (err) {
    console.log("error en johannEmail:", err);
    next(err);
  }
};
