const superjson = require("superjson");

// Custom middleware to handle SuperJSON deserialization
const deserializeSuperJson = (req, res, next) => {
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
};

// Middleware to serialize outgoing JSON with SuperJSON
const serializeSuperJson = (req, res, next) => {
    const originalSend = res.send;
    res.send = function (body) {
        if (typeof body === "object") {
            body = superjson.stringify(body);
        }
        return originalSend.call(this, body);
    };
    next();
};

module.exports = { deserializeSuperJson, serializeSuperJson };
