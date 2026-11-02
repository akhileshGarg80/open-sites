export interface Platform {
  key: string;
  name: string;
  suffix: string;
}

export const PLATFORMS: Platform[] = [
  { key: 'vercel', name: 'Vercel', suffix: '.vercel.app' },
  { key: 'netlify', name: 'Netlify', suffix: '.netlify.app' },
  { key: 'render', name: 'Render', suffix: '.onrender.com' },
  { key: 'railway', name: 'Railway', suffix: '.up.railway.app' },
  { key: 'github', name: 'GitHub Pages', suffix: '.github.io' },
  { key: 'cloudflare', name: 'Cloudflare Pages', suffix: '.pages.dev' },
  { key: 'firebase', name: 'Firebase', suffix: '.web.app' },
  { key: 'supabase', name: 'Supabase', suffix: '.supabase.co' },
  { key: 'fly', name: 'Fly.io', suffix: '.fly.dev' },
  { key: 'koyeb', name: 'Koyeb', suffix: '.koyeb.app' },
  { key: 'deno', name: 'Deno Deploy', suffix: '.deno.dev' },
  { key: 'heroku', name: 'Heroku', suffix: '.herokuapp.com' },
  { key: 'replit', name: 'Replit', suffix: '.replit.app' },
  { key: 'glitch', name: 'Glitch', suffix: '.glitch.me' },
  { key: 'surge', name: 'Surge', suffix: '.surge.sh' },
  { key: 'huggingface', name: 'Hugging Face Spaces', suffix: '.hf.space' },
  { key: 'gitlab', name: 'GitLab Pages', suffix: '.gitlab.io' },
  { key: 'cyclic', name: 'Cyclic', suffix: '.cyclic.app' },
  { key: 'digitalocean', name: 'DigitalOcean App', suffix: '.ondigitalocean.app' },
  { key: 'amplify', name: 'AWS Amplify', suffix: '.amplifyapp.com' },
  { key: 'lovable', name: 'Lovable', suffix: '.lovable.app' },
  { key: 'bolt', name: 'Bolt', suffix: '.bolt.host' },
  { key: 'custom', name: 'Custom Domain (Full URL)', suffix: '' },
];

/**
 * Automatically detects which platform an input domain belongs to.
 * e.g. "ssc2026-mu.vercel.app/analyse" -> "vercel"
 * "my-app.onrender.com" -> "render"
 * "mysite.com/test" -> "custom"
 */
export function detectPlatform(input: string): string | null {
  const clean = input.trim().toLowerCase().replace(/^https?:\/\//i, '');
  const slashIdx = clean.search(/[/?#]/);
  const host = slashIdx === -1 ? clean : clean.substring(0, slashIdx);

  for (const plat of PLATFORMS) {
    if (plat.suffix && host.endsWith(plat.suffix)) {
      return plat.key;
    }
  }

  if (host.includes('.')) {
    return 'custom';
  }

  return null;
}

/**
 * Universal URL resolver:
 * Converts user input into a complete, working HTTPS URL.
 * Supports:
 * - "ssc2026-mu.vercel.app/analyse" (without https://)
 * - "ssc2026-mu/analyse" (under Vercel platform)
 * - "https://ssc2026-mu.vercel.app/analyse"
 * - "mywebsite.org/path?key=value#hash"
 */
export function toUrl(raw: string, platformKey: string): string {
  let trimmed = raw.trim();
  if (!trimmed) return '';

  // Extract explicit protocol if user provided it
  let protocol = 'https://';
  if (/^http:\/\//i.test(trimmed)) {
    protocol = 'http://';
    trimmed = trimmed.replace(/^http:\/\//i, '');
  } else if (/^https:\/\//i.test(trimmed)) {
    protocol = 'https://';
    trimmed = trimmed.replace(/^https:\/\//i, '');
  }

  // Split into host (and optional port) vs path/query/hash
  const slashIdx = trimmed.search(/[/?#]/);
  let hostPart = slashIdx === -1 ? trimmed : trimmed.substring(0, slashIdx);
  const pathPart = slashIdx === -1 ? '' : trimmed.substring(slashIdx);

  hostPart = hostPart.trim().toLowerCase().replace(/\s+/g, '');
  if (!hostPart) return '';

  // Check if host already ends with ANY known platform suffix
  const matchedPlat = PLATFORMS.find((p) => p.suffix && hostPart.endsWith(p.suffix));

  if (matchedPlat) {
    // Host already contains a valid platform suffix (e.g. ssc2026-mu.vercel.app)
    // Do not append any additional suffix!
  } else if (hostPart.includes('.')) {
    // Host already contains a dot (e.g. custom domain "example.com" or "sub.site.io")
    // Keep host as-is!
  } else {
    // Host has no dots (e.g. "ssc2026-mu")
    // Append the selected platform's suffix if it has one
    const plat = PLATFORMS.find((p) => p.key === platformKey);
    const suffix = plat?.suffix ? plat.suffix.toLowerCase() : '';
    if (suffix) {
      hostPart += suffix;
    }
  }

  // Format path/query part cleanly
  let formattedPath = pathPart.trim();
  if (formattedPath && !formattedPath.startsWith('/') && !formattedPath.startsWith('?') && !formattedPath.startsWith('#')) {
    formattedPath = '/' + formattedPath;
  }

  return protocol + hostPart + formattedPath;
}

/**
 * Extracts host, path, and clean display name for header title & modals
 */
export function extractHostAndPath(url: string): { host: string; path: string; fullClean: string } {
  try {
    const clean = url.replace(/^https?:\/\//i, '');
    const slashIdx = clean.search(/[/?#]/);
    const host = slashIdx === -1 ? clean : clean.substring(0, slashIdx);
    const path = slashIdx === -1 ? '' : clean.substring(slashIdx);
    return { host, path, fullClean: clean };
  } catch {
    return { host: url, path: '', fullClean: url };
  }
}
