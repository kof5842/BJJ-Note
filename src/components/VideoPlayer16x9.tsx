import React, { useEffect, useRef, useState } from 'react';
import { Play } from 'lucide-react';
import {
  formatSecondsToMMSS,
  isInstagramUrl,
  extractInstagramReelId,
  extractYoutubeId,
} from '../utils/bjjAnalyzer';

interface VideoPlayer16x9Props {
  youtubeId?: string;
  videoUrl?: string;
  title?: string;
  externalSeekTime?: { time: number; nonce: number } | null;
  initialSeekTime?: number;
  onTimeChange?: (seconds: number) => void;
  showPrecisionControls?: boolean;
  onCaptureTimecode?: (seconds: number) => void;
  captureButtonLabel?: string;
  autoPlay?: boolean;
}

export const VideoPlayer16x9: React.FC<VideoPlayer16x9Props> = ({
  youtubeId = '',
  videoUrl = '',
  title,
  externalSeekTime,
  initialSeekTime,
  onTimeChange,
  showPrecisionControls = true,
  onCaptureTimecode,
  captureButtonLabel = '현재 시점 캡처',
  autoPlay = true,
}) => {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [customJumpSec, setCustomJumpSec] = useState<string>('');
  const currentTimeRef = useRef<number>(0);
  const onTimeChangeRef = useRef(onTimeChange);

  // Check if target is Instagram Reel
  const effectiveUrl = videoUrl || (youtubeId.includes('http') ? youtubeId : '');
  const isInstagram =
    isInstagramUrl(effectiveUrl) ||
    isInstagramUrl(youtubeId) ||
    youtubeId.startsWith('ig-') ||
    !!extractInstagramReelId(effectiveUrl || youtubeId);

  const igShortcode =
    extractInstagramReelId(effectiveUrl) ||
    extractInstagramReelId(youtubeId) ||
    (youtubeId.startsWith('ig-') ? youtubeId.replace(/^ig-/, '') : '');

  const cleanYtId = isInstagram
    ? ''
    : (youtubeId || extractYoutubeId(effectiveUrl) || extractYoutubeId(videoUrl) || '').replace(/^ig-/, '');

  useEffect(() => {
    onTimeChangeRef.current = onTimeChange;
  }, [onTimeChange]);

  const updateTime = (t: number) => {
    const safeT = Math.max(0, Math.round(t * 10) / 10);
    currentTimeRef.current = safeT;
    setCurrentTime(safeT);
    onTimeChangeRef.current?.(safeT);
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.origin.includes('youtube.com')) return;
      try {
        const data =
          typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (
          data?.event === 'infoDelivery' &&
          typeof data?.info?.currentTime === 'number'
        ) {
          const t = Math.round(data.info.currentTime * 10) / 10;
          updateTime(t);
        }
        if (
          data?.event === 'infoDelivery' &&
          typeof data?.info?.playerState === 'number'
        ) {
          setIsPlaying(data.info.playerState === 1);
        }
      } catch {
        // ignore non-JSON
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Timer interval for playback state (crucial for Instagram & precise time tracking)
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      const next = Math.round((currentTimeRef.current + 0.1) * 10) / 10;
      updateTime(next);
    }, 100);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const sendPlayerCommand = (func: string, args: unknown[] = []) => {
    if (!iframeRef.current?.contentWindow) return;
    iframeRef.current.contentWindow.postMessage(
      JSON.stringify({
        event: 'command',
        func,
        args,
      }),
      '*'
    );
  };

  const seekToSeconds = (targetSeconds: number) => {
    const clamped = Math.max(0, Math.round(targetSeconds * 10) / 10);
    updateTime(clamped);
    if (!isInstagram) {
      sendPlayerCommand('seekTo', [clamped, true]);
    }
  };

  useEffect(() => {
    if (externalSeekTime && typeof externalSeekTime.time === 'number') {
      seekToSeconds(externalSeekTime.time);
      if (!isInstagram) {
        sendPlayerCommand('playVideo');
      }
      setIsPlaying(true);
    }
  }, [externalSeekTime, isInstagram]);

  // Direct in-page play/pause toggle (No popups, immediately plays inside the app)
  const togglePlay = () => {
    if (isPlaying) {
      if (!isInstagram) sendPlayerCommand('pauseVideo');
      setIsPlaying(false);
    } else {
      if (!isInstagram) sendPlayerCommand('playVideo');
      setIsPlaying(true);
    }
  };

  const handleIframeLoad = () => {
    if (!isInstagram && iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: 'listening', id: 1 }),
        '*'
      );
    }
  };

  useEffect(() => {
    if (typeof initialSeekTime === 'number' && initialSeekTime > 0) {
      updateTime(initialSeekTime);
    }
  }, [initialSeekTime]);

  const initialStart = typeof initialSeekTime === 'number' && initialSeekTime > 0
    ? Math.floor(initialSeekTime)
    : (externalSeekTime && typeof externalSeekTime.time === 'number' && externalSeekTime.time > 0
       ? Math.floor(externalSeekTime.time)
       : 0);

  const embedUrl = cleanYtId
    ? `https://www.youtube.com/embed/${cleanYtId}?enablejsapi=1&rel=0&modestbranding=1&playsinline=1${initialStart > 0 ? `&start=${initialStart}` : ''}${autoPlay ? '&autoplay=1' : ''}`
    : '';

  // Clean Instagram Reel embed URL
  const instagramEmbedUrl = igShortcode
    ? `https://www.instagram.com/reel/${igShortcode}/embed/`
    : '';

  const handleCustomJump = () => {
    const val = parseFloat(customJumpSec);
    if (!isNaN(val) && val >= 0) {
      seekToSeconds(val);
      setCustomJumpSec('');
    }
  };

  return (
    <div className="w-full select-none flex flex-col items-center">
      {/* Video Container: 9:16 vertical ratio for Instagram Reels, 16:9 widescreen for YouTube */}
      <div
        className={`relative w-full ${
          isInstagram
            ? 'max-w-[360px] sm:max-w-[390px] h-[540px] sm:h-[600px] aspect-[9/16]'
            : 'aspect-video max-w-full'
        } bg-slate-950 rounded-none sm:rounded-2xl overflow-hidden border-y sm:border border-slate-800 shadow-xl flex flex-col items-center justify-center mx-auto`}
      >
        {isInstagram && igShortcode ? (
          <div className="w-full h-full relative overflow-hidden bg-black flex items-center justify-center">
            {/* Cropped iframe container that hides Instagram's outer header and bottom comments/likes footer */}
            <div className="w-full h-full relative overflow-hidden flex items-center justify-center bg-black">
              <iframe
                src={instagramEmbedUrl}
                title={title || 'Instagram Reel Player'}
                className="w-full h-[calc(100%+145px)] -mt-[54px] border-0 bg-black"
                allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                allowFullScreen
                scrolling="no"
              />
            </div>
          </div>
        ) : cleanYtId ? (
          <iframe
            ref={iframeRef}
            onLoad={handleIframeLoad}
            src={embedUrl}
            title={title || 'BJJ Technique Video Player'}
            className="absolute inset-0 w-full h-full object-cover"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-6 text-center">
            <Play className="w-10 h-10 mb-2 text-slate-500" />
            <p className="text-sm font-medium text-slate-300">
              유효한 영상 URL 또는 영상 ID가 없습니다
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
