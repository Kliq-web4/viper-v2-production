import { useScreenSize } from "@/components/hooks/use-screen-size"
import { PixelTrail } from "@/components/ui/pixel-trail"

export function Hero() {
  const screenSize = useScreenSize()

  return (
    <div className="w-full h-full relative overflow-hidden bg-[#000000]">
      {/* Pixel Trail Background */}
      <div className="absolute inset-0 z-0">
        <PixelTrail
          pixelSize={screenSize.lessThan(`md`) ? 48 : 80}
          fadeDuration={0}
          delay={1200}
          pixelClassName="rounded-full bg-[#9E5AFF]"
        />
      </div>

      {/* Content Overlay */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center pointer-events-none">
        <div className="text-center">
          {/* Empty overlay structure - text removed as requested */}
        </div>
      </div>
    </div>
  );
}
