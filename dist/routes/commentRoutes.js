"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const commentController_1 = require("../controllers/commentController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
/**
 * POST ROUTES
 */
router.post("/create", authMiddleware_1.protect, commentController_1.createPost);
router.get("/get/all", commentController_1.getAllPosts);
router.get("/:postId", commentController_1.getPost);
/**
 * COMMENT ROUTES
 */
router.post("/comment/create", authMiddleware_1.protect, commentController_1.createComment);
router.patch("/comment/:commentId", authMiddleware_1.protect, commentController_1.updateComment);
router.delete("/comment/:commentId", authMiddleware_1.protect, commentController_1.deleteComment);
/**
 * REACTION ROUTES
 */
router.patch("/comment/:commentId/like", authMiddleware_1.protect, commentController_1.toggleLike);
router.patch("/comment/:commentId/dislike", authMiddleware_1.protect, commentController_1.toggleDislike);
exports.default = router;
