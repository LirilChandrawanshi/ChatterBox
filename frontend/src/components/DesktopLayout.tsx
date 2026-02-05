import { ReactNode, useState, useEffect } from "react";
import { useRouter } from "next/router";
import { MessageCircle, Disc, Users, Settings, UsersRound } from "lucide-react";

interface DesktopLayoutProps {
    sidebar: ReactNode;
    main: ReactNode;
    showMain?: boolean;
    activeSection?: "chats" | "status" | "community" | "groups" | "settings";
}

/**
 * DesktopLayout - WhatsApp Web-style split view with left icon sidebar
 * Shows icon nav + sidebar + main panel on desktop, single view on mobile
 */
export default function DesktopLayout({ sidebar, main, showMain = true, activeSection = "chats" }: DesktopLayoutProps) {
    const [isDesktop, setIsDesktop] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth >= 1024;
        }
        return false;
    });
    const router = useRouter();
    const { mobile } = router.query;
    const myMobile = typeof mobile === "string" ? mobile : "";

    useEffect(() => {
        const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024);
        checkDesktop();
        window.addEventListener("resize", checkDesktop);
        return () => window.removeEventListener("resize", checkDesktop);
    }, []);

    const navItems = [
        { id: "chats", icon: MessageCircle, label: "Chats", path: "/desktop" },
        { id: "status", icon: Disc, label: "Status", path: "/status" },
        { id: "community", icon: Users, label: "Community", path: "/community" },
        { id: "groups", icon: UsersRound, label: "Groups", path: "/groups" },
        { id: "settings", icon: Settings, label: "Settings", path: "/settings" },
    ];

    const handleNavClick = (path: string) => {
        router.push(`${path}?mobile=${encodeURIComponent(myMobile)}`);
    };

    // Mobile: show only sidebar or main (based on showMain prop)
    if (!isDesktop) {
        return <>{showMain ? main : sidebar}</>;
    }

    // Desktop: side-by-side layout with beautiful gradient background
    return (
        <div className="h-screen w-full bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] overflow-hidden">
            {/* Animated gradient orbs in background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
            </div>

            {/* Main container with glassmorphism */}
            <div className="relative h-full w-full max-w-[1400px] mx-auto p-4 md:p-6 lg:p-8 flex items-center justify-center">
                <div className="w-full h-full max-h-[900px] flex rounded-3xl overflow-hidden shadow-2xl shadow-black/40 backdrop-blur-xl bg-[#0a0e12]/90 border border-white/10">
                    {/* Left Icon Navigation Sidebar */}
                    <div className="w-16 h-full flex-shrink-0 bg-[#0d1117] border-r border-white/5 flex flex-col py-4">
                        <div className="flex-1 flex flex-col items-center gap-2">
                            {navItems.slice(0, 4).map((item) => {
                                const Icon = item.icon;
                                const isActive = activeSection === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => handleNavClick(item.path)}
                                        className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${isActive
                                            ? "bg-[#00a884]/20 text-[#00a884]"
                                            : "text-[#8696a0] hover:bg-white/5 hover:text-white"
                                            }`}
                                        title={item.label}
                                    >
                                        <Icon className="w-5 h-5" />
                                    </button>
                                );
                            })}
                        </div>
                        {/* Settings at bottom */}
                        <div className="flex flex-col items-center">
                            <button
                                type="button"
                                onClick={() => handleNavClick("/settings")}
                                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${activeSection === "settings"
                                    ? "bg-[#00a884]/20 text-[#00a884]"
                                    : "text-[#8696a0] hover:bg-white/5 hover:text-white"
                                    }`}
                                title="Settings"
                            >
                                <Settings className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Sidebar - Content panel */}
                    <div className="w-[320px] xl:w-[360px] h-full flex-shrink-0 border-r border-white/5 bg-[#111827]/50">
                        {sidebar}
                    </div>

                    {/* Main panel - Conversation */}
                    <div className="flex-1 h-full bg-[#0a0e12]/70 backdrop-blur-sm">
                        {main}
                    </div>
                </div>
            </div>
        </div>
    );
}
