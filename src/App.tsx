import React, { useState, useEffect, useRef } from 'react';
import { Heart, ExternalLink } from 'lucide-react';
import { PLATFORMS, toUrl, extractHostAndPath, detectPlatform } from './platforms';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineIndicator } from './components/OfflineIndicator';
import { LikedSitesModal, LikedSite } from './components/LikedSitesModal';
import { getWebsiteScreenshotUrl } from './utils/screenshot';

export default function App() {
  const [siteQuery, setSiteQuery] = useState<string>('');
  const [platform, setPlatform] = useState<string>('vercel');
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const [progressWidth, setProgressWidth] = useState<number>(0);
  const [showLikedModal, setShowLikedModal] = useState<boolean>(false);
  const [justLiked, setJustLiked] = useState<boolean>(false);

  // Liked sites saved and synced in localStorage
  const [likedSites, setLikedSites] = useState<LikedSite[]>(() => {
    try {
      const saved = localStorage.getItem('site_opener_liked_sites');
      if (saved) {
        const parsed: LikedSite[] = JSON.parse(saved);
        return parsed.map((site) => ({
          ...site,
          screenshotUrl: site.screenshotUrl || getWebsiteScreenshotUrl(site.url),
          path: site.path || extractHostAndPath(site.url).path,
        }));
      }
      return [];
    } catch {
      return [];
    }
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);

  // Sync liked sites to localStorage whenever changed
  useEffect(() => {
    try {
      localStorage.setItem('site_opener_liked_sites', JSON.stringify(likedSites));
    } catch {
      // ignore
    }
  }, [likedSites]);

  // Load initial state from URL or localStorage
  useEffect(() => {
    try {
      const savedPlat = localStorage.getItem('site_opener_platform');
      const params = new URLSearchParams(window.location.search);
      const urlPlat = params.get('p');
      const urlSite = params.get('site');

      const initialPlat = urlPlat || savedPlat || 'vercel';
      if (PLATFORMS.some((p) => p.key === initialPlat)) {
        setPlatform(initialPlat);
      }

      if (urlSite) {
        setSiteQuery(urlSite);
        openSite(urlSite, initialPlat);
      }
    } catch {
      // ignore
    }
  }, []);

  const openSite = (raw: string, platKey: string = platform) => {
    const url = toUrl(raw, platKey);
    if (!url) {
      inputRef.current?.focus();
      return;
    }

    setCurrentUrl(url);
    setProgressWidth(80);

    const { fullClean } = extractHostAndPath(url);
    document.title = fullClean;

    try {
      window.history.replaceState(null, '', `?site=${encodeURIComponent(raw.trim())}&p=${encodeURIComponent(platKey)}`);
      localStorage.setItem('site_opener_platform', platKey);
    } catch {
      // ignore
    }

    inputRef.current?.blur();
  };

  const handleFrameLoad = () => {
    setProgressWidth(100);
    setTimeout(() => {
      setProgressWidth(0);
    }, 150);
  };

  const handleInputChange = (val: string) => {
    // Strip leading https:// or http:// if pasted by user
    const clean = val.replace(/^https?:\/\//i, '');
    setSiteQuery(clean);

    // Auto-detect platform if domain suffix matches
    const detected = detectPlatform(clean);
    if (detected) {
      setPlatform(detected);
    }
  };

  const handlePlatformChange = (newPlat: string) => {
    setPlatform(newPlat);
    try {
      localStorage.setItem('site_opener_platform', newPlat);
    } catch {
      // ignore
    }

    if (siteQuery.trim()) {
      openSite(siteQuery, newPlat);
    } else {
      inputRef.current?.focus();
    }
  };

  const handleOpenExternal = () => {
    const url = currentUrl || toUrl(siteQuery, platform);
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  // Instant check if currently open site is liked
  const isCurrentLiked = currentUrl ? likedSites.some((s) => s.url === currentUrl) : false;

  // Ultra-fast instant toggle for like button
  const toggleLikeCurrentSite = () => {
    if (!currentUrl) {
      if (siteQuery.trim()) {
        openSite(siteQuery, platform);
      } else {
        setShowLikedModal(true);
      }
      return;
    }

    const { host, path, fullClean } = extractHostAndPath(currentUrl);

    if (isCurrentLiked) {
      setLikedSites((prev) => prev.filter((s) => s.url !== currentUrl));
      setJustLiked(false);
    } else {
      const screenshot = getWebsiteScreenshotUrl(currentUrl);
      const newLiked: LikedSite = {
        id: `like-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        url: currentUrl,
        host: host,
        path: path && path !== '/' ? path : undefined,
        query: siteQuery || fullClean,
        platform: platform,
        likedAt: Date.now(),
        screenshotUrl: screenshot,
      };
      setLikedSites((prev) => [newLiked, ...prev]);
      setJustLiked(true);
      setTimeout(() => setJustLiked(false), 900);
    }
  };

  const handleSelectLikedSite = (site: LikedSite) => {
    setSiteQuery(site.query || site.url.replace(/^https?:\/\//i, ''));
    setPlatform(site.platform);
    openSite(site.url, site.platform);
    setShowLikedModal(false);
  };

  const handleRemoveLikedSite = (id: string) => {
    setLikedSites((prev) => prev.filter((s) => s.id !== id));
  };

  const handleClearAllLiked = () => {
    setLikedSites([]);
  };

  const handleRefreshScreenshot = (id: string) => {
    setLikedSites((prev) =>
      prev.map((site) => {
        if (site.id === id) {
          const fresh = `${getWebsiteScreenshotUrl(site.url)}&timestamp=${Date.now()}`;
          return { ...site, screenshotUrl: fresh };
        }
        return site;
      })
    );
  };

  const currentPlatformObj = PLATFORMS.find((p) => p.key === platform) || PLATFORMS[0];
  const suffix = currentPlatformObj.suffix;
  const placeholder = suffix
    ? `site ka naam ya domain (jaise ssc2026-mu${suffix}/analyse)`
    : `poora domain ya link (jaise mysite.com/analyse)`;

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0f1115] text-[#e8eaf0] overflow-hidden select-none font-sans">
      {/* Topnav: Input takes largest width, compact dropdown inside, then Like History, Open in New Tab, Download PWA */}
      <header className="flex-none h-14 bg-[#171a21] border-b border-[#262b36] z-20 flex items-center gap-1.5 px-2 sm:px-3">
        {/* Largest Section: Search Bar with Input & Compact Dropdown */}
        <div className="flex-1 min-w-0 flex items-center h-10 bg-[#0f1115] border border-[#262b36] focus-within:border-[#4f8cff] rounded-xl pl-2.5 sm:pl-3 pr-1 transition-all">
          <input
            ref={inputRef}
            type="text"
            value={siteQuery}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                openSite(siteQuery, platform);
              }
            }}
            placeholder={placeholder}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck="false"
            enterKeyHint="go"
            className="flex-1 min-w-0 bg-transparent text-[#e8eaf0] text-xs sm:text-sm focus:outline-none placeholder:text-[#555d6f] px-1"
          />

          {/* Compact Platform Dropdown inside search bar */}
          <select
            aria-label="Platform"
            value={platform}
            onChange={(e) => handlePlatformChange(e.target.value)}
            className="bg-[#171a21] hover:bg-[#202530] text-[#4f8cff] font-semibold text-[11px] sm:text-xs rounded-lg h-[28px] px-1.5 outline-none border border-[#262b36] cursor-pointer max-w-[80px] sm:max-w-[115px] truncate transition ml-1 flex-none"
          >
            {PLATFORMS.map((p) => (
              <option key={p.key} value={p.key} className="bg-[#171a21] text-[#e8eaf0]">
                {p.suffix ? p.suffix : p.name}
              </option>
            ))}
          </select>
        </div>

        {/* 1. Like History Button */}
        <button
          onClick={() => setShowLikedModal(true)}
          className={`h-10 px-2.5 flex items-center justify-center gap-1.5 rounded-xl border transition active:scale-95 flex-none cursor-pointer ${
            likedSites.length > 0
              ? 'bg-[#0f1115] hover:bg-[#262b36] text-[#ff2d55] border-pink-500/30'
              : 'bg-[#0f1115] hover:bg-[#262b36] text-[#ff2d55] border-[#262b36]'
          }`}
          title="Liked Sites History"
        >
          <Heart className={`w-4 h-4 ${likedSites.length > 0 ? 'fill-[#ff2d55] text-[#ff2d55]' : 'text-[#ff2d55]'}`} />
          {likedSites.length > 0 && (
            <span className="text-xs font-bold text-white font-mono bg-pink-500/20 px-1.5 py-0.5 rounded-md border border-pink-500/30">
              {likedSites.length}
            </span>
          )}
        </button>

        {/* 2. Open in Other Web / New Tab Icon (↗) */}
        <button
          onClick={handleOpenExternal}
          className="h-10 w-10 flex items-center justify-center rounded-xl bg-[#0f1115] hover:bg-[#262b36] active:scale-95 text-[#e8eaf0] border border-[#262b36] transition flex-none cursor-pointer"
          title="Naye tab me kholo (↗)"
        >
          <ExternalLink className="w-4 h-4 text-slate-300" />
        </button>

        {/* 3. Download Icon (Jo download / install hone ke baad gayab ho jata hai) */}
        <PWAInstallButton compact={true} />
      </header>

      {/* Main Stage: 100% Clean */}
      <main className="flex-1 relative w-full h-[calc(100vh-56px)] bg-[#0f1115] overflow-hidden">
        {/* Fast Progress Bar */}
        <div
          className="absolute top-0 left-0 h-[2px] bg-[#4f8cff] transition-all duration-150 z-30"
          style={{ width: `${progressWidth}%` }}
        />

        {/* Fullscreen Iframe */}
        {currentUrl ? (
          <iframe
            ref={frameRef}
            src={currentUrl}
            title="site"
            onLoad={handleFrameLoad}
            allow="clipboard-write; fullscreen"
            referrerPolicy="no-referrer-when-downgrade"
            className="w-full h-full border-0 bg-white block"
          />
        ) : (
          <div className="w-full h-full bg-[#0f1115]" />
        )}

        {/* Liked Sites Modal */}
        {showLikedModal && (
          <LikedSitesModal
            likedSites={likedSites}
            onSelectSite={handleSelectLikedSite}
            onRemoveSite={handleRemoveLikedSite}
            onClearAll={handleClearAllLiked}
            onClose={() => setShowLikedModal(false)}
            onRefreshScreenshot={handleRefreshScreenshot}
          />
        )}

        {/* Offline notification if network disconnects */}
        <OfflineIndicator />
      </main>

      {/* Bottom Left Ultra Superfast Floating Like Button */}
      <div className="fixed bottom-5 left-5 z-[999] flex items-center gap-1.5">
        <button
          onClick={toggleLikeCurrentSite}
          className="p-1.5 bg-transparent border-0 outline-none cursor-pointer flex items-center justify-center relative active:scale-90 transition-transform duration-100"
          title={
            currentUrl
              ? isCurrentLiked
                ? 'Liked (Click to unlike)'
                : 'Like site'
              : 'Liked Sites'
          }
          aria-label="Like button"
        >
          <Heart
            className={`w-6 h-6 transition-colors duration-150 ${
              isCurrentLiked
                ? 'fill-[#ff2d55] text-[#ff2d55]'
                : 'fill-transparent text-[#ff2d55] hover:text-pink-400 stroke-[2]'
            }`}
          />
        </button>

        {/* Instant, quiet feedback pill */}
        {justLiked && (
          <div className="px-2 py-0.5 rounded-md bg-[#171a21]/95 backdrop-blur-sm text-slate-200 text-[11px] border border-white/10 shadow animate-in fade-in duration-100 select-none">
            Saved
          </div>
        )}
      </div>
    </div>
  );
}
