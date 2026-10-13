import type { CSSProperties } from "react";

// Original botanical linework: repeated on the four folded panels so it moves
// with the paper. The illuminated paths share the exact embossed geometry.
const vines = [
  "M160 202C115 198 101 161 80 142C46 110 47 61 23 36M80 142C70 185 89 213 62 247C35 281 63 321 20 361M80 142C99 116 123 103 130 65M62 247C91 264 117 254 135 283",
  "M52 105C23 109 10 89 15 67C34 69 53 82 52 105ZM52 105Q30 92 15 67M76 133C53 118 55 92 75 79C91 100 92 120 76 133ZM76 133Q75 105 75 79",
  "M79 172C108 174 122 151 116 132C94 136 80 150 79 172ZM79 172Q101 150 116 132M80 197C49 195 35 175 43 153C64 158 79 173 80 197ZM80 197Q56 175 43 153",
  "M61 244C35 231 20 213 29 192C52 195 65 220 61 244ZM61 244Q45 213 29 192M54 281C82 289 100 279 106 257C81 252 62 263 54 281ZM54 281Q81 267 106 257",
  "M49 320C19 309 12 289 20 274C42 277 54 299 49 320ZM49 320Q30 299 20 274M109 103C99 84 109 63 130 65C132 83 122 100 109 103ZM109 103Q121 84 130 65",
  "M121 273C139 252 152 256 153 272C144 285 133 284 121 273ZM121 273Q139 270 153 272",
  "M24 40C16 26 18 11 29 3C41 18 38 31 24 40ZM24 40Q29 23 29 3M20 361C37 353 47 361 45 378C27 382 17 376 20 361ZM20 361Q31 366 45 378",
];

const petal = "M0 0C-7-6-14-17-8-23C-2-31 9-29 10-20C11-12 5-4 0 0Z";
const blossoms = [{ x: 51, y: 123, scale: 1 }, { x: 86, y: 222, scale: 1.1 }, { x: 39, y: 307, scale: .8 }];

function EnvelopeMotif() {
  return <svg className="envelope-art" viewBox="0 0 420 840" preserveAspectRatio="none" aria-hidden="true">
    {[false, true].map((mirror) => <g key={String(mirror)} transform={mirror ? "translate(408 213) scale(-1 1)" : "translate(12 213)"}>
      {vines.map((d, index) => <g key={d} style={{ "--trace-delay": `${index * .075}s` } as CSSProperties}>
        <path className="emboss-shadow" d={d} transform="translate(1 1.3)" />
        <path className="emboss-gold" d={d} />
        <path className="motif-light" d={d} pathLength={100} />
      </g>)}
      {blossoms.map(({ x, y, scale }, flower) => <g key={y} transform={`translate(${x} ${y}) scale(${scale})`}>
        {Array.from({ length: 8 }, (_, petalIndex) => <g key={petalIndex} transform={`rotate(${petalIndex * 45})`} style={{ "--trace-delay": `${.2 + flower * .2 + petalIndex * .025}s` } as CSSProperties}>
          <path className="emboss-shadow" d={petal} transform="translate(1 1.3)" />
          <path className="emboss-gold flower-petal" d={petal} />

        </g>)}
        <circle className="emboss-gold" r="4" />
      </g>)}
    </g>)}
    <path className="envelope-seam" d="M0 0L210 437L420 0M0 840L210 403L420 840" />
    <path className="seam-light" d="M0 0L210 437L420 0M0 840L210 403L420 840" pathLength={100} />
  </svg>;
}

export default function EnvelopeCover({ opening, guest, onOpen }: { opening: boolean; guest: string; onOpen: () => void }) {
  return <div className={`envelope-stage ${opening ? "opening" : "sealed"}`}>
    <div className="envelope-shell">
      <div className="envelope-folds" aria-hidden="true">
        {["left", "right", "bottom", "top"].map((side) => <div className={`flap flap-${side}`} key={side} />)}
      </div>
      <div className="envelope-decoration"><EnvelopeMotif /></div>
      <div className="envelope-glow" aria-hidden="true" />
      <div className="envelope-heading"><p className="eyebrow">THE WEDDING OF</p><p className="cover-names">Saka <span>&</span> Dinda</p><p className="cover-date">16 . 01 . 2027</p></div>
      <button type="button" className="seal-button" onClick={onOpen} disabled={opening} aria-label="Buka undangan pernikahan Saka dan Dinda">
        <span className="wax-seal"><span className="wax-rim"><span className="seal-initials">S<span>&</span>D</span><span className="seal-laurel" aria-hidden="true">❦</span></span></span>
        <span className="open-label">{opening ? "Dengan penuh cinta…" : "Buka undangan"}</span>
      </button>
      <div className="envelope-recipient"><p>Kepada Yth. Bapak/Ibu/Saudara/i</p><strong>{guest}</strong><small>Dengan hormat, kami mengundang Anda.</small></div>
    </div>
    <p className="opening-status" role="status">{opening ? "Membuka undangan Saka dan Dinda…" : ""}</p>
  </div>;
}
