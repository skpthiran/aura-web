// Maps tags/moods to Unsplash topic keywords for consistent, beautiful images
const TAG_KEYWORDS: Record<string, string> = {
  // Moods
  music: 'music-live-concert',
  food: 'food-dining-restaurant',
  art: 'art-gallery-exhibition',
  sports: 'sports-fitness-training',
  tech: 'technology-computer-coding',
  social: 'people-party-gathering',
  outdoor: 'nature-park-landscape',
  nightlife: 'nightclub-bar-cocktail',
  casual: 'cafe-coffee-relaxed',
  culture: 'culture-museum-festival',
  wellness: 'yoga-meditation-wellness',
  fashion: 'fashion-style-creative',
  film: 'cinema-movie-film',

  // Generic fallbacks by type
  moment: 'city-urban-lifestyle',
  event: 'event-venue-conference',
}

const FALLBACK_KEYWORDS = [
  'city-abstract',
  'urban-texture',
  'minimalist-architecture',
  'vibrant-lights',
  'night-gradient',
]

/**
 * Returns a deterministic Unsplash Source URL based on signal metadata
 * @param id - The signal ID for deterministic selection
 * @param tags - Array of tags associated with the signal
 * @param type - The type of signal ('moment' or 'event')
 * @returns An Unsplash image URL
 */
export function getSignalImage(id: string, tags: string[] = [], type: string = 'moment'): string {
  // 1. Try to find a keyword from tags (including moods)
  let keyword = '';
  
  if (tags && tags.length > 0) {
    // Search tags for a matching keyword
    for (const tag of tags) {
      const normalized = tag.toLowerCase().trim();
      if (TAG_KEYWORDS[normalized]) {
        keyword = TAG_KEYWORDS[normalized];
        break;
      }
    }
  }

  // 2. If no tag match, use the signal type
  if (!keyword) {
    keyword = TAG_KEYWORDS[type] || TAG_KEYWORDS['moment'];
  }

  // 3. Add a fallback from our curated list if everything else is too generic
  // We use the ID to pick a consistent index
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const fallback = FALLBACK_KEYWORDS[hash % FALLBACK_KEYWORDS.length];
  
  // Construct the URL using Unsplash Source (deterministic based on keyword + ID)
  // Format: https://images.unsplash.com/photo-...?auto=format&fit=crop&q=80&w=...
  // However, Unsplash Source (source.unsplash.com) is deprecated or unreliable sometimes.
  // We'll use the "search by keyword" pattern with a deterministic seed if possible, 
  // but for simplicity and quality, we'll use the "featured" query with keywords.
  
  // NOTE: source.unsplash.com/featured/?<keywords> is the easiest way to get high quality relevant images.
  // Adding the ID as a cache-buster but also a seed for consistency.
  return `https://source.unsplash.com/featured/1200x800/?${keyword},${fallback}&sig=${id}`;
}
