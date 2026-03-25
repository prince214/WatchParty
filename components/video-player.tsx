"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { formatTime } from "@/lib/utils";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
} from "lucide-react";

interface VideoPlayerProps {
  src: string;
  isHost: boolean;
  playing: boolean;
  timestamp: number;
  onPlayPause: (playing: boolean) => void;
  onSeek: (timestamp: number) => void;
  onTimeUpdate: (timestamp: number) => void;
}

export function VideoPlayer({
  src,
  isHost,
  playing,
  timestamp,
  onPlayPause,
  onSeek,
  onTimeUpdate,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const syncLockRef = useRef(false);

  // Sync playback state from host broadcasts (guest mode)
  useEffect(() => {
    const video = videoRef.current;
    if (!video || isHost) return;

    syncLockRef.current = true;

    if (playing && video.paused) {
      video.play().catch(() => {});
    } else if (!playing && !video.paused) {
      video.pause();
    }

    const drift = Math.abs(video.currentTime - timestamp);
    if (drift > 2) {
      video.currentTime = timestamp;
    }

    setTimeout(() => {
      syncLockRef.current = false;
    }, 500);
  }, [playing, timestamp, isHost]);

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    setCurrentTime(video.currentTime);

    if (isHost) {
      onTimeUpdate(video.currentTime);
    }
  }, [isHost, onTimeUpdate]);

  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    setDuration(video.duration);
  }, []);

  function togglePlay() {
    const video = videoRef.current;
    if (!video || !isHost) return;

    if (video.paused) {
      video.play();
      onPlayPause(true);
    } else {
      video.pause();
      onPlayPause(false);
    }
  }

  function handleSeek(e: React.ChangeEvent<HTMLInputElement>) {
    if (!isHost) return;
    const video = videoRef.current;
    if (!video) return;
    const time = parseFloat(e.target.value);
    video.currentTime = time;
    setCurrentTime(time);
    onSeek(time);
  }

  function toggleMute() {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
  }

  function handleVolumeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const video = videoRef.current;
    if (!video) return;
    const vol = parseFloat(e.target.value);
    video.volume = vol;
    setVolume(vol);
    setMuted(vol === 0);
  }

  function toggleFullscreen() {
    const container = containerRef.current;
    if (!container) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
      setIsFullscreen(false);
    } else {
      container.requestFullscreen();
      setIsFullscreen(true);
    }
  }

  useEffect(() => {
    function onFsChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  function handleMouseMove() {
    setShowControls(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setShowControls(false), 3000);
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col bg-black overflow-hidden group"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-contain cursor-pointer"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onClick={isHost ? togglePlay : undefined}
        playsInline
      />

      {/* Click-to-play overlay for guests */}
      {!isHost && !playing && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <div className="rounded-full bg-white/10 p-5 backdrop-blur-sm">
            <Pause className="h-10 w-10 text-white" />
          </div>
        </div>
      )}

      {/* Controls bar */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-4 pb-3 pt-10 transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Seek bar */}
        <div className="relative mb-2">
          <div className="h-1 w-full rounded-full bg-white/20">
            <div
              className="h-1 rounded-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          {isHost && (
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              className="absolute inset-0 h-1 w-full cursor-pointer opacity-0"
            />
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Play/Pause */}
          {isHost && (
            <button onClick={togglePlay} className="text-white hover:text-primary transition-colors cursor-pointer">
              {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </button>
          )}

          {/* Time */}
          <span className="text-xs text-white/80 tabular-nums">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          <div className="flex-1" />

          {/* Volume */}
          <div className="flex items-center gap-1.5">
            <button onClick={toggleMute} className="text-white hover:text-primary transition-colors cursor-pointer">
              {muted || volume === 0 ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={muted ? 0 : volume}
              onChange={handleVolumeChange}
              className="h-1 w-16 cursor-pointer accent-primary"
            />
          </div>

          {/* Fullscreen */}
          <button onClick={toggleFullscreen} className="text-white hover:text-primary transition-colors cursor-pointer">
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
