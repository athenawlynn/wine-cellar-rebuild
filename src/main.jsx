import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Archive as ArchiveIcon,
  BadgeDollarSign,
  Barcode,
  BookOpen,
  Camera,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  ClipboardList,
  Edit3,
  Eye,
  EyeOff,
  Fan,
  Filter,
  Grape,
  History,
  LayoutGrid,
  MapPinned,
  Moon,
  Phone,
  Plus,
  Printer,
  RotateCcw,
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
import seedArchive from "./data/archive.json";
import seedWines from "./data/wines.json";
import "./styles.css";
import LuxuryCellarBook from "./LuxuryCellarBook.jsx";
const BRAND_NAME = "Lynn Cave Privée";
const PHOTO_BASE = "/photos/";
const WINE_STORAGE_KEY = "lynn-cellar-wines-2026-06-23-austin-hope-grouped";
const ARCHIVE_STORAGE_KEY = "lynn-cellar-archive-2026-05-02-inventory";
const WISHLIST_STORAGE_KEY = "lynn-cellar-wishlist";
const VENDOR_STORAGE_KEY = "lynn-cellar-vendors";
const MAINTENANCE_STORAGE_KEY = "lynn-cellar-maintenance";
const EVENT_STORAGE_KEY = "lynn-cellar-events";
const THEME_STORAGE_KEY = "lynn-cellar-theme";
const WINE_VERSION_STORAGE_KEY = `${WINE_STORAGE_KEY}-version`;
const CELLAR_STATE_API = "/api/cellar-state";
let lastWineStateVersion = 0;

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
    { rack: 1, capacity: 8 },
    { rack: 2, capacity: 8 },
    { rack: 3, capacity: 8 },
  ],
  bottom: [
    { rack: 1, capacity: 8 },
    { rack: 2, capacity: 8 },
    { rack: 3, capacity: 8 },
  ],
};

const FULL_RED_LAYOUT = [
  { rack: 1, capacity: 8 },
  { rack: 2, capacity: 8 },
  { rack: 3, capacity: 8 },
  { rack: 4, capacity: 8 },
  { rack: 5, capacity: 8 },
  { rack: 6, capacity: 8 },
];

const CELLAR_CAPACITY = [...COOLER_LAYOUT.top, ...COOLER_LAYOUT.bottom].reduce((sum, rack) => sum + rack.capacity, 0);
const ZONE_CAPACITY = {
  top: COOLER_LAYOUT.top.reduce((sum, rack) => sum + rack.capacity, 0),
  bottom: COOLER_LAYOUT.bottom.reduce((sum, rack) => sum + rack.capacity, 0),
  fullRed: FULL_RED_LAYOUT.reduce((sum, rack) => sum + rack.capacity, 0),
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
  ["Maryland", "MD", "state"],
  ["New York", "NY", "state"],
  ["Bordeaux", "FR", "France"],
  ["Burgundy", "FR", "France"],
  ["Loire", "FR", "France"],
  ["Rhône", "FR", "France"],
  ["Châteauneuf", "FR", "France"],
  ["Piedmont", "IT", "Italy"],
  ["Tuscany", "IT", "Italy"],
  ["Veneto", "IT", "Italy"],
  ["Rioja", "ES", "Spain"],
  ["Australia", "AU", "Australia"],
];

const regionPresets = [
  { label: "Napa Valley, California", country: "United States", code: "CA" },
  { label: "Sonoma County, California", country: "United States", code: "CA" },
  { label: "Paso Robles, California", country: "United States", code: "CA" },
  { label: "Santa Lucia Highlands, California", country: "United States", code: "CA" },
  { label: "Willamette Valley, Oregon", country: "United States", code: "OR" },
  { label: "Arizona", country: "United States", code: "AZ" },
  { label: "St. Michaels, Maryland", country: "United States", code: "MD" },
  { label: "Bordeaux", country: "France", code: "FR" },
  { label: "Burgundy", country: "France", code: "FR" },
  { label: "Châteauneuf-du-Pape, Rhône", country: "France", code: "FR" },
  { label: "Loire Valley", country: "France", code: "FR" },
  { label: "Piedmont", country: "Italy", code: "IT" },
  { label: "Tuscany", country: "Italy", code: "IT" },
  { label: "Veneto", country: "Italy", code: "IT" },
  { label: "Rioja Alavesa", country: "Spain", code: "ES" },
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
  { id: 1, task: "Verify white and red rack temperatures", cadence: "Weekly", status: "Due", note: `${CELLAR_MODEL.upperRange} white racks, ${CELLAR_MODEL.lowerRange} red racks.` },
  { id: 2, task: "Clean vents and inspect door seals", cadence: "Monthly", status: "Scheduled", note: "Check both Allavino units." },
  { id: 3, task: "Review rack placement after new buys", cadence: "As needed", status: "Active", note: "Keep price sort and white/red rack rules intact." },
];

const defaultEvents = [
  { id: 1, name: "Steak dinner candidates", date: "Next dinner", pairing: "Cabernet / Bordeaux", note: "Pull structured reds from the right red racks." },
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

function isWhiteZoneWine(wine) {
  return TOP_ZONE_CATEGORIES.includes(wine.category);
}

function cellarForWine(wine) {
  const cellarOverride = Number(wine.cellarOverride);
  if ([1, 2].includes(cellarOverride)) return cellarOverride;
  if (isWhiteZoneWine(wine)) return 1;
  return averagePrice(wine) <= 50 ? 1 : 2;
}

function zoneForWine(wine, cellar = cellarForWine(wine)) {
  const zoneOverride = wine.zoneOverride;
  if (["top", "bottom", "fullRed"].includes(zoneOverride)) return zoneOverride;
  if (isWhiteZoneWine(wine)) return "top";
  return cellar === 2 ? "fullRed" : "bottom";
}

function averagePrice(wine) {
  return Number(wine.averagePrice ?? wine.estimatedPrice ?? 0);
}

function placementSortPrice(wine) {
  const sortPrice = Number(wine.placementSortPrice);
  return Number.isFinite(sortPrice) ? sortPrice : averagePrice(wine);
}

function placementPriority(wine) {
  const priority = Number(wine.placementPriority);
  return Number.isFinite(priority) ? priority : null;
}

function placementSort(a, b) {
  const aPriority = placementPriority(a);
  const bPriority = placementPriority(b);

  if (aPriority !== null || bPriority !== null) {
    return (
      (aPriority ?? Number(a.slot || Number.MAX_SAFE_INTEGER)) - (bPriority ?? Number(b.slot || Number.MAX_SAFE_INTEGER)) ||
      placementSortPrice(a) - placementSortPrice(b) ||
      String(a.producer || "").localeCompare(String(b.producer || "")) ||
      String(a.wineName || "").localeCompare(String(b.wineName || "")) ||
      Number(a.vintage || 0) - Number(b.vintage || 0) ||
      Number(a.id || 0) - Number(b.id || 0)
    );
  }

  return (
    placementSortPrice(a) - placementSortPrice(b) ||
    String(a.producer || "").localeCompare(String(b.producer || "")) ||
    String(a.wineName || "").localeCompare(String(b.wineName || "")) ||
    Number(a.vintage || 0) - Number(b.vintage || 0) ||
    Number(a.id || 0) - Number(b.id || 0)
  );
}

function cellarOrderedWines(wines) {
  return [...wines].sort((a, b) => (
    Number(a.cellar || 0) - Number(b.cellar || 0) ||
    String(a.zone || "").localeCompare(String(b.zone || "")) ||
    Number(a.slot || 0) - Number(b.slot || 0) ||
    wineTitle(a).localeCompare(wineTitle(b))
  ));
}

function bottleInstanceId(wineId, bottleNumber) {
  return `${wineId}:${bottleNumber}`;
}

function bottlePlacementForWine(wine, bottleNumber) {
  const placement = Array.isArray(wine.bottlePlacements)
    ? wine.bottlePlacements.find((item) => Number(item.bottleNumber) === Number(bottleNumber))
    : null;
  const cellar = Number(placement?.cellarOverride ?? placement?.cellar ?? wine.cellarOverride ?? wine.cellar ?? cellarForWine(wine));
  const zone = placement?.zoneOverride ?? placement?.zone ?? wine.zoneOverride ?? wine.zone ?? zoneForWine(wine, cellar);
  const explicitPriority = Number(placement?.placementPriority ?? placement?.slot);
  const winePriority = Number(wine.placementPriority ?? wine.slot);
  const bottleOffset = Math.max(0, Number(bottleNumber || 1) - 1);
  const fallbackPriority = Number.isFinite(winePriority) ? winePriority + bottleOffset : null;
  return {
    cellar: [1, 2].includes(cellar) ? cellar : cellarForWine(wine),
    zone: ["top", "bottom", "fullRed"].includes(zone) ? zone : zoneForWine(wine, cellar),
    placementPriority: Number.isFinite(explicitPriority) ? explicitPriority : fallbackPriority,
  };
}

function cellarBottleRecords(wines) {
  const records = wines.flatMap((wine) => {
    const quantity = Math.max(1, Number(wine.quantity || 1));
    return Array.from({ length: quantity }, (_, index) => {
      const bottleNumber = index + 1;
      const placement = bottlePlacementForWine(wine, bottleNumber);
      return {
        instanceId: bottleInstanceId(wine.id, bottleNumber),
        wineId: wine.id,
        wine,
        bottleNumber,
        bottleTotal: quantity,
        cellar: placement.cellar,
        zone: placement.zone,
        placementPriority: placement.placementPriority,
      };
    });
  });
  const grouped = new Map();

  for (const record of records) {
    const key = `${record.cellar}-${record.zone}`;
    grouped.set(key, [...(grouped.get(key) || []), record]);
  }

  return Array.from(grouped.values()).flatMap((group) => {
    const placed = [];
    const usedSlots = new Set();
    const claimSlot = (preferredSlot) => {
      let slot = Math.max(1, Math.floor(Number(preferredSlot) || 1));
      while (usedSlots.has(slot)) slot += 1;
      usedSlots.add(slot);
      return slot;
    };
    const manuallyPlaced = group
      .filter((record) => record.placementPriority !== null)
      .sort((a, b) => (
        Number(a.placementPriority) - Number(b.placementPriority) ||
        placementSort(a.wine, b.wine) ||
        a.bottleNumber - b.bottleNumber
      ));
    const autoPlaced = group
      .filter((record) => record.placementPriority === null)
      .sort((a, b) => placementSort(a.wine, b.wine) || a.bottleNumber - b.bottleNumber);

    for (const record of manuallyPlaced) {
      placed.push({ ...record, slot: claimSlot(record.placementPriority) });
    }

    let nextAutoSlot = 1;
    for (const record of autoPlaced) {
      while (usedSlots.has(nextAutoSlot)) nextAutoSlot += 1;
      placed.push({ ...record, slot: claimSlot(nextAutoSlot) });
    }

    return placed.sort((a, b) => a.slot - b.slot);
  });
}

function applyCellarPlacement(wines) {
  const grouped = new Map();

  for (const rawWine of wines) {
    const wine = normalizeWine(rawWine);
    const cellar = cellarForWine(wine);
    const zone = zoneForWine(wine, cellar);
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

function applyBottlePlacementRecords(wines, records) {
  const grouped = new Map();
  for (const record of records) {
    const key = `${record.cellar}-${record.zone}`;
    grouped.set(key, [...(grouped.get(key) || []), record]);
  }

  const placementsByWine = new Map();
  for (const group of grouped.values()) {
    group.forEach((record) => {
      placementsByWine.set(record.wineId, [
        ...(placementsByWine.get(record.wineId) || []),
        {
          bottleNumber: record.bottleNumber,
          cellarOverride: record.cellar,
          zoneOverride: record.zone,
          placementPriority: Number(record.slot || record.placementPriority || 1),
        },
      ]);
    });
  }

  return wines.map((wine) => {
    const placements = (placementsByWine.get(wine.id) || []).sort((a, b) => a.bottleNumber - b.bottleNumber);
    const firstPlacement = placements[0];
    return normalizeWine({
      ...wine,
      cellarOverride: firstPlacement?.cellarOverride ?? wine.cellarOverride,
      zoneOverride: firstPlacement?.zoneOverride ?? wine.zoneOverride,
      placementPriority: firstPlacement?.placementPriority ?? wine.placementPriority,
      bottlePlacements: placements,
    });
  });
}

function reorderBottlePlacement(wines, sourceInstanceId, target) {
  const records = cellarBottleRecords(wines);
  const source = records.find((record) => record.instanceId === sourceInstanceId);
  if (!source) return wines;
  const targetRecord = target.targetInstanceId ? records.find((record) => record.instanceId === target.targetInstanceId) : null;
  if (targetRecord?.instanceId === source.instanceId) return wines;
  const targetSlot = Math.max(1, Number(target.slot || 1));
  const nextRecords = records.map((record) => {
    if (record.instanceId === source.instanceId) {
      return { ...record, cellar: target.cellar, zone: target.zone, slot: targetSlot, placementPriority: targetSlot };
    }
    if (targetRecord && record.instanceId === targetRecord.instanceId) {
      return { ...record, cellar: source.cellar, zone: source.zone, slot: source.slot, placementPriority: source.slot };
    }
    return record;
  });

  return applyBottlePlacementRecords(wines, nextRecords);
}

function mergeSavedWines(savedWines) {
  const savedById = new Map(savedWines.map((wine) => [wine.id, wine]));
  const seedIds = new Set(seedWines.map((wine) => wine.id));
  const mergedSeed = seedWines.map((seedWine) => {
    const savedWine = savedById.get(seedWine.id);
    if (!savedWine) return normalizeWine(seedWine);
    return normalizeWine({
      ...savedWine,
      ...seedWine,
      cellarOverride: savedWine.cellarOverride ?? seedWine.cellarOverride,
      zoneOverride: savedWine.zoneOverride ?? seedWine.zoneOverride,
      placementPriority: savedWine.placementPriority ?? seedWine.placementPriority,
      bottlePlacements: savedWine.bottlePlacements ?? seedWine.bottlePlacements,
      archivedAt: savedWine.archivedAt ?? seedWine.archivedAt,
      archivedReason: savedWine.archivedReason ?? seedWine.archivedReason,
      status: savedWine.archivedAt ? savedWine.status : seedWine.status ?? savedWine.status,
      averagePrice: seedWine.averagePrice,
      estimatedPrice: seedWine.estimatedPrice,
      priceEstimate: seedWine.priceEstimate,
    });
  });
  const addedWines = savedWines.filter((wine) => !seedIds.has(wine.id));
  return applyCellarPlacement([...mergedSeed, ...addedWines]);
}

function loadWines() {
  const storedVersion = Number(localStorage.getItem(WINE_VERSION_STORAGE_KEY) || 0);
  lastWineStateVersion = Number.isSafeInteger(storedVersion) && storedVersion > 0 ? storedVersion : 0;
  const saved = localStorage.getItem(WINE_STORAGE_KEY);
  if (!saved) return applyCellarPlacement(seedWines);
  return mergeSavedWines(JSON.parse(saved).map(normalizeWine));
}

function loadArchive() {
  const saved = localStorage.getItem(ARCHIVE_STORAGE_KEY);
  const archive = saved ? JSON.parse(saved) : seedArchive;
  return archive.map(normalizeArchiveEntry);
}

function loadStoredList(key, fallback) {
  const saved = localStorage.getItem(key);
  return saved ? JSON.parse(saved) : fallback;
}

function saveWinesLocally(wines, version = lastWineStateVersion) {
  localStorage.setItem(WINE_STORAGE_KEY, JSON.stringify(wines.map(normalizeWine)));
  localStorage.setItem(WINE_VERSION_STORAGE_KEY, String(version));
}

function nextWineStateVersion() {
  lastWineStateVersion = Math.max(lastWineStateVersion + 1, Date.now() * 1000);
  return lastWineStateVersion;
}

async function loadRemoteWines() {
  const response = await fetch(CELLAR_STATE_API, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error("Unable to load cellar state.");
  const data = await response.json();
  if (!Array.isArray(data.wines)) return null;
  return {
    wines: mergeSavedWines(data.wines.map(normalizeWine)),
    version: Number(data.version || 0),
  };
}

async function saveWines(wines) {
  const version = nextWineStateVersion();
  saveWinesLocally(wines, version);
  const response = await fetch(CELLAR_STATE_API, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ wines: wines.map(normalizeWine), version }),
  });
  if (!response.ok) throw new Error("Unable to save cellar state.");
}

function saveArchive(archive) {
  localStorage.setItem(ARCHIVE_STORAGE_KEY, JSON.stringify(archive.map(normalizeArchiveEntry)));
}

function normalizeArchiveEntry(entry) {
  const wine = normalizeWine({ ...(entry.wine || {}), quantity: Number(entry.wine?.quantity || 1) || 1 });
  return {
    id: entry.id || `${wine.id || "archive"}-${entry.consumedAt || Date.now()}`,
    consumedAt: entry.consumedAt || new Date().toISOString(),
    reason: entry.reason || "",
    ...entry,
    wine,
  };
}

function saveStoredList(key, list) {
  localStorage.setItem(key, JSON.stringify(list));
}

function zoneLabel(zone) {
  if (zone === "fullRed") return "Red racks";
  return zone === "top" ? "White racks" : "Red racks";
}

function racksForZone(zone) {
  return zone === "fullRed" ? FULL_RED_LAYOUT : (COOLER_LAYOUT[zone] || []);
}

function zoneCapacity(zone) {
  return ZONE_CAPACITY[zone] || 0;
}

function getSlotMeta(zone, slot) {
  let remaining = slot;
  const prefix = zone === "top" ? "W" : "R";
  const rackType = zone === "top" ? "White" : "Red";
  for (const rack of racksForZone(zone)) {
    if (remaining <= rack.capacity) {
      return {
        rack: rack.rack,
        position: remaining,
        capacity: rack.capacity,
        label: `${rackType} ${rack.rack}`,
        slotLabel: `${rackType} ${rack.rack} · Slot ${remaining}`,
        shortLabel: `${prefix}${rack.rack}-${remaining}`,
      };
    }
    remaining -= rack.capacity;
  }
  return { rack: null, position: slot, capacity: zoneCapacity(zone), label: "Overflow", slotLabel: "Overflow", shortLabel: `${prefix}+${slot}` };
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

function cellarSearchText(wine) {
  const meta = getSlotMeta(wine.zone, wine.slot);
  return [
    wineSearchText(wine),
    wine.cellar === 1 ? "left cellar" : "right cellar",
    zoneLabel(wine.zone),
    meta.slotLabel,
    meta.shortLabel,
    money(averagePrice(wine)),
    String(averagePrice(wine)),
    `${Number(wine.quantity || 0)} bottles`,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function matchesCellarSearch(wine, query) {
  return !query.trim() || cellarSearchText(wine).includes(query.trim().toLowerCase());
}

function filterWines(wines, filters) {
  return wines
    .filter((wine) => {
      const textMatch = !filters.text || wineSearchText(wine).includes(filters.text.toLowerCase());
      const categoryMatch = filters.category === "All" || wine.category === filters.category;
      const countryMatch = filters.country === "All" || wine.country === filters.country;
      const regionMatch = filters.region === "All" || wine.region === filters.region || regionName(wine) === filters.region;
      const badgeMatch = filters.badge === "All" || regionSignal(regionName(wine), [wine]).code === filters.badge;
      const numericVintage = Number(wine.vintage || 0);
      const vintage = Number.isFinite(numericVintage) ? numericVintage : 0;
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
  if (wine.vineyardNotes) return wine.vineyardNotes;
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

function sortProducerVintage(a, b) {
  return (
    String(a.producer || "").localeCompare(String(b.producer || "")) ||
    Number(b.vintage || 0) - Number(a.vintage || 0) ||
    String(a.wineName || "").localeCompare(String(b.wineName || ""))
  );
}

function sortRegionProducerVintage(a, b) {
  return (
    regionName(a).localeCompare(regionName(b)) ||
    sortProducerVintage(a, b)
  );
}

function groupByPrice(wines) {
  const bands = [
    ["Under $50", (price) => price < 50],
    ["$50-$99", (price) => price >= 50 && price < 100],
    ["$100-$199", (price) => price >= 100 && price < 200],
    ["$200+", (price) => price >= 200],
  ];
  return bands.map(([title, test]) => ({
    title,
    wines: wines
      .filter((wine) => test(averagePrice(wine)))
      .sort((a, b) => averagePrice(b) - averagePrice(a) || Number(b.vintage || 0) - Number(a.vintage || 0) || String(a.producer || "").localeCompare(String(b.producer || ""))),
  }));
}

function groupByType(wines) {
  const order = ["Red", "White", "Sparkling", "Rosé", "Rose", "Dessert", "Other"];
  return ["Red", "White", "Sparkling", "Rosé", "Dessert", "Other"].map((title) => ({
    title,
    wines: wines
      .filter((wine) => {
        const category = wine.category || "Other";
        if (title === "Rosé") return category === "Rosé" || category === "Rose";
        if (title === "Other") return !order.includes(category);
        return category === title;
      })
      .sort(sortRegionProducerVintage),
  }));
}

function groupByVintage(wines) {
  const groups = wines.reduce((acc, wine) => {
    const key = wine.vintage || "NV";
    acc[key] = [...(acc[key] || []), wine];
    return acc;
  }, {});
  return Object.entries(groups)
    .sort(([a], [b]) => {
      if (a === "NV") return 1;
      if (b === "NV") return -1;
      return Number(b) - Number(a);
    })
    .map(([title, items]) => ({
      title,
      wines: items.sort((a, b) => averagePrice(b) - averagePrice(a) || sortProducerVintage(a, b)),
    }));
}

function groupByRegion(wines) {
  const groups = wines.reduce((acc, wine) => {
    const key = regionName(wine) || wine.region || "Region pending";
    acc[key] = [...(acc[key] || []), wine];
    return acc;
  }, {});
  return Object.entries(groups)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([title, items]) => ({
      title,
      wines: items.sort((a, b) => String(a.category || "").localeCompare(String(b.category || "")) || sortProducerVintage(a, b)),
    }));
}

function tastingNotesList(wines) {
  return [...wines].sort((a, b) => (
    String(a.category || "").localeCompare(String(b.category || "")) ||
    regionName(a).localeCompare(regionName(b)) ||
    sortProducerVintage(a, b)
  ));
}

function summarizePrintGroups(groups) {
  return groups
    .filter((group) => group.wines.length)
    .map((group) => {
      const bottles = group.wines.reduce((sum, wine) => sum + Number(wine.quantity || 0), 0);
      const value = group.wines.reduce((sum, wine) => sum + averagePrice(wine) * Number(wine.quantity || 0), 0);
      const notable = [...group.wines].sort((a, b) => averagePrice(b) - averagePrice(a))[0];
      return {
        group: group.title,
        bottles,
        value,
        notable: notable ? `${notable.vintage || "NV"} ${notable.producer}` : "None",
        action: group.title === "NV" ? "Confirm vintage when possible" : bottles >= 8 ? "Monitor cellar balance" : "Maintain placement",
      };
    });
}

function topValueWines(wines, limit = 10) {
  return [...wines]
    .sort((a, b) => averagePrice(b) - averagePrice(a) || sortProducerVintage(a, b))
    .slice(0, limit);
}

function drinkSoonWines(wines, limit = 10) {
  return [...wines]
    .filter((wine) => drinkWindowStatus(wine) !== "Hold")
    .sort((a, b) => String(drinkWindowStatus(a)).localeCompare(String(drinkWindowStatus(b))) || averagePrice(b) - averagePrice(a))
    .slice(0, limit);
}

function cellarLocationLabel(wine) {
  const meta = getSlotMeta(wine.zone, wine.slot);
  return `${wine.cellar === 1 ? "Left Cellar" : "Right Cellar"} · ${zoneLabel(wine.zone)} · ${meta.shortLabel}`;
}

function cellarBookRegionLine(wine) {
  return [wine.region, wine.country].filter(Boolean).join(" · ") || "Region pending";
}

function cellarBookVarietyLine(wine) {
  return [wine.variety || "Blend", wine.category || "Wine"].filter(Boolean).join(" · ");
}

function getCellarBookStats(wines) {
  const bottles = wines.reduce((sum, wine) => sum + Number(wine.quantity || 0), 0);
  const value = wines.reduce((sum, wine) => sum + averagePrice(wine) * Number(wine.quantity || 0), 0);
  const regions = Array.from(new Set(wines.map((wine) => regionName(wine)).filter(Boolean)));
  const typeCounts = wines.reduce((acc, wine) => {
    const type = wine.category || "Other";
    acc[type] = (acc[type] || 0) + Number(wine.quantity || 0);
    return acc;
  }, {});
  const cellarSplit = wines.reduce((acc, wine) => {
    const key = wine.cellar === 1 ? "Left Cellar" : "Right Cellar";
    acc[key] = (acc[key] || 0) + Number(wine.quantity || 0);
    return acc;
  }, {});
  const topRegions = Object.entries(wines.reduce((acc, wine) => {
    const key = regionName(wine);
    acc[key] = (acc[key] || 0) + Number(wine.quantity || 0);
    return acc;
  }, {}))
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6);
  const drinkStatus = wines.reduce((acc, wine) => {
    const status = drinkWindowStatus(wine);
    acc[status] = (acc[status] || 0) + Number(wine.quantity || 0);
    return acc;
  }, {});
  return {
    records: wines.length,
    bottles,
    value,
    averageBottleValue: bottles ? value / bottles : 0,
    redCount: typeCounts.Red || 0,
    whiteCount: typeCounts.White || 0,
    regions: regions.length,
    typeCounts,
    cellarSplit,
    topRegions,
    drinkStatus,
    priceBands: groupByPrice(wines).map((group) => ({
      title: group.title,
      bottles: group.wines.reduce((sum, wine) => sum + Number(wine.quantity || 0), 0),
      value: group.wines.reduce((sum, wine) => sum + averagePrice(wine) * Number(wine.quantity || 0), 0),
    })),
  };
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
  const [toast, setToast] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_STORAGE_KEY) || "light");
  const [showPrices, setShowPrices] = useState(true);
  const [placementUndo, setPlacementUndo] = useState(null);
  const toastTimer = useRef(null);
  const wineMutationCount = useRef(0);

  const activeWine = wines.find((wine) => wine.id === activeWineId) || wines[0];
  const cellarSequence = useMemo(() => cellarOrderedWines(wines), [wines]);

  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);
  useEffect(() => {
    let cancelled = false;
    const localWines = wines;
    const initialMutationCount = wineMutationCount.current;

    loadRemoteWines()
      .then((remoteState) => {
        if (cancelled || wineMutationCount.current !== initialMutationCount) return;
        if (remoteState && remoteState.version >= lastWineStateVersion) {
          lastWineStateVersion = remoteState.version;
          setWines(remoteState.wines);
          saveWinesLocally(remoteState.wines, remoteState.version);
          return;
        }
        saveWines(localWines).catch(() => {});
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);
  const stats = useMemo(() => {
    const bottles = wines.reduce((sum, wine) => sum + Number(wine.quantity || 0), 0);
    const value = wines.reduce((sum, wine) => sum + averagePrice(wine) * Number(wine.quantity || 0), 0);
    const capacity = CELLAR_CAPACITY * 2;
    const cellar1 = wines.filter((wine) => wine.cellar === 1);
    const cellar2 = wines.filter((wine) => wine.cellar === 2);
    const cellar1Bottles = cellar1.reduce((sum, wine) => sum + Number(wine.quantity || 0), 0);
    const cellar2Bottles = cellar2.reduce((sum, wine) => sum + Number(wine.quantity || 0), 0);
    return {
      records: wines.length,
      bottles,
      value,
      capacity,
      openSlots: Math.max(0, capacity - bottles),
      cellar1: cellar1Bottles,
      cellar2: cellar2Bottles,
      cellar1Bottles,
      cellar2Bottles,
      lowStock: wines.filter((wine) => Number(wine.quantity || 0) <= 1).length,
    };
  }, [wines]);

  function showToast(message, action = null, duration = 2800) {
    setToast({ message, action });
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), duration);
  }

  function persistWines(nextWines) {
    const placed = applyCellarPlacement(nextWines);
    wineMutationCount.current += 1;
    setWines(placed);
    saveWines(placed).catch(() => showToast("Saved on this device, but cloud sync failed."));
    return placed;
  }

  function undoPlacement(snapshot = placementUndo) {
    if (!snapshot) return;
    const placed = applyCellarPlacement(snapshot);
    wineMutationCount.current += 1;
    setWines(placed);
    saveWines(placed).catch(() => showToast("Restored on this device, but cloud sync failed."));
    setPlacementUndo(null);
    showToast("Placement restored.");
  }

  function moveWinePlacement(sourceInstanceId, target) {
    const source = cellarBottleRecords(wines).find((record) => record.instanceId === sourceInstanceId);
    if (!source) return;
    const previousWines = wines;
    const next = reorderBottlePlacement(wines, sourceInstanceId, target);
    const placed = persistWines(next);
    const movedWine = placed.find((wine) => wine.id === source.wineId);
    if (movedWine) setActiveWineId(movedWine.id);
    setPlacementUndo(previousWines);
    showToast(
      target.targetInstanceId ? "Cellar slots swapped." : "Placement saved.",
      { label: "Undo", onClick: () => undoPlacement(previousWines) },
      8000,
    );
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
    if (!window.confirm(`Archive one consumed bottle of ${wineTitle(wine)}?`)) return;
    const archivedWine = normalizeWine({
      ...wine,
      quantity: 1,
      status: "Consumed",
    });
    const consumed = {
      id: `${id}-${Date.now()}`,
      consumedAt: new Date().toISOString(),
      wine: archivedWine,
    };
    const nextArchive = [consumed, ...archive];
    const nextWines = wine.quantity > 1
      ? wines.map((item) => {
        if (item.id !== id) return item;
        const quantity = Math.max(1, Number(item.quantity || 1));
        const bottlePlacements = Array.isArray(item.bottlePlacements)
          ? item.bottlePlacements.filter((placement) => Number(placement.bottleNumber) !== quantity)
          : item.bottlePlacements;
        return normalizeWine({ ...item, quantity: quantity - 1, bottlePlacements });
      })
      : wines.filter((item) => item.id !== id);
    const placed = persistWines(nextWines);
    setArchive(nextArchive);
    saveArchive(nextArchive);
    setActiveWineId(placed[0]?.id);
    setView("archive");
    showToast("Bottle archived in drink history.");
  }

  function restoreArchivedWine(entryId) {
    const entry = archive.find((item) => item.id === entryId);
    if (!entry?.wine) return;
    const archivedWine = normalizeWine(entry.wine);
    const existing = wines.find((wine) => wine.id === archivedWine.id);
    const restoredId = archivedWine.id || Math.max(0, ...wines.map((wine) => wine.id)) + 1;
    const nextWines = existing
      ? wines.map((wine) => (
        wine.id === existing.id
          ? normalizeWine({ ...wine, quantity: Number(wine.quantity || 0) + 1, status: "Ready" })
          : wine
      ))
      : [
        ...wines,
        normalizeWine({
          ...archivedWine,
          id: restoredId,
          quantity: 1,
          status: "Ready",
          dateAdded: archivedWine.dateAdded || new Date().toISOString().slice(0, 10),
        }),
      ];
    persistWines(nextWines);
    const nextArchive = archive.filter((item) => item.id !== entryId);
    setArchive(nextArchive);
    saveArchive(nextArchive);
    setActiveWineId(existing?.id || restoredId);
    setView("detail");
    showToast("Bottle restored to the cellar.");
  }

  function navigateActiveWine(direction) {
    if (!cellarSequence.length) return;
    const currentIndex = cellarSequence.findIndex((wine) => wine.id === activeWineId);
    const start = currentIndex >= 0 ? currentIndex : 0;
    const nextIndex = (start + direction + cellarSequence.length) % cellarSequence.length;
    const nextWine = cellarSequence[nextIndex];
    if (!nextWine) return;
    setActiveWineId(nextWine.id);
    setView("detail");
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
          <NavButton icon={<Printer />} active={view === "print"} onClick={() => setView("print")}>Cellar Book</NavButton>
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
            <button
              className="ghost-button global-price-toggle"
              type="button"
              onClick={() => setShowPrices((current) => !current)}
              aria-pressed={showPrices}
              title={showPrices ? "Hide prices" : "Show prices"}
            >
              {showPrices ? <EyeOff size={17} /> : <Eye size={17} />}
              {showPrices ? "Hide Prices" : "Show Prices"}
            </button>
            <button className="icon-button" title="Toggle dark mode" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button className="icon-button" title="Add bottle" onClick={() => setScanOpen(true)}>
              <Plus size={20} />
            </button>
          </div>
        </header>

        {view === "dashboard" && <Dashboard stats={stats} wines={wines} openWine={(id) => { setActiveWineId(id); setView("detail"); }} setView={setView} openTool={openTool} />}
        {view === "cellars" && <Cellars wines={wines} openWine={(id) => { setActiveWineId(id); setView("detail"); }} showPrices={showPrices} moveWinePlacement={moveWinePlacement} undoPlacement={undoPlacement} canUndoPlacement={Boolean(placementUndo)} />}
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
        {view === "print" && <LuxuryCellarBook wines={wines} />}
        {view === "archive" && <ArchivePage archive={archive} onRestore={restoreArchivedWine} />}
        {view === "detail" && activeWine && (
          <WineDetail
            wine={activeWine}
            back={() => setView("collection")}
            onDrink={drinkWine}
            onUpdate={updateWine}
            onNavigate={navigateActiveWine}
            sequence={cellarSequence}
          />
        )}

        <footer className="site-footer">
          <strong>{BRAND_NAME}</strong>
          <span>Private wine cellar planning, organization, and collection oversight.</span>
        </footer>
      </main>

      {scanOpen && <ScanDrawer wines={wines} onClose={() => setScanOpen(false)} onSave={upsertWine} />}
      {toast && (
        <div className="toast">
          <span>{toast.message}</span>
          {toast.action && (
            <button type="button" onClick={toast.action.onClick}>
              <RotateCcw size={14} />
              {toast.action.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function topbarTitle(view) {
  if (view === "dashboard") return BRAND_NAME;
  if (view === "cellars") return "Cellar Map";
  if (view === "tools") return "Cellar Tools";
  if (view === "detail") return "Bottle Details";
  if (view === "specs") return "Cellar Specs";
  if (view === "print") return "Cellar Book";
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
        <div className="hero-actions">
          <button className="primary-link" onClick={() => setView("cellars")}>Open Cellar Map</button>
          <button className="ghost-button" onClick={() => setView("collection")}>Search Wines</button>
        </div>
      </section>

      <section className="metric-panel">
        <Metric label="Entered Records" value={stats.records} />
        <Metric label="Physical Capacity" value={`${stats.bottles}/${stats.capacity}`} note={`${stats.openSlots} open slots`} />
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
          <Metric label="Left Cellar" value={stats.cellar1} note="$50 and under bottle slots" />
          <Metric label="Right Cellar" value={stats.cellar2} note="Over $50 bottle slots" />
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
          <small>{wine.category} · {money(averagePrice(wine))} · {wine.cellar === 1 ? "Left" : "Right"} · {getSlotMeta(wine.zone, wine.slot).slotLabel}</small>
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

const CELLAR_BOOK_STYLES = [
  "Full Cellar Book",
  "By Price",
  "By Type",
  "By Vintage",
  "By Region",
  "Tasting Notes",
];

function PrintableCellarBook({ wines }) {
  const [reportStyle, setReportStyle] = useState("Full Cellar Book");
  const [showPrices, setShowPrices] = useState(true);
  const [showNotes, setShowNotes] = useState(false);
  const [showLocation, setShowLocation] = useState(true);
  const [reportDensity, setReportDensity] = useState("Catalogue");
  const stats = useMemo(() => getCellarBookStats(wines), [wines]);
  const generatedAt = useMemo(() => new Date(), []);
  const options = { showPrices, showNotes, showLocation, detailed: reportDensity === "Detailed Notes" || reportStyle === "Tasting Notes" };
  const singleReport = {
    "By Price": { title: "By Price", groups: groupByPrice(wines), kicker: "Value tiers" },
    "By Type": { title: "By Type", groups: groupByType(wines), kicker: "Cellar inventory" },
    "By Vintage": { title: "By Vintage", groups: groupByVintage(wines), kicker: "Vintage reference" },
    "By Region": { title: "By Region", groups: groupByRegion(wines), kicker: "Regional index" },
    "Tasting Notes": { title: "Tasting Notes", groups: [{ title: "Cellar Tasting Notes", wines: tastingNotesList(wines) }], kicker: "Service notes", forceNotes: true },
  }[reportStyle];

  return (
    <div className="cellar-book-view">
      <PrintToolbar
        reportStyle={reportStyle}
        setReportStyle={setReportStyle}
        showPrices={showPrices}
        setShowPrices={setShowPrices}
        showNotes={showNotes}
        setShowNotes={setShowNotes}
        showLocation={showLocation}
        setShowLocation={setShowLocation}
        reportDensity={reportDensity}
        setReportDensity={setReportDensity}
      />
      <div className={`cellar-book ${options.detailed ? "detailed-notes" : "catalogue"}`}>
        <CellarBookCover stats={stats} generatedAt={generatedAt} />
        {reportStyle === "Full Cellar Book" ? (
          <>
            <CellarBookSummary stats={stats} wines={wines} showPrices={showPrices} />
            <CellarBookIndex stats={stats} wines={wines} showPrices={showPrices} />
            <PrintSection
              title="Primary Inventory by Type"
              kicker="Cellar inventory"
              groups={groupByType(wines)}
              options={options}
              summary={`${stats.bottles} bottles · ${showPrices ? `${money(stats.value)} estimated value` : `${stats.records} records`}`}
            />
            <PrintAppendixTable title="Appendix A: Region Summary" kicker="Regional overview" rows={summarizePrintGroups(groupByRegion(wines))} showPrices={showPrices} />
            <PrintAppendixTable title="Appendix B: Vintage Summary" kicker="Vintage overview" rows={summarizePrintGroups(groupByVintage(wines))} showPrices={showPrices} />
            <PrintAppendixTable title="Appendix C: Price Summary" kicker="Value overview" rows={summarizePrintGroups(groupByPrice(wines))} showPrices={showPrices} />
          </>
        ) : (
          <>
            <CellarBookMiniHeader reportStyle={reportStyle} stats={stats} generatedAt={generatedAt} showPrices={showPrices} />
            <PrintSection
              title={singleReport.title}
              kicker={singleReport.kicker}
              groups={singleReport.groups}
              options={options}
              forceNotes={singleReport.forceNotes}
              summary={`${stats.bottles} bottles${showPrices ? ` · ${money(stats.value)} estimated value` : ""}`}
            />
          </>
        )}
      </div>
    </div>
  );
}

function PrintToolbar({
  reportStyle,
  setReportStyle,
  showPrices,
  setShowPrices,
  showNotes,
  setShowNotes,
  showLocation,
  setShowLocation,
  reportDensity,
  setReportDensity,
}) {
  return (
    <div className="print-toolbar">
      <div>
        <p className="eyebrow">Printable cellar inventory</p>
        <h2>Cellar Book</h2>
      </div>
      <label>
        Report style
        <select value={reportStyle} onChange={(event) => setReportStyle(event.target.value)}>
          {CELLAR_BOOK_STYLES.map((style) => <option key={style}>{style}</option>)}
        </select>
      </label>
      <label className="toggle-line"><input type="checkbox" checked={showPrices} onChange={(event) => setShowPrices(event.target.checked)} /> Show prices</label>
      <label className="toggle-line"><input type="checkbox" checked={showNotes} onChange={(event) => setShowNotes(event.target.checked)} /> Show tasting notes</label>
      <label className="toggle-line"><input type="checkbox" checked={showLocation} onChange={(event) => setShowLocation(event.target.checked)} /> Show cellar location</label>
      <label>
        Report density
        <select value={reportDensity} onChange={(event) => setReportDensity(event.target.value)}>
          <option>Catalogue</option>
          <option>Detailed Notes</option>
        </select>
      </label>
      <button className="primary-link print-button" type="button" onClick={() => window.print()}>
        <Printer size={18} />
        Print
      </button>
      <p className="print-dialog-note">For cleanest PDF: turn off browser Headers and Footers.</p>
    </div>
  );
}

function CellarBookCover({ stats, generatedAt }) {
  return (
    <section className="print-page cellar-book-cover">
      <div className="cover-inner">
        <div className="cover-mark">LC</div>
        <p className="cover-eyebrow">Private Cellar Management</p>
        <div className="cover-rule" />
        <h1 className="cover-title">Lynn Cave Privée</h1>
        <h2 className="cover-subtitle">Private Cellar Book</h2>
        <div className="cover-rule" />
        <p className="cover-meta">Generated {generatedAt.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}</p>
        <div className="cover-stat-line">
          <span>{stats.bottles} bottles</span>
          <span>{stats.regions} regions</span>
          <span>{money(stats.value)} estimated value</span>
        </div>
        <footer>Private wine cellar planning, organization, and collection oversight.</footer>
      </div>
    </section>
  );
}

function CellarBookSummary({ stats, wines, showPrices }) {
  return (
    <section className="print-page cellar-book-summary">
      <PrintRunningHeader />
      <div className="print-section-header">
        <p className="print-page-kicker">Collection overview</p>
        <h2 className="print-page-title">Collection Summary</h2>
        <p>{stats.bottles} bottles across {stats.records} records · {stats.regions} represented regions</p>
      </div>
      <div className="print-summary-grid">
        <PrintMetric label="Total Records" value={stats.records} />
        <PrintMetric label="Total Bottles" value={stats.bottles} />
        <PrintMetric label="Estimated Value" value={showPrices ? money(stats.value) : "Hidden"} />
        <PrintMetric label="Average Bottle" value={showPrices ? money(stats.averageBottleValue) : "Hidden"} />
        <PrintMetric label="Red Bottles" value={stats.redCount} />
        <PrintMetric label="White Bottles" value={stats.whiteCount} />
        <PrintMetric label="Regions" value={stats.regions} />
      </div>
      <div className="print-index-grid">
        <PrintSummaryBlock title="Collection Value by Price Band">
          {stats.priceBands.map((band) => (
            <PrintSummaryLine key={band.title} label={band.title} value={`${band.bottles} bottles${showPrices ? ` · ${money(band.value)}` : ""}`} />
          ))}
        </PrintSummaryBlock>
        <PrintSummaryBlock title="Bottle Count by Type">
          {Object.entries(stats.typeCounts).sort(([a], [b]) => a.localeCompare(b)).map(([type, count]) => (
            <PrintSummaryLine key={type} label={type} value={`${count} bottles`} />
          ))}
        </PrintSummaryBlock>
        <PrintSummaryBlock title="Top Regions">
          {stats.topRegions.map(([region, count]) => (
            <PrintSummaryLine key={region} label={region} value={`${count} bottles`} />
          ))}
        </PrintSummaryBlock>
        <PrintSummaryBlock title="Drink Soon / Hold">
          {["Ready", "Soon", "Hold"].map((status) => (
            <PrintSummaryLine key={status} label={status} value={`${stats.drinkStatus[status] || 0} bottles`} />
          ))}
        </PrintSummaryBlock>
        <PrintSummaryBlock title="Cellar Split">
          {["Left Cellar", "Right Cellar"].map((cellar) => (
            <PrintSummaryLine key={cellar} label={cellar} value={`${stats.cellarSplit[cellar] || 0} bottles`} />
          ))}
        </PrintSummaryBlock>
        <PrintSummaryBlock title="Report Notes">
          <p className="print-muted">Inventory reflects current app records and bottle quantities. Placement follows the cellar rack assignment shown in the cellar map.</p>
          <p className="print-muted">{wines.length} cellar records are included in this report.</p>
        </PrintSummaryBlock>
      </div>
    </section>
  );
}

function CellarBookIndex({ stats, wines, showPrices }) {
  const valuable = topValueWines(wines, 10);
  const soon = drinkSoonWines(wines, 10);
  return (
    <section className="print-page cellar-book-index">
      <PrintRunningHeader />
      <div className="print-section-header">
        <p className="print-page-kicker">Quick reference</p>
        <h2 className="print-page-title">Cellar Index</h2>
        <p>Left Cellar holds white and lower-price working bottles. Right Cellar holds red collection bottles and higher-value placements.</p>
      </div>
      <div className="print-index-grid">
        <PrintSummaryBlock title="Cellar Split">
          {["Left Cellar", "Right Cellar"].map((cellar) => (
            <PrintSummaryLine key={cellar} label={cellar} value={`${stats.cellarSplit[cellar] || 0} bottles`} />
          ))}
          <PrintSummaryLine label="White racks" value="Left Cellar upper racks" />
          <PrintSummaryLine label="Red racks" value="Right Cellar red racks" />
        </PrintSummaryBlock>
        <PrintSummaryBlock title="Placement Logic">
          <p className="print-muted">White and dessert wines are held together for service access. Reds are ordered by bottle value within cellar zones, low to high.</p>
          <p className="print-muted">Quantity changes total collection value, while physical slot order follows unit bottle value.</p>
        </PrintSummaryBlock>
        <PrintSummaryBlock title="Top 10 Most Valuable">
          {valuable.map((wine) => (
            <PrintSummaryLine key={`valuable-${wine.id}`} label={`${wine.vintage || "NV"} ${wine.producer}`} value={showPrices ? money(averagePrice(wine)) : `Qty ${wine.quantity}`} />
          ))}
        </PrintSummaryBlock>
        <PrintSummaryBlock title="Drink Soon">
          {soon.length ? soon.map((wine) => (
            <PrintSummaryLine key={`soon-${wine.id}`} label={`${wine.vintage || "NV"} ${wine.producer}`} value={inferDrinkWindow(wine)} />
          )) : <p className="print-muted">No urgent drink-soon bottles flagged.</p>}
        </PrintSummaryBlock>
      </div>
    </section>
  );
}

function CellarBookMiniHeader({ reportStyle, stats, generatedAt, showPrices }) {
  return (
    <section className="print-page print-mini-cover">
      <PrintRunningHeader />
      <div className="print-section-header">
        <p className="print-page-kicker">Private cellar report</p>
        <h2 className="print-page-title">{reportStyle}</h2>
        <p>{generatedAt.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })} · {stats.bottles} bottles{showPrices ? ` · ${money(stats.value)} estimated value` : ""}</p>
      </div>
    </section>
  );
}

function PrintMetric({ label, value }) {
  return (
    <div className="print-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function PrintSummaryBlock({ title, children }) {
  return (
    <article className="print-summary-block">
      <h3>{title}</h3>
      {children}
    </article>
  );
}

function PrintSummaryLine({ label, value }) {
  return (
    <div className="print-summary-line">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function PrintSection({ title, groups, options, forceNotes = false, kicker = "Cellar inventory", summary = "" }) {
  return (
    <section className="print-page print-section">
      <PrintRunningHeader />
      <div className="print-section-header">
        <p className="print-page-kicker">{kicker}</p>
        <h2 className="print-page-title">{title}</h2>
        {summary && <p>{summary}</p>}
      </div>
      {groups.filter((group) => group.wines.length).map((group) => (
        <div className="print-group" key={group.title}>
          <div className="print-group-header">
            <h3>{group.title}</h3>
            <span className="print-group-count">{group.wines.reduce((sum, wine) => sum + Number(wine.quantity || 0), 0)} bottles</span>
          </div>
          <div className="print-wine-list">
            {group.wines.map((wine) => (
              <PrintWineRow key={`${title}-${group.title}-${wine.id}`} wine={wine} options={options} forceNotes={forceNotes} />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

function PrintRunningHeader() {
  return (
    <div className="print-page-header">
      <span>Lynn Cave Privée</span>
      <span>Private Cellar Book</span>
    </div>
  );
}

function PrintWineRow({ wine, options, forceNotes = false }) {
  const notes = inferNotes(wine);
  return (
    <article className="print-wine-row">
      <div className="print-vintage-badge">{wine.vintage || "NV"}</div>
      <div className="print-wine-main">
        <h3 className="print-producer">{wine.producer || "Unknown Producer"}</h3>
        <p className="print-wine-name">{wine.wineName || "Unnamed wine"}</p>
        <p className="print-wine-meta">{cellarBookRegionLine(wine)}</p>
        <p className="print-wine-meta">{cellarBookVarietyLine(wine)} · Drink window {inferDrinkWindow(wine)}</p>
      </div>
      <div className="print-wine-right">
        <span className="print-qty">Qty {wine.quantity || 1}</span>
        {options.showPrices && <span className="print-price">{money(averagePrice(wine))}</span>}
        {options.showLocation && <span className="print-slot">{cellarLocationLabel(wine)}</span>}
      </div>
      {(options.showNotes || options.detailed || forceNotes) && <p className="print-note">{options.detailed || forceNotes ? notes : notes.split(".")[0] + "."}</p>}
    </article>
  );
}

function PrintAppendixTable({ title, kicker, rows, showPrices }) {
  return (
    <section className="print-page print-section print-appendix">
      <PrintRunningHeader />
      <div className="print-section-header">
        <p className="print-page-kicker">{kicker}</p>
        <h2 className="print-page-title">{title}</h2>
      </div>
      <table className="print-appendix-table">
        <thead>
          <tr>
            <th>Group</th>
            <th>Bottles</th>
            {showPrices && <th>Total Value</th>}
            <th>Notable Bottle</th>
            <th>Suggested Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.group}>
              <td>{row.group}</td>
              <td>{row.bottles}</td>
              {showPrices && <td>{money(row.value)}</td>}
              <td>{row.notable}</td>
              <td>{row.action}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function Cellars({ wines, openWine, showPrices, moveWinePlacement, undoPlacement, canUndoPlacement }) {
  const [cellarQueries, setCellarQueries] = useState({ 1: "", 2: "" });
  const [draggingInstanceId, setDraggingInstanceId] = useState(null);
  const [selectedInstanceId, setSelectedInstanceId] = useState(null);
  const [dropTarget, setDropTarget] = useState("");

  function setCellarQuery(cellar, value) {
    setCellarQueries((current) => ({ ...current, [cellar]: value }));
  }

  function handleSlotDrop(event, target) {
    event.preventDefault();
    const sourceId = event.dataTransfer.getData("text/plain") || draggingInstanceId;
    setDropTarget("");
    setDraggingInstanceId(null);
    if (!sourceId) return;
    moveWinePlacement(sourceId, target);
  }

  function handleSlotSelect(target) {
    if (selectedInstanceId) {
      if (selectedInstanceId !== target.targetInstanceId) {
        moveWinePlacement(selectedInstanceId, target);
      }
      setSelectedInstanceId(null);
      return;
    }
    if (target.targetInstanceId) setSelectedInstanceId(target.targetInstanceId);
  }

  return (
    <div className="cellars-page">
      <div className="cellar-actions">
        <button className="ghost-button" type="button" onClick={() => undoPlacement()} disabled={!canUndoPlacement}>
          <RotateCcw size={16} />
          Undo last placement
        </button>
        {selectedInstanceId && (
          <button className="ghost-button" type="button" onClick={() => setSelectedInstanceId(null)}>
            <X size={16} />
            Cancel move
          </button>
        )}
      </div>
      {selectedInstanceId && (
        <div className="placement-hint">
          Bottle selected. Click any destination slot to move it, or click another bottle to swap.
        </div>
      )}
      <CellarRules />
      {[1, 2].map((cellar) => {
        const query = cellarQueries[cellar] || "";
        const cellarBottles = cellarBottleRecords(wines).filter((record) => record.cellar === cellar);
        const matchingBottles = query.trim() ? cellarBottles.filter((record) => matchesCellarSearch(record.wine, query)) : cellarBottles;

        return (
          <section className="cellar-shell" key={cellar}>
            <div className="cellar-header">
              <div>
                <p className="eyebrow">{cellar === 1 ? "All whites + value reds" : "$50+ reds only"}</p>
                <h2>{cellar === 1 ? "Left Cellar" : "Right Cellar"}</h2>
              </div>
              <span className="pill">{cellarBottles.length}/{CELLAR_CAPACITY} bottle slots filled</span>
            </div>
            <div className="cellar-search-panel">
              <div className="cellar-search-field">
                <Search size={18} />
                <input
                  value={query}
                  onChange={(event) => setCellarQuery(cellar, event.target.value)}
                  placeholder={`Search ${cellar === 1 ? "left" : "right"} cellar`}
                />
                {query && <button type="button" onClick={() => setCellarQuery(cellar, "")} title="Clear search"><X size={16} /></button>}
              </div>
              <span>{query.trim() ? `${matchingBottles.length} of ${cellarBottles.length} bottles matched` : "Search by wine, region, price, rack, or slot"}</span>
            </div>
            <div className="cellar-layout">
              {cellar === 1 ? (
                <>
                  <Zone title="White Racks" cellar={cellar} zone="top" wines={wines} openWine={openWine} showPrices={showPrices} searchQuery={query} draggingInstanceId={draggingInstanceId} selectedInstanceId={selectedInstanceId} setDraggingInstanceId={setDraggingInstanceId} setSelectedInstanceId={setSelectedInstanceId} dropTarget={dropTarget} setDropTarget={setDropTarget} handleSlotDrop={handleSlotDrop} handleSlotSelect={handleSlotSelect} />
                  <Zone title="Red Racks Under $50" cellar={cellar} zone="bottom" wines={wines} openWine={openWine} showPrices={showPrices} searchQuery={query} draggingInstanceId={draggingInstanceId} selectedInstanceId={selectedInstanceId} setDraggingInstanceId={setDraggingInstanceId} setSelectedInstanceId={setSelectedInstanceId} dropTarget={dropTarget} setDropTarget={setDropTarget} handleSlotDrop={handleSlotDrop} handleSlotSelect={handleSlotSelect} />
                </>
              ) : (
                <Zone title="Red Racks $50+" cellar={cellar} zone="fullRed" wines={wines} openWine={openWine} showPrices={showPrices} searchQuery={query} draggingInstanceId={draggingInstanceId} selectedInstanceId={selectedInstanceId} setDraggingInstanceId={setDraggingInstanceId} setSelectedInstanceId={setSelectedInstanceId} dropTarget={dropTarget} setDropTarget={setDropTarget} handleSlotDrop={handleSlotDrop} handleSlotSelect={handleSlotSelect} />
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function CellarRules() {
  const rules = [
    ["Left", "All whites", "White, sparkling, rosé, and dessert bottles live in the left cellar."],
    ["Value reds", "$50 and under", "Reds priced at $50 or less stay in the left cellar under the whites."],
    ["Right", "$50+ reds", "The right cellar is now six racks of red wine priced above $50."],
    ["Slots", "8 per rack", "Each rack row has eight bottle positions from left to right."],
    ["Order", "Low to high price", "Within each zone, bottles are sorted from lowest price to highest price."],
    ["Move", "Click or drag", "Click a filled slot to pick it up, then click any destination slot to move or swap."],
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

function Zone({ title, cellar, zone, wines, openWine, showPrices, searchQuery = "", draggingInstanceId, selectedInstanceId, setDraggingInstanceId, setSelectedInstanceId, dropTarget, setDropTarget, handleSlotDrop, handleSlotSelect }) {
  const bottleSlots = cellarBottleRecords(wines).filter((record) => record.cellar === cellar && record.zone === zone);
  const zoneWines = wines.filter((wine) => bottleSlots.some((bottle) => bottle.wineId === wine.id));
  const rackType = zone === "top" ? "White" : "Red";
  const racks = racksForZone(zone);
  const capacity = zoneCapacity(zone);
  const overflowBottles = bottleSlots.filter((item) => item.slot > capacity);
  const overflowCount = Math.max(0, bottleSlots.length - capacity);
  const bottles = bottleSlots.length;
  const hasSearch = Boolean(searchQuery.trim());
  const matchedBottles = hasSearch ? bottleSlots.filter((item) => matchesCellarSearch(item.wine, searchQuery)).length : bottles;

  return (
    <div className="zone-card">
      <div className="zone-heading">
        <div>
          <h3>{title}</h3>
          <p>{racks.length} racks · 8 slots each</p>
        </div>
        <Thermometer size={18} />
      </div>
      <div className="rack-summary">
        <span>{Math.min(bottleSlots.length, capacity)}/{capacity} slots filled</span>
        <span>{bottles} bottle{bottles === 1 ? "" : "s"}</span>
        {hasSearch && <span>{matchedBottles} match{matchedBottles === 1 ? "" : "es"}</span>}
        <span>{money(bottleSlots.reduce((sum, bottle) => sum + averagePrice(bottle.wine), 0))} value</span>
      </div>
      {overflowCount > 0 && (
        <div className="overflow-warning">
          {title} are full. {overflowCount} bottle{overflowCount === 1 ? "" : "s"} in overflow.
        </div>
      )}
      <div className="rack-stack">
        {racks.map((rack, rackIndex) => {
          const slotOffset = racks.slice(0, rackIndex).reduce((sum, item) => sum + item.capacity, 0);
          return (
            <div className="rack-row" key={`${zone}-${rack.rack}`}>
              <div className="rack-label">
                <strong>{rackType} {rack.rack}</strong>
                <span>8 slots</span>
              </div>
              <div className="slot-grid">
                {Array.from({ length: rack.capacity }, (_, index) => {
                  const slot = slotOffset + index + 1;
                  const bottle = bottleSlots.find((item) => item.slot === slot);
                  const wine = bottle?.wine;
                  const meta = getSlotMeta(zone, slot);
                  const isSearchMatch = wine && matchesCellarSearch(wine, searchQuery);
                  const dropKey = `${cellar}-${zone}-${slot}`;
                  return (
                    <button
                      key={slot}
                      className={`slot ${wine ? "filled" : ""} ${selectedInstanceId && bottle?.instanceId === selectedInstanceId ? "selected" : ""} ${selectedInstanceId && bottle?.instanceId !== selectedInstanceId ? "placement-target" : ""} ${draggingInstanceId && bottle?.instanceId === draggingInstanceId ? "dragging" : ""} ${dropTarget === dropKey ? "drop-target" : ""} ${hasSearch && wine ? (isSearchMatch ? "search-match" : "search-muted") : ""}`}
                      draggable={Boolean(wine)}
                      onDragStart={(event) => {
                        if (!wine) return;
                        event.dataTransfer.setData("text/plain", bottle.instanceId);
                        event.dataTransfer.effectAllowed = "move";
                        setDraggingInstanceId(bottle.instanceId);
                      }}
                      onDragEnd={() => {
                        setDraggingInstanceId(null);
                        setDropTarget("");
                      }}
                      onDragOver={(event) => {
                        if (!draggingInstanceId) return;
                        event.preventDefault();
                        event.dataTransfer.dropEffect = "move";
                        setDropTarget(dropKey);
                      }}
                      onDragLeave={() => {
                        if (dropTarget === dropKey) setDropTarget("");
                      }}
                      onDrop={(event) => handleSlotDrop(event, { cellar, zone, slot, targetInstanceId: bottle?.instanceId })}
                      onClick={() => handleSlotSelect({ cellar, zone, slot, targetInstanceId: bottle?.instanceId })}
                      onDoubleClick={() => wine && openWine(wine.id)}
                      title={wine ? `${wineTitle(wine)}. Click to move, double-click for details.` : "Empty slot"}
                    >
                      <span className="slot-kicker">
                        <span className="slot-number">{meta.position}</span>
                        {wine && <span className="slot-vintage">{wine.vintage || "NV"}</span>}
                      </span>
                      {wine ? (
                        <>
                          <span className="slot-name">{wine.producer}</span>
                          {showPrices && <span className="slot-price">{money(averagePrice(wine))}</span>}
                        </>
                      ) : <span className="slot-empty">Empty</span>}
                      {wine && (
                        <span className="slot-hover">
                          <span className="slot-hover-photo">
                            {wine.frontPhoto ? <img src={photoUrl(wine.frontPhoto)} alt={`${wineTitle(wine)} front label`} /> : <Wine size={30} />}
                          </span>
                          <span className="slot-hover-copy">
                            <strong>{wineTitle(wine)}</strong>
                            <small>{wine.variety} · {wine.region}</small>
                            {bottle.bottleTotal > 1 && <small>Bottle {bottle.bottleNumber} of {bottle.bottleTotal}</small>}
                            <small>{cellar === 1 ? "Left" : "Right"} · {meta.slotLabel}</small>
                            <span>{money(averagePrice(wine))}</span>
                          </span>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      {overflowBottles.length > 0 && (
        <div className="overflow-list">
          <span>Overflow</span>
          {overflowBottles.map((bottle) => (
            <button key={bottle.id} onClick={() => openWine(bottle.wine.id)}>
              {wineTitle(bottle.wine)}
            </button>
          ))}
        </div>
      )}
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
              <span>{wine.cellar === 1 ? "Left" : "Right"} · {getSlotMeta(wine.zone, wine.slot).slotLabel}</span>
            </button>
          ))}
        </div>
      ) : (
        <EmptyState title="No wines match those filters" body="Clear a field or add a bottle from the scan flow." />
      )}
    </div>
  );
}

function WineDetail({ wine, back, onDrink, onUpdate, onNavigate, sequence = [] }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(() => formFromWine(wine));
  const currentIndex = sequence.findIndex((item) => item.id === wine.id);

  useEffect(() => {
    setDraft(formFromWine(wine));
    setEditing(false);
  }, [wine.id]);

  useEffect(() => {
    function handleKey(event) {
      const activeTag = document.activeElement?.tagName;
      const isTyping = ["INPUT", "TEXTAREA", "SELECT"].includes(activeTag);
      if (editing || isTyping || !onNavigate || sequence.length < 2) return;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        onNavigate(-1);
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        onNavigate(1);
      }
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [editing, onNavigate, sequence.length]);

  function saveEdit(event) {
    event.preventDefault();
    const updated = onUpdate(wine.id, wineFromForm(draft));
    setDraft(formFromWine(updated || wine));
    setEditing(false);
  }

  return (
    <div className="detail-page">
      <button className="back-button" onClick={back}><ChevronLeft size={18} /> Back to collection</button>
      {sequence.length > 1 && (
        <div className="detail-nav-inline" aria-label="Cellar order navigation">
          <button className="ghost-button" onClick={() => onNavigate?.(-1)}><ChevronLeft size={17} /> Previous</button>
          <span>Cellar order {currentIndex >= 0 ? currentIndex + 1 : 1} of {sequence.length}</span>
          <button className="ghost-button" onClick={() => onNavigate?.(1)}>Next <ChevronRight size={17} /></button>
        </div>
      )}

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
            <button className="archive-button" onClick={() => onDrink(wine.id)}><ArchiveIcon size={17} /> Archive Bottle</button>
          </div>
        </div>
      </section>

      <div className="detail-grid">
        <DetailCard title="Bottle Info">
          <Spec label="Average price" value={money(averagePrice(wine))} />
          {wine.priceEstimate && <Spec label="Workbook estimate" value={wine.priceEstimate} />}
          <Spec label="Quantity" value={wine.quantity} />
          <Spec label="Location" value={`${wine.cellar === 1 ? "Left Cellar" : "Right Cellar"}, ${getSlotMeta(wine.zone, wine.slot).slotLabel}`} />
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
    size: wine.size || "750ml",
    status: wine.status || "Ready",
    dateAdded: wine.dateAdded || "",
    estimatedPrice: averagePrice(wine),
    priceEstimate: wine.priceEstimate || "",
    quantity: wine.quantity || 1,
    frontPhoto: wine.frontPhoto || "",
    backPhoto: wine.backPhoto || "",
    sourceUrl: wine.sourceUrl || "",
    notes: wine.notes || "",
    vineyardNotes: wine.vineyardNotes || "",
    acquiredNotes: wine.acquiredNotes || "",
    rating: wine.rating || 0,
    tags: (wine.tags || []).join(", "),
    criticRatings: criticRatingsToText(wine.criticRatings || []),
    appearance: wine.tastingNotes?.appearance || "",
    nose: wine.tastingNotes?.nose || "",
    palate: wine.tastingNotes?.palate || "",
    finish: wine.tastingNotes?.finish || "",
    cellar: wine.cellar || "",
    zone: wine.zone || "",
    slot: wine.slot || "",
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
    size: draft.size || "750ml",
    status: draft.status || "Ready",
    dateAdded: draft.dateAdded,
    estimatedPrice: Number(draft.estimatedPrice || 0),
    averagePrice: Number(draft.estimatedPrice || 0),
    priceEstimate: draft.priceEstimate,
    quantity: Number(draft.quantity || 1),
    frontPhoto: draft.frontPhoto,
    backPhoto: draft.backPhoto,
    sourceUrl: draft.sourceUrl,
    notes: draft.notes,
    vineyardNotes: draft.vineyardNotes,
    acquiredNotes: draft.acquiredNotes,
    rating: Number(draft.rating || 0),
    tags: String(draft.tags || "").split(",").map((tag) => tag.trim()).filter(Boolean),
    criticRatings: parseCriticRatings(draft.criticRatings),
    tastingNotes: {
      appearance: draft.appearance,
      nose: draft.nose,
      palate: draft.palate,
      finish: draft.finish,
    },
  };
}

function criticRatingsToText(ratings) {
  return (ratings || []).map((rating) => {
    if (typeof rating === "string") return rating;
    return [rating.source, rating.score].filter(Boolean).join(": ");
  }).filter(Boolean).join("\n");
}

function parseCriticRatings(value) {
  const text = String(value || "").trim();
  if (!text) return [];
  if (text.startsWith("[")) {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      return [];
    }
  }
  return text.split(/\n+/).map((line) => {
    const [source, ...scoreParts] = line.split(":");
    return {
      source: source.trim(),
      score: scoreParts.join(":").trim(),
    };
  }).filter((rating) => rating.source || rating.score);
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
      <div className="form-section wide">
        <h3>Identity</h3>
        <div className="form-grid compact">
          <label>Producer<input value={draft.producer} onChange={(event) => setField("producer", event.target.value)} /></label>
          <label>Wine Name<input value={draft.wineName} onChange={(event) => setField("wineName", event.target.value)} /></label>
          <label>Vintage<input inputMode="numeric" value={draft.vintage} onChange={(event) => setField("vintage", event.target.value)} /></label>
          <label>Varietal<input value={draft.variety} onChange={(event) => setField("variety", event.target.value)} /></label>
          <label>Type<select value={draft.category} onChange={(event) => setField("category", event.target.value)}>
            {["Red", "White", "Sparkling", "Rose", "Dessert"].map((item) => <option key={item}>{item}</option>)}
          </select></label>
          <label>Size<input value={draft.size} onChange={(event) => setField("size", event.target.value)} /></label>
        </div>
      </div>
      <div className="form-section wide">
        <h3>Region & Value</h3>
        <div className="form-grid compact">
          <label>Region<input value={draft.region} list="region-presets" onChange={(event) => setRegion(event.target.value)} /></label>
          <label>Country<select value={draft.country} onChange={(event) => setField("country", event.target.value)}>
            <option value="">Country pending</option>
            {Array.from(new Set(regionPresets.map((item) => item.country))).sort().map((country) => <option key={country}>{country}</option>)}
          </select></label>
          <label>Average Price<input inputMode="decimal" value={draft.estimatedPrice} onChange={(event) => setField("estimatedPrice", event.target.value)} /></label>
          <label>Price Range / Estimate<input value={draft.priceEstimate} onChange={(event) => setField("priceEstimate", event.target.value)} placeholder="$20-35" /></label>
          <label>Quantity<input inputMode="numeric" value={draft.quantity} onChange={(event) => setField("quantity", event.target.value)} /></label>
          <label>Status<select value={draft.status} onChange={(event) => setField("status", event.target.value)}>
            {["Ready", "Hold", "Drink Soon", "Wishlist", "Consumed"].map((item) => <option key={item}>{item}</option>)}
          </select></label>
        </div>
      </div>
      {includeNotes && (
        <>
          <div className="form-section wide">
            <h3>Photos & Source</h3>
            <div className="form-grid compact">
              <label>Front Photo Filename<input value={draft.frontPhoto} onChange={(event) => setField("frontPhoto", event.target.value)} placeholder="IMG_8633.jpg" /></label>
              <label>Back Photo Filename<input value={draft.backPhoto} onChange={(event) => setField("backPhoto", event.target.value)} placeholder="IMG_8634.jpg" /></label>
              <label className="wide">Source URL<input value={draft.sourceUrl} onChange={(event) => setField("sourceUrl", event.target.value)} placeholder="https://..." /></label>
              <label>Date Added<input type="date" value={draft.dateAdded} onChange={(event) => setField("dateAdded", event.target.value)} /></label>
              <label>Automatic Location<input value={`${draft.cellar === 1 ? "Left Cellar" : "Right Cellar"} · ${getSlotMeta(draft.zone, draft.slot).slotLabel}`} disabled /></label>
            </div>
            <p className="form-note">Location is recalculated from price and wine type when you save.</p>
          </div>
          <label className="wide">How Acquired<textarea value={draft.acquiredNotes} onChange={(event) => setField("acquiredNotes", event.target.value)} /></label>
          <label className="wide">Vineyard / Producer Notes<textarea value={draft.vineyardNotes} onChange={(event) => setField("vineyardNotes", event.target.value)} /></label>
          <label className="wide">Bottle Notes<textarea value={draft.notes} onChange={(event) => setField("notes", event.target.value)} /></label>
          <label>Rating<StarRating rating={draft.rating} onChange={(value) => setField("rating", value)} /></label>
          <label>Tags<input value={draft.tags} onChange={(event) => setField("tags", event.target.value)} placeholder="Thanksgiving, Steak pairing" /></label>
          <label className="wide">Critic Ratings<textarea value={draft.criticRatings} onChange={(event) => setField("criticRatings", event.target.value)} placeholder="Wine Spectator: 94&#10;Robert Parker: 93" /></label>
          <label>Appearance<textarea value={draft.appearance} onChange={(event) => setField("appearance", event.target.value)} /></label>
          <label>Nose<textarea value={draft.nose} onChange={(event) => setField("nose", event.target.value)} /></label>
          <label>Palate<textarea value={draft.palate} onChange={(event) => setField("palate", event.target.value)} /></label>
          <label>Finish<textarea value={draft.finish} onChange={(event) => setField("finish", event.target.value)} /></label>
        </>
      )}
    </div>
  );
}

function ArchivePage({ archive, onRestore }) {
  const archiveValue = archive.reduce((sum, entry) => sum + averagePrice(entry.wine), 0);
  return (
    <div className="archive-page">
      {archive.length ? (
        <>
        <section className="archive-summary work-panel">
          <div>
            <p className="eyebrow">Drink history</p>
            <h2>{archive.length} archived bottle{archive.length === 1 ? "" : "s"}</h2>
          </div>
          <div className="archive-summary-metrics">
            <span>{money(archiveValue)} tracked value</span>
            <span>{new Date(archive[0].consumedAt).toLocaleDateString()} latest</span>
          </div>
        </section>
        <div className="archive-list">
          {archive.map((entry) => (
            <ArchiveCard key={entry.id} entry={entry} onRestore={onRestore} />
          ))}
        </div>
        </>
      ) : (
        <EmptyState title="No bottles consumed yet" body="Use the Archive Bottle button on a bottle detail page to move consumed bottles here." />
      )}
    </div>
  );
}

function ArchiveCard({ entry, onRestore }) {
  const wine = normalizeWine(entry.wine || {});
  const photos = [wine.frontPhoto, wine.backPhoto].filter(Boolean);
  return (
    <article className="archive-card">
      <div className={`archive-photo-strip ${photos.length < 2 ? "single" : ""}`}>
        {photos.length ? photos.map((photo, index) => (
          <img key={`${entry.id}-${photo}`} src={photoUrl(photo)} alt={`${wineTitle(wine)} ${index === 0 ? "front" : "back"} label`} />
        )) : (
          <div className="archive-photo-placeholder"><Wine size={30} /></div>
        )}
      </div>
      <div className="archive-card-body">
        <span className="archive-date">{new Date(entry.consumedAt).toLocaleString()}</span>
        <h3>{wineTitle(wine)}</h3>
        <p>{wine.region} · {wine.variety} · {money(averagePrice(wine))}</p>
        <div className="archive-meta">
          <span>{wine.category}</span>
          <span>{wine.country || "Country pending"}</span>
          <span>Qty 1</span>
        </div>
        {entry.reason && <p className="archive-reason">{entry.reason}</p>}
        <button className="ghost-button restore-button" onClick={() => onRestore(entry.id)}>
          <RotateCcw size={17} /> Restore to cellar
        </button>
      </div>
    </article>
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
            <strong>{placement.cellar === 1 ? "Left Cellar" : "Right Cellar"} · {getSlotMeta(placement.zone, placement.slot).slotLabel}</strong>
            <small>{averagePrice(placement) <= 50 ? "$50 and under" : "Over $50"}</small>
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
