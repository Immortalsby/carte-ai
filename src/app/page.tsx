"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Building,
  Check,
  ChevronDown,
  FileUp,
  Globe,
  Languages,
  Link as LinkIcon,
  LineChart,
  MessageCircle,
  QrCode,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Utensils,
  Zap,
} from "lucide-react";
import { type LandingLocale, getLandingDict, detectLandingLocale } from "@/lib/landing-i18n";

/* ------------------------------------------------------------------ */
/*  Landing page — CarteAI (trilingual: FR / EN / ZH)                 */
/* ------------------------------------------------------------------ */

// ---------- Language switcher ----------
function LangSwitch({
  current,
  onChange,
}: {
  current: LandingLocale;
  onChange: (l: LandingLocale) => void;
}) {
  const locales: LandingLocale[] = ["fr", "en", "zh"];
  const labels: Record<LandingLocale, string> = { fr: "FR", en: "EN", zh: "中" };
  return (
    <div className="flex rounded-full border border-white/15 p-0.5">
      {locales.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => onChange(l)}
          className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
            current === l
              ? "bg-white/15 text-white"
              : "text-white/40 hover:text-white/70"
          }`}
        >
          {labels[l]}
        </button>
      ))}
    </div>
  );
}

// ---------- Navbar ----------
function Navbar({ t, locale, onLocale }: { t: Record<string, string>; locale: LandingLocale; onLocale: (l: LandingLocale) => void }) {
  return (
    <nav className="fixed top-0 z-50 w-full border-b border-white/10 bg-[#050507]/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/images/logo-icon.png" alt="CarteAI" width={32} height={32} className="rounded-lg" />
          <span className="text-lg font-semibold text-white">CarteAI</span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <a href="#features" className="text-sm text-white/60 hover:text-white transition">{t.nav_features}</a>
          <a href="#pricing" className="text-sm text-white/60 hover:text-white transition">{t.nav_pricing}</a>
          <a href="#faq" className="text-sm text-white/60 hover:text-white transition">{t.nav_faq}</a>
        </div>

        <div className="flex items-center gap-3">
          <LangSwitch current={locale} onChange={onLocale} />
          <Link href="/login" className="hidden text-sm text-white/60 hover:text-white transition sm:block">{t.nav_login}</Link>
          <Link href="/register" className="inline-flex h-9 items-center rounded-full bg-emerald-400 px-4 text-sm font-semibold text-black hover:bg-emerald-300 transition">{t.nav_cta}</Link>
        </div>
      </div>
    </nav>
  );
}

// ---------- Cloche static icon (small badge uses) ----------
function ClocheIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 100" className={className} aria-hidden="true">
      {/* sparkle */}
      <path d="M60,4 L62,12 L70,14 L62,16 L60,24 L58,16 L50,14 L58,12 Z" fill="#d4a574" opacity=".8"/>
      {/* plate */}
      <ellipse cx="60" cy="76" rx="50" ry="5" fill="#10b981"/>
      {/* dome */}
      <path d="M16,74 A44,40 0 0 1 104,74" fill="none" stroke="#10b981" strokeWidth="6" strokeLinecap="round"/>
      {/* highlight */}
      <path d="M34,62 A30,28 0 0 1 56,40" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" opacity=".55"/>
      {/* eye */}
      <ellipse cx="42" cy="56" rx="6" ry="7" fill="#fafaf7" stroke="#050507" strokeWidth="1.2"/>
      <ellipse cx="43" cy="57" rx="3.5" ry="4.5" fill="#050507"/>
      <ellipse cx="44.5" cy="55" rx="1.3" ry="1.5" fill="#fafaf7"/>
    </svg>
  );
}

// ---------- Cloche animated (Hero + Final CTA) ----------
function ClocheAnimated({ className = "", size = "md" }: { className?: string; size?: "sm" | "md" | "lg" }) {
  const id = size; // unique prefix for CSS scoping
  return (
    <svg viewBox="0 0 240 240" className={className} aria-hidden="true">
      <style>{`
        @keyframes c-sparkle-${id} { 0%,100%{transform:scale(1) rotate(0);opacity:1} 50%{transform:scale(1.18) rotate(8deg);opacity:.92} }
        @keyframes c-body-${id} { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }
        @keyframes c-dome-${id} { 0%,100%{transform:rotate(0deg)} 50%{transform:rotate(-0.6deg)} }
        @keyframes c-blink-${id} { 0%,94%,100%{transform:scaleY(1)} 96%{transform:scaleY(.05)} 98%{transform:scaleY(1)} }
        @keyframes c-drift-${id} { 0%,40%,100%{transform:translate(0,0)} 50%,70%{transform:translate(2px,0)} 80%,90%{transform:translate(-2px,0)} }
        .c-sparkle-${id}{transform-origin:center;transform-box:fill-box;animation:c-sparkle-${id} 2.8s ease-in-out infinite}
        .c-body-${id}{transform-origin:center;transform-box:fill-box;animation:c-body-${id} 3.2s ease-in-out infinite}
        .c-dome-${id}{transform-origin:190px 156px;transform-box:view-box;animation:c-dome-${id} 3s ease-in-out infinite}
        .c-blink-${id}{transform-origin:center;transform-box:fill-box;animation:c-blink-${id} 4.2s ease-in-out infinite}
        .c-drift-${id}{transform-origin:center;transform-box:fill-box;animation:c-drift-${id} 5s ease-in-out infinite}
      `}</style>
      {/* sparkle */}
      <g transform="translate(120,30)">
        <g className={`c-sparkle-${id}`}>
          <path d="M0,-12 L2.4,-2 L10,0 L2.4,2 L0,12 L-2.4,2 L-10,0 L-2.4,-2 Z" fill="#d4a574"/>
        </g>
      </g>
      <g className={`c-body-${id}`}>
        {/* mouth cavity (behind dome, visible when dome tilts) */}
        <path d="M50,156 L190,156 L190,156 L50,166 Z" fill="#050507"/>
        <path d="M62,160 L182,156 L182,157 L62,163 Z" fill="#0a3a2c" opacity=".7"/>
        {/* plate */}
        <ellipse cx="120" cy="160" rx="76" ry="5" fill="#10b981"/>
        {/* dome (hinged at right rim) */}
        <g className={`c-dome-${id}`}>
          <path d="M50,156 A70,62 0 0 1 190,156" fill="none" stroke="#10b981" strokeWidth="7" strokeLinecap="round"/>
          <path d="M70,140 A48,42 0 0 1 110,108" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" opacity=".55"/>
          <path d="M50,156 L190,156" stroke="#10b981" strokeWidth="7" strokeLinecap="round"/>
          {/* eye */}
          <g transform="translate(92,128)">
            <g className={`c-drift-${id}`}>
              <ellipse cx="0" cy="0" rx="11" ry="12.5" fill="#fafaf7" stroke="#050507" strokeWidth="1.8"/>
              <g className={`c-blink-${id}`}>
                <ellipse cx="1" cy="1" rx="6" ry="7.5" fill="#050507"/>
                <ellipse cx="3" cy="-2" rx="2.2" ry="2.4" fill="#fafaf7"/>
                <ellipse cx="-1" cy="4" rx="1" ry="1.1" fill="#fafaf7" opacity=".7"/>
              </g>
            </g>
          </g>
        </g>
      </g>
    </svg>
  );
}

// ---------- Hero ----------
function Hero({ t }: { t: Record<string, string> }) {
  return (
    <section className="relative mx-auto grid min-h-screen w-full max-w-7xl items-center gap-12 px-5 pt-24 pb-8 lg:grid-cols-[1.05fr_0.95fr]">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/20 bg-emerald-200/10 px-4 py-2 text-sm text-emerald-50">
          <ClocheIcon className="h-5 w-7" />
          {t.hero_badge}
        </div>
        <h1 className="mt-7 max-w-xl text-5xl font-semibold leading-[1.05] md:text-7xl">
          {t.hero_title_1}{" "}
          <span className="text-emerald-300">{t.hero_title_2}</span>
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-8 text-white/60">{t.hero_desc}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/register" className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-black hover:bg-emerald-100 transition">
            {t.hero_cta_primary}
            <ArrowRight className="h-4 w-4" />
          </Link>
          <a href="#how-it-works" className="inline-flex h-12 items-center justify-center rounded-full border border-white/12 px-6 text-sm font-semibold text-white/70 hover:border-emerald-200/50 hover:text-white transition">
            {t.hero_cta_secondary}
          </a>
        </div>
        <div className="mt-10 flex gap-8">
          <div><p className="text-2xl font-bold text-white">19</p><p className="text-xs text-white/45">{t.hero_stat_langs}</p></div>
          <div><p className="text-2xl font-bold text-white">3s</p><p className="text-xs text-white/45">{t.hero_stat_speed}</p></div>
          <div><p className="text-2xl font-bold text-white">+2-5&euro;</p><p className="text-xs text-white/45">{t.hero_stat_revenue}</p></div>
          <div><p className="text-2xl font-bold text-white">0&euro;</p><p className="text-xs text-white/45">{t.hero_stat_free}</p></div>
        </div>
      </div>

      <div className="relative">
        <div className="absolute -inset-4 rounded-[3rem] bg-emerald-400/10 blur-3xl" />
        <div className="relative rounded-[2rem] border border-emerald-200/15 bg-white/[0.04] p-5 shadow-[0_0_80px_rgba(16,185,129,0.14)]">
          <div className="rounded-[1.5rem] border border-white/10 bg-black/30 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-emerald-200/60">{t.hero_mock_label}</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">AI Concierge</h2>
              </div>
              <ClocheAnimated className="h-14 w-14" size="md" />
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {[t.hero_mock_btn1, t.hero_mock_btn2, t.hero_mock_btn3, t.hero_mock_btn4].map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/80">{item}</div>
              ))}
            </div>
            <div className="mt-5 rounded-3xl border border-emerald-200/20 bg-emerald-200/10 p-5">
              <div className="flex items-center gap-2">
                <ClocheIcon className="h-6 w-8 shrink-0" />
                <p className="text-xs uppercase tracking-[0.22em] text-emerald-100/70">{t.hero_mock_best}</p>
              </div>
              <div className="mt-3 flex items-start justify-between">
                <h3 className="text-2xl font-semibold text-white">{t.hero_mock_dish}</h3>
                <p className="font-mono text-emerald-100">9,80&euro;</p>
              </div>
              <p className="mt-3 text-sm leading-6 text-white/55">{t.hero_mock_reason}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------- Social proof bar ----------
function SocialProof({ t }: { t: Record<string, string> }) {
  return (
    <section className="relative border-y border-white/10 bg-white/[0.02] py-12">
      <div className="mx-auto max-w-5xl px-5 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-white/35">{t.social_headline}</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
          {[
            { icon: <Globe className="h-5 w-5" />, label: t.social_1 },
            { icon: <ShieldCheck className="h-5 w-5" />, label: t.social_2 },
            { icon: <Utensils className="h-5 w-5" />, label: t.social_3 },
            { icon: <Zap className="h-5 w-5" />, label: t.social_4 },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2 text-sm text-white/50">
              <span className="text-emerald-300">{item.icon}</span>
              {item.label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------- Pain points ----------
function PainPoints({ t }: { t: Record<string, string> }) {
  const pains = [
    { icon: <Languages className="h-6 w-6" />, title: t.pain1_title, desc: t.pain1_desc },
    { icon: <ShieldCheck className="h-6 w-6" />, title: t.pain2_title, desc: t.pain2_desc },
    { icon: <TrendingUp className="h-6 w-6" />, title: t.pain3_title, desc: t.pain3_desc },
  ];
  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-7xl px-5">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">{t.pain_section}</p>
          <h2 className="mt-4 text-4xl font-semibold text-white">{t.pain_title}</h2>
        </div>
        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {pains.map((p) => (
            <div key={p.title} className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 transition hover:border-red-400/20 hover:bg-red-400/[0.03]">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-400/15 text-red-300">{p.icon}</div>
              <h3 className="mt-6 text-lg font-semibold text-white">{p.title}</h3>
              <p className="mt-3 text-sm leading-6 text-white/50">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------- How it works ----------
function HowItWorks({ t }: { t: Record<string, string> }) {
  const steps = [
    { step: "01", title: t.how1_title, desc: t.how1_desc, icon: <FileUp className="h-6 w-6" /> },
    { step: "02", title: t.how2_title, desc: t.how2_desc, icon: <QrCode className="h-6 w-6" /> },
    { step: "03", title: t.how3_title, desc: t.how3_desc, icon: <Sparkles className="h-6 w-6" /> },
  ];
  return (
    <section id="how-it-works" className="relative py-24">
      <div className="mx-auto max-w-7xl px-5">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">{t.how_section}</p>
          <h2 className="mt-4 text-4xl font-semibold text-white">{t.how_title}</h2>
          <p className="mt-3 text-white/50">{t.how_subtitle}</p>
        </div>
        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {steps.map((s, i) => (
            <div key={s.step} className="group relative rounded-3xl border border-white/10 bg-white/[0.03] p-8 transition hover:border-emerald-200/30 hover:bg-white/[0.05]">
              {i < steps.length - 1 && (
                <div className="absolute right-0 top-1/2 hidden h-px w-8 translate-x-full bg-gradient-to-r from-emerald-400/40 to-transparent md:block" />
              )}
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/15 text-emerald-200 transition group-hover:bg-emerald-400/25">{s.icon}</div>
                <span className="font-mono text-3xl font-bold text-white/15">{s.step}</span>
              </div>
              <h3 className="mt-6 text-xl font-semibold text-white">{s.title}</h3>
              <p className="mt-3 text-sm leading-6 text-white/50">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------- Features ----------
function Features({ t }: { t: Record<string, string> }) {
  const features = [
    { tag: t.feat1_tag, title: t.feat1_title, desc: t.feat1_desc, bullets: [t.feat1_b1, t.feat1_b2, t.feat1_b3, t.feat1_b4], image: "/images/landing/feature-upload.jpg" },
    { tag: t.feat2_tag, title: t.feat2_title, desc: t.feat2_desc, bullets: [t.feat2_b1, t.feat2_b2, t.feat2_b3, t.feat2_b4], image: "/images/landing/feature-multilang.jpg", reverse: true },
    { tag: t.feat3_tag, title: t.feat3_title, desc: t.feat3_desc, bullets: [t.feat3_b1, t.feat3_b2, t.feat3_b3, t.feat3_b4], image: "/images/landing/feature-allergen.jpg" },
    { tag: t.feat4_tag, title: t.feat4_title, desc: t.feat4_desc, bullets: [t.feat4_b1, t.feat4_b2, t.feat4_b3, t.feat4_b4], image: "/images/landing/feature-analytics.jpg", reverse: true },
  ];

  return (
    <section id="features" className="relative py-24">
      <div className="mx-auto max-w-7xl px-5">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">{t.feat_section}</p>
          <h2 className="mt-4 text-4xl font-semibold text-white">{t.feat_title}</h2>
        </div>
        <div className="mt-20 space-y-28">
          {features.map((f) => (
            <div key={f.tag} className={`flex flex-col items-center gap-12 lg:flex-row ${f.reverse ? "lg:flex-row-reverse" : ""}`}>
              <div className="flex-1 space-y-6">
                <span className="inline-block rounded-full border border-emerald-200/20 bg-emerald-200/10 px-3 py-1 text-xs font-medium text-emerald-200">{f.tag}</span>
                <h3 className="text-3xl font-semibold leading-tight text-white">{f.title}</h3>
                <p className="text-base leading-7 text-white/55">{f.desc}</p>
                <ul className="space-y-3">
                  {f.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-3 text-sm text-white/65">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex-1">
                <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
                  <Image src={f.image} alt={f.title} width={800} height={600} className="h-auto w-full object-cover" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------- Revenue boost ----------
function RevenueBoost({ t }: { t: Record<string, string> }) {
  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-7xl px-5">
        <div className="relative overflow-hidden rounded-[2.5rem] border border-emerald-200/20 bg-gradient-to-br from-emerald-400/[0.08] to-cyan-400/[0.04] p-8 md:p-14">
          <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl" />
          <div className="relative grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">{t.rev_section}</p>
              <h2 className="mt-4 text-4xl font-semibold text-white">{t.rev_title}</h2>
              <p className="mt-4 text-base leading-7 text-white/55" dangerouslySetInnerHTML={{ __html: t.rev_desc }} />
              <ul className="mt-6 space-y-3">
                {[t.rev_b1, t.rev_b2, t.rev_b3, t.rev_b4].map((b) => (
                  <li key={b} className="flex items-start gap-3 text-sm text-white/65">
                    <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: t.rev_stat1_val, label: t.rev_stat1_label, color: "text-emerald-300" },
                { value: "30%", label: t.rev_stat2_label, color: "text-emerald-300" },
                { value: "0", label: t.rev_stat3_label, color: "text-cyan-300" },
                { value: "100%", label: t.rev_stat4_label, color: "text-cyan-300" },
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-white/10 bg-black/20 p-5 text-center">
                  <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="mt-2 text-xs text-white/45">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------- Pricing ----------
function Pricing({ t }: { t: Record<string, string> }) {
  const plans = [
    {
      name: t.price_starter, price: "19\u20ac", period: t.price_mo, desc: t.price_starter_desc, highlight: false,
      features: [t.price_starter_f1, t.price_starter_f2, t.price_starter_f3, t.price_starter_f4, t.price_starter_f5, t.price_starter_f6, t.price_starter_f7],
      cta: t.price_cta_trial, ctaHref: "/register",
    },
    {
      name: t.price_pro, price: "39\u20ac", period: t.price_mo, desc: t.price_pro_desc, highlight: true,
      features: [t.price_pro_f1, t.price_pro_f2, t.price_pro_f3, t.price_pro_f4, t.price_pro_f5, t.price_pro_f6, t.price_pro_f7],
      cta: t.price_cta_trial, ctaHref: "/register",
    },
    {
      name: t.price_enterprise, price: t.price_enterprise_custom, period: "", desc: t.price_enterprise_desc, highlight: false,
      features: [t.price_enterprise_f1, t.price_enterprise_f2, t.price_enterprise_f3, t.price_enterprise_f4, t.price_enterprise_f5, t.price_enterprise_f6, t.price_enterprise_f7],
      cta: t.price_cta_contact, ctaHref: "mailto:contact@carte-ai.link",
    },
  ];

  return (
    <section id="pricing" className="relative py-24">
      <div className="mx-auto max-w-7xl px-5">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">{t.price_section}</p>
          <h2 className="mt-4 text-4xl font-semibold text-white">{t.price_title}</h2>
          <p className="mt-3 text-white/50">{t.price_subtitle}</p>
        </div>
        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {plans.map((p) => (
            <div key={p.name} className={`relative rounded-3xl border p-8 ${p.highlight ? "border-emerald-400/40 bg-emerald-400/[0.06] shadow-[0_0_60px_rgba(16,185,129,0.1)]" : "border-white/10 bg-white/[0.03]"}`}>
              {p.highlight && <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-emerald-400 px-4 py-1 text-xs font-bold text-black">{t.price_popular}</div>}
              <h3 className="text-lg font-semibold text-white">{p.name}</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-white">{p.price}</span>
                <span className="text-sm text-white/40">{p.period}</span>
              </div>
              <p className="mt-3 text-sm text-white/50">{p.desc}</p>
              <ul className="mt-6 space-y-3">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-white/65">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />{f}
                  </li>
                ))}
              </ul>
              <Link href={p.ctaHref} className={`mt-8 block rounded-full py-3 text-center text-sm font-semibold transition ${p.highlight ? "bg-emerald-400 text-black hover:bg-emerald-300" : "border border-white/15 text-white hover:border-emerald-200/50"}`}>
                {p.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------- Use cases ----------
function UseCases({ t }: { t: Record<string, string> }) {
  const cases = [
    { icon: <Globe className="h-5 w-5" />, name: t.case1_name, role: t.case1_role, quote: t.case1_quote },
    { icon: <MessageCircle className="h-5 w-5" />, name: t.case2_name, role: t.case2_role, quote: t.case2_quote },
    { icon: <LineChart className="h-5 w-5" />, name: t.case3_name, role: t.case3_role, quote: t.case3_quote },
  ];
  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-7xl px-5">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">{t.cases_section}</p>
          <h2 className="mt-4 text-4xl font-semibold text-white">{t.cases_title}</h2>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {cases.map((c) => (
            <div key={c.name} className="rounded-3xl border border-white/10 bg-white/[0.03] p-8">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-200">{c.icon}</div>
                <div>
                  <p className="text-sm font-semibold text-white">{c.name}</p>
                  <p className="text-xs text-white/40">{c.role}</p>
                </div>
              </div>
              <p className="mt-5 text-sm leading-6 text-white/55 italic">&ldquo;{c.quote}&rdquo;</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------- Coming soon ----------
function ComingSoon({ t }: { t: Record<string, string> }) {
  return (
    <section className="relative py-16">
      <div className="mx-auto max-w-4xl px-5">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 md:p-12">
          <div className="flex flex-col items-center gap-6 md:flex-row">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-green-400/15 text-green-300">
              <MessageCircle className="h-8 w-8" />
            </div>
            <div>
              <div className="inline-block rounded-full border border-green-200/20 bg-green-200/10 px-3 py-1 text-xs font-medium text-green-200">{t.coming_badge}</div>
              <h3 className="mt-3 text-2xl font-semibold text-white">{t.coming_title}</h3>
              <p className="mt-2 text-sm leading-6 text-white/50">{t.coming_desc}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------- FAQ ----------
function FAQ({ t }: { t: Record<string, string> }) {
  const faqs = [
    { q: t.faq1_q, a: t.faq1_a },
    { q: t.faq2_q, a: t.faq2_a },
    { q: t.faq3_q, a: t.faq3_a },
    { q: t.faq4_q, a: t.faq4_a },
    { q: t.faq5_q, a: t.faq5_a },
    { q: t.faq6_q, a: t.faq6_a },
    { q: t.faq7_q, a: t.faq7_a },
    { q: t.faq8_q, a: t.faq8_a },
  ];
  return (
    <section id="faq" className="relative py-24">
      <div className="mx-auto max-w-3xl px-5">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">{t.faq_section}</p>
          <h2 className="mt-4 text-4xl font-semibold text-white">{t.faq_title}</h2>
        </div>
        <div className="mt-12 space-y-4">
          {faqs.map((faq) => (
            <details key={faq.q} className="group rounded-2xl border border-white/10 bg-white/[0.03] transition hover:border-white/20">
              <summary className="flex cursor-pointer items-center justify-between px-6 py-5 text-sm font-medium text-white [&::-webkit-details-marker]:hidden">
                {faq.q}
                <ChevronDown className="h-4 w-4 shrink-0 text-white/40 transition group-open:rotate-180" />
              </summary>
              <div className="px-6 pb-5 text-sm leading-6 text-white/55">{faq.a}</div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------- Partners ----------
function Partners({ t }: { t: Record<string, string> }) {
  const cards = [
    { icon: <Building className="h-6 w-6" />, title: t.partners_enterprise_title, desc: t.partners_enterprise_desc },
    { icon: <LinkIcon className="h-6 w-6" />, title: t.partners_tech_title, desc: t.partners_tech_desc },
    { icon: <TrendingUp className="h-6 w-6" />, title: t.partners_invest_title, desc: t.partners_invest_desc },
  ];
  const stats = [
    { label: t.partners_market },
    { label: t.partners_stage },
    { label: t.partners_stack },
    { label: t.partners_compliance },
  ];
  return (
    <section id="partners" className="relative py-24">
      <div className="mx-auto max-w-7xl px-5">
        <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/[0.02] p-8 md:p-14">
          <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-emerald-400/5 blur-3xl" />
          <div className="relative grid gap-10 lg:grid-cols-[1fr_auto] lg:items-start">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">{t.partners_section}</p>
              <h2 className="mt-4 text-4xl font-semibold text-white">{t.partners_title}</h2>
              <p className="mt-3 max-w-xl text-base text-white/50">{t.partners_subtitle}</p>

              <div className="mt-10 grid gap-6 md:grid-cols-3">
                {cards.map((c) => (
                  <div key={c.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-emerald-200/20">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-200">{c.icon}</div>
                    <h3 className="mt-4 text-base font-semibold text-white">{c.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-white/50">{c.desc}</p>
                    <a href="mailto:contact@carte-ai.link" className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-300 hover:text-emerald-200 transition">
                      {t.partners_cta} <ArrowRight className="h-3.5 w-3.5" />
                    </a>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap gap-x-8 gap-y-2">
                {stats.map((s) => (
                  <span key={s.label} className="text-xs text-white/30">{s.label}</span>
                ))}
              </div>
            </div>

            <div className="hidden lg:flex flex-col items-center gap-4">
              <ClocheAnimated className="h-28 w-28" size="lg" />
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm italic text-white/50">
                &ldquo;Let&rsquo;s build something together.&rdquo;
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------- Final CTA ----------
function FinalCTA({ t }: { t: Record<string, string> }) {
  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-4xl px-5 text-center">
        <div className="relative rounded-[2.5rem] border border-emerald-200/20 bg-emerald-400/[0.06] px-8 py-16 shadow-[0_0_120px_rgba(16,185,129,0.1)]">
          <ClocheAnimated className="mx-auto mb-6 h-16 w-16" size="sm" />
          <h2 className="text-4xl font-semibold text-white md:text-5xl">{t.cta_title}</h2>
          <p className="mx-auto mt-5 max-w-xl text-base text-white/55">{t.cta_desc}</p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/register" className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-black hover:bg-emerald-100 transition">
              {t.cta_primary}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="mailto:contact@carte-ai.link" className="inline-flex h-12 items-center rounded-full border border-white/15 px-6 text-sm font-semibold text-white/70 hover:border-emerald-200/50 hover:text-white transition">
              {t.cta_contact}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------- Footer ----------
function FooterSection({ t }: { t: Record<string, string> }) {
  return (
    <footer className="border-t border-white/10 bg-[#050507] py-12">
      <div className="mx-auto max-w-7xl px-5">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/images/logo-icon.png" alt="CarteAI" width={28} height={28} className="rounded-lg" />
              <span className="text-base font-semibold text-white">CarteAI</span>
            </Link>
            <p className="mt-3 whitespace-pre-line text-xs leading-5 text-white/40">{t.footer_tagline}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">{t.footer_product}</p>
            <ul className="mt-4 space-y-2.5">
              <li><a href="#features" className="text-sm text-white/45 hover:text-white transition">{t.nav_features}</a></li>
              <li><a href="#pricing" className="text-sm text-white/45 hover:text-white transition">{t.nav_pricing}</a></li>
              <li><a href="#faq" className="text-sm text-white/45 hover:text-white transition">{t.nav_faq}</a></li>
              <li><a href="#partners" className="text-sm text-white/45 hover:text-white transition">{t.partners_section}</a></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">{t.footer_legal}</p>
            <ul className="mt-4 space-y-2.5">
              <li><Link href="/privacy" className="text-sm text-white/45 hover:text-white transition">{t.footer_privacy}</Link></li>
              <li><Link href="/terms" className="text-sm text-white/45 hover:text-white transition">{t.footer_terms}</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">{t.footer_contact}</p>
            <ul className="mt-4 space-y-2.5">
              <li><a href="mailto:contact@carte-ai.link" className="text-sm text-white/45 hover:text-white transition">contact@carte-ai.link</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t border-white/10 pt-6 text-center text-xs text-white/30">
          &copy; {new Date().getFullYear()} CarteAI. {t.footer_rights}
        </div>
      </div>
    </footer>
  );
}

// ---------- Page ----------
export default function Home() {
  const [locale, setLocale] = useState<LandingLocale>("fr");

  useEffect(() => {
    setLocale(detectLandingLocale());
  }, []);

  const t = getLandingDict(locale);

  return (
    <main className="min-h-screen overflow-hidden bg-[#050507] text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-1/2 top-[-20rem] h-[40rem] w-[40rem] -translate-x-1/2 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="absolute bottom-[-22rem] right-[-8rem] h-[36rem] w-[36rem] rounded-full bg-cyan-400/10 blur-3xl" />
      </div>

      <Navbar t={t} locale={locale} onLocale={setLocale} />
      <Hero t={t} />
      <SocialProof t={t} />
      <PainPoints t={t} />
      <HowItWorks t={t} />
      <Features t={t} />
      <RevenueBoost t={t} />
      <Pricing t={t} />
      <UseCases t={t} />
      <ComingSoon t={t} />
      <FAQ t={t} />
      <Partners t={t} />
      <FinalCTA t={t} />
      <FooterSection t={t} />
    </main>
  );
}
