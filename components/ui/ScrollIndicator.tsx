"use client";

import { useEffect, useState } from "react";

export default function ScrollIndicator() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setHidden(window.scrollY > 80);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollDown = () => {
    window.scrollTo({
      top: window.innerHeight,
      behavior: "smooth",
    });
  };

  return (
    <button
      onClick={scrollDown}
      className={`scroll-indicator ${hidden ? "scroll-hidden" : ""}`}
      aria-label="Scroll to next section"
    >
      <span className="scroll-label">SCROLL</span>

      <span className="scroll-line">
        <span className="scroll-dot" />
      </span>
    </button>
  );
}
