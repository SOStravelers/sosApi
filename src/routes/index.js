import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";

const routes = express.Router();

// Helpers para __dirname (en ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ruta base donde están los módulos
const baseDir = path.join(__dirname, "../apiServices");

// Lista de carpetas a excluir
const excludeFolders = [""]; // ← agrega aquí las que quieras excluir

const folders = fs.readdirSync(baseDir);

for (const folder of folders) {
  // Saltar carpetas excluidas
  if (excludeFolders.includes(folder)) {
    console.log(`⚠️  Ruta excluida: /${folder}`);
    continue;
  }

  const routePath = path.join(baseDir, folder, "routes.js");

  if (fs.existsSync(routePath)) {
    try {
      const routeModule = await import(routePath);
      const route = routeModule.default;

      if (route) {
        routes.use(`/${folder}`, route);
        console.log(`✅ Ruta registrada: /${folder}`);
      }
    } catch (err) {
      console.error(`❌ Error en /${folder}:`, err.message);
    }
  }
}

export default routes;
