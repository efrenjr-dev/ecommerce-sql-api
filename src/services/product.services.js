const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");
const { prisma, xprisma } = require("../utils/prisma");
const logger = require("../config/logger");
const { createUser } = require("./user.services");

const createProduct = async (productBody) => {
    logger.debug(productBody.name);
    const newProduct = await prisma.product.create({
        data: {
            name: productBody.name,
            price: productBody.price,
            description: productBody.description,
            Product_Inventory: {
                create: { quantity: productBody.quantity },
            },
        },
    });

    return newProduct;
};

const updateProduct = async (productId, updateBody) => {
    logger.debug(updateBody.name);
    const updatedProduct = await prisma.product.update({
        where: { id: productId },
        data: {
            ...updateBody,
            updatedAt: new Date(),
        },
    });
    return updatedProduct;
};

const getProductById = async (productId) => {
    return await prisma.product.findUnique({ where: { id: productId } });
};

const getProducts = async (searchString, skip, take) => {
    return prisma.product.findMany({
        skip: parseInt(skip),
        take: parseInt(take),
        where: {
            OR: [{ name: { contains: searchString, mode: "insensitive" } }],
        },
        orderBy: {
            name: "asc",
        },
    });
};

module.exports = { createProduct, updateProduct, getProductById, getProducts };
