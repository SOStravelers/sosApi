import Partner from "./model.js";
//funcion para guardar id unica de un navegador
export const setIdClient = async (data) => {
  logger.info("*** SET ID CLIENT PARTNER DAO ***");
  try {
    console.log("body", data);
    let { clientId, partner } = data;

    // Validaciones
    if (!clientId || typeof clientId !== "string" || clientId.trim() === "") {
      return res
        .status(400)
        .json({ error: "clientId is required and must be a non-empty string" });
    }

    if (!partner) partner = "external";

    const client = await Partner.findOne({ clientId }).exec();
    console.log("hay cliente", client);

    if (client) {
      await Partner.findOneAndUpdate(
        { clientId },
        {
          $set: {
            lastConection: new Date(),
            lastPartner: partner,
          },
        }
      ).exec();
    } else {
      try {
        await Partner.create({
          clientId,
          firstPartner: partner,
          lastPartner: partner,
        });
      } catch (err) {
        // Si el error es por clave duplicada, no se cae
        if (err.code === 11000) {
          global.logger.warn(
            "Cliente ya existe (duplicate key), actualizando..."
          );
          await Partner.findOneAndUpdate(
            { clientId },
            {
              $set: {
                lastConection: new Date(),
                lastPartner: partner,
              },
            }
          ).exec();
        } else {
          throw err;
        }
      }
    }

    return "saved";
  } catch (err) {
    console.error("Error en setIdClient:", err);
    throw err;
  }
};

export const getClientStats = async (data) => {
  global.logger.info("*** GET CLIENT STATS ***");
  try {
    console.log("query", data);
    let { range, partner } = data;
    // Si no viene range, usamos 'day' por defecto
    if (!range) range = "day";

    if (!["day", "week", "month"].includes(range)) {
      return res
        .status(400)
        .json({ error: "Invalid range. Use day, week, or month." });
    }

    // Calcular la fecha de inicio según el rango
    const now = new Date();
    let fromDate;

    switch (range) {
      case "day":
        fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Hoy a las 00:00
        break;
      case "week":
        fromDate = new Date(now);
        fromDate.setDate(now.getDate() - 7);
        break;
      case "month":
        fromDate = new Date(now);
        fromDate.setMonth(now.getMonth() - 1);
        break;
    }

    // Construimos el filtro de búsqueda
    const filter = {
      updatedAt: { $gte: fromDate },
    };

    if (partner) {
      filter.lastPartner = partner;
    }
    console.log("filter", filter);
    const count = await Partner.countDocuments(filter);

    return { count };
  } catch (err) {
    throw err;
  }
};
