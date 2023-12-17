export const procesarNombre = (nombre) => {
  const partes = nombre.split(" "); // Dividir el string en partes utilizando el espacio como separador
  if (partes.length >= 2) {
    // Si hay dos partes o más, unir las partes después de la primera
    const restoDelNombre = partes.slice(1).join(" ");
    return [partes[0], restoDelNombre];
  } else {
    // Si no hay más de una parte, devolver el nombre original
    return [nombre];
  }
};
