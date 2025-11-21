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
import { Menu } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet'

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

  const NavItems = () => (
    <>
      <a href="#product" className="text-sm font-medium text-purple-200 hover:text-purple-100 transition-colors">Product</a>
      <a href="#features" className="text-sm font-medium text-purple-200 hover:text-purple-100 transition-colors">Features</a>
      <a href="#integrations" className="text-sm font-medium text-purple-200 hover:text-purple-100 transition-colors">Integrations</a>
      <a href="#templates" className="text-sm font-medium text-purple-200 hover:text-purple-100 transition-colors">Templates</a>
      <a href="#pricing" className="text-sm font-medium text-purple-200 hover:text-purple-100 transition-colors">Pricing</a>
      <a href="#enterprise" className="text-sm font-medium text-purple-200 hover:text-purple-100 transition-colors">Enterprise</a>
    </>
  );

  return (
    <header className="pointer-events-none sticky top-0 z-40">
      <div className="pointer-events-auto bg-purple-950/90 backdrop-blur supports-backdrop:backdrop-blur-md border-b border-purple-800/50">
        <div className="mx-auto max-w-7xl px-4">
          <div className="h-14 flex items-center justify-between gap-4">
            {/* Brand + Sidebar toggle */}
            <div className="flex items-center gap-2 select-none">
              <SidebarTrigger className="hidden md:inline-flex text-purple-300 hover:text-purple-100" />

              {/* Mobile Menu */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden text-purple-300 hover:text-purple-100 hover:bg-purple-900/50">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] bg-purple-950 border-purple-800 text-purple-100 sm:w-[400px]">
                  <div className="flex flex-col gap-6 mt-8">
                    <div className="text-lg font-mono font-light tracking-tight text-purple-100">web4.sbs</div>
                    <nav className="flex flex-col gap-4">
                      <NavItems />
                      <div className="h-px bg-purple-800/50 my-2" />
                      <a href="#docs" className="text-sm font-medium text-purple-200 hover:text-purple-100 transition-colors">Docs & FAQs</a>
                      <a href="/discover" className="text-sm font-medium text-purple-200 hover:text-purple-100 transition-colors">Community</a>
                      <a href="#blog" className="text-sm font-medium text-purple-200 hover:text-purple-100 transition-colors">Blog</a>
                    </nav>
                  </div>
                </SheetContent>
              </Sheet>

              <div className="text-lg font-mono font-light text-purple-100 tracking-tight ml-2 md:ml-0">web4.sbs</div>
            </div>

            {/* Desktop Nav */}
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
