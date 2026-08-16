"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { ArrowDown, ArrowRight, ArrowUpRight, Scan, Wrench, Archive, Zap } from "lucide-react";
import Scene from "./Scene";
import { TextHoverEffect } from "./ui/text-hover-effect";

gsap.registerPlugin(ScrollTrigger);

const archive = [
  ["SD-001", "SELF-HEATING MUG", "2019", "FAILED"],
  ["SD-017", "AUTONOMOUS WINDOW FARM", "2017", "EXPIRED"],
  ["SD-043", "MODULAR SOLAR BIKE", "2021", "ABANDONED"],
  ["SD-108", "POCKET WEATHER LAB", "2020", "UNFINISHED"],
];

const processSteps: { n: string; t: string; Icon: typeof Scan; body: string }[] = [
  { n: "01", t: "FIND", Icon: Scan, body: "We hunt through abandoned products, expired patents and half-built prototypes." },
  { n: "02", t: "ACQUIRE", Icon: Archive, body: "We secure the useful IP, documentation and lessons left behind." },
  { n: "03", t: "REBUILD", Icon: Wrench, body: "We prototype aggressively, keeping what works and killing what does not." },
  { n: "04", t: "VALIDATE", Icon: Zap, body: "We prove there is a real product hiding inside the wreckage." },
];

const storyPhases = [
  { n: "01 / RECOVER", title: ["Someone built it.", "Then gave up."], body: "The prototype is real. The evidence is real. The failure is simply the last version of the story." },
  { n: "02 / DIAGNOSE", title: ["Find the part", "that broke."], body: "We separate a bad execution from a bad idea, then keep the useful evidence." },
  { n: "03 / REBUILD", title: ["Put it back", "together."], body: "Hardware, software, materials, patents and the original assumptions all get another pass." },
  { n: "04 / IGNITE", title: ["Make the thing", "work."], body: "The red light comes on. The prototype leaves the graveyard." },
];

function Reveal({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`reveal ${className}`}>{children}</div>;
}

function Label({ n, word }: { n: string; word: string }) {
  return <div className="section-label"><span>{n}</span><strong>{word}</strong></div>;
}

const SUBMIT_EMAIL = "creativeseconddraft69@proton.me";

function SubmitForm() {
  const [form, setForm] = useState({ name: "", email: "", title: "", link: "", story: "" });
  const [status, setStatus] = useState<"idle" | "sent" | "error">("idle");

  const update = (field: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim() || !form.email.trim() || !form.title.trim() || !form.story.trim()) {
      setStatus("error");
      return;
    }

    const subject = `Invention submission: ${form.title}`;
    const body =
      `Name: ${form.name}\n` +
      `Email: ${form.email}\n` +
      `Invention: ${form.title}\n` +
      (form.link ? `Link: ${form.link}\n` : "") +
      `\nWhat happened:\n${form.story}`;

    const mailto = `mailto:${SUBMIT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
    setStatus("sent");
  };

  if (status === "sent") {
    return (
      <div className="submit-confirm">
        <span className="case-kicker">SUBMISSION READY</span>
        <p>Your email client should be open with everything filled in — just hit send. If nothing opened, email us directly at <a href={`mailto:${SUBMIT_EMAIL}`}>{SUBMIT_EMAIL}</a>.</p>
        <button className="dark-button" type="button" onClick={() => { setForm({ name: "", email: "", title: "", link: "", story: "" }); setStatus("idle"); }}>
          submit another <ArrowUpRight size={15} />
        </button>
      </div>
    );
  }

  return (
    <form className="submit-form" onSubmit={handleSubmit} noValidate>
      <div className="submit-row">
        <label>
          <span>your name</span>
          <input type="text" value={form.name} onChange={update("name")} placeholder="Jane Doe" />
        </label>
        <label>
          <span>your email</span>
          <input type="email" value={form.email} onChange={update("email")} placeholder="jane@example.com" />
        </label>
      </div>
      <label>
        <span>invention name</span>
        <input type="text" value={form.title} onChange={update("title")} placeholder="Self-heating mug" />
      </label>
      <label>
        <span>link (optional)</span>
        <input type="url" value={form.link} onChange={update("link")} placeholder="https://..." />
      </label>
      <label>
        <span>what happened</span>
        <textarea rows={4} value={form.story} onChange={update("story")} placeholder="What you built, what went wrong, and why it still deserves another version." />
      </label>
      {status === "error" && <p className="submit-error">Fill in your name, email, invention name and story before sending.</p>}
      <button className="dark-button" type="submit">
        submit your invention <ArrowUpRight size={15} />
      </button>
    </form>
  );
}

export default function Site() {
  const main = useRef<HTMLElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.15,
      smoothWheel: true,
      wheelMultiplier: 0.9,
      syncTouch: false,
    });

    const raf = (time: number) => {
      lenis.raf(time * 1000);
    };

    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    const scrollTo = (selector: string) => {
      const target = document.querySelector<HTMLElement>(selector);
      if (!target) return;
      lenis.scrollTo(target, {
        offset: -78,
        duration: 1.15,
        lock: false,
        force: true,
      });
    };

    const handleNavClick = (event: MouseEvent) => {
      const anchor = (event.target as HTMLElement).closest<HTMLAnchorElement>(
        'a[href^="#"]'
      );
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || href === "#") return;

      const target = document.querySelector(href);
      if (!target) return;

      event.preventDefault();
      scrollTo(href);
      window.history.replaceState(null, "", href);
    };

    document.addEventListener("click", handleNavClick);

    // ============ custom red scrollbar ============
    const rail = railRef.current;
    const thumb = thumbRef.current;
    let dragging = false;
    let railHeight = 0;
    let thumbHeight = 0;

    const sizeThumb = () => {
      if (!rail) return;
      railHeight = rail.clientHeight - 100; // matches ::before track inset
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      const ratio = window.innerHeight / doc.scrollHeight;
      thumbHeight = Math.max(railHeight * ratio, 32);
      if (thumb) thumb.style.height = `${thumbHeight}px`;
      return scrollable;
    };

    const updateThumb = () => {
      if (!thumb) return;
      const doc = document.documentElement;
      const scrollable = Math.max(doc.scrollHeight - window.innerHeight, 1);
      const progress = Math.min(Math.max(window.scrollY / scrollable, 0), 1);
      const travel = railHeight - thumbHeight;
      thumb.style.top = `${78 + progress * travel}px`;
    };

    sizeThumb();
    updateThumb();
    lenis.on("scroll", updateThumb);

    const onResize = () => {
      sizeThumb();
      updateThumb();
    };
    window.addEventListener("resize", onResize);

    const scrollFromClientY = (clientY: number) => {
      if (!rail) return;
      const travel = railHeight - thumbHeight;
      const relative = clientY - 78 - thumbHeight / 2;
      const progress = Math.min(Math.max(relative / travel, 0), 1);
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      lenis.scrollTo(progress * scrollable, { immediate: true });
    };

    const onThumbDown = (e: PointerEvent) => {
      dragging = true;
      thumb?.classList.add("dragging");
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      e.preventDefault();
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!dragging) return;
      scrollFromClientY(e.clientY);
    };
    const onPointerUp = () => {
      dragging = false;
      thumb?.classList.remove("dragging");
    };
    const onRailClick = (e: MouseEvent) => {
      if (e.target === thumb) return;
      scrollFromClientY(e.clientY);
    };

    thumb?.addEventListener("pointerdown", onThumbDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    rail?.addEventListener("click", onRailClick);

    const ctx = gsap.context(() => {
      // page-load hero entrance
      gsap.set([".hero-tag", ".script-accent", ".hero-copy h1", ".hero-copy p", ".red-button"], { opacity: 0, y: 30 });
      gsap.timeline({ delay: .15 })
        .to(".hero-tag", { opacity: 1, y: 0, duration: .8, ease: "power3.out" })
        .to(".script-accent", { opacity: 1, y: 0, duration: .8, ease: "power3.out" }, .1)
        .to(".hero-copy h1", { opacity: 1, y: 0, duration: 1, ease: "power4.out" }, .18)
        .to(".hero-copy p", { opacity: 1, y: 0, duration: .8, ease: "power3.out" }, .45)
        .to(".red-button", { opacity: 1, y: 0, duration: .7, ease: "power3.out" }, .55);

      // generic reveal on scroll
      gsap.utils.toArray<HTMLElement>(".reveal").forEach((el) => {
        gsap.fromTo(el, { y: 55, opacity: 0 }, { y: 0, opacity: 1, duration: .9, ease: "power4.out", scrollTrigger: { trigger: el, start: "top 82%", once: true } });
      });

      // staggered grid children
      [".problem-grid", ".process-grid", ".archive-grid"].forEach((sel) => {
        const grid = document.querySelector(sel);
        if (!grid) return;
        gsap.fromTo(grid.children, { y: 45, opacity: 0 }, {
          y: 0, opacity: 1, duration: .8, ease: "power3.out", stagger: .09,
          scrollTrigger: { trigger: grid, start: "top 80%", once: true },
        });
      });

      gsap.to(".progress-line", { scaleX: 1, ease: "none", scrollTrigger: { trigger: document.body, start: "top top", end: "bottom bottom", scrub: true } });
      gsap.to(".hero-copy", { y: -120, opacity: .25, ease: "none", scrollTrigger: { trigger: "#invention-story", start: "top top", end: "45% top", scrub: true } });
      gsap.to(".hero-tag", { y: -45, opacity: 0, ease: "none", scrollTrigger: { trigger: "#invention-story", start: "top top", end: "35% top", scrub: true } });

      // ============ invention story crossfade (fix for overlapping panels) ============
      const phases = gsap.utils.toArray<HTMLElement>(".story-phase");
      const dots = gsap.utils.toArray<HTMLElement>(".story-dots span");
      if (phases.length) {
        gsap.set(phases, { opacity: 0, filter: "blur(10px)", y: 40 });
        gsap.set(phases[0], { opacity: 1, filter: "blur(0px)", y: 0 });

        const storyTl = gsap.timeline({
          scrollTrigger: {
            trigger: "#invention-story",
            start: "top top",
            end: "bottom bottom",
            scrub: 1,
            onUpdate: (self) => {
              const idx = Math.min(phases.length - 1, Math.floor(self.progress * phases.length));
              dots.forEach((d, i) => d.classList.toggle("active", i === idx));
            },
          },
        });

        phases.forEach((phase, i) => {
          if (i === phases.length - 1) return;
          const t = i + 0.72;
          storyTl
            .to(phase, { opacity: 0, y: -40, filter: "blur(10px)", duration: .3, ease: "power2.inOut" }, t)
            .to(phases[i + 1], { opacity: 1, y: 0, filter: "blur(0px)", duration: .3, ease: "power2.out" }, t + .02);
        });
      }

      // active nav-link tracking
      ["problem", "process", "archive", "case"].forEach((id) => {
        const section = document.getElementById(id);
        const link = document.querySelector<HTMLElement>(`.nav-links a[href="#${id}"]`);
        if (!section || !link) return;
        ScrollTrigger.create({
          trigger: section,
          start: "top 50%",
          end: "bottom 50%",
          onToggle: (self) => link.classList.toggle("active", self.isActive),
        });
      });

      // magnetic buttons
      gsap.utils.toArray<HTMLElement>(".red-button, .dark-button, .nav-cta").forEach((btn) => {
        const xTo = gsap.quickTo(btn, "x", { duration: .5, ease: "power3.out" });
        const yTo = gsap.quickTo(btn, "y", { duration: .5, ease: "power3.out" });
        const move = (e: MouseEvent) => {
          const r = btn.getBoundingClientRect();
          xTo((e.clientX - r.left - r.width / 2) * .35);
          yTo((e.clientY - r.top - r.height / 2) * .35);
        };
        const leave = () => { xTo(0); yTo(0); };
        btn.addEventListener("mousemove", move);
        btn.addEventListener("mouseleave", leave);
      });
    }, main);

    return () => {
      document.removeEventListener("click", handleNavClick);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      thumb?.removeEventListener("pointerdown", onThumbDown);
      rail?.removeEventListener("click", onRailClick);
      ctx.revert();
      gsap.ticker.remove(raf);
      lenis.destroy();
    };
  }, []);

  return (
    <main ref={main}>
      <Scene />
      <div className="grain" />
      <div className="progress-line" />

      <div className="scroll-rail" ref={railRef} aria-hidden="true">
        <div className="scroll-thumb" ref={thumbRef} />
      </div>

      <nav className="nav">
        <a href="#top" className="brand"><span>second</span><span>draft</span></a>
        <div className="nav-links"><a href="#problem">problem</a><a href="#process">process</a><a href="#archive">archive</a><a href="#case">case</a></div>
        <a href="#submit" className="nav-cta">submit <ArrowUpRight size={13}/></a>
      </nav>

      <section className="hero" id="top">
        <div className="hero-grid" />
        <div className="hero-tag"><span>RECOVERY LAB / 001</span><span>FAILED INVENTION / ACTIVE REBUILD</span></div>
        <div className="hero-copy">
          <div className="script-accent">the failed invention</div>
          <h1>What if<br/><span>failure</span><br/>wasn't final?</h1>
          <p>We find inventions that almost worked, then rebuild the part everyone else stopped believing in.</p>
          <a className="red-button" href="#problem">inspect the prototype <ArrowDown size={14}/></a>
        </div>
        <div className="hero-hover-word"><TextHoverEffect text="SECOND DRAFT" duration={.08} idPrefix="hero-second-draft"/></div>
        <div className="hero-corner">
          <span>OBJECT / SD-000</span>
          <span className="scroll-flag"><span className="dot" />DRAG TO INSPECT · SCROLL TO REBUILD</span>
        </div>
      </section>

      <section className="story-spacer" id="invention-story" aria-label="The failed invention story">
        <div className="story-stage">
          {storyPhases.map((phase, i) => (
            <div className={`story-phase phase-${i + 1}${i === 0 ? " is-first" : ""}`} key={phase.n}>
              <span>{phase.n}</span>
              <h2>{phase.title[0]}<br/><i>{phase.title[1]}</i></h2>
              <p>{phase.body}</p>
            </div>
          ))}
          <div className="story-dots" aria-hidden="true">
            {storyPhases.map((phase, i) => <span key={phase.n} className={i === 0 ? "active" : ""} />)}
          </div>
        </div>
      </section>

      <section className="problem page-section" id="problem">
        <div className="section-shell"><Label n="01" word="problem"/><Reveal><div className="eyebrow">THE INVENTION GRAVEYARD</div></Reveal><Reveal><h2>Good ideas don't<br/><span>die cleanly.</span></h2></Reveal>
          <div className="problem-grid">
            {[['376,698','Kickstarter projects failed to reach their funding goals as of January 2025'],['78.9%','of technology projects in a 2009–2020 Kickstarter dataset failed'],['1,766','active patents remained after startups shut down']].map(([n,t])=><div className="stat" key={n}><span>DATA POINT</span><b>{n}</b><p>{t}</p></div>)}
          </div>
        </div>
      </section>

      <section className="process page-section" id="process">
        <div className="section-shell"><Label n="02" word="process"/><Reveal><div className="eyebrow">THE SECOND DRAFT LOOP</div></Reveal><Reveal><h2>Don't start over.<br/><i>Start from evidence.</i></h2></Reveal>
          <div className="process-grid">
            {processSteps.map(({ n, t, Icon, body }) => (
              <div className="process-card" key={t}>
                <div className="card-no">{n}</div>
                <Icon size={28}/>
                <h3>{t}</h3>
                <p>{body}</p>
                <ArrowRight size={16}/>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="archive page-section" id="archive"><div className="section-shell"><Label n="03" word="archive"/><Reveal><div className="eyebrow">ALMOST-INVENTIONS</div></Reveal><Reveal><h2>Waiting for<br/><i>another try.</i></h2></Reveal>
        <div className="archive-grid">{archive.map(([id,title,year,status],i)=><div className="archive-card" key={id}><div className="archive-head"><span>{id}</span><span>{status}</span></div><div className={`mini-object mini-${i}`}><div className="mini-core"/><div className="mini-ring"/><div className="mini-arm"/></div><div className="archive-info"><b>{title}</b><small>{year}</small></div></div>)}</div>
      </div></section>

      <section className="case page-section" id="case"><div className="case-inner"><Reveal><div><span className="case-kicker">CASE FILE / 000</span><h2>847 inventions.<br/><i>One very strange lab.</i></h2><p>One man's impossible backlog became the first proof that abandoned inventions can contain valuable IP, technical evidence and a second life.</p></div></Reveal><Reveal className="case-box">{[['847','CONCEPTS RECOVERED'],['126','TECHNICALLY VIABLE'],['23','COMMERCIAL SIGNAL'],['01','EXTREMELY QUESTIONABLE']].map(([n,l])=><div key={l}><b>{n}</b><span>{l}</span></div>)}</Reveal></div></section>

      <section className="submit page-section" id="submit"><div className="submit-word"><TextHoverEffect text="SECOND" duration={.1} idPrefix="submit-second"/></div><div className="submit-inner"><Reveal><span className="case-kicker">GIVE IT ANOTHER SHOT</span><h2>Built something<br/><i>nobody believed in?</i></h2><p>Tell us what you built, what went wrong, and why it still deserves another version.</p><SubmitForm/></Reveal></div></section>

      <footer><div className="footer-main"><div className="footer-brand">second<br/>draft</div><div className="footer-slogan">WE FINISH WHAT<br/>OTHERS STARTED.</div><div className="footer-links"><a href="#problem">problem</a><a href="#process">process</a><a href="#archive">archive</a><a href="#case">case</a></div></div><div className="footer-bottom"><span>TEAM PYRO · 2026</span><span>RECOVERY LAB / 001</span><span>SECOND DRAFT</span></div></footer>
    </main>
  );
}
