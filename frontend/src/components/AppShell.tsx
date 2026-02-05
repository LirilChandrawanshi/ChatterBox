import { ReactNode } from "react";

interface AppShellProps {
    children: ReactNode;
    className?: string;
}

/**
 * AppShell - Responsive layout wrapper
 * - Mobile: Full width, full height
 * - Tablet: Centered with max-width
 * - Desktop: Centered with phone-like container
 */
export default function AppShell({ children, className = "" }: AppShellProps) {
    return (
        <div className="min-h-screen min-h-[100dvh] bg-[#0a0e12] flex items-center justify-center">
            {/* Phone-like container for tablet/desktop */}
            <div
                className={`
          w-full h-screen h-[100dvh]
          md:max-w-[480px] md:h-[90vh] md:max-h-[900px] md:min-h-[600px]
          md:rounded-3xl md:overflow-hidden md:shadow-2xl md:shadow-black/50
          md:border md:border-[#2a3942]/50
          lg:max-w-[420px]
          ${className}
        `}
            >
                {children}
            </div>
        </div>
    );
}
