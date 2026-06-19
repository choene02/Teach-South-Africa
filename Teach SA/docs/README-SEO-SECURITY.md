# SEO + Security Notes

## robots.txt
- Located at `robots.txt`.
- Allows crawling of the site root.

## sitemap.xml
- Located at `sitemap.xml`.
- **Note:** currently uses `http://localhost:8000` URLs for local testing.
- When deploying, regenerate/update the `<loc>` values to your real domain (e.g., `https://www.teachsouthafrica.org/...`).

## Security headers
- Because this is a static repo, security headers must be configured in your hosting layer (e.g., Nginx, Apache, Cloudflare, Netlify, GitHub Pages proxy, etc.).
- See `security-headers.txt` for recommended header values.

## Page speed suggestions
- Compress images and serve modern formats (WebP/AVIF).
- Use proper `width`/`height` attributes for all images (reduce layout shift).
- Consider lazy-loading below-the-fold images (already used on gallery images).

## Local search optimisation
- Create/verify a Google Business Profile.
- Add consistent NAP (Name/Address/Phone) across directories.
- Collect reviews and embed the location in your site (already added map container). 

