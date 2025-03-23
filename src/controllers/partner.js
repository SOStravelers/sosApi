import Partner from "../models/partner.js";
//funcion para guardar id unica de un navegador
export const setIdClient = async (req, res) => {
  try {
    global.logger.info("=== SET ID CLIENT ===");
    console.log("body", req.body);

    let { clientId, partner } = req.body;

    // Validaciones
    if (!clientId) {
      return res.status(400).json({ error: "clientId is required" });
    }

    if (!partner) partner = "external";

    const client = await Partner.findOne({ clientId }).exec();

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
      await Partner.create({
        clientId,
        firstPartner: partner,
        lastPartner: partner,
      });
    }

    return res.send("saved");
  } catch (err) {
    throw err;
  }
};

export const getClientStats = async (req, res) => {
  try {
    global.logger.info("=== GET CLIENT STATS ===");

    console.log("query", req.query);
    let { range, partner } = req.query;
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

    return res.json({ count });
  } catch (err) {
    throw err;
  }
};
