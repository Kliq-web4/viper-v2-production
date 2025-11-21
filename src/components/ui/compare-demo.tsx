import { Compare } from "@/components/ui/compare";

export function CompareDemo() {
    return (
        <div className="p-4 border rounded-3xl bg-purple-900/30 border-purple-800/50 px-4 backdrop-blur-sm">
            <Compare
                firstImage="/code-after.png"
                secondImage="/code-before.png"
                firstImageClassName="object-cover object-left-top"
                secondImageClassname="object-cover object-left-top"
                className="h-[250px] w-[200px] md:h-[500px] md:w-[500px]"
                slideMode="hover"
                autoplay={true}
                autoplayDuration={3000}
            />
        </div>
    );
}
