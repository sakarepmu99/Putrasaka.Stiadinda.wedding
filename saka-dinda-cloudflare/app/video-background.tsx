"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  src: string;
  poster: string;
  enabled: boolean;
  paused: boolean;
  className?: string;
  minWidth?: number;
  position?: string;
  eager?: boolean;
};

/** Decorative video: stays silent, loads near the viewport, and has a photo fallback. */
export default function VideoBackground({ src, poster, enabled, paused, className = "", minWidth = 0, position = "50% 40%", eager = false }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [visible, setVisible] = useState(false);
  const [wideEnough, setWideEnough] = useState(minWidth === 0);
  const [hasSource, setHasSource] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const canPlay = enabled && visible && wideEnough && !paused && !failed;

  useEffect(() => {
    if (!minWidth) return;
    const query = window.matchMedia(`(min-width: ${minWidth}px)`);
    const update = () => setWideEnough(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, [minWidth]);

  useEffect(() => {
    const container = containerRef.current;
    if (!enabled || !wideEnough || !container) { setVisible(false); return; }
    if (!("IntersectionObserver" in window)) { setVisible(true); return; }
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { rootMargin: "80px", threshold: 0.01 });
    observer.observe(container);
    return () => observer.disconnect();
  }, [enabled, wideEnough]);

  useEffect(() => { if (canPlay) setHasSource(true); }, [canPlay]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !hasSource) return;
    const update = () => {
      if (canPlay && !document.hidden) {
        video.muted = true;
        void video.play().catch(() => {});
      } else video.pause();
    };
    update();
    document.addEventListener("visibilitychange", update);
    return () => { document.removeEventListener("visibilitychange", update); video.pause(); };
  }, [canPlay, hasSource]);

  return <div ref={containerRef} className={`motion-backdrop ${className}`} aria-hidden="true">
    <img className="motion-poster" src={poster} alt="" width={720} height={1280} loading={eager ? "eager" : "lazy"} decoding="async" style={{ objectPosition: position }} />
    {hasSource && !failed && <video ref={videoRef} className={`motion-video${ready ? " ready" : ""}`} src={src} poster={poster} muted loop playsInline preload="none" tabIndex={-1} style={{ objectPosition: position }} onPlaying={() => setReady(true)} onError={() => { setFailed(true); setReady(false); }} />}
  </div>;
}
