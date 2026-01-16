"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildCommentTree = void 0;
const buildCommentTree = (comments) => {
    // Map to hold comment id → comment object
    const map = new Map();
    const roots = [];
    // Initialize children array and map
    comments.forEach((comment) => {
        comment.children = [];
        map.set(comment._id.toString(), comment);
    });
    // Attach each comment to its parent or push to roots
    comments.forEach((comment) => {
        if (comment.parent) {
            const parent = map.get(comment.parent.toString());
            if (parent) {
                parent.children.push(comment);
            }
        }
        else {
            roots.push(comment);
        }
    });
    return roots;
};
exports.buildCommentTree = buildCommentTree;
