import { Button } from '@/components/ui/button'
import { GoogleGeminiEffectDemo } from '@/components/ui/google-gemini-effect-demo'

export function MarketingFooter() {
  return (
    <footer className="mt-16 border-t border-purple-800/50 bg-purple-950 backdrop-blur supports-backdrop:backdrop-blur-md">
      <div className="w-full">
        <GoogleGeminiEffectDemo />
      </div>
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-8">
          <div>
            <div className="text-xs font-mono font-light mb-3 text-purple-300 uppercase tracking-wider">Product</div>
            <ul className="space-y-2 text-xs font-mono text-purple-400">
              <li><a href="#features" className="hover:underline">Features</a></li>
              <li><a href="#templates" className="hover:underline">Templates</a></li>
              <li><a href="#integrations" className="hover:underline">Integrations</a></li>
              <li><a href="#pricing" className="hover:underline">Pricing</a></li>
            </ul>
          </div>
          <div>
            <div className="text-xs font-mono font-light mb-3 text-purple-300 uppercase tracking-wider">Resources</div>
            <ul className="space-y-2 text-xs font-mono text-purple-400">
              <li><a href="#docs" className="hover:underline">Docs & FAQs</a></li>
              <li><a href="/discover" className="hover:underline">Community</a></li>
              <li><a href="#blog" className="hover:underline">Blog</a></li>
              <li><a href="#changelog" className="hover:underline">Changelog</a></li>
            </ul>
          </div>
          <div>
            <div className="text-xs font-mono font-light mb-3 text-purple-300 uppercase tracking-wider">Company</div>
            <ul className="space-y-2 text-xs font-mono text-purple-400">
              <li><a href="#enterprise" className="hover:underline">Enterprise</a></li>
              <li><a href="#" className="hover:underline">Careers</a></li>
              <li><a href="#" className="hover:underline">Contact</a></li>
            </ul>
          </div>
          <div className="col-span-2 sm:col-span-1 md:col-span-2">
            <div className="text-xs font-mono font-light mb-3 text-purple-300 uppercase tracking-wider">Stay up to date</div>
            <div className="flex gap-2">
              <input className="flex-1 border border-purple-800/50 bg-purple-900/30 px-3 py-2 text-xs font-mono text-purple-100 placeholder:text-purple-500 focus:border-purple-700 focus:outline-none rounded-lg" placeholder="Email address" />
              <Button size="sm" className="bg-purple-500 text-white hover:bg-purple-400 font-mono border-0 rounded-lg">Subscribe</Button>
            </div>
            <p className="text-xs font-mono text-purple-400 mt-2">By subscribing you agree to our terms.</p>
          </div>
        </div>
        <div className="mt-8 flex justify-center">
          <a href="https://www.producthunt.com/products/web4-sbs?embed=true&utm_source=badge-featured&utm_medium=badge&utm_source=badge-web4&#0045;sbs" target="_blank" rel="noopener noreferrer">
            <img
              src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1037027&theme=dark&t=1762969127698"
              alt="Web4&#0046;sbs - Turn&#0032;ideas&#0032;into&#0032;fully&#0032;functional&#0032;apps&#0032;no&#0032;coding&#0032;required | Product Hunt"
              style={{ width: 250, height: 54 }}
              width="250"
              height="54"
            />
          </a>
        </div>
        <div className="mt-10 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 text-xs font-mono text-purple-400">
          <div>© {new Date().getFullYear()} web4.sbs. All rights reserved.</div>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-purple-200 transition-colors">Terms</a>
            <a href="#" className="hover:text-purple-200 transition-colors">Privacy</a>
            <a href="#" className="hover:text-purple-200 transition-colors">Security</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default MarketingFooter
