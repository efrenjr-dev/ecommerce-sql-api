const Joi = require("joi");

const createUser = Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string()
        .min(8)
        .max(25)
        .required()
        .regex(/\d/, "at least 1 letter")
        .regex(/[a-zA-Z]/, "at least 1 number"),
    role: Joi.string().required().valid("user", "admin"),
});

const paramsUserId = Joi.object({
    userId: Joi.string()
        .guid({ version: ["uuidv4"] })
        .required()
        .label("Supabase UUID"),
});

const updateUser = Joi.object({
    name: Joi.string(),
    email: Joi.string().email(),
    password: Joi.string()
        .min(8)
        .max(25)
        .regex(/\d/, "at least 1 letter")
        .regex(/[a-zA-Z]/, "at least 1 number"),
    role: Joi.string().valid("user", "admin"),
    isActive: Joi.boolean(),
});

module.exports = { createUser, paramsUserId, updateUser };
