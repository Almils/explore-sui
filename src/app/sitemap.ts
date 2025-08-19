import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const pages = ['', 'welcome', 'agent', 'explore', 'deepbook', 'walrus', 'passkey', 'profile'];
  return pages.map((p) => ({
    url: `${base}/${p}`,
    changefreq: 'weekly',
    priority: p === '' ? 1 : 0.7,
  }));
}
