import { useState, useEffect } from "react";
import { X, User } from "lucide-react";
import { getUserProfile, type UserProfile } from "@/services/api";

interface ProfileModalProps {
    mobile: string;
    onClose: () => void;
}

export default function ProfileModal({ mobile, onClose }: ProfileModalProps) {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadProfile();
    }, [mobile]);

    const loadProfile = async () => {
        setLoading(true);
        const data = await getUserProfile(mobile);
        setProfile(data);
        setLoading(false);
    };

    const colors = ["#00a884", "#667eea", "#f093fb", "#4facfe", "#43e97b"];
    const getColor = (str: string) =>
        colors[Math.abs(str.split("").reduce((a, c) => a + c.charCodeAt(0), 0)) % colors.length];

    return (
        <div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-[70] p-4 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="bg-[#202c33] rounded-2xl w-full max-w-sm shadow-2xl border border-[#2a3942] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-[#111b21] px-4 py-3 flex items-center justify-between border-b border-[#2a3942]">
                    <h2 className="text-lg font-semibold text-white">Profile</h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-[#2a3942] text-[#8696a0] hover:text-white transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {loading ? (
                        <div className="flex flex-col items-center py-8">
                            <div className="w-8 h-8 border-4 border-[#00a884] border-t-transparent rounded-full animate-spin mb-4"></div>
                            <p className="text-[#8696a0]">Loading profile...</p>
                        </div>
                    ) : profile ? (
                        <div className="flex flex-col items-center">
                            {/* Profile Picture */}
                            <div
                                className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center shadow-xl ring-4 ring-[#2a3942] mb-4"
                                style={{
                                    backgroundColor: profile.profilePicture ? "transparent" : getColor(profile.mobile),
                                }}
                            >
                                {profile.profilePicture ? (
                                    <img
                                        src={profile.profilePicture}
                                        alt={profile.displayName}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="text-3xl font-bold text-white">
                                        {profile.displayName.charAt(0).toUpperCase()}
                                    </span>
                                )}
                            </div>

                            {/* Name */}
                            <h3 className="text-xl font-semibold text-white mb-1">
                                {profile.displayName}
                            </h3>

                            {/* Mobile */}
                            <p className="text-[#8696a0] text-sm mb-4">
                                {profile.mobile}
                            </p>

                            {/* Bio */}
                            {profile.bio && (
                                <div className="w-full bg-[#111b21] rounded-xl p-4 border border-[#2a3942]">
                                    <p className="text-xs text-[#8696a0] uppercase tracking-wider mb-1">About</p>
                                    <p className="text-white text-sm leading-relaxed">
                                        {profile.bio}
                                    </p>
                                </div>
                            )}

                            {!profile.bio && (
                                <div className="w-full bg-[#111b21] rounded-xl p-4 border border-[#2a3942]">
                                    <p className="text-[#8696a0] text-sm text-center italic">
                                        No bio yet
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center py-8">
                            <User className="w-12 h-12 text-[#8696a0] mb-4" />
                            <p className="text-[#8696a0]">User not found</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
