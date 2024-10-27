const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("./config/morgan");
const { authLimiter } = require("./middlewares/rateLimiter");
const { slowLimit } = require("./middlewares/slowDown");
const passport = require("passport");
const { passportJwtStrategy } = require("./config/passport");
const cookieParser = require("cookie-parser");
const { xss } = require("express-xss-sanitizer");
const mongoSanitize = require("express-mongo-sanitize");
const compression = require("compression");
const superjson = require("superjson");
const config = require("./config/config");
const httpStatus = require("http-status");
const ApiError = require("./utils/ApiError");
const { errorConverter, errorHandler } = require("./middlewares/error");
const routes = require("./routes/v1/");

const app = express();

if (config.env !== "test") {
    app.use(morgan.successHandler);
    app.use(morgan.errorHandler);
}

// Security middleware
app.use(helmet());
app.use(xss());
app.use(mongoSanitize());
app.use(compression());

// CORS middleware
app.use(cors());
app.options("*", cors());

// Rate limiting middleware
if (config.env === "production") {
    app.use(rateLimiter);
    app.use(slowLimit);
}

// Body parsing middleware
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// app.use(express.json());
// Custom middleware to handle SuperJSON deserialization
app.use((req, res, next) => {
    if (req.is("application/json")) {
        let data = "";
        req.on("data", (chunk) => {
            data += chunk;
        });
        req.on("end", () => {
            try {
                const parsedData = JSON.parse(data);
                if (parsedData.hasOwnProperty("json")) {
                    req.body = superjson.deserialize(parsedData);
                } else {
                    req.body = parsedData;
                }
                next();
            } catch (err) {
                next(err);
            }
        });
    } else {
        next();
    }
});

// Middleware to serialize outgoing JSON with SuperJSON
app.use((req, res, next) => {
    const originalSend = res.send;
    res.send = function (body) {
        if (typeof body === "object") {
            body = superjson.stringify(body);
        }
        return originalSend.call(this, body);
    };
    next();
});

// Passport middleware
passport.use(passportJwtStrategy);

if (config.env === "production") {
    app.use("/v1/auth", authLimiter);
    // app.use("/v1", slowLimit);
}

app.use("/v1", routes);

app.use((req, res, next) => {
    next(new ApiError(httpStatus.NOT_FOUND, "Not Found"));
});

app.use(errorConverter);
app.use(errorHandler);

module.exports = app;
