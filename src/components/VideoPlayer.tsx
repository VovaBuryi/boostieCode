'use client';

import { useRef, useEffect, useState } from 'react';

interface VideoPlayerProps {
  url: string;
  poster?: string | null;
}

export default function VideoPlayer({ url, poster }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
  }, [url]);

  const handleLoadStart = () => setIsLoading(true);
  const handleCanPlay = () => setIsLoading(false);
  const handleError = () => {
    setIsLoading(false);
    setError('Не вдалося завантажити відео');
  };

  const isYouTube = (url: string) => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/,
      /youtube\.com\/shorts\/([^&\s]+)/,
    ];
    return patterns.some(pattern => pattern.test(url));
  };

  const isVimeo = (url: string) => {
    return /vimeo\.com\/(\d+)/.test(url);
  };

  const getYouTubeEmbedUrl = (url: string): string | null => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/) || 
                  url.match(/youtube\.com\/shorts\/([^&\s]+)/);
    if (match && match[1]) {
      return `https://www.youtube.com/embed/${match[1]}?rel=0&modestbranding=1`;
    }
    return null;
  };

  const getVimeoEmbedUrl = (url: string): string | null => {
    const match = url.match(/vimeo\.com\/(\d+)/);
    if (match && match[1]) {
      return `https://player.vimeo.com/video/${match[1]}`;
    }
    return null;
  };

  if (isYouTube(url)) {
    const embedUrl = getYouTubeEmbedUrl(url);
    if (!embedUrl) return null;
    return (
      <div className='aspect-video rounded-lg overflow-hidden bg-gray-900'>
        <iframe
          src={embedUrl}
          className='w-full h-full'
          allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
          allowFullScreen
          title='Відео'
        />
      </div>
    );
  }

  if (isVimeo(url)) {
    const embedUrl = getVimeoEmbedUrl(url);
    if (!embedUrl) return null;
    return (
      <div className='aspect-video rounded-lg overflow-hidden bg-gray-900'>
        <iframe
          src={embedUrl}
          className='w-full h-full'
          allow='autoplay; fullscreen; picture-in-picture'
          allowFullScreen
          title='Відео'
        />
      </div>
    );
  }

  return (
    <div className='aspect-video rounded-lg overflow-hidden bg-gray-900'>
      {isLoading && (
        <div className='absolute inset-0 flex items-center justify-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-white'></div>
        </div>
      )}
      {error ? (
        <div className='w-full h-full flex items-center justify-center'>
          <p className='text-white'>{error}</p>
        </div>
      ) : (
        <video
          ref={videoRef}
          src={url}
          className='w-full h-full object-contain'
          controls
          preload='metadata'
          poster={poster || undefined}
          onLoadStart={handleLoadStart}
          onCanPlay={handleCanPlay}
          onError={handleError}
        />
      )}
    </div>
  );
}
