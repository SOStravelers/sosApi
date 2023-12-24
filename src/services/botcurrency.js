import axios from "axios";
import * as cheerio from "cheerio";

const getCurrencyData = async (currency, currencyBase) => {
  const url = `https://www.google.com/finance/quote/${currencyBase}-${currency}`;
  const { data: html } = await axios.get(url);
  return html;
};

const approximateNumber = (numberString) => {
  // Remove commas and convert to number
  const number = parseFloat(numberString.replace(/,/g, ""));

  if (number > 0 && number < 0.01) {
    return Math.ceil(number * 10000) / 10000;
  } else if (number >= 0.01 && number < 1) {
    return Math.ceil(number * 100) / 100;
  } else if (number >= 1 && number < 100) {
    return Math.ceil(number * 10) / 10;
  } else {
    return Math.ceil(number);
  }
};

function approximateEntero(num) {
  const decimalPart = num - Math.floor(num);
  if (decimalPart > 0 && decimalPart < 0.5) {
    return Math.floor(num) + 0.5;
  } else if (decimalPart >= 0.5) {
    return Math.ceil(num);
  } else {
    return num;
  }
}

export const botcurrency = async (price = 0, currencyBase = "USD") => {
  console.log("botCurrency");
  let currenciesArray = ["BRL", "USD", "EUR"];
  currenciesArray = currenciesArray.filter(
    (currency) => currency !== currencyBase
  );

  const othersCurrency = {
    currencyBase: currencyBase,
    valuesToday: [],
  };

  try {
    for (let i = 0; i < currenciesArray.length; i++) {
      const currency = currenciesArray[i];
      const response = await getCurrencyData(currency, currencyBase);
      if (response) {
        const $ = cheerio.load(response);
        const currencyValue = $(".YMlKec.fxKbKc").text();
        const currencyData = {
          currency: currency,
          value: currencyValue,
          aprox: approximateNumber(currencyValue),
          finalCost: approximateEntero(
            approximateNumber(currencyValue) * price
          ),
        };
        othersCurrency.valuesToday.push(currencyData);
      }
    }
    othersCurrency.valuesToday.unshift({
      currency: currencyBase,
      value: 1,
      aprox: 1,
      finalCost: price,
    });
    return othersCurrency;
  } catch (error) {
    console.log(error);
  }
};
