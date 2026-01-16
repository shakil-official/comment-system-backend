import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes";
import { errorHandler } from "./middleware/errorMiddleware";
import commentRoutes from "./routes/commentRoutes";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use('/api/post', commentRoutes)
app.use(errorHandler);

export default app;
