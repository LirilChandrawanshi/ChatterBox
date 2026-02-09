import React from "react";

interface LoaderProps {
    size?: "sm" | "md" | "lg";
    text?: string;
    fullScreen?: boolean;
    overlay?: boolean;
}

export default function Loader({
    size = "md",
    text,
    fullScreen = false,
    overlay = false
}: LoaderProps) {
    const sizeClasses = {
        sm: "w-5 h-5 border-2",
        md: "w-8 h-8 border-3",
        lg: "w-12 h-12 border-4",
    };

    const spinner = (
        <div className="flex flex-col items-center justify-center gap-3">
            <div
                className={`${sizeClasses[size]} border-[#00a884] border-t-transparent rounded-full animate-spin`}
            />
            {text && (
                <p className="text-[#8696a0] text-sm animate-pulse">{text}</p>
            )}
        </div>
    );

    if (fullScreen) {
        return (
            <div className="fixed inset-0 bg-[#0a0e12] flex items-center justify-center z-50">
                {spinner}
            </div>
        );
    }

    if (overlay) {
        return (
            <div className="absolute inset-0 bg-[#0a0e12]/80 backdrop-blur-sm flex items-center justify-center z-40">
                {spinner}
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center py-8">
            {spinner}
        </div>
    );
}

// Inline button loader for submit buttons
export function ButtonLoader() {
    return (
        <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Please wait...</span>
        </div>
    );
}
