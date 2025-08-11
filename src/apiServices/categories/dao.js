import Category from "./model.js";
import Subservice from "../subservices/model.js";
import Product from "../products/model.js";
import mongoose from "mongoose";
import { createError } from "../../config/error.js";
import dayjs from "dayjs"; // npm i dayjs
import utc from "dayjs/plugin/utc.js";
dayjs.extend(utc);

export const createItem = async (subserviceId) => {
  logger.info("*** CREATE NEW ITEM DAO***");
  try {
    let subservice = await Subservice.findById(subserviceId);
    if (!subservice) throw createError(404, "Subservice not found ");
    let item = new Item(req.body);
    item.subservice = subserviceId;
    const lastItem = await Item.countDocuments({ subservice: subserviceId });
    item.order = lastItem + 1;
    await item.save();
    return item;
  } catch (err) {
    throw err;
  }
};

export const createItemsAndProducts = async (itemsData, subserviceId) => {
  logger.info("*** CREATE NEW ITEM WITH PRODUCTS ITEM DAO ***");
  try {
    if (!mongoose.Types.ObjectId.isValid(subserviceId)) {
      throw createError(400, "Invalid subservice ID");
    }

    if (!Array.isArray(itemsData)) {
      throw createError(400, "Body must be an array of items");
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
    return { message: "Items and products created", items: insertedItems };
  } catch (err) {
    throw err;
  }
};

export const getAllCategoriesWithProducts = async () => {
  try {
    const categories = await Category.find({ isActive: true }).lean();

    const categoryIds = categories.map((cat) => cat._id);

    const products = await Product.find({
      categories: { $in: categoryIds },
      isActive: true,
    }).lean();

    const result = categories.map((cat) => {
      const catId = cat._id.toString();
      const productsForCategory = products.filter((prod) =>
        prod.categories.map((c) => c.toString()).includes(catId)
      );

      return {
        category: cat,
        products: productsForCategory,
      };
    });

    return result;
  } catch (error) {
    throw error;
  }
};

export const updateAllItem = async (id) => {
  logger.info("*** UPDATE ALL ONE ITEM DAO ***");
  try {
    await Item.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    return "updated";
  } catch (err) {
    throw err;
  }
};
