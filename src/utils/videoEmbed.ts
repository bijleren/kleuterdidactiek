export type VideoEmbed = {
  type: 'youtube' | 'vimeo' | 'unknown';
  id: string | null;
  embedUrl: string | null;
  thumbnailUrl: string | null;
};

const YOUTUBE_PATTERNS = [
  /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
  /youtube\.com\/embed\/([^&\n?#]+)/,
];

const VIMEO_PATTERNS = [
  /player\.vimeo\.com\/video\/(\d+)/,
  /vimeo\.com\/(\d+)/,
  /vimeo\.com\/[^/]+\/(\d+)/,
];

export function getVideoEmbed(url: string): VideoEmbed {
  if (!url) return { type: 'unknown', id: null, embedUrl: null, thumbnailUrl: null };

  for (const pattern of YOUTUBE_PATTERNS) {
    const match = url.match(pattern);
    if (match) {
      const id = match[1];
      return {
        type: 'youtube',
        id,
        embedUrl: `https://www.youtube.com/embed/${id}`,
        thumbnailUrl: `https://img.youtube.com/vi/${id}/mqdefault.jpg`,
      };
    }
  }

  for (const pattern of VIMEO_PATTERNS) {
    const match = url.match(pattern);
    if (match) {
      const id = match[1];
      return {
        type: 'vimeo',
        id,
        embedUrl: `https://player.vimeo.com/video/${id}`,
        thumbnailUrl: null,
      };
    }
  }

  return { type: 'unknown', id: null, embedUrl: null, thumbnailUrl: null };
}

export function isEmbeddable(url: string): boolean {
  return getVideoEmbed(url).type !== 'unknown';
}
