import { Button } from '@/components/ui/button'
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuLink,
} from '@/components/ui/navigation-menu'
import { useNavigate } from 'react-router'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { useAuth } from '@/contexts/auth-context'
import { AuthButton } from '@/components/auth/auth-button'
import { SidebarTrigger } from '@/components/ui/sidebar'

export type MarketingHeaderProps = {
  onStart?: () => void
}

export function MarketingHeader({ onStart }: MarketingHeaderProps) {
  const navigate = useNavigate();
  const { requireAuth } = useAuthGuard();
  const { isAuthenticated, user } = useAuth();

  const handleStart = () => {
    if (onStart) {
      onStart();
      return;
    }
    const intendedUrl = `/chat/new`;
    if (requireAuth({ requireFullAuth: true, actionContext: 'to create applications', intendedUrl })) {
      navigate(intendedUrl);
    }
  };

  return (
    <header className="pointer-events-none sticky top-0 z-40">
      <div className="pointer-events-auto bg-purple-950/90 backdrop-blur supports-backdrop:backdrop-blur-md border-b border-purple-800/50">
        <div className="mx-auto max-w-7xl px-4">
          <div className="h-14 flex items-center justify-between gap-4">
            {/* Brand + Sidebar toggle */}
            <div className="flex items-center gap-2 select-none">
              <SidebarTrigger className="hidden md:inline-flex text-purple-300 hover:text-purple-100" />
              <div className="text-lg font-mono font-light text-purple-100 tracking-tight">web4.sbs</div>
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
              {isAuthenticated && user ? (
                <AuthButton />
              ) : (
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={handleStart}
                  className="bg-purple-500 text-white hover:bg-purple-400 font-mono border-0 rounded-lg"
                >
                  Start Building
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default MarketingHeader
