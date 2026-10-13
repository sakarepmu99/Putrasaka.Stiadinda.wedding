"use client";
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
export type MusicHandle = { play(): void; pause(): void };
export default forwardRef<MusicHandle, { onPlaying(playing: boolean): void; onError(): void }>(function WeddingMusic({ onPlaying, onError }, ref) {
  const audio = useRef<HTMLAudioElement>(null);
  useImperativeHandle(ref, () => ({
    play() {
      const element = audio.current;
      if (!element) return;
      element.volume = 0.45;
      void element.play().catch(onError);
    },
    pause() { audio.current?.pause(); },
  }), [onError]);
  useEffect(() => {
    const element = audio.current;
    const pauseWhenHidden = () => { if (document.hidden) element?.pause(); };
    document.addEventListener("visibilitychange", pauseWhenHidden);
    return () => { document.removeEventListener("visibilitychange", pauseWhenHidden); element?.pause(); };
  }, []);
  return <audio ref={audio} src="/assets/beautiful-in-white-saxophone.mp3" loop preload="none" onPlay={() => onPlaying(true)} onPause={() => onPlaying(false)} onError={onError} />;
});
