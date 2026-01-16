import express from "express";
import {
    createPost,
    getAllPosts,
    getPost,
    createComment,
    updateComment,
    deleteComment,
    toggleLike,
    toggleDislike,
} from "../controllers/commentController";
import {protect} from "../middleware/authMiddleware";

const router = express.Router();

/**
 * POST ROUTES
 */
router.post("/create", protect, createPost);
router.get("/get/all", getAllPosts);
router.get("/:postId", getPost);

/**
 * COMMENT ROUTES
 */
router.post("/comment/create", protect, createComment);
router.patch("/comment/:commentId", protect, updateComment);
router.delete("/comment/:commentId", protect, deleteComment);

/**
 * REACTION ROUTES
 */
router.patch("/comment/:commentId/like", protect, toggleLike);
router.patch("/comment/:commentId/dislike", protect, toggleDislike);

export default router;
