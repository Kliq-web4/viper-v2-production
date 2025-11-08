import { useRef, useState, useEffect, useMemo } from 'react';
import { ArrowRight, Info, LayoutDashboard, Gamepad2, Users, Box, Share2, Rocket, Puzzle, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useAuth } from '@/contexts/auth-context';
import {
	AgentModeToggle,
	type AgentMode,
} from '../components/agent-mode-toggle';
import { useAuthGuard } from '../hooks/useAuthGuard';
import { usePaginatedApps } from '@/hooks/use-paginated-apps';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import { AppCard } from '@/components/shared/AppCard';
import clsx from 'clsx';
import { useImageUpload } from '@/hooks/use-image-upload';
import { useDragDrop } from '@/hooks/use-drag-drop';
import { ImageUploadButton } from '@/components/image-upload-button';
import { ImageAttachmentPreview } from '@/components/image-attachment-preview';
import { SUPPORTED_IMAGE_MIME_TYPES } from '@/api-types';
import { Component as EtheralShadow } from '@/components/ui/etheral-shadow';
import { LiquidBackground } from '@/components/ui/liquid-background';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import openaiLogo from '@/assets/provider-logos/openai.svg';
import anthropicLogo from '@/assets/provider-logos/anthropic.svg';
import googleLogo from '@/assets/provider-logos/google.svg';
import cloudflareLogo from '@/assets/provider-logos/cloudflare.svg';
import cerebrasLogo from '@/assets/provider-logos/cerebras.svg';

export default function Home() {
	const navigate = useNavigate();
	const { requireAuth } = useAuthGuard();
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const [agentMode, setAgentMode] = useState<AgentMode>('deterministic');
	const [query, setQuery] = useState('');
	const { user } = useAuth();

	const { images, addImages, removeImage, clearImages, isProcessing } = useImageUpload({
		onError: (error) => {
			// TODO: Show error toast/notification
			console.error('Image upload error:', error);
		},
	});

	const { isDragging, dragHandlers } = useDragDrop({
		onFilesDropped: addImages,
		accept: [...SUPPORTED_IMAGE_MIME_TYPES],
	});

	const placeholderPhrases = useMemo(() => [
		"todo list app",
		"F1 fantasy game",
		"personal finance tracker"
	], []);
	const [currentPlaceholderPhraseIndex, setCurrentPlaceholderPhraseIndex] = useState(0);
	const [currentPlaceholderText, setCurrentPlaceholderText] = useState("");
	const [isPlaceholderTyping, setIsPlaceholderTyping] = useState(true);

	const {
		apps,
		loading,
	} = usePaginatedApps({
		type: 'public',
		defaultSort: 'popular',
		defaultPeriod: 'week',
		limit: 6,
	});

	// Discover section should appear only when enough apps are available and loading is done
	const discoverReady = useMemo(() => !loading && (apps?.length ?? 0) > 5, [loading, apps]);

	const handleCreateApp = (query: string, mode: AgentMode) => {
		const encodedQuery = encodeURIComponent(query);
		const encodedMode = encodeURIComponent(mode);
		// Encode images as JSON if present
		const imageParam = images.length > 0 ? `&images=${encodeURIComponent(JSON.stringify(images))}` : '';
		const intendedUrl = `/chat/new?query=${encodedQuery}&agentMode=${encodedMode}${imageParam}`;

		if (
			!requireAuth({
				requireFullAuth: true,
				actionContext: 'to create applications',
				intendedUrl: intendedUrl,
			})
		) {
			return;
		}

		// User is already authenticated, navigate immediately
		navigate(intendedUrl);
		// Clear images after navigation
		clearImages();
	};

	// Auto-resize textarea based on content
	const adjustTextareaHeight = () => {
		if (textareaRef.current) {
			textareaRef.current.style.height = 'auto';
			const scrollHeight = textareaRef.current.scrollHeight;
			const maxHeight = 300; // Maximum height in pixels
			textareaRef.current.style.height =
				Math.min(scrollHeight, maxHeight) + 'px';
		}
	};

	useEffect(() => {
		adjustTextareaHeight();
	}, []);

	// Typewriter effect
	useEffect(() => {
		const currentPhrase = placeholderPhrases[currentPlaceholderPhraseIndex];

		if (isPlaceholderTyping) {
			if (currentPlaceholderText.length < currentPhrase.length) {
				const timeout = setTimeout(() => {
					setCurrentPlaceholderText(currentPhrase.slice(0, currentPlaceholderText.length + 1));
				}, 100); // Typing speed
				return () => clearTimeout(timeout);
			} else {
				// Pause before erasing
				const timeout = setTimeout(() => {
					setIsPlaceholderTyping(false);
				}, 2000); // Pause duration
				return () => clearTimeout(timeout);
			}
		} else {
			if (currentPlaceholderText.length > 0) {
				const timeout = setTimeout(() => {
					setCurrentPlaceholderText(currentPlaceholderText.slice(0, -1));
				}, 50); // Erasing speed
				return () => clearTimeout(timeout);
			} else {
				// Move to next phrase
				setCurrentPlaceholderPhraseIndex((prev) => (prev + 1) % placeholderPhrases.length);
				setIsPlaceholderTyping(true);
			}
		}
	}, [currentPlaceholderText, currentPlaceholderPhraseIndex, isPlaceholderTyping, placeholderPhrases]);

	const discoverLinkRef = useRef<HTMLDivElement>(null);

	const templates = [
		{ title: 'Reporting Dashboard', description: 'KPIs, charts and filters', icon: LayoutDashboard },
		{ title: 'Gaming Platform', description: 'Lobby, matchmaking, leaderboards', icon: Gamepad2 },
		{ title: 'Onboarding Portal', description: 'Sign-up flows and checklists', icon: Users },
		{ title: 'Room Visualizer', description: 'Interactive layout editor', icon: Box },
		{ title: 'Networking App', description: 'Profiles, posts and connections', icon: Share2 },
	] as const;

	const features = [
		{ title: 'Create at the speed of thought', description: 'Describe what you need. We scaffold pages, flows and components automatically.', icon: Rocket },
		{ title: 'Flexible building blocks', description: 'Cards, forms, tables and charts built with our UI kit to customize quickly.', icon: Puzzle },
		{ title: 'Preview and iterate fast', description: 'Run instantly, tweak text or data, and refine with each prompt.', icon: Sparkles },
	] as const;

	return (
		<div className="relative flex flex-col items-center size-full">
			{/* Mystic purple animated background */}
			<div className="fixed inset-0 z-0 pointer-events-none">
				<EtheralShadow
					className="w-full h-full"
					color="rgba(139, 92, 246, 0.65)"
					animation={{ scale: 80, speed: 75 }}
					noise={{ opacity: 0.45, scale: 1 }}
					sizing="fill"
				/>
				<LiquidBackground className="w-full h-full" opacity={0.28} speed={1.2} />
			</div>

			<LayoutGroup>
				<div className="rounded-md w-full max-w-2xl overflow-hidden">
					<motion.div
						layout
						transition={{ layout: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }}
						className={clsx(
							"px-6 p-8 flex flex-col items-center z-10",
							discoverReady ? "mt-48" : "mt-[20vh] sm:mt-[24vh] md:mt-[28vh]"
						)}>
						<h1 className="text-shadow-sm text-shadow-red-200 dark:text-shadow-red-900 text-accent font-medium leading-[1.1] tracking-tight text-5xl w-full mb-2 bg-clip-text bg-gradient-to-r from-text-primary to-text-primary/90">
							Turn ideas into working apps in minutes
						</h1>
						<p className="text-text-secondary w-full mb-6">
							Describe what you want. We generate a runnable app you can edit and share.
						</p>

						<form
							method="POST"
							onSubmit={(e) => {
								e.preventDefault();
								const query = textareaRef.current!.value;
								handleCreateApp(query, agentMode);
							}}
className="group relative overflow-hidden flex z-10 flex-col w-full min-h-[150px] bg-bg-4/70 dark:bg-bg-2/70 backdrop-blur supports-backdrop:backdrop-blur-md border border-accent/30 dark:border-accent/40 rounded-[18px] shadow-[0_10px_50px_-20px_rgba(139,92,246,0.35)] p-5 transition-all duration-200"
						>
							{/* subtle animated gradient on hover */}
							<div className="pointer-events-none absolute -inset-px rounded-[18px] opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: 'radial-gradient(120% 120% at 50% 0%, rgba(139,92,246,0.25) 0%, rgba(139,92,246,0.06) 40%, transparent 70%)' }} />
							<div 
								className={clsx(
									"flex-1 flex flex-col relative",
									isDragging && "ring-2 ring-accent ring-offset-2 rounded-lg"
								)}
								{...dragHandlers}
							>
								{isDragging && (
									<div className="absolute inset-0 flex items-center justify-center bg-accent/10 backdrop-blur-sm rounded-lg z-30 pointer-events-none">
										<p className="text-accent font-medium">Drop images here</p>
									</div>
								)}
								<textarea
									className="w-full resize-none ring-0 z-20 outline-0 placeholder:text-text-primary/60 text-text-primary"
									name="query"
									value={query}
									placeholder={`Create a ${currentPlaceholderText}`}
									ref={textareaRef}
									onChange={(e) => {
										setQuery(e.target.value);
										adjustTextareaHeight();
									}}
									onInput={adjustTextareaHeight}
									onKeyDown={(e) => {
										if (e.key === 'Enter' && !e.shiftKey) {
											e.preventDefault();
											const query = textareaRef.current!.value;
											handleCreateApp(query, agentMode);
										}
									}}
								/>
								{images.length > 0 && (
									<div className="mt-3">
										<ImageAttachmentPreview
											images={images}
											onRemove={removeImage}
										/>
									</div>
								)}
							</div>
							<div className="flex items-center justify-between mt-4 pt-1">
								{import.meta.env.VITE_AGENT_MODE_ENABLED ? (
									<AgentModeToggle
										value={agentMode}
										onChange={setAgentMode}
										className="flex-1"
									/>
								) : (
									<div></div>
								)}

								<div className="flex items-center justify-end ml-4 gap-2">
									<ImageUploadButton
										onFilesSelected={addImages}
										disabled={isProcessing}
									/>
									<button
										type="submit"
										disabled={!query.trim()}
										className="bg-accent text-white p-1 rounded-md *:size-5 transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
									>
										<ArrowRight />
									</button>
								</div>
							</div>
						</form>
					</motion.div>
				</div>

				{/* Templates section (wide) */}
				<section className="w-full max-w-6xl mx-auto px-4 z-10 mt-10 md:mt-14">
					<p className="text-sm text-text-tertiary">Not sure where to start? Try one of these:</p>
					<div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-5 xl:gap-6">
						{templates.map(({ title, description, icon: Icon }) => (
							<motion.div
								key={title}
								initial={{ opacity: 0, y: 8 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true, amount: 0.2 }}
								transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
								className="h-full"
							>
								<Card className="h-full group relative overflow-hidden border-accent/30 dark:border-accent/40 bg-bg-4/60 dark:bg-bg-2/60 backdrop-blur supports-backdrop:backdrop-blur-md transition-colors">
									<div className="pointer-events-none absolute inset-0 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: 'radial-gradient(60% 120% at 50% 0%, rgba(139,92,246,0.25) 0%, rgba(139,92,246,0.05) 60%, transparent 100%)' }} />
									<CardHeader variant="minimal" className="flex-row items-center gap-2">
										<div className="size-7 rounded-md bg-accent/15 text-accent/90 flex items-center justify-center ring-1 ring-accent/30">
											<Icon className="size-4" />
										</div>
										<CardTitle className="text-sm">{title}</CardTitle>
									</CardHeader>
									<CardContent className="pt-0">
										<CardDescription className="text-xs">{description}</CardDescription>
										<div className="mt-3">
											<Button variant="ghost" size="sm" onClick={() => handleCreateApp(title, agentMode)}>
												Use template <ArrowRight className="size-4" />
											</Button>
										</div>
									</CardContent>
								</Card>
							</motion.div>
						))}
					</div>
				</section>

				{/* Trust logos (wide) */}
				<section className="w-full max-w-5xl mx-auto px-4 z-10 mt-8 md:mt-10">
					<p className="text-xs text-text-tertiary text-center">Trusted by teams building with</p>
					<div className="mt-3 flex flex-wrap items-center justify-center gap-8 opacity-80">
						<img src={openaiLogo} alt="OpenAI" className="h-6" />
						<img src={anthropicLogo} alt="Anthropic" className="h-6" />
						<img src={googleLogo} alt="Google" className="h-6" />
						<img src={cloudflareLogo} alt="Cloudflare" className="h-6" />
						<img src={cerebrasLogo} alt="Cerebras" className="h-6" />
					</div>
				</section>

				{/* Features section */}
				<section className="w-full max-w-6xl mx-auto px-4 z-10 mt-10">
					<h2 className="text-2xl font-medium text-text-secondary/90">Consider yourself limitless.</h2>
					<div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-6">
{features.map(({ title, description, icon: Icon }) => (
							<motion.div key={title} whileHover={{ y: -2 }}>
								<Card className="group relative overflow-hidden border-accent/30 dark:border-accent/40 bg-bg-4/60 dark:bg-bg-2/60 backdrop-blur supports-backdrop:backdrop-blur-md">
									<div className="pointer-events-none absolute inset-0 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: 'radial-gradient(60% 120% at 50% 0%, rgba(139,92,246,0.22) 0%, rgba(139,92,246,0.05) 60%, transparent 100%)' }} />
									<CardHeader>
										<div className="size-8 rounded-md bg-accent/15 text-accent/90 flex items-center justify-center mb-2 ring-1 ring-accent/30">
											<Icon className="size-4" />
										</div>
										<CardTitle className="text-base">{title}</CardTitle>
										<CardDescription>{description}</CardDescription>
									</CardHeader>
								</Card>
							</motion.div>
						))}
					</div>
				</section>

				{/* Images beta notice */}
				<AnimatePresence>
					{images.length > 0 && (
						<motion.div
							initial={{ opacity: 0, y: -10 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -10 }}
							className="w-full max-w-2xl px-6"
						>
							<div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-bg-4/50 dark:bg-bg-2/50 border border-accent/20 dark:border-accent/30 shadow-sm">
								<Info className="size-4 text-accent flex-shrink-0 mt-0.5" />
								<p className="text-xs text-text-tertiary leading-relaxed">
									<span className="font-medium text-text-secondary">Images Beta:</span> Images guide app layout and design but may not be replicated exactly. The coding agent cannot access images directly for app assets.
								</p>
							</div>
						</motion.div>
					)}
				</AnimatePresence>

				{/* Discover section */}
				<AnimatePresence>
					{discoverReady && (
						<motion.section
							key="discover-section"
							layout
							initial={{ opacity: 0, height: 0 }}
							animate={{ opacity: 1, height: "auto" }}
							exit={{ opacity: 0, height: 0 }}
							transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
							className={clsx('max-w-6xl mx-auto px-4 z-10', images.length > 0 ? 'mt-10' : 'mt-16 mb-8')}
						>
							<div className='flex flex-col items-start'>
								<h2 className="text-2xl font-medium text-text-secondary/80">Discover Apps built by the community</h2>
								<div ref={discoverLinkRef} className="text-md font-light mb-4 text-text-tertiary hover:underline underline-offset-4 select-text cursor-pointer" onClick={() => navigate('/discover')} >View All</div>
								<motion.div
									layout
									transition={{ duration: 0.4 }}
									className="grid grid-cols-2 xl:grid-cols-3 gap-6"
								>
									<AnimatePresence mode="popLayout">
										{apps.map(app => (
											<AppCard
												key={app.id}
												app={app}
												onClick={() => navigate(`/app/${app.id}`)}
												showStats={true}
												showUser={true}
												showActions={false}
											/>
										))}
									</AnimatePresence>
								</motion.div>
							</div>
						</motion.section>
					)}
				</AnimatePresence>
			</LayoutGroup>

			{/* Nudge towards Discover */}
			{user && <CurvedArrow sourceRef={discoverLinkRef} target={{ x: 50, y: window.innerHeight - 60 }} />}
		</div>
	);
}



type ArrowProps = {
	/** Ref to the source element the arrow starts from */
	sourceRef: React.RefObject<HTMLElement | null>;
	/** Target point in viewport/client coordinates */
	target: { x: number; y: number };
	/** Curve intensity (0.1 - 1.5 is typical) */
	curvature?: number;
	/** Optional pixel offset from source element edge */
	sourceOffset?: number;
	/** If true, hides the arrow when the source is offscreen/not measurable */
	hideWhenInvalid?: boolean;
};

type Point = { x: number; y: number };

export const CurvedArrow: React.FC<ArrowProps> = ({
	sourceRef,
	target,
	curvature = 0.5,
	sourceOffset = 6,
	hideWhenInvalid = true,
}) => {
	const [start, setStart] = useState<Point | null>(null);
	const [end, setEnd] = useState<Point | null>(null);

	const rafRef = useRef<number | null>(null);
	const roRef = useRef<ResizeObserver | null>(null);

	const compute = () => {
		const el = sourceRef.current;
		if (!el) {
			setStart(null);
			setEnd(null);
			return;
		}

		const rect = el.getBoundingClientRect();
		if (!rect || rect.width === 0 || rect.height === 0) {
			setStart(null);
			setEnd(null);
			return;
		}

		const endPoint: Point = { x: target.x, y: target.y };

		// Choose an anchor on the source: midpoint of the side facing the target
		const centers = {
			right: { x: rect.right, y: rect.top + rect.height / 2 },
			left: { x: rect.left, y: rect.top + rect.height / 2 },
		};

		// Distances to target from each side center
		const dists = Object.fromEntries(
			Object.entries(centers).map(([side, p]) => [
				side,
				(p.x - endPoint.x) ** 2 + (p.y - endPoint.y) ** 2,
			])
		) as Record<keyof typeof centers, number>;

		const bestSide = (Object.entries(dists).sort((a, b) => a[1] - b[1])[0][0] ||
			"right") as keyof typeof centers;

		// Nudge start point slightly outside the element for visual clarity
		const nudge = (p: Point, side: keyof typeof centers, offset: number) => {
			switch (side) {
				case "right":
					return { x: p.x + offset, y: p.y };
				case "left":
					return { x: p.x - offset, y: p.y };
			}
		};

		const startPoint = nudge(centers[bestSide], bestSide, sourceOffset);

		setStart(startPoint);
		setEnd(endPoint);
	};

	// Throttle updates with rAF to avoid layout thrash
	const scheduleCompute = () => {
		if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
		rafRef.current = requestAnimationFrame(compute);
	};

	useEffect(() => {
		scheduleCompute();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [target.x, target.y, sourceRef.current]);

	useEffect(() => {
		const onScroll = () => scheduleCompute();
		const onResize = () => scheduleCompute();

		window.addEventListener("scroll", onScroll, { passive: true });
		window.addEventListener("resize", onResize);

		// Track source element size changes
		const el = sourceRef.current;
		if ("ResizeObserver" in window) {
			roRef.current = new ResizeObserver(() => scheduleCompute());
			if (el) roRef.current.observe(el);
		}

		scheduleCompute();

		return () => {
			window.removeEventListener("scroll", onScroll);
			window.removeEventListener("resize", onResize);
			if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
			if (roRef.current && el) roRef.current.unobserve(el);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const d = useMemo(() => {
		if (!start || !end) return "";

		const dx = end.x - start.x;
		const dy = end.y - start.y;

		// Control points: bend the curve based on the primary axis difference.
		// This gives a nice S or C curve without sharp kinks.
		const cpOffset = Math.max(Math.abs(dx), Math.abs(dy)) * curvature;

		const c1: Point = { x: start.x + cpOffset * (dx >= 0 ? 1 : -1), y: start.y };
		const c2: Point = { x: end.x - cpOffset * (dx >= 0 ? 1 : -1), y: end.y };

		return `M ${start.x},${start.y} C ${c1.x},${c1.y} ${c2.x},${c2.y} ${end.x},${end.y}`;
	}, [start, end, curvature]);

	const hidden = hideWhenInvalid && (!start || !end);

	if (start && end && (end.y - start.y > 420 || start.x - end.x < 100)) {
		return null;
	}

	return (
		<svg
			aria-hidden="true"
			style={{
				position: "fixed",
				inset: 0,
				width: "100vw",
				height: "100vh",
				pointerEvents: "none",
				overflow: "visible",
				zIndex: 9999,
				display: hidden ? "none" : "block",
			}}
		>
			<defs>
				<filter id="discover-squiggle" x="-20%" y="-20%" width="140%" height="140%">
					<feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="1" seed="3" result="noise" />
					<feDisplacementMap in="SourceGraphic" in2="noise" scale="1" xChannelSelector="R" yChannelSelector="G" />
				</filter>
				<marker id="discover-arrowhead" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="strokeWidth" opacity={0.20}>
					<path d="M 0 1.2 L 7 4" stroke="var(--color-text-tertiary)" strokeWidth="1.6" strokeLinecap="round" fill="none" />
					<path d="M 0 6.8 L 7 4" stroke="var(--color-text-tertiary)" strokeWidth="1.2" strokeLinecap="round" fill="none" />
				</marker>
			</defs>

			<path
				d={d}
				// stroke="var(--color-accent)"
				stroke="var(--color-text-tertiary)"
				strokeOpacity={0.20}
				strokeWidth={1.6}
				fill="none"
				strokeLinecap="round"
				strokeLinejoin="round"
				vectorEffect="non-scaling-stroke"
				markerEnd="url(#discover-arrowhead)"
			/>
			{/* Soft squiggle overlay for hand-drawn feel */}
			<g filter="url(#discover-squiggle)">
				<path
					d={d}
					// stroke="var(--color-accent)"
					stroke="var(--color-text-tertiary)"
					strokeOpacity={0.12}
					strokeWidth={1}
					fill="none"
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeDasharray="8 6 4 9 5 7"
					vectorEffect="non-scaling-stroke"
				/>
			</g>
		</svg>
	);
};
