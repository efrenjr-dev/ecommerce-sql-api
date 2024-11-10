const Joi = require("joi");
const BIGINT_MIN = BigInt("-9223372036854775808");
const BIGINT_MAX = BigInt("9223372036854775807");

const addToCart = Joi.object({
    productId: Joi.string()
        .guid({ version: ["uuidv4"] })
        .required()
        .label("Supabase UUID"),
    quantity: Joi.number().integer().greater(0).required(),
});

const updateCartItem = Joi.object({
    quantity: Joi.number().integer().greater(0).required(),
});
const paramsCartItem = Joi.object({
    cartItemId: Joi.string()
        .custom((value, helpers) => {
            try {
                const bigintValue = BigInt(value); // Convert to BigInt
                if (bigintValue < BIGINT_MIN || bigintValue > BIGINT_MAX) {
                    return helpers.error("any.invalid", {
                        message: "Value is out of 64-bit range",
                    });
                }
                return value; // Valid BigInt
            } catch (e) {
                return helpers.error("any.invalid", {
                    message: "Value is not a valid BigInt",
                });
            }
        }, "64-bit BigInt validation")
        .label("Supabase BIGINT"),
});

module.exports = { addToCart, updateCartItem, paramsCartItem };
