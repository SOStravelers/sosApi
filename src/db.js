import mongoose from "mongoose";
import envar from "./config/envar.js";
import { MongoStore } from "wwebjs-mongo";
import pkg from "whatsapp-web.js";
const { Client, RemoteAuth } = pkg;
import qrcode from "qrcode-terminal";

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
  .then(() => console.log("✅ Conectado a MongoDB"))
  .catch((err) => console.error("❌ Error al conectar a MongoDB:", err));

const store = new MongoStore({ mongoose: mongoose });

// 🔹 Configurar el cliente de WhatsApp con autenticación persistente
const client = new Client({
  authStrategy: new RemoteAuth({
    store,
    clientId: "whatsapp-bot",
    backupSyncIntervalMs: 60000, // 🔹 Mínimo 1 minuto
  }),
});

// 🔹 Generar QR si es necesario
client.on("qr", (qr) => {
  console.log("🔗 Escanea este QR en WhatsApp Web:");
  qrcode.generate(qr, { small: true });
});

// 🔹 Confirmar que el bot está listo
client.on("ready", () => {
  console.log("✅ Bot conectado a WhatsApp sin necesidad de escanear QR.");
});

// 🔹 Manejo de mensajes
client.on("message", async (message) => {
  if (message.body.toLowerCase() === "hola hola sos") {
    await message.reply("Hola soy el chatbot, estoy para ayudarte 🤖");
  }
});

// 🔹 Inicializar el bot
client.initialize();

export default mongoose.connection;
