import Holliday from "../models/holliday.js";
import User from "../models/user.js";

export const getByUser = async (req, res, next) => {
  try {
    global.logger.info("---GET HOLLIDAY BY USER ID---");
    const id = req.user._id.toString();
    const holliday = await Holliday.findOne({ user: id }).exec();
    holliday
      ? res.status(200).json(holliday)
      : res.status(200).json({ range: [] });
  } catch (err) {
    next(err);
  }
};
// Crear/Actualizar schedule worker
export const addOrUpdate = async (req, res, next) => {
  global.logger.info("---ADD NEW Hollyday OR UPDATE---");
  try {
    const id = req.user._id.toString();
    const data = req.body;
    const user = await User.findOne({ _id: id });
    if (!user) {
      throw createError(409, "User not exist");
    }
    if (user && user.type != "worker") {
      throw createError(409, "you dont have the credentials");
    }
    const holliday = await Holliday.findOne({ user: id });
    if (holliday) {
      const update = {
        $set: { range: data.range },
      };
      let updatedHolliday = await Holliday.findOneAndUpdate(
        { user: id },
        update,
        {
          new: true,
        }
      ).exec();
      res.status(200).json(updatedHolliday);
    } else {
      let newHolliday = new Holliday(data);
      newHolliday.user = id;
      newHolliday.creator = id;
      newHolliday.save();
      res.status(200).json(newHolliday);
    }
  } catch (err) {
    next(err);
  }
};
