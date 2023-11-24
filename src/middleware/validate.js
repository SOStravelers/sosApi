// import { convertToObject } from "typescript";
import checkObjectId from "../lib/db/checkObjectId.js";
import { createError } from "../config/error.js";
import logger from "../config/logger.js";

const validateParams = function (requestParams, toValidate) {
  return function (req, res, next) {
    try {
      for (let param of requestParams) {
        if (checkParamPresent(Object.keys(req[toValidate]), param)) {
          let reqParam = req[toValidate][param.param_key];
          if (!checkParamType(reqParam, param)) {
            console.log("caso1");

            throw createError(
              400,
              `${param.param_key} is of type ` +
                `${typeof reqParam} but should be ${param.type}`
            );
          } else {
            if (!runValidators(reqParam, param.validator_functions)) {
              throw createError(
                400,
                `Validation failed for ${param.param_key}`
              );
            }
            if (param.enum && !checkEnums(reqParam, param)) {
              throw createError(
                400,
                `Validation failed for ${param.param_key}`
              );
            }
          }
        } else if (param.required) {
          throw createError(400, `Missing Parameter ${param.param_key}`);
        }
      }
      next();
    } catch (err) {
      logger.error({
        message: `${err.message} - Status: ${err.statusCode || 500}`,
        path: req.path,
        method: req.method,
        body: req.body,
        stack: err.stack,
      });
      // console.log(err);
      if (!(err instanceof Error) || !err.statusCode) {
        err = createError();
      }
      next(err);
    }
  };
};

const checkEnums = (reqParams, paramObj) => {
  return paramObj.enum?.includes(reqParams);
};

const checkParamPresent = function (reqParams, paramObj) {
  return reqParams.includes(paramObj.param_key);
};

const checkParamType = function (reqParam, paramObj) {
  const reqParamType = Array.isArray(reqParam) ? "array" : typeof reqParam;
  return paramObj.type === "objectid"
    ? checkObjectId(reqParam)
    : reqParamType === paramObj.type;
};

const runValidators = function (reqParam, validator_functions = []) {
  for (let validator of validator_functions) {
    if (!validator(reqParam)) {
      return false;
    }
  }
  return true;
};

export default validateParams;
