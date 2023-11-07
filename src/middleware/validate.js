// import { convertToObject } from "typescript";
import checkObjectId from "../lib/db/checkObjectId.js";

const validateParams = function (requestParams, toValidate) {
  return function (req, res, next) {
    for (let param of requestParams) {
      console.log(param);
      if (checkParamPresent(Object.keys(req[toValidate]), param)) {
        let reqParam = req[toValidate][param.param_key];
        if (!checkParamType(reqParam, param)) {
          console.log("caso1");
          return res.send(400, {
            statusCode: 400,
            message:
              `${param.param_key} is of type ` +
              `${typeof reqParam} but should be ${param.type}`,
          });
        } else {
          if (!runValidators(reqParam, param.validator_functions)) {
            console.log("caso2");
            return res.send(400, {
              statusCode: 400,
              message: `Validation failed for ${param.param_key}`,
            });
          }
          if (param.enum && !checkEnums(reqParam, param)) {
            console.log("caso3");
            return res.status(400).send({
              message: `Validation failed for ${param.param_key} it is not a value allowed`,
            });
          }
        }
      } else if (param.required) {
        console.log("caso4");
        return res.status(400).send({
          statusCode: 400,
          message: `Missing Parameter ${param.param_key}`,
        });
      }
    }
    next();
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
