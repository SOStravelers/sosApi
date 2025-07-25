import Booking from "../../apiServices/bookings/model.js";

function generarCodigoAleatorio(longitud = 11) {
  const caracteres = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let codigo = "";
  for (let i = 0; i < longitud; i++) {
    codigo += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
  }
  return codigo;
}

export async function generarCodigoUnicoOrdenCompra() {
  let codigo;
  let existe = true;
  let intentos = 0;

  while (existe) {
    if (intentos > 20) {
      throw new Error(
        "No se pudo generar un código único después de varios intentos."
      );
    }

    codigo = generarCodigoAleatorio();
    const existente = await Booking.findOne({ orderPurchase: codigo }).lean();
    if (!existente) {
      existe = false;
    } else {
      intentos++;
    }
  }

  return codigo;
}
