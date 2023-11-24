import server from "./server.js";
import logger from "./config/logger.js";

const port = process.env.PORT || 9000;
server.listen(port, function () {
  logger.info(
    "SOS API TRAVELERS is listening on port " + port + " AGUANTE LA U !"
  );
});
