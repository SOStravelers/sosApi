import jwt from "jsonwebtoken";
// import mainConfig from '../main';

import envar from "../config/envar.js";
import User from "../models/user.js";
import { createError } from "../config/error.js";

// funcs to decoded, encoded and generate accessToken
const decodeFunc = (token) => {
  try {
    return jwt.verify(token, envar().SECRET);
  } catch (err) {
    return err;
  }
};
const encodeFunc = (toSing, expiresIn) => {
  return jwt.sign(toSing, envar().SECRET, { expiresIn });
};
const accessToken = (user, tokenFresh = false, time) => {
  let tiempo = time ? time : "3d";
  return encodeFunc({ ...user, tokenFresh }, tiempo);
};
const tokenEmailFunction = (user, tokenFresh = false) => {
  return encodeFunc({ ...user, tokenFresh }, "15min");
};

// export the functions to decoded, encoded and generate accessToken
export const decode = decodeFunc;
export const encode = encodeFunc;
export const accessTokenGen = accessToken;
export const tokenEmail = tokenEmailFunction;

// export the functions to generate refresh_token and get access with the refresh_token
export const refreshTokenGen = (user, time) => {
  let tiempo = time ? time : "30d";
  return encodeFunc(user, tiempo);
};
export const getTokenByRefresh = (refresh) => {
  let payload = decodeFunc(refresh);
  delete payload.iat;
  delete payload.exp;
  delete payload.nbf;
  delete payload.jti;
  return accessToken(payload);
};
export const isAuthOptional = async (req, res, next) => {
  req.access_token = req.headers.authorization;
  if (typeof req.access_token !== "undefined" && req.access_token !== "") {
    let decoded;
    try {
      decoded = decodeFunc(req.access_token);

      let authUser = await User.findOne({ _id: decoded._id })
        .select("isActive name username emails imgUrl ")
        // .populate("scope.id", "name id _id")
        .exec();

      authUser.id = authUser._id.toString();

      req.user = authUser;
      next();
    } catch (err) {
      let message =
        decoded.name === "TokenExpiredError"
          ? "The token has expired"
          : "Not authorized.";
      next(createError(401, message));
    }
    // next();
  } else if (req.method === "OPTIONS") {
    next();
  } else {
    next();
  }
};
export const renewToken = async (req, res, next) => {
  console.log("renew tokens", req.body);
  req.access_token = req.headers.authorization;
  const accessTime = req.body.accessTime ? req.body.accessTime : "1d";
  const refreshTime = req.body.refreshTime ? req.body.refreshTime : "30d";
  if (typeof req.access_token !== "undefined" && req.access_token !== "") {
    let decoded = decodeFunc(req.access_token);
    let authUser;
    console.log(decoded);
    if (!decoded.tokenFresh) {
      try {
        console.log("perro", decoded);
        authUser = await User.findOne({ _id: decoded._id })
          .select("username _id")
          .exec();
        console.log("authUser", authUser);
        authUser.id = authUser._id.toString();

        let userRefresh = {
          _id: authUser._id,
        };
        console.log("refresh", userRefresh);
        res.json({
          access_token: accessTokenGen(authUser, true, accessTime),
          refresh_token: refreshTokenGen(userRefresh, refreshTime),
        });
      } catch (err) {
        let isTokenError = decoded.name === "TokenExpiredError" ? true : false;
        if (isTokenError) {
          let error = createError(401, "The token has expired.");
          return res.status(401).json(error);
        } else {
          let error = createError(401, "Not authorized.");
          return res.status(401).json(error);
        }
      }
    } else {
      res.status(401).send({
        msg: "token not valid",
      });
    }
  } else if (req.method === "OPTIONS" || req.query.outside) {
    console.log(req.query);
    next();
  } else {
    res.status(401).send({
      msg: "Not authorized, client must send an access token.",
    });
  }
};
export const isAuth = async (req, res, next) => {
  req.access_token = req.headers.authorization;
  if (typeof req.access_token !== "undefined" && req.access_token !== "") {
    let decoded = decodeFunc(req.access_token);
    let authUser;
    try {
      authUser = await User.findOne({ _id: decoded._id })
        .select(
          "isActive type security isValidate name username email imgUrl personalData workerData paymentData"
        )
        .exec();
      authUser.id = authUser._id;
      req.user = authUser;
      next();
    } catch (err) {
      let isTokenError = decoded.name === "TokenExpiredError" ? true : false;

      if (isTokenError) {
        let error = createError(401, "The token has expired.");
        return res.status(401).json(error);
      } else {
        let error = createError(401, "Not authorized.");
        return res.status(401).json(error);
      }
    }
    // next();
  } else if (req.method === "OPTIONS" || req.query.outside) {
    console.log(req.query);
    next();
  } else {
    res.status(401).send({
      msg: "Not authorized, client must send an access token.",
    });
  }
};
export const isAdmin = async (req, res, next) => {
  console.log("validate admin");
  req.access_token = req.headers.authorization;
  if (typeof req.access_token !== "undefined" && req.access_token !== "") {
    let decoded = decodeFunc(req.access_token);
    let authUser;
    try {
      console.log("vamos bien");
      console.log(decoded);
      authUser = await User.findOne({ _id: decoded._id })
        .select("isAdminUser _id isActive name username personalData ")
        .exec();
      console.log(authUser);
      if (authUser._id && authUser.isAdminUser) {
        next();
      } else {
        let error = createError(401, "Dont have access");
        return res.status(401).json(error);
      }
    } catch (err) {
      let isTokenError = decoded.name === "TokenExpiredError" ? true : false;
      if (isTokenError) {
        let error = createError(401, "The token has expired.");
        return res.status(401).json(error);
      } else {
        let error = createError(401, "Not authorized.");
        return res.status(401).json(error);
      }
    }
    // next();
  } else if (req.method === "OPTIONS" || req.query.outside) {
    console.log(req.query);
    next();
  } else {
    res.status(401).send({
      msg: "Not authorized, client must send an access token.",
    });
  }
};
