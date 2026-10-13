"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowDown, ArrowUp, CalendarDays, Check, ChevronDown, ClipboardCheck, Copy, Flower2, Gift, Heart, ImageIcon, MapPin, MessageCircle, Pause, Play, Volume2, VolumeX, X } from "lucide-react";
import { gallery, giftAccounts, loveStory, marriageVerse, motion, wedding } from "@/lib/wedding-data";
import VideoBackground from "./video-background";
import EnvelopeCover from "./envelope-cover";
import WeddingMusic, { type MusicHandle } from "./wedding-music";

type Wish = { id: string; name: string; message: string; createdAt: number };
type Phase = "sealed" | "opening" | "open";
type RsvpRecord = { name: string; attendance: "yes" | "no"; guests: number };
const navItems = [
  { id: "beranda", label: "Undangan", icon: Flower2 },
  { id: "acara", label: "Acara", icon: CalendarDays },
  { id: "rsvp", label: "RSVP", icon: ClipboardCheck },
  { id: "ucapan", label: "Ucapan", icon: MessageCircle },
  { id: "hadiah", label: "Hadiah", icon: Gift },
];

function Ornament({ light = false }: { light?: boolean }) {
  return <div className={`ornament${light ? " light" : ""}`} aria-hidden="true"><span /><svg viewBox="0 0 80 24"><path d="M4 12c12-11 22-11 36 0C54 1 64 1 76 12M4 12c12 11 22 11 36 0 14 11 24 11 36 0M30 12l10-8 10 8-10 8z" /></svg><span /></div>;
}

function Countdown() {
  const [seconds, setSeconds] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setSeconds(Math.max(0, Math.floor((new Date(wedding.date).getTime() - Date.now()) / 1000)));
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, []);
  const numbers = seconds === null ? [null, null, null, null] : [Math.floor(seconds / 86400), Math.floor(seconds / 3600) % 24, Math.floor(seconds / 60) % 60, seconds % 60];
  return <div className="countdown" aria-label="Hitung mundur menuju akad nikah">
    {numbers.map((number, index) => <div key={index}><span>{number === null ? "—" : String(number).padStart(2, "0")}</span><small>{["Hari", "Jam", "Menit", "Detik"][index]}</small></div>)}
  </div>;
}

function GiftAccountCard({ account }: { account: (typeof giftAccounts)[number] }) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const accountRef = useRef<HTMLInputElement>(null);
  const resetTimer = useRef<number | null>(null);

  useEffect(() => () => { if (resetTimer.current) window.clearTimeout(resetTimer.current); }, []);

  async function copyAccount() {
    setCopyError(false);
    try {
      if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(account.account);
      else {
        const input = accountRef.current;
        if (!input) throw new Error("No input");
        input.focus(); input.select();
        if (!document.execCommand("copy")) throw new Error("Copy failed");
      }
      setCopied(true);
      if (resetTimer.current) window.clearTimeout(resetTimer.current);
      resetTimer.current = window.setTimeout(() => setCopied(false), 3500);
    } catch { setCopyError(true); accountRef.current?.focus(); accountRef.current?.select(); }
  }

  return <article className="bank-card" aria-label={`Hadiah melalui rekening ${account.beneficiary}`}>
    <div className="bank-top"><strong>{account.bank}</strong><span>S & D</span></div>
    <p className="bank-label">NOMOR REKENING</p>
    <input ref={accountRef} className="account-number" readOnly aria-label={`Nomor rekening ${account.bank} atas nama ${account.beneficiary}`} value={account.account} />
    <p className="bank-label beneficiary-label">ATAS NAMA</p><p className="beneficiary">{account.beneficiary}</p>
    <button type="button" className="copy-button" onClick={copyAccount} aria-label={copied ? `Nomor rekening ${account.beneficiary} telah disalin` : `Salin nomor rekening ${account.beneficiary}`}>{copied ? <Check size={15} /> : <Copy size={15} />}{copied ? "Nomor rekening disalin" : "Salin nomor rekening"}</button>
    {copyError && <p className="copy-note" role="status">Silakan pilih dan salin nomor rekening pada kartu ini.</p>}
  </article>;
}

export default function WeddingInvitation() {
  const [phase, setPhase] = useState<Phase>("sealed");
  const [guest, setGuest] = useState("Tamu Undangan");
  const [active, setActive] = useState("beranda");
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [musicError, setMusicError] = useState(false);
  const [motionPaused, setMotionPaused] = useState(true);
  const [motionReady, setMotionReady] = useState(false);
  const [name, setName] = useState("");
  const [attendance, setAttendance] = useState<"yes" | "no">("yes");
  const [guests, setGuests] = useState(1);
  const [rsvpBusy, setRsvpBusy] = useState(false);
  const [rsvpSaved, setRsvpSaved] = useState(false);
  const [rsvpStatus, setRsvpStatus] = useState("");
  const [rsvpError, setRsvpError] = useState(false);
  const [wishName, setWishName] = useState("");
  const [message, setMessage] = useState("");
  const [wishBusy, setWishBusy] = useState(false);
  const [wishStatus, setWishStatus] = useState("");
  const [wishError, setWishError] = useState(false);
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [wishesLoading, setWishesLoading] = useState(false);
  const [wishesLoadError, setWishesLoadError] = useState("");
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState(0);
  const audioRef = useRef<MusicHandle>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const heroTitleRef = useRef<HTMLHeadingElement>(null);
  const openTimer = useRef<number | null>(null);

  useEffect(() => {
    if (phase !== "open") return;
    const timer = window.setTimeout(() => setMotionReady(true), 250);
    return () => window.clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    const update = () => setMotionPaused(reduced.matches || connection?.saveData === true);
    update();
    reduced.addEventListener("change", update);
    return () => reduced.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const recipient = new URLSearchParams(window.location.search).get("to")?.trim().slice(0, 80);
    if (recipient) { setGuest(recipient); setName(recipient); setWishName(recipient); }
    return () => { if (openTimer.current) window.clearTimeout(openTimer.current); };
  }, []);

  useEffect(() => {
    document.body.style.overflow = phase === "open" ? "" : "hidden";
    if (phase === "open") {
      heroTitleRef.current?.focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: "instant" });
    }
    return () => { document.body.style.overflow = ""; };
  }, [phase]);

  useEffect(() => {
    if (phase !== "open") return;
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) if (entry.isIntersecting) setActive(entry.target.id);
    }, { rootMargin: "-18% 0px -58% 0px", threshold: 0 });
    for (const item of navItems) { const section = document.getElementById(item.id); if (section) observer.observe(section); }
    return () => observer.disconnect();
  }, [phase]);

  useEffect(() => {
    if (phase !== "open") return;
    let cancelled = false;
    loadWishes();
    fetch("/api/rsvp", { cache: "no-store" }).then(async (response) => response.ok ? await response.json() as { rsvp: RsvpRecord | null } : null).then((data) => {
      if (cancelled || !data?.rsvp) return;
      setName(data.rsvp.name);
      setAttendance(data.rsvp.attendance);
      setGuests(data.rsvp.guests || 1);
      setRsvpSaved(true);
      setRsvpStatus("Konfirmasi Anda sudah tercatat. Anda dapat memperbaruinya di sini.");
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [phase]);

  async function playMusic() {
    setMusicError(false);
    audioRef.current?.play();
  }

  function openInvitation() {
    if (phase !== "sealed") return;
    setPhase("opening");
    void playMusic();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    openTimer.current = window.setTimeout(() => setPhase("open"), reduced ? 80 : 2050);
  }

  function toggleMusic() {
    if (musicPlaying) { audioRef.current?.pause(); setMusicPlaying(false); }
    else void playMusic();
  }

  async function loadWishes(cursor?: string) {
    setWishesLoading(true); setWishesLoadError("");
    try {
      const response = await fetch(`/api/wishes${cursor ? `?before=${encodeURIComponent(cursor)}` : ""}`, { cache: "no-store" });
      const data = await response.json() as { wishes: Wish[]; nextCursor: string | null; error?: string };
      if (!response.ok) throw new Error(data.error || "Ucapan belum dapat dimuat.");
      setWishes((current) => cursor ? [...current, ...data.wishes.filter((item: Wish) => !current.some((old) => old.id === item.id))] : data.wishes);
      setNextCursor(data.nextCursor);
    } catch (error) { setWishesLoadError(error instanceof Error ? error.message : "Periksa koneksi dan coba lagi."); }
    finally { setWishesLoading(false); }
  }

  async function submitRsvp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (rsvpBusy) return;
    setRsvpBusy(true); setRsvpStatus(""); setRsvpError(false);
    const website = new FormData(event.currentTarget).get("website");
    try {
      const response = await fetch("/api/rsvp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, attendance, guests: attendance === "yes" ? guests : 0, website }) });
      const data = await response.json() as { ok?: boolean; error?: string };
      if (!response.ok) throw new Error(data.error || "Konfirmasi belum tersimpan.");
      setRsvpSaved(true);
      setRsvpStatus(attendance === "yes" ? `Terima kasih, ${name.trim()}. Kehadiran ${guests} orang sudah tercatat. Sampai bertemu di hari bahagia kami.` : `Terima kasih, ${name.trim()}. Konfirmasi Anda sudah tercatat. Doa restu Anda tetap sangat berarti bagi kami.`);
      if (!wishName) setWishName(name.trim());
    } catch (error) { setRsvpError(true); setRsvpStatus(error instanceof Error ? error.message : "Periksa koneksi internet dan coba lagi."); }
    finally { setRsvpBusy(false); }
  }

  async function submitWish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (wishBusy) return;
    setWishBusy(true); setWishStatus(""); setWishError(false);
    const website = new FormData(event.currentTarget).get("website");
    try {
      const response = await fetch("/api/wishes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: wishName, message, website }) });
      const data = await response.json() as { wish?: Wish; error?: string };
      if (!response.ok || !data.wish) throw new Error(data.error || "Ucapan belum tersimpan.");
      const wish = data.wish;
      setWishes((current) => [wish, ...current.filter((old) => old.id !== wish.id)]);
      setMessage(""); setWishStatus("Terima kasih. Ucapan dan doa Anda telah tersimpan.");
    } catch (error) { setWishError(true); setWishStatus(error instanceof Error ? error.message : "Periksa koneksi internet dan coba lagi."); }
    finally { setWishBusy(false); }
  }

  function openPhoto(index: number) { setLightbox(index); dialogRef.current?.showModal(); }

  return <>


    {phase !== "open" && <EnvelopeCover opening={phase === "opening"} guest={guest} onOpen={openInvitation} />}

    <div className="desktop-panel" aria-hidden="true"><VideoBackground {...motion.couple} enabled={motionReady} paused={motionPaused} minWidth={960} position="50% 28%" /><div className="desktop-copy"><p className="eyebrow">A NEW CHAPTER BEGINS</p><div className="desktop-monogram">S<span>&</span>D</div><Ornament light /><p className="desktop-names">Saka & Dinda</p><p>16 Januari 2027</p><span className="desktop-note">Satu janji. Satu langkah. Selamanya.</span></div></div>

    {phase !== "sealed" && <div className="invitation-scene"><VideoBackground {...motion.couple} enabled={motionReady} paused={motionPaused} eager position="50% 34%" /></div>}

    <main className={`invitation ${phase === "sealed" ? "is-sealed" : phase === "open" ? "is-open" : "is-opening"}`} inert={phase !== "open"} aria-hidden={phase !== "open"}>
      <section id="beranda" className="hero nav-section">
        <div className="hero-copy"><p className="eyebrow">THE WEDDING OF</p><h1 tabIndex={-1} ref={heroTitleRef} className="hero-names"><span>Saka</span><em>&</em><span>Dinda</span></h1><Ornament /><p className="hero-date">Sabtu, 16 Januari 2027</p><p className="hero-city">JAKARTA TIMUR</p></div>
        <a className="scroll-hint" href="#mempelai"><span>Sebuah awal untuk selamanya</span><ChevronDown size={22} strokeWidth={1.4} /><small>GULIR UNTUK MELIHAT UNDANGAN</small></a>
      </section>

      <section id="ayat" className="section verse-section">
        <p className="eyebrow">DALAM CINTA & RAHMAT-NYA</p><h2>Satu janji suci</h2><Ornament light />
        <p className="verse-arabic" lang="ar" dir="rtl">{marriageVerse.arabic}</p>
        <blockquote className="verse-translation"><p>“{marriageVerse.translationExcerpt}”</p><cite>Petikan terjemahan</cite></blockquote>
        <a className="verse-reference" href={marriageVerse.source} target="_blank" rel="noopener noreferrer">{marriageVerse.reference}</a>
      </section>

      <section id="mempelai" className="section couple-section">
        <p className="eyebrow">BISMILLAHIRRAHMANIRRAHIM</p><h2>Dengan doa & cinta</h2><Ornament />
        <p className="greeting">Assalamu’alaikum warahmatullahi wabarakatuh.</p>
        <p className="intro">Dengan memohon rahmat dan rida Allah SWT, kami mengundang Bapak/Ibu/Saudara/i untuk hadir dan memberikan doa restu dalam pernikahan kami.</p>
        <article className="couple-identity groom-identity">
          <img className="identity-photo groom-photo" src={wedding.groom.photo} alt="Potret Saka menghadap kamera dalam busana krem" width={1024} height={1536} loading="lazy" decoding="async" />
          <div className="identity-copy"><p className="identity-kicker">THE GROOM</p><p className="nickname">Saka</p><h3>{wedding.groom.name}</h3><p className="parent-label">Putra dari</p><p>Bapak {wedding.groom.father}<br />& Ibu {wedding.groom.mother}</p></div>
        </article>
        <span className="couple-and" aria-hidden="true">&</span>
        <article className="couple-identity bride-identity">
          <img className="identity-photo bride-photo" src={wedding.bride.photo} alt="Potret Dinda menghadap kamera dalam busana krem" width={1024} height={1536} loading="lazy" decoding="async" />
          <div className="identity-copy"><p className="identity-kicker">THE BRIDE</p><p className="nickname">Dinda</p><h3>{wedding.bride.name}</h3><p className="parent-label">Putri dari</p><p>Bapak {wedding.bride.father}<br />& Ibu {wedding.bride.mother}</p></div>
        </article>
        <p className="couple-prayer">Semoga Allah menyatukan kami dalam kebaikan, serta menjadikan rumah tangga kami penuh ketenteraman, cinta, dan kasih sayang.</p>
      </section>

      <section id="acara" className="section event-section nav-section">
        <p className="eyebrow">SAVE THE DATE</p><h2>Hari bahagia kami</h2><Ornament light />
        <div className="event-date"><span>SABTU</span><strong>16</strong><span>JANUARI<br /><b>2027</b></span></div>
        <p className="countdown-caption">Menghitung hari menuju janji suci</p><Countdown />
        <div className="event-list"><article><span className="event-number">01</span><div><h3>Akad Nikah</h3><p className="event-time">09.00 — 10.00 <small>WIB</small></p><p>Sabtu, 16 Januari 2027</p></div><Heart size={25} strokeWidth={1} aria-hidden="true" /></article><article><span className="event-number">02</span><div><h3>Resepsi</h3><p className="event-time">11.00 — 15.00 <small>WIB</small></p><p>Sabtu, 16 Januari 2027</p></div><Flower2 size={25} strokeWidth={1} aria-hidden="true" /></article></div>
        <div className="venue"><MapPin size={23} strokeWidth={1.4} aria-hidden="true" /><h3>{wedding.venue}</h3><p className="venue-search-note">(Search on maps)</p><p>{wedding.address}</p><a className="button cream-button" href={wedding.mapUrl} target="_blank" rel="noopener noreferrer"><MapPin size={16} /> Buka Google Maps</a><a className="calendar-link" href="/assets/saka-dinda-wedding.ics" download><CalendarDays size={15} /> Simpan ke kalender</a></div>
      </section>

      <section id="kisah" className="section story-section">
        <div className="section-content">
        <p className="eyebrow">OUR LOVE STORY</p><h2>Perjalanan kami</h2><Ornament />
        <p className="story-opening">Dari perkenalan sederhana, menuju satu janji untuk selamanya.</p>
        <div className="story-timeline">{loveStory.map((chapter, index) => <article key={chapter.date}><span>{String(index + 1).padStart(2, "0")}</span><div><p className="eyebrow">{chapter.date}</p><h3>{chapter.title}</h3><p>{chapter.text}</p></div></article>)}</div>
        </div>
      </section>

      <section id="galeri" className="section gallery-section">
        <p className="eyebrow">OUR MOMENTS</p><h2>Potret kebahagiaan</h2><Ornament />
        {gallery.length > 0 ? <>
          <div className="gallery-lead"><span className="gallery-side-note" aria-hidden="true">A MOMENT, A LIFETIME</span><button className="gallery-feature" type="button" onClick={() => openPhoto(0)} aria-label="Perbesar foto utama prewedding Saka dan Dinda"><img src={gallery[0].src} alt={gallery[0].alt} width={1365} height={2048} loading="lazy" decoding="async" /><span className="photo-expand" aria-hidden="true"><ImageIcon size={15} strokeWidth={1.4} /></span></button></div>
          <p className="gallery-hint">Sentuh foto untuk memperbesar</p>
          <div className="gallery-grid">{gallery.slice(1).map((photo, index) => <button key={photo.src} type="button" onClick={() => openPhoto(index + 1)} aria-label={`Perbesar foto ${index + 2}`}><img src={photo.src} alt={photo.alt} width={1365} height={2048} loading="lazy" decoding="async" /></button>)}</div>
        </> : <div className="gallery-awaiting"><div className="empty-photo-frame" aria-hidden="true"><ImageIcon size={30} strokeWidth={1} /><span>S & D</span></div><p>Momen indah kami akan hadir di sini.</p></div>}
      </section>

      <section id="rsvp" className="section rsvp-section nav-section">
        <p className="eyebrow">WITH YOUR PRESENCE</p><h2>Konfirmasi kehadiran</h2><Ornament /><p className="intro">Kehadiran serta doa restu Anda merupakan kebahagiaan bagi kami.</p>
        <form className="guest-form" onSubmit={submitRsvp}>
          <label htmlFor="rsvp-name">Nama Anda</label><input id="rsvp-name" name="name" autoComplete="name" minLength={2} maxLength={80} placeholder="Tuliskan nama lengkap Anda" value={name} onChange={(event) => setName(event.target.value)} required />
          <fieldset><legend>Apakah Anda akan hadir?</legend><div className="attendance-options"><label className={attendance === "yes" ? "chosen" : ""}><input type="radio" name="attendance" value="yes" checked={attendance === "yes"} onChange={() => setAttendance("yes")} /><Check size={18} strokeWidth={1.5} /><span>Ya, saya hadir</span></label><label className={attendance === "no" ? "chosen" : ""}><input type="radio" name="attendance" value="no" checked={attendance === "no"} onChange={() => setAttendance("no")} /><Heart size={18} strokeWidth={1.5} /><span>Maaf, berhalangan</span></label></div></fieldset>
          {attendance === "yes" && <><label htmlFor="rsvp-guests">Jumlah tamu, termasuk Anda</label><div className="select-wrap"><select id="rsvp-guests" name="guests" value={guests} onChange={(event) => setGuests(Number(event.target.value))}>{Array.from({ length: 10 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1} orang</option>)}</select><ChevronDown size={16} aria-hidden="true" /></div></>}
          <div className="honeypot" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
          <button className="button burgundy-button" type="submit" disabled={rsvpBusy}><ClipboardCheck size={17} />{rsvpBusy ? "Menyimpan…" : rsvpSaved ? "Perbarui konfirmasi" : "Kirim konfirmasi"}</button>
          {rsvpStatus && <p className={`form-status ${rsvpError ? "error" : "success"}`} role={rsvpError ? "alert" : "status"}>{rsvpStatus}</p>}
        </form>
      </section>

      <section id="ucapan" className="section wishes-section nav-section">
        <p className="eyebrow">WORDS FROM THE HEART</p><h2>Ucapan & doa</h2><Ornament /><p className="intro">Titipkan doa dan harapan baik untuk langkah baru kami.</p>
        <form className="guest-form" onSubmit={submitWish}>
          <label htmlFor="wish-name">Nama Anda</label><input id="wish-name" name="name" autoComplete="name" minLength={2} maxLength={80} placeholder="Nama Anda" value={wishName} onChange={(event) => setWishName(event.target.value)} required />
          <label htmlFor="wish-message">Ucapan untuk Saka & Dinda</label><textarea id="wish-message" name="message" rows={4} minLength={2} maxLength={600} placeholder="Tuliskan ucapan dan doa terbaik Anda…" value={message} onChange={(event) => setMessage(event.target.value)} required /><span className="character-count">{message.length}/600</span>
          <p className="public-note">Nama dan ucapan Anda akan tampil di buku ucapan.</p>
          <div className="honeypot" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
          <button type="submit" className="button burgundy-button" disabled={wishBusy}><MessageCircle size={17} />{wishBusy ? "Mengirim…" : "Kirim ucapan"}</button>
          {wishStatus && <p className={`form-status ${wishError ? "error" : "success"}`} role={wishError ? "alert" : "status"}>{wishStatus}</p>}
        </form>
        <div className="guestbook"><h3>Buku Ucapan <Heart size={16} strokeWidth={1.2} aria-hidden="true" /></h3>
          {wishes.length === 0 && !wishesLoading && !wishesLoadError && <p className="guestbook-empty">Belum ada ucapan.<br />Jadilah yang pertama mengirim doa untuk kami.</p>}
          {wishes.map((wish) => <article className="wish" key={wish.id}><div className="wish-avatar" aria-hidden="true">{wish.name.slice(0, 1).toUpperCase()}</div><div><h4>{wish.name}</h4><time dateTime={new Date(wish.createdAt).toISOString()}>{new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" }).format(new Date(wish.createdAt))}</time><p>{wish.message}</p></div></article>)}
          {wishesLoadError && <div className="load-error" role="alert"><p>{wishesLoadError}</p><button type="button" className="text-button" onClick={() => loadWishes(nextCursor ?? undefined)}>Coba lagi</button></div>}
          {wishesLoading && <p className="loading-text" role="status">Memuat ucapan…</p>}
          {!wishesLoading && !wishesLoadError && nextCursor !== null && <button type="button" className="text-button" onClick={() => loadWishes(nextCursor)}>Lihat ucapan lainnya <ArrowDown size={14} /></button>}
        </div>
      </section>

      <section id="hadiah" className="section gift-section nav-section">
        <p className="eyebrow">A TOKEN OF LOVE</p><h2>Tanda kasih</h2><Ornament light /><p className="intro">Doa restu Anda adalah hadiah terindah. Jika berkenan, tanda kasih dapat disampaikan melalui rekening berikut.</p>
        <div className="bank-cards">{giftAccounts.map((account) => <GiftAccountCard key={account.id} account={account} />)}</div>
        <p className="gift-thanks">Terima kasih untuk setiap doa dan tanda kasih.</p>
      </section>

      <footer className="section closing"><div className="section-content"><Flower2 size={32} strokeWidth={1} aria-hidden="true" /><h2>Terima kasih</h2><p>Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir untuk memberikan doa restu.</p><p className="closing-greeting">Wassalamu’alaikum warahmatullahi wabarakatuh.</p><Ornament light /><span className="eyebrow">DENGAN PENUH KEBAHAGIAAN</span><p className="closing-names">Saka & Dinda</p><span className="closing-date">16 . 01 . 2027</span><a href="#beranda" className="back-top" aria-label="Kembali ke awal undangan"><ArrowUp size={17} strokeWidth={1.5} /></a></div></footer>

      <WeddingMusic ref={audioRef} onPlaying={setMusicPlaying} onError={() => { setMusicError(true); setMusicPlaying(false); }} />
      <div className="music-controls"><button className="music-button motion-button" type="button" onClick={() => setMotionPaused((value) => !value)} aria-label={motionPaused ? "Putar latar video" : "Jeda latar video"} aria-pressed={!motionPaused} title={motionPaused ? "Putar video" : "Jeda video"}>{motionPaused ? <Play size={15} /> : <Pause size={15} />}</button><button className={musicPlaying ? "music-button playing" : "music-button"} type="button" onClick={toggleMusic} aria-label={musicPlaying ? "Matikan musik" : "Putar Beautiful in White"} aria-pressed={musicPlaying} title={musicPlaying ? "Matikan musik" : "Putar musik"}>{musicPlaying ? <Volume2 size={18} /> : <VolumeX size={18} />}</button>{musicError && <span role="status">Sentuh untuk memutar musik</span>}</div>
      <nav className="bottom-nav" aria-label="Navigasi undangan">{navItems.map(({ id, label, icon: Icon }) => <a key={id} href={`#${id}`} className={active === id ? "active" : ""} aria-current={active === id ? "location" : undefined}><Icon size={19} strokeWidth={1.5} /><span>{label}</span></a>)}</nav>
    </main>

    <dialog className="photo-dialog" aria-label="Galeri foto prewedding Saka dan Dinda" ref={dialogRef} onKeyDown={(event) => { if (gallery.length > 1 && (event.key === "ArrowLeft" || event.key === "ArrowRight")) { event.preventDefault(); setLightbox((current) => (current + (event.key === "ArrowRight" ? 1 : gallery.length - 1)) % gallery.length); } }} onClick={(event) => { if (event.target === event.currentTarget) dialogRef.current?.close(); }}>
      <button type="button" className="lightbox-close" onClick={() => dialogRef.current?.close()} aria-label="Tutup foto"><X size={23} /></button>
      {gallery[lightbox] && <img src={gallery[lightbox].src} alt={gallery[lightbox].alt} />}
      {gallery.length > 1 && <div className="lightbox-nav"><button type="button" onClick={() => setLightbox((lightbox + gallery.length - 1) % gallery.length)}>Sebelumnya</button><span>{lightbox + 1} / {gallery.length}</span><button type="button" onClick={() => setLightbox((lightbox + 1) % gallery.length)}>Berikutnya</button></div>}
    </dialog>
  </>;
}
