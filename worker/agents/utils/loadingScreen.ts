/**
 * Generates a loading screen to show while the app is being built
 * This gets deployed immediately after blueprint generation
 */
export function generateLoadingScreenPage(projectName: string, query: string): string {
    return `export default function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 p-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* Logo/Brand */}
        <div className="flex items-center justify-center gap-3">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-2xl">
            <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-white">web4.sbs</h1>
        </div>

        {/* Main Message */}
        <div className="space-y-4">
          <h2 className="text-3xl font-bold text-white">
            Building Your App...
          </h2>
          <p className="text-xl text-white/90">
            ${projectName}
          </p>
          <p className="text-lg text-white/80 max-w-xl mx-auto">
            ${query.substring(0, 150)}${query.length > 150 ? '...' : ''}
          </p>
        </div>

        {/* Animated Loading Spinner */}
        <div className="flex items-center justify-center">
          <div className="relative">
            <div className="w-24 h-24 border-8 border-white/20 border-t-white rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 border-8 border-transparent border-t-cyan-300 rounded-full animate-spin" style={{ animationDuration: '0.8s' }}></div>
            </div>
          </div>
        </div>

        {/* Status Messages */}
        <div className="space-y-3 text-white/80">
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>AI analyzing your requirements</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <span>Generating code architecture</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            <span>Building your application</span>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-8 text-white/60 text-sm">
          <p>This usually takes 1-3 minutes</p>
          <p className="mt-2">Powered by AI • Built on Cloudflare</p>
        </div>
      </div>
    </div>
  );
}
`;
}

/**
 * Generates index file that renders the loading screen
 */
export function generateLoadingScreenIndex(): string {
    return `import { createRoot } from 'react-dom/client';
import LoadingScreen from './LoadingScreen';
import './index.css';

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(<LoadingScreen />);
}
`;
}
