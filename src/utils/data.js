export const procesarNombre = (nombre) => {
  const partes = nombre.split(" "); // Dividir el string en partes utilizando el espacio como separador

  if (partes.length > 2) {
    // Si hay más de dos partes, unir las partes después de la primera
    const restoDelNombre = partes.slice(1).join(" ");
    return [partes[0], restoDelNombre];
  } else {
    // Si no hay más de dos partes, devolver el nombre original
    return [nombre];
  }
};
