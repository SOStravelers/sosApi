import fs from "fs";
import path from "path";
import staticDir from "../config/staticPath.js";

export const n64tobuffer = async (data) => {
  console.log("n64buffer");
  // Supongamos que 'data' es la cadena base64 que recibes de la solicitud
  // Extraer el formato MIME de la cadena base64
  const matches = data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);

  if (matches.length !== 3) {
    return null; // Formato no válido
  }

  const mimeType = matches[1];
  const base64Data = matches[2];

  // Decodificar la cadena base64 en un buffer de datos binarios
  const binaryData = Buffer.from(base64Data, "base64");

  // Guarda la imagen en el servidor, por ejemplo, con un nombre único
  const fileName = "imagen." + mimeType.split("/")[1]; // Usa la extensión del MIME
  return binaryData;
};

// Set Imagen por defecto//
const imagePath = path.join(staticDir, "img", "casa.jpeg");
const imageBuffer = fs.readFileSync(imagePath);
// Convierte la imagen en base64
const base64Image = imageBuffer.toString("base64");
// Crea un objeto simulado de solicitud (req) con la imagen base64
export const fakeReq = {
  file: {
    buffer: Buffer.from(base64Image, "base64"), // Convierte la base64 de nuevo a un buffer
    originalname: "sostravel.jpg", // Establece un nombre de archivo de prueba
  },
  // Otras propiedades de req que puedas necesitar para tu función
  body: {
    // ...
  },
};
// PATH DE ARCHIVOS TEMPLATES HTMLS
const filePathHtml = (nameTemplate) => {
  return path.join(staticDir, `../public/templatesHtml/${nameTemplate}.html`);
};
export const templateHtml = (nameTemplate) => {
  return fs.readFileSync(filePathHtml(nameTemplate), "utf8");
};
