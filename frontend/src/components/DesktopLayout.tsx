import { ReactNode, useState, useEffect } from "react";

interface DesktopLayoutProps {
    sidebar: ReactNode;
    main: ReactNode;
    showMain?: boolean;
}

/**
 * DesktopLayout - WhatsApp Web-style split view
 * Shows sidebar + main panel on desktop, single view on mobile
 */
export default function DesktopLayout({ sidebar, main, showMain = true }: DesktopLayoutProps) {
    const [isDesktop, setIsDesktop] = useState(false);

    useEffect(() => {
        const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024);
        checkDesktop();
        window.addEventListener("resize", checkDesktop);
        return () => window.removeEventListener("resize", checkDesktop);
    }, []);

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
                    {/* Sidebar - Chat list */}
                    <div className="w-[340px] xl:w-[380px] h-full flex-shrink-0 border-r border-white/5 bg-[#111827]/50">
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
