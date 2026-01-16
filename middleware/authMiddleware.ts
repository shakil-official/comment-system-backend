import {Request, Response, NextFunction} from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";

interface JwtPayload {
    id: string;
}

export const protect = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({message: "Not authorized, no token"});
        }

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET as string
        ) as JwtPayload;

        const user = await User.findById(decoded.id).select("-password");

        if (!user) {
            return res.status(401).json({message: "User no longer exists"});
        }

        // attach user info to the request (typed via express.d.ts)
        req.user = {
            id: user._id.toString(),
            email: user.email,
        };

        next();
    } catch (error) {
        return res.status(401).json({message: "Not authorized, token failed"});
    }
};
