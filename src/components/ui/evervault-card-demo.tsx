"use client";
import { EvervaultCard, Icon } from "@/components/ui/evervault-card";

export function EvervaultCardDemo() {
    return (
        <div className="border border-purple-500/30 dark:border-purple-400/30 flex flex-col items-start max-w-sm mx-auto p-4 relative h-[30rem] bg-purple-900/20 rounded-xl">
            <Icon className="absolute h-6 w-6 -top-3 -left-3 dark:text-purple-200 text-purple-800" />
            <Icon className="absolute h-6 w-6 -bottom-3 -left-3 dark:text-purple-200 text-purple-800" />
            <Icon className="absolute h-6 w-6 -top-3 -right-3 dark:text-purple-200 text-purple-800" />
            <Icon className="absolute h-6 w-6 -bottom-3 -right-3 dark:text-purple-200 text-purple-800" />

            <EvervaultCard text="secure" className="bg-purple-800/30" />

            <h2 className="dark:text-purple-200 text-purple-800 mt-4 text-sm font-light">
                Visualizing the encryption layer that protects your data.
            </h2>
            <p className="text-sm border font-light dark:border-purple-400/20 border-purple-800/20 rounded-full mt-4 text-purple-800 dark:text-purple-200 px-2 py-0.5">
                AES-256 Encryption
            </p>
        </div>
    );
}
