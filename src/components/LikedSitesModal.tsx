import React, { useState, useMemo } from 'react';
import {
  Heart,
  Search,
  ExternalLink,
  Trash2,
  X,
  RotateCw,
  Copy,
  Check,
  Play,
  Image as ImageIcon,
  Sparkles,
} from 'lucide-react';
import {
  getWebsiteFaviconUrl,
  getWebsiteScreenshotUrl,
  getFallbackScreenshotUrl,
} from '../utils/screenshot';

export interface LikedSite {
  id: string;
  url: string;
  host: string;
  query: string;
  platform: string;
  likedAt: number;
  screenshotUrl?: string;
  path?: string;
}

interface LikedSitesModalProps {
  likedSites: LikedSite[];
  onSelectSite: (site: LikedSite) => void;
  onRemoveSite: (id: string) => void;
  onClearAll: () => void;
  onClose: () => void;
  onRefreshScreenshot?: (id: string) => void;
  onUpdateSiteScreenshot?: (id: string, newUrl: string) => void;
}

// Individual site card with 100% clean, tag-free screenshot and fallback
const LikedSiteCard: React.FC<{
  site: LikedSite;
  onSelect: () => void;
  onRemove: () => void;
  onRefreshScreenshot: () => void;
}> = ({ site, onSelect, onRemove, onRefreshScreenshot }) => {
  const [imgErrorStage, setImgErrorStage] = useState<number>(0); // 0 = primary, 1 = fallback, 2 = styled banner
  const [imgLoaded, setImgLoaded] = useState(false);
  const [copied, setCopied] = useState(false);

  // Determine current image source based on error stage
  const primarySrc = site.screenshotUrl || getWebsiteScreenshotUrl(site.url);
  const fallbackSrc = getFallbackScreenshotUrl(site.url);
  const currentImgSrc = imgErrorStage === 0 ? primarySrc : fallbackSrc;

  const faviconSrc = getWebsiteFaviconUrl(site.url || site.host);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(site.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImageError = () => {
    if (imgErrorStage === 0) {
      setImgErrorStage(1); // Try fallback real renderer
      setImgLoaded(false);
    } else {
      setImgErrorStage(2); // Show styled card banner
    }
  };

  return (
    <div className="group relative flex flex-col rounded-xl bg-[#0f1115] hover:bg-[#151922] border border-[#262b36] hover:border-[#4f8cff]/50 transition-all duration-200 overflow-hidden shadow-lg hover:shadow-cyan-950/20">
      {/* Clean Screenshot Preview Box (Zero tags or badges on top of the image) */}
      <div
        onClick={onSelect}
        className="relative w-full h-36 sm:h-42 bg-[#0a0c10] cursor-pointer overflow-hidden border-b border-[#262b36]/80 flex items-center justify-center select-none"
        title="App me kholne ke liye click karein"
      >
        {/* Animated Loading skeleton */}
        {!imgLoaded && imgErrorStage !== 2 && (
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 animate-pulse flex items-center justify-center z-0">
            <div className="flex flex-col items-center gap-1.5 opacity-60">
              <ImageIcon className="w-6 h-6 text-slate-500 animate-bounce" />
              <span className="text-[11px] text-slate-400">Screenshot loading...</span>
            </div>
          </div>
        )}

        {/* Real Chromium Screenshot Image - Completely clean, unobstructed view */}
        {imgErrorStage !== 2 ? (
          <img
            key={currentImgSrc}
            src={currentImgSrc}
            alt={`Screenshot of ${site.host}`}
            loading="lazy"
            onLoad={() => setImgLoaded(true)}
            onError={handleImageError}
            className={`w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105 relative z-10 ${
              imgLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ) : (
          /* Styled Fallback Banner */
          <div className="w-full h-full p-4 bg-gradient-to-br from-[#121824] via-[#0f1115] to-[#1e1b4b]/40 flex flex-col items-center justify-center text-center relative z-10">
            <img
              src={faviconSrc}
              alt=""
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
              className="w-10 h-10 rounded-lg p-1 bg-white/10 border border-white/20 mb-2 shadow"
            />
            <span className="text-xs font-semibold text-white truncate max-w-[90%]">
              {site.host}
            </span>
            {site.path && (
              <span className="text-[11px] text-cyan-400 font-mono truncate max-w-[90%]">
                {site.path}
              </span>
            )}
            <span className="text-[10px] text-slate-500 mt-1">Live web preview</span>
          </div>
        )}

        {/* Hover overlay with play button */}
        <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px] z-20">
          <span className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-blue-600/40 transform scale-95 group-hover:scale-100 transition-transform">
            <Play className="w-3.5 h-3.5 fill-white" />
            App me Kholein
          </span>
        </div>

        {/* Top-right subtle Refresh Button on hover */}
        <div className="absolute top-2 right-2 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setImgLoaded(false);
              setImgErrorStage(0);
              onRefreshScreenshot();
            }}
            className="p-1.5 rounded-md bg-black/80 hover:bg-black text-slate-300 hover:text-white border border-white/20 backdrop-blur-md transition shadow cursor-pointer"
            title="Screenshot dubara refresh karein"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Info & Actions */}
      <div className="p-3 flex flex-col justify-between flex-1 gap-2">
        <div
          onClick={onSelect}
          className="cursor-pointer min-w-0"
          title={`${site.url} (Kholne ke liye click karein)`}
        >
          <div className="flex items-center gap-2 mb-1">
            <img
              src={faviconSrc}
              alt=""
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
              className="w-4 h-4 rounded-sm flex-none"
            />
            <span className="font-bold text-xs sm:text-sm text-white group-hover:text-blue-400 transition truncate">
              {site.host}
            </span>
          </div>

          {/* Subdomain / Deep Path indicator */}
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono truncate">
            {site.path && site.path !== '/' ? (
              <span className="text-cyan-400 font-semibold bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/40 truncate">
                {site.path}
              </span>
            ) : (
              <span className="truncate text-slate-500">{site.url.replace(/^https?:\/\//i, '')}</span>
            )}
          </div>
        </div>

        {/* Bottom toolbar */}
        <div className="flex items-center justify-between pt-2 border-t border-[#262b36]/60">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500">
              {new Date(site.likedAt).toLocaleDateString()}
            </span>
            <span className="text-[10px] text-slate-400 uppercase font-medium bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700/50">
              {site.platform}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg bg-[#171a21] hover:bg-[#202530] text-slate-400 hover:text-white transition"
              title="Copy URL"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                window.open(site.url, '_blank', 'noopener,noreferrer');
              }}
              className="p-1.5 rounded-lg bg-[#171a21] hover:bg-[#202530] text-slate-400 hover:text-white transition"
              title="Naye tab me kholo ↗"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition"
              title="Unlike / Delete karein"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const LikedSitesModal: React.FC<LikedSitesModalProps> = ({
  likedSites,
  onSelectSite,
  onRemoveSite,
  onClearAll,
  onClose,
  onRefreshScreenshot,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSites = useMemo(() => {
    if (!searchTerm.trim()) return likedSites;
    const q = searchTerm.toLowerCase().trim();
    return likedSites.filter(
      (s) =>
        s.host.toLowerCase().includes(q) ||
        (s.path && s.path.toLowerCase().includes(q)) ||
        s.url.toLowerCase().includes(q) ||
        s.query.toLowerCase().includes(q) ||
        s.platform.toLowerCase().includes(q)
    );
  }, [likedSites, searchTerm]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-3 sm:p-5 animate-in fade-in duration-150">
      <div className="w-full max-w-4xl max-h-[88vh] rounded-2xl bg-[#171a21] border border-[#262b36] shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-[#262b36] flex-none bg-[#14171d]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center border border-red-500/30">
              <Heart className="w-5 h-5 fill-red-500 text-red-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-white text-base sm:text-lg leading-tight">
                  Liked Sites History
                </h2>
                <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Real Screenshots
                </span>
              </div>
              <span className="text-xs text-slate-400">
                Kul {likedSites.length} site(s) saved with clean preview screenshots
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {likedSites.length > 0 && (
              <button
                onClick={() => {
                  if (window.confirm('Kya aap sach me saari liked sites delete karna chahte hain?')) {
                    onClearAll();
                  }
                }}
                className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-red-500/10 transition border border-transparent hover:border-red-500/30"
                title="Saari list clear karein"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Clear All</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search bar */}
        {likedSites.length > 1 && (
          <div className="px-4 sm:px-6 py-2.5 border-b border-[#262b36]/60 bg-[#12151c]">
            <div className="flex items-center bg-[#0f1115] border border-[#262b36] focus-within:border-[#4f8cff] rounded-xl px-3 py-2 transition">
              <Search className="w-4 h-4 text-slate-500 mr-2.5 flex-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Liked sites, subdomains ya paths search karein (e.g. ssc2026-mu, analyse, vercel)..."
                className="w-full bg-transparent text-xs sm:text-sm text-slate-200 focus:outline-none placeholder:text-slate-500"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="text-slate-500 hover:text-white text-xs px-1.5 py-0.5 rounded bg-slate-800"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        )}

        {/* Real Screenshot Cards Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {filteredSites.length === 0 ? (
            <div className="py-16 text-center text-slate-500 flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-800/50 flex items-center justify-center mb-3 border border-slate-700/50">
                <Heart className="w-8 h-8 text-slate-600 stroke-[1.5]" />
              </div>
              {likedSites.length === 0 ? (
                <>
                  <p className="text-base font-semibold text-slate-300">Abhi koi site like nahi ki gayi hai</p>
                  <p className="text-xs text-slate-400 mt-1.5 max-w-sm">
                    Jab koi site open ho, to screen ke bottom-left par bane ❤️ button ko click karein — uska real clean screenshot automatically yahan save hoga!
                  </p>
                </>
              ) : (
                <p className="text-sm text-slate-400">&apos;{searchTerm}&apos; ke liye koi site nahi mili.</p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredSites.map((site) => (
                <LikedSiteCard
                  key={site.id}
                  site={site}
                  onSelect={() => onSelectSite(site)}
                  onRemove={() => onRemoveSite(site.id)}
                  onRefreshScreenshot={() => onRefreshScreenshot?.(site.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer info */}
        {likedSites.length > 0 && (
          <div className="px-4 sm:px-6 py-2.5 border-t border-[#262b36] bg-[#14171d] text-[11px] text-slate-400 flex items-center justify-between">
            <span className="hidden sm:inline">Kisi bhi card ke screenshot par click karke turant app me open karein</span>
            <span className="sm:hidden">Click card to open in app</span>
            <span className="font-mono text-slate-500 font-semibold">{filteredSites.length} of {likedSites.length} sites</span>
          </div>
        )}
      </div>
    </div>
  );
};
