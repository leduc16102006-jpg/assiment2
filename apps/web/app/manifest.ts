import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'BrewLite - Đặt đồ uống trực tuyến',
    short_name: 'BrewLite',
    description: 'Đặt cà phê và đồ uống trực tuyến với BrewLite.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#F5F1E8',
    theme_color: '#4B2E1F',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}