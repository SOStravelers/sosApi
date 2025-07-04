import Currency from "../models/currency.js";
import { createError } from "../config/error.js";

export const create = async (req, res, next) => {
  global.logger.info("--- CREATE NEW Currency ---");
  try {
    let currency = new Currency({ code: "ess" });
    const newCurrency = await currency.save();
    res.status(201).json(newCurrency);
  } catch (err) {
    next(err);
  }
};
