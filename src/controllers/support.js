import Support from "../models/support.js";
import User from "../models/user.js";
import { resendSupport } from "../services/resend.js";

export const supportEmail = async (req, res, next) => {
  try {
    global.logger.info("---SEND EMAIL---");

    const data = req.body;
    // const support = new Support(data);

    // const respuesta = await support.save();
    // res.send(respuesta);

    await resendSupport(
      data.message,
      data.subject,
      data.email,
      data.name,
      data.user
    );
    res.status(200).json({ msg: "email sent" });
  } catch (err) {
    next(err);
  }
};
