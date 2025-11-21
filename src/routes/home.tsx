import { useRef, useState, useEffect, useMemo } from 'react';
import { ArrowRight, Info, Check } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useAuth } from '@/contexts/auth-context';
import {
	AgentModeToggle,
	type AgentMode,
} from '../components/agent-mode-toggle';
import { useAuthGuard } from '../hooks/useAuthGuard';
import { usePaginatedApps } from '@/hooks/use-paginated-apps';
import { AnimatePresence, motion } from 'framer-motion';
import { AppCard } from '@/components/shared/AppCard';
import clsx from 'clsx';
import { useImageUpload } from '@/hooks/use-image-upload';
import { useDragDrop } from '@/hooks/use-drag-drop';
import { ImageUploadButton } from '@/components/image-upload-button';
import { ImageAttachmentPreview } from '@/components/image-attachment-preview';
import { SUPPORTED_IMAGE_MIME_TYPES } from '@/api-types';


import { EntropyDemo } from '@/components/ui/entropy-demo';
import { LampContainer } from '@/components/ui/lamp';
import { GlowingEffectDemo } from '@/components/ui/glowing-effect-demo';
import { TemplatesDemo } from '@/components/ui/templates-demo';
import { CompareDemo } from '@/components/ui/compare-demo';
import { HoverPeek } from '@/components/ui/link-preview';
import { EvervaultCardDemo } from '@/components/ui/evervault-card-demo';
import { MarketingHeader } from '@/components/marketing/site-header';
import { MarketingFooter } from '@/components/marketing/site-footer';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { apiClient } from '@/lib/api-client';
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
	const isMobile = useIsMobile();


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

	const placeholderSuffixes = useMemo(() => [
		'build a landing page',
		'build a game',
		'create a dashboard',
		'launch a blog',
		'make a booking system',
	], []);
	const [placeholderIndex, setPlaceholderIndex] = useState(0);
	const [placeholderText, setPlaceholderText] = useState('');
	const [placeholderTyping, setPlaceholderTyping] = useState(true);

	useEffect(() => {
		const phrase = placeholderSuffixes[placeholderIndex];
		if (placeholderTyping) {
			if (placeholderText.length < phrase.length) {
				const t = setTimeout(() => setPlaceholderText(phrase.slice(0, placeholderText.length + 1)), 80);
				return () => clearTimeout(t);
			} else {
				const t = setTimeout(() => setPlaceholderTyping(false), 1500);
				return () => clearTimeout(t);
			}
		} else {
			if (placeholderText.length > 0) {
				const t = setTimeout(() => setPlaceholderText(placeholderText.slice(0, -1)), 40);
				return () => clearTimeout(t);
			} else {
				setPlaceholderIndex((i) => (i + 1) % placeholderSuffixes.length);
				setPlaceholderTyping(true);
			}
		}
	}, [placeholderText, placeholderIndex, placeholderTyping, placeholderSuffixes]);

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

	const discoverLinkRef = useRef<HTMLDivElement>(null);

	const testimonials = [
		{
			quote: "This platform has completely transformed how I build apps. No iterations, no changes, just pure magic.",
			author: "Hasan Toor",
			handle: "@hasantoxr"
		},
		{
			quote: "Just built this awesome web app! I'm blown away by how fast and intuitive the process is.",
			author: "Maria Martin",
			handle: "@marias_martin"
		},
		{
			quote: "What makes this different is that the interaction with the AI is seamless and the results are production-ready.",
			author: "Gleb Konon",
			handle: ""
		},
		{
			quote: "One of the best AI Coders out there. I tried many of them. What sets this apart is the quality and speed.",
			author: "Richard Manisa",
			handle: ""
		},
		{
			quote: "Perfect for founders who want to build fast without compromising on quality. Highly recommended!",
			author: "Masiar Ighani",
			handle: ""
		},
		{
			quote: "Amazing understanding of user needs and thorough handling of complex requirements. Impressive work!",
			author: "Ariel MI",
			handle: ""
		},
		{
			quote: "Start building in minutes. See results immediately. Great!",
			author: "Thatweb3guy",
			handle: "@myfootyfantasy"
		},
		{
			quote: "Fastest Aha! moment I have ever had.",
			author: "Roy Kotzer",
			handle: ""
		},
		{
			quote: "This revolutionizes app development by enabling users to create production-ready applications in minutes.",
			author: "Erel Cohen",
			handle: ""
		},
	] as const;

	// Pricing plans loaded from API
	const [plans, setPlans] = useState<Array<{ slug: string; name: string; monthlyCredits: number; dailyFreeCredits: number; rolloverLimit: number; resetCycleDays: number; priceUsd: number; checkoutUrl?: string | null }>>([]);
	const [, setPlansLoading] = useState(true);
	useEffect(() => {
		let mounted = true;
		apiClient.getBillingPlans()
			.then((res) => {
				if (mounted && res.success && res.data) setPlans((res.data as any).plans);
			})
			.catch(() => { })
			.finally(() => mounted && setPlansLoading(false));
		return () => { mounted = false };
	}, []);

	const faqs = [
		{
			question: "What is this platform?",
			answer: "This is an AI-powered platform that lets you turn any idea into a fully-functional custom app, without the need for any coding experience."
		},
		{
			question: "Do I need coding experience to use this?",
			answer: "No. Our platform is designed to be easily accessible to non-technical users. Just describe your software needs in plain language, and our AI will handle the technical implementation."
		},
		{
			question: "What types of applications can I build?",
			answer: "This platform is versatile and can be used to build a wide range of applications, including but not limited to: personal productivity apps, back-office tools, customer portals, and business process automation tools. You can also use it for rapid prototyping and creating MVPs."
		},
		{
			question: "What kind of integrations does this support?",
			answer: "Most common integrations are already built into the platform. You can directly send emails, use SMS, connect to any external API, and query databases right out of the box—no complex setup required."
		},
		{
			question: "How are applications deployed?",
			answer: "We take care of it automatically. The platform comes with built-in hosting, so there's no deployment process. When your app is created, it's instantly live and shareable."
		},
		{
			question: "How does the natural language development process work?",
			answer: "You simply type in your idea—whether it's a general thought or you have specific requirements—in conversational language. Our AI interprets your instructions and generates the necessary code and structure for your app. You can then review, test, and refine your app through further conversation with the AI."
		},
		{
			question: "Is my data secure?",
			answer: "Yes, we take data security very seriously. User management and authentication systems are built-in, using best-in-class, industry-standard encryption and security practices to protect your data and your users' information."
		},
		{
			question: "Do I own the applications I create?",
			answer: "Definitely. All applications and content generated through this platform belong entirely to you. We make no claims of ownership over anything you create using our platform. You're free to use, modify, distribute, or sell the generated applications however you see fit."
		},
	] as const;

	return (
		<div className="relative flex flex-col min-h-screen bg-black">
			{/* Background - PixelTrail on purple background */}


			<MarketingHeader />

			<main className="relative z-10 flex-1">
				{/* Hero Section - Purple Dominant */}
				<section id="product" className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20 md:pt-40 md:pb-32">
					<div className="flex flex-col items-center text-center space-y-6">
						<LampContainer className="pt-40">
							<motion.h1
								initial={{ opacity: 0.5, y: 100 }}
								whileInView={{ opacity: 1, y: 0 }}
								transition={{
									delay: 0.3,
									duration: 0.8,
									ease: "easeInOut",
								}}
								className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-mono font-light tracking-tighter text-purple-100 leading-none text-center bg-clip-text text-transparent bg-gradient-to-b from-purple-100 to-purple-500"
							>
								web4.sbs
							</motion.h1>
							<motion.div
								initial={{ opacity: 0, y: 20 }}
								whileInView={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.5, duration: 0.8 }}
								className="flex flex-col items-center"
							>
								<p className="text-sm md:text-base font-mono text-purple-300 tracking-wider uppercase mt-4">
									Build something with AI
								</p>
								<p className="text-xs md:text-sm font-mono text-purple-400 mt-2 max-w-md">
									Create apps and websites by chatting with AI
								</p>
							</motion.div>
						</LampContainer>
					</div>

					{/* Main Input Area - Purple Design */}
					<div className="max-w-3xl mx-auto mt-16 md:mt-20">
						<form
							method="POST"
							onSubmit={(e) => {
								e.preventDefault();
								const query = textareaRef.current!.value;
								handleCreateApp(query, agentMode);
							}}
							className="group relative overflow-hidden flex z-10 flex-col w-full min-h-[120px] bg-purple-900/50 border border-purple-700/50 rounded-lg p-6 transition-all duration-300 hover:border-purple-600 focus-within:border-purple-500 backdrop-blur-sm"
						>
							<div
								className={clsx(
									"flex-1 flex flex-col relative",
									isDragging && "ring-2 ring-accent ring-offset-2 rounded-lg"
								)}
								{...dragHandlers}
							>
								{isDragging && (
									<div className="absolute inset-0 flex items-center justify-center bg-purple-800/30 backdrop-blur-sm z-30 pointer-events-none border-2 border-dashed border-purple-400/70">
										<p className="text-purple-300 font-mono text-sm">Drop images here</p>
									</div>
								)}
								<textarea
									className="w-full resize-none ring-0 z-20 outline-0 placeholder:text-purple-500 text-purple-100 bg-transparent text-base font-mono"
									name="query"
									value={query}
									placeholder={`Ask Kliq AI to ${placeholderText}`}
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
										className="bg-purple-500 text-white p-2 *:size-5 transition-all duration-200 hover:bg-purple-400 active:bg-purple-600 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-purple-500 border border-purple-400 rounded-lg"
									>
										<ArrowRight />
									</button>
								</div>
							</div>
						</form>

					</div>

					{/* Entropy & CTA Section */}
					<div className="max-w-5xl mx-auto mt-16 md:mt-20 px-4 sm:px-6 lg:px-8">
						<div className="flex flex-col md:flex-row items-center justify-center md:items-start gap-8 md:gap-16">
							<div className="flex-shrink-0">
								<EntropyDemo />
							</div>

							<div className="w-full md:w-80 flex flex-col items-center md:items-start text-center md:text-left shrink-0 pt-8 md:pt-20">
								<p className="text-xs font-mono text-purple-400 mb-6 leading-relaxed">
									Our engineers are actively enhancing Web4.sbs for an even smoother experience — but everything is fully functional and ready to use.
								</p>

								<HoverPeek
									url="http://www.kliqonline.com"
									peekWidth={300}
									peekHeight={200}
								>
									<a
										href="http://www.kliqonline.com"
										target="_blank"
										rel="noopener noreferrer"
										className="group relative inline-flex items-center gap-2.5 border border-purple-600 bg-purple-900/50 px-5 py-2.5 text-xs font-mono text-purple-200 hover:text-purple-100 hover:border-purple-500 transition-all duration-200 rounded-lg backdrop-blur-sm"
									>
										<span>Explore Our Kliq AI x Web4 Playground</span>
										<ArrowRight className="size-3 transition-transform group-hover:translate-x-1" />
									</a>
								</HoverPeek>
							</div>
						</div>
					</div>
				</section>

				{/* Templates Section - Black Theme */}
				<section id="templates" className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
					<div className="text-center mb-12">
						<h2 className="text-2xl md:text-3xl font-mono font-light text-white mb-2 tracking-tight">Templates</h2>
						<p className="text-xs font-mono text-neutral-500 uppercase tracking-wider">Quick Start</p>
					</div>
					<div className="w-full">
						<TemplatesDemo onTemplateClick={(prompt) => handleCreateApp(prompt, agentMode)} />
					</div>
				</section>

				{/* Live Coding Section - Purple Theme */}
				<section id="live-coding" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 border-t border-purple-800/50">
					<div className="text-center mb-12">
						<h2 className="text-3xl md:text-4xl font-mono font-light mb-4 text-purple-100 tracking-tight">Watch AI Code in Real-Time</h2>
						<p className="text-sm font-mono text-purple-400 uppercase tracking-wider">From idea to implementation, instantly</p>
					</div>
					<div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
						<div className="flex-shrink-0">
							<CompareDemo />
						</div>
						<div className="max-w-md flex flex-col gap-6 text-center md:text-left">
							<div>
								<h3 className="text-xl md:text-2xl font-mono font-light text-purple-100 mb-3">Live Code Generation</h3>
								<p className="text-sm font-mono text-purple-300 leading-relaxed">
									See your ideas transform into production-ready code as you describe them. Our AI understands context, follows best practices, and writes clean, maintainable code.
								</p>
							</div>
							<div className="flex flex-col gap-3">
								<div className="flex items-start gap-3">
									<Check className="size-5 text-purple-400 flex-shrink-0 mt-0.5" />
									<p className="text-sm font-mono text-purple-200">Full-stack applications in minutes</p>
								</div>
								<div className="flex items-start gap-3">
									<Check className="size-5 text-purple-400 flex-shrink-0 mt-0.5" />
									<p className="text-sm font-mono text-purple-200">Modern frameworks & best practices</p>
								</div>
								<div className="flex items-start gap-3">
									<Check className="size-5 text-purple-400 flex-shrink-0 mt-0.5" />
									<p className="text-sm font-mono text-purple-200">Iterate and refine with natural language</p>
								</div>
							</div>
						</div>
					</div>
				</section>
				{/* Evervault Card Demo Section */}
				<section id="evervault-demo" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 border-t border-purple-800/50 bg-purple-900/10">
					<div className="text-center mb-12">
						<h2 className="text-3xl md:text-4xl font-mono font-light mb-4 text-purple-100 tracking-tight">Uncompromising Security</h2>
						<p className="text-sm font-mono text-purple-400 uppercase tracking-wider">Enterprise-grade protection built into every application.</p>
					</div>
					<div className="flex justify-center">
						<EvervaultCardDemo />
					</div>
				</section>

				<section id="integrations" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 border-t border-purple-800/50">
					<p className="text-xs font-mono text-purple-400 text-center mb-8 uppercase tracking-wider">Trusted by teams who use</p>
					<div className="logo-marquee overflow-hidden">
						{/* Marquee track – duplicates for seamless loop */}
						<div className="logo-marquee__inner flex items-center opacity-90 gap-[3em]">
							{/* Set 1 */}
							<img src="/Kliq-AI-Lazy-loader.png" alt="Kliq AI" loading="lazy" decoding="async" className="h-10 md:h-12 xl:h-14 object-contain" />
							<img src={openaiLogo} alt="OpenAI" loading="lazy" decoding="async" className="h-10 md:h-12 xl:h-14" />
							<img src={anthropicLogo} alt="Anthropic" loading="lazy" decoding="async" className="h-10 md:h-12 xl:h-14" />
							<img src={googleLogo} alt="Google" loading="lazy" decoding="async" className="h-10 md:h-12 xl:h-14" />
							<img src={cloudflareLogo} alt="Cloudflare" loading="lazy" decoding="async" className="h-10 md:h-12 xl:h-14" />
							<img src={cerebrasLogo} alt="Cerebras" loading="lazy" decoding="async" className="h-10 md:h-12 xl:h-14" />

							{/* Set 2 (duplicate) */}
							<img src="/Kliq-AI-Lazy-loader.png" alt="Kliq AI" loading="lazy" decoding="async" className="h-10 md:h-12 xl:h-14 object-contain" aria-hidden="true" />
							<img src={openaiLogo} alt="OpenAI" loading="lazy" decoding="async" className="h-10 md:h-12 xl:h-14" aria-hidden="true" />
							<img src={anthropicLogo} alt="Anthropic" loading="lazy" decoding="async" className="h-10 md:h-12 xl:h-14" aria-hidden="true" />
							<img src={googleLogo} alt="Google" loading="lazy" decoding="async" className="h-10 md:h-12 xl:h-14" aria-hidden="true" />
							<img src={cloudflareLogo} alt="Cloudflare" loading="lazy" decoding="async" className="h-10 md:h-12 xl:h-14" aria-hidden="true" />
							<img src={cerebrasLogo} alt="Cerebras" loading="lazy" decoding="async" className="h-10 md:h-12 xl:h-14" aria-hidden="true" />
						</div>
					</div>
				</section>

				<section id="features" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 border-t border-purple-800/50">
					<div className="text-center mb-16">
						<h2 className="text-3xl md:text-4xl lg:text-5xl font-mono font-light mb-4 text-purple-100 tracking-tight">Consider yourself limitless.</h2>
						<p className="text-sm md:text-base font-mono text-purple-400 uppercase tracking-wider">If you can describe it, you can build it.</p>
					</div>
					<div className="w-full">
						<GlowingEffectDemo />
					</div>
				</section>

				<section id="testimonials" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 border-t border-purple-800/50">
					<div className="text-center mb-12">
						<h2 className="text-3xl md:text-4xl font-mono font-light mb-4 text-purple-100 tracking-tight">"Okay, this has blown my mind."</h2>
						<p className="text-sm font-mono text-purple-400 uppercase tracking-wider">And other great things our users say about us.</p>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
						{testimonials.map((testimonial, index) => (
							<motion.div
								key={index}
								initial={{ opacity: 0, y: 20 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								transition={{ duration: 0.5, delay: index * 0.1 }}
								whileHover={{ y: -4 }}
							>
								<Card className="h-full">
									<CardContent className="pt-6 pb-6">
										<p className="text-purple-100 mb-6 text-base leading-relaxed font-mono">"{testimonial.quote}"</p>
										<div className="flex items-center gap-3">
											<div className="h-10 w-10 border border-purple-700/60 bg-purple-800/40 flex items-center justify-center rounded-lg shadow-md shadow-purple-950/30">
												<span className="text-sm font-mono text-purple-300">
													{testimonial.author.charAt(0)}
												</span>
											</div>
											<div>
												<p className="text-sm font-mono font-light text-purple-50">{testimonial.author}</p>
												{testimonial.handle && (
													<p className="text-xs font-mono text-purple-400">{testimonial.handle}</p>
												)}
											</div>
										</div>
									</CardContent>
								</Card>
							</motion.div>
						))}
					</div>
				</section>

				{/* Pricing Section - Purple Theme */}
				<section id="pricing" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 border-t border-purple-800/50">
					<div className="text-center mb-12">
						<h2 className="text-3xl md:text-4xl font-mono font-light mb-4 text-purple-100 tracking-tight">Pricing plans for every need</h2>
						<p className="text-sm font-mono text-purple-400 uppercase tracking-wider">Scale as you go with plans designed to match your growth.</p>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
						{/* Free */}
						<Card>
							<CardHeader className="pb-4">
								<CardTitle className="text-xl md:text-2xl mb-1 font-mono font-light text-purple-50">Free</CardTitle>
								<CardDescription className="text-sm font-mono text-purple-300">$0 / mo</CardDescription>
							</CardHeader>
							<CardContent>
								<ul className="space-y-3 mb-6 text-sm font-mono">
									<li className="flex items-center gap-2 text-purple-200"><Check className="size-4 text-purple-400" /> 10 daily free credits</li>
									<li className="flex items-center gap-2 text-purple-200"><Check className="size-4 text-purple-400" /> Core features</li>
									<li className="flex items-center gap-2 text-purple-200"><Check className="size-4 text-purple-400" /> Built-in integrations</li>
								</ul>
								<Button size="lg" className="w-full bg-purple-500 text-white hover:bg-purple-400 font-mono border-0 rounded-lg" onClick={() => {
									const intendedUrl = `/chat/new`;
									if (requireAuth({ requireFullAuth: true, actionContext: 'to create applications', intendedUrl })) {
										navigate(intendedUrl);
									}
								}}>Start building</Button>
							</CardContent>
						</Card>

						{/* Pro */}
						<Card className="relative overflow-hidden border-purple-700/80 bg-purple-900/60">
							<div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/20 rounded-full blur-3xl"></div>
							<CardHeader className="pb-4 relative z-10">
								<CardTitle className="text-xl md:text-2xl mb-1 font-mono font-light text-purple-50">Pro</CardTitle>
								<div className="flex items-baseline gap-2">
									<span className="text-4xl md:text-5xl font-mono font-light text-purple-50">${plans.find(p => p.slug === 'pro')?.priceUsd ?? 25}</span>
									<span className="text-sm md:text-base font-mono text-purple-300">/ mo</span>
								</div>
							</CardHeader>
							<CardContent className="relative z-10">
								<ul className="space-y-3 mb-6 text-sm font-mono">
									<li className="flex items-center gap-2 text-purple-200"><Check className="size-4 text-purple-400" /> 100 monthly credits</li>
									<li className="flex items-center gap-2 text-purple-200"><Check className="size-4 text-purple-400" /> Rollover up to 100 credits</li>
									<li className="flex items-center gap-2 text-purple-200"><Check className="size-4 text-purple-400" /> Monthly reset</li>
								</ul>
								<a href={(plans.find(p => p.slug === 'pro')?.checkoutUrl) || '#'} target={plans.find(p => p.slug === 'pro')?.checkoutUrl ? '_blank' : undefined} rel="noreferrer">
									<Button variant="outline" size="lg" className="w-full bg-purple-500 text-white hover:bg-purple-400 font-mono border-0 rounded-lg" disabled={!plans.find(p => p.slug === 'pro')?.checkoutUrl}>
										Upgrade to Pro
									</Button>
								</a>
							</CardContent>
						</Card>

						{/* Business */}
						<Card className="relative overflow-hidden border-purple-700/80 bg-purple-900/60">
							<div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/20 rounded-full blur-3xl"></div>
							<CardHeader className="pb-4 relative z-10">
								<CardTitle className="text-xl md:text-2xl mb-1 font-mono font-light text-purple-50">Business</CardTitle>
								<div className="flex items-baseline gap-2">
									<span className="text-4xl md:text-5xl font-mono font-light text-purple-50">${plans.find(p => p.slug === 'business')?.priceUsd ?? 79}</span>
									<span className="text-sm md:text-base font-mono text-purple-300">/ mo</span>
								</div>
							</CardHeader>
							<CardContent className="relative z-10">
								<ul className="space-y-3 mb-6 text-sm font-mono">
									<li className="flex items-center gap-2 text-purple-200"><Check className="size-4 text-purple-400" /> 500 monthly credits</li>
									<li className="flex items-center gap-2 text-purple-200"><Check className="size-4 text-purple-400" /> Rollover up to 500 credits</li>
									<li className="flex items-center gap-2 text-purple-200"><Check className="size-4 text-purple-400" /> Monthly reset</li>
								</ul>
								<a href={(plans.find(p => p.slug === 'business')?.checkoutUrl) || '#'} target={plans.find(p => p.slug === 'business')?.checkoutUrl ? '_blank' : undefined} rel="noreferrer">
									<Button variant="outline" size="lg" className="w-full bg-purple-500 text-white hover:bg-purple-400 font-mono border-0 rounded-lg" disabled={!plans.find(p => p.slug === 'business')?.checkoutUrl}>
										Upgrade to Business
									</Button>
								</a>
							</CardContent>
						</Card>
					</div>
				</section>

				{/* FAQs Section - Purple Theme */}
				<section id="docs" className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 border-t border-purple-800/50">
					<div className="text-center mb-12">
						<h2 className="text-3xl md:text-4xl font-mono font-light mb-4 text-purple-100 tracking-tight">FAQs</h2>
					</div>
					<Accordion type="single" collapsible className="w-full">
						{faqs.map((faq, index) => (
							<AccordionItem key={index} value={`item-${index}`} className="border-purple-800/50">
								<AccordionTrigger className="text-left font-mono font-light text-purple-100 hover:text-purple-50">
									{faq.question}
								</AccordionTrigger>
								<AccordionContent className="font-mono text-purple-300">
									{faq.answer}
								</AccordionContent>
							</AccordionItem>
						))}
					</Accordion>
				</section>

				{/* Images beta notice */}
				<AnimatePresence>
					{images.length > 0 && (
						<motion.div
							initial={{ opacity: 0, y: -10 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -10 }}
							className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-8"
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
							initial={{ opacity: 0, height: 0 }}
							animate={{ opacity: 1, height: "auto" }}
							exit={{ opacity: 0, height: 0 }}
							transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
							className={clsx('max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16', images.length > 0 ? 'mt-10' : 'mt-16')}
						>
							<div className='flex flex-col items-start'>
								<h2 className="text-2xl md:text-3xl font-bold mb-4 text-text-primary">Discover Apps built by the community</h2>
								<div ref={discoverLinkRef} className="text-md font-light mb-6 text-accent hover:underline underline-offset-4 cursor-pointer" onClick={() => navigate('/discover')}>
									View All
								</div>
								<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
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
								</div>
							</div>
						</motion.section>
					)}
				</AnimatePresence>
			</main>

			{/* Nudge towards Discover */}
			{user && !isMobile && <CurvedArrow sourceRef={discoverLinkRef} target={{ x: 50, y: window.innerHeight - 60 }} />}
			<MarketingFooter />
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
