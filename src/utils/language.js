import languageData from "../languages/email.js";

export function getLocalizedTexts(sectionKey, lang) {
  const section = languageData[sectionKey] || {};
  const global = languageData.global || {};

  const extractValues = (obj) => {
    const result = {};
    for (const key in obj) {
      if (typeof obj[key] === "object" && obj[key][lang]) {
        result[key] = obj[key][lang];
      } else if (typeof obj[key] === "object") {
        result[key] = extractValues(obj[key]);
      }
    }
    return result;
  };

  return {
    ...extractValues(global),
    ...extractValues(section),
  };
}
