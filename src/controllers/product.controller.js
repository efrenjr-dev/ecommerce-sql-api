const httpStatus = require("http-status");
const logger = require("../config/logger");
const catchAsync = require("../utils/catchAsync");
const { productService } = require("../services");

const createProduct = catchAsync(async (req, res) => {
    logger.debug("CREATE PRODUCT CONTROLLER");
    const product = await productService.createProduct(req.body);
    res.status(httpStatus.CREATED).send(product);
});

const updateProduct = catchAsync(async (req, res) => {
    logger.debug("UPDATE PRODUCT CONTROLLER");
    const updatedProduct = await productService.updateProduct(
        req.params.productId,
        req.body
    );
    res.status(httpStatus.ACCEPTED).send(updatedProduct);
});

const getProduct = catchAsync(async (req, res) => {
    logger.debug("GET PRODUCT CONTROLLER");
    const product = await productService.getProductById(req.params.productId);
    res.status(httpStatus.OK).send(product);
});

const getProducts = catchAsync(async (req, res) => {
    logger.debug("GET PRODUCTS");
    const { searchString, skip, take } = req.query;
    const { products, productsCount } = await productService.getProducts(
        searchString,
        skip,
        take
    );
    if (!products) {
        throw new ApiError(httpStatus.NOT_FOUND, "No product found");
    }
    const hasMore = parseInt(skip) + parseInt(take) < productsCount;
    console.log("hasMore:", hasMore, "=", skip, "+", take, "<", productsCount);
    res.status(httpStatus.OK).send({ products, productsCount, hasMore });
});

const getAllProducts = catchAsync(async (req, res) => {
    logger.debug("GET ALL PRODUCTS");
    const { searchString, skip, take } = req.query;
    const { products, productsCount } = await productService.getAllProducts(
        searchString,
        skip,
        take
    );
    if (!products) {
        throw new ApiError(httpStatus.NOT_FOUND, "No product found");
    }
    const hasMore = parseInt(skip) + parseInt(take) < productsCount;
    logger.debug("hasMore:", hasMore, "=", skip, "+", take, "<", productsCount);
    res.status(httpStatus.OK).send({ products, productsCount, hasMore });
});

const consumeStock = catchAsync(async (req, res) => {
    logger.debug("CONSUME STOCK CONTROLLER");
    const productStock = await productService.consumeStock(
        req.body.productId,
        req.body.quantity
    );
    res.status(httpStatus.OK).send(productStock);
});

const replenishStock = catchAsync(async (req, res) => {
    logger.debug("CONSUME STOCK CONTROLLER");
    const productStock = await productService.replenishStock(
        req.body.productId,
        req.body.quantity
    );
    res.status(httpStatus.OK).send(productStock);
});

module.exports = {
    createProduct,
    updateProduct,
    getProduct,
    getProducts,
    getAllProducts,
    consumeStock,
    replenishStock,
};
