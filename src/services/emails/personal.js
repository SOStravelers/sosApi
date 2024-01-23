import { Resend } from "resend";
const resend = new Resend(process.env.RESEND_API_KEY);
import Handlebars from "handlebars";
import { templateHtml } from "../../utils/externalFiles.js";


export const resendConfirmPersonal = async (info) => {
    try {
        const { email, name, subservice, service } = info;
        const htmlString = templateHtml("confirmBooking");
        const template = Handlebars.compile(htmlString);
        const htmlToSend = template({
            name: name,
            service: service,
            subservice: subservice
        });
        console.log("el email", email);
        const data = await resend.emails.send({
            from: "SOS Travelers <booking@sostvl.com>",
            to: [email], // va dirigido al usuario
            subject: "SOS Travelers - Confirm booking",
            html: htmlToSend,
        });
        
        console.log(data);
    } catch (error) {
        console.error(error);
    }
};

export const resendCancelPersonal = async (info) => {
    try {
        const { email, name, subservice, service} = info;
        const htmlString = templateHtml("cancelBooking");
        const template = Handlebars.compile(htmlString);
        
        const htmlToSend = template({
            name: name,
            service: service,
            subservice: subservice
        });
        const data = await resend.emails.send({
            from: "SOS Travelers <booking@sostvl.com>",
            to: [email], // va dirigido al usuario
            subject: "SOS Travelers - Cancel booking",
            html: htmlToSend,
        });
    } catch (error) {
        console.log(error);
    }
};

export const resendCompletedPersonal = async (info) => {
    try {
        const { email, name, subservice, service} = info;
        const htmlString = templateHtml("completedBooking");
        const template = Handlebars.compile(htmlString);
        const htmlToSend = template({
            name: name,
            service: service,
            subservice: subservice
        });
        const data = await resend.emails.send({
            from: "SOS Travelers <booking@sostvl.com>",
            to: [email], // va dirigido al usuario
            subject: "SOS Travelers - A booking has been generated SOS",
            html: htmlToSend,
        });
        
    } catch (error) {
        console.log(error);
    }
};


