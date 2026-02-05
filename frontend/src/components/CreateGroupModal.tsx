import { useState } from "react";
import { X, Plus, Users, Check } from "lucide-react";
import { createGroup } from "@/services/api";

interface CreateGroupModalProps {
    myMobile: string;
    onClose: () => void;
    onGroupCreated: () => void;
}

export default function CreateGroupModal({ myMobile, onClose, onGroupCreated }: CreateGroupModalProps) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [memberInput, setMemberInput] = useState("");
    const [members, setMembers] = useState<string[]>([]);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState("");

    const handleAddMember = () => {
        if (!memberInput.trim()) return;
        if (members.includes(memberInput.trim())) {
            setMemberInput("");
            return;
        }
        if (memberInput.trim() === myMobile) {
            setError("You are already in the group");
            return;
        }
        setMembers([...members, memberInput.trim()]);
        setMemberInput("");
        setError("");
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setCreating(true);
        try {
            await createGroup(name, description, myMobile, members);
            onGroupCreated();
            onClose();
        } catch (err) {
            console.error(err);
            setError("Failed to create group");
            setCreating(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-gradient-to-b from-[#1f2c34] to-[#1a2332] rounded-2xl w-full max-w-sm p-6 shadow-2xl border border-white/10">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                        <Users className="w-5 h-5 text-[#00a884]" />
                        Create Group
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-white/10 transition"
                    >
                        <X className="w-5 h-5 text-[#8696a0]" />
                    </button>
                </div>

                <form onSubmit={handleCreate}>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-[#8696a0] ml-1 mb-1 block">Group Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Enter group name"
                                className="w-full bg-[#2a3942] border border-transparent rounded-xl px-4 py-3 text-white placeholder-[#8696a0] focus:outline-none focus:ring-1 focus:ring-[#00a884]/50"
                                autoFocus
                            />
                        </div>

                        <div>
                            <label className="text-xs text-[#8696a0] ml-1 mb-1 block">Description (Optional)</label>
                            <input
                                type="text"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="What's this group about?"
                                className="w-full bg-[#2a3942] border border-transparent rounded-xl px-4 py-3 text-white placeholder-[#8696a0] focus:outline-none focus:ring-1 focus:ring-[#00a884]/50"
                            />
                        </div>

                        <div>
                            <label className="text-xs text-[#8696a0] ml-1 mb-1 block">Add Members</label>
                            <div className="flex gap-2">
                                <input
                                    type="tel"
                                    value={memberInput}
                                    onChange={(e) => setMemberInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddMember();
                                        }
                                    }}
                                    placeholder="Mobile number"
                                    className="flex-1 bg-[#2a3942] border border-transparent rounded-xl px-4 py-3 text-white placeholder-[#8696a0] focus:outline-none focus:ring-1 focus:ring-[#00a884]/50"
                                />
                                <button
                                    type="button"
                                    onClick={handleAddMember}
                                    className="p-3 rounded-xl bg-[#2a3942] text-[#00a884] hover:bg-[#202c33] transition"
                                >
                                    <Plus className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Members List */}
                        {members.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {members.map((m) => (
                                    <div key={m} className="px-3 py-1 rounded-full bg-[#00a884]/20 text-[#00a884] text-sm flex items-center gap-1">
                                        <span>{m}</span>
                                        <button
                                            type="button"
                                            onClick={() => setMembers(members.filter((x) => x !== m))}
                                            className="hover:text-white"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {error && <p className="text-red-400 text-sm">{error}</p>}

                        <button
                            type="submit"
                            disabled={creating || !name.trim()}
                            className="w-full py-3 rounded-xl bg-[#00a884] text-white font-bold hover:bg-[#06cf9c] transition shadow-lg disabled:opacity-50 mt-4"
                        >
                            {creating ? "Creating..." : "Create Group"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
