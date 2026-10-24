import type { NextConfig } from 'next';

const isDev = process.env.NODE_ENV === 'development';
// CSP_REPORT_ONLY=1 ile build alınırsa politika engellemez, yalnızca ihlalleri konsola yazar.
const reportOnly = process.env.CSP_REPORT_ONLY === '1';

// Ayrıntı ve gerekçeler: SECURITY.md
// - 'unsafe-inline' (script): sayfa statik prerender ediliyor; nonce dinamik render gerektirir.
//   XSS'e karşı asıl önlem hiçbir kullanıcı/AI içeriğinin HTML olarak render edilmemesi.
// - YouTube: IFrame API script'i ve oynatıcı iframe'i www.youtube.com'dan gelir.
// - blob: PDF görüntüleme (frame) ve PWA manifest'i (Adım 10'a kadar) blob URL'si.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' https://www.youtube.com https://s.ytimg.com${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://img.youtube.com https://i.ytimg.com",
  "font-src 'self'",
  `connect-src 'self'${isDev ? ' ws: wss:' : ''}`,
  "media-src 'self'",
  'frame-src https://www.youtube.com https://www.youtube-nocookie.com blob:',
  "worker-src 'self' blob:",
  "manifest-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

const securityHeaders = [
  { key: reportOnly ? 'Content-Security-Policy-Report-Only' : 'Content-Security-Policy', value: csp },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  // YouTube gömmeleri yönlendiren (origin) bilgisine ihtiyaç duyar; tam adres gönderilmez.
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()',
  },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
  // Yalnızca HTTPS'te etkilidir; alt alan adlarını kapsamaz.
  { key: 'Strict-Transport-Security', value: 'max-age=31536000' },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  },
};

export default nextConfig;
