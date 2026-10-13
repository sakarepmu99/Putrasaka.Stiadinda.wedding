// Names, event details, photographs, and story supplied by the couple.
export const wedding = {
  groom: { nickname: "Saka", name: "Novian Putrasaka Nugraha", father: "Sarwono", mother: "Karmila", photo: "/assets/prewed/saka-front.webp" },
  bride: { nickname: "Dinda", name: "Stia Dinda Ayu Paradillah", father: "Tugiman", mother: "Pasis Susilawati", photo: "/assets/prewed/dinda-front.webp" },
  date: "2027-01-16T09:00:00+07:00",
  dateLabel: "Sabtu, 16 Januari 2027",
  venue: "Stia Family House",
  address: "Jl. Rawa Bebek No. 32, RT.7/RW.1, Pulo Gebang, Kec. Cakung, Kota Jakarta Timur, Daerah Khusus Ibukota Jakarta 13950",
  mapUrl: "https://maps.app.goo.gl/JTwRN1PnkpE6XVRE8",
};

// Full Arabic verse; the brief Indonesian quotation is explicitly an excerpt.
// Checked against the Ministry of Religious Affairs text (see README).
export const marriageVerse = {
  reference: "QS. Ar-Rum · 30:21",
  arabic: "وَمِنْ اٰيٰتِهٖٓ اَنْ خَلَقَ لَكُمْ مِّنْ اَنْفُسِكُمْ اَزْوَاجًا لِّتَسْكُنُوْٓا اِلَيْهَا وَجَعَلَ بَيْنَكُمْ مَّوَدَّةً وَّرَحْمَةً ۗاِنَّ فِيْ ذٰلِكَ لَاٰيٰتٍ لِّقَوْمٍ يَّتَفَكَّرُوْنَ",
  translationExcerpt: "Dia menjadikan di antaramu rasa cinta dan kasih sayang.",
  source: "https://quran.kemenag.go.id/quran/per-ayat/surah/30?from=21&to=21",
};

export const giftAccounts = [
  { id: "saka", bank: "BCA", account: "5221760817", beneficiary: "Novian Putrasaka Nugraha" },
  { id: "dinda", bank: "BCA", account: "6241124620", beneficiary: "Stia Dinda Ayu Paradillah" },
];

export const motion = {
  couple: { src: "/assets/motion/our-moments.mp4?v=selected-20261011", poster: "/assets/motion/our-moments-poster.webp?v=selected-20261011" },
  groom: { src: "/assets/motion/saka.mp4?v=selected-20261011", poster: "/assets/motion/saka-poster.webp?v=selected-20261011" },
  bride: { src: "/assets/motion/dinda.mp4?v=selected-20261011", poster: "/assets/motion/dinda-poster.webp?v=selected-20261011" },
};

export const gallery: { src: string; alt: string; position?: string }[] = [
  { src: "/assets/prewed/bersandar.webp", alt: "Dinda bersandar di bahu Saka dalam busana krem dengan cahaya spotlight", position: "50% 58%" },
  { src: "/assets/prewed/busana-adat.webp", alt: "Saka dan Dinda berdampingan dalam busana adat dengan aksen burgundy", position: "50% 60%" },
  { src: "/assets/prewed/senyum-adat.webp", alt: "Saka dan Dinda tertawa bersama saat duduk dalam busana adat", position: "50% 100%" },
  { src: "/assets/prewed/berdua-krem.webp", alt: "Saka dan Dinda berdiri berdekatan dalam busana krem", position: "50% 100%" },
  { src: "/assets/prewed/tawa-berdua.webp", alt: "Saka dan Dinda saling menatap sambil tertawa di studio", position: "50% 100%" },
  { src: "/assets/prewed/menari.webp", alt: "Saka menggenggam tangan Dinda dalam pose menari di bawah cahaya bundar", position: "50% 90%" },
  { src: "/assets/prewed/momen-playful.webp", alt: "Saka dan Dinda tersenyum dalam pose bersandar yang ceria", position: "50% 90%" },
];
export const loveStory: { title: string; date: string; text: string }[] = [
  {
    date: "2024",
    title: "Awal pertemuan",
    text: "Perjalanan kami bermula dari perkenalan di tempat kerja di Cikarang. Di antara kesibukan sehari-hari, percakapan sederhana menjadi awal bagi kami untuk saling mengenal. Dari sebuah pertemuan yang biasa, perlahan tumbuh cerita yang berarti.",
  },
  {
    date: "2025",
    title: "Semakin dekat",
    text: "Seiring waktu, kami semakin dekat dan mulai mengenal satu sama lain lebih dalam. Hubungan ini kami jalani dengan niat yang baik, hingga kami mulai saling memperkenalkan keluarga. Langkah sederhana itu membawa kami menuju hubungan yang semakin serius.",
  },
  {
    date: "2026",
    title: "Menuju janji suci",
    text: "Kami mulai menyusun rencana pernikahan dan mempersiapkan langkah untuk membangun kehidupan bersama. Dengan memohon doa serta restu keluarga, kami menantikan hari ketika perjalanan ini menjadi awal dari rumah tangga kami—satu langkah, satu janji, untuk selamanya.",
  },
];
