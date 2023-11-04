import User from "../models/user.js";
import envar from "../config/envar.js";
import { sendEmailTemplate } from "../services/aws_ses_test.js";
import { createError } from "../config/error.js";
import { refreshTokenGen, accessTokenGen } from "../middleware/auth.js";
import {
  generarNumero4Digitos,
  generarCodigoAleatorio,
} from "../utils/code.js";

// envia correo con codigo de validación por tiempo definido
export const sendValidationCode = async (req, res, next) => {
  try {
    const id = req.params.id;
    const user = await User.findById(id).exec();
    if (!user) {
      let error = createError(409, "User not found or invalid credentials");
      res.status(404).json(error);
    } else {
      const code = generarNumero4Digitos();
      const digitosArray = Array.from(String(code), Number);
      const expTime = 5;
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
//validar codigo para validar correo
export const verifyValidationCode = async (req, res, next) => {
  try {
    console.log("verify code", req.body.code);
    const number = req.body.code;
    const id = req.params.id;
    const user = await User.findById(id).exec();
    if (!user) {
      let error = createError(404, "User not found or invalid credentials");
      res.status(404).json(error);
    } else {
      const diferenciaEnMilisegundos = new Date() - user.validation.time;
      const diferenciaEnMinutos = diferenciaEnMilisegundos / 60000;
      console.log(diferenciaEnMinutos);
      if (
        diferenciaEnMinutos < user.validation.expTime &&
        number == user.validation.code
      ) {
        const updatedUser = await User.findOneAndUpdate(
          { _id: user._id },
          {
            isValidate: true,
            isActive: true,
          },
          { new: true }
        ).select("isActive isValidate security email personalData _id");

        if (!updatedUser) {
          let error = createError(500, "Internal Server Error");
          res.status(500).json(error);
        }

        // Realiza cualquier operación adicional aquí, como la conexión a SES AWS
        res.send(updatedUser);
      } else {
        let error = createError(
          400,
          "Authentication failed: Incorrect or expired code"
        );
        res.status(400).json(error);
      }
    }
  } catch (err) {
    console.log(err);
    let error = createError(500, "Internal Server Error");
    res.status(500).json(error);
  }
};
// función para crear contraseña para usuario que no tienen creada
export const createPassword = async (req, res, next) => {
  try {
    console.log("createPassword");
    const id = req.params.id;
    const newPassword = req.body.password;
    if (!newPassword) {
      let error = createError(400, "a field is missing");
      res.status(404).json(error);
      throw err;
    } else {
      const encryptPassword = await User.hash(newPassword);
      const updatedUser = await User.findOneAndUpdate(
        { _id: id }, // Filtro para encontrar el usuario por su ID
        {
          password: encryptPassword,
          isActive: true,
          "security.hasPassword": true,
          "security.updatedAt": new Date(),
        },
        { new: true } // Opcional: para obtener el documento actualizado como resultado
      ).select("isActive isValidate security email personalData _id img");

      if (!updatedUser) {
        let error = createError(500, "Internal Server Error");
        res.status(500).json(error);
      }
      let userToCreateToken = {
        _id: updatedUser._id,
        username: updatedUser.username,
      };
      let userRefresh = {
        _id: updatedUser._id,
      };
      res.json({
        access_token: accessTokenGen(userToCreateToken, true),
        refresh_token: refreshTokenGen(userToCreateToken),
        user: updatedUser,
      });
    }
  } catch (err) {
    console.log(err);
    let error = createError(500, "Internal Server Error");
    res.status(500).json(error);
  }
};
//Función para encontrar usuario por email
export const findByEmail = async (req, res, next) => {
  try {
    var text = decodeURIComponent(req.params.email);
    const email = text.trim().toLowerCase();
    let user = await User.findOne({
      email: email,
    }).select("isActive isValidate security email personalData _id");
    if (!user) {
      let error = createError(404, "email not found");
      res.status(404).json(error);
    } else {
      res.send(user);
    }
  } catch (err) {
    console.log(err);
    let error = createError(500, "Internal Server Error");
    res.status(500).json(error);
  }
};
export const recoveryPassEmail = async (req, res, next) => {
  try {
    const id = req.params.id;
  } catch (err) {}
};
