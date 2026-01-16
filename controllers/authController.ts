import {Request, Response, NextFunction} from "express";
import User from "../models/User";
import jwt from "jsonwebtoken";

const generateToken = (id: string) =>
    jwt.sign({id}, process.env.JWT_SECRET || "secret", {expiresIn: "7d"});

export const register = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const {name, email, password} = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({message: "Email and password required"});
        }

        // Check if a user already exists
        const existingUser = await User.findOne({email});
        if (existingUser) {
            return res.status(400).json({message: "User already exists"});
        }

        // Create user (pre-save hook will hash password)
        const user = await User.create({name, email, password});

        // Generate JWT
        const token = generateToken(user._id.toString());

        // Send response
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            token,
        });
    } catch (err) {
        next(err);
    }
};

export const login = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const {email, password} = req.body;

        // Find the user by email
        const user = await User.findOne({email});
        if (!user) {
            return res.status(401).json({message: "Invalid credentials"});
        }

        // Compare password (pre-save hashed)
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({message: "Invalid credentials"});
        }

        // Generate JWT
        const token = generateToken(user._id.toString());

        res.status(200).json({
            _id: user._id,
            email: user.email,
            token,
        });
    } catch (err) {
        next(err);
    }
};

interface AuthRequest extends Request {
    user?: { id: string; email: string };
}

export const me = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({message: "Unauthorized"});
        }

        const user = await User.findById(req.user.id).select("-password");
        if (!user) {
            return res.status(404).json({message: "User not found"});
        }

        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({message: "Server error"});
    }
};