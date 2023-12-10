import Support from "../models/support.js";
import User from "../models/user.js";
import { resendSupport } from "../services/resend.js";

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
    await resendSupport(aux);

    res.status(200).json({ msg: "email sent", respuesta: respuesta });
  } catch (err) {
    next(err);
  }
};
