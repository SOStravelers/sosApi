import pkg from "whatsapp-web.js";
const { Client, RemoteAuth, LocalAuth, MessageMedia } = pkg;
import { MongoStore } from "wwebjs-mongo";
import qrcode from "qrcode";
import { AwsUploadFile } from "./aws_s3.js";
import Subservice from "../models/subservice.js";
import Wmessage from "../models/wmessages.js";
import { sendTextSubservices } from "../controllers/subservice.js";

export const initializeWhatsApp = (mongoose) => {
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
    console.log("mensaje", message);

    if (text.startsWith("Generate Service")) {
      console.log("vamos");
      // Eliminar "Generate Service:" del texto
      const content = text.replace("Generate Service:", "").trim();

      // Expresión regular para extraer los valores obligatorios
      const regex =
        /date\s*=\s*(\S+)[\s\S]*?subServiceId\s*=\s*(\S+)[\s\S]*?time\s*=\s*(\S+)[\s\S]*?price\s*=\s*(\S+)/;
      const match = content.match(regex);
      console.log(match);
      if (match) {
        // Extraer valores obligatorios
        const date = match[1];
        const subServiceId = match[2];
        const time = match[3];
        const price = match[4];

        console.log("Precio extraído:", price);

        // Simular un workerId (podrías obtenerlo dinámicamente si es necesario)
        const workerId = "65312a63c0b1e1658a5a712c";
        //
        // Formatear el isoTime
        const isoTime = `${date}T${time}:00.000Z`;

        const subService = await Subservice.findOne({
          _id: subServiceId,
        })
          .populate("service")
          .exec();

        if (!subService) {
          await message.reply(
            "La id de subService no existe.Revisa y corrige ese campo"
          );
          return;
        }

        // Reemplazar espacios en nameSubservice por %20 para la URL
        const encodedSubservice = encodeURIComponent(subService.name["en"]);
        const encodedService = encodeURIComponent(
          subService.service.name["en"]
        );

        // Construcción base de la URL
        let url = `https://sostvl.com/summary-custom?date=${date}&workerId=${workerId}&subServiceId=${subServiceId}&service=${subService.service._id}&isoTime=${isoTime}&stringData=${time}&nameSubservice=${encodedSubservice}&nameService=${encodedService}&price=${price}`;

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
    } else if (text.startsWith("Mis servicios")) {
      const content = text.replace("Mis servicios:", "").trim();
      const email = content.toLowerCase();
      const messageFinal = await sendTextSubservices({ email, isActive: true });
      await message.reply(messageFinal);
    }

    // Verificar si el mensaje empieza con "Generate Service:"
    else {
      console.log("no es servicio");
      const senderPhone = message.from.split("@")[0]; // Número del usuario

      const messageUser = await Wmessage.findOne({
        number: senderPhone,
      }).exec();

      function respondidoLast24(isoString) {
        const fechaGuardada = new Date(isoString);
        const ahora = new Date();
        console.log("ahora", ahora);

        // 1 día en milisegundos
        const quinceDias = 1 * 24 * 60 * 60 * 1000;

        // Calculamos el límite inferior (hace 15 días)
        const limiteInferior = new Date(ahora - quinceDias);

        return fechaGuardada >= limiteInferior && fechaGuardada <= ahora;
      }

      if (messageUser) {
        console.log("hay mensaje");
        const menosde1dia = respondidoLast24(messageUser.updatedAt);
        if (menosde1dia) {
          return;
        } else {
          const replyMessage = `
            ¡Hola de nuevo! 👋
            Hi again! 👋
            Olá novamente! 👋
            Rebonjour! 👋
            
            Escribe tu consulta y te responderemos a la brevedad. ⏳
            Write your inquiry and we'll reply shortly. ⏳
            Escreva sua consulta e responderemos em breve. ⏳
            Écrivez votre demande et nous répondrons rapidement. ⏳
            `;
          // await message.reply(replyMessage);
        }
      } else {
        console.log("no hay mensaje");
        const body = {
          body: message.body,
          number: senderPhone,
        };
        let newMessage = new Wmessage(body);
        await newMessage.save();
        const messageText = `Thank you for contacting SOS Travel.
        Gracias por contactar a SOS Travel.
        Obrigado por entrar em contato com o SOS Travel.

        Please tell us which language you prefer to speak:
        Por favor, dinos en qué idioma prefieres hablar:
        Por favor, diga-nos em que idioma prefere falar:

        🇪🇸 Español | 🇵🇹 Português | 🇫🇷 Français | 🌍 Inglés

        Then, please write your inquiry. We will reply soon! 😊
        Luego, escríbenos tu consulta. ¡Te responderemos pronto! 😊
        Depois, escreva sua consulta. Responderemos em breve! 😊`;

        await message.reply(messageText);
      }
      return;
    }
  });

  client.on("button", async (button) => {
    const userLang = button.buttonId; // Recibir el idioma seleccionado
    await button.reply(
      `¡Gracias! A partir de ahora te responderé en ${userLang.toUpperCase()} ✅.`
    );
  });

  client.initialize().catch((err) => {
    console.error("❌ Error al inicializar el cliente:", err);
  });

  return client; // Opcional: Devuelve el cliente si necesitas interactuar con él desde otro archivo.
};
