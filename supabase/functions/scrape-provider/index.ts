const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// --- Known procedure/service keywords for specialty detection ---
const SERVICE_KEYWORDS = [
  'botox', 'filler', 'dermal filler', 'microneedling', 'chemical peel',
  'laser', 'facial', 'body contouring', 'coolsculpting', 'prp', 'iv therapy',
  'dental implant', 'crown', 'veneer', 'whitening', 'root canal', 'extraction',
  'rhinoplasty', 'liposuction', 'tummy tuck', 'breast augmentation', 'facelift',
  'blepharoplasty', 'bbl', 'brazilian butt lift', 'mommy makeover', 'otoplasty',
  'hydrafacial', 'thread lift', 'lip augmentation', 'skin tightening',
  'bariatric', 'gastric sleeve', 'gastric bypass', 'lasik',
  'knee replacement', 'hip replacement', 'stem cell',
  'teeth whitening', 'deep cleaning', 'dental bridge', 'dental bonding',
  'denture', 'gum graft', 'wisdom tooth', 'all-on-4', 'all-on-6',
  'zirconia', 'porcelain', 'composite', 'dental filling',
  'hair removal', 'hair transplant', 'hair restoration',
  'sclerotherapy', 'varicose', 'tattoo removal',
  'abdominoplasty', 'brachioplasty', 'arm lift', 'thigh lift',
  'neck lift', 'chin augmentation', 'jaw contouring',
  'microblading', 'permanent makeup', 'plasma', 'radiofrequency',
  'ultrasound', 'hifu', 'mesotherapy', 'carboxytherapy',
];

function extractMeta(html: string, property: string): string | null {
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

function resolveUrl(src: string, baseUrl: string): string {
  try {
    if (src.startsWith('http://') || src.startsWith('https://')) return src;
    if (src.startsWith('//')) return `https:${src}`;
    const base = new URL(baseUrl);
    if (src.startsWith('/')) return `${base.origin}${src}`;
    return `${base.origin}/${src}`;
  } catch {
    return src;
  }
}

function extractImages(html: string, baseUrl: string): string[] {
  const images: string[] = [];
  const seen = new Set<string>();

  const addImage = (src: string, priority: boolean = false) => {
    const resolved = resolveUrl(src, baseUrl);
    if (seen.has(resolved)) return;
    // Filter out junk
    const lower = resolved.toLowerCase();
    if (lower.endsWith('.svg')) return;
    if (/logo|icon|favicon|pixel|tracking|1x1|spacer|blank|spinner/i.test(lower)) return;
    if (/facebook\.com\/tr|google-analytics|googletagmanager|doubleclick|analytics/i.test(lower)) return;
    // Check for dimension hints suggesting tiny images
    const widthMatch = lower.match(/[?&]w=(\d+)/);
    if (widthMatch && parseInt(widthMatch[1]) < 200) return;
    seen.add(resolved);
    if (priority) images.unshift(resolved);
    else images.push(resolved);
  };

  // 1. og:image (highest priority)
  const ogImage = extractMeta(html, 'og:image');
  if (ogImage) addImage(ogImage, true);

  // 2. twitter:image
  const twImage = extractMeta(html, 'twitter:image');
  if (twImage) addImage(twImage, true);

  // 3. img tags - prioritize hero/banner/gallery images
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*/gi;
  const heroImages: string[] = [];
  const regularImages: string[] = [];
  let im;
  while ((im = imgRegex.exec(html)) !== null) {
    const src = im[1];
    const context = im[0].toLowerCase();
    if (/hero|banner|clinic|office|team|facility|gallery|slider|featured|cover|main/i.test(context)) {
      heroImages.push(src);
    } else {
      regularImages.push(src);
    }
  }
  heroImages.forEach(s => addImage(s, true));
  regularImages.forEach(s => addImage(s));

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
    if (url.includes('youtube.com') && !links.youtube) links.youtube = url;
  }
  return links;
}

function extractPhone(html: string): string | null {
  try {
    const telMatch = html.match(/href=["']tel:([^"']+)["']/i);
    if (telMatch) return telMatch[1].trim();
    const phoneMatch = html.match(/(\+?\d[\d\s\-().]{7,}\d)/);
    if (phoneMatch) return phoneMatch[1].trim();
  } catch { /* ignore */ }
  return null;
}

function extractAddress(html: string): string | null {
  try {
    // <address> tag
    const addrMatch = html.match(/<address[^>]*>([\s\S]*?)<\/address>/i);
    if (addrMatch) {
      const text = addrMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      if (text.length > 5) return text.slice(0, 200);
    }
    // Google Maps embed
    const mapsEmbed = html.match(/google\.com\/maps\/embed[^"']*[?&]q=([^&"']+)/i);
    if (mapsEmbed) return decodeURIComponent(mapsEmbed[1].replace(/\+/g, ' '));
    // Text near address keywords (EN + ES)
    const addrKeywords = /(?:address|located|location|ubicaci[oó]n|direcci[oó]n)\s*[:\-]?\s*([^<\n]{10,100})/i;
    const kwMatch = html.replace(/<[^>]+>/g, ' ').match(addrKeywords);
    if (kwMatch) return kwMatch[1].trim().slice(0, 200);
  } catch { /* ignore */ }
  return null;
}

function extractHours(html: string, business: any): string | null {
  try {
    // JSON-LD first
    if (business?.openingHours) {
      return Array.isArray(business.openingHours) ? business.openingHours.join(', ') : business.openingHours;
    }
    if (business?.openingHoursSpecification) {
      const specs = Array.isArray(business.openingHoursSpecification)
        ? business.openingHoursSpecification
        : [business.openingHoursSpecification];
      return specs.map((s: any) => {
        const days = Array.isArray(s.dayOfWeek) ? s.dayOfWeek.join(', ') : (s.dayOfWeek || '');
        return `${days}: ${s.opens || ''}-${s.closes || ''}`;
      }).join('; ');
    }
    // HTML body scan (EN + ES) - look for day-of-week patterns near hours keywords
    const bodyText = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    const dayPattern = /(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo|mon|tue|wed|thu|fri|sat|sun)/i;
    const hoursBlock = bodyText.match(new RegExp(`(?:hours|schedule|horario)[:\\s-]*([^.]{0,50}${dayPattern.source}[^.]{10,200})`, 'i'));
    if (hoursBlock) return hoursBlock[1].trim().slice(0, 300);
    // Fallback: any line with day names and time patterns
    const timePattern = bodyText.match(new RegExp(`((?:${dayPattern.source})[^.]{5,150}\\d{1,2}[:\\s]?(?:\\d{2})?\\s*(?:am|pm|hrs)?[^.]{0,100})`, 'i'));
    if (timePattern) return timePattern[1].trim().slice(0, 300);
  } catch { /* ignore */ }
  return null;
}

function extractSpecialties(html: string, business: any): string[] {
  const found = new Set<string>();

  try {
    // JSON-LD services
    if (business?.hasOfferCatalog?.itemListElement) {
      for (const item of business.hasOfferCatalog.itemListElement) {
        const name = item.name || item.itemOffered?.name;
        if (name) found.add(name);
      }
    }
    if (business?.makesOffer) {
      const offers = Array.isArray(business.makesOffer) ? business.makesOffer : [business.makesOffer];
      for (const o of offers) {
        const name = o.itemOffered?.name || o.name;
        if (name) found.add(name);
      }
    }
  } catch { /* ignore */ }

  try {
    // Meta keywords
    const keywords = extractMeta(html, 'keywords');
    if (keywords) {
      keywords.split(',').map(k => k.trim()).filter(k => k.length > 2 && k.length < 60).forEach(k => found.add(k));
    }
  } catch { /* ignore */ }

  try {
    // Scan headings and list items for known service keywords
    const textBlocks: string[] = [];
    // H2, H3 content
    const headingRegex = /<h[23][^>]*>([\s\S]*?)<\/h[23]>/gi;
    let hm;
    while ((hm = headingRegex.exec(html)) !== null) {
      textBlocks.push(hm[1].replace(/<[^>]+>/g, '').trim());
    }
    // LI content
    const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
    let li;
    while ((li = liRegex.exec(html)) !== null) {
      textBlocks.push(li[1].replace(/<[^>]+>/g, '').trim());
    }
    // Elements with service/treatment/procedure related classes
    const serviceElRegex = /<[^>]+(?:class|id)=["'][^"']*(?:service|treatment|procedure|menu|pricing)[^"']*["'][^>]*>([\s\S]*?)<\/[^>]+>/gi;
    let se;
    while ((se = serviceElRegex.exec(html)) !== null) {
      textBlocks.push(se[1].replace(/<[^>]+>/g, ' ').trim());
    }

    const allText = textBlocks.join(' ').toLowerCase();
    for (const keyword of SERVICE_KEYWORDS) {
      if (allText.includes(keyword)) {
        // Capitalize nicely
        found.add(keyword.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));
      }
    }
  } catch { /* ignore */ }

  return [...found].slice(0, 30);
}

function slugify(name: string, city: string): string {
  return `${name} ${city}`.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60);
}

function parseGoogleMapsUrl(url: string): { name?: string; address?: string } {
  const result: { name?: string; address?: string } = {};
  try {
    const placeMatch = url.match(/\/place\/([^/@]+)/);
    if (placeMatch) {
      result.name = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
    }
  } catch { /* ignore */ }
  return result;
}

async function fetchWithFallback(url: string): Promise<string> {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9,es;q=0.8',
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const resp = await fetch(url, { signal: controller.signal, headers });
    clearTimeout(timeout);
    return await resp.text();
  } catch (err) {
    clearTimeout(timeout);
    // Try www toggle fallback
    const urlObj = new URL(url);
    const alt = urlObj.hostname.startsWith('www.')
      ? url.replace('www.', '')
      : url.replace(`://${urlObj.hostname}`, `://www.${urlObj.hostname}`);

    const controller2 = new AbortController();
    const timeout2 = setTimeout(() => controller2.abort(), 10000);
    try {
      const resp2 = await fetch(alt, { signal: controller2.signal, headers });
      clearTimeout(timeout2);
      return await resp2.text();
    } catch {
      clearTimeout(timeout2);
      throw err; // throw original error
    }
  }
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

    let html: string;
    try {
      html = await fetchWithFallback(formattedUrl);
    } catch (fetchErr) {
      const msg = fetchErr instanceof Error ? fetchErr.message : 'Failed to fetch URL';
      return new Response(
        JSON.stringify({ success: false, error: `Could not fetch URL: ${msg}` }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const isGoogleMaps = formattedUrl.includes('google.com/maps') || formattedUrl.includes('goo.gl/maps');
    const googleMapsData = isGoogleMaps ? parseGoogleMapsUrl(formattedUrl) : {};

    // 1. JSON-LD (richest source)
    const jsonLdItems = extractJsonLd(html);
    const businessTypes = [
      'LocalBusiness', 'MedicalBusiness', 'Dentist', 'HealthAndBeautyBusiness',
      'MedicalClinic', 'Organization', 'DaySpa', 'BeautySalon', 'MedicalOrganization',
      'Physician', 'Hospital', 'Pharmacy',
    ];
    const business = jsonLdItems.find(item => {
      const types = Array.isArray(item['@type']) ? item['@type'] : [item['@type']];
      return types.some((t: string) => businessTypes.includes(t));
    });

    // 2. Extract from all sources with fallback chains
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

    const phone = business?.telephone || extractPhone(html) || null;

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

    const hours = extractHours(html, business);
    const specialties = extractSpecialties(html, business);

    // Languages
    const languages: string[] = [];
    try {
      const langAttr = html.match(/<html[^>]+lang=["']([^"']+)["']/i)?.[1];
      if (langAttr) {
        const lang = langAttr.split('-')[0].toLowerCase();
        const langMap: Record<string, string> = { en: 'English', es: 'Spanish', pt: 'Portuguese', fr: 'French', de: 'German', zh: 'Chinese', ko: 'Korean', ja: 'Japanese' };
        if (langMap[lang]) languages.push(langMap[lang]);
      }
      // Check for language switcher links
      if (html.includes('/es/') || html.includes('/es"') || html.includes('lang=es')) {
        if (!languages.includes('Spanish')) languages.push('Spanish');
      }
      if (html.includes('/en/') || html.includes('/en"') || html.includes('lang=en')) {
        if (!languages.includes('English')) languages.push('English');
      }
    } catch { /* ignore */ }

    const photos = extractImages(html, formattedUrl);
    const socialLinks = extractSocialLinks(html);

    // Assign source URL to appropriate social link
    if (isGoogleMaps) socialLinks.google_maps = formattedUrl;
    else if (formattedUrl.includes('yelp.com')) socialLinks.yelp = formattedUrl;
    else if (formattedUrl.includes('instagram.com')) socialLinks.instagram = formattedUrl;
    else if (formattedUrl.includes('facebook.com')) socialLinks.facebook = formattedUrl;
    else socialLinks.website = formattedUrl;

    const rating = business?.aggregateRating?.ratingValue || null;
    const reviewCount = business?.aggregateRating?.ratingCount || business?.aggregateRating?.reviewCount || null;
    const slug = name && city ? slugify(name, city) : name ? slugify(name, '') : null;

    // Geo coordinates from JSON-LD
    let geo = null;
    try {
      if (business?.geo) {
        geo = { lat: business.geo.latitude, lng: business.geo.longitude };
      }
    } catch { /* ignore */ }

    // Email
    let email = null;
    try {
      email = business?.email || null;
      if (!email) {
        const emailMatch = html.match(/mailto:([^"'?\s]+)/i);
        if (emailMatch) email = emailMatch[1];
      }
    } catch { /* ignore */ }

    const result = {
      name: name || null,
      slug,
      city: city || null,
      country: country || null,
      address: address || null,
      phone: phone || null,
      email: email || null,
      description: description ? description.slice(0, 1000) : null,
      specialties: specialties.length > 0 ? specialties : null,
      languages: languages.length > 0 ? languages : null,
      hours_of_operation: hours || null,
      photos,
      social_links: Object.keys(socialLinks).length > 0 ? socialLinks : null,
      rating,
      review_count: reviewCount,
      geo,
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
