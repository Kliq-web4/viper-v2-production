'use client'


import { Entropy } from "@/components/ui/entropy"

export function EntropyDemo() {
    return (
        <div className="flex flex-col items-center justify-center w-full p-8">
            <div className="flex flex-col items-center">
                <Entropy className="rounded-lg" />
                <div className="mt-6 text-center">
                    <div className="space-y-4 font-mono text-[14px] leading-relaxed">
                        <p className="italic text-text-secondary tracking-wide">
                            &ldquo;Your scattered ideas are kliq away from order&rdquo;
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
