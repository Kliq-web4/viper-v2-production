"use client";

import { LayoutDashboard, Gamepad2, Users, Box, Share2 } from "lucide-react";
import { GlowingEffect } from "@/components/ui/glowing-effect";

import { Badge } from "@/components/ui/badge";

export function TemplatesDemo({ onTemplateClick }: { onTemplateClick?: (prompt: string) => void }) {
    const templates = [
        {
            title: 'Reporting Dashboard',
            description: 'KPIs, charts and filters',
            icon: <LayoutDashboard className="h-6 w-6" />,
            prompt: 'Ask Kliq AI to create a comprehensive reporting dashboard with key performance indicators (KPIs), interactive charts for data visualization, advanced filtering options, date range selectors, and export functionality. Include a clean layout with sidebar navigation, summary cards at the top showing key metrics, and detailed data tables below.'
        },
        {
            title: 'Gaming Platform',
            description: 'Lobby, matchmaking, leaderboards',
            icon: <Gamepad2 className="h-6 w-6" />,
            prompt: 'Ask Kliq AI to build a full-featured gaming platform with a lobby system where players can create and join rooms, real-time matchmaking functionality, comprehensive leaderboards showing top players with rankings and statistics, player profiles with game history, and a chat system for players to communicate. Include game session management and score tracking.'
        },
        {
            title: 'Onboarding Portal',
            description: 'Sign-up flows and checklists',
            icon: <Users className="h-6 w-6" />,
            prompt: 'Ask Kliq AI to create an onboarding portal with multi-step sign-up forms, user verification flows, interactive checklists to guide new users through setup, progress tracking, and welcome tutorials. Include email verification, profile completion steps, and a dashboard that shows onboarding progress with clear next steps.'
        },
        {
            title: 'Room Visualizer',
            description: 'Interactive layout editor',
            icon: <Box className="h-6 w-6" />,
            prompt: 'Ask Kliq AI to build an interactive room visualizer where users can drag and drop furniture, adjust room dimensions, apply different floor plans, change wall colors and textures, save multiple room designs, and export layouts as images. Include a toolbar with furniture items, measurement tools, and a 3D preview option.'
        },
        {
            title: 'Networking App',
            description: 'Profiles, posts and connections',
            icon: <Share2 className="h-6 w-6" />,
            prompt: 'Ask Kliq AI to create a professional networking application with user profiles featuring bio, skills, and experience, a feed system for posting updates and sharing content, connection requests and messaging, search functionality to find people by skills or industry, and event creation for networking meetups. Include notifications and activity feeds.'
        },
    ];

    return (
        <ul className="grid grid-cols-1 grid-rows-none gap-4 md:grid-cols-3 lg:gap-6">
            {templates.map((template, index) => (
                <GridItem
                    key={index}
                    icon={template.icon}
                    title={template.title}
                    onClick={() => onTemplateClick?.(template.prompt)}
                />
            ))}
        </ul>
    );
}

interface GridItemProps {
    icon: React.ReactNode;
    title: string;
    onClick?: () => void;
}

const GridItem = ({ icon, title, onClick }: GridItemProps) => {
    return (
        <li className="list-none group cursor-pointer" onClick={onClick}>
            <div className="relative h-full rounded-[1.25rem] border-[0.75px] border-purple-700/30 p-2 md:rounded-[1.5rem] md:p-3 transition-transform duration-300 hover:scale-[1.02]">
                <GlowingEffect
                    spread={40}
                    glow={true}
                    disabled={false}
                    proximity={64}
                    inactiveZone={0.01}
                    borderWidth={3}
                    variant="purple"
                />
                <div className="relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-xl border-[0.75px] bg-black border-purple-800/40 p-6 shadow-sm shadow-purple-950/50 md:p-6">
                    <div className="absolute top-4 left-4 z-10">
                        <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-purple-800/50 border-purple-700/50 text-purple-200 font-mono rounded-md">Template</Badge>
                    </div>

                    <div className="relative flex flex-1 flex-col justify-center items-center text-center gap-4 pt-8">
                        <div className="w-fit rounded-lg border-[0.75px] border-purple-700/40 bg-purple-950/50 p-3 group-hover:border-purple-600 group-hover:bg-purple-700/40 transition-all duration-300">
                            <div className="text-purple-300">
                                {icon}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-lg font-semibold font-mono tracking-tight text-purple-100 group-hover:text-white transition-colors">
                                {title}
                            </h3>
                            <div className="inline-block bg-blue-900/30 text-blue-200 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
                                Click to start
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </li>
    );
};
