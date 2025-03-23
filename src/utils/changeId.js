export const byPassPolMauro = (body) => {
  try {
    //para cambiar si es id SOS
    if (body.workerUser == "65312a63c0b1e1658a5a712c") {
      // si es trips or matches -> pol
      if (
        body.service == "6757137ad2b2668720116ec9" ||
        body.service == "67c11c4917c3a7a2c353cb1b"
      ) {
        body.workerUser = "67c71578fb4fe0941fe494f0";
        return body;
        //si es masajes -> barbara
      } else if (body.service == "65a7d4d50fec5717b282a352") {
        body.workerUser = "65a7ddc6c14f7a217471b12d";
        return body;
      } else {
        return body;
      }
    } else {
      return body;
    }
  } catch (err) {
    throw err;
  }
};
