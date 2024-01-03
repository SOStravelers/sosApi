import Booking from "../../models/booking.js";
import User from "../../models/user.js";
import { createError } from "../../config/error.js"
import { optionsBooking, validateFormatDate } from "./helper.js";

export const getDayClientId = async (req, res, next) => {
    global.logger.info("---GET DAY BOOKING BY CLIENT---");
    try {
        const user = req.user;
        console.log(user)
        if (user.type != "personal") throw createError(401, "Unauthorized");
        const { date, page, limit } = req.query;
        validateFormatDate(date);
        let options = optionsBooking(page, limit);
        let query = {
            clientUser: user._id.toString(),
            "date.stringData": date,
        };
        const booking = await Booking.paginate(query, options);
        if (!booking) throw createError(404, "Client day booking not found ");
        res.status(200).json(booking);
    } catch (err) {
        next(err);
    }
};