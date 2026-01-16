"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleDislike = exports.toggleLike = exports.deleteComment = exports.updateComment = exports.getPost = exports.createComment = exports.getAllPosts = exports.createPost = void 0;
const Post_1 = __importDefault(require("../models/Post"));
const Comment_1 = __importDefault(require("../models/Comment"));
const buildCommentTree_1 = require("../utils/buildCommentTree");
const index_1 = require("../index");
/**
 * Create a new post
 */
const createPost = async (req, res) => {
    try {
        const { title, description } = req.body;
        const userId = req.user.id;
        // TypeScript knows a post is IPost
        const post = await Post_1.default.create({
            title,
            description,
            user: userId,
        });
        const populated = await post.populate("user", "name email");
        index_1.io.emit("post:new", populated);
        res.status(201).json(populated);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
};
exports.createPost = createPost;
/**
 * Get all posts with pagination
 */
const getAllPosts = async (req, res) => {
    try {
        const page = Math.max(Number(req.query.page) || 1, 1);
        const limit = Math.min(Number(req.query.limit) || 20, 100);
        const total = await Post_1.default.countDocuments();
        const posts = await Post_1.default.find()
            .populate("user", "name email")
            .sort({ createdAt: -1 }) // newest first
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();
        res.json({
            posts,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
};
exports.getAllPosts = getAllPosts;
/**
 * Create a comment or reply
 */
const createComment = async (req, res) => {
    try {
        const { message, postId, parentId } = req.body;
        const userId = req.user.id;
        const comment = await Comment_1.default.create({
            message,
            post: postId,
            user: userId,
            parent: parentId || null,
        });
        const populated = await comment.populate("user", "name email");
        // Real-time update
        index_1.io.to(postId).emit("comment:new", populated);
        res.status(201).json(populated);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
};
exports.createComment = createComment;
/**
 * Get post with comments (nested + pagination + sorting)
 */
const getPost = async (req, res) => {
    try {
        const { postId } = req.params;
        const page = Math.max(Number(req.query.page) || 1, 1);
        const limit = Math.min(Number(req.query.limit) || 20, 100);
        const sort = req.query.sort || "newest";
        const sortOptions = {
            newest: { createdAt: -1 },
            mostLiked: { favoritesCount: -1 },
            mostDisliked: { dislikesCount: -1 },
        };
        // Fetch post
        const post = await Post_1.default.findById(postId).populate("user", "name email").lean();
        if (!post)
            return res.status(404).json({ message: "Post not found" });
        // Total comments for pagination
        const total = await Comment_1.default.countDocuments({ post: postId });
        // Aggregate comments with counts and pagination
        const comments = await Comment_1.default.aggregate([
            { $match: { post: post._id } },
            {
                $addFields: {
                    favoritesCount: { $size: { $ifNull: ["$favorites", []] } },
                    dislikesCount: { $size: { $ifNull: ["$dislikes", []] } },
                },
            },
            { $sort: sortOptions[sort] || sortOptions.newest },
            { $skip: (page - 1) * limit },
            { $limit: limit },
        ]);
        await Comment_1.default.populate(comments, { path: "user", select: "name email" });
        const nestedComments = (0, buildCommentTree_1.buildCommentTree)(comments);
        res.json({
            post,
            comments: nestedComments,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
};
exports.getPost = getPost;
/**
 * Update comment (OWNER ONLY)
 */
const updateComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const { message } = req.body;
        const userId = req.user.id;
        const comment = await Comment_1.default.findById(commentId);
        if (!comment)
            return res.status(404).json({ message: "Comment not found" });
        if (comment.user.toString() !== userId)
            return res.status(403).json({ message: "Unauthorized" });
        comment.message = message;
        await comment.save();
        index_1.io.to(comment.post.toString()).emit("comment:update", comment);
        res.json(comment);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
};
exports.updateComment = updateComment;
// Recursively delete comment and all children
const deleteCommentRecursive = async (commentId) => {
    const comment = await Comment_1.default.findById(commentId);
    if (!comment)
        return;
    // Find all direct children
    const children = await Comment_1.default.find({ parent: comment._id });
    for (const child of children) {
        await deleteCommentRecursive(child._id.toString());
    }
    // Delete this comment
    await comment.deleteOne();
};
/**
 * Delete comment (OWNER ONLY)
 */
const deleteComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const userId = req.user.id;
        const comment = await Comment_1.default.findById(commentId);
        if (!comment)
            return res.status(404).json({ message: "Comment not found" });
        if (comment.user.toString() !== userId)
            return res.status(403).json({ message: "Unauthorized" });
        // Recursive deletion
        await deleteCommentRecursive(commentId);
        // Emit event to all clients in the post room
        index_1.io.to(comment.post.toString()).emit("comment:delete", commentId);
        res.json({ success: true });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};
exports.deleteComment = deleteComment;
/**
 * Toggle like
 */
const toggleLike = async (req, res) => {
    try {
        const { commentId } = req.params;
        const userId = req.user.id;
        const comment = await Comment_1.default.findById(commentId);
        if (!comment)
            return res.status(404).json({ message: "Comment not found" });
        // Remove user from dislikes if exists
        comment.dislikes = comment.dislikes.filter((id) => id.toString() !== userId);
        if (comment.favorites.includes(userId)) {
            comment.favorites = comment.favorites.filter((id) => id.toString() !== userId);
        }
        else {
            comment.favorites.push(userId);
        }
        await comment.save();
        index_1.io.to(comment.post.toString()).emit("comment:reaction", {
            commentId,
            likes: comment.favorites.length,
            dislikes: comment.dislikes.length,
        });
        res.json({ likes: comment.favorites.length, dislikes: comment.dislikes.length });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
};
exports.toggleLike = toggleLike;
/**
 * Toggle dislike
 */
const toggleDislike = async (req, res) => {
    try {
        const { commentId } = req.params;
        const userId = req.user.id;
        const comment = await Comment_1.default.findById(commentId);
        if (!comment)
            return res.status(404).json({ message: "Comment not found" });
        // Remove user from dislikes if exists
        comment.likes = comment.likes.filter((id) => id.toString() !== userId);
        if (comment.dislikes.includes(userId)) {
            comment.dislikes = comment.dislikes.filter((id) => id.toString() !== userId);
        }
        else {
            comment.dislikes.push(userId);
        }
        await comment.save();
        index_1.io.to(comment.post.toString()).emit("comment:reaction", {
            commentId,
            likes: comment.likes.length,
            dislikes: comment.dislikes.length,
        });
        res.json({ likes: comment.likes.length, dislikes: comment.dislikes.length });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
};
exports.toggleDislike = toggleDislike;
