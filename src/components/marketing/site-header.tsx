import { Button } from '@/components/ui/button'
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuLink,
} from '@/components/ui/navigation-menu'

export type MarketingHeaderProps = {
  onStart?: () => void
}

export function MarketingHeader({ onStart }: MarketingHeaderProps) {
  return (
    <header className="pointer-events-none sticky top-0 z-40">
      <div className="pointer-events-auto backdrop-blur supports-backdrop:backdrop-blur-md bg-bg-3/40 dark:bg-bg-2/40 border-b border-accent/20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="h-14 flex items-center justify-between gap-4">
            {/* Brand */}
            <div className="flex items-center gap-2 select-none">
              <div className="text-lg font-semibold bg-gradient-to-r from-purple-400 via-fuchsia-400 to-violet-500 bg-clip-text text-transparent">web4.sbs</div>
            </div>

            {/* Nav */}
            <nav className="hidden md:block">
              <NavigationMenu viewport={false}>
                <NavigationMenuList>
                  <NavigationMenuItem>
                    <NavigationMenuLink href="#product">Product</NavigationMenuLink>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <NavigationMenuLink href="#features">Features</NavigationMenuLink>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <NavigationMenuLink href="#integrations">Integrations</NavigationMenuLink>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <NavigationMenuLink href="#templates">Templates</NavigationMenuLink>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <NavigationMenuTrigger>Resources</NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <div className="grid grid-cols-2 gap-2 p-2 min-w-64">
                        <NavigationMenuLink href="#docs">Docs & FAQs</NavigationMenuLink>
<NavigationMenuLink href="/discover">Community</NavigationMenuLink>
                        <NavigationMenuLink href="#blog">Blog</NavigationMenuLink>
                        <NavigationMenuLink href="#changelog">Changelog</NavigationMenuLink>
                      </div>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <NavigationMenuLink href="#pricing">Pricing</NavigationMenuLink>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <NavigationMenuLink href="#enterprise">Enterprise</NavigationMenuLink>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={onStart}>Start Building</Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default MarketingHeader
