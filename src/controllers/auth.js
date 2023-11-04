import User from "../models/user.js";
import mongoose from "mongoose";
import envar from "../config/envar.js";
import { sendEmailTemplate } from "../services/aws_ses_test.js";
import {
  notFoundError,
  createError,
  missingData,
  duplicateData,
} from "../config/error.js";

const generarNumero4Digitos = () => {
  const numero = Math.floor(1000 + Math.random() * 9000);
  return numero;
};

// envia correo con codigo de validación por tiempo definido
export const sendValidationCode = async (req, res, next) => {
  try {
    const id = req.params.id;
    const user = await User.findById(id).exec();
    if (!user) {
      let error = createError(409, "User not found or invalid credentials");
      res.status(409).json(error);
    } else {
      const code = generarNumero4Digitos();
      const digitosArray = Array.from(String(code), Number);
      const expTime = 3;
      const date = new Date();
      console.log(date);
      const updatedUser = await User.findOneAndUpdate(
        { _id: user._id }, // Filtro para encontrar el usuario por su ID
        {
          "validation.code": code,
          "validation.expTime": expTime,
          "validation.time": date,
        },
        { new: true } // Opcional: para obtener el documento actualizado como resultado
      );

      if (!updatedUser) {
        res.status(500).json({ error: "Error al actualizar el usuario" });
      }
      const params = {
        Source: envar().SES_EMAIL_AUTH, // Dirección de correo verificada con AWS
        Destination: {
          ToAddresses: [user.email], // Lista de destinatarios
          CcAddresses: [envar().SES_EMAIL_AUTH], // Lista de copias
        },
        Template: "validationCode", // Nombre del template a usar
        TemplateData: JSON.stringify({
          number1: digitosArray[0],
          number2: digitosArray[1],
          number3: digitosArray[2],
          number4: digitosArray[3],
        }),
      };
      await sendEmailTemplate(params);
      res.send({ msg: "code sent" });
    }
  } catch (err) {
    console.log(err);
    if (err instanceof Error && err.$metadata) {
      res
        .status(err.$metadata.httpStatusCode)
        .json({ error: err.Error.message });
    } else {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
};

//obtener los subservicios por servicio
export const verifyValidationCode = async (req, res, next) => {
  console.log("---GET SUBSERVICES BY SERVICE---");
  let options = {
    // populate,
    select: "name ",
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 50,
    sort: { updatedAt: -1 },
  };
  let query = {};
  query.isActive = true;
  query.service = req.query.id;
  console.log(query);
  try {
    Subservice.paginate(query, options, (err, items) => {
      if (err) return next(err);
      res.send(items);
    });
  } catch (err) {
    next(err);
  }
};
