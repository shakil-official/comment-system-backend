import { Request, Response } from "express";
import Post, {IPost} from "../models/Post";
import Comment, { IComment } from "../models/Comment";
import { buildCommentTree } from "../utils/buildCommentTree";
import { io } from "../index";

/**
 * Create a new post
 */

export const createPost = async (req: Request, res: Response) => {
    try {
        const { title, description } = req.body;
        const userId = req.user!.id;

        // TypeScript knows a post is IPost
        const post: IPost = await Post.create({
            title,
            description,
            user: userId,
        });

        const populated = await post.populate("user", "name email");

        io.emit("post:new", populated);

        res.status(201).json(populated);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};

/**
 * Get all posts with pagination
 */
export const getAllPosts = async (req: Request, res: Response) => {
    try {
        const page = Math.max(Number(req.query.page) || 1, 1);
        const limit = Math.min(Number(req.query.limit) || 20, 100);

        const total = await Post.countDocuments();

        const posts = await Post.find()
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
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};



/**
 * Create a comment or reply
 */
export const createComment = async (req: Request, res: Response) => {
    try {
        const { message, postId, parentId } = req.body;
        const userId = req.user!.id;

        const comment = await Comment.create({
            message,
            post: postId,
            user: userId,
            parent: parentId || null,
        });

        const populated = await comment.populate("user", "name email");

        // Real-time update
        io.to(postId).emit("comment:new", populated);

        res.status(201).json(populated);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};

/**
 * Get post with comments (nested + pagination + sorting)
 */
export const getPost = async (req: Request, res: Response) => {
    try {
        const { postId } = req.params;
        const page = Math.max(Number(req.query.page) || 1, 1);
        const limit = Math.min(Number(req.query.limit) || 20, 100);
        const sort = (req.query.sort as string) || "newest";

        const sortOptions: any = {
            newest: { createdAt: -1 },
            mostLiked: { favoritesCount: -1 },
            mostDisliked: { dislikesCount: -1 },
        };

        // Fetch post
        const post = await Post.findById(postId).populate("user", "name email").lean();
        if (!post) return res.status(404).json({ message: "Post not found" });

        // Total comments for pagination
        const total = await Comment.countDocuments({ post: postId });

        // Aggregate comments with counts and pagination
        const comments = await Comment.aggregate([
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

        await Comment.populate(comments, { path: "user", select: "name email" });

        const nestedComments = buildCommentTree(comments as IComment[]);

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
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};


/**
 * Update comment (OWNER ONLY)
 */
export const updateComment = async (req: Request, res: Response) => {
    try {
        const { commentId } = req.params;
        const { message } = req.body;
        const userId = req.user!.id;

        const comment = await Comment.findById(commentId);
        if (!comment) return res.status(404).json({ message: "Comment not found" });

        if (comment.user.toString() !== userId)
            return res.status(403).json({ message: "Unauthorized" });

        comment.message = message;
        await comment.save();

        io.to(comment.post.toString()).emit("comment:update", comment);
        res.json(comment);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};

// Recursively delete comment and all children
const deleteCommentRecursive = async (commentId: string | string[]) => {
    const comment = await Comment.findById(commentId);
    if (!comment) return;

    // Find all direct children
    const children = await Comment.find({ parent: comment._id });
    for (const child of children) {
        await deleteCommentRecursive(child._id.toString());
    }

    // Delete this comment
    await comment.deleteOne();
};

/**
 * Delete comment (OWNER ONLY)
 */
export const deleteComment = async (req: Request, res: Response) => {
    try {
        const { commentId } = req.params;
        const userId = req.user!.id;

        const comment = await Comment.findById(commentId);
        if (!comment) return res.status(404).json({ message: "Comment not found" });

        if (comment.user.toString() !== userId)
            return res.status(403).json({ message: "Unauthorized" });

        // Recursive deletion
        await deleteCommentRecursive(commentId);

        // Emit event to all clients in the post room
        io.to(comment.post.toString()).emit("comment:delete", commentId);

        res.json({ success: true });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};
/**
 * Toggle like
 */
export const toggleLike = async (req: Request, res: Response) => {
    try {
        const { commentId } = req.params;
        const userId = req.user!.id;

        const comment = await Comment.findById(commentId);
        if (!comment) return res.status(404).json({ message: "Comment not found" });

        // Remove user from dislikes if exists
        comment.dislikes = comment.dislikes.filter((id) => id.toString() !== userId);

        if (comment.favorites.includes(userId)) {
            comment.favorites = comment.favorites.filter((id) => id.toString() !== userId);
        } else {
            comment.favorites.push(userId);
        }

        await comment.save();

        io.to(comment.post.toString()).emit("comment:reaction", {
            commentId,
            likes: comment.favorites.length,
            dislikes: comment.dislikes.length,
        });

        res.json({ likes: comment.favorites.length, dislikes: comment.dislikes.length });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};

/**
 * Toggle dislike
 */
export const toggleDislike = async (req: Request, res: Response) => {
    try {
        const { commentId } = req.params;
        const userId = req.user!.id;

        const comment = await Comment.findById(commentId);
        if (!comment) return res.status(404).json({ message: "Comment not found" });

        // Remove user from dislikes if exists
        comment.likes = comment.likes.filter((id) => id.toString() !== userId);

        if (comment.dislikes.includes(userId)) {
            comment.dislikes = comment.dislikes.filter((id) => id.toString() !== userId);
        } else {
            comment.dislikes.push(userId);
        }

        await comment.save();

        io.to(comment.post.toString()).emit("comment:reaction", {
            commentId,
            likes: comment.likes.length,
            dislikes: comment.dislikes.length,
        });

        res.json({ likes: comment.likes.length, dislikes: comment.dislikes.length });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};
