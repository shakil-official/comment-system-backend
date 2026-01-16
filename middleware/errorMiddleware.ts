import {Request, Response, NextFunction} from "express";

export const errorHandler = (
    err: any,
    req: Request,
    res: Response,
    next: NextFunction // must include this!
) => {
    console.error(err); // log the error for debugging
    const status = err.status || 500;
    const message = err.message || "Server Error";

    res.status(status).json({message});
};
