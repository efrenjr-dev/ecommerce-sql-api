const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");
const { prisma } = require("../utils/prisma");
const { uploadToS3, deleteImagesFromS3 } = require("../utils/S3ObjectCommands");
const logger = require("../config/logger");

const createProduct = async (productData, files) => {
    const { name, description, price, quantity } = productData;
    if (!files || files.length === 0) {
        throw new Error("At least one image is required.");
    }
    logger.debug("Ready to upload images");
    const imageUrls = await Promise.all(files.map((file) => uploadToS3(file)));

    logger.debug("Images uploaded to URLs:", imageUrls);
    const newProduct = await prisma.product.create({
        data: {
            name: name,
            price: parseFloat(price),
            description: description,
            Product_Inventory: {
                create: { quantity: parseInt(quantity) },
            },
            Image: {
                create: imageUrls.map((url) => ({
                    url: url,
                })),
            },
        },
        include: {
            Image: true,
        },
    });

    return newProduct;
};

const updateProduct = async (productId, updateData) => {
    const { name, description, price, isActive, existingImages, newImages } =
        updateData;

    const product = await prisma.product.findUnique({
        where: { id: productId },
        include: { Image: true },
    });

    const existingImageIds = existingImages
        ? existingImages.map((image) => image.id)
        : [];

    const imageIdsToDelete = product.Image.filter(
        (image) => !existingImageIds.includes(image.id)
    ).map((image) => image.id);

    if (imageIdsToDelete.length > 0) {
        const imagesToDelete = product.Image.filter((image) =>
            imageIdsToDelete.includes(image.id)
        );
        const imageUrlsToDelete = imagesToDelete.map((image) => image.url);

        await deleteImagesFromS3(imageUrlsToDelete);

        await prisma.image.deleteMany({
            where: { id: { in: imageIdsToDelete } },
        });
    }

    if (newImages && newImages.length > 0) {
        const uploadedImages = await Promise.all(
            newImages.map(async (file) => {
                const uploadedImageUrl = await uploadToS3(file);
                return { url: uploadedImageUrl }; // New image will have no ID (id is null in database)
            })
        );

        await prisma.image.createMany({
            data: uploadedImages.map((image) => ({
                url: image.url,
                productId: productId,
            })),
        });
    }

    const updatedProduct = await prisma.product.update({
        where: { id: productId },
        data: {
            name,
            description,
            price,
            isActive,
            updatedAt: new Date(),
        },
        include: {
            Image: true,
        },
    });

    return updatedProduct;
};

const getProductById = async (productId) => {
    return await prisma.product.findUnique({
        where: {
            id: productId,
        },
        include: {
            Product_Inventory: true,
            Product_Category: true,
            Image: true,
        },
    });
};

const getProducts = async (searchString, skip, take) => {
    const products = await prisma.product.findMany({
        skip: parseInt(skip),
        take: parseInt(take),
        where: {
            OR: [{ name: { contains: searchString, mode: "insensitive" } }],
            Product_Inventory: { quantity: { gt: 0 } },
            isActive: true,
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
            Image: {
                select: {
                    url: true,
                },
                take: 1,
                orderBy: {
                    created_at: "asc",
                },
            },
        },
    });

    const productsCount = await prisma.product.count({
        where: {
            OR: [{ name: { contains: searchString, mode: "insensitive" } }],
            Product_Inventory: { quantity: { gt: 0 } },
            isActive: true,
        },
    });
    return { products, productsCount };
};

const getAllProducts = async (searchString, skip, take) => {
    const products = await prisma.product.findMany({
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
            Image: {
                select: {
                    url: true,
                },
                take: 1,
                orderBy: {
                    created_at: "asc",
                },
            },
        },
    });

    const productsCount = await prisma.product.count({
        where: {
            OR: [{ name: { contains: searchString, mode: "insensitive" } }],
        },
    });
    return { products, productsCount };
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
