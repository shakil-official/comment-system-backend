"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const errorHandler = (err, req, res, next // must include this!
) => {
    console.error(err); // log the error for debugging
    const status = err.status || 500;
    const message = err.message || "Server Error";
    res.status(status).json({ message });
};
exports.errorHandler = errorHandler;
