"use client";

import React, { useEffect, useRef, useState } from "react";

/**
 * Composant de révélation progressive au défilement (Scroll Fade In)
 * Animation ultra-fluide au standard Apple / Swiss Editorial.
 */
export function ScrollReveal({
  children,
  className = "",
  style = {},
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof window === "undefined" || typeof IntersectionObserver === "undefined") {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      {
        threshold: 0.08,
        rootMargin: "0px 0px -40px 0px",
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`scroll-fade-section ${isVisible ? "is-visible" : ""} ${className}`}
      style={{
        transitionDelay: delay ? `${delay}ms` : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export default ScrollReveal;
