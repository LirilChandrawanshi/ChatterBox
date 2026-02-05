"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { Users, Plus, ArrowLeft } from "lucide-react";
import DesktopLayout from "@/components/DesktopLayout";
import BottomNav from "@/components/BottomNav";
import CreateGroupModal from "@/components/CreateGroupModal";
import { getMyGroups, Group } from "@/services/api";

export default function GroupsPage() {
    const router = useRouter();
    const mobile = (router.query.mobile as string) || "";
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateGroup, setShowCreateGroup] = useState(false);

    useEffect(() => {
        if (!mobile) return;
        setLoading(true);
        getMyGroups(mobile)
            .then(setGroups)
            .finally(() => setLoading(false));
    }, [mobile]);

    // Poll for updates
    useEffect(() => {
        if (!mobile) return;
        const interval = setInterval(() => {
            getMyGroups(mobile).then(setGroups);
        }, 5000);
        return () => clearInterval(interval);
    }, [mobile]);

    const handleGroupClick = (group: Group) => {
        router.push(`/desktop?mobile=${encodeURIComponent(mobile)}&chatId=${group.id}`);
    };

    const handleGroupCreated = () => {
        setShowCreateGroup(false);
        getMyGroups(mobile).then(setGroups);
    };

    // Sidebar content
    const Sidebar = (
        <div className="h-full flex flex-col bg-[#111827]">
            {/* Header */}
            <div className="sticky top-0 z-40 bg-gradient-to-r from-[#1a2332] to-[#0d1117] border-b border-[#2a3942]/50 px-4 py-3">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-bold bg-gradient-to-r from-[#00a884] to-[#25d366] bg-clip-text text-transparent">
                        Groups
                    </h1>
                    <button
                        onClick={() => setShowCreateGroup(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#00a884] to-[#25d366] rounded-full text-white font-medium hover:opacity-90 transition shadow-lg"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="text-sm">New</span>
                    </button>
                </div>
            </div>

            {/* Groups List */}
            <div className="flex-1 overflow-y-auto px-2 py-4">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="w-8 h-8 border-2 border-[#00a884] border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : groups.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                        <div className="w-20 h-20 rounded-full bg-[#2a3942] flex items-center justify-center mb-4">
                            <Users className="w-10 h-10 text-[#8696a0]" />
                        </div>
                        <h2 className="text-lg font-semibold text-white mb-2">No Groups Yet</h2>
                        <p className="text-[#8696a0] text-sm mb-6 max-w-xs">
                            Create a group to start chatting with multiple people!
                        </p>
                        <button
                            onClick={() => setShowCreateGroup(true)}
                            className="px-6 py-3 bg-gradient-to-r from-[#00a884] to-[#25d366] rounded-full text-white font-medium hover:opacity-90 transition"
                        >
                            Create Your First Group
                        </button>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {groups.map((group) => (
                            <button
                                key={group.id}
                                onClick={() => handleGroupClick(group)}
                                className="w-full flex items-center gap-3 p-3 hover:bg-[#2a3942]/50 rounded-xl transition"
                            >
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#00a884] to-[#25d366] flex items-center justify-center flex-shrink-0">
                                    <Users className="w-6 h-6 text-white" />
                                </div>
                                <div className="flex-1 min-w-0 text-left">
                                    <h3 className="text-white font-medium truncate">{group.name}</h3>
                                    <p className="text-[#8696a0] text-sm truncate">
                                        {group.lastMessageSenderName && group.lastMessagePreview
                                            ? `${group.lastMessageSenderName}: ${group.lastMessagePreview}`
                                            : group.description || `${group.members.length} members`}
                                    </p>
                                </div>
                                <div className="text-[#8696a0] text-xs">
                                    {group.lastMessageAt
                                        ? new Date(group.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                        : ''}
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Mobile only - BottomNav */}
            <div className="lg:hidden">
                <BottomNav activeTab="groups" mobile={mobile} />
            </div>
        </div>
    );

    // Main panel (empty state for group selection)
    const MainPanel = (
        <div className="h-full flex flex-col items-center justify-center bg-[#0a0e12] text-center p-8">
            <div className="w-24 h-24 rounded-full bg-[#2a3942]/50 flex items-center justify-center mb-6">
                <Users className="w-12 h-12 text-[#8696a0]" />
            </div>
            <h2 className="text-2xl font-semibold text-white mb-2">Select a Group</h2>
            <p className="text-[#8696a0] max-w-md">
                Choose a group from the list to start chatting, or create a new group to connect with friends!
            </p>
        </div>
    );

    return (
        <>
            <Head>
                <title>ChatterBox - Groups</title>
            </Head>

            <DesktopLayout
                sidebar={Sidebar}
                main={MainPanel}
                showMain={false}
                activeSection="groups"
            />

            {/* Create Group Modal */}
            {showCreateGroup && (
                <CreateGroupModal
                    myMobile={mobile}
                    onClose={() => setShowCreateGroup(false)}
                    onGroupCreated={handleGroupCreated}
                />
            )}
        </>
    );
}
