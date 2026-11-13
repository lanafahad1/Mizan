import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'CareBite: Care in every bite',
    short_name: 'CareBite',
    description: 'Track, plan and enjoy food that fits you: a private food diary with calorie goals, and hospital meals checked for each patient.',
    start_url: '/',
    display: 'standalone',
    background_color: '#FBF8F3',
    theme_color: '#3730A3',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' }],
  };
}
