import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { Lightbulb, Sparkles } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { getStoredUser } from "./index";

export default function Think() {
    const router = useRouter();
    const { mobile: queryMobile } = router.query;
    const stored = getStoredUser();
    const myMobile = typeof queryMobile === "string" ? queryMobile : (stored?.mobile ?? "");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!router.isReady) return;
        if (!myMobile) {
            router.replace("/");
        }
    }, [router.isReady, myMobile]);

    if (!mounted || !myMobile) return null;

    return (
        <>
            <Head>
                <title>ChatterBox - Think</title>
            </Head>

            <div className="flex flex-col h-screen bg-[#0a0e12]">
                {/* Header */}
                <header className="bg-gradient-to-r from-[#1a2332] to-[#1f2c34] px-4 py-3 flex items-center border-b border-[#2a3942]/80 shadow-lg">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center text-white shadow-lg ring-2 ring-white/10">
                            <Lightbulb className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-lg font-semibold text-white">Think</h1>
                            <p className="text-xs text-[#8696a0]">Brainstorm ideas</p>
                        </div>
                    </div>
                </header>

                {/* Content */}
                <div className="flex-1 overflow-y-auto pb-20 flex items-center justify-center">
                    <div className="text-center p-8">
                        <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-[#667eea]/20 to-[#764ba2]/20 flex items-center justify-center mb-6 animate-pulse">
                            <Sparkles className="w-12 h-12 text-[#667eea]" />
                        </div>
                        <h2 className="text-xl font-semibold text-white mb-2">Coming Soon</h2>
                        <p className="text-[#8696a0] max-w-xs mx-auto leading-relaxed">
                            A space to brainstorm, organize your thoughts, and get AI-powered suggestions.
                        </p>
                        <div className="mt-8 flex flex-wrap justify-center gap-3">
                            <span className="px-4 py-2 rounded-full bg-[#1f2c34] text-[#8696a0] text-sm border border-[#2a3942]/50">
                                💡 Ideas
                            </span>
                            <span className="px-4 py-2 rounded-full bg-[#1f2c34] text-[#8696a0] text-sm border border-[#2a3942]/50">
                                ✨ AI Assist
                            </span>
                            <span className="px-4 py-2 rounded-full bg-[#1f2c34] text-[#8696a0] text-sm border border-[#2a3942]/50">
                                📝 Notes
                            </span>
                        </div>
                    </div>
                </div>

                {/* Bottom Navigation */}
                <BottomNav activeTab="think" mobile={myMobile} />
            </div>
        </>
    );
}
