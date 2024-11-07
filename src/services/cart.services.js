const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");
const { prisma } = require("../utils/prisma");
const logger = require("../config/logger");
const crypto = require("node:crypto");

const createCart = async (userId) => {
    await prisma.shopping_Session.create({
        data: {
            User: { connect: { id: userId } },
        },
    });
};

const addToCart = async (userId, updateBody) => {
    let cartTotal = 0;
    let updatedCartItem;
    const cart = await getCart(userId);

    const foundCartItem = cart.Cart_Item.find((cartItem) => {
        return cartItem.Product.id === updateBody.productId;
    });

    // logger.debug(`foundCartItem: ${foundCartItem}`);
    return prisma.$transaction(async (tx) => {
        if (foundCartItem) {
            updatedCartItem = await tx.cart_Item.update({
                where: { id: foundCartItem.id },
                data: { ...updateBody },
                select: { id: true, quantity: true },
            });

            cart.Cart_Item.forEach((cartItem) => {
                if (cartItem.id === foundCartItem.id) {
                    cartTotal +=
                        updatedCartItem.quantity * cartItem.Product.price;
                } else {
                    cartTotal += cartItem.quantity * cartItem.Product.price;
                }
            });
        } else {
            updatedCartItem = await tx.cart_Item.create({
                data: {
                    Shopping_Session: {
                        connect: {
                            id: cart.id,
                        },
                    },
                    quantity: updateBody.quantity,
                    Product: {
                        connect: {
                            id: updateBody.productId,
                        },
                    },
                },
                select: {
                    id: true,
                    quantity: true,
                    Product: {
                        select: { price: true },
                    },
                },
            });

            cartTotal = updateBody.quantity + updatedCartItem.Product.price;
            if (cart.Cart_Item.length > 0) {
                cart.Cart_Item.forEach((cartItem) => {
                    cartTotal += cartItem.quantity * cartItem.Product.price;
                });
            }
        }
        await tx.shopping_Session.update({
            where: { userId: userId },
            data: {
                total: cartTotal,
            },
            select: {
                total: true,
            },
        });

        return { cartTotal, updatedCartItem };
    });
};

const updateCartItem = async (userId, cartItemId, updateBody) => {
    return prisma.$transaction(async (tx) => {
        let cartTotal = 0;
        await prisma.cart_Item.update({
            where: { id: cartItemId },
            data: { ...updateBody },
            select: {
                quantity: true,
                Product: {
                    select: {
                        price: true,
                    },
                },
            },
        });

        const updatedCart = await tx.shopping_Session.findUnique({
            where: { userId: userId },
            select: {
                id: true,
                Cart_Item: {
                    orderBy: { id: "asc" },
                    select: {
                        id: true,
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
        });

        updatedCart.Cart_Item.forEach((cartItem) => {
            cartTotal += cartItem.quantity * cartItem.Product.price;
        });

        await tx.shopping_Session.update({
            where: { userId: userId },
            data: {
                total: cartTotal,
            },
            select: {
                total: true,
            },
        });

        return { cartTotal, updatedCart };
    });
};

const removeFromCart = async (userId, cartItemId) => {
    let cartTotal = 0;
    logger.debug(cartItemId);
    return prisma.$transaction(async (tx) => {
        await tx.cart_Item.delete({
            where: { id: cartItemId },
        });

        const updatedCart = await tx.shopping_Session.findUnique({
            where: { userId: userId },
            select: {
                id: true,
                Cart_Item: {
                    orderBy: { id: "asc" },
                    select: {
                        id: true,
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
        });

        if (updatedCart.hasOwnProperty("Cart_Item")) {
            updatedCart.Cart_Item.forEach((cartItem) => {
                cartTotal += cartItem.quantity * cartItem.Product.price;
            });
        }

        await tx.shopping_Session.update({
            where: { userId: userId },
            data: {
                total: cartTotal,
            },
            select: {
                total: true,
            },
        });

        return { cartTotal, updatedCart };
    });
};

const getCart = async (userId) => {
    const cart = await prisma.shopping_Session.findUnique({
        where: { userId: userId },
        select: {
            id: true,
            total: true,
            Cart_Item: {
                orderBy: { id: "asc" },
                select: {
                    id: true,
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
    });

    return cart;
};

const checkout = async (userId, body) => {
    let orderItems = [];

    const cart = await getCart(userId);

    for (cartItem of cart.Cart_Item) {
        orderItems.push({
            quantity: cartItem.quantity,
            productId: cartItem.Product.id,
        });
    }

    return prisma.$transaction(async (tx) => {
        for (cartItem of cart.Cart_Item) {
            const stock = await tx.product.findUnique({
                where: { id: cartItem.Product.id },
                select: {
                    id: true,
                    name: true,
                    Product_Inventory: {
                        select: {
                            quantity: true,
                        },
                    },
                },
            });
            if (cartItem.quantity > stock.Product_Inventory.quantity) {
                throw new ApiError(
                    httpStatus.NOT_ACCEPTABLE,
                    `Unable to proceed. Quantity cannot be more than (${stock.Product_Inventory.quantity}) for item (${stock.name})`
                );
            }
            await tx.product.update({
                where: { id: cartItem.Product.id },
                data: {
                    Product_Inventory: {
                        update: {
                            quantity: {
                                decrement: cartItem.quantity,
                            },
                        },
                    },
                },
            });
        }

        //mock successful payment
        const paymentDetails = await tx.payment_Details.create({
            data: {
                phpAmount: cart.total,
                provider: body.provider,
                status: "complete",
                providerTransactionId: crypto.randomUUID(),
            },
        });

        //if payment fails
        if (
            ["refunded", "canceled", "failed", "reversed"].includes(
                paymentDetails.status
            )
        ) {
            //if payment fails, prisma automatically rollsback transaction
            throw new ApiError(httpStatus.PAYMENT_REQUIRED, "Payment failed.");
        }

        const orderDetails = await tx.order_Details.create({
            data: {
                total: cart.total,
                paymentId: paymentDetails.id,
                userId: userId,
                Order_Item: {
                    create: orderItems,
                },
            },
        });

        await tx.payment_Details.update({
            where: {
                id: paymentDetails.id,
            },
            data: {
                orderId: orderDetails.id,
            },
        });

        await tx.shopping_Session.delete({
            where: { userId: userId },
        });

        await tx.shopping_Session.create({
            data: {
                User: { connect: { id: userId } },
            },
        });

        return orderDetails;
    });
};

const emptyCart = async (userId) => {
    const deletedCart = await prisma.shopping_Session.delete({
        where: { userId: userId },
    });
    await createCart(userId);
    return deletedCart;
};

module.exports = {
    createCart,
    addToCart,
    updateCartItem,
    getCart,
    removeFromCart,
    checkout,
};
