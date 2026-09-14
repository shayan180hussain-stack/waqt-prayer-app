import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  MapPin,
  Bell,
  BellOff,
  BookOpen,
  Moon,
  Sun,
  Sunrise,
  Sunset,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronRight,
  Loader2,
  Search,
  Heart,
  Plus,
  Trash2,
  X,
  Landmark,
  Navigation,
  Settings as SettingsIcon,
  Wifi,
} from "lucide-react";

const PALETTE = {
  night: "#10192E",
  nightDeep: "#0A1120",
  indigo: "#1E2E52",
  gold: "#C9A24B",
  goldSoft: "#E4C87A",
  cream: "#F3EEDF",
  slate: "#8C97AE",
  sage: "#5C8A7F",
  rose: "#B4694F",
};

const PRAYER_ORDER = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

// Optional fully-offline data source. Leave empty to use the network (with local
// caching after first load). To run with zero network calls, paste in verified
// Quran text here — e.g. exported from https://tanzil.net/download/ or the
// "quran-json" npm package — keyed by surah number:
// QURAN_DATA[1] = { ayahs: [{ number: 1, arabic: "...", english: "..." }, ...] }
const QURAN_DATA = {};

// Duas that ship with the app for every user — fixed, not user-editable.
// Add more entries here as they're provided.
const BUILT_IN_DUAS = [
  {
    id: "builtin-istikharah",
    title: "Istikharah",
    occasion: "After the Istikharah prayer",
    arabic: "",
    translation:
      "Allahumma innee astakheeruka bi ilmika wa-astaqdiruka biqudratika wa-as'aluka min fadhlika al-adheem. Fa innaka taqdiru walaa aqdiru. Wa ta'lamu walaa a'alamu wa anta allaamul ghuroob.\nAllahumma in kunta talamu anna haadhal-amr khayrun liy fiy deeniy wa-ma'aashiy wa'aaqibat amriy, faqdur hu liy wa- liy thumma baarik liy feehi. Wa in-kunta ta'lamu anna haadhal amr sharrun liy fiy deeniy wa-ma'aashiy wa-aaqibat amriy. Fa asrifhu annee wa-srifni anhu. Wa aqdur lial khayra haythu kaana thumma a-rdhiniy bihee.",
  },
  {
    id: "builtin-dua-of-yunus",
    title: "Dua to get what you want (Prophet Yunus's dua)",
    occasion: "Before making a dua for whatever you want",
    arabic: "",
    translation: "La Ilaha Illa Anta Subhanaka Inni kuntu Mina Zalimin",
  },
  {
    id: "builtin-dua-for-desire",
    title: "Dua for your desire",
    occasion: "Whenever you want something",
    arabic: "",
    translation:
      "Allāhumma innī as'aluka bi-annī ashhadu annaka antallāh, lā ilāha illā anta, al-aḥaduṣ-ṣamad, alladhī lam yalid wa lam yūlad, wa lam yakun lahū kufuwan aḥad",
  },
  {
    id: "builtin-dua-of-musa",
    title: "Prophet Musa's dua",
    occasion: "When you're in desperate need",
    arabic: "",
    translation: "Rabbi innee limaaa anzalta ilaiya min khairin faqeer",
  },
];

// Static metadata for all 114 surahs — bundled directly so the browse list
// always works even if the network call for it is blocked in this environment.
const SURAH_LIST = [
  [1, "Al-Fatihah", "The Opening", 7, "Meccan"],
  [2, "Al-Baqarah", "The Cow", 286, "Medinan"],
  [3, "Aal-E-Imran", "The Family of Imran", 200, "Medinan"],
  [4, "An-Nisa", "The Women", 176, "Medinan"],
  [5, "Al-Ma'idah", "The Table Spread", 120, "Medinan"],
  [6, "Al-An'am", "The Cattle", 165, "Meccan"],
  [7, "Al-A'raf", "The Heights", 206, "Meccan"],
  [8, "Al-Anfal", "The Spoils of War", 75, "Medinan"],
  [9, "At-Tawbah", "The Repentance", 129, "Medinan"],
  [10, "Yunus", "Jonah", 109, "Meccan"],
  [11, "Hud", "Hud", 123, "Meccan"],
  [12, "Yusuf", "Joseph", 111, "Meccan"],
  [13, "Ar-Ra'd", "The Thunder", 43, "Medinan"],
  [14, "Ibrahim", "Abraham", 52, "Meccan"],
  [15, "Al-Hijr", "The Rocky Tract", 99, "Meccan"],
  [16, "An-Nahl", "The Bee", 128, "Meccan"],
  [17, "Al-Isra", "The Night Journey", 111, "Meccan"],
  [18, "Al-Kahf", "The Cave", 110, "Meccan"],
  [19, "Maryam", "Mary", 98, "Meccan"],
  [20, "Taha", "Ta-Ha", 135, "Meccan"],
  [21, "Al-Anbiya", "The Prophets", 112, "Meccan"],
  [22, "Al-Hajj", "The Pilgrimage", 78, "Medinan"],
  [23, "Al-Mu'minun", "The Believers", 118, "Meccan"],
  [24, "An-Nur", "The Light", 64, "Medinan"],
  [25, "Al-Furqan", "The Criterion", 77, "Meccan"],
  [26, "Ash-Shu'ara", "The Poets", 227, "Meccan"],
  [27, "An-Naml", "The Ant", 93, "Meccan"],
  [28, "Al-Qasas", "The Stories", 88, "Meccan"],
  [29, "Al-Ankabut", "The Spider", 69, "Meccan"],
  [30, "Ar-Rum", "The Romans", 60, "Meccan"],
  [31, "Luqman", "Luqman", 34, "Meccan"],
  [32, "As-Sajdah", "The Prostration", 30, "Meccan"],
  [33, "Al-Ahzab", "The Combined Forces", 73, "Medinan"],
  [34, "Saba", "Sheba", 54, "Meccan"],
  [35, "Fatir", "Originator", 45, "Meccan"],
  [36, "Ya-Sin", "Ya Sin", 83, "Meccan"],
  [37, "As-Saffat", "Those who set the Ranks", 182, "Meccan"],
  [38, "Sad", "The Letter Sad", 88, "Meccan"],
  [39, "Az-Zumar", "The Troops", 75, "Meccan"],
  [40, "Ghafir", "The Forgiver", 85, "Meccan"],
  [41, "Fussilat", "Explained in Detail", 54, "Meccan"],
  [42, "Ash-Shuraa", "The Consultation", 53, "Meccan"],
  [43, "Az-Zukhruf", "The Ornaments of Gold", 89, "Meccan"],
  [44, "Ad-Dukhan", "The Smoke", 59, "Meccan"],
  [45, "Al-Jathiyah", "The Crouching", 37, "Meccan"],
  [46, "Al-Ahqaf", "The Wind-Curved Sandhills", 35, "Meccan"],
  [47, "Muhammad", "Muhammad", 38, "Medinan"],
  [48, "Al-Fath", "The Victory", 29, "Medinan"],
  [49, "Al-Hujurat", "The Rooms", 18, "Medinan"],
  [50, "Qaf", "The Letter Qaf", 45, "Meccan"],
  [51, "Adh-Dhariyat", "The Winnowing Winds", 60, "Meccan"],
  [52, "At-Tur", "The Mount", 49, "Meccan"],
  [53, "An-Najm", "The Star", 62, "Meccan"],
  [54, "Al-Qamar", "The Moon", 55, "Meccan"],
  [55, "Ar-Rahman", "The Beneficent", 78, "Medinan"],
  [56, "Al-Waqi'ah", "The Inevitable", 96, "Meccan"],
  [57, "Al-Hadid", "The Iron", 29, "Medinan"],
  [58, "Al-Mujadilah", "The Pleading Woman", 22, "Medinan"],
  [59, "Al-Hashr", "The Exile", 24, "Medinan"],
  [60, "Al-Mumtahanah", "She that is to be Examined", 13, "Medinan"],
  [61, "As-Saff", "The Ranks", 14, "Medinan"],
  [62, "Al-Jumu'ah", "The Congregation, Friday", 11, "Medinan"],
  [63, "Al-Munafiqun", "The Hypocrites", 11, "Medinan"],
  [64, "At-Taghabun", "The Mutual Disillusion", 18, "Medinan"],
  [65, "At-Talaq", "The Divorce", 12, "Medinan"],
  [66, "At-Tahrim", "The Prohibition", 12, "Medinan"],
  [67, "Al-Mulk", "The Sovereignty", 30, "Meccan"],
  [68, "Al-Qalam", "The Pen", 52, "Meccan"],
  [69, "Al-Haqqah", "The Reality", 52, "Meccan"],
  [70, "Al-Ma'arij", "The Ascending Stairways", 44, "Meccan"],
  [71, "Nuh", "Noah", 28, "Meccan"],
  [72, "Al-Jinn", "The Jinn", 28, "Meccan"],
  [73, "Al-Muzzammil", "The Enshrouded One", 20, "Meccan"],
  [74, "Al-Muddaththir", "The Cloaked One", 56, "Meccan"],
  [75, "Al-Qiyamah", "The Resurrection", 40, "Meccan"],
  [76, "Al-Insan", "Man", 31, "Medinan"],
  [77, "Al-Mursalat", "The Emissaries", 50, "Meccan"],
  [78, "An-Naba", "The Tidings", 40, "Meccan"],
  [79, "An-Nazi'at", "Those who drag forth", 46, "Meccan"],
  [80, "Abasa", "He Frowned", 42, "Meccan"],
  [81, "At-Takwir", "The Overthrowing", 29, "Meccan"],
  [82, "Al-Infitar", "The Cleaving", 19, "Meccan"],
  [83, "Al-Mutaffifin", "The Defrauding", 36, "Meccan"],
  [84, "Al-Inshiqaq", "The Splitting Open", 25, "Meccan"],
  [85, "Al-Buruj", "The Mansions of the Stars", 22, "Meccan"],
  [86, "At-Tariq", "The Morning Star", 17, "Meccan"],
  [87, "Al-A'la", "The Most High", 19, "Meccan"],
  [88, "Al-Ghashiyah", "The Overwhelming", 26, "Meccan"],
  [89, "Al-Fajr", "The Dawn", 30, "Meccan"],
  [90, "Al-Balad", "The City", 20, "Meccan"],
  [91, "Ash-Shams", "The Sun", 15, "Meccan"],
  [92, "Al-Layl", "The Night", 21, "Meccan"],
  [93, "Ad-Duhaa", "The Morning Hours", 11, "Meccan"],
  [94, "Ash-Sharh", "The Relief", 8, "Meccan"],
  [95, "At-Tin", "The Fig", 8, "Meccan"],
  [96, "Al-Alaq", "The Clot", 19, "Meccan"],
  [97, "Al-Qadr", "The Power", 5, "Meccan"],
  [98, "Al-Bayyinah", "The Clear Proof", 8, "Medinan"],
  [99, "Az-Zalzalah", "The Earthquake", 8, "Medinan"],
  [100, "Al-Adiyat", "The Courser", 11, "Meccan"],
  [101, "Al-Qari'ah", "The Calamity", 11, "Meccan"],
  [102, "At-Takathur", "The Rivalry in World Increase", 8, "Meccan"],
  [103, "Al-Asr", "The Declining Day", 3, "Meccan"],
  [104, "Al-Humazah", "The Traducer", 9, "Meccan"],
  [105, "Al-Fil", "The Elephant", 5, "Meccan"],
  [106, "Quraysh", "Quraysh", 4, "Meccan"],
  [107, "Al-Ma'un", "The Small Kindnesses", 7, "Meccan"],
  [108, "Al-Kawthar", "The Abundance", 3, "Meccan"],
  [109, "Al-Kafirun", "The Disbelievers", 6, "Meccan"],
  [110, "An-Nasr", "The Divine Support", 3, "Medinan"],
  [111, "Al-Masad", "The Palm Fiber", 5, "Meccan"],
  [112, "Al-Ikhlas", "The Sincerity", 4, "Meccan"],
  [113, "Al-Falaq", "The Daybreak", 5, "Meccan"],
  [114, "An-Nas", "Mankind", 6, "Meccan"],
].map(
  ([
    number,
    englishName,
    englishNameTranslation,
    numberOfAyahs,
    revelationType,
  ]) => ({
    number,
    englishName,
    englishNameTranslation,
    numberOfAyahs,
    revelationType,
  })
);

const PRAYER_INFO = {
  Fajr: {
    time: "Dawn, before sunrise",
    icon: Sunrise,
    note: "The prayer that opens the day, before the sky lightens. Traditionally prayed alone or in congregation, it marks the boundary between night and day.",
  },
  Dhuhr: {
    time: "Just after the sun passes its highest point",
    icon: Sun,
    note: "The midday prayer, usually the longest stretch of the working day. A pause at the point the sun begins to descend.",
  },
  Asr: {
    time: "Mid-afternoon",
    icon: Sun,
    note: "The afternoon prayer, as the light starts to turn golden. Falls in the middle of the day's second half.",
  },
  Maghrib: {
    time: "Just after sunset",
    icon: Sunset,
    note: "Prayed promptly as the sun disappears below the horizon — one of the shorter windows of the five.",
  },
  Isha: {
    time: "Night, after twilight fades",
    icon: Moon,
    note: "The final prayer of the day, once the last light is gone. Closes the day the way Fajr opened it.",
  },
};

function formatTime24to12(t) {
  if (!t) return "--:--";
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

function toMinutes(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function todayKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

export default function WaqtApp() {
  const [tab, setTab] = useState("home");

  // location + timings
  const [coords, setCoords] = useState(null);
  const [manualCity, setManualCity] = useState("");
  const [manualCountry, setManualCountry] = useState("");
  const [locLabel, setLocLabel] = useState("");
  const [locStatus, setLocStatus] = useState("idle"); // idle | loading | done | denied | error
  const [timings, setTimings] = useState(null);
  const [timingsDate, setTimingsDate] = useState(todayKey());
  const [timingsLoading, setTimingsLoading] = useState(false);
  const [expandedPrayer, setExpandedPrayer] = useState(null);

  // countdown
  const [now, setNow] = useState(new Date());

  // notifications
  const [notifPermission, setNotifPermission] = useState(
    typeof Notification !== "undefined"
      ? Notification.permission
      : "unsupported"
  );
  const notifiedRef = useRef(new Set());

  // tracker
  const [trackerDate, setTrackerDate] = useState(todayKey());
  const [trackerData, setTrackerData] = useState({});
  const [trackerLoading, setTrackerLoading] = useState(false);

  // quran
  const [surahList] = useState(SURAH_LIST);
  const [selectedSurah, setSelectedSurah] = useState(1);
  const [surahAyahs, setSurahAyahs] = useState(null);
  const [surahTextLoading, setSurahTextLoading] = useState(false);
  const [surahSearch, setSurahSearch] = useState("");

  // night calculator
  const [nightMode, setNightMode] = useState("auto"); // auto | manual
  const [manualMaghrib, setManualMaghrib] = useState("18:00");
  const [manualFajr, setManualFajr] = useState("05:00");

  // nearby mosques
  const [mosqueList, setMosqueList] = useState([]);
  const [mosqueLoading, setMosqueLoading] = useState(false);
  const [mosqueError, setMosqueError] = useState(null);

  // my mosque (manually entered iqamah times)
  const [myMosque, setMyMosque] = useState(null);
  const [showMosqueForm, setShowMosqueForm] = useState(false);
  const [mosqueFormName, setMosqueFormName] = useState("");
  const [mosqueFormMawaqit, setMosqueFormMawaqit] = useState("");
  const [mosqueFormTimes, setMosqueFormTimes] = useState({
    Fajr: "",
    Dhuhr: "",
    Asr: "",
    Maghrib: "",
    Isha: "",
  });

  // live Mawaqit sync (experimental)
  const [mawaqitLive, setMawaqitLive] = useState(null); // { adhan: {...}, iqama: {...} }
  const [mawaqitLoading, setMawaqitLoading] = useState(false);
  const [mawaqitError, setMawaqitError] = useState(null);

  // duas
  const [duaList, setDuaList] = useState([]);
  const [sharedDuaList, setSharedDuaList] = useState([]);
  const [duaView, setDuaView] = useState("included"); // included | mine | shared
  const [duaLoading, setDuaLoading] = useState(false);
  const [sharedDuaLoading, setSharedDuaLoading] = useState(false);
  const [showDuaForm, setShowDuaForm] = useState(false);
  const [newDuaShared, setNewDuaShared] = useState(false);
  const [newDuaTitle, setNewDuaTitle] = useState("");
  const [newDuaArabic, setNewDuaArabic] = useState("");
  const [newDuaTranslation, setNewDuaTranslation] = useState("");
  const [newDuaOccasion, setNewDuaOccasion] = useState("");

  // ---------- clock ----------
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // ---------- geolocation on mount ----------
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocStatus("error");
      return;
    }
    setLocStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setLocLabel("Your location");
        setLocStatus("done");
      },
      () => setLocStatus("denied"),
      { timeout: 8000 }
    );
  }, []);

  // ---------- fetch prayer timings ----------
  const fetchTimings = useCallback(async () => {
    setTimingsLoading(true);
    try {
      let url;
      if (coords) {
        url = `https://api.aladhan.com/v1/timings/${timingsDate}?latitude=${coords.lat}&longitude=${coords.lon}&method=2`;
      } else if (manualCity) {
        url = `https://api.aladhan.com/v1/timingsByCity/${timingsDate}?city=${encodeURIComponent(
          manualCity
        )}&country=${encodeURIComponent(manualCountry || "")}&method=2`;
      } else {
        setTimingsLoading(false);
        return;
      }
      const res = await fetch(url);
      const json = await res.json();
      if (json?.data?.timings) {
        setTimings(json.data.timings);
        if (json.data.meta?.timezone && !coords) {
          setLocLabel(
            `${manualCity}${manualCountry ? ", " + manualCountry : ""}`
          );
        }
      }
    } catch (e) {
      console.error("timings fetch failed", e);
    } finally {
      setTimingsLoading(false);
    }
  }, [coords, manualCity, manualCountry, timingsDate]);

  useEffect(() => {
    if (coords || manualCity) fetchTimings();
  }, [coords, manualCity, manualCountry, timingsDate, fetchTimings]);

  function useManualLocation() {
    if (!manualCity.trim()) return;
    setCoords(null);
    setLocStatus("done");
  }

  // ---------- next prayer / countdown ----------
  function getNextPrayer() {
    if (!timings) return null;
    const nowMin =
      now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
    for (const p of PRAYER_ORDER) {
      if (toMinutes(timings[p]) > nowMin) return p;
    }
    return PRAYER_ORDER[0]; // Fajr tomorrow
  }

  function getCountdown() {
    if (!timings) return "--:--:--";
    const next = getNextPrayer();
    const nowSec =
      now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    let targetSec = toMinutes(timings[next]) * 60;
    let diff = targetSec - nowSec;
    if (diff < 0) diff += 24 * 3600;
    const h = Math.floor(diff / 3600);
    const m = Math.floor((diff % 3600) / 60);
    const s = diff % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(
      2,
      "0"
    )}:${String(s).padStart(2, "0")}`;
  }

  const nextPrayer = getNextPrayer();

  // ---------- notifications ----------
  async function requestNotifications() {
    if (typeof Notification === "undefined") return;
    const perm = await Notification.requestPermission();
    setNotifPermission(perm);
  }

  useEffect(() => {
    if (notifPermission !== "granted" || !timings) return;
    const id = setInterval(() => {
      const nowStr = `${String(now.getHours()).padStart(2, "0")}:${String(
        now.getMinutes()
      ).padStart(2, "0")}`;
      PRAYER_ORDER.forEach((p) => {
        const key = `${todayKey()}-${p}`;
        if (timings[p] === nowStr && !notifiedRef.current.has(key)) {
          notifiedRef.current.add(key);
          new Notification(`${p} time`, {
            body: `It's time for ${p} — ${formatTime24to12(timings[p])}`,
          });
        }
      });
    }, 1000 * 20);
    return () => clearInterval(id);
  }, [notifPermission, timings, now]);

  // ---------- tracker persistence (localStorage) ----------
  useEffect(() => {
    try {
      const raw = localStorage.getItem(`tracker:${trackerDate}`);
      setTrackerData(raw ? JSON.parse(raw) : {});
    } catch {
      setTrackerData({});
    }
  }, [trackerDate]);

  function togglePrayed(prayer) {
    const updated = { ...trackerData, [prayer]: !trackerData[prayer] };
    setTrackerData(updated);
    try {
      localStorage.setItem(`tracker:${trackerDate}`, JSON.stringify(updated));
    } catch (e) {
      console.error("save failed", e);
    }
  }

  const prayedCount = PRAYER_ORDER.filter((p) => trackerData[p]).length;

  // ---------- duas ----------
  useEffect(() => {
    try {
      const raw = localStorage.getItem("duas");
      setDuaList(raw ? JSON.parse(raw) : []);
    } catch {
      setDuaList([]);
    }
    try {
      const raw = localStorage.getItem("duas-shared");
      setSharedDuaList(raw ? JSON.parse(raw) : []);
    } catch {
      setSharedDuaList([]);
    }
  }, []);

  function saveDuas(updated) {
    setDuaList(updated);
    try {
      localStorage.setItem("duas", JSON.stringify(updated));
    } catch (e) {
      console.error("save dua failed", e);
    }
  }

  function saveSharedDuas(updated) {
    setSharedDuaList(updated);
    try {
      localStorage.setItem("duas-shared", JSON.stringify(updated));
    } catch (e) {
      console.error("save shared dua failed", e);
    }
  }

  function addDua() {
    if (!newDuaTitle.trim()) return;
    const entry = {
      id: Date.now().toString(),
      title: newDuaTitle.trim(),
      occasion: newDuaOccasion.trim(),
      arabic: newDuaArabic.trim(),
      translation: newDuaTranslation.trim(),
    };
    if (newDuaShared) {
      saveSharedDuas([entry, ...sharedDuaList]);
    } else {
      saveDuas([entry, ...duaList]);
    }
    setNewDuaTitle("");
    setNewDuaOccasion("");
    setNewDuaArabic("");
    setNewDuaTranslation("");
    setNewDuaShared(false);
    setShowDuaForm(false);
  }

  function deleteDua(id) {
    saveDuas(duaList.filter((d) => d.id !== id));
  }

  function deleteSharedDua(id) {
    saveSharedDuas(sharedDuaList.filter((d) => d.id !== id));
  }

  // ---------- quran ----------
  const [surahError, setSurahError] = useState(null);

  const fetchSurahText = useCallback(async () => {
    setSurahTextLoading(true);
    setSurahAyahs(null);
    setSurahError(null);

    // 1. Bundled offline data, if provided
    if (QURAN_DATA[selectedSurah]?.ayahs?.length) {
      setSurahAyahs(QURAN_DATA[selectedSurah].ayahs);
      setSurahTextLoading(false);
      return;
    }

    // 2. Local cache from a previous successful load
    try {
      const cached = localStorage.getItem(`quran:${selectedSurah}`);
      if (cached) {
        setSurahAyahs(JSON.parse(cached));
        setSurahTextLoading(false);
        return;
      }
    } catch {
      // no cache yet — fall through to network
    }

    // 3. Network, as a last resort — then cache the result
    try {
      const res = await fetch(
        `https://api.alquran.cloud/v1/surah/${selectedSurah}/editions/quran-uthmani,en.sahih`
      );
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const json = await res.json();
      const arabic = json.data?.[0]?.ayahs || [];
      const english = json.data?.[1]?.ayahs || [];
      if (!arabic.length) throw new Error("Empty response");
      const merged = arabic.map((a, i) => ({
        number: a.numberInSurah,
        arabic: a.text,
        english: english[i]?.text || "",
      }));
      setSurahAyahs(merged);
      try {
        localStorage.setItem(`quran:${selectedSurah}`, JSON.stringify(merged));
      } catch {
        // caching is best-effort — not fatal if it fails
      }
    } catch (e) {
      console.error(e);
      setSurahError(e.message || "Couldn't load this surah's text");
    } finally {
      setSurahTextLoading(false);
    }
  }, [selectedSurah]);

  useEffect(() => {
    if (tab !== "quran") return;
    fetchSurahText();
  }, [selectedSurah, tab, fetchSurahText]);

  const filteredSurahs = surahList.filter(
    (s) =>
      s.englishName.toLowerCase().includes(surahSearch.toLowerCase()) ||
      String(s.number).includes(surahSearch)
  );

  // ---------- night calculator ----------
  function computeNight() {
    const maghribStr =
      nightMode === "auto" && timings ? timings.Maghrib : manualMaghrib;
    const fajrStr = nightMode === "auto" && timings ? timings.Fajr : manualFajr;
    if (!maghribStr || !fajrStr) return null;
    const maghribMin = toMinutes(maghribStr);
    let fajrMin = toMinutes(fajrStr);
    if (fajrMin <= maghribMin) fajrMin += 24 * 60;
    const totalMin = fajrMin - maghribMin;
    const third = totalMin / 3;
    const quarter = totalMin / 4;

    function addMin(base, mins) {
      let total = base + mins;
      total = total % (24 * 60);
      const h = Math.floor(total / 60);
      const m = Math.round(total % 60);
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    }

    return {
      totalHours: (totalMin / 60).toFixed(1),
      lastThirdStart: addMin(maghribMin, third * 2),
      midnight: addMin(maghribMin, totalMin / 2),
      lastQuarterStart: addMin(maghribMin, quarter * 3),
      firstThirdEnd: addMin(maghribMin, third),
    };
  }

  const nightResult = computeNight();

  // ---------- nearby mosques (OpenStreetMap Overpass API — free, no key) ----------
  function haversineKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  const fetchMosques = useCallback(async () => {
    if (!coords) return;
    setMosqueLoading(true);
    setMosqueError(null);
    try {
      const query = `[out:json][timeout:25];(node["amenity"="place_of_worship"]["religion"="muslim"](around:10000,${coords.lat},${coords.lon});way["amenity"="place_of_worship"]["religion"="muslim"](around:10000,${coords.lat},${coords.lon}););out center;`;
      const res = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        body: query,
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const json = await res.json();
      const results = (json.elements || [])
        .map((el) => {
          const lat = el.lat ?? el.center?.lat;
          const lon = el.lon ?? el.center?.lon;
          if (lat == null || lon == null) return null;
          return {
            id: el.id,
            name: el.tags?.name || "Unnamed mosque",
            address: [el.tags?.["addr:street"], el.tags?.["addr:city"]]
              .filter(Boolean)
              .join(", "),
            lat,
            lon,
            distance: haversineKm(coords.lat, coords.lon, lat, lon),
          };
        })
        .filter(Boolean)
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 20);
      setMosqueList(results);
    } catch (e) {
      console.error(e);
      setMosqueError(e.message || "Couldn't load nearby mosques");
    } finally {
      setMosqueLoading(false);
    }
  }, [coords]);

  useEffect(() => {
    if (
      tab === "mosques" &&
      coords &&
      mosqueList.length === 0 &&
      !mosqueLoading
    ) {
      fetchMosques();
    }
  }, [tab, coords, mosqueList.length, mosqueLoading, fetchMosques]);

  // ---------- my mosque (manual iqamah times, persisted) ----------
  useEffect(() => {
    try {
      const raw = localStorage.getItem("my-mosque");
      if (raw) setMyMosque(JSON.parse(raw));
    } catch {
      setMyMosque(null);
    }
  }, []);

  function openMosqueForm(prefillName) {
    setMosqueFormName(prefillName || myMosque?.name || "");
    setMosqueFormMawaqit(myMosque?.mawaqitSlug || "");
    setMosqueFormTimes(
      myMosque?.iqamah || {
        Fajr: "",
        Dhuhr: "",
        Asr: "",
        Maghrib: "",
        Isha: "",
      }
    );
    setShowMosqueForm(true);
  }

  function extractMawaqitSlug(input) {
    const trimmed = input.trim();
    const match = trimmed.match(/mawaqit\.net\/[a-z]{2}\/([^/?#]+)/i);
    return match ? match[1] : trimmed; // allow pasting just the slug too
  }

  function saveMyMosque() {
    if (!mosqueFormName.trim()) return;
    const entry = {
      name: mosqueFormName.trim(),
      iqamah: mosqueFormTimes,
      mawaqitSlug: mosqueFormMawaqit.trim()
        ? extractMawaqitSlug(mosqueFormMawaqit)
        : null,
    };
    setMyMosque(entry);
    try {
      localStorage.setItem("my-mosque", JSON.stringify(entry));
    } catch (e) {
      console.error("save mosque failed", e);
    }
    setShowMosqueForm(false);
    setMawaqitLive(null);
  }

  function clearMyMosque() {
    setMyMosque(null);
    setMawaqitLive(null);
    try {
      localStorage.removeItem("my-mosque");
    } catch (e) {
      console.error("clear mosque failed", e);
    }
  }

  // ---------- live Mawaqit sync (experimental — reads the mosque's public page) ----------
  const fetchMawaqitTimes = useCallback(async () => {
    if (!myMosque?.mawaqitSlug) return;
    setMawaqitLoading(true);
    setMawaqitError(null);
    const targetUrl = `https://mawaqit.net/en/${myMosque.mawaqitSlug}`;
    // Mawaqit's site blocks direct cross-origin requests from browsers (CORS),
    // so we route through a public proxy that fetches it server-side instead.
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(
      targetUrl
    )}`;
    try {
      const res = await fetch(proxyUrl);
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const html = await res.text();
      const match = html.match(/var\s+confData\s*=\s*(\{[\s\S]*?\});/);
      if (!match) throw new Error("Couldn't find prayer time data on the page");
      const conf = JSON.parse(match[1]);
      const adhanArr = conf.times || [];
      const iqamaArr =
        conf.iqamaCalendar?.[new Date().getMonth()]?.[
          new Date().getDate() - 1
        ] ||
        conf.iqama ||
        [];
      const order = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
      const adhan = {};
      const iqama = {};
      order.forEach((p, i) => {
        if (adhanArr[i]) adhan[p] = adhanArr[i];
        if (Array.isArray(iqamaArr) && iqamaArr[i]) iqama[p] = iqamaArr[i];
      });
      if (Object.keys(adhan).length === 0)
        throw new Error("Page format not recognized");
      setMawaqitLive({ adhan, iqama, name: conf.name || myMosque.name });
    } catch (e) {
      console.error(e);
      setMawaqitError(
        e.message ||
          "Couldn't read live times from Mawaqit, even through the proxy — the proxy service itself may be down or rate-limited."
      );
    } finally {
      setMawaqitLoading(false);
    }
  }, [myMosque]);

  useEffect(() => {
    if (myMosque?.mawaqitSlug && tab === "home") {
      fetchMawaqitTimes();
    }
  }, [myMosque, tab, fetchMawaqitTimes]);

  // ---------- UI helpers ----------
  const TabButton = ({ id, label, icon: Icon }) => (
    <button
      onClick={() => setTab(id)}
      className="flex flex-col items-center gap-1 px-3 py-2 flex-1"
      style={{ color: tab === id ? PALETTE.gold : PALETTE.slate }}
    >
      <Icon size={20} strokeWidth={tab === id ? 2.4 : 1.8} />
      <span className="text-xs" style={{ fontWeight: tab === id ? 600 : 400 }}>
        {label}
      </span>
    </button>
  );

  return (
    <div
      className="min-h-screen w-full flex flex-col"
      style={{
        background: `linear-gradient(180deg, ${PALETTE.nightDeep} 0%, ${PALETTE.night} 55%, ${PALETTE.indigo} 100%)`,
        fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
        color: PALETTE.cream,
      }}
    >
      {/* Header */}
      <div className="px-5 pt-6 pb-3 flex items-center justify-between">
        <div>
          <h1
            className="text-2xl tracking-tight"
            style={{
              fontFamily: "ui-serif, Georgia, 'Times New Roman', serif",
              color: PALETTE.cream,
            }}
          >
            Waqt
          </h1>
          <div
            className="flex items-center gap-1 text-xs mt-0.5"
            style={{ color: PALETTE.slate }}
          >
            <MapPin size={12} />
            <span>
              {locLabel ||
                (locStatus === "loading"
                  ? "Finding your location…"
                  : "Set your location")}
            </span>
          </div>
        </div>
        <button
          onClick={requestNotifications}
          className="p-2 rounded-full"
          style={{ background: "rgba(255,255,255,0.06)" }}
        >
          {notifPermission === "granted" ? (
            <Bell size={18} style={{ color: PALETTE.gold }} />
          ) : (
            <BellOff size={18} style={{ color: PALETTE.slate }} />
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-4">
        {/* -------- HOME -------- */}
        {tab === "home" && (
          <div className="flex flex-col gap-5">
            {/* location prompt if needed */}
            {locStatus !== "done" && !coords && (
              <div
                className="rounded-2xl p-4 flex flex-col gap-2"
                style={{ background: "rgba(255,255,255,0.05)" }}
              >
                <p className="text-sm" style={{ color: PALETTE.slate }}>
                  {locStatus === "denied" || locStatus === "error"
                    ? "Location access isn't available — enter your city instead."
                    : "Allow location access, or enter your city below."}
                </p>
                <div className="flex gap-2">
                  <input
                    value={manualCity}
                    onChange={(e) => setManualCity(e.target.value)}
                    placeholder="City"
                    className="flex-1 rounded-lg px-3 py-2 text-sm outline-none"
                    style={{
                      background: "rgba(255,255,255,0.08)",
                      color: PALETTE.cream,
                    }}
                  />
                  <input
                    value={manualCountry}
                    onChange={(e) => setManualCountry(e.target.value)}
                    placeholder="Country"
                    className="w-28 rounded-lg px-3 py-2 text-sm outline-none"
                    style={{
                      background: "rgba(255,255,255,0.08)",
                      color: PALETTE.cream,
                    }}
                  />
                </div>
                <button
                  onClick={useManualLocation}
                  className="self-start rounded-lg px-4 py-1.5 text-sm font-medium mt-1"
                  style={{ background: PALETTE.gold, color: PALETTE.nightDeep }}
                >
                  Use this location
                </button>
              </div>
            )}

            {/* countdown hero */}
            <div
              className="rounded-3xl p-6 flex flex-col items-center text-center"
              style={{
                background:
                  "linear-gradient(160deg, rgba(201,162,75,0.14), rgba(255,255,255,0.03))",
                border: `1px solid rgba(201,162,75,0.25)`,
              }}
            >
              <Moon size={26} style={{ color: PALETTE.gold }} />
              {timingsLoading || !timings ? (
                <div
                  className="flex items-center gap-2 mt-4"
                  style={{ color: PALETTE.slate }}
                >
                  <Loader2 className="animate-spin" size={16} />
                  <span className="text-sm">Loading prayer times…</span>
                </div>
              ) : (
                <>
                  <p className="text-sm mt-3" style={{ color: PALETTE.slate }}>
                    Next: {nextPrayer}
                  </p>
                  <p
                    className="text-4xl mt-1 tabular-nums"
                    style={{
                      fontFamily: "ui-serif, Georgia, serif",
                      color: PALETTE.cream,
                    }}
                  >
                    {getCountdown()}
                  </p>
                  <p className="text-xs mt-1" style={{ color: PALETTE.slate }}>
                    at {formatTime24to12(timings[nextPrayer])}
                  </p>
                </>
              )}
            </div>

            {/* date selector for viewing other days */}
            <div className="flex items-center justify-between">
              <h2 className="text-sm" style={{ color: PALETTE.slate }}>
                Prayer times
              </h2>
              <input
                type="date"
                value={timingsDate}
                onChange={(e) => setTimingsDate(e.target.value)}
                className="text-xs rounded-lg px-2 py-1 outline-none"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  color: PALETTE.cream,
                }}
              />
            </div>

            {/* prayer list */}
            <div className="flex flex-col gap-2">
              {PRAYER_ORDER.map((p) => {
                const Icon = PRAYER_INFO[p].icon;
                const isNext = p === nextPrayer && timingsDate === todayKey();
                const isExpanded = expandedPrayer === p;
                return (
                  <div
                    key={p}
                    className="rounded-2xl overflow-hidden"
                    style={{
                      background: isNext
                        ? "rgba(201,162,75,0.10)"
                        : "rgba(255,255,255,0.04)",
                      border: isNext
                        ? `1px solid rgba(201,162,75,0.35)`
                        : "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <button
                      onClick={() => setExpandedPrayer(isExpanded ? null : p)}
                      className="w-full flex items-center justify-between px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          size={18}
                          style={{
                            color: isNext ? PALETTE.gold : PALETTE.slate,
                          }}
                        />
                        <span className="text-sm font-medium">{p}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {(() => {
                          const liveVal =
                            mawaqitLive?.iqama?.[p] || mawaqitLive?.adhan?.[p];
                          const mosqueVal = liveVal || myMosque?.iqamah?.[p];
                          if (!mosqueVal) return null;
                          return (
                            <span
                              className="text-xs flex items-center gap-1"
                              style={{ color: PALETTE.sage }}
                            >
                              {liveVal && <Wifi size={10} />}
                              {myMosque.name}: {formatTime24to12(mosqueVal)}
                            </span>
                          );
                        })()}
                        <span
                          className="text-sm tabular-nums"
                          style={{ color: PALETTE.cream }}
                        >
                          {timings ? formatTime24to12(timings[p]) : "--:--"}
                        </span>
                        <ChevronDown
                          size={16}
                          style={{
                            color: PALETTE.slate,
                            transform: isExpanded ? "rotate(180deg)" : "none",
                            transition: "transform 0.15s",
                          }}
                        />
                      </div>
                    </button>
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-1">
                        <p
                          className="text-xs mb-1"
                          style={{ color: PALETTE.gold }}
                        >
                          {PRAYER_INFO[p].time}
                        </p>
                        <p
                          className="text-sm leading-relaxed"
                          style={{ color: PALETTE.slate }}
                        >
                          {PRAYER_INFO[p].note}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* tracker */}
            <div className="mt-2">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm" style={{ color: PALETTE.slate }}>
                  Today's tracker
                </h2>
                <span className="text-xs" style={{ color: PALETTE.gold }}>
                  {prayedCount}/5
                </span>
              </div>
              <div
                className="rounded-2xl p-3 flex flex-col gap-1"
                style={{ background: "rgba(255,255,255,0.04)" }}
              >
                {PRAYER_ORDER.map((p) => (
                  <button
                    key={p}
                    onClick={() => togglePrayed(p)}
                    disabled={trackerLoading}
                    className="flex items-center gap-3 px-2 py-2 rounded-xl"
                  >
                    {trackerData[p] ? (
                      <CheckCircle2 size={20} style={{ color: PALETTE.sage }} />
                    ) : (
                      <Circle size={20} style={{ color: PALETTE.slate }} />
                    )}
                    <span
                      className="text-sm"
                      style={{
                        color: trackerData[p] ? PALETTE.cream : PALETTE.slate,
                        textDecoration: trackerData[p]
                          ? "line-through"
                          : "none",
                      }}
                    >
                      {p}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* -------- QURAN -------- */}
        {tab === "quran" && (
          <div className="flex flex-col gap-4">
            <div
              className="flex items-center gap-2 rounded-xl px-3 py-2"
              style={{ background: "rgba(255,255,255,0.06)" }}
            >
              <Search size={14} style={{ color: PALETTE.slate }} />
              <input
                value={surahSearch}
                onChange={(e) => setSurahSearch(e.target.value)}
                placeholder="Search a surah"
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ color: PALETTE.cream }}
              />
            </div>

            <div
              className="rounded-2xl overflow-y-auto flex flex-col"
              style={{
                background: "rgba(255,255,255,0.04)",
                maxHeight: "40vh",
              }}
            >
              {filteredSurahs.map((s) => (
                <button
                  key={s.number}
                  onClick={() => setSelectedSurah(s.number)}
                  className="flex items-center justify-between px-4 py-2.5 text-left border-b last:border-b-0"
                  style={{
                    borderColor: "rgba(255,255,255,0.06)",
                    background:
                      selectedSurah === s.number
                        ? "rgba(201,162,75,0.14)"
                        : "transparent",
                  }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="text-xs w-6 shrink-0 text-center tabular-nums"
                      style={{
                        color:
                          selectedSurah === s.number
                            ? PALETTE.gold
                            : PALETTE.slate,
                      }}
                    >
                      {s.number}
                    </span>
                    <div className="min-w-0">
                      <p
                        className="text-sm truncate"
                        style={{
                          color: PALETTE.cream,
                          fontWeight: selectedSurah === s.number ? 600 : 400,
                        }}
                      >
                        {s.englishName}
                      </p>
                      <p
                        className="text-xs truncate"
                        style={{ color: PALETTE.slate }}
                      >
                        {s.englishNameTranslation} · {s.numberOfAyahs} ayahs ·{" "}
                        {s.revelationType}
                      </p>
                    </div>
                  </div>
                  <ChevronRight
                    size={14}
                    style={{
                      color:
                        selectedSurah === s.number
                          ? PALETTE.gold
                          : PALETTE.slate,
                    }}
                  />
                </button>
              ))}
              {filteredSurahs.length === 0 && (
                <p
                  className="text-sm text-center py-6"
                  style={{ color: PALETTE.slate }}
                >
                  No surah matches "{surahSearch}"
                </p>
              )}
            </div>

            <div
              className="rounded-2xl p-4"
              style={{ background: "rgba(255,255,255,0.04)" }}
            >
              {surahTextLoading ? (
                <div
                  className="flex items-center gap-2 py-8 justify-center"
                  style={{ color: PALETTE.slate }}
                >
                  <Loader2 className="animate-spin" size={16} /> Loading text…
                </div>
              ) : surahError ? (
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                  <p className="text-sm" style={{ color: PALETTE.cream }}>
                    Couldn't load this surah's text.
                  </p>
                  <p className="text-xs" style={{ color: PALETTE.slate }}>
                    {surahError} — the verse text loads live from an external
                    source, so this needs network access to api.alquran.cloud to
                    work.
                  </p>
                  <button
                    onClick={fetchSurahText}
                    className="mt-1 rounded-lg px-4 py-1.5 text-sm font-medium"
                    style={{
                      background: PALETTE.gold,
                      color: PALETTE.nightDeep,
                    }}
                  >
                    Try again
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-5 max-h-[55vh] overflow-y-auto pr-1">
                  {surahAyahs?.map((a) => (
                    <div key={a.number} className="flex flex-col gap-1.5">
                      <p
                        dir="rtl"
                        className="text-xl leading-loose"
                        style={{
                          fontFamily: "ui-serif, Georgia, serif",
                          color: PALETTE.cream,
                        }}
                      >
                        {a.arabic}{" "}
                        <span
                          className="text-xs align-middle"
                          style={{ color: PALETTE.gold }}
                        >
                          ﴿{a.number}﴾
                        </span>
                      </p>
                      <p
                        className="text-sm leading-relaxed"
                        style={{ color: PALETTE.slate }}
                      >
                        {a.english}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* -------- NIGHT CALCULATOR -------- */}
        {tab === "night" && (
          <div className="flex flex-col gap-5">
            <div>
              <h2
                className="text-lg"
                style={{ fontFamily: "ui-serif, Georgia, serif" }}
              >
                Last third of the night
              </h2>
              <p className="text-sm mt-1" style={{ color: PALETTE.slate }}>
                Splits the time between Maghrib and Fajr into thirds and
                quarters.
              </p>
            </div>

            <div
              className="flex rounded-xl overflow-hidden"
              style={{ background: "rgba(255,255,255,0.06)" }}
            >
              <button
                onClick={() => setNightMode("auto")}
                className="flex-1 py-2 text-sm"
                style={{
                  background:
                    nightMode === "auto" ? PALETTE.gold : "transparent",
                  color:
                    nightMode === "auto" ? PALETTE.nightDeep : PALETTE.slate,
                }}
              >
                Use today's times
              </button>
              <button
                onClick={() => setNightMode("manual")}
                className="flex-1 py-2 text-sm"
                style={{
                  background:
                    nightMode === "manual" ? PALETTE.gold : "transparent",
                  color:
                    nightMode === "manual" ? PALETTE.nightDeep : PALETTE.slate,
                }}
              >
                Enter manually
              </button>
            </div>

            {nightMode === "manual" && (
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs" style={{ color: PALETTE.slate }}>
                    Maghrib
                  </label>
                  <input
                    type="time"
                    value={manualMaghrib}
                    onChange={(e) => setManualMaghrib(e.target.value)}
                    className="w-full mt-1 rounded-lg px-3 py-2 text-sm outline-none"
                    style={{
                      background: "rgba(255,255,255,0.08)",
                      color: PALETTE.cream,
                    }}
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs" style={{ color: PALETTE.slate }}>
                    Fajr
                  </label>
                  <input
                    type="time"
                    value={manualFajr}
                    onChange={(e) => setManualFajr(e.target.value)}
                    className="w-full mt-1 rounded-lg px-3 py-2 text-sm outline-none"
                    style={{
                      background: "rgba(255,255,255,0.08)",
                      color: PALETTE.cream,
                    }}
                  />
                </div>
              </div>
            )}

            {nightResult ? (
              <div className="flex flex-col gap-3 mt-1">
                <div
                  className="rounded-2xl p-4"
                  style={{
                    background:
                      "linear-gradient(160deg, rgba(201,162,75,0.14), rgba(255,255,255,0.03))",
                    border: "1px solid rgba(201,162,75,0.3)",
                  }}
                >
                  <p className="text-xs" style={{ color: PALETTE.gold }}>
                    Last third begins
                  </p>
                  <p
                    className="text-3xl mt-1"
                    style={{ fontFamily: "ui-serif, Georgia, serif" }}
                  >
                    {formatTime24to12(nightResult.lastThirdStart)}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    className="rounded-xl p-3"
                    style={{ background: "rgba(255,255,255,0.04)" }}
                  >
                    <p className="text-xs" style={{ color: PALETTE.slate }}>
                      Islamic midnight
                    </p>
                    <p className="text-lg mt-1">
                      {formatTime24to12(nightResult.midnight)}
                    </p>
                  </div>
                  <div
                    className="rounded-xl p-3"
                    style={{ background: "rgba(255,255,255,0.04)" }}
                  >
                    <p className="text-xs" style={{ color: PALETTE.slate }}>
                      Last quarter begins
                    </p>
                    <p className="text-lg mt-1">
                      {formatTime24to12(nightResult.lastQuarterStart)}
                    </p>
                  </div>
                  <div
                    className="rounded-xl p-3"
                    style={{ background: "rgba(255,255,255,0.04)" }}
                  >
                    <p className="text-xs" style={{ color: PALETTE.slate }}>
                      First third ends
                    </p>
                    <p className="text-lg mt-1">
                      {formatTime24to12(nightResult.firstThirdEnd)}
                    </p>
                  </div>
                  <div
                    className="rounded-xl p-3"
                    style={{ background: "rgba(255,255,255,0.04)" }}
                  >
                    <p className="text-xs" style={{ color: PALETTE.slate }}>
                      Night length
                    </p>
                    <p className="text-lg mt-1">{nightResult.totalHours} hrs</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm" style={{ color: PALETTE.slate }}>
                Set a location on the Home tab, or enter times manually above.
              </p>
            )}
          </div>
        )}

        {/* -------- DUA -------- */}
        {tab === "dua" && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h2
                  className="text-lg"
                  style={{ fontFamily: "ui-serif, Georgia, serif" }}
                >
                  Duas
                </h2>
                <p className="text-sm mt-1" style={{ color: PALETTE.slate }}>
                  {duaView === "included"
                    ? "Included with the app for everyone."
                    : duaView === "mine"
                    ? "A personal collection — only visible to you."
                    : "Shared with everyone who opens this app."}
                </p>
              </div>
              {!showDuaForm && duaView !== "included" && (
                <button
                  onClick={() => setShowDuaForm(true)}
                  className="p-2 rounded-full shrink-0"
                  style={{ background: PALETTE.gold, color: PALETTE.nightDeep }}
                >
                  <Plus size={18} />
                </button>
              )}
            </div>

            <div
              className="flex rounded-xl overflow-hidden"
              style={{ background: "rgba(255,255,255,0.06)" }}
            >
              <button
                onClick={() => setDuaView("included")}
                className="flex-1 py-2 text-xs"
                style={{
                  background:
                    duaView === "included" ? PALETTE.gold : "transparent",
                  color:
                    duaView === "included" ? PALETTE.nightDeep : PALETTE.slate,
                }}
              >
                Included
              </button>
              <button
                onClick={() => setDuaView("mine")}
                className="flex-1 py-2 text-xs"
                style={{
                  background: duaView === "mine" ? PALETTE.gold : "transparent",
                  color: duaView === "mine" ? PALETTE.nightDeep : PALETTE.slate,
                }}
              >
                My duas
              </button>
              <button
                onClick={() => setDuaView("shared")}
                className="flex-1 py-2 text-xs"
                style={{
                  background:
                    duaView === "shared" ? PALETTE.gold : "transparent",
                  color:
                    duaView === "shared" ? PALETTE.nightDeep : PALETTE.slate,
                }}
              >
                Shared by everyone
              </button>
            </div>

            {showDuaForm && (
              <div
                className="rounded-2xl p-4 flex flex-col gap-3"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(201,162,75,0.25)",
                }}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">New dua</p>
                  <button onClick={() => setShowDuaForm(false)}>
                    <X size={16} style={{ color: PALETTE.slate }} />
                  </button>
                </div>
                <input
                  value={newDuaTitle}
                  onChange={(e) => setNewDuaTitle(e.target.value)}
                  placeholder="Title (e.g. Before eating)"
                  className="rounded-lg px-3 py-2 text-sm outline-none"
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    color: PALETTE.cream,
                  }}
                />
                <input
                  value={newDuaOccasion}
                  onChange={(e) => setNewDuaOccasion(e.target.value)}
                  placeholder="When to say it (optional)"
                  className="rounded-lg px-3 py-2 text-sm outline-none"
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    color: PALETTE.cream,
                  }}
                />
                <textarea
                  dir="rtl"
                  value={newDuaArabic}
                  onChange={(e) => setNewDuaArabic(e.target.value)}
                  placeholder="Arabic text (optional)"
                  rows={2}
                  className="rounded-lg px-3 py-2 text-lg leading-loose outline-none resize-none"
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    color: PALETTE.cream,
                    fontFamily: "ui-serif, Georgia, serif",
                  }}
                />
                <textarea
                  value={newDuaTranslation}
                  onChange={(e) => setNewDuaTranslation(e.target.value)}
                  placeholder="Translation or meaning (optional)"
                  rows={2}
                  className="rounded-lg px-3 py-2 text-sm outline-none resize-none"
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    color: PALETTE.cream,
                  }}
                />
                <button
                  onClick={() => setNewDuaShared(!newDuaShared)}
                  className="flex items-center gap-2 self-start"
                >
                  {newDuaShared ? (
                    <CheckCircle2 size={18} style={{ color: PALETTE.sage }} />
                  ) : (
                    <Circle size={18} style={{ color: PALETTE.slate }} />
                  )}
                  <span className="text-sm" style={{ color: PALETTE.cream }}>
                    Share with everyone who uses this app
                  </span>
                </button>
                {newDuaShared && (
                  <p className="text-xs -mt-2" style={{ color: PALETTE.gold }}>
                    This will be visible to every user, not just you.
                  </p>
                )}
                <button
                  onClick={addDua}
                  disabled={!newDuaTitle.trim()}
                  className="self-start rounded-lg px-4 py-1.5 text-sm font-medium"
                  style={{
                    background: newDuaTitle.trim()
                      ? PALETTE.gold
                      : "rgba(255,255,255,0.1)",
                    color: newDuaTitle.trim()
                      ? PALETTE.nightDeep
                      : PALETTE.slate,
                  }}
                >
                  Save dua
                </button>
              </div>
            )}

            {(() => {
              const activeList =
                duaView === "included"
                  ? BUILT_IN_DUAS
                  : duaView === "mine"
                  ? duaList
                  : sharedDuaList;
              const activeLoading =
                duaView === "mine"
                  ? duaLoading
                  : duaView === "shared"
                  ? sharedDuaLoading
                  : false;
              const onDelete =
                duaView === "mine"
                  ? deleteDua
                  : duaView === "shared"
                  ? deleteSharedDua
                  : null;
              if (activeLoading) {
                return (
                  <div
                    className="flex items-center gap-2 py-8 justify-center"
                    style={{ color: PALETTE.slate }}
                  >
                    <Loader2 className="animate-spin" size={16} /> Loading…
                  </div>
                );
              }
              if (activeList.length === 0 && !showDuaForm) {
                return (
                  <div
                    className="rounded-2xl p-6 flex flex-col items-center text-center gap-2"
                    style={{ background: "rgba(255,255,255,0.03)" }}
                  >
                    <Heart size={22} style={{ color: PALETTE.slate }} />
                    <p className="text-sm" style={{ color: PALETTE.slate }}>
                      {duaView === "mine"
                        ? "No duas saved yet. Tap + to add your first one."
                        : duaView === "shared"
                        ? 'No shared duas yet. Tap + and check "Share with everyone" to add one.'
                        : "None included yet."}
                    </p>
                  </div>
                );
              }
              return (
                <div className="flex flex-col gap-3">
                  {activeList.map((d) => (
                    <div
                      key={d.id}
                      className="rounded-2xl p-4"
                      style={{ background: "rgba(255,255,255,0.04)" }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium">{d.title}</p>
                          {d.occasion && (
                            <p
                              className="text-xs mt-0.5"
                              style={{ color: PALETTE.gold }}
                            >
                              {d.occasion}
                            </p>
                          )}
                        </div>
                        {onDelete && (
                          <button
                            onClick={() => onDelete(d.id)}
                            className="shrink-0 p-1"
                          >
                            <Trash2
                              size={15}
                              style={{ color: PALETTE.slate }}
                            />
                          </button>
                        )}
                      </div>
                      {d.arabic && (
                        <p
                          dir="rtl"
                          className="text-lg leading-loose mt-3"
                          style={{
                            fontFamily: "ui-serif, Georgia, serif",
                            color: PALETTE.cream,
                          }}
                        >
                          {d.arabic}
                        </p>
                      )}
                      {d.translation && (
                        <p
                          className="text-sm leading-relaxed mt-2 whitespace-pre-line"
                          style={{ color: PALETTE.slate }}
                        >
                          {d.translation}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {/* -------- MOSQUES -------- */}
        {tab === "mosques" && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h2
                  className="text-lg"
                  style={{ fontFamily: "ui-serif, Georgia, serif" }}
                >
                  Nearby mosques
                </h2>
                <p className="text-sm mt-1" style={{ color: PALETTE.slate }}>
                  Found using OpenStreetMap — distances are approximate.
                </p>
              </div>
              <button
                onClick={() => openMosqueForm()}
                className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  color: PALETTE.cream,
                }}
              >
                Enter manually
              </button>
            </div>

            {myMosque && !showMosqueForm && (
              <div
                className="rounded-2xl p-4"
                style={{
                  background: "rgba(92,138,127,0.12)",
                  border: "1px solid rgba(92,138,127,0.3)",
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">
                      My mosque: {myMosque.name}
                    </p>
                    {myMosque.mawaqitSlug && (
                      <span
                        className="flex items-center gap-1 text-xs"
                        style={{
                          color: mawaqitError ? PALETTE.rose : PALETTE.gold,
                        }}
                      >
                        <Wifi size={12} />
                        {mawaqitLoading
                          ? "syncing…"
                          : mawaqitError
                          ? "sync failed"
                          : "live"}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openMosqueForm(myMosque.name)}
                      className="text-xs"
                      style={{ color: PALETTE.gold }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={clearMyMosque}
                      className="text-xs"
                      style={{ color: PALETTE.slate }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-5 gap-1 mt-2">
                  {PRAYER_ORDER.map((p) => {
                    const liveVal =
                      mawaqitLive?.iqama?.[p] || mawaqitLive?.adhan?.[p];
                    const val = liveVal || myMosque.iqamah?.[p];
                    return (
                      <div key={p} className="text-center">
                        <p
                          className="text-[10px]"
                          style={{ color: PALETTE.slate }}
                        >
                          {p}
                        </p>
                        <p
                          className="text-xs mt-0.5"
                          style={{ color: PALETTE.cream }}
                        >
                          {val ? formatTime24to12(val) : "—"}
                        </p>
                      </div>
                    );
                  })}
                </div>
                {myMosque.mawaqitSlug && mawaqitError && (
                  <div className="mt-3 flex flex-col gap-1.5">
                    <p className="text-xs" style={{ color: PALETTE.slate }}>
                      {mawaqitError}
                    </p>
                    <button
                      onClick={fetchMawaqitTimes}
                      className="self-start text-xs rounded-lg px-3 py-1"
                      style={{
                        background: "rgba(255,255,255,0.08)",
                        color: PALETTE.gold,
                      }}
                    >
                      Try syncing again
                    </button>
                  </div>
                )}
              </div>
            )}

            {showMosqueForm && (
              <div
                className="rounded-2xl p-4 flex flex-col gap-3"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(201,162,75,0.25)",
                }}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">
                    My mosque's iqamah times
                  </p>
                  <button onClick={() => setShowMosqueForm(false)}>
                    <X size={16} style={{ color: PALETTE.slate }} />
                  </button>
                </div>
                <input
                  value={mosqueFormName}
                  onChange={(e) => setMosqueFormName(e.target.value)}
                  placeholder="Mosque name"
                  className="rounded-lg px-3 py-2 text-sm outline-none"
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    color: PALETTE.cream,
                  }}
                />
                <div>
                  <input
                    value={mosqueFormMawaqit}
                    onChange={(e) => setMosqueFormMawaqit(e.target.value)}
                    placeholder="Mawaqit link (optional, for live times)"
                    className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                    style={{
                      background: "rgba(255,255,255,0.08)",
                      color: PALETTE.cream,
                    }}
                  />
                  <p className="text-xs mt-1" style={{ color: PALETTE.gold }}>
                    Experimental — if this mosque uses mawaqit.net, paste its
                    page link here to try pulling live times instead of typing
                    them below.
                  </p>
                </div>
                <p className="text-xs" style={{ color: PALETTE.slate }}>
                  Enter the iqamah (congregation) time for each prayer, if you
                  know it. Leave blank to skip.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {PRAYER_ORDER.map((p) => (
                    <div key={p}>
                      <label
                        className="text-xs"
                        style={{ color: PALETTE.slate }}
                      >
                        {p}
                      </label>
                      <input
                        type="time"
                        value={mosqueFormTimes[p]}
                        onChange={(e) =>
                          setMosqueFormTimes({
                            ...mosqueFormTimes,
                            [p]: e.target.value,
                          })
                        }
                        className="w-full mt-1 rounded-lg px-3 py-2 text-sm outline-none"
                        style={{
                          background: "rgba(255,255,255,0.08)",
                          color: PALETTE.cream,
                        }}
                      />
                    </div>
                  ))}
                </div>
                <button
                  onClick={saveMyMosque}
                  disabled={!mosqueFormName.trim()}
                  className="self-start rounded-lg px-4 py-1.5 text-sm font-medium"
                  style={{
                    background: mosqueFormName.trim()
                      ? PALETTE.gold
                      : "rgba(255,255,255,0.1)",
                    color: mosqueFormName.trim()
                      ? PALETTE.nightDeep
                      : PALETTE.slate,
                  }}
                >
                  Save
                </button>
              </div>
            )}

            {!coords ? (
              <div
                className="rounded-2xl p-6 flex flex-col items-center text-center gap-2"
                style={{ background: "rgba(255,255,255,0.03)" }}
              >
                <Landmark size={22} style={{ color: PALETTE.slate }} />
                <p className="text-sm" style={{ color: PALETTE.slate }}>
                  This needs your location. Set it on the Home tab, then come
                  back here.
                </p>
              </div>
            ) : mosqueLoading ? (
              <div
                className="flex items-center gap-2 py-8 justify-center"
                style={{ color: PALETTE.slate }}
              >
                <Loader2 className="animate-spin" size={16} /> Searching nearby…
              </div>
            ) : mosqueError ? (
              <div
                className="rounded-2xl p-4 flex flex-col items-center gap-2 text-center"
                style={{
                  background: "rgba(180,105,79,0.12)",
                  border: "1px solid rgba(180,105,79,0.3)",
                }}
              >
                <p className="text-sm" style={{ color: PALETTE.cream }}>
                  Couldn't load nearby mosques.
                </p>
                <p className="text-xs" style={{ color: PALETTE.slate }}>
                  {mosqueError}
                </p>
                <button
                  onClick={fetchMosques}
                  className="mt-1 rounded-lg px-4 py-1.5 text-sm font-medium"
                  style={{ background: PALETTE.gold, color: PALETTE.nightDeep }}
                >
                  Try again
                </button>
              </div>
            ) : mosqueList.length === 0 ? (
              <div
                className="rounded-2xl p-6 flex flex-col items-center text-center gap-2"
                style={{ background: "rgba(255,255,255,0.03)" }}
              >
                <Landmark size={22} style={{ color: PALETTE.slate }} />
                <p className="text-sm" style={{ color: PALETTE.slate }}>
                  No mosques found nearby in the map data. Try again later, or
                  check a wider area on a map app.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {mosqueList.map((m) => (
                  <div
                    key={m.id}
                    className="rounded-2xl p-4 flex items-center justify-between gap-3"
                    style={{ background: "rgba(255,255,255,0.04)" }}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{m.name}</p>
                      {m.address && (
                        <p
                          className="text-xs truncate mt-0.5"
                          style={{ color: PALETTE.slate }}
                        >
                          {m.address}
                        </p>
                      )}
                      <p
                        className="text-xs mt-0.5"
                        style={{ color: PALETTE.gold }}
                      >
                        {m.distance.toFixed(1)} km away
                      </p>
                    </div>
                    <div className="shrink-0 flex flex-col gap-2 items-end">
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${m.lat},${m.lon}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center gap-1 rounded-xl px-3 py-2"
                        style={{ background: "rgba(201,162,75,0.14)" }}
                      >
                        <Navigation size={16} style={{ color: PALETTE.gold }} />
                        <span
                          className="text-xs"
                          style={{ color: PALETTE.gold }}
                        >
                          Directions
                        </span>
                      </a>
                      <button
                        onClick={() => openMosqueForm(m.name)}
                        className="text-xs rounded-lg px-2 py-1"
                        style={{
                          background:
                            myMosque?.name === m.name
                              ? "rgba(92,138,127,0.25)"
                              : "rgba(255,255,255,0.06)",
                          color:
                            myMosque?.name === m.name
                              ? PALETTE.sage
                              : PALETTE.slate,
                        }}
                      >
                        {myMosque?.name === m.name
                          ? "My mosque ✓"
                          : "Set as my mosque"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* -------- SETTINGS -------- */}
        {tab === "settings" && (
          <div className="flex flex-col gap-5">
            <div>
              <h2
                className="text-lg"
                style={{ fontFamily: "ui-serif, Georgia, serif" }}
              >
                Settings
              </h2>
            </div>

            <div
              className="rounded-2xl p-4 flex flex-col gap-3"
              style={{ background: "rgba(255,255,255,0.04)" }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm">Notifications</p>
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: PALETTE.slate }}
                  >
                    {notifPermission === "granted"
                      ? "You'll be alerted when this tab is open at prayer time."
                      : notifPermission === "denied"
                      ? "Blocked — enable in your browser settings."
                      : "Off — allow notifications to get alerts."}
                  </p>
                </div>
                <button
                  onClick={requestNotifications}
                  disabled={notifPermission === "granted"}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium shrink-0"
                  style={{
                    background:
                      notifPermission === "granted"
                        ? "rgba(92,138,127,0.25)"
                        : PALETTE.gold,
                    color:
                      notifPermission === "granted"
                        ? PALETTE.sage
                        : PALETTE.nightDeep,
                  }}
                >
                  {notifPermission === "granted" ? "Enabled" : "Enable"}
                </button>
              </div>
            </div>

            <div
              className="rounded-2xl p-4 flex flex-col gap-3"
              style={{ background: "rgba(255,255,255,0.04)" }}
            >
              <p className="text-sm">Location</p>
              <p className="text-xs" style={{ color: PALETTE.slate }}>
                Currently: {locLabel || "not set"}
              </p>
              <div className="flex gap-2">
                <input
                  value={manualCity}
                  onChange={(e) => setManualCity(e.target.value)}
                  placeholder="City"
                  className="flex-1 rounded-lg px-3 py-2 text-sm outline-none"
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    color: PALETTE.cream,
                  }}
                />
                <input
                  value={manualCountry}
                  onChange={(e) => setManualCountry(e.target.value)}
                  placeholder="Country"
                  className="w-28 rounded-lg px-3 py-2 text-sm outline-none"
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    color: PALETTE.cream,
                  }}
                />
              </div>
              <button
                onClick={useManualLocation}
                className="self-start rounded-lg px-4 py-1.5 text-sm font-medium"
                style={{ background: PALETTE.gold, color: PALETTE.nightDeep }}
              >
                Update location
              </button>
            </div>

            <p
              className="text-xs leading-relaxed"
              style={{ color: PALETTE.slate }}
            >
              Prayer times use the Muslim World League calculation method.
              Adjust for your local mosque's timetable if it differs.
            </p>
          </div>
        )}
      </div>

      {/* Bottom tab bar */}
      <div
        className="flex items-stretch border-t"
        style={{
          borderColor: "rgba(255,255,255,0.08)",
          background: "rgba(10,17,32,0.85)",
        }}
      >
        <TabButton id="home" label="Home" icon={Sun} />
        <TabButton id="quran" label="Qur'an" icon={BookOpen} />
        <TabButton id="dua" label="Dua" icon={Heart} />
        <TabButton id="mosques" label="Mosques" icon={Landmark} />
        <TabButton id="night" label="Night" icon={Moon} />
        <TabButton id="settings" label="Settings" icon={SettingsIcon} />
      </div>
    </div>
  );
}
