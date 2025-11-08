import { Button } from '@/components/ui/button'

export function MarketingFooter() {
  return (
    <footer className="mt-16 border-t border-accent/20 bg-bg-3/50 dark:bg-bg-2/50 backdrop-blur supports-backdrop:backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-8">
          <div>
            <div className="text-sm font-semibold mb-3 text-text-secondary">Product</div>
            <ul className="space-y-2 text-sm text-text-tertiary">
              <li><a href="#features" className="hover:underline">Features</a></li>
              <li><a href="#templates" className="hover:underline">Templates</a></li>
              <li><a href="#integrations" className="hover:underline">Integrations</a></li>
              <li><a href="#pricing" className="hover:underline">Pricing</a></li>
            </ul>
          </div>
          <div>
            <div className="text-sm font-semibold mb-3 text-text-secondary">Resources</div>
            <ul className="space-y-2 text-sm text-text-tertiary">
              <li><a href="#docs" className="hover:underline">Docs & FAQs</a></li>
<li><a href="/discover" className="hover:underline">Community</a></li>
              <li><a href="#blog" className="hover:underline">Blog</a></li>
              <li><a href="#changelog" className="hover:underline">Changelog</a></li>
            </ul>
          </div>
          <div>
            <div className="text-sm font-semibold mb-3 text-text-secondary">Company</div>
            <ul className="space-y-2 text-sm text-text-tertiary">
              <li><a href="#enterprise" className="hover:underline">Enterprise</a></li>
              <li><a href="#" className="hover:underline">Careers</a></li>
              <li><a href="#" className="hover:underline">Contact</a></li>
            </ul>
          </div>
          <div className="col-span-2 sm:col-span-1 md:col-span-2">
            <div className="text-sm font-semibold mb-3 text-text-secondary">Stay up to date</div>
            <div className="flex gap-2">
              <input className="flex-1 rounded-md border bg-bg-3 dark:bg-bg-2 px-3 py-2 text-sm" placeholder="Email address" />
              <Button size="sm">Subscribe</Button>
            </div>
            <p className="text-xs text-text-tertiary mt-2">By subscribing you agree to our terms.</p>
          </div>
        </div>
        <div className="mt-10 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 text-xs text-text-tertiary">
          <div>© {new Date().getFullYear()} web4.sbs. All rights reserved.</div>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:underline">Terms</a>
            <a href="#" className="hover:underline">Privacy</a>
            <a href="#" className="hover:underline">Security</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default MarketingFooter
