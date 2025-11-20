'use client'


import { Entropy } from "@/components/ui/entropy"
import { useIsMobile } from "@/hooks/use-mobile"

export function EntropyDemo() {
    const isMobile = useIsMobile()

    // Bigger on desktop to cover more screen
    const size = isMobile ? 400 : 900

    return (
        <div className="flex flex-col items-center justify-center w-full p-8">
            <div className="flex flex-col items-center relative">
                {/* Entropy with gradient fade to blend into background */}
                <div className="relative">
                    <Entropy className="rounded-lg" size={size} />
                    {/* Gradient overlay to fade edges into black background */}
                    <div
                        className="absolute inset-0 pointer-events-none rounded-lg"
                        style={{
                            background: 'radial-gradient(circle at center, transparent 40%, rgba(0,0,0,0.3) 70%, rgba(0,0,0,0.8) 90%, black 100%)'
                        }}
                    />
                </div>
                <div className="mt-6 text-center relative z-10">
                    <div className="space-y-4 font-mono text-[14px] leading-relaxed">
                        <p className="italic text-purple-300 tracking-wide">
                            &ldquo;Your scattered ideas are kliq away from order&rdquo;
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
