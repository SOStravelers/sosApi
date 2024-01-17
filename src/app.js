import logger from "./config/logger.js";
global.logger = logger;

import server from "./server.js";
console.log("prueba");
const port = process.env.PORT || 9000;
server.listen(port, function () {
  logger.http(
    "SOS API TRAVELERS is listening on port " + port + " AGUANTE LA U !"
  );
});
