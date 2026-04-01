import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/admin/',
        '/dashboard/',
        '/profile/',
        '/auth/',
      ],
    },
    sitemap: 'https://unideal.vercel.app/sitemap.xml',
  }
}
