const Joi = require("joi");

const BIGINT_MIN = BigInt("-9223372036854775808");
const BIGINT_MAX = BigInt("9223372036854775807");

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
    existingImages: Joi.array()
        .items(
            Joi.object({
                id: Joi.any()
                    .custom((value, helpers) => {
                        if (typeof value !== "bigint") {
                            return helpers.error("any.invalid", {
                                message: "Value must be a BigInt",
                            });
                        }
                        if (value < BIGINT_MIN || value > BIGINT_MAX) {
                            return helpers.error("any.invalid", {
                                message: "Value is out of 64-bit range",
                            });
                        }
                        return value;
                    }, "64-bit BigInt validation")
                    .required(),
                url: Joi.string().uri().required(),
                created_at: Joi.date().optional(),
                productId: Joi.string().uuid().optional(),
            })
        )
        .optional(),
});

const updateStock = Joi.object({
    productId: Joi.string()
        .guid({ version: ["uuidv4"] })
        .required()
        .label("Supabase UUID"),
    quantity: Joi.number().integer().greater(0).required(),
});

module.exports = { updateStock, createProduct, updateProduct };
