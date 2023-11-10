import Holliday from "../models/holliday.js";
import User from "../models/user.js";

export const getByUser = async (req, res, next) => {
  try {
    console.log("---GET HOLLIDAY BY USER ID---");
    const id = req.user._id.toString();
    const holliday = await Holliday.findOne({ user: id }).exec();
    holliday ? res.send(holliday.range) : res.send({ range: [] });
    console.log(holliday);
  } catch (err) {
    next(err);
    res.status(500).json({ message: "Internal server error." });
  }
};

// Crear/Actualizar schedule worker
export const addOrUpdate = async (req, res, next) => {
  console.log("---ADD NEW Hollyday OR UPDATE---");
  const user = req.user;
  const id = user._id.toString();
  console.log(id);
  const data = req.body;
  console.log("hollidays", data.range);
  try {
    const user = await User.findOne({ _id: id });
    if (!user) {
      let err = createError(409, "User not exist");
      next(err);
      return res.status(409).json(err);
    }
    if (user && user.type != "worker") {
      let err = createError(409, "you dont have the credentials");
      next(err);
      return res.status(409).json(err);
    }
    const holliday = await Holliday.findOne({ user: id });
    if (holliday) {
      console.log("entro", holliday);
      console.log("fuera", data.range);
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
      console.log("cambiando", updatedHolliday);
      res.json(updatedHolliday);
    } else {
      let newHolliday = new Holliday(data);
      console.log("data", holliday);
      console.log("el holliday", newHolliday);
      newHolliday.user = id;
      newHolliday.creator = id;
      newHolliday.save();
      res.json(newHolliday);
    }
  } catch (err) {
    next(err);
    res.status(500).json({ message: "Internal server error." });
  }
};
