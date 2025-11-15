
export function Hero() {
  return (
    <div className="w-full h-full relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-[#000000]" />
      
      {/* Glowing orb effect - Purple Focus */}
      <div className="absolute top-1/4 right-0 w-[800px] h-[800px] bg-[#9E5AFF]/25 rounded-full blur-[150px]" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#9F63FF]/20 rounded-full blur-[120px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[#9E5AFF]/15 rounded-full blur-[180px]" />
      
      {/* Light beam effect - Purple */}
      <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-[#9E5AFF] to-transparent opacity-60" />
      <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#9E5AFF]/20 to-transparent" />
      
      {/* Sparkle - Purple */}
      <div className="absolute bottom-24 right-32 w-12 h-12">
        <div className="absolute inset-0 animate-pulse">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-8 bg-[#9E5AFF]/80 rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-1 bg-[#9E5AFF]/80 rounded-full" />
        </div>
      </div>
      
      {/* Additional purple sparkle */}
      <div className="absolute top-32 left-24 w-8 h-8">
        <div className="absolute inset-0 animate-pulse" style={{ animationDelay: '0.5s' }}>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-6 bg-[#9F63FF]/70 rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-0.5 bg-[#9F63FF]/70 rounded-full" />
        </div>
      </div>
      
      {/* Content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center">
        <div className="text-center">
          <h1 className="text-[120px] tracking-tight mb-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-[#9E5AFF] to-white font-bold text-[160px]">web4</span>
            <span className="text-[#9F63FF]/80 text-[128px]">.sbs</span>
          </h1>
          
          <p className="text-white/70 text-2xl mb-8 text-[32px]">
            Vibe-coding reimagined
          </p>
          
          <div className="inline-block px-6 py-2 rounded-full bg-[#9E5AFF]/10 backdrop-blur-sm border border-[#9E5AFF]/30">
            <p className="text-white/50 text-sm">
              Powered by <span className="text-[#9E5AFF]">Kliq AI</span>
            </p>
          </div>

          {/* Loader */}
          <div className="mt-10 flex items-center justify-center">
            <div className="relative w-64 h-2 rounded-full overflow-hidden bg-white/10">
              <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-[#9E5AFF] via-[#9F63FF] to-[#9E5AFF] animate-[loading_1.6s_infinite]" />
            </div>
          </div>
          <p className="mt-3 text-white/60 text-sm">Building your preview…</p>
        </div>
      </div>
      
      {/* Bottom text */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 text-center">
        <p className="text-white/40 text-sm">
          Build stunning web applications with the power of AI
        </p>
      </div>

      {/* keyframes */}
      <style>{`@keyframes loading { 0%{transform:translateX(-100%)} 100%{transform:translateX(300%)} }`}</style>
    </div>
  );
}
