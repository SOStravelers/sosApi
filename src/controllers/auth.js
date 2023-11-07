import User from "../models/user.js";
import envar from "../config/envar.js";
import { sendEmailTemplate } from "../services/aws_ses.js";
import { createError } from "../config/error.js";
import { refreshTokenGen, accessTokenGen } from "../middleware/auth.js";
import { procesarNombre } from "../utils/data.js";
import {
  generarNumero4Digitos,
  generarCodigoAleatorio,
} from "../utils/code.js";

//Create user personal/workers/business
export const create = async (req, res, next) => {
  console.log("---CREATE NEW USER-WORKER-BUSINESS---");
  let user = new User(req.body);
  user.email = user.email.toLowerCase().trim();
  User.findOne({ email: user.email }).exec(async (err, theUser) => {
    if (theUser) {
      let error = createError(409, "This email is already in use");
      return res.status(409).json(error);
    } else {
      user.type = req.body.type || "personal";
      user.personalData.name.first =
        user.personalData.name.first.charAt(0).toUpperCase() +
        user.personalData.name.first.slice(1).toLowerCase().trim();
      user.personalData.name.last =
        user.personalData.name.last.charAt(0).toUpperCase() +
        user.personalData.name.last.slice(1).toLowerCase().trim();

      if (user.password) {
        user.password = User.hash(user.password);
      }
      if (user.username && user.username.length > 0) {
        let exists = await User.findOne({
          username: user.username,
        }).exec();
        if (exists) {
          // user.username= mongoose.Types.ObjectId()
          user.username = user.email
            .toLowerCase()
            .trim()
            .replace(/@/g, "_")
            .replace(".", "_");
        } else {
          user.username = user.username.toLowerCase().trim();
        }
      } else {
        user.username = user.email
          .toLowerCase()
          .trim()
          .replace(/@/g, "_")
          .replace(".", "_");
      }
      try {
        console.log("saving...", user);
        const newUser = await user.save();
        console.log("el item", newUser);
        res.json(newUser);
        // user.save((err, item) => {
        //   if (err) next(err);
        //   res.send("hola")
        // });
      } catch (err) {
        next(err);
      }
    }
  });
};
//Register user
export const registerEmail = async (req, res, next) => {
  try {
    console.log("==== REGISTER NEW USER AND CREATE TOKEN   ========");
    console.log(req.body);
    const accessTime = req.body.accessTime ? req.body.accessTime : "1d";
    const refreshTime = req.body.refreshTime ? req.body.refreshTime : "30d";
    req.body.accessTime ? delete req.body.accessTime : "";
    req.body.refreshTime ? delete req.body.refreshTime : "";
    let theEmail = req.body.email.toLowerCase().trim();
    let theUser = await User.findOne({ email: theEmail }).exec();
    if (theUser) {
      let err = createError(409, "This email is already in use");
      next(err);
      return res.status(409).json(err);
    }
    let user = new User(req.body);
    if (req.body.password) {
      user.password = User.hash(req.body.password);
    }
    user.type = req.body.type || "personal";
    let name = procesarNombre(req.body.name);
    console.log("name", name);
    if (name.length > 1) {
      user.personalData.name.first =
        name[0].charAt(0).toUpperCase() + name[0].slice(1).toLowerCase().trim();
      user.personalData.name.last =
        name[1].charAt(0).toUpperCase() + name[1].slice(1).toLowerCase().trim();
    } else {
      user.personalData.name.first =
        name[0].charAt(0).toUpperCase() + name[0].slice(1).toLowerCase().trim();
    }
    user.email = theEmail;
    if (user.username && user.username.length > 0) {
      let exists = await User.findOne({
        username: user.username,
      }).exec();
      if (exists) {
        // user.username= mongoose.Types.ObjectId()
        user.username = user.email
          .toLowerCase()
          .trim()
          .replace(/@/g, "_")
          .replace(".", "_");
      } else {
        user.username = user.username.toLowerCase().trim();
      }
    } else {
      user.username = user.email
        .toLowerCase()
        .trim()
        .replace(/@/g, "_")
        .replace(".", "_");
    }
    await user.save();
    const newUser = await User.findOne({ email: user.email }).select(
      "about email img language personalData username workerData _id security.hasPassword"
    );
    console.log("el item", newUser);
    let userToCreateToken = {
      _id: newUser._id,
      username: newUser.username,
    };
    let userRefresh = {
      _id: newUser._id,
    };
    res.json({
      access_token: accessTokenGen(userToCreateToken, true, accessTime),
      refresh_token: refreshTokenGen(userRefresh, refreshTime),
      user: newUser,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Internal server error." });
  }
};
//Login user by email
export const loginEmail = async (req, res, next) => {
  try {
    console.log("==== LOGIN USER BY EMAIL AND REFRESH TOKEN   ====");
    let { email, password } = req.body;
    email = email.toLowerCase().trim();
    let user = await User.findOne({ email }).exec();
    if (!user) {
      let err = createError(401, "User not found or invalid credentials");
      next(err);
      return res.status(401).json(err);
    }
    if (!user.security.hasPassword) {
      let err = createError(400, "has Not password");
      next(err);
      return res.status(400).json(err);
    }
    const isValid =
      typeof password !== "undefined"
        ? await User.validPassword(user._id.toString(), password)
        : false;
    if (!isValid) {
      let err = createError(401, "User not found or invalid credentialsss");
      next(err);
      return res.status(401).json(err);
    }
    user.lastLogin = Date.now();
    user.lastLoginType = "email";
    await user.save();
    const newUser = await User.findOne({ email: user.email }).select(
      "about email img language personalData username workerData _id security.hasPassword"
    );
    delete newUser.password;

    let userToCreateToken = {
      _id: newUser._id,
      username: newUser.username,
    };
    res.send({
      msg: "login success",
      access_token: accessTokenGen(userToCreateToken, true),
      refresh_token: refreshTokenGen(userToCreateToken),
      user: newUser,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Internal server error." });
  }
};
//login y registro por google
export const loginGoogle = async (req, res, next) => {
  console.log(
    "============= LOGIN/REGISTER USER BY GOOGLE AND REFRESH TOKEN   ============="
  );
  let { email, name, image } = req.body;
  console.log("IMAGE", image);
  email = email.toLowerCase().trim();
  try {
    User.findOne({ email }).exec(async (err, user) => {
      if (err) return next(err);
      let newValue = false;
      if (!user) {
        console.log("nuevo");
        newValue = true;
        user = new User();
        user.email = email;
        var partes = name.split(" ");
        var names = [partes[0], partes.slice(1).join(" ")];
        user.personalData.name.first = names[0];
        user.personalData.name.last = names[1];
        !user.type ? (user.type = "personal") : "";
        user.username = user.email
          .toLowerCase()
          .trim()
          .replace(/@/g, "_")
          .replace(".", "_");
      }
      !user.img.imgUrl ? (user.img.imgUrl = image) : "";
      user.lastLogin = Date.now();
      user.lastLoginType = "google";
      user.isActive = true;
      user.isValidate = true;
      if (newValue) {
        console.log("new");
        try {
          await user.save();
          const newUser = await User.findOne({ email: user.email }).select(
            "about email img language personalData username workerData _id security.hasPassword"
          );

          let userToCreateToken = {
            _id: newUser._id,
            username: newUser.username,
          };

          let userRefresh = {
            _id: newUser._id,
          };

          res.json({
            access_token: accessTokenGen(userToCreateToken, true),
            refresh_token: refreshTokenGen(userRefresh),
            user: newUser,
          });
        } catch (error) {
          if (error.code === 11000) {
            // Manejar el error de documento duplicado
            res.status(409).json({ error: "El usuario ya existe." });
          } else {
            // Manejar otros errores
            next(error);
          }
        }
      } else {
        let newUser = await User.findByIdAndUpdate(user._id, user, {
          new: true,
        }).exec();
        delete newUser.password;
        // USER (TO CREATE TOKEN)
        let userToCreateToken = {
          _id: newUser._id,
          username: newUser.username,
        };
        res.status(200).json({
          msg: "login success",
          access_token: accessTokenGen(userToCreateToken, true),
          refresh_token: refreshTokenGen(userToCreateToken),
          user: newUser,
        });
      }
    });
  } catch (err) {
    next(err);
  }
};
//Obtener usuario por ID
export const getById = async (req, res, next) => {
  console.log("---GET USER BY ID---");
  User.findOne({ _id: req.params.id }).exec((err, user) => {
    if (err) {
      let error = createError(400, "Invalid ID format");
      console.log(error);
      return res.status(400).json(error);
    } else if (user) {
      res.send(user);
    } else {
      let error = createError(404, "User not found");
      return res.status(401).json(error);
    }
  });
};
// envia correo con codigo de validación por tiempo definido
export const sendValidationCode = async (req, res, next) => {
  try {
    const { id, email } = req.query;
    console.log("buena", id, email);
    const user = await User.findById(id).exec();
    if (!user) {
      let err = createError(404, "User not found or invalid credentials");
      next(err);
      return res.status(404).json(err);
    }
    const code = generarNumero4Digitos();
    const urlCode = generarCodigoAleatorio(30);
    const digitosArray = Array.from(String(code), Number);
    const expTime = 5;
    const date = new Date();
    console.log(date);
    const updatedUser = await User.findOneAndUpdate(
      { _id: user._id }, // Filtro para encontrar el usuario por su ID
      {
        "validation.code": code,
        "validation.urlcode": urlCode,
        "validation.expTime": expTime,
        "validation.time": date,
      },
      { new: true } // Opcional: para obtener el documento actualizado como resultado
    );

    const params = {
      Source: envar().SES_EMAIL_AUTH, // Dirección de correo verificada con AWS
      Destination: {
        ToAddresses: [updatedUser.email], // Lista de destinatarios
        CcAddresses: [envar().SES_EMAIL_AUTH], // Lista de copias
      },
      Template: "validationCode", // Nombre del template a usar
      SubjectPart: "wena",
      TemplateData: JSON.stringify({
        number1: digitosArray[0],
        number2: digitosArray[1],
        number3: digitosArray[2],
        number4: digitosArray[3],
      }),
    };
    await sendEmailTemplate(params);
    res.send({ msg: "code sent" });
  } catch (err) {
    next(err);
    if (err instanceof Error && err.$metadata) {
      res
        .status(err.$metadata.httpStatusCode)
        .json({ error: err.Error.message });
    } else {
      next(err);
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
      let err = createError(404, "User not found or invalid credentials");
      next(err);
      return res.status(404).json(err);
    }
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

      // Realiza cualquier operación adicional aquí, como la conexión a SES AWS
      res.send(updatedUser);
    } else {
      let error = createError(
        400,
        "Authentication failed: Incorrect or expired code"
      );
      next(err);
      return res.status(400).json(error);
    }
  } catch (err) {
    next(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
// función para crear contraseña para usuario que no tienen creada
export const createPassword = async (req, res, next) => {
  try {
    console.log("createPassword");
    const id = req.params.id;
    const newPassword = req.body.password.trim();
    if (!newPassword) {
      let err = createError(400, "a field is missing");
      next(err);
      return res.status(404).json(err);
    }
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

    let userToCreateToken = {
      _id: updatedUser._id,
      username: updatedUser.username,
    };
    let userRefresh = {
      _id: updatedUser._id,
    };
    res.json({
      access_token: accessTokenGen(userToCreateToken, true),
      refresh_token: refreshTokenGen(userRefresh),
      user: updatedUser,
    });
  } catch (err) {
    next(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
//Función para encontrar usuario por email
export const findByEmail = async (req, res, next) => {
  try {
    console.log("findByEmail");
    var text = decodeURIComponent(req.body.email);
    const email = text.trim().toLowerCase();
    let user = await User.findOne({
      email: email,
    }).select("isActive isValidate security email personalData _id");
    if (!user) {
      let err = createError(404, "email not found");
      next(err);
      return res.status(404).json(err);
    } else {
      res.send(user);
    }
  } catch (err) {
    next(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

//Obtener usuarios con paginate por tipos y activados
export const getUsers = async (req, res, next) => {
  console.log("---GET USERS---");
  let body = {};
  Object.assign(body, req.query);
  console.log("query", body);
  let options = {
    // populate,
    // select,
    page: body.page || 1,
    limit: body.limit || 10,
    sort: { updatedAt: -1 },
  };
  let query = {};
  body.type ? (query.type = body.type) : "";
  body.isActive ? (query.isActive = body.isActive) : "";
  try {
    User.paginate(query, options, (err, items) => {
      if (err) return next(err);
      res.send(items);
    });
  } catch (err) {
    next(err);
  }
};
