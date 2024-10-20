const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");
const { prisma, xprisma } = require("../utils/prisma");
const logger = require("../config/logger");

const createCart = async (userId) => {
    const cart = await prisma.user.update({
        where: { id: userId },
        data: {
            Shopping_Session: { create: {} },
        },
    });
};

const addToCart = async (userId, updateBody) => {
    const user = await prisma.user.update({
        where: { id: userId },
        data: {
            Shopping_Session: {
                update: {
                    Cart_Item: {
                        upsert: {
                            where: { productId: updateBody.productId },
                            create: {
                                productId: updateBody.productId,
                                quantity: updateBody.quantity,
                            },
                            update: { quantity: updateBody.quantity },
                        },
                    },
                },
            },
        },
        select: {
            Shopping_Session: {
                select: {
                    Cart_Item: {
                        select: {
                            quantity: true,
                            Product: {
                                select: {
                                    price: true,
                                },
                            },
                        },
                    },
                },
            },
        },
    });
    return await updateCartTotal(userId, user.Shopping_Session.Cart_Item);
};

const updateCartTotal = async (userId, cart) => {
    let total = 0;
    cart.forEach((cartItem) => {
        total += cartItem.quantity * cartItem.Product.price;
    });

    const user = await prisma.user.update({
        where: { id: userId },
        data: {
            Shopping_Session: {
                update: {
                    total: total,
                },
            },
        },
        select: {
            Shopping_Session: {
                select: {
                    total: true,
                    Cart_Item: {
                        select: {
                            quantity: true,
                            Product: {
                                select: {
                                    id: true,
                                    price: true,
                                },
                            },
                        },
                    },
                },
            },
        },
    });
    return user.Shopping_Session;
};

const getCartItems = async (userId) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            Shopping_Session: {
                select: {
                    total: true,
                    Cart_Item: {
                        select: {
                            quantity: true,
                            Product: {
                                select: {
                                    id: true,
                                    name: true,
                                    price: true,
                                    description: true,
                                },
                            },
                        },
                    },
                },
            },
        },
    });
    return user.Shopping_Session;
};

module.exports = { createCart, addToCart, getCartItems, updateCartTotal };
