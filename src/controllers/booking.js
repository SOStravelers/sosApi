import { createError } from "../config/error.js";
import Booking from "../models/booking.js";
import { sendEmailPaymentConfirmation } from "../services/aws_ses.js";

//Crear booking
export const create = async (req, res, next) => {
  global.logger.info("---CREATE NEW BOOKING---");
  try {
    const emailData = req.body.emailData;
    const bookingData = req.body;
    bookingData.emailData = null;
    let booking = new Booking(bookingData);
    let query = {
      $and: [
        {
          location: booking.location,
        },
        {
          subService: booking.subService,
        },
        {
          date: booking.date,
        },
        {
          startTime: booking.startTime,
        },
      ],
    };
    let exists = await Booking.findOne(query, {}).exec();
    if (exists) {
      throw createError(409, "document already exists");
    } else {
      const newBooking = await booking.save();
      if (emailData) sendEmailPaymentConfirmation(emailData);
      res.status(201).json({ booking: newBooking, msg: "new Document" });
    }
  } catch (err) {
    next(err);
  }
};
//Obtener reserva por ID
export const getById = async (req, res, next) => {
  global.logger.info("---GET BOOKING BY ID---");
  try {
    const booking = await Booking.findOne({ _id: req.params.id }).exec();
    if (!booking) throw createError(404, "Booking not found");
    res.send(booking);
  } catch (err) {
    next(err);
  }
};
//Obtener bookings con paginate por cliente, hotel, Worker,
export const getBookings = async (req, res, next) => {
  global.logger.info("---GET BOOKINGS---");
  try {
    let body = {};
    Object.assign(body, req.query);
    const populate = [
      {
        path: "businessUser",
        //   select: "isActive name  email phone creator user imgUrl emails type",
      },
      {
        path: "workerUser",
      },
      {
        path: "clientUser",
      },
      {
        path: "creatorUser",
      },
    ];
    let options = {
      // populate,
      // select,
      page: body.page || 1,
      limit: body.limit || 50,
      sort: { updatedAt: -1 },
    };
    let query = {};
    body.isActive ? (query.isActive = body.isActive) : "";
    body.client ? (query.client = body.client) : "";
    body.hotel ? (query.hotel = body.hotel) : "";
    body.worker ? (query.worker = body.worker) : "";
    body.creator ? (query.creator = body.creator) : "";

    const bookings = await Booking.paginate(query, options);
    res.status(200).json(bookings);
  } catch (err) {
    next(err);
  }
};
//Actualizar data de un booking
export const updateOne = async (req, res, next) => {
  global.logger.info("---UPDATE BOOKING---");
  try {
    let data = req.body;

    const booking = await Booking.findOneAndUpdate(
      {
        _id: req.params.id,
      },
      data,
      {
        new: true,
      }
    ).exec();
    if (!booking) throw createError(404, "Booking not found");
    res.status(200).json(booking);
  } catch (err) {
    next(err);
  }
};
/*  get day by client  */

export const getDayClientId = async(req, res, next) =>{

  global.logger.info("---GET CLIENT BOOKING---")
  
  const user = req.user

  const populate = [
    {
      path: 'businessUser',
      select: 'businessData personalData'
    },
    {
     path: 'workerUser',
     select: 'workerData personalData'
    }, 
    {
      path: 'service',
      select: 'name isActive coverImg'
    },
    {
      path: 'subservice',
      select: 'name isActive coverImg duration'
    },
    {
      path: 'clientUser',
      select: 'personalData'
    }
  ]
  
  try {
   
  let options = {

     populate,
     select: 'startTime endTime date duration',
     page: req.query.page || 1,
     limit: req.query.limit || 2,
     sort: { updatedAt: -1 },
  }

  let query = {
     "date.stringData": req.query.date,
    "clientUser": user._id.toString(),
  }
  
   const booking = await Booking.paginate(query, options);
   
   if (!booking) throw createError(404, "Booking not found");
   res.status(200).json(booking);
   

 
 } catch (err) {

   next(err);
 }

}
/* get month by client  */
export const getMonthClientId = async(req, res, next) => {

  global.logger.info("---GET CLIENT MONTH BOOKING---")
  
  const user = req.user

  const populate = [
    {
      path: 'businessUser',
      select: 'businessData personalData'
    },
    {
     path: 'workerUser',
     select: 'workerData personalData'
    },
    {
      path: 'service',
      select: 'name isActive coverImg'
    },
    {
      path: 'subservice',
      select: 'name isActive coverImg duration'
    }, 
    {
      path: 'clientUser',
      select: 'personalData'
    }
  ]

  try {
   
  let options = {

     populate,
     select: 'startTime endTime date duration',
     page: req.query.page || 1,
     limit: req.query.limit || 8,
     sort: { updatedAt: -1 },
  }

/* format: YY-MM-DD => 2024-12-23 */  

const dateFromBody = req.query.date;

const [year, month, dia] = dateFromBody.split("-");

const startDate = new Date(year, month - 1, 1); 

const endDate = new Date(year, month, 0);

const query = {
  "clientUser": user._id.toString(),
  "date.isoDate": {
    $gte: startDate,
    $lte: endDate
  }
};

   const booking = await Booking.paginate(query, options);
   
   if (!booking) throw createError(404, "Booking not found");
   res.status(200).json(booking);
   

 
 } catch (err) {

   next(err);
 }


}

/*  get all bookings for client  */
export const getAllClientsId = async(req, res, next) => {

  /* bug sale el logger de una ruta diferente */
  
  global.logger.info("---GET TO CLIENT ALL BOOKING---")
  
  const user = req.user


  const populate = [

    {
      path: 'businessUser',
      select: 'businessData personalData'
    },
    {
     path: 'workerUser',
     select: 'workerData personalData'
    },
    {
      path: 'service',
      select: 'name isActive coverImg'
    },
    {
      path: 'subservice',
      select: 'name isActive coverImg duration'
    },
    {
      path: 'clientUser',
      select: 'personalData'
    }
  ]

  try {
   
  let options = {

     populate,
     select: 'startTime endTime date duration',
     page: req.query.page || 1,
     limit: req.query.limit || 5,
     sort: { updatedAt: -1 },
  }

  let query = {

    "clientUser": user._id.toString()

  }
  console.log(user._id.toString())
   const booking = await Booking.paginate(query, options);
   
   if (!booking) throw createError(404, "Booking not found");
   res.status(200).json(booking);
   
 
 } catch (err) {

   next(err);
 }

}

/* get all workers */
export const getAllworkersId = async(req, res, next) => {


  global.logger.info("---GET TO WORKER ALL BOOKING---")
  
  const user = req.user

  const populate = [
    {
      path: 'businessUser',
      select: 'businessData personalData'
    },
    {
     path: 'workerUser',
     select: 'workerData personalData'
    },
    {
      path: 'service',
      select: 'name isActive coverImg'
    },
    {
      path: 'subservice',
      select: 'name isActive coverImg duration'
    },
    {
      path: 'clientUser',
      select: 'personalData'
    }
  ]

  try {
   
  let options = {

     populate,
     select: 'startTime endTime date duration',
     page: req.query.page || 1,
     limit: req.query.limit || 8,
     sort: { updatedAt: -1 },
  }


  let query = {

    "workerUser": user._id.toString(),
  
  }
  
   const booking = await Booking.paginate(query, options);
   
   if (!booking) throw createError(404, "Booking not found");
   res.status(200).json(booking);
   

 
 } catch (err) {

   next(err);
 }



}

/* get day by worker  */
export const getDayWorkers = async (req, res, next) => {

  global.logger.info("---GET DAYS TO WORKER BOOKING---")
  
  const user = req.user

  const populate = [
    {
      path: 'businessUser',
      select: 'businessData personalData'
    },
    {
     path: 'workerUser',
     select: 'workerData personalData'
    },
    {
      path: 'service',
      select: 'name isActive coverImg'
    },
    {
      path: 'subservice',
      select: 'name isActive coverImg duration'
    },
    {
      path: 'clientUser',
      select: 'personalData'
    }
  ]

  try {
   

    const [year, month, day] = req.query.date.split("-");

    console.log(day, month)
    const startDate = new Date(year, month - 1, parseInt(day)); 
    
   
    const endDate = new Date(year, month - 1, parseInt(day)+3);
    
    //  Sumar dos días a la fecha de fin
    /*  endDate.setDate(endDate.getDate() + 2); */
   

  let options = {

     populate,
     select: 'startTime endTime date duration',
     page: req.query.page || 1,
     limit: req.query.limit || 8,
     sort: { updatedAt: -1 },
  }

  let query = {
    "workerUser": user._id.toString(),
    "date.isoDate": {
      $gte: startDate,
      $lte: endDate
    }
  }
  
   const booking = await Booking.paginate(query, options);
   
   if (!booking) throw createError(404, "Booking not found");
   res.status(200).json(booking);
   

 
 } catch (err) {

   next(err);
 }


}

/* get the business day for a specific place. */

export const getDayBusiness = async (req, res, next) => {

  global.logger.info("---GET SPECIFIC DATE TO BUSINESS BOOKING---")
  
  const user = req.user

  const populate = [
    {
      path: 'businessUser',
      select: 'businessData personalData'
    },
    {
     path: 'workerUser',
     select: 'workerData personalData'
    },
    {
      path: 'service',
      select: 'name isActive coverImg'
    },
    {
      path: 'subservice',
      select: 'name isActive coverImg duration'
    },
    {
      path: 'clientUser',
      select: 'personalData'
    }
  ]


  try {
   

    const [year_start, month_start, day_start] = req.query.date_start.split("-");
    const [year_end, month_end, day_end] = req.query.date_end.split("-");

    const startDate = new Date(year_start, month_start - 1, day_start); 
    const endDate = new Date(year_end, month_end - 1, day_end);


  let options = {

     populate,
     select: 'startTime endTime date duration',
     page: req.query.page || 1,
     limit: req.query.limit || 8,
     sort: { updatedAt: -1 },
  }

  let query = {
    "workerUser": user._id.toString(),
    "date.isoDate": {
      $gte: startDate,
      $lte: endDate
    },
    "status": { $in: ['canceled', 'completed', 'failed'] }
  }
  
   const booking = await Booking.paginate(query, options);
   
   if (!booking) throw createError(404, "Booking not found");
   res.status(200).json(booking);
   

 
 } catch (err) {

   next(err);
 }



}

/* get all business  */

export const getAllBusiness = async (req, res, next) => {

  global.logger.info("---GET ALL BUSINESS BOOKING---")
  
  const user = req.user

  const populate = [
    {
      path: 'businessUser',
      select: 'businessData personalData'
    },
    {
     path: 'workerUser',
     select: 'workerData personalData'
    },
    {
      path: 'service',
      select: 'name isActive coverImg'
    },
    {
      path: 'subservice',
      select: 'name isActive coverImg duration'
    },
    {
      path: 'clientUser',
      select: 'personalData'
    }
  ]

  try {
   
    
  let options = {

     populate,
     select: 'startTime endTime date duration',
     page: req.query.page || 1,
     limit: req.query.limit || 8,
     sort: { updatedAt: -1 },
  }

  let query = {
    "businessUser": user._id.toString(),
    "status": { $in: ['canceled', 'completed', 'failed'] }
  }
  
   const booking = await Booking.paginate(query, options);
   
   if (!booking) throw createError(404, "Booking not found");
   res.status(200).json(booking);
   

 
 } catch (err) {

   next(err);
 }


}

/* get year business */

export const getYearBusiness = async (req, res, next) => {

  global.logger.info("---GET YEAR TO BUSINESS BOOKING---")
  
  const user = req.user

  const populate = [
    {
      path: 'businessUser',
      select: 'businessData personalData'
    },
    {
     path: 'workerUser',
     select: 'workerData personalData'
    },
    {
      path: 'service',
      select: 'name isActive coverImg'
    },
    {
      path: 'subservice',
      select: 'name isActive coverImg duration'
    },
    {
      path: 'clientUser',
      select: 'personalData'
    }
  ]

  try {
   

    const [year, month, day] = req.query.date.split("-");


    const startDate = new Date(year, 0, 1);

    const endDate = new Date(year, 11, 31);
    
    
  let options = {

     populate,
     select: 'startTime endTime date duration',
     page: req.query.page || 1,
     limit: req.query.limit || 8,
     sort: { updatedAt: -1 },
  }

  let query = {
    "businessUser": user._id.toString(),
    "date.isoDate": {
      $gte: startDate,
      $lte: endDate
    },
    "status": { $in: ['canceled', 'completed', 'failed'] }
  }
  
   const booking = await Booking.paginate(query, options);
   
   if (!booking) throw createError(404, "Booking not found");
   res.status(200).json(booking);
   

 
 } catch (err) {

   next(err);
 }


}

/* get month business  */

export const getMonthBusiness = async(req, res, next) => {


  global.logger.info("---GET MONTH BUSINESS BOOKING---")
  
  const user = req.user

  const populate = [
    {
      path: 'businessUser',
      select: 'businessData personalData'
    },
    {
     path: 'workerUser',
     select: 'workerData personalData'
    },
    {
      path: 'service',
      select: 'name isActive coverImg'
    },
    {
      path: 'subservice',
      select: 'name isActive coverImg duration'
    }, 
    {
      path: 'clientUser',
      select: 'personalData'
    }
  ]

  try {
   
  let options = {

     populate,
     select: 'startTime endTime date duration',
     page: req.query.page || 1,
     limit: req.query.limit || 8,
     sort: { updatedAt: -1 },
  }

/* format: YY-MM-DD => 2024-12-23 */  

const dateFromBody = req.query.date;

const [year, month, day] = dateFromBody.split("-");

const startDate = new Date(year, month - 1, 1); 

const endDate = new Date(year, month, 0);

const query = {
  "businessUser": user._id.toString(),
  "date.isoDate": {
    $gte: startDate,
    $lte: endDate
  },
  "status": { $in: ['canceled', 'completed', 'failed'] }
};

   const booking = await Booking.paginate(query, options);
   
   if (!booking) throw createError(404, "Booking not found");
   res.status(200).json(booking);
   

 
 } catch (err) {

   next(err);
 }

}