import { useEffect, useState, useRef, ChangeEvent } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { Settings as SettingsIcon, Camera, Check, LogOut, User, Pencil } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { getStoredUser, setStoredUser } from "./index";
import { clearToken, updateDisplayName, updateProfilePicture, getProfilePicture } from "@/services/api";

export default function Settings() {
    const router = useRouter();
    const { mobile: queryMobile } = router.query;
    const stored = getStoredUser();
    const myMobile = typeof queryMobile === "string" ? queryMobile : (stored?.mobile ?? "");
    const [mounted, setMounted] = useState(false);

    const [displayName, setDisplayName] = useState(stored?.displayName ?? "");
    const [isEditingName, setIsEditingName] = useState(false);
    const [isSavingName, setIsSavingName] = useState(false);
    const [profilePicture, setProfilePicture] = useState<string | null>(null);
    const [isUploadingPicture, setIsUploadingPicture] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");

    const fileInputRef = useRef<HTMLInputElement>(null);
    const nameInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!router.isReady) return;
        if (!myMobile) {
            router.replace("/");
            return;
        }
        // Load profile picture
        getProfilePicture(myMobile).then((pic) => {
            if (pic) setProfilePicture(pic);
        }).catch(() => { });
    }, [router.isReady, myMobile]);

    useEffect(() => {
        if (isEditingName && nameInputRef.current) {
            nameInputRef.current.focus();
        }
    }, [isEditingName]);

    const showSuccess = (msg: string) => {
        setSuccessMessage(msg);
        setTimeout(() => setSuccessMessage(""), 3000);
    };

    const handleSaveName = async () => {
        if (!displayName.trim() || displayName.trim() === stored?.displayName) {
            setIsEditingName(false);
            return;
        }
        setIsSavingName(true);
        try {
            await updateDisplayName(myMobile, displayName.trim());
            setStoredUser(myMobile, displayName.trim());
            showSuccess("Name updated!");
        } catch {
            // If API fails, still update locally for demo
            setStoredUser(myMobile, displayName.trim());
            showSuccess("Name updated locally!");
        } finally {
            setIsSavingName(false);
            setIsEditingName(false);
        }
    };

    const handlePictureChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith("image/")) {
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            return;
        }

        setIsUploadingPicture(true);
        try {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64 = reader.result as string;
                setProfilePicture(base64);
                try {
                    await updateProfilePicture(myMobile, base64);
                    showSuccess("Profile picture updated!");
                } catch {
                    // If API fails, still show locally for demo
                    showSuccess("Picture updated locally!");
                }
                setIsUploadingPicture(false);
            };
            reader.readAsDataURL(file);
        } catch {
            setIsUploadingPicture(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("chatterbox_user");
        clearToken();
        router.push("/");
    };

    if (!mounted || !myMobile) return null;

    return (
        <>
            <Head>
                <title>ChatterBox - Settings</title>
            </Head>

            <div className="flex flex-col h-screen bg-[#0a0e12]">
                {/* Header */}
                <header className="bg-gradient-to-r from-[#1a2332] to-[#1f2c34] px-4 py-3 flex items-center border-b border-[#2a3942]/80 shadow-lg">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#00a884] to-[#008f72] flex items-center justify-center text-white shadow-lg ring-2 ring-white/10">
                            <SettingsIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-lg font-semibold text-white">Settings</h1>
                            <p className="text-xs text-[#8696a0]">Manage your profile</p>
                        </div>
                    </div>
                </header>

                {/* Success Toast */}
                {successMessage && (
                    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
                        <div className="bg-[#00a884] text-white px-4 py-2 rounded-xl shadow-lg flex items-center gap-2">
                            <Check className="w-4 h-4" />
                            <span className="text-sm font-medium">{successMessage}</span>
                        </div>
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-y-auto pb-20">
                    {/* Profile Section */}
                    <div className="p-6">
                        <div className="flex flex-col items-center">
                            {/* Profile Picture */}
                            <div className="relative mb-4">
                                <div
                                    className={`w-28 h-28 rounded-full overflow-hidden bg-gradient-to-br from-[#00a884] to-[#008f72] flex items-center justify-center shadow-xl ring-4 ring-[#1f2c34] ${isUploadingPicture ? 'animate-pulse' : ''}`}
                                >
                                    {profilePicture ? (
                                        <img
                                            src={profilePicture}
                                            alt="Profile"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <User className="w-14 h-14 text-white/80" />
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploadingPicture}
                                    className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-[#00a884] hover:bg-[#06cf9c] text-white flex items-center justify-center shadow-lg transition-colors disabled:opacity-50"
                                >
                                    <Camera className="w-5 h-5" />
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handlePictureChange}
                                    className="hidden"
                                />
                            </div>

                            {/* Display Name */}
                            <div className="w-full max-w-xs">
                                {isEditingName ? (
                                    <div className="flex items-center gap-2">
                                        <input
                                            ref={nameInputRef}
                                            type="text"
                                            value={displayName}
                                            onChange={(e) => setDisplayName(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") handleSaveName();
                                                if (e.key === "Escape") setIsEditingName(false);
                                            }}
                                            className="flex-1 bg-[#2a3942] border border-[#00a884] rounded-xl px-4 py-2 text-white text-center focus:outline-none focus:ring-2 focus:ring-[#00a884]/50"
                                            maxLength={50}
                                        />
                                        <button
                                            type="button"
                                            onClick={handleSaveName}
                                            disabled={isSavingName}
                                            className="w-10 h-10 rounded-full bg-[#00a884] hover:bg-[#06cf9c] text-white flex items-center justify-center transition-colors disabled:opacity-50"
                                        >
                                            {isSavingName ? (
                                                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <Check className="w-5 h-5" />
                                            )}
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => setIsEditingName(true)}
                                        className="w-full flex items-center justify-center gap-2 group"
                                    >
                                        <span className="text-xl font-semibold text-white">{displayName || myMobile}</span>
                                        <Pencil className="w-4 h-4 text-[#8696a0] group-hover:text-[#00a884] transition-colors" />
                                    </button>
                                )}
                            </div>

                            {/* Mobile Number */}
                            <p className="text-[#8696a0] text-sm mt-2">{myMobile}</p>
                        </div>
                    </div>

                    {/* Menu Items */}
                    <div className="px-4">
                        <div className="bg-[#1f2c34] rounded-2xl overflow-hidden border border-[#2a3942]/50">
                            {/* Account Info */}
                            <div className="px-4 py-4 border-b border-[#2a3942]/50">
                                <h3 className="text-[#8696a0] text-xs uppercase tracking-wider mb-1">Account</h3>
                                <p className="text-white text-sm">Mobile Number: {myMobile}</p>
                            </div>

                            {/* Logout Button */}
                            <button
                                type="button"
                                onClick={handleLogout}
                                className="w-full px-4 py-4 flex items-center gap-3 text-red-400 hover:bg-[#2a3942]/50 transition-colors"
                            >
                                <LogOut className="w-5 h-5" />
                                <span className="font-medium">Log out</span>
                            </button>
                        </div>

                        {/* App Info */}
                        <div className="mt-6 text-center">
                            <p className="text-[#8696a0] text-xs">ChatterBox v1.0.0</p>
                            <p className="text-[#8696a0]/50 text-xs mt-1">Made with ❤️</p>
                        </div>
                    </div>
                </div>

                {/* Bottom Navigation */}
                <BottomNav activeTab="settings" mobile={myMobile} />
            </div>
        </>
    );
}
