const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");
const { prisma, xprisma } = require("../utils/prisma");
const logger = require("../config/logger");

const createProduct = async (productBody) => {
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
    return await prisma.product.findUnique({
        where: {
            id: productId,
        },
        include: { Product_Inventory: true, Product_Category: true },
    });
};

const getProducts = async (searchString, skip, take) => {
    return prisma.product.findMany({
        skip: parseInt(skip),
        take: parseInt(take),
        where: {
            OR: [{ name: { contains: searchString, mode: "insensitive" } }],
            Product_Inventory: { quantity: { gt: 0 } },
        },
        orderBy: {
            name: "asc",
        },
        include: {
            Product_Inventory: {
                select: {
                    quantity: true,
                },
            },
        },
    });
};

const getAllProducts = async (searchString, skip, take) => {
    return prisma.product.findMany({
        skip: parseInt(skip),
        take: parseInt(take),
        where: {
            OR: [{ name: { contains: searchString, mode: "insensitive" } }],
        },
        orderBy: {
            name: "asc",
        },
        include: {
            Product_Inventory: {
                select: {
                    quantity: true,
                },
            },
        },
    });
};

const consumeStock = async (productId, quantity) => {
    const stock = await prisma.product.findUnique({
        where: { id: productId },
        select: {
            id: true,
            name: true,
            Product_Inventory: {
                select: {
                    id: true,
                    quantity: true,
                },
            },
        },
    });
    if (quantity > stock.Product_Inventory.quantity) {
        return new ApiError(
            httpStatus.NOT_ACCEPTABLE,
            `Unable to proceed. Item (${stock.name}) has only (${stock.Product_Inventory.quantity}) remaining in stock.`
        );
    }
    return await prisma.product.update({
        where: { id: productId },
        data: {
            Product_Inventory: {
                update: {
                    quantity: {
                        decrement: quantity,
                    },
                },
            },
        },
        select: {
            id: true,
            Product_Inventory: {
                select: {
                    id: true,
                    quantity: true,
                },
            },
        },
    });
};

const replenishStock = async (productId, quantity) => {
    return await prisma.product.update({
        where: { id: productId },
        data: {
            Product_Inventory: {
                update: {
                    quantity: {
                        increment: quantity,
                    },
                },
            },
        },
        select: {
            id: true,
            Product_Inventory: {
                select: {
                    id: true,
                    quantity: true,
                },
            },
        },
    });
};

module.exports = {
    createProduct,
    updateProduct,
    getProductById,
    getProducts,
    getAllProducts,
    consumeStock,
    replenishStock,
};
