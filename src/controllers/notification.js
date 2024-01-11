import Notification from "../models/notification.js";
import User from "../models/user.js";

const populateBooking = [
  {
    path: "booking",
    select: "businessUser service subservice startTime",
    populate: [
      {
        path: "businessUser.businessData",
        select: "name location",
      },
      {
        path: "service",
        select: "name",
      },
      {
        path: "subservice",
        select: "name",
      },
    ],
  },
];
export const getByUser = async (req, res, next) => {
  try {
    const options = {
      sort: { createdAt: -1 },
      limit: 10,
      page: req.query.page || 1,
      select: "title booking type body isRead to link imgUrl",
      populate: populateBooking,
    };
    const notifications = await Notification.paginate(
      { to: req.user._id },
      options
    );
    res.send(notifications);
  } catch (err) {
    next(err);
  }
};
