import mongoose, { trusted } from "mongoose";
import envar from "./config/envar.js";
import { MongoStore } from "wwebjs-mongo";
import pkg from "whatsapp-web.js";
const { Client, RemoteAuth, LocalAuth } = pkg;
import { AwsUploadFile } from "./services/aws_s3.js";
import qrcode from "qrcode";

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
    console.log("casa1");

    const client = new Client({
      authStrategy: new LocalAuth({
        store,
        clientId: "whatsapp-bot",
        backupSyncIntervalMs: 60000, // Configura el intervalo a 1 minuto (60000 ms)
      }),
      puppeteer: {
        args: ["--no-sandbox", "--disable-setuid-sandbox"], // Añadir estos argumentos
      },
      // puppeteer: {
      //   browserWSEndpoint: "wss://chrome.browserless.io?token=TU_TOKEN", // Usa tu token de Browserless
      // },
    });
    console.log("🟢 Cliente creado, inicializando...");

    // client.initialize().catch((err) => {
    //   console.error("❌ Error al inicializar el cliente:", err);
    // });
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
      // Convertir el mensaje a minúsculas y eliminar espacios innecesarios
      const text = message.body.trim();

      // Verificar si el mensaje empieza con "Generate Service:"
      if (!text.startsWith("Generate Service:")) {
        await message.reply(
          "Thank you for reaching out! Our team will assist you shortly. ⏳"
        );
        return;
      }

      // Eliminar "Generate Service:" del texto
      const content = text.replace("Generate Service:", "").trim();

      // Expresión regular para extraer los valores obligatorios
      const regex =
        /date\s*=\s*(\S+)\s*subServiceId\s*=\s*(\S+)\s*time\s*=\s*(\S+)\s*nameSubservice\s*=\s*([\w\s]+)\s*price\s*=\s*(\S+)/;
      const match = content.match(regex);

      if (match) {
        // Extraer valores obligatorios
        const date = match[1];
        const subServiceId = match[2];
        const time = match[3];
        const nameSubservice = match[4];
        const price = match[5];

        console.log("Precio extraído:", price);

        // Simular un workerId (podrías obtenerlo dinámicamente si es necesario)
        const workerId = "65312a63c0b1e1658a5a712c";

        // Formatear el isoTime
        const isoTime = `${date}T${time}:00.000Z`;

        // Reemplazar espacios en nameSubservice por %20 para la URL
        const encodedSubservice = encodeURIComponent(nameSubservice);

        // Construcción base de la URL
        let url = `https://sostvl.com/summary-custom?date=${date}&workerId=${workerId}&subServiceId=${subServiceId}&isoTime=${isoTime}&stringData=${time}&nameSubservice=${encodedSubservice}&price=${price}`;

        // Buscar parámetros opcionales y agregarlos a la URL
        const optionalParams = content.match(/\b(\w+)\s*=\s*([\w\s]+)/g);
        if (optionalParams) {
          optionalParams.forEach((param) => {
            const [key, value] = param.split("=").map((x) => x.trim());
            if (
              ![
                "date",
                "subServiceId",
                "time",
                "nameSubservice",
                "price",
              ].includes(key)
            ) {
              url += `&${key}=${encodeURIComponent(value)}`;
            }
          });
        }

        // Responder con la URL generada
        await message.reply(url);
      }
    });
    client.initialize();
  })
  .catch((err) => console.error("❌ Error al conectar a MongoDB:", err));

export default mongoose.connection;
