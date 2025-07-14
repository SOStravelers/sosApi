import Subservice from "../models/subservice.js";
import Item from "../models/item.js";
import Product from "../models/product.js";
import { createError } from "../config/error.js";
import dayjs from "dayjs"; // npm i dayjs
import utc from "dayjs/plugin/utc.js";
dayjs.extend(utc);

export const createItem = async (req, res, next) => {
  global.logger.info("--- CREATE NEW ITEM ---");
  try {
    let subservice = await Subservice.findById(req.params.id);
    if (!subservice) throw createError(404, "Subservice not found ");
    let item = new Item(req.body);
    item.subservice = req.params.id;
    const lastItem = await Item.countDocuments({ subservice: req.params.id });
    item.order = lastItem + 1;
    await item.save();
    res.status(201).json("saved");
  } catch (err) {
    next(err);
  }
};

export const createItemsAndProducts = async (req, res, next) => {
  try {
    const subserviceId = req.params.id;
    const itemsData = req.body;

    if (!mongoose.Types.ObjectId.isValid(subserviceId)) {
      return res.status(400).json({ error: "Invalid subservice ID" });
    }

    if (!Array.isArray(itemsData)) {
      return res.status(400).json({ error: "Body must be an array of items" });
    }

    const insertedItems = [];

    for (let i = 0; i < itemsData.length; i++) {
      const item = itemsData[i];

      const newItem = await Item.create({
        subservice: subserviceId,
        order: i + 1,
        type: item.type,
        isActive: item.isActive ?? true,
        archived: item.archived ?? false,
        title: item.title,
        subtitle: item.subtitle,
        shortDescription: item.shortDescription || {},
      });

      const products = (item.products || []).map((product, pIdx) => ({
        ...product,
        item: newItem._id,
        order: pIdx + 1,
      }));

      if (products.length > 0) {
        await Product.insertMany(products);
      }

      insertedItems.push(newItem);
    }

    res
      .status(200)
      .json({ message: "Items and products created", items: insertedItems });
  } catch (err) {
    next(err);
  }
};

export const updateAllItem = async (req, res, next) => {
  logger.info("--- UPDATE ALL ONE ITEM ---");
  try {
    await Item.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.status(200).json("updated");
  } catch (err) {
    next(err);
  }
};

export const getAllItemBySubservice = async (req, res, next) => {
  logger.info("--- GET ALL ITEM BY SUBSERVICE ---");
  try {
    /* ── 1. Subservicio ─────────────────────────────────── */
    const subservice = await Subservice.findById(req.params.id).lean();
    if (!subservice) throw createError(404, "Subservice not found");

    /* ── 2. Fecha base para limit-time ──────────────────── */
    let baseDate;
    if (subservice.multiple) {
      // Usa fecha enviada por el cliente: ?date=YYYY-MM-DDTHH:mm:ssZ
      baseDate = req.query.date; // ← cámbialo a req.params.date si prefieres
      if (!baseDate) throw createError(400, "date query param required");
    } else {
      baseDate = subservice.startTime; // asegúrate que sea ISO en tu modelo
    }
    const base = dayjs.utc(baseDate);

    /* ── 3. Items activos / no archivados ───────────────── */
    const items = await Item.find({
      subservice: subservice._id,
      isActive: true,
      archived: false,
    })
      .sort({ order: 1 })
      .lean();

    /* ── 4. Productos activos ───────────────────────────── */
    const itemIds = items.map((it) => it._id);
    const productsRaw = await Product.find({
      item: { $in: itemIds },
      isActive: true,
    })
      .sort({ order: 1 })
      .lean();

    /* ── 5. Filtro limit-time ───────────────────────────── */
    const products = productsRaw.filter((p) => {
      if (!p.hasLimitTime) return true;
      const limitHours = p.limitTime || 0;
      const limitDate = base.subtract(limitHours, "hour");
      return dayjs().isBefore(limitDate); // sólo pasa si aún no venció
    });

    /* ── 6. Agrupar y responder ─────────────────────────── */
    const prodByItem = {};
    products.forEach((p) => {
      const k = p.item.toString();
      if (!prodByItem[k]) prodByItem[k] = [];
      prodByItem[k].push(p);
    });

    const result = items.map((it) => ({
      ...it,
      products: prodByItem[it._id.toString()] || [],
    }));

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};
