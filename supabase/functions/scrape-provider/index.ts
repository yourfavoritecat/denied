const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function extractMeta(html: string, property: string): string | null {
  // Try property="..." then name="..."
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`, 'i'),
  ];
  for (const p of patterns) {
    const m = html.match(p);
    if (m?.[1]) return m[1].trim();
  }
  return null;
}

function extractJsonLd(html: string): any[] {
  const results: any[] = [];
  const regex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = regex.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(m[1]);
      if (Array.isArray(parsed)) results.push(...parsed);
      else results.push(parsed);
    } catch { /* ignore */ }
  }
  return results;
}

function extractImages(html: string, baseUrl: string): string[] {
  const images: string[] = [];
  // og:image
  const ogImage = extractMeta(html, 'og:image');
  if (ogImage) images.push(ogImage);
  // twitter:image
  const twImage = extractMeta(html, 'twitter:image');
  if (twImage && !images.includes(twImage)) images.push(twImage);
  // prominent img tags (src with http)
  const imgRegex = /<img[^>]+src=["'](https?:\/\/[^"']+)["']/gi;
  let im;
  while ((im = imgRegex.exec(html)) !== null && images.length < 10) {
    const src = im[1];
    if (!images.includes(src) && !src.includes('icon') && !src.includes('logo') && !src.includes('pixel') && !src.includes('1x1')) {
      images.push(src);
    }
  }
  return images.slice(0, 10);
}

function extractSocialLinks(html: string): Record<string, string> {
  const links: Record<string, string> = {};
  const hrefRegex = /href=["'](https?:\/\/[^"']+)["']/gi;
  let m;
  while ((m = hrefRegex.exec(html)) !== null) {
    const url = m[1];
    if (url.includes('instagram.com') && !links.instagram) links.instagram = url;
    if (url.includes('facebook.com') && !links.facebook) links.facebook = url;
    if ((url.includes('google.com/maps') || url.includes('goo.gl/maps')) && !links.google_maps) links.google_maps = url;
    if (url.includes('yelp.com') && !links.yelp) links.yelp = url;
    if (url.includes('tiktok.com') && !links.tiktok) links.tiktok = url;
  }
  return links;
}

function extractPhone(html: string): string | null {
  // Look for tel: links first
  const telMatch = html.match(/href=["']tel:([^"']+)["']/i);
  if (telMatch) return telMatch[1].trim();
  // Common phone patterns
  const phoneMatch = html.match(/(\+?\d[\d\s\-().]{7,}\d)/);
  if (phoneMatch) return phoneMatch[1].trim();
  return null;
}

function extractAddress(html: string): string | null {
  // Look for address tag
  const addrMatch = html.match(/<address[^>]*>([\s\S]*?)<\/address>/i);
  if (addrMatch) {
    return addrMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 200);
  }
  return null;
}

function slugify(name: string, city: string): string {
  const raw = `${name} ${city}`.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60);
  return raw;
}

function parseGoogleMapsUrl(url: string): { name?: string; address?: string } {
  const result: { name?: string; address?: string } = {};
  // Google Maps URLs often have /place/Name+Of+Place/
  const placeMatch = url.match(/\/place\/([^/@]+)/);
  if (placeMatch) {
    result.name = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
  }
  return result;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    if (!url || typeof url !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    console.log('Scraping provider URL:', formattedUrl);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    let html: string;
    try {
      const response = await fetch(formattedUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; DeniedCareBot/1.0)',
          'Accept': 'text/html,application/xhtml+xml',
        },
      });
      html = await response.text();
    } catch (fetchErr) {
      clearTimeout(timeout);
      const msg = fetchErr instanceof Error ? fetchErr.message : 'Failed to fetch URL';
      return new Response(
        JSON.stringify({ success: false, error: `Could not fetch URL: ${msg}` }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    clearTimeout(timeout);

    // Check if it's a Google Maps URL for special handling
    const isGoogleMaps = formattedUrl.includes('google.com/maps') || formattedUrl.includes('goo.gl/maps');
    const googleMapsData = isGoogleMaps ? parseGoogleMapsUrl(formattedUrl) : {};

    // 1. Try JSON-LD first (richest source)
    const jsonLdItems = extractJsonLd(html);
    const business = jsonLdItems.find(item =>
      item['@type'] === 'LocalBusiness' ||
      item['@type'] === 'MedicalBusiness' ||
      item['@type'] === 'Dentist' ||
      item['@type'] === 'HealthAndBeautyBusiness' ||
      item['@type'] === 'MedicalClinic' ||
      item['@type'] === 'Organization' ||
      item['@type'] === 'DaySpa' ||
      (Array.isArray(item['@type']) && item['@type'].some((t: string) =>
        ['LocalBusiness', 'MedicalBusiness', 'Dentist', 'MedicalClinic', 'Organization'].includes(t)
      ))
    );

    // 2. Extract from all sources, with fallback chain
    const name =
      business?.name ||
      googleMapsData.name ||
      extractMeta(html, 'og:site_name') ||
      extractMeta(html, 'og:title') ||
      html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() ||
      null;

    const description =
      business?.description ||
      extractMeta(html, 'og:description') ||
      extractMeta(html, 'description') ||
      null;

    const phone =
      business?.telephone ||
      extractPhone(html) ||
      null;

    let address =
      (business?.address
        ? (typeof business.address === 'string'
          ? business.address
          : [business.address.streetAddress, business.address.addressLocality, business.address.addressRegion, business.address.postalCode]
              .filter(Boolean).join(', '))
        : null) ||
      googleMapsData.address ||
      extractAddress(html) ||
      null;

    const city =
      (business?.address && typeof business.address === 'object' ? business.address.addressLocality : null) ||
      null;

    const country =
      (business?.address && typeof business.address === 'object' ? business.address.addressCountry : null) ||
      null;

    // Hours
    const hours =
      (business?.openingHours
        ? (Array.isArray(business.openingHours) ? business.openingHours.join(', ') : business.openingHours)
        : null) ||
      (business?.openingHoursSpecification
        ? JSON.stringify(business.openingHoursSpecification)
        : null) ||
      null;

    // Services/specialties from JSON-LD or meta keywords
    let specialties: string[] = [];
    if (business?.hasOfferCatalog?.itemListElement) {
      specialties = business.hasOfferCatalog.itemListElement
        .map((item: any) => item.name || item.itemOffered?.name)
        .filter(Boolean);
    }
    if (specialties.length === 0) {
      const keywords = extractMeta(html, 'keywords');
      if (keywords) {
        specialties = keywords.split(',').map(k => k.trim()).filter(Boolean).slice(0, 10);
      }
    }

    // Languages
    const langAttr = html.match(/<html[^>]+lang=["']([^"']+)["']/i)?.[1];
    const languages: string[] = [];
    if (langAttr) {
      const lang = langAttr.split('-')[0];
      if (lang === 'es') languages.push('Spanish');
      if (lang === 'en') languages.push('English');
      if (lang === 'pt') languages.push('Portuguese');
    }

    // Images
    const photos = extractImages(html, formattedUrl);

    // Social links
    const socialLinks = extractSocialLinks(html);
    // If the original URL is a social/maps page, add it
    if (isGoogleMaps) socialLinks.google_maps = formattedUrl;
    if (formattedUrl.includes('yelp.com')) socialLinks.yelp = formattedUrl;
    if (formattedUrl.includes('instagram.com')) socialLinks.instagram = formattedUrl;
    if (formattedUrl.includes('facebook.com')) socialLinks.facebook = formattedUrl;
    // The source URL is likely the website
    if (!isGoogleMaps && !formattedUrl.includes('yelp.com') && !formattedUrl.includes('instagram.com') && !formattedUrl.includes('facebook.com')) {
      socialLinks.website = formattedUrl;
    }

    // Rating from JSON-LD
    const rating = business?.aggregateRating?.ratingValue || null;
    const reviewCount = business?.aggregateRating?.ratingCount || null;

    const slug = name && city ? slugify(name, city) : name ? slugify(name, '') : null;

    const result = {
      name: name || null,
      slug,
      city: city || null,
      country: country || null,
      address: address || null,
      phone: phone || null,
      description: description ? description.slice(0, 1000) : null,
      specialties: specialties.length > 0 ? specialties : null,
      languages: languages.length > 0 ? languages : null,
      hours_of_operation: hours || null,
      photos,
      social_links: Object.keys(socialLinks).length > 0 ? socialLinks : null,
      rating,
      review_count: reviewCount,
    };

    console.log('Scrape result:', JSON.stringify(result, null, 2));

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Scrape error:', error);
    const msg = error instanceof Error ? error.message : 'Failed to scrape';
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
