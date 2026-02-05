import { useRouter } from "next/router";
import { MessageCircle, Lightbulb, Settings } from "lucide-react";

type TabId = "think" | "chats" | "settings";

interface Tab {
    id: TabId;
    label: string;
    icon: React.ReactNode;
    path: string;
}

interface BottomNavProps {
    activeTab: TabId;
    mobile: string;
}

export default function BottomNav({ activeTab, mobile }: BottomNavProps) {
    const router = useRouter();

    const tabs: Tab[] = [
        {
            id: "think",
            label: "Think",
            icon: <Lightbulb className="w-6 h-6" />,
            path: "/think",
        },
        {
            id: "chats",
            label: "Chats",
            icon: <MessageCircle className="w-6 h-6" />,
            path: "/chats",
        },
        {
            id: "settings",
            label: "Settings",
            icon: <Settings className="w-6 h-6" />,
            path: "/settings",
        },
    ];

    const handleTabClick = (tab: Tab) => {
        router.push(`${tab.path}?mobile=${encodeURIComponent(mobile)}`);
    };

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-[#0d1117] to-[#1a2332] border-t border-[#2a3942]/80 z-50">
            <div className="flex items-center justify-around max-w-lg mx-auto">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => handleTabClick(tab)}
                            className={`flex flex-col items-center py-3 px-6 transition-all duration-200 ${isActive
                                    ? "text-[#00a884]"
                                    : "text-[#8696a0] hover:text-white"
                                }`}
                        >
                            <div
                                className={`relative transition-transform duration-200 ${isActive ? "scale-110" : ""
                                    }`}
                            >
                                {tab.icon}
                                {isActive && (
                                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#00a884]" />
                                )}
                            </div>
                            <span
                                className={`text-xs mt-1 font-medium transition-all duration-200 ${isActive ? "opacity-100" : "opacity-70"
                                    }`}
                            >
                                {tab.label}
                            </span>
                        </button>
                    );
                })}
            </div>
            {/* Safe area for mobile devices */}
            <div className="h-safe-area-inset-bottom bg-[#0d1117]" />
        </nav>
    );
}
