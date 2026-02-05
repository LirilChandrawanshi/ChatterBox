import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { Plus, Heart, MessageCircle, Trash2, Send, X } from "lucide-react";
import DesktopLayout from "@/components/DesktopLayout";
import ProfileModal from "@/components/ProfileModal";
import {
    getCommunityPosts,
    createCommunityPost,
    togglePostLike,
    addPostComment,
    deleteCommunityPost,
    type CommunityPost,
} from "@/services/api";
import { getStoredUser } from "./index";
import BottomNav from "@/components/BottomNav";

export default function Community() {
    const router = useRouter();
    const { mobile: queryMobile } = router.query;
    const stored = getStoredUser();
    const myMobile = typeof queryMobile === "string" ? queryMobile : (stored?.mobile ?? "");
    const myName = stored?.displayName ?? myMobile;

    const [posts, setPosts] = useState<CommunityPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newPostText, setNewPostText] = useState("");
    const [creating, setCreating] = useState(false);

    // Comment state
    const [commentingPostId, setCommentingPostId] = useState<string | null>(null);
    const [commentText, setCommentText] = useState("");
    const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());

    // Filter and profile viewing state
    const [filter, setFilter] = useState<"all" | "my" | "liked">("all");
    const [viewingProfile, setViewingProfile] = useState<string | null>(null);

    useEffect(() => {
        if (!router.isReady) return;
        if (!myMobile) {
            router.replace("/");
            return;
        }
        loadPosts();
    }, [router.isReady, myMobile]);

    const loadPosts = async () => {
        setLoading(true);
        const data = await getCommunityPosts();
        setPosts(data);
        setLoading(false);
    };

    const handleCreatePost = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPostText.trim()) return;
        setCreating(true);
        try {
            await createCommunityPost(myMobile, { content: newPostText.trim() });
            setNewPostText("");
            setShowCreateModal(false);
            await loadPosts();
        } finally {
            setCreating(false);
        }
    };

    const handleLike = async (postId: string) => {
        const updated = await togglePostLike(postId, myMobile);
        setPosts(posts.map(p => p.id === postId ? updated : p));
    };

    const handleComment = async (postId: string) => {
        if (!commentText.trim()) return;
        const updated = await addPostComment(postId, myMobile, commentText.trim());
        setPosts(posts.map(p => p.id === postId ? updated : p));
        setCommentText("");
        setCommentingPostId(null);
        setExpandedComments(prev => new Set(prev).add(postId));
    };

    const handleDelete = async (postId: string) => {
        if (confirm("Delete this post?")) {
            await deleteCommunityPost(postId, myMobile);
            await loadPosts();
        }
    };

    const toggleComments = (postId: string) => {
        setExpandedComments(prev => {
            const next = new Set(prev);
            if (next.has(postId)) next.delete(postId);
            else next.add(postId);
            return next;
        });
    };

    // ... existing logic ...

    const formatTime = (ts: number) => {
        const diff = Date.now() - ts;
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return "Just now";
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        const days = Math.floor(hrs / 24);
        if (days < 7) return `${days}d ago`;
        return new Date(ts).toLocaleDateString();
    };

    const colors = ["#00a884", "#667eea", "#f093fb", "#4facfe", "#43e97b"];
    const getColor = (str: string) => colors[Math.abs(str.split("").reduce((a, c) => a + c.charCodeAt(0), 0)) % colors.length];

    if (!myMobile) return null;

    // Filter posts based on selected filter
    const filteredPosts = posts.filter(post => {
        if (filter === "my") return post.authorMobile === myMobile;
        if (filter === "liked") return post.likes.includes(myMobile);
        return true;
    });

    const Sidebar = (
        <div className="flex flex-col h-full bg-[#111b21] border-r border-[#2a3942]">
            <header className="px-4 py-4 border-b border-[#2a3942] bg-[#202c33] flex items-center justify-between shadow-sm">
                <h1 className="text-xl font-bold text-white">Community</h1>
            </header>
            <div className="p-4 space-y-2">
                <button
                    onClick={() => setFilter("all")}
                    className={`w-full text-left px-4 py-3 rounded-xl font-medium transition ${filter === "all"
                        ? "bg-[#2a3942] text-[#00a884] ring-1 ring-[#00a884]"
                        : "bg-[#202c33] text-[#8696a0] hover:bg-[#2a3942] hover:text-white"
                        }`}
                >
                    All Posts
                </button>
                <button
                    onClick={() => setFilter("my")}
                    className={`w-full text-left px-4 py-3 rounded-xl font-medium transition ${filter === "my"
                        ? "bg-[#2a3942] text-[#00a884] ring-1 ring-[#00a884]"
                        : "bg-[#202c33] text-[#8696a0] hover:bg-[#2a3942] hover:text-white"
                        }`}
                >
                    My Posts
                </button>
                <button
                    onClick={() => setFilter("liked")}
                    className={`w-full text-left px-4 py-3 rounded-xl font-medium transition ${filter === "liked"
                        ? "bg-[#2a3942] text-[#00a884] ring-1 ring-[#00a884]"
                        : "bg-[#202c33] text-[#8696a0] hover:bg-[#2a3942] hover:text-white"
                        }`}
                >
                    Liked Posts
                </button>
            </div>

            <div className="p-4 mt-auto lg:mb-0 mb-20">
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="w-full py-3 rounded-xl bg-[#00a884] text-white font-bold hover:bg-[#06cf9c] transition shadow-lg flex items-center justify-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Create Post
                </button>
            </div>
        </div>
    );

    const MainPanel = (
        <div className="flex flex-col h-full bg-[#0b141a]">
            {/* Header - Mobile only, since Desktop has Sidebar Header */}
            <header className="px-4 py-4 border-b border-[#2a3942] bg-[#202c33] flex justify-between items-center lg:hidden shadow-sm sticky top-0 z-10">
                <h1 className="text-xl font-bold text-white">Community</h1>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="p-2 rounded-full bg-[#00a884] text-white hover:bg-[#06cf9c] transition shadow-lg"
                >
                    <Plus className="w-5 h-5" />
                </button>
            </header>

            {/* Feed */}
            <div className="flex-1 overflow-y-auto pb-20 custom-scrollbar">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-64">
                        <div className="w-8 h-8 border-4 border-[#00a884] border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-[#8696a0]">Loading community...</p>
                    </div>
                ) : filteredPosts.length === 0 ? (
                    <div className="text-center py-12 px-4 h-full flex flex-col items-center justify-center">
                        <div className="w-24 h-24 mx-auto rounded-full bg-[#1f2c34] flex items-center justify-center mb-6">
                            <MessageCircle className="w-12 h-12 text-[#00a884]" />
                        </div>
                        <h3 className="text-white font-medium text-xl mb-2">
                            {filter === "all" ? "No posts yet" : filter === "my" ? "You haven't posted yet" : "No liked posts"}
                        </h3>
                        <p className="text-[#8696a0] text-sm mb-6 max-w-xs mx-auto">
                            {filter === "all" ? "Be the first to share something with the community!" : filter === "my" ? "Share your thoughts with the community!" : "Like some posts to see them here!"}
                        </p>
                        {filter !== "liked" && (
                            <button
                                type="button"
                                onClick={() => setShowCreateModal(true)}
                                className="px-6 py-3 rounded-xl bg-[#00a884] text-white hover:bg-[#06cf9c] transition shadow-lg inline-flex items-center gap-2 font-medium"
                            >
                                <Plus className="w-5 h-5" />
                                Create Post
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="divide-y divide-[#2a3942] max-w-3xl mx-auto w-full">
                        {filteredPosts.map(post => {
                            const isLiked = post.likes.includes(myMobile);
                            const isOwn = post.authorMobile === myMobile;
                            const showComments = expandedComments.has(post.id);

                            return (
                                <div key={post.id} className="p-4 hover:bg-[#111b21]/30 transition">
                                    {/* Author */}
                                    <div className="flex items-center gap-3 mb-3">
                                        <button
                                            type="button"
                                            onClick={() => setViewingProfile(post.authorMobile)}
                                            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ring-2 ring-[#2a3942] hover:ring-[#00a884] transition cursor-pointer"
                                            style={{ backgroundColor: getColor(post.authorMobile) }}
                                        >
                                            {post.authorName.charAt(0).toUpperCase()}
                                        </button>
                                        <div className="flex-1">
                                            <button
                                                type="button"
                                                onClick={() => setViewingProfile(post.authorMobile)}
                                                className="text-white font-medium leading-tight hover:underline text-left"
                                            >
                                                {post.authorName}
                                            </button>
                                            <p className="text-xs text-[#8696a0] mt-0.5">{formatTime(post.createdAt)}</p>
                                        </div>
                                        {isOwn && (
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(post.id)}
                                                className="p-2 text-[#8696a0] hover:text-red-400 hover:bg-red-500/10 rounded-full transition"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <p className="text-[#e9edef] text-[15px] leading-relaxed mb-3 whitespace-pre-wrap pl-[52px]">
                                        {post.content}
                                    </p>

                                    {post.imageBase64 && (
                                        <div className="pl-[52px] mb-3">
                                            <img
                                                src={`data:${post.imageType};base64,${post.imageBase64}`}
                                                alt="Post"
                                                className="rounded-xl w-full max-h-[500px] object-cover border border-[#2a3942]"
                                            />
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="flex items-center gap-6 text-[#8696a0] pl-[52px]">
                                        <button
                                            type="button"
                                            onClick={() => handleLike(post.id)}
                                            className={`flex items-center gap-2 transition group ${isLiked ? "text-red-500" : "hover:text-red-400"}`}
                                        >
                                            <div className={`p-2 rounded-full group-hover:bg-red-500/10 transition ${isLiked ? "" : ""}`}>
                                                <Heart className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} />
                                            </div>
                                            <span className="text-sm font-medium">{post.likes.length}</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => toggleComments(post.id)}
                                            className="flex items-center gap-2 hover:text-[#00a884] transition group"
                                        >
                                            <div className="p-2 rounded-full group-hover:bg-[#00a884]/10 transition">
                                                <MessageCircle className="w-5 h-5" />
                                            </div>
                                            <span className="text-sm font-medium">{post.comments.length}</span>
                                        </button>
                                    </div>

                                    {/* Comments Section */}
                                    {showComments && (
                                        <div className="mt-4 pt-3 border-t border-[#2a3942] pl-[52px] animate-in slide-in-from-top-2">
                                            {post.comments.map((comment, idx) => (
                                                <div key={idx} className="flex gap-3 mb-3">
                                                    <div
                                                        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                                                        style={{ backgroundColor: getColor(comment.authorMobile) }}
                                                    >
                                                        {comment.authorName.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="bg-[#202c33] rounded-2xl rounded-tl-none px-4 py-2 flex-1">
                                                        <p className="text-[#00a884] text-xs font-bold mb-0.5">{comment.authorName}</p>
                                                        <p className="text-[#e9edef] text-sm">{comment.content}</p>
                                                    </div>
                                                </div>
                                            ))}

                                            {/* Add comment */}
                                            <div className="flex gap-2 mt-3">
                                                <input
                                                    type="text"
                                                    value={commentingPostId === post.id ? commentText : ""}
                                                    onChange={(e) => {
                                                        setCommentingPostId(post.id);
                                                        setCommentText(e.target.value);
                                                    }}
                                                    onFocus={() => setCommentingPostId(post.id)}
                                                    placeholder="Write a comment..."
                                                    className="flex-1 bg-[#202c33] border border-[#2a3942] rounded-full px-4 py-2 text-white text-sm placeholder-[#8696a0] focus:outline-none focus:ring-1 focus:ring-[#00a884] focus:border-[#00a884]"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => handleComment(post.id)}
                                                    disabled={commentingPostId !== post.id || !commentText.trim()}
                                                    className="p-2 rounded-full bg-[#00a884] text-white hover:bg-[#06cf9c] disabled:opacity-50 disabled:cursor-not-allowed transition"
                                                >
                                                    <Send className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* BottomNav - Mobile only (Visible when Main is shown) */}
            <div className="lg:hidden">
                <BottomNav activeTab="community" mobile={myMobile} />
            </div>
        </div>
    );

    return (
        <>
            <Head>
                <title>ChatterBox - Community</title>
            </Head>

            <DesktopLayout
                sidebar={Sidebar}
                main={MainPanel}
                showMain={true} // Defaults to showing feed (Main) on mobile
                activeSection="community"
            />

            {/* Create Post Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
                    <div className="bg-[#202c33] rounded-2xl w-full max-w-lg p-6 shadow-2xl border border-[#2a3942]">
                        <div className="flex items-center justify-between mb-4 border-b border-[#2a3942] pb-4">
                            <h2 className="text-xl font-semibold text-white">Create Post</h2>
                            <button
                                type="button"
                                onClick={() => { setShowCreateModal(false); setNewPostText(""); }}
                                className="p-2 rounded-full hover:bg-[#2a3942] text-[#8696a0] hover:text-white transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleCreatePost}>
                            <div className="flex gap-4 mb-4">
                                <div
                                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shrink-0 ring-2 ring-[#2a3942]"
                                    style={{ backgroundColor: getColor(myMobile) }}
                                >
                                    {myName.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1">
                                    <textarea
                                        value={newPostText}
                                        onChange={(e) => setNewPostText(e.target.value)}
                                        placeholder="What's happening?"
                                        rows={5}
                                        className="w-full bg-transparent border-none text-white text-lg placeholder-[#8696a0] focus:ring-0 resize-none p-0"
                                        autoFocus
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end pt-4 border-t border-[#2a3942]">
                                <button
                                    type="submit"
                                    disabled={creating || !newPostText.trim()}
                                    className="px-6 py-2 rounded-full bg-[#00a884] text-white font-bold hover:bg-[#06cf9c] disabled:opacity-50 transition shadow-lg"
                                >
                                    {creating ? "Posting..." : "Post"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Profile Modal */}
            {viewingProfile && (
                <ProfileModal
                    mobile={viewingProfile}
                    onClose={() => setViewingProfile(null)}
                />
            )}
        </>
    );
}
