export const byPassPolMauro = (body) => {
  try {
    //para cambiar si es id SOS
    if (body.workerUser == "65312a63c0b1e1658a5a712c") {
      //trips or matches
      console.log("qwe1");
      if (
        body.service == "6757137ad2b2668720116ec9" ||
        body.service == "67c11c4917c3a7a2c353cb1b"
      ) {
        console.log("pol");
        //id Pohl
        body.workerUser = "67c71578fb4fe0941fe494f0";
        return body;
      } else if (body.service == "65a7d4d50fec5717b282a352") {
        //id Barbara
        console.log("barbara");
        body.workerUser = "65a7ddc6c14f7a217471b12d";
        return body;
      } else {
        console.log("mauro");
        //id Mauro
        body.workerUser = "67c721b3fb4fe0941fe4959b";
        //cambio
        return body;
      }
    } else {
      return body;
    }
  } catch (err) {
    throw err;
  }
};
