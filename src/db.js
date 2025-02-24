import mongoose from "mongoose";
import envar from "./config/envar.js";
import { MongoStore } from "wwebjs-mongo";
import pkg from "whatsapp-web.js";
const { Client, RemoteAuth } = pkg;
import { AwsUploadFile } from "./services/aws_s3";
import qrcode from "qrcode";
import fs from "fs";

// 🔹 Definir credenciales desde variables de entorno
const config = envar();
const dbConfig = {
  local: "mongodb://localhost:27017/sosLocal",
  dev: `mongodb+srv://${config.DB_USER}:${config.DB_PASS}@${config.DB_DEV}`,
  test: `mongodb+srv://${config.DB_USER}:${config.DB_PASS}@${config.DB_TEST}`,
  production: `mongodb+srv://${config.DB_USER}:${config.DB_PASS}@${config.DB_PROD}`,
};

const env = process.env.NODE_ENV || "dev";
console.log(`📡 Conectando a la base de datos: ${env}`);

// 🔹 Conectar a MongoDB
mongoose.set("strictQuery", false);
mongoose
  .connect(dbConfig[env], { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("✅ Conectado a MongoDB");

    // 🔹 Solo después de conectar a MongoDB, inicializar WhatsApp
    const store = new MongoStore({ mongoose });

    const client = new Client({
      authStrategy: new RemoteAuth({
        store,
        clientId: "whatsapp-bot",
        backupSyncIntervalMs: 60000, // Configura el intervalo a 1 minuto (60000 ms)
      }),
      puppeteer: {
        args: ["--no-sandbox", "--disable-setuid-sandbox"], // Añadir estos argumentos
      },
    });

    let qrGenerated = false; // Variable de control para verificar si ya se generó el QR

    client.on("qr", async (qr) => {
      if (qrGenerated) {
        console.log("QR ya ha sido generado y subido previamente.");
        return; // Si el QR ya se generó, no hacer nada
      }

      console.log("🔗 Escanea este QR en WhatsApp Web:");

      try {
        // Generar el QR como buffer de imagen (PNG)
        const buffer = await qrcode.toBuffer(qr); // Usamos toBuffer para obtener la imagen binaria

        // Crear el archivo para S3
        const file = {
          fileName: `whatsappQr/${Date.now()}_qrcode.png`, // Nombre único con timestamp
          buffer: buffer, // Buffer del QR generado
        };

        // Subir el archivo QR a S3
        const uploadResult = await AwsUploadFile(file); // Usar tu función de carga a S3
        console.log("Archivo QR cargado en S3:", uploadResult.url); // Imprimir URL de acceso

        qrGenerated = true; // Marcar que el QR ya fue generado
      } catch (err) {
        console.error("Error generando el QR o subiendo a S3:", err);
      }
    });

    client.on("ready", () => {
      console.log("✅ Bot conectado a WhatsApp sin necesidad de escanear QR.");
    });

    client.on("message", async (message) => {
      if (message.body.toLowerCase() === "hola hola sos") {
        await message.reply("Hola soy el chatbot, estoy para ayudarte 🤖");
      }
    });

    client.initialize();
  })
  .catch((err) => console.error("❌ Error al conectar a MongoDB:", err));

export default mongoose.connection;
