import React, { useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BadgeDollarSign,
  Barcode,
  BookOpen,
  Camera,
  CalendarDays,
  ChevronLeft,
  CheckCircle2,
  ClipboardList,
  Edit3,
  Fan,
  Filter,
  Grape,
  History,
  LayoutGrid,
  MapPinned,
  Moon,
  Phone,
  Plus,
  Save,
  Search,
  ShoppingBag,
  Sparkles,
  Star,
  Sun,
  Thermometer,
  Trash2,
  Wine,
  X,
} from "lucide-react";
import seedWines from "./data/wines.json";
import "./styles.css";

const BRAND_NAME = "Lynn Cave Privée";
const PHOTO_BASE = "/photos/";
const WINE_STORAGE_KEY = "lynn-cellar-wines";
const ARCHIVE_STORAGE_KEY = "lynn-cellar-archive";
const WISHLIST_STORAGE_KEY = "lynn-cellar-wishlist";
const VENDOR_STORAGE_KEY = "lynn-cellar-vendors";
const MAINTENANCE_STORAGE_KEY = "lynn-cellar-maintenance";
const EVENT_STORAGE_KEY = "lynn-cellar-events";

const CELLAR_MODEL = {
  maker: "Allavino",
  model: "VSW5134D-2PR",
  name: "Reserva Series Panel-Ready Dual Zone",
  dimensions: '23.4" W x 23" D x 33.9" H',
  upperRange: "41°F - 61°F",
  lowerRange: "45°F - 64°F",
  maxBottleDiameter: '3 3/4"',
  note: "Two zones must be set at least 4°F apart.",
};

const COOLER_LAYOUT = {
  top: [
    { shelf: 1, capacity: 9 },
    { shelf: 2, capacity: 9 },
    { shelf: 3, capacity: 9 },
  ],
  bottom: [
    { shelf: 4, capacity: 9 },
    { shelf: 5, capacity: 9 },
    { shelf: 6, capacity: 6, label: "Bottom shelf" },
  ],
};

const CELLAR_CAPACITY = [...COOLER_LAYOUT.top, ...COOLER_LAYOUT.bottom].reduce((sum, shelf) => sum + shelf.capacity, 0);
const ZONE_CAPACITY = {
  top: COOLER_LAYOUT.top.reduce((sum, shelf) => sum + shelf.capacity, 0),
  bottom: COOLER_LAYOUT.bottom.reduce((sum, shelf) => sum + shelf.capacity, 0),
};
const TOP_ZONE_CATEGORIES = ["White", "Sparkling", "Dessert", "Rose", "Rosé", "Rosé"];

const fallbackNotes = {
  Cabernet: "Dark fruit, cassis, cedar, and polished tannin with a structured finish.",
  Bordeaux: "Blackcurrant, plum, graphite, dried herbs, and savory earth.",
  Chardonnay: "Pear, apple, citrus curd, and a lightly creamy texture.",
  Nebbiolo: "Rose petal, cherry, tea leaf, and firm mineral tannin.",
  Pinot: "Red cherry, raspberry, baking spice, and a silky finish.",
  Sangiovese: "Sour cherry, leather, dried herbs, and bright acidity.",
  White: "Citrus, orchard fruit, mineral lift, and a crisp finish.",
};

const services = [
  ["Cellar Planning", "Layout, bottle capacity, climate logic, display flow, and storage rules."],
  ["Collection Organization", "Inventory structure, value tracking, drink windows, acquisition notes, and bottle history."],
  ["Private Hosting Readiness", "Dinner pairings, gifting candidates, drink-soon lists, and service-ready access."],
  ["Estate-Level Oversight", "Vendor notes, maintenance records, household integration, and long-term review."],
];

const operatingTiles = [
  ["Inventory", "Search, sort, and edit the bottles already entered.", "collection", "inventory"],
  ["Wishlist", "Track future buys, allocations, and special requests.", "tools", "wishlist"],
  ["Producer Notes", "Keep estate, vineyard, and allocation context with each bottle.", "tools", "producers"],
  ["Bottle Value", "Watch total value and price bands.", "tools", "value"],
  ["Drink Window", "See what should move to the front of the cellar.", "tools", "drink"],
  ["Vendor Contacts", "Save purchase sources and contact notes.", "tools", "vendors"],
  ["Maintenance", "Track filter, cleaning, and temperature checks.", "tools", "maintenance"],
  ["Events / Pairings", "Plan dinners, gifts, and hosting bottles.", "tools", "events"],
];

const regionSignals = [
  ["California", "CA", "state"],
  ["Oregon", "OR", "state"],
  ["Washington", "WA", "state"],
  ["Arizona", "AZ", "state"],
  ["New York", "NY", "state"],
  ["Bordeaux", "FR", "France"],
  ["Burgundy", "FR", "France"],
  ["Loire", "FR", "France"],
  ["Piedmont", "IT", "Italy"],
  ["Tuscany", "IT", "Italy"],
  ["Veneto", "IT", "Italy"],
  ["Australia", "AU", "Australia"],
];

const regionPresets = [
  { label: "Napa Valley, California", country: "United States", code: "CA" },
  { label: "Sonoma County, California", country: "United States", code: "CA" },
  { label: "Paso Robles, California", country: "United States", code: "CA" },
  { label: "Santa Lucia Highlands, California", country: "United States", code: "CA" },
  { label: "Willamette Valley, Oregon", country: "United States", code: "OR" },
  { label: "Arizona", country: "United States", code: "AZ" },
  { label: "Bordeaux", country: "France", code: "FR" },
  { label: "Burgundy", country: "France", code: "FR" },
  { label: "Loire Valley", country: "France", code: "FR" },
  { label: "Piedmont", country: "Italy", code: "IT" },
  { label: "Tuscany", country: "Italy", code: "IT" },
  { label: "Veneto", country: "Italy", code: "IT" },
  { label: "Western Australia", country: "Australia", code: "AU" },
];

const defaultWishlist = [
  { id: 1, name: "Everyday white refresh", region: "Loire Valley", target: "$25-$45", priority: "High", note: "Crisp dinner whites for the upper-left rotation." },
  { id: 2, name: "Special dinner red", region: "Napa Valley, California", target: "$80-$140", priority: "Medium", note: "Cabernet or Bordeaux blend for holiday meals." },
];

const defaultVendors = [
  { id: 1, name: "Fine Wine Cellars", contact: "Reference links", specialty: "Italy and cellar-worthy reds", note: "Several inventory source URLs point here." },
  { id: 2, name: "Champion Wine Cellars", contact: "Reference links", specialty: "Piedmont / Nebbiolo", note: "Use for producer and vintage checks." },
];

const defaultMaintenance = [
  { id: 1, task: "Verify upper and lower zone temperatures", cadence: "Weekly", status: "Due", note: `${CELLAR_MODEL.upperRange} upper, ${CELLAR_MODEL.lowerRange} lower.` },
  { id: 2, task: "Clean vents and inspect door seals", cadence: "Monthly", status: "Scheduled", note: "Check both Allavino units." },
  { id: 3, task: "Review shelf placement after new buys", cadence: "As needed", status: "Active", note: "Keep price sort and top/bottom zone rules intact." },
];

const defaultEvents = [
  { id: 1, name: "Steak dinner candidates", date: "Next dinner", pairing: "Cabernet / Bordeaux", note: "Pull structured reds from the right lower zone." },
  { id: 2, name: "Seafood or patio whites", date: "Warm-weather hosting", pairing: "Sancerre / Chardonnay", note: "Use upper-zone whites with earlier drink windows." },
];

const defaultFilters = {
  text: "",
  category: "All",
  country: "All",
  region: "All",
  badge: "All",
  minVintage: "",
  maxVintage: "",
  minPrice: "",
  maxPrice: "",
  sort: "location",
};

function money(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: Number(value || 0) % 1 ? 2 : 0,
  }).format(Number(value || 0));
}

function normalizeWine(wine) {
  const estimatedPrice = Number(wine.estimatedPrice ?? wine.averagePrice ?? 0);
  const rating = Number(wine.rating || wine.personalRating || 0);
  const tasting = typeof wine.tastingNotes === "object" && wine.tastingNotes
    ? wine.tastingNotes
    : { appearance: "", nose: "", palate: typeof wine.tastingNotes === "string" ? wine.tastingNotes : "", finish: "" };

  return {
    status: "Ready",
    size: "750ml",
    dateAdded: "2026-05-01",
    acquiredNotes: "",
    tags: [],
    criticRatings: [],
    quantity: 1,
    ...wine,
    quantity: Math.max(0, Number(wine.quantity || 1)),
    estimatedPrice,
    averagePrice: Number(wine.averagePrice ?? estimatedPrice),
    rating: Number.isFinite(rating) ? rating : 0,
    tastingNotes: tasting,
  };
}

function inferNotes(wine) {
  const tasting = wine.tastingNotes || {};
  if (typeof tasting === "string" && tasting) return tasting;
  if (tasting.palate || tasting.nose || tasting.finish) {
    return [tasting.appearance, tasting.nose, tasting.palate, tasting.finish].filter(Boolean).join(" ");
  }
  const haystack = `${wine.variety} ${wine.wineName} ${wine.category}`;
  const key = Object.keys(fallbackNotes).find((item) => haystack.includes(item));
  return fallbackNotes[key] || "Balanced fruit, savory detail, and a finish suited to the wine's style and region.";
}

function inferDrinkWindow(wine) {
  if (wine.drinkWindow) return wine.drinkWindow;
  if (!wine.vintage) return "Drink now";
  const price = averagePrice(wine);
  if (price >= 100) return `${wine.vintage + 5}-${wine.vintage + 18}`;
  if (wine.category === "Red") return `${wine.vintage + 2}-${wine.vintage + 8}`;
  if (wine.category === "White") return `${wine.vintage}-${wine.vintage + 4}`;
  return `${wine.vintage + 1}-${wine.vintage + 7}`;
}

function cellarForWine(wine) {
  return averagePrice(wine) < 50 ? 1 : 2;
}

function zoneForWine(wine) {
  return TOP_ZONE_CATEGORIES.includes(wine.category) ? "top" : "bottom";
}

function averagePrice(wine) {
  return Number(wine.averagePrice ?? wine.estimatedPrice ?? 0);
}

function placementSort(a, b) {
  return (
    averagePrice(a) - averagePrice(b) ||
    String(a.producer || "").localeCompare(String(b.producer || "")) ||
    String(a.wineName || "").localeCompare(String(b.wineName || "")) ||
    Number(a.vintage || 0) - Number(b.vintage || 0) ||
    Number(a.id || 0) - Number(b.id || 0)
  );
}

function applyCellarPlacement(wines) {
  const grouped = new Map();

  for (const rawWine of wines) {
    const wine = normalizeWine(rawWine);
    const cellar = cellarForWine(wine);
    const zone = zoneForWine(wine);
    const key = `${cellar}-${zone}`;
    grouped.set(key, [...(grouped.get(key) || []), { ...wine, cellar, zone }]);
  }

  return Array.from(grouped.values())
    .flatMap((group) =>
      group
        .sort(placementSort)
        .map((wine, index) => ({
          ...wine,
          slot: index + 1,
        })),
    )
    .sort((a, b) => Number(a.id || 0) - Number(b.id || 0));
}

function loadWines() {
  const saved = localStorage.getItem(WINE_STORAGE_KEY);
  if (!saved) return applyCellarPlacement(seedWines);
  const savedWines = JSON.parse(saved).map(normalizeWine);
  const savedById = new Map(savedWines.map((wine) => [wine.id, wine]));
  const mergedSeed = seedWines.map((wine) => normalizeWine({ ...wine, ...(savedById.get(wine.id) || {}) }));
  const customWines = savedWines.filter((wine) => !seedWines.some((seed) => seed.id === wine.id));
  return applyCellarPlacement([...mergedSeed, ...customWines]);
}

function loadArchive() {
  const saved = localStorage.getItem(ARCHIVE_STORAGE_KEY);
  return saved ? JSON.parse(saved) : [];
}

function loadStoredList(key, fallback) {
  const saved = localStorage.getItem(key);
  return saved ? JSON.parse(saved) : fallback;
}

function saveWines(wines) {
  localStorage.setItem(WINE_STORAGE_KEY, JSON.stringify(applyCellarPlacement(wines)));
}

function saveArchive(archive) {
  localStorage.setItem(ARCHIVE_STORAGE_KEY, JSON.stringify(archive));
}

function saveStoredList(key, list) {
  localStorage.setItem(key, JSON.stringify(list));
}

function zoneLabel(zone) {
  return zone === "top" ? "Upper zone" : "Lower zone";
}

function getSlotMeta(zone, slot) {
  let remaining = slot;
  for (const shelf of COOLER_LAYOUT[zone]) {
    if (remaining <= shelf.capacity) {
      return { shelf: shelf.shelf, position: remaining, capacity: shelf.capacity, label: shelf.label || `Shelf ${shelf.shelf}` };
    }
    remaining -= shelf.capacity;
  }
  return { shelf: null, position: slot, capacity: ZONE_CAPACITY[zone], label: "Overflow" };
}

function suggestPlacement(wines, draft) {
  const previewWine = normalizeWine({
    id: Number.MAX_SAFE_INTEGER,
    producer: draft.producer || "Unknown producer",
    wineName: draft.wineName || "Unidentified bottle",
    vintage: draft.vintage ? Number(draft.vintage) : null,
    estimatedPrice: Number(draft.estimatedPrice || draft.averagePrice || 0),
    averagePrice: Number(draft.averagePrice || draft.estimatedPrice || 0),
    category: draft.category || "Red",
  });
  const placed = applyCellarPlacement([...wines, previewWine]);
  return placed.find((wine) => wine.id === Number.MAX_SAFE_INTEGER);
}

function wineTitle(wine) {
  return `${wine.vintage || "NV"} ${wine.producer} ${wine.wineName}`.trim();
}

function photoUrl(photo) {
  return photo ? `${PHOTO_BASE}${photo}` : "";
}

function regionName(wine) {
  return String(wine.region || "Region pending").split(",").at(-1).trim() || wine.region || "Region pending";
}

function regionSignal(region, items = []) {
  const haystack = `${region} ${items.map((wine) => `${wine.region} ${wine.country}`).join(" ")}`;
  const match = regionSignals.find(([needle]) => haystack.includes(needle));
  if (match) return { code: match[1], label: match[2] === "state" ? `${match[0]} state` : match[2] };
  return { code: String(region || "?").slice(0, 2).toUpperCase(), label: "Wine region" };
}

function wineSearchText(wine) {
  const tasting = typeof wine.tastingNotes === "object" && wine.tastingNotes ? Object.values(wine.tastingNotes).join(" ") : "";
  return [
    wineTitle(wine),
    wine.region,
    wine.country,
    wine.variety,
    wine.category,
    wine.notes,
    wine.acquiredNotes,
    tasting,
    ...(wine.tags || []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function filterWines(wines, filters) {
  return wines
    .filter((wine) => {
      const textMatch = !filters.text || wineSearchText(wine).includes(filters.text.toLowerCase());
      const categoryMatch = filters.category === "All" || wine.category === filters.category;
      const countryMatch = filters.country === "All" || wine.country === filters.country;
      const regionMatch = filters.region === "All" || wine.region === filters.region || regionName(wine) === filters.region;
      const badgeMatch = filters.badge === "All" || regionSignal(regionName(wine), [wine]).code === filters.badge;
      const vintage = Number(wine.vintage || 0);
      const price = averagePrice(wine);
      const minVintage = filters.minVintage ? Number(filters.minVintage) : -Infinity;
      const maxVintage = filters.maxVintage ? Number(filters.maxVintage) : Infinity;
      const minPrice = filters.minPrice ? Number(filters.minPrice) : -Infinity;
      const maxPrice = filters.maxPrice ? Number(filters.maxPrice) : Infinity;
      return textMatch && categoryMatch && countryMatch && regionMatch && badgeMatch && vintage >= minVintage && vintage <= maxVintage && price >= minPrice && price <= maxPrice;
    })
    .sort((a, b) => {
      if (filters.sort === "name") return wineTitle(a).localeCompare(wineTitle(b));
      if (filters.sort === "vintage") return Number(a.vintage || 0) - Number(b.vintage || 0);
      if (filters.sort === "price") return averagePrice(a) - averagePrice(b);
      if (filters.sort === "date") return String(a.dateAdded || "").localeCompare(String(b.dateAdded || ""));
      return a.cellar - b.cellar || String(a.zone).localeCompare(String(b.zone)) || a.slot - b.slot;
    });
}

function buildWineOverview(wine) {
  const price = averagePrice(wine);
  const level = price >= 100 ? "a cellar-worthy bottle with enough structure for patience" : price >= 50 ? "a refined bottle for considered meals and hosting" : "a versatile bottle for regular rotation";
  return `${wineTitle(wine)} is ${level}. Expect ${inferNotes(wine).toLowerCase()} Average market price is listed at ${money(price)}.`;
}

function buildVineyardNote(wine) {
  const region = wine.region || "its region";
  return `${wine.producer || "The producer"} works from ${region}${wine.country ? `, ${wine.country}` : ""}. Track producer notes, vineyard details, allocation history, and estate/vendor context here as the collection record grows.`;
}

function byDrinkSoon(wines, category) {
  return wines
    .filter((wine) => wine.category === category)
    .sort((a, b) => Number(a.vintage || 0) - Number(b.vintage || 0) || averagePrice(b) - averagePrice(a))
    .slice(0, 5);
}

function drinkWindowStart(wine) {
  const windowText = inferDrinkWindow(wine);
  const year = String(windowText).match(/\d{4}/)?.[0];
  return year ? Number(year) : 0;
}

function drinkWindowStatus(wine) {
  const start = drinkWindowStart(wine);
  const currentYear = new Date().getFullYear();
  if (!start || start <= currentYear) return "Ready";
  if (start <= currentYear + 2) return "Soon";
  return "Hold";
}

function regionOptionsFromWines(wines) {
  return Array.from(new Set([...regionPresets.map((item) => item.label), ...wines.map((wine) => wine.region).filter(Boolean)])).sort();
}

function countryOptionsFromWines(wines) {
  return Array.from(new Set([...regionPresets.map((item) => item.country), ...wines.map((wine) => wine.country).filter(Boolean)])).sort();
}

function regionPresetFor(label) {
  return regionPresets.find((item) => item.label === label);
}

function App() {
  const [wines, setWines] = useState(loadWines);
  const [archive, setArchive] = useState(loadArchive);
  const [view, setView] = useState("dashboard");
  const [toolTab, setToolTab] = useState("wishlist");
  const [activeWineId, setActiveWineId] = useState(seedWines[0]?.id);
  const [filters, setFilters] = useState(defaultFilters);
  const [wishlist, setWishlist] = useState(() => loadStoredList(WISHLIST_STORAGE_KEY, defaultWishlist));
  const [vendors, setVendors] = useState(() => loadStoredList(VENDOR_STORAGE_KEY, defaultVendors));
  const [maintenance, setMaintenance] = useState(() => loadStoredList(MAINTENANCE_STORAGE_KEY, defaultMaintenance));
  const [events, setEvents] = useState(() => loadStoredList(EVENT_STORAGE_KEY, defaultEvents));
  const [scanOpen, setScanOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [theme, setTheme] = useState("dark");
  const toastTimer = useRef(null);

  const activeWine = wines.find((wine) => wine.id === activeWineId) || wines[0];
  const stats = useMemo(() => {
    const bottles = wines.reduce((sum, wine) => sum + Number(wine.quantity || 0), 0);
    const value = wines.reduce((sum, wine) => sum + averagePrice(wine) * Number(wine.quantity || 0), 0);
    const capacity = CELLAR_CAPACITY * 2;
    const cellar1 = wines.filter((wine) => wine.cellar === 1);
    const cellar2 = wines.filter((wine) => wine.cellar === 2);
    return {
      records: wines.length,
      bottles,
      value,
      capacity,
      openSlots: Math.max(0, capacity - wines.length),
      cellar1: cellar1.length,
      cellar2: cellar2.length,
      cellar1Bottles: cellar1.reduce((sum, wine) => sum + Number(wine.quantity || 0), 0),
      cellar2Bottles: cellar2.reduce((sum, wine) => sum + Number(wine.quantity || 0), 0),
      lowStock: wines.filter((wine) => Number(wine.quantity || 0) <= 1).length,
    };
  }, [wines]);

  function showToast(message) {
    setToast(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), 2800);
  }

  function persistWines(nextWines) {
    const placed = applyCellarPlacement(nextWines);
    setWines(placed);
    saveWines(placed);
    return placed;
  }

  function openTool(tab) {
    setToolTab(tab);
    setView("tools");
  }

  function updateStoredList(key, setter, nextList, message) {
    setter(nextList);
    saveStoredList(key, nextList);
    showToast(message);
  }

  function upsertWine(draft) {
    const placement = suggestPlacement(wines, draft);
    const nextWine = normalizeWine({
      id: Math.max(0, ...wines.map((wine) => wine.id)) + 1,
      producer: draft.producer || "Unknown producer",
      wineName: draft.wineName || "Unidentified bottle",
      vintage: draft.vintage ? Number(draft.vintage) : null,
      region: draft.region || "Region pending",
      country: draft.country || "",
      variety: draft.variety || "Blend",
      category: draft.category || "Red",
      size: "750ml",
      quantity: Number(draft.quantity || 1),
      estimatedPrice: Number(draft.estimatedPrice || 0),
      averagePrice: Number(draft.estimatedPrice || 0),
      notes: draft.notes || "Added from scan flow.",
      acquiredNotes: draft.acquiredNotes || "",
      frontPhoto: "",
      backPhoto: "",
      status: "Ready",
      cellar: placement.cellar,
      zone: placement.zone,
      slot: placement.slot,
      dateAdded: new Date().toISOString().slice(0, 10),
    });
    persistWines([...wines, nextWine]);
    setActiveWineId(nextWine.id);
    setScanOpen(false);
    setView("detail");
    showToast("Wine added successfully.");
  }

  function updateWine(id, patch) {
    const next = persistWines(wines.map((wine) => (wine.id === id ? normalizeWine({ ...wine, ...patch }) : wine)));
    setActiveWineId(id);
    showToast("Wine details updated.");
    return next.find((wine) => wine.id === id);
  }

  function drinkWine(id) {
    const wine = wines.find((item) => item.id === id);
    if (!wine) return;
    if (!window.confirm(`Archive one bottle of ${wineTitle(wine)} as consumed?`)) return;
    const consumed = {
      id: `${id}-${Date.now()}`,
      consumedAt: new Date().toISOString(),
      wine,
    };
    const nextArchive = [consumed, ...archive];
    const nextWines = wine.quantity > 1
      ? wines.map((item) => (item.id === id ? { ...item, quantity: item.quantity - 1 } : item))
      : wines.filter((item) => item.id !== id);
    const placed = persistWines(nextWines);
    setArchive(nextArchive);
    saveArchive(nextArchive);
    setActiveWineId(placed[0]?.id);
    setView("archive");
    showToast("Bottle archived in drink history.");
  }

  return (
    <div className={`app-shell theme-${theme}`}>
      <datalist id="region-presets">
        {regionPresets.map((region) => <option key={region.label} value={region.label} />)}
      </datalist>
      <aside className="sidebar">
        <div className="brand-mark">
          <Wine size={24} />
          <div>
            <strong>Lynn</strong>
            <span>Cave Privée</span>
          </div>
        </div>
        <button className="scan-cta" onClick={() => setScanOpen(true)}>
          <Camera size={20} />
          Scan bottle
        </button>
        <nav>
          <NavButton icon={<LayoutGrid />} active={view === "dashboard"} onClick={() => setView("dashboard")}>Overview</NavButton>
          <NavButton icon={<Wine />} active={view === "cellars"} onClick={() => setView("cellars")}>Cellars</NavButton>
          <NavButton icon={<Grape />} active={view === "collection"} onClick={() => setView("collection")}>Wines</NavButton>
          <NavButton icon={<Sparkles />} active={view === "tools"} onClick={() => setView("tools")}>Tools</NavButton>
          <NavButton icon={<ClipboardList />} active={view === "specs"} onClick={() => setView("specs")}>Specs</NavButton>
          <NavButton icon={<History />} active={view === "archive"} onClick={() => setView("archive")}>Archive</NavButton>
        </nav>
      </aside>

      <main>
        <header className="topbar">
          <div>
            <p className="eyebrow">Private cellar management</p>
            <h1>{topbarTitle(view)}</h1>
          </div>
          <div className="topbar-actions">
            <button className="icon-button" title="Toggle dark mode" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button className="icon-button" title="Add bottle" onClick={() => setScanOpen(true)}>
              <Plus size={20} />
            </button>
          </div>
        </header>

        {view === "dashboard" && <Dashboard stats={stats} wines={wines} openWine={(id) => { setActiveWineId(id); setView("detail"); }} setView={setView} openTool={openTool} />}
        {view === "cellars" && <Cellars wines={wines} openWine={(id) => { setActiveWineId(id); setView("detail"); }} />}
        {view === "collection" && (
          <Collection
            wines={wines}
            filters={filters}
            setFilters={setFilters}
            openWine={(id) => { setActiveWineId(id); setView("detail"); }}
          />
        )}
        {view === "tools" && (
          <CellarTools
            activeTab={toolTab}
            setActiveTab={setToolTab}
            wines={wines}
            openWine={(id) => { setActiveWineId(id); setView("detail"); }}
            wishlist={wishlist}
            vendors={vendors}
            maintenance={maintenance}
            events={events}
            setWishlist={(nextList) => updateStoredList(WISHLIST_STORAGE_KEY, setWishlist, nextList, "Wishlist updated.")}
            setVendors={(nextList) => updateStoredList(VENDOR_STORAGE_KEY, setVendors, nextList, "Vendor contacts updated.")}
            setMaintenance={(nextList) => updateStoredList(MAINTENANCE_STORAGE_KEY, setMaintenance, nextList, "Maintenance checklist updated.")}
            setEvents={(nextList) => updateStoredList(EVENT_STORAGE_KEY, setEvents, nextList, "Events and pairings updated.")}
          />
        )}
        {view === "specs" && <SpecsPage />}
        {view === "archive" && <ArchivePage archive={archive} openWine={(wine) => { setActiveWineId(wine.id); setView("detail"); }} />}
        {view === "detail" && activeWine && <WineDetail wine={activeWine} back={() => setView("collection")} onDrink={drinkWine} onUpdate={updateWine} />}

        <footer className="site-footer">
          <strong>{BRAND_NAME}</strong>
          <span>Private wine cellar planning, organization, and collection oversight.</span>
          <a href="mailto:hello@lynncaveprivee.com">Inquire Privately</a>
        </footer>
      </main>

      {scanOpen && <ScanDrawer wines={wines} onClose={() => setScanOpen(false)} onSave={upsertWine} />}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

function topbarTitle(view) {
  if (view === "dashboard") return BRAND_NAME;
  if (view === "cellars") return "Cellar Map";
  if (view === "tools") return "Cellar Tools";
  if (view === "detail") return "Bottle Details";
  if (view === "specs") return "Cellar Specs";
  if (view === "archive") return "Drink Archive";
  return "Wine Collection";
}

function NavButton({ icon, active, children, onClick }) {
  return (
    <button className={`nav-button ${active ? "active" : ""}`} onClick={onClick}>
      {React.cloneElement(icon, { size: 18 })}
      {children}
    </button>
  );
}

function Dashboard({ stats, wines, openWine, setView, openTool }) {
  const lowStock = wines.filter((wine) => Number(wine.quantity || 0) <= 1).slice(0, 4);

  return (
    <div className="dashboard-page">
      <section className="hero-luxury work-panel">
        <div>
          <p className="eyebrow">Cellar command center</p>
          <h2>Know what you own, where it lives, and what to open next.</h2>
          <p>
            This dashboard is for operating the Lynn collection: physical placement, bottle value, drink windows, low-stock alerts, source notes, and dinner-ready picks.
          </p>
        </div>
        <div className="hero-actions">
          <button className="primary-link" onClick={() => setView("cellars")}>Open Cellar Map</button>
          <button className="ghost-button" onClick={() => setView("collection")}>Search Wines</button>
        </div>
      </section>

      <section className="metric-panel">
        <Metric label="Entered Records" value={stats.records} />
        <Metric label="Physical Capacity" value={`${stats.records}/${stats.capacity}`} note={`${stats.openSlots} open slots`} />
        <Metric label="Collection Value" value={money(stats.value)} />
        <Metric label="Actual Bottles" value={stats.bottles} note="Counts quantities" />
      </section>

      <Section title="A Private Cellar, Properly Organized" icon={<BookOpen size={18} />}>
        <div className="service-grid">
          {services.map(([title, body]) => (
            <article className="service-card" key={title}>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </Section>

      <div className="split-grid">
        <Section title="Beyond the Cellar" icon={<Sparkles size={18} />}>
          <div className="system-grid">
            {operatingTiles.map(([item, body, target, tab]) => (
              <button key={item} onClick={() => (target === "tools" ? openTool(tab) : setView(target))}>
                <strong>{item}</strong>
                <small>{body}</small>
              </button>
            ))}
          </div>
        </Section>
        <Section title="Low Stock Alerts" icon={<BadgeDollarSign size={18} />}>
          {lowStock.length ? <BottleList wines={lowStock} openWine={openWine} /> : <EmptyState title="No low stock alerts" body="Quantities above one will stay out of this watch list." />}
        </Section>
      </div>

      <Section title="Regional Map" icon={<MapPinned size={18} />}>
        <RegionOverview wines={wines} openWine={openWine} />
      </Section>

      <Section title="Drink Soon" icon={<Wine size={18} />}>
        <div className="split-grid">
          <DrinkList title="Whites" wines={byDrinkSoon(wines, "White")} openWine={openWine} />
          <DrinkList title="Reds" wines={byDrinkSoon(wines, "Red")} openWine={openWine} />
        </div>
      </Section>

      <Section title="Cellar Split" icon={<ClipboardList size={18} />}>
        <div className="cellar-summary-grid">
          <Metric label="Left Cellar Under $50" value={stats.cellar1} note={`${stats.cellar1Bottles} bottles by quantity`} />
          <Metric label="Right Cellar $50+" value={stats.cellar2} note={`${stats.cellar2Bottles} bottles by quantity`} />
        </div>
      </Section>
    </div>
  );
}

function Metric({ label, value, note }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
      {note && <small>{note}</small>}
    </div>
  );
}

function Section({ title, icon, children }) {
  return (
    <section className="work-panel">
      <div className="section-title">
        <span>{icon}</span>
        <h2>{title}</h2>
      </div>
      {children}
    </section>
  );
}

function RegionOverview({ wines, openWine }) {
  const [country, setCountry] = useState("All");
  const [signalCode, setSignalCode] = useState("All");
  const [category, setCategory] = useState("All");
  const countries = ["All", ...countryOptionsFromWines(wines)];
  const signalOptions = ["All", ...Array.from(new Set(wines.map((wine) => regionSignal(regionName(wine), [wine]).code))).sort()];
  const categories = ["All", ...Array.from(new Set(wines.map((wine) => wine.category).filter(Boolean))).sort()];
  const visibleWines = wines.filter((wine) => {
    const signal = regionSignal(regionName(wine), [wine]).code;
    return (country === "All" || wine.country === country)
      && (signalCode === "All" || signal === signalCode)
      && (category === "All" || wine.category === category);
  });
  const groups = Object.entries(
    visibleWines.reduce((acc, wine) => {
      const key = regionName(wine);
      acc[key] = [...(acc[key] || []), wine];
      return acc;
    }, {}),
  )
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(0, 12);

  return (
    <>
      <div className="region-filter-bar">
        <label>Country<select value={country} onChange={(event) => setCountry(event.target.value)}>{countries.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>State / Badge<select value={signalCode} onChange={(event) => setSignalCode(event.target.value)}>{signalOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>Type<select value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
        <button className="ghost-button" onClick={() => { setCountry("All"); setSignalCode("All"); setCategory("All"); }}>Reset</button>
      </div>
      {groups.length ? (
        <div className="region-grid">
          {groups.map(([region, items]) => {
            const signal = regionSignal(region, items);
            const bottles = items.reduce((sum, wine) => sum + Number(wine.quantity || 0), 0);
            return (
              <article className="region-card" key={region}>
                <div className="region-backdrop" aria-hidden="true">{signal.code}</div>
                <div className="region-card-head">
                  <div className="map-dot" />
                  <span>{signal.label}</span>
                </div>
                <h3>{region}</h3>
                <p>{items.length} records · {bottles} bottles</p>
                <BottleList wines={items.slice(0, 4)} openWine={openWine} compact />
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState title="No regions match those filters" body="Adjust the country, badge, or type filter." />
      )}
    </>
  );
}

function DrinkList({ title, wines, openWine }) {
  return (
    <article className="drink-panel">
      <h3>{title}</h3>
      {wines.length ? <BottleList wines={wines} openWine={openWine} /> : <EmptyState title={`No ${title.toLowerCase()} to flag`} body="Add bottles or adjust drink windows." />}
    </article>
  );
}

function BottleList({ wines, openWine, compact = false }) {
  return (
    <div className={`bottle-list ${compact ? "compact" : ""}`}>
      {wines.map((wine) => (
        <button key={wine.id} onClick={() => openWine(wine.id)}>
          <span>{wineTitle(wine)}</span>
          <small>{wine.category} · {money(averagePrice(wine))} · C{wine.cellar} {zoneLabel(wine.zone)} #{wine.slot}</small>
        </button>
      ))}
    </div>
  );
}

function EmptyState({ title, body }) {
  return (
    <div className="empty-state">
      <Sparkles size={22} />
      <strong>{title}</strong>
      <p>{body}</p>
    </div>
  );
}

function Cellars({ wines, openWine }) {
  return (
    <div className="cellars-page">
      <CellarRules />
      {[1, 2].map((cellar) => (
        <section className="cellar-shell" key={cellar}>
          <div className="cellar-header">
            <div>
              <p className="eyebrow">Cellar {cellar}</p>
              <h2>{cellar === 1 ? "Left Cellar · Under $50" : "Right Cellar · $50 and Above"}</h2>
            </div>
            <span className="pill">{wines.filter((wine) => wine.cellar === cellar).length}/{CELLAR_CAPACITY} records placed</span>
          </div>
          <div className="cellar-layout">
            <Zone title="Upper Whites" cellar={cellar} zone="top" wines={wines} openWine={openWine} />
            <Zone title="Lower Reds" cellar={cellar} zone="bottom" wines={wines} openWine={openWine} />
          </div>
        </section>
      ))}
    </div>
  );
}

function CellarRules() {
  const rules = [
    ["Left", "Under $50", "Every bottle below $50 is assigned to the left cellar."],
    ["Right", "$50 and above", "Every bottle at $50 or higher is assigned to the right cellar."],
    ["Zones", "Whites top, reds bottom", "Sparkling, whites, rosé, and dessert wines use the upper zone. Reds use the lower zone."],
    ["Order", "Low to high price", "Within each zone, bottles are sorted from lowest price to highest price."],
    ["Preview", "Hover any slot", "Hover a filled slot to see the label, value, varietal, shelf, and position."],
  ];
  return (
    <section className="rule-band">
      {rules.map(([label, title, body]) => (
        <article key={label}>
          <span>{label}</span>
          <strong>{title}</strong>
          <p>{body}</p>
        </article>
      ))}
    </section>
  );
}

function Zone({ title, cellar, zone, wines, openWine }) {
  const zoneWines = wines.filter((wine) => wine.cellar === cellar && wine.zone === zone);
  const slots = Array.from({ length: ZONE_CAPACITY[zone] }, (_, index) => index + 1);

  return (
    <div className="zone-card">
      <div className="zone-heading">
        <div>
          <h3>{title}</h3>
          <p>{zoneLabel(zone)} · {zoneWines.length}/{ZONE_CAPACITY[zone]} bottles</p>
        </div>
        <Thermometer size={18} />
      </div>
      <div className="slot-grid">
        {slots.map((slot) => {
          const wine = zoneWines.find((item) => item.slot === slot);
          const meta = getSlotMeta(zone, slot);
          return (
            <button
              key={slot}
              className={`slot ${wine ? "filled" : ""}`}
              onClick={() => wine && openWine(wine.id)}
              title={wine ? wineTitle(wine) : "Empty slot"}
            >
              <span className="slot-number">{meta.shelf}.{meta.position}</span>
              {wine ? <span className="slot-name">{wine.producer}</span> : <span className="slot-empty">Empty</span>}
              {wine && (
                <span className="slot-hover">
                  {wine.frontPhoto && <img src={photoUrl(wine.frontPhoto)} alt={`${wineTitle(wine)} bottle`} />}
                  <strong>{wineTitle(wine)}</strong>
                  <small>{wine.variety} · {money(averagePrice(wine))}</small>
                  <small>C{wine.cellar} · {meta.label}, position {meta.position}</small>
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CellarTools({
  activeTab,
  setActiveTab,
  wines,
  openWine,
  wishlist,
  vendors,
  maintenance,
  events,
  setWishlist,
  setVendors,
  setMaintenance,
  setEvents,
}) {
  const tabs = [
    ["wishlist", "Wishlist", <ShoppingBag size={16} />],
    ["producers", "Producer Notes", <BookOpen size={16} />],
    ["value", "Bottle Value", <BadgeDollarSign size={16} />],
    ["drink", "Drink Windows", <Wine size={16} />],
    ["vendors", "Vendors", <Phone size={16} />],
    ["maintenance", "Maintenance", <CheckCircle2 size={16} />],
    ["events", "Events", <CalendarDays size={16} />],
  ];

  return (
    <div className="tools-page">
      <section className="tool-tabs work-panel">
        {tabs.map(([id, label, icon]) => (
          <button key={id} className={activeTab === id ? "active" : ""} onClick={() => setActiveTab(id)}>
            {icon}
            <span>{label}</span>
          </button>
        ))}
      </section>

      {activeTab === "wishlist" && <WishlistTool items={wishlist} setItems={setWishlist} />}
      {activeTab === "producers" && <ProducerTool wines={wines} openWine={openWine} />}
      {activeTab === "value" && <ValueTool wines={wines} openWine={openWine} />}
      {activeTab === "drink" && <DrinkWindowTool wines={wines} openWine={openWine} />}
      {activeTab === "vendors" && <VendorTool items={vendors} setItems={setVendors} />}
      {activeTab === "maintenance" && <MaintenanceTool items={maintenance} setItems={setMaintenance} />}
      {activeTab === "events" && <EventTool items={events} setItems={setEvents} wines={wines} openWine={openWine} />}
    </div>
  );
}

function nextId(items) {
  return Math.max(0, ...items.map((item) => Number(item.id || 0))) + 1;
}

function WishlistTool({ items, setItems }) {
  const [draft, setDraft] = useState({ name: "", region: "", target: "", priority: "Medium", note: "" });

  function addItem(event) {
    event.preventDefault();
    if (!draft.name.trim()) return;
    setItems([{ ...draft, id: nextId(items) }, ...items]);
    setDraft({ name: "", region: "", target: "", priority: "Medium", note: "" });
  }

  return (
    <section className="work-panel tool-panel">
      <div className="section-title">
        <span><ShoppingBag size={18} /></span>
        <h2>Wishlist</h2>
      </div>
      <form className="quick-form" onSubmit={addItem}>
        <input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="Bottle, producer, or style" />
        <input value={draft.region} onChange={(event) => setDraft({ ...draft, region: event.target.value })} placeholder="Region" list="region-presets" />
        <input value={draft.target} onChange={(event) => setDraft({ ...draft, target: event.target.value })} placeholder="Target price" />
        <select value={draft.priority} onChange={(event) => setDraft({ ...draft, priority: event.target.value })}>
          {["High", "Medium", "Low"].map((item) => <option key={item}>{item}</option>)}
        </select>
        <input className="wide" value={draft.note} onChange={(event) => setDraft({ ...draft, note: event.target.value })} placeholder="Why it belongs in the cellar" />
        <button className="save-button" type="submit"><Plus size={18} /> Add wishlist item</button>
      </form>
      <ToolList
        items={items}
        setItems={setItems}
        render={(item) => (
          <>
            <strong>{item.name}</strong>
            <span>{item.region || "Region pending"} · {item.target || "No target"} · {item.priority}</span>
            <p>{item.note}</p>
          </>
        )}
      />
    </section>
  );
}

function ProducerTool({ wines, openWine }) {
  const producers = Object.entries(
    wines.reduce((acc, wine) => {
      const key = wine.producer || "Producer pending";
      acc[key] = [...(acc[key] || []), wine];
      return acc;
    }, {}),
  ).sort(([a], [b]) => a.localeCompare(b));

  return (
    <section className="work-panel tool-panel">
      <div className="section-title">
        <span><BookOpen size={18} /></span>
        <h2>Producer Notes</h2>
      </div>
      <div className="producer-grid">
        {producers.map(([producer, items]) => (
          <article className="tool-card" key={producer}>
            <strong>{producer}</strong>
            <span>{items.length} records · {money(items.reduce((sum, wine) => sum + averagePrice(wine), 0) / items.length)} avg</span>
            <p>{buildVineyardNote(items[0])}</p>
            <BottleList wines={items.slice(0, 3)} openWine={openWine} compact />
          </article>
        ))}
      </div>
    </section>
  );
}

function ValueTool({ wines, openWine }) {
  const bands = [
    ["Everyday under $50", wines.filter((wine) => averagePrice(wine) < 50)],
    ["Hosting $50-$99", wines.filter((wine) => averagePrice(wine) >= 50 && averagePrice(wine) < 100)],
    ["Reserve $100+", wines.filter((wine) => averagePrice(wine) >= 100)],
  ];

  return (
    <section className="work-panel tool-panel">
      <div className="section-title">
        <span><BadgeDollarSign size={18} /></span>
        <h2>Bottle Value</h2>
      </div>
      <div className="value-grid">
        {bands.map(([label, items]) => (
          <article className="tool-card" key={label}>
            <strong>{label}</strong>
            <span>{items.length} records · {money(items.reduce((sum, wine) => sum + averagePrice(wine) * Number(wine.quantity || 0), 0))}</span>
            <BottleList wines={[...items].sort((a, b) => averagePrice(b) - averagePrice(a)).slice(0, 5)} openWine={openWine} compact />
          </article>
        ))}
      </div>
    </section>
  );
}

function DrinkWindowTool({ wines, openWine }) {
  const groups = ["Ready", "Soon", "Hold"].map((status) => [
    status,
    wines.filter((wine) => drinkWindowStatus(wine) === status).sort((a, b) => drinkWindowStart(a) - drinkWindowStart(b) || averagePrice(b) - averagePrice(a)),
  ]);

  return (
    <section className="work-panel tool-panel">
      <div className="section-title">
        <span><Wine size={18} /></span>
        <h2>Drink Windows</h2>
      </div>
      <div className="value-grid">
        {groups.map(([label, items]) => (
          <article className="tool-card" key={label}>
            <strong>{label}</strong>
            <span>{items.length} records</span>
            <BottleList wines={items.slice(0, 6)} openWine={openWine} compact />
          </article>
        ))}
      </div>
    </section>
  );
}

function VendorTool({ items, setItems }) {
  const [draft, setDraft] = useState({ name: "", contact: "", specialty: "", note: "" });

  function addItem(event) {
    event.preventDefault();
    if (!draft.name.trim()) return;
    setItems([{ ...draft, id: nextId(items) }, ...items]);
    setDraft({ name: "", contact: "", specialty: "", note: "" });
  }

  return (
    <section className="work-panel tool-panel">
      <div className="section-title">
        <span><Phone size={18} /></span>
        <h2>Vendor Contacts</h2>
      </div>
      <form className="quick-form" onSubmit={addItem}>
        <input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="Vendor name" />
        <input value={draft.contact} onChange={(event) => setDraft({ ...draft, contact: event.target.value })} placeholder="Contact / phone / email" />
        <input value={draft.specialty} onChange={(event) => setDraft({ ...draft, specialty: event.target.value })} placeholder="Specialty" />
        <input className="wide" value={draft.note} onChange={(event) => setDraft({ ...draft, note: event.target.value })} placeholder="Buying notes" />
        <button className="save-button" type="submit"><Plus size={18} /> Add vendor</button>
      </form>
      <ToolList
        items={items}
        setItems={setItems}
        render={(item) => (
          <>
            <strong>{item.name}</strong>
            <span>{item.contact || "Contact pending"} · {item.specialty || "General"}</span>
            <p>{item.note}</p>
          </>
        )}
      />
    </section>
  );
}

function MaintenanceTool({ items, setItems }) {
  const [draft, setDraft] = useState({ task: "", cadence: "Monthly", status: "Due", note: "" });

  function addItem(event) {
    event.preventDefault();
    if (!draft.task.trim()) return;
    setItems([{ ...draft, id: nextId(items) }, ...items]);
    setDraft({ task: "", cadence: "Monthly", status: "Due", note: "" });
  }

  function toggleStatus(item) {
    const status = item.status === "Done" ? "Due" : "Done";
    setItems(items.map((entry) => (entry.id === item.id ? { ...entry, status } : entry)));
  }

  return (
    <section className="work-panel tool-panel">
      <div className="section-title">
        <span><CheckCircle2 size={18} /></span>
        <h2>Maintenance</h2>
      </div>
      <form className="quick-form" onSubmit={addItem}>
        <input value={draft.task} onChange={(event) => setDraft({ ...draft, task: event.target.value })} placeholder="Task" />
        <select value={draft.cadence} onChange={(event) => setDraft({ ...draft, cadence: event.target.value })}>
          {["Weekly", "Monthly", "Quarterly", "As needed"].map((item) => <option key={item}>{item}</option>)}
        </select>
        <select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value })}>
          {["Due", "Scheduled", "Active", "Done"].map((item) => <option key={item}>{item}</option>)}
        </select>
        <input className="wide" value={draft.note} onChange={(event) => setDraft({ ...draft, note: event.target.value })} placeholder="Notes" />
        <button className="save-button" type="submit"><Plus size={18} /> Add maintenance task</button>
      </form>
      <div className="tool-list">
        {items.map((item) => (
          <article className="tool-card horizontal" key={item.id}>
            <button className={`status-toggle ${item.status === "Done" ? "done" : ""}`} onClick={() => toggleStatus(item)}>
              <CheckCircle2 size={18} />
            </button>
            <div>
              <strong>{item.task}</strong>
              <span>{item.cadence} · {item.status}</span>
              <p>{item.note}</p>
            </div>
            <button className="close-button" onClick={() => setItems(items.filter((entry) => entry.id !== item.id))}><X size={16} /></button>
          </article>
        ))}
      </div>
    </section>
  );
}

function EventTool({ items, setItems, wines, openWine }) {
  const [draft, setDraft] = useState({ name: "", date: "", pairing: "", note: "" });
  const dinnerWines = wines
    .filter((wine) => drinkWindowStatus(wine) !== "Hold")
    .sort((a, b) => averagePrice(b) - averagePrice(a))
    .slice(0, 6);

  function addItem(event) {
    event.preventDefault();
    if (!draft.name.trim()) return;
    setItems([{ ...draft, id: nextId(items) }, ...items]);
    setDraft({ name: "", date: "", pairing: "", note: "" });
  }

  return (
    <section className="work-panel tool-panel">
      <div className="section-title">
        <span><CalendarDays size={18} /></span>
        <h2>Events / Pairings</h2>
      </div>
      <form className="quick-form" onSubmit={addItem}>
        <input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="Dinner, gift, or event" />
        <input value={draft.date} onChange={(event) => setDraft({ ...draft, date: event.target.value })} placeholder="Date / occasion" />
        <input value={draft.pairing} onChange={(event) => setDraft({ ...draft, pairing: event.target.value })} placeholder="Pairing idea" />
        <input className="wide" value={draft.note} onChange={(event) => setDraft({ ...draft, note: event.target.value })} placeholder="Bottle notes" />
        <button className="save-button" type="submit"><Plus size={18} /> Add event</button>
      </form>
      <div className="split-grid">
        <ToolList
          items={items}
          setItems={setItems}
          render={(item) => (
            <>
              <strong>{item.name}</strong>
              <span>{item.date || "Date pending"} · {item.pairing || "Pairing pending"}</span>
              <p>{item.note}</p>
            </>
          )}
        />
        <article className="tool-card">
          <strong>Dinner-ready bottles</strong>
          <span>Ready or soon, sorted by value</span>
          <BottleList wines={dinnerWines} openWine={openWine} compact />
        </article>
      </div>
    </section>
  );
}

function ToolList({ items, setItems, render }) {
  return (
    <div className="tool-list">
      {items.map((item) => (
        <article className="tool-card" key={item.id}>
          {render(item)}
          <button className="ghost-button" onClick={() => setItems(items.filter((entry) => entry.id !== item.id))}>
            <Trash2 size={16} />
            Remove
          </button>
        </article>
      ))}
    </div>
  );
}

function SpecsPage() {
  return (
    <div className="specs-page">
      <CoolerSpecs />
      <Section title="Process" icon={<ClipboardList size={18} />}>
        <div className="process-grid">
          {["Review", "Organize", "Build System", "Maintain"].map((item, index) => (
            <article key={item}>
              <span>{index + 1}</span>
              <h3>{item}</h3>
              <p>{["Assess the bottles, goals, price bands, and storage constraints.", "Place bottles by value, style, region, and serving logic.", "Create the digital collection record with notes, photos, ratings, and history.", "Track drinking, low stock, vendor notes, and future additions."][index]}</p>
            </article>
          ))}
        </div>
      </Section>
      <Section title="Deliverables" icon={<Sparkles size={18} />}>
        <div className="system-grid">
          {["Bottle inventory framework", "Cellar layout notes", "Vendor coordination tracker", "Wine acquisition log", "Private tasting notes", "Maintenance checklist", "Digital cellar dashboard"].map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </Section>
    </div>
  );
}

function CoolerSpecs() {
  return (
    <section className="spec-card work-panel">
      <div className="section-title">
        <Fan size={18} />
        <h2>{CELLAR_MODEL.maker} {CELLAR_MODEL.model}</h2>
      </div>
      <p>{CELLAR_MODEL.name}</p>
      <div className="spec-grid">
        <Spec label="Dimensions" value={CELLAR_MODEL.dimensions} />
        <Spec label="Upper zone" value={CELLAR_MODEL.upperRange} />
        <Spec label="Lower zone" value={CELLAR_MODEL.lowerRange} />
        <Spec label="Max bottle diameter" value={CELLAR_MODEL.maxBottleDiameter} />
        <Spec label="Capacity" value={`${CELLAR_CAPACITY} bottles per unit`} />
        <Spec label="Placement rule" value="Under $50 left, $50+ right" />
      </div>
      <p className="quiet-copy">{CELLAR_MODEL.note}</p>
      <div className="spec-images">
        {["dual-zone.webp", "racks.webp", "dimensions.webp"].map((image) => (
          <img key={image} src={`/cooler/${image}`} alt={`${CELLAR_MODEL.maker} cooler ${image.replace(".webp", "")}`} />
        ))}
      </div>
    </section>
  );
}

function Spec({ label, value }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Collection({ wines, filters, setFilters, openWine }) {
  const filtered = useMemo(() => filterWines(wines, filters), [wines, filters]);
  const countries = ["All", ...Array.from(new Set(wines.map((wine) => wine.country).filter(Boolean))).sort()];
  const regions = ["All", ...regionOptionsFromWines(wines)];
  const badges = ["All", ...Array.from(new Set(wines.map((wine) => regionSignal(regionName(wine), [wine]).code))).sort()];
  const categories = ["All", ...Array.from(new Set(wines.map((wine) => wine.category).filter(Boolean))).sort()];

  function setFilter(key, value) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  return (
    <div className="collection-page">
      <section className="filter-panel work-panel">
        <div className="search-row">
          <Search size={18} />
          <input
            value={filters.text}
            onChange={(event) => setFilter("text", event.target.value)}
            placeholder="Search name, varietal, region, notes, tags..."
          />
        </div>
        <div className="filter-grid">
          <label>Type<select value={filters.category} onChange={(event) => setFilter("category", event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label>Country<select value={filters.country} onChange={(event) => setFilter("country", event.target.value)}>{countries.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label>Region<select value={filters.region} onChange={(event) => setFilter("region", event.target.value)}>{regions.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label>Badge<select value={filters.badge} onChange={(event) => setFilter("badge", event.target.value)}>{badges.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label>Min Vintage<input inputMode="numeric" value={filters.minVintage} onChange={(event) => setFilter("minVintage", event.target.value)} /></label>
          <label>Max Vintage<input inputMode="numeric" value={filters.maxVintage} onChange={(event) => setFilter("maxVintage", event.target.value)} /></label>
          <label>Min Price<input inputMode="decimal" value={filters.minPrice} onChange={(event) => setFilter("minPrice", event.target.value)} /></label>
          <label>Max Price<input inputMode="decimal" value={filters.maxPrice} onChange={(event) => setFilter("maxPrice", event.target.value)} /></label>
          <label>Sort<select value={filters.sort} onChange={(event) => setFilter("sort", event.target.value)}>
            <option value="location">Location</option>
            <option value="name">Name</option>
            <option value="vintage">Vintage</option>
            <option value="price">Price</option>
            <option value="date">Date Added</option>
          </select></label>
        </div>
      </section>

      <div className="section-title">
        <span><Filter size={18} /></span>
        <h2>{filtered.length} bottles found</h2>
      </div>

      {filtered.length ? (
        <div className="wine-table">
          {filtered.map((wine) => (
            <button className="wine-row" key={wine.id} onClick={() => openWine(wine.id)}>
              <span>{wineTitle(wine)}</span>
              <span>{wine.variety}</span>
              <span>{wine.region}</span>
              <span>{money(averagePrice(wine))}</span>
              <span>Qty {wine.quantity}</span>
              <span>C{wine.cellar} · {wine.zone} · {wine.slot}</span>
            </button>
          ))}
        </div>
      ) : (
        <EmptyState title="No wines match those filters" body="Clear a field or add a bottle from the scan flow." />
      )}
    </div>
  );
}

function WineDetail({ wine, back, onDrink, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(() => formFromWine(wine));

  function saveEdit(event) {
    event.preventDefault();
    const updated = onUpdate(wine.id, wineFromForm(draft));
    setDraft(formFromWine(updated || wine));
    setEditing(false);
  }

  return (
    <div className="detail-page">
      <button className="back-button" onClick={back}><ChevronLeft size={18} /> Back to collection</button>

      <section className="detail-hero work-panel">
        <div className="bottle-gallery">
          {wine.frontPhoto ? <img src={photoUrl(wine.frontPhoto)} alt={`${wineTitle(wine)} front label`} /> : <div className="photo-placeholder"><Wine size={32} /></div>}
          {wine.backPhoto && <img src={photoUrl(wine.backPhoto)} alt={`${wineTitle(wine)} back label`} />}
        </div>
        <div className="detail-copy">
          <p className="eyebrow">{wine.category} · {wine.country || "Country pending"}</p>
          <h2>{wineTitle(wine)}</h2>
          <p>{buildWineOverview(wine)}</p>
          <div className="detail-actions">
            <button className="ghost-button" onClick={() => setEditing(true)}><Edit3 size={17} /> Edit</button>
            <button className="danger-button" onClick={() => onDrink(wine.id)}><Trash2 size={17} /> Drink</button>
          </div>
        </div>
      </section>

      <div className="detail-grid">
        <DetailCard title="Bottle Info">
          <Spec label="Average price" value={money(averagePrice(wine))} />
          <Spec label="Quantity" value={wine.quantity} />
          <Spec label="Location" value={`Cellar ${wine.cellar}, ${zoneLabel(wine.zone)}, slot ${wine.slot}`} />
          <Spec label="Drink window" value={inferDrinkWindow(wine)} />
        </DetailCard>
        <DetailCard title="About the Vineyard">
          <p>{buildVineyardNote(wine)}</p>
        </DetailCard>
        <DetailCard title="Ratings">
          <StarRating rating={wine.rating} />
          {(wine.criticRatings || []).length ? (
            <ul className="rating-list">{wine.criticRatings.map((rating) => <li key={rating.source}>{rating.source}: {rating.score}</li>)}</ul>
          ) : (
            <p className="quiet-copy">No critic ratings recorded yet.</p>
          )}
        </DetailCard>
        <DetailCard title="Tasting Notes">
          <StructuredNotes notes={wine.tastingNotes} fallback={inferNotes(wine)} />
        </DetailCard>
        <DetailCard title="Acquisition Notes">
          <p>{wine.acquiredNotes || "No acquisition note yet. Add how this bottle was sourced, gifted, purchased, or allocated."}</p>
          {(wine.tags || []).length > 0 && <div className="tag-list">{wine.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>}
        </DetailCard>
        <DetailCard title="Source">
          {wine.sourceUrl ? <a href={wine.sourceUrl} target="_blank" rel="noreferrer">View reference</a> : <p className="quiet-copy">No source link recorded.</p>}
        </DetailCard>
      </div>

      {editing && (
        <div className="bottom-sheet">
          <form className="edit-panel" onSubmit={saveEdit}>
            <div className="sheet-header">
              <h2>Edit Wine Info</h2>
              <button type="button" className="close-button" onClick={() => setEditing(false)}><X size={18} /></button>
            </div>
            <WineForm draft={draft} setDraft={setDraft} includeNotes />
            <button className="save-button" type="submit"><Save size={18} /> Save Changes</button>
          </form>
        </div>
      )}
    </div>
  );
}

function DetailCard({ title, children }) {
  return (
    <article className="detail-card">
      <h3>{title}</h3>
      {children}
    </article>
  );
}

function StarRating({ rating, onChange }) {
  return (
    <div className="star-rating" aria-label={`${rating || 0} star rating`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button key={star} type="button" onClick={() => onChange?.(star)} className={Number(rating || 0) >= star ? "active" : ""}>
          <Star size={18} fill="currentColor" />
        </button>
      ))}
    </div>
  );
}

function StructuredNotes({ notes, fallback }) {
  if (!notes || typeof notes !== "object" || (!notes.appearance && !notes.nose && !notes.palate && !notes.finish)) {
    return <p>{fallback}</p>;
  }
  return (
    <dl className="structured-notes">
      {["appearance", "nose", "palate", "finish"].map((key) => notes[key] && (
        <div key={key}>
          <dt>{key}</dt>
          <dd>{notes[key]}</dd>
        </div>
      ))}
    </dl>
  );
}

function formFromWine(wine) {
  return {
    producer: wine.producer || "",
    wineName: wine.wineName || "",
    vintage: wine.vintage || "",
    region: wine.region || "",
    country: wine.country || "",
    variety: wine.variety || "",
    category: wine.category || "Red",
    estimatedPrice: averagePrice(wine),
    quantity: wine.quantity || 1,
    notes: wine.notes || "",
    acquiredNotes: wine.acquiredNotes || "",
    rating: wine.rating || 0,
    tags: (wine.tags || []).join(", "),
    appearance: wine.tastingNotes?.appearance || "",
    nose: wine.tastingNotes?.nose || "",
    palate: wine.tastingNotes?.palate || "",
    finish: wine.tastingNotes?.finish || "",
  };
}

function wineFromForm(draft) {
  return {
    producer: draft.producer,
    wineName: draft.wineName,
    vintage: draft.vintage ? Number(draft.vintage) : null,
    region: draft.region,
    country: draft.country,
    variety: draft.variety,
    category: draft.category,
    estimatedPrice: Number(draft.estimatedPrice || 0),
    averagePrice: Number(draft.estimatedPrice || 0),
    quantity: Number(draft.quantity || 1),
    notes: draft.notes,
    acquiredNotes: draft.acquiredNotes,
    rating: Number(draft.rating || 0),
    tags: String(draft.tags || "").split(",").map((tag) => tag.trim()).filter(Boolean),
    tastingNotes: {
      appearance: draft.appearance,
      nose: draft.nose,
      palate: draft.palate,
      finish: draft.finish,
    },
  };
}

function WineForm({ draft, setDraft, includeNotes = false }) {
  function setField(key, value) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function setRegion(value) {
    const preset = regionPresetFor(value);
    setDraft((current) => ({
      ...current,
      region: value,
      country: preset?.country || current.country,
    }));
  }

  return (
    <div className="form-grid">
      <label>Producer<input value={draft.producer} onChange={(event) => setField("producer", event.target.value)} /></label>
      <label>Wine Name<input value={draft.wineName} onChange={(event) => setField("wineName", event.target.value)} /></label>
      <label>Vintage<input inputMode="numeric" value={draft.vintage} onChange={(event) => setField("vintage", event.target.value)} /></label>
      <label>Region<input value={draft.region} list="region-presets" onChange={(event) => setRegion(event.target.value)} /></label>
      <label>Country<select value={draft.country} onChange={(event) => setField("country", event.target.value)}>
        <option value="">Country pending</option>
        {Array.from(new Set(regionPresets.map((item) => item.country))).sort().map((country) => <option key={country}>{country}</option>)}
      </select></label>
      <label>Varietal<input value={draft.variety} onChange={(event) => setField("variety", event.target.value)} /></label>
      <label>Type<select value={draft.category} onChange={(event) => setField("category", event.target.value)}>
        {["Red", "White", "Sparkling", "Rose", "Dessert"].map((item) => <option key={item}>{item}</option>)}
      </select></label>
      <label>Average Price<input inputMode="decimal" value={draft.estimatedPrice} onChange={(event) => setField("estimatedPrice", event.target.value)} /></label>
      <label>Quantity<input inputMode="numeric" value={draft.quantity} onChange={(event) => setField("quantity", event.target.value)} /></label>
      {includeNotes && (
        <>
          <label className="wide">How Acquired<textarea value={draft.acquiredNotes} onChange={(event) => setField("acquiredNotes", event.target.value)} /></label>
          <label className="wide">Bottle Notes<textarea value={draft.notes} onChange={(event) => setField("notes", event.target.value)} /></label>
          <label>Rating<StarRating rating={draft.rating} onChange={(value) => setField("rating", value)} /></label>
          <label>Tags<input value={draft.tags} onChange={(event) => setField("tags", event.target.value)} placeholder="Thanksgiving, Steak pairing" /></label>
          <label>Appearance<textarea value={draft.appearance} onChange={(event) => setField("appearance", event.target.value)} /></label>
          <label>Nose<textarea value={draft.nose} onChange={(event) => setField("nose", event.target.value)} /></label>
          <label>Palate<textarea value={draft.palate} onChange={(event) => setField("palate", event.target.value)} /></label>
          <label>Finish<textarea value={draft.finish} onChange={(event) => setField("finish", event.target.value)} /></label>
        </>
      )}
    </div>
  );
}

function ArchivePage({ archive }) {
  return (
    <div className="archive-page">
      {archive.length ? (
        <div className="archive-list">
          {archive.map((entry) => (
            <article className="archive-card" key={entry.id}>
              <span>{new Date(entry.consumedAt).toLocaleString()}</span>
              <h3>{wineTitle(entry.wine)}</h3>
              <p>{entry.wine.region} · {entry.wine.variety} · {money(averagePrice(entry.wine))}</p>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState title="No bottles consumed yet" body="Use the Drink button on a bottle detail page to archive it here for future reference." />
      )}
    </div>
  );
}

function ScanDrawer({ wines, onClose, onSave }) {
  const [mode, setMode] = useState("label");
  const [draft, setDraft] = useState({
    producer: "",
    wineName: "",
    vintage: "",
    region: "",
    country: "",
    variety: "",
    category: "Red",
    estimatedPrice: "",
    quantity: 1,
    acquiredNotes: "",
    notes: "",
  });
  const [cameraActive, setCameraActive] = useState(false);
  const [saving, setSaving] = useState(false);
  const videoRef = useRef(null);

  const placement = useMemo(() => suggestPlacement(wines, draft), [wines, draft]);

  async function startCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
    if (videoRef.current) videoRef.current.srcObject = stream;
    setCameraActive(true);
  }

  function stopCamera() {
    const stream = videoRef.current?.srcObject;
    stream?.getTracks().forEach((track) => track.stop());
    setCameraActive(false);
  }

  function submit(event) {
    event.preventDefault();
    setSaving(true);
    window.setTimeout(() => onSave(draft), 450);
  }

  return (
    <div className="drawer-backdrop">
      <aside className="scan-drawer">
        <div className="drawer-header">
          <div>
            <p className="eyebrow">Add bottle</p>
            <h2>Scan or enter details</h2>
          </div>
          <button className="close-button" onClick={() => { stopCamera(); onClose(); }}><X size={18} /></button>
        </div>

        <div className="mode-switch">
          <button className={mode === "label" ? "active" : ""} onClick={() => setMode("label")}><Camera size={17} /> Label</button>
          <button className={mode === "barcode" ? "active" : ""} onClick={() => setMode("barcode")}><Barcode size={17} /> Barcode</button>
        </div>

        <div className="camera-box">
          {cameraActive ? <video ref={videoRef} autoPlay playsInline /> : <div><Camera size={34} /><p>{mode === "label" ? "Capture the front or back label." : "Point at a barcode."}</p></div>}
          <div className="scan-stack">
            <button type="button" onClick={cameraActive ? stopCamera : startCamera}>{cameraActive ? "Stop camera" : "Use camera"}</button>
            <label className="file-button">Upload photo<input type="file" accept="image/*" capture="environment" /></label>
          </div>
        </div>

        <form onSubmit={submit}>
          <WineForm draft={draft} setDraft={setDraft} />
          <label className="wide drawer-note">How Acquired<textarea value={draft.acquiredNotes} onChange={(event) => setDraft((current) => ({ ...current, acquiredNotes: event.target.value }))} /></label>
          <div className="placement-preview">
            <span>Suggested placement</span>
            <strong>Cellar {placement.cellar} · {zoneLabel(placement.zone)} · Slot {placement.slot}</strong>
            <small>{averagePrice(placement) < 50 ? "Under $50 left cellar" : "$50+ right cellar"}</small>
          </div>
          <button className="save-button" type="submit" disabled={saving}>
            <Save size={18} />
            {saving ? "Saving..." : "Save to cellar"}
          </button>
        </form>
      </aside>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
