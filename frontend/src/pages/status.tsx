import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { Plus, X, Eye, ChevronLeft, ChevronRight, Trash2, ArrowLeft, Disc } from "lucide-react";
import DesktopLayout from "@/components/DesktopLayout";
import {
    getStatuses,
    createStatus,
    viewStatus,
    deleteStatus,
    type UserStatuses,
    type StatusItem,
} from "@/services/api";
import { getStoredUser } from "./index";
import BottomNav from "@/components/BottomNav";

export default function Status() {
    const router = useRouter();
    const { mobile: queryMobile } = router.query;
    const stored = getStoredUser();
    const myMobile = typeof queryMobile === "string" ? queryMobile : (stored?.mobile ?? "");

    const [userStatuses, setUserStatuses] = useState<UserStatuses[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newStatusText, setNewStatusText] = useState("");
    const [creating, setCreating] = useState(false);

    // Story viewer state
    const [viewingUser, setViewingUser] = useState<UserStatuses | null>(null);
    const [currentStatusIndex, setCurrentStatusIndex] = useState(0);
    const progressRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!router.isReady) return;
        if (!myMobile) {
            router.replace("/");
            return;
        }
        loadStatuses();
    }, [router.isReady, myMobile]);

    const loadStatuses = async () => {
        setLoading(true);
        const data = await getStatuses(myMobile);
        setUserStatuses(data);
        setLoading(false);
    };

    const handleCreateStatus = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newStatusText.trim()) return;
        setCreating(true);
        try {
            await createStatus(myMobile, { content: newStatusText.trim() });
            setNewStatusText("");
            setShowAddModal(false);
            await loadStatuses();
        } finally {
            setCreating(false);
        }
    };

    const openStatusViewer = (user: UserStatuses) => {
        setViewingUser(user);
        setCurrentStatusIndex(0);
        // Mark first status as viewed
        if (user.statuses.length > 0 && !user.isOwn) {
            viewStatus(user.statuses[0].id, myMobile);
        }
    };

    const closeViewer = () => {
        if (progressRef.current) clearInterval(progressRef.current);
        setViewingUser(null);
        setCurrentStatusIndex(0);
    };

    const nextStatus = () => {
        if (!viewingUser) return;
        if (currentStatusIndex < viewingUser.statuses.length - 1) {
            const newIndex = currentStatusIndex + 1;
            setCurrentStatusIndex(newIndex);
            if (!viewingUser.isOwn) {
                viewStatus(viewingUser.statuses[newIndex].id, myMobile);
            }
        } else {
            closeViewer();
        }
    };

    const prevStatus = () => {
        if (currentStatusIndex > 0) {
            setCurrentStatusIndex(currentStatusIndex - 1);
        }
    };

    const handleDeleteStatus = async (statusId: string) => {
        await deleteStatus(statusId, myMobile);
        closeViewer();
        await loadStatuses();
    };

    // ... existing logic ...

    const formatTime = (ts: number) => {
        const diff = Date.now() - ts;
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return "Just now";
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return new Date(ts).toLocaleDateString();
    };

    const colors = ["#00a884", "#667eea", "#f093fb", "#4facfe", "#43e97b"];
    const getColor = (str: string) => colors[Math.abs(str.split("").reduce((a, c) => a + c.charCodeAt(0), 0)) % colors.length];

    if (!myMobile) return null;

    const Sidebar = (
        <div className="flex flex-col h-full bg-[#111b21] border-r border-[#2a3942]">
            {/* Header */}
            <header className="px-4 py-4 border-b border-[#2a3942] bg-[#202c33] flex items-center justify-between shadow-sm">
                <div className="flex flex-col">
                    <h1 className="text-xl font-bold text-white">Status</h1>
                    <p className="text-xs text-[#8696a0] lg:hidden">Share updates</p>
                </div>
                {/* Mobile only add button if needed in header, but we have big button in list */}
            </header>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {/* My Status */}
                <div className="mb-6">
                    <p className="text-xs text-[#00a884] font-medium uppercase tracking-wide mb-3 pl-1">My Status</p>
                    <button
                        type="button"
                        onClick={() => setShowAddModal(true)}
                        className="w-full flex items-center gap-4 p-3 bg-[#202c33] rounded-xl hover:bg-[#2a3942] transition group"
                    >
                        <div className="relative">
                            <div className="w-12 h-12 rounded-full bg-[#2a3942] flex items-center justify-center group-hover:bg-[#374248] transition">
                                <Plus className="w-6 h-6 text-[#00a884]" />
                            </div>
                        </div>
                        <div className="text-left">
                            <p className="text-white font-medium">Add Status</p>
                            <p className="text-sm text-[#8696a0]">Tap to add update</p>
                        </div>
                    </button>

                    {/* My existing statuses */}
                    {userStatuses.filter(u => u.isOwn).map(user => (
                        <button
                            key={user.userMobile + "own"}
                            type="button"
                            onClick={() => openStatusViewer(user)}
                            className="w-full flex items-center gap-4 p-3 mt-2 bg-[#202c33] rounded-xl hover:bg-[#2a3942] transition"
                        >
                            <div className="w-12 h-12 rounded-full ring-2 ring-[#00a884] p-0.5">
                                <div className="w-full h-full rounded-full flex items-center justify-center text-white font-bold text-sm"
                                    style={{ backgroundColor: getColor(user.userMobile) }}>
                                    {user.userName.charAt(0).toUpperCase()}
                                </div>
                            </div>
                            <div className="flex-1 text-left">
                                <p className="text-white font-medium">My Status</p>
                                <p className="text-sm text-[#8696a0]">{user.statuses.length} update(s)</p>
                            </div>
                            <div className="flex items-center gap-1 text-[#8696a0] text-xs">
                                <Eye className="w-4 h-4" />
                                {user.statuses.reduce((sum, s) => sum + s.viewedBy.length, 0)}
                            </div>
                        </button>
                    ))}
                </div>

                {/* Recent Updates */}
                <div>
                    <p className="text-xs text-[#00a884] font-medium uppercase tracking-wide mb-3 pl-1">Recent Updates</p>
                    {loading ? (
                        <p className="text-[#8696a0] text-center py-4 text-sm">Loading...</p>
                    ) : userStatuses.filter(u => !u.isOwn).length === 0 ? (
                        <div className="p-4 text-center rounded-xl border border-dashed border-[#2a3942]">
                            <p className="text-[#8696a0] text-sm">No recent status updates</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {userStatuses.filter(u => !u.isOwn).map(user => (
                                <button
                                    key={user.userMobile}
                                    type="button"
                                    onClick={() => openStatusViewer(user)}
                                    className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-[#202c33] transition"
                                >
                                    <div className="w-12 h-12 rounded-full ring-2 ring-[#00a884] p-0.5">
                                        <div className="w-full h-full rounded-full flex items-center justify-center text-white font-bold text-sm"
                                            style={{ backgroundColor: getColor(user.userMobile) }}>
                                            {user.userName.charAt(0).toUpperCase()}
                                        </div>
                                    </div>
                                    <div className="flex-1 text-left border-b border-[#2a3942] pb-3">
                                        <div className="flex justify-between items-center mb-0.5">
                                            <p className="text-white font-medium text-[15px]">{user.userName}</p>
                                            <p className="text-[10px] text-[#8696a0]">{formatTime(user.statuses[0].createdAt)}</p>
                                        </div>
                                        <p className="text-sm text-[#8696a0] line-clamp-1 opacity-80">
                                            {user.statuses[0].content || "Image update"}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* BottomNav for Mobile (hidden on desktop) */}
            <div className="lg:hidden">
                <BottomNav activeTab="status" mobile={myMobile} />
            </div>
        </div>
    );

    const MainPanel = (
        <div className="hidden lg:flex flex-col items-center justify-center h-full bg-[#0b141a] text-center p-8 border-l border-[#white/5]">
            <div className="max-w-md p-8">
                <div className="w-32 h-32 rounded-full bg-[#1f2c34] flex items-center justify-center mx-auto mb-8 animate-pulse-slow">
                    {/* Using Eye or custom icon since Disc isn't imported yet, will import Disc */}
                    <span className="text-6xl">⭕</span>
                </div>
                <h2 className="text-3xl text-[#e9edef] font-light mb-4">Click on a contact to view their status updates</h2>
                <p className="text-[#8696a0] text-lg font-light leading-relaxed">
                    Status updates disappear after 24 hours. share your moments with friends and family.
                </p>
            </div>
        </div>
    );

    return (
        <>
            <Head>
                <title>ChatterBox - Status</title>
            </Head>

            <DesktopLayout
                sidebar={Sidebar}
                main={MainPanel}
                showMain={false}
                activeSection="status"
            />

            {/* Add Status Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
                    <div className="bg-[#202c33] rounded-2xl w-full max-w-sm p-6 shadow-2xl border border-[#2a3942]">
                        <h2 className="text-xl font-semibold text-white mb-4">Add Status</h2>
                        <form onSubmit={handleCreateStatus}>
                            <textarea
                                value={newStatusText}
                                onChange={(e) => setNewStatusText(e.target.value)}
                                placeholder="What's on your mind?"
                                rows={4}
                                className="w-full bg-[#111b21] border border-[#2a3942] rounded-xl px-4 py-3 text-white placeholder-[#8696a0] focus:outline-none focus:ring-2 focus:ring-[#00a884] resize-none mb-4"
                                autoFocus
                            />
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => { setShowAddModal(false); setNewStatusText(""); }}
                                    className="flex-1 py-2.5 rounded-xl border border-[#2a3942] text-[#00a884] hover:bg-[#2a3942] transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating || !newStatusText.trim()}
                                    className="flex-1 py-2.5 rounded-xl bg-[#00a884] text-white hover:bg-[#06cf9c] disabled:opacity-50 transition shadow-lg"
                                >
                                    {creating ? "Posting..." : "Post"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Status Viewer Overlay */}
            {viewingUser && viewingUser.statuses.length > 0 && (
                <div className="fixed inset-0 bg-black z-[70] flex flex-col animate-in fade-in duration-200">
                    {/* Progress bars */}
                    <div className="flex gap-1 p-2 pt-4 safe-area-top">
                        {viewingUser.statuses.map((_, idx) => (
                            <div key={idx} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                                <div
                                    className={`h-full bg-white transition-all duration-300 ease-linear ${idx < currentStatusIndex ? 'w-full' : idx === currentStatusIndex ? 'w-full' : 'w-0'}`}
                                />
                            </div>
                        ))}
                    </div>

                    {/* Header */}
                    <div className="flex items-center gap-3 p-4">
                        <button onClick={closeViewer} className="p-1">
                            <ArrowLeft className="w-6 h-6 text-white" />
                        </button>
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                            style={{ backgroundColor: getColor(viewingUser.userMobile) }}>
                            {viewingUser.userName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                            <p className="text-white font-medium">{viewingUser.isOwn ? "My Status" : viewingUser.userName}</p>
                            <p className="text-xs text-white/80">{formatTime(viewingUser.statuses[currentStatusIndex].createdAt)}</p>
                        </div>
                        {viewingUser.isOwn && (
                            <button
                                type="button"
                                onClick={() => handleDeleteStatus(viewingUser.statuses[currentStatusIndex].id)}
                                className="p-2 text-white/80 hover:text-red-400 transition"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        )}
                        <button type="button" onClick={closeViewer} className="p-2 text-white/80 hover:text-white transition">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Status Content */}
                    <div className="flex-1 flex items-center justify-center p-4 relative h-full">
                        {/* Nav Touch Areas */}
                        <div className="absolute inset-y-0 left-0 w-1/3 z-10" onClick={prevStatus}></div>
                        <div className="absolute inset-y-0 right-0 w-1/3 z-10" onClick={nextStatus}></div>

                        <div className="text-center w-full max-w-2xl relative z-0">
                            {viewingUser.statuses[currentStatusIndex].imageBase64 && (
                                <img
                                    src={`data:${viewingUser.statuses[currentStatusIndex].imageType};base64,${viewingUser.statuses[currentStatusIndex].imageBase64}`}
                                    alt="Status"
                                    className="max-h-[70vh] w-auto mx-auto rounded-lg mb-6 shadow-2xl"
                                />
                            )}
                            <p className="text-2xl md:text-4xl text-white font-medium leading-relaxed drop-shadow-md px-4">
                                {viewingUser.statuses[currentStatusIndex].content}
                            </p>
                        </div>
                    </div>

                    {/* Viewers (for own status) */}
                    {viewingUser.isOwn && (
                        <div className="p-6 bg-gradient-to-t from-black/80 to-transparent pb-10">
                            <div className="flex items-center justify-center gap-2 text-white/80 text-sm font-medium">
                                <Eye className="w-4 h-4" />
                                <span>{viewingUser.statuses[currentStatusIndex].viewedBy.length} views</span>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </>
    );
}
