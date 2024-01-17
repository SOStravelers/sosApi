import { Resend } from "resend"; 
const resend = new Resend(process.env.RESEND_API_KEY);
import Handlebars from "handlebars";
import { templateHtml } from "../../utils/externalFiles";




export const resendConfirm = async(email, info) =>{
    try {
     const htmlString = templateHtml("supportEmail");
     const template = Handlebars.compile(htmlString);
   
    } catch (error) {
     
    }
   
   } 
   
   export const resendCancel = async(email, info) =>{
   try {
     const htmlString = templateHtml("supportEmail");
     const template = Handlebars.compile(htmlString);
   } catch (error) {
     
   }
     
   } 
   
   export const resendComplete = async(email, info) =>{
   try {
     const htmlString = templateHtml("supportEmail");
     const template = Handlebars.compile(htmlString);
   } catch (error) {
     
   }
   } 
   
   
    