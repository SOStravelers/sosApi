import moment from "moment-timezone";
import { createError } from "../../config/error.js";
export const optionsBooking = (page, limit) => {
    const populate = [
        {
            path: "businessUser",
            select: "businessData personalData img",
        },
        {
            path: "workerUser",
            select: "workerData personalData img",
        },
        {
            path: "service",
            select: "name isActive coverImg",
        },
        {
            path: "subservice",
            select: "name isActive coverImg duration",
        },
        {
            path: "clientUser",
            select: "personalData",
        },
    ];
    return {
        populate: populate,
        select: "payment idKey startTime currency status endTime date duration ",
        page: page || 1,
        limit: limit || 5,
        sort: { updatedAt: -1 },
    };
}

export const validateFormatDate = (dateString, dateEndString) => {
    if (dateEndString) {
        if (!moment(dateString, 'YYYY-MM-DD', true).isValid() || !moment(dateEndString, 'YYYY-MM-DD', true).isValid())
            {
                console.log("helper de dos ", moment(dateString, 'YYYY-MM-DD', true).isValid(), moment(dateEndString, 'YYYY-MM-DD', true).isValid())
                throw createError(400, "invalid date format");
            }
    } else if (!moment(dateString, 'YYYY-MM-DD', true).isValid()){
        console.log("helper de uno ", moment(dateString, 'YYYY-MM-DD', true).isValid())
        throw createError(404, "invalid date format");
    }
        
}