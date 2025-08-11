import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
export default async function loadModels(options = {}) {
  const { basePath = "apiServices", excludeFolders = [] } = options;

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const baseDir = path.join(__dirname, "..", basePath);
  let hasModelError = false;
  let modelCount = 0;

  const folders = fs.readdirSync(baseDir);
  for (const folder of folders) {
    if (excludeFolders.includes(folder)) continue;

    const modelPath = path.join(baseDir, folder, "model.js");
    if (fs.existsSync(modelPath)) {
      try {
        await import(modelPath);
        modelCount++;
      } catch (err) {
        hasModelError = true;
        console.error(
          `❌ Error al cargar modelo en /${folder}: ${err.message}`
        );
      }
    }
  }

  if (hasModelError) {
    console.error("🚫 El servidor NO se iniciará por errores en modelos.");
    process.exit(1);
  }

  console.log(
    `✅ Todos los modelos (${modelCount}) fueron cargados correctamente.`
  );
}
