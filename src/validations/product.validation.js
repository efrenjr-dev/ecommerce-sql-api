const Joi = require("joi");

const createProduct = Joi.object({
    name: Joi.string().required(),
    price: Joi.number().greater(0).required(),
    description: Joi.string(),
    quantity: Joi.number(),
});

const updateProduct = Joi.object({
    name: Joi.string(),
    price: Joi.number().greater(0),
    description: Joi.string(),
    isActive: Joi.boolean(),
});

const updateStock = Joi.object({
    productId: Joi.string()
        .guid({ version: ["uuidv4"] })
        .required()
        .label("Supabase UUID"),
    quantity: Joi.number().integer().greater(0).required(),
});

module.exports = { updateStock, createProduct, updateProduct };
