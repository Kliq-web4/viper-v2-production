import { useScreenSize } from "@/components/hooks/use-screen-size"
import { PixelTrail } from "@/components/ui/pixel-trail"

export function Hero() {
  const screenSize = useScreenSize()

  return (
    <div className="relative w-full h-full min-h-[500px] bg-[#000000] text-white flex flex-col">
      {/* Pixel Trail Background - Fully replaces all background effects */}
      <div className="absolute inset-0 z-0">
        <PixelTrail
          pixelSize={screenSize.lessThan(`md`) ? 48 : 80}
          fadeDuration={800}
          delay={1200}
          pixelClassName="rounded-full bg-[#9E5AFF]"
        />
      </div>

      {/* Content Overlay - Empty overlay structure kept as requested */}
      <div className="justify-center items-center flex flex-col w-full h-full z-10 pointer-events-none">
        {/* Text removed - overlay structure maintained */}
      </div>
    </div>
  );
}
