/**
 * Utilities for real website screenshots, screen capture, and favicons
 */

/**
 * Returns a real headless Chromium browser screenshot URL via Microlink
 * This executes JavaScript, web fonts, CSS, and dynamic content on a real browser.
 */
export function getWebsiteScreenshotUrl(url: string): string {
  if (!url) return '';
  // Microlink uses a real headless Chromium instance to render the live webpage and returns a PNG
  return `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&embed=screenshot.url`;
}

/**
 * Alternative real browser screenshot fallback via thum.io
 */
export function getFallbackScreenshotUrl(url: string): string {
  if (!url) return '';
  return `https://image.thum.io/get/width/800/crop/600/${url}`;
}

/**
 * Extracts clean domain and retrieves high-res Google favicon
 */
export function getWebsiteFaviconUrl(urlOrHost: string, size = 64): string {
  if (!urlOrHost) return '';
  try {
    let domain = urlOrHost.trim();
    if (domain.startsWith('http://') || domain.startsWith('https://')) {
      domain = new URL(urlOrHost).hostname;
    } else {
      domain = domain.split('/')[0].split('?')[0].split('#')[0];
    }
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=${size}`;
  } catch {
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(urlOrHost)}&sz=${size}`;
  }
}

/**
 * Captures the real screen directly from the user's browser viewport / display
 * Returns a high-res base64 JPEG data URL
 */
export async function captureCurrentScreen(): Promise<string | null> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getDisplayMedia) {
    return null;
  }
  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        displaySurface: 'browser',
      } as MediaTrackConstraints,
    });

    const video = document.createElement('video');
    video.srcObject = stream;
    video.playsInline = true;
    video.muted = true;

    await new Promise<void>((resolve) => {
      video.onloadedmetadata = () => {
        video.play().then(() => resolve()).catch(() => resolve());
      };
      // fallback timeout
      setTimeout(resolve, 800);
    });

    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      stream.getTracks().forEach((t) => t.stop());
      return null;
    }

    ctx.drawImage(video, 0, 0, width, height);
    stream.getTracks().forEach((t) => t.stop());

    return canvas.toDataURL('image/jpeg', 0.88);
  } catch (err) {
    console.warn('Real screen capture was cancelled or denied:', err);
    return null;
  }
}
