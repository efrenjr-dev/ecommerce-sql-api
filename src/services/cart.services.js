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
                    cartTotal += updateBody.quantity * cartItem.Product.price;
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
                    Product: { select: { price: true } },
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
        const updatedCartItem = await prisma.cart_Item.update({
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
        });

        let cartTotal = 0;
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

        return { cartTotal, updatedCartItem };
    });
};

const removeFromCart = async (userId, cartItemId) => {
    let total = 0;

    return prisma.$transaction(async (tx) => {
        const deleteCartItemOperation = tx.cart_Item.delete({
            where: { id: cartItemId },
        });

        const getUpdatedCart = await tx.shopping_Session.findUnique({
            where: { userId: userId },
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
        });

        getUpdatedCart.Cart_Item.forEach((cartItem) => {
            total += cartItem.quantity * cartItem.Product.price;
        });

        await tx.shopping_Session.update({
            where: { userId: userId },
            data: {
                total: total,
            },
            select: {
                total: true,
            },
        });

        return deleteCartItemOperation;
    });
};

const getCart = async (userId) => {
    const cart = await prisma.shopping_Session.findUnique({
        where: { userId: userId },
        select: {
            id: true,
            total: true,
            Cart_Item: {
                select: {
                    id: true,
                    quantity: true,
                    Product: {
                        select: {
                            id: true,
                            name: true,
                            price: true,
                            description: true,
                            inventoryId: true,
                        },
                    },
                },
            },
        },
    });

    return cart;
};

const checkout = async (userId, body) => {
    const cart = await getCart(userId);
    return prisma.$transaction(async (tx) => {
        for (cartItem of cart.Cart_Item) {
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
            for (cartItem of cart.Cart_Item) {
                await tx.productService.replenishStock(
                    cartItem.Product.id,
                    cartItem.quantity
                );
            }
            throw new ApiError(httpStatus.PAYMENT_REQUIRED, "Payment failed.");
        }

        let orderItems = [];
        for (cartItem of cart.Cart_Item) {
            orderItems.push({
                quantity: cartItem.quantity,
                productId: cartItem.Product.id,
            });
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
