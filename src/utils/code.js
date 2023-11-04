export const generarNumero4Digitos = () => {
  const numero = Math.floor(1000 + Math.random() * 9000);
  return numero;
};

export const generarCodigoAleatorio = (longitud) => {
  const caracteres =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let codigoAleatorio = "";

  for (let i = 0; i < longitud; i++) {
    const caracterAleatorio = caracteres.charAt(
      Math.floor(Math.random() * caracteres.length)
    );
    codigoAleatorio += caracterAleatorio;
  }

  return codigoAleatorio;
};
