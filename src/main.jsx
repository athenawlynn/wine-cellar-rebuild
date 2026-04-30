import React, { useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BadgeDollarSign,
  Barcode,
  Camera,
  ChevronLeft,
  Grape,
  LayoutGrid,
  Plus,
  Search,
  Sparkles,
  Wine,
  X,
} from "lucide-react";
import seedWines from "./data/wines.json";
import "./styles.css";

const PHOTO_BASE = "/photos/";
const CELLAR_CAPACITY = 56;
const ZONE_CAPACITY = 28;
const ZONE_RACKS = 4;
const SLOTS_PER_RACK = 7;

const fallbackNotes = {
  Cabernet: "Dark fruit, cassis, cedar, and polished tannin with a structured finish.",
  Bordeaux: "Blackcurrant, plum, graphite, dried herbs, and savory earth.",
  Chardonnay: "Pear, apple, citrus curd, and a lightly creamy texture.",
  Nebbiolo: "Rose petal, cherry, tea leaf, and firm mineral tannin.",
  Pinot: "Red cherry, raspberry, baking spice, and a silky finish.",
  Sangiovese: "Sour cherry, leather, dried herbs, and bright acidity.",
  White: "Citrus, orchard fruit, mineral lift, and a crisp finish.",
};

function money(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value % 1 ? 2 : 0,
  }).format(value || 0);
}

function inferNotes(wine) {
  const haystack = `${wine.variety} ${wine.wineName} ${wine.category}`;
  const key = Object.keys(fallbackNotes).find((item) => haystack.includes(item));
  return wine.tastingNotes || fallbackNotes[key] || "Balanced fruit, savory detail, and a finish suited to the wine's style and region.";
}

function inferDrinkWindow(wine) {
  if (!wine.vintage) return "Drink now";
  const age = new Date().getFullYear() - wine.vintage;
  if (wine.estimatedPrice >= 100) return `${wine.vintage + 5}-${wine.vintage + 18}`;
  if (wine.category === "Red" && age < 3) return `${wine.vintage + 2}-${wine.vintage + 8}`;
  if (wine.category === "White") return `${wine.vintage}-${wine.vintage + 4}`;
  return `${wine.vintage + 1}-${wine.vintage + 7}`;
}

function loadWines() {
  const saved = localStorage.getItem("lynn-cellar-wines");
  return saved ? JSON.parse(saved) : seedWines;
}

function saveWines(wines) {
  localStorage.setItem("lynn-cellar-wines", JSON.stringify(wines));
}

function suggestPlacement(wines, draft) {
  const cellar = Number(draft.estimatedPrice || 0) < 50 ? 1 : 2;
  const chilled = ["White", "Sparkling", "Dessert", "Rose", "Rosé", "Rosé"];
  const zone = chilled.includes(draft.category) ? "top" : "bottom";
  const occupied = new Set(wines.filter((w) => w.cellar === cellar && w.zone === zone).map((w) => w.slot));
  let slot = 1;
  while (occupied.has(slot) && slot < ZONE_CAPACITY) slot += 1;
  return { cellar, zone, slot };
}

function App() {
  const [wines, setWines] = useState(loadWines);
  const [view, setView] = useState("dashboard");
  const [activeWineId, setActiveWineId] = useState(seedWines[0]?.id);
  const [query, setQuery] = useState("");
  const [scanOpen, setScanOpen] = useState(false);

  const activeWine = wines.find((wine) => wine.id === activeWineId) || wines[0];
  const stats = useMemo(() => {
    const total = wines.reduce((sum, wine) => sum + wine.quantity, 0);
    const value = wines.reduce((sum, wine) => sum + wine.estimatedPrice * wine.quantity, 0);
    return {
      total,
      value,
      cellar1: wines.filter((wine) => wine.cellar === 1).length,
      cellar2: wines.filter((wine) => wine.cellar === 2).length,
      ready: wines.filter((wine) => wine.status === "Ready").length,
    };
  }, [wines]);

  function upsertWine(draft) {
    const placement = suggestPlacement(wines, draft);
    const nextWine = {
      id: Math.max(0, ...wines.map((wine) => wine.id)) + 1,
      producer: draft.producer || "Unknown producer",
      wineName: draft.wineName || "Unidentified bottle",
      vintage: draft.vintage ? Number(draft.vintage) : null,
      region: draft.region || "Region pending",
      country: draft.country || "",
      variety: draft.variety || "Blend",
      category: draft.category || "Red",
      size: "750ml",
      quantity: 1,
      estimatedPrice: Number(draft.estimatedPrice || 0),
      sourceUrl: "",
      notes: "Added from scan flow.",
      frontPhoto: "",
      backPhoto: "",
      status: "Ready",
      ...placement,
    };
    const next = [...wines, nextWine];
    setWines(next);
    saveWines(next);
    setActiveWineId(nextWine.id);
    setScanOpen(false);
    setView("detail");
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-mark">
          <Wine size={24} />
          <div>
            <strong>Lynn</strong>
            <span>Cave Privee</span>
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
        </nav>
      </aside>

      <main>
        <header className="topbar">
          <div>
            <p className="eyebrow">Private cellar digital twin</p>
            <h1>{view === "dashboard" ? "Your Cellar, At A Glance" : view === "cellars" ? "Cellar Map" : view === "detail" ? "Bottle Details" : "Wine Collection"}</h1>
          </div>
          <button className="icon-button" title="Add bottle" onClick={() => setScanOpen(true)}>
            <Plus size={20} />
          </button>
        </header>

        {view === "dashboard" && <Dashboard stats={stats} wines={wines} openWine={(id) => { setActiveWineId(id); setView("detail"); }} />}
        {view === "cellars" && <Cellars wines={wines} openWine={(id) => { setActiveWineId(id); setView("detail"); }} />}
        {view === "collection" && <Collection wines={wines} query={query} setQuery={setQuery} openWine={(id) => { setActiveWineId(id); setView("detail"); }} />}
        {view === "detail" && activeWine && <WineDetail wine={activeWine} back={() => setView("collection")} />}
      </main>

      {scanOpen && <ScanDrawer wines={wines} onClose={() => setScanOpen(false)} onSave={upsertWine} />}
    </div>
  );
}

function NavButton({ children, icon, active, onClick }) {
  return (
    <button className={active ? "nav-button active" : "nav-button"} onClick={onClick}>
      {React.cloneElement(icon, { size: 19 })}
      {children}
    </button>
  );
}

function Dashboard({ stats, wines, openWine }) {
  const premium = wines.filter((wine) => wine.cellar === 2).slice(0, 3);
  const drinkSoon = wines
    .filter((wine) => wine.status === "Ready")
    .sort((a, b) => a.estimatedPrice - b.estimatedPrice)
    .slice(0, 5);

  return (
    <section className="dashboard-grid">
      <div className="metric-panel">
        <Metric label="Total bottles" value={stats.total} />
        <Metric label="Estimated value" value={money(stats.value)} />
        <Metric label="Under $50" value={stats.cellar1} />
        <Metric label="$50 and above" value={stats.cellar2} />
      </div>

      <div className="work-panel hero-panel">
        <div>
          <p className="eyebrow">Next best action</p>
          <h2>Scan, enrich, place.</h2>
          <p>Barcode first, label photo when the barcode misses, then automatic cellar placement by price and style.</p>
        </div>
        <div className="scan-stack">
          <span><Barcode size={18} /> Barcode lookup</span>
          <span><Sparkles size={18} /> Label enrichment</span>
          <span><BadgeDollarSign size={18} /> Price rule</span>
        </div>
      </div>

      <div className="work-panel">
        <SectionTitle title="Premium bottles" subtitle="Cellar 2" />
        <BottleList wines={premium} openWine={openWine} />
      </div>

      <div className="work-panel">
        <SectionTitle title="Drink soon" subtitle="Ready now" />
        <BottleList wines={drinkSoon} openWine={openWine} />
      </div>
    </section>
  );
}

function Metric({ label, value }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function SectionTitle({ title, subtitle }) {
  return (
    <div className="section-title">
      <div>
        <p className="eyebrow">{subtitle}</p>
        <h2>{title}</h2>
      </div>
    </div>
  );
}

function BottleList({ wines, openWine }) {
  return (
    <div className="bottle-list">
      {wines.map((wine) => (
        <button key={wine.id} onClick={() => openWine(wine.id)} className="bottle-row">
          <img src={wine.frontPhoto ? `${PHOTO_BASE}${wine.frontPhoto}` : ""} alt="" />
          <span>
            <strong>{wine.producer}</strong>
            <small>{wine.wineName} {wine.vintage || "NV"}</small>
          </span>
          <b>{money(wine.estimatedPrice)}</b>
        </button>
      ))}
    </div>
  );
}

function Cellars({ wines, openWine }) {
  return (
    <section className="cellar-layout">
      {[1, 2].map((cellar) => (
        <div className="work-panel cellar-panel" key={cellar}>
          <SectionTitle title={`Cellar ${cellar}`} subtitle={cellar === 1 ? "Under $50" : "$50 and above"} />
          <Zone cellar={cellar} zone="top" wines={wines} title="Top zone" subtitle="Whites, sparkling, dessert" openWine={openWine} />
          <Zone cellar={cellar} zone="bottom" wines={wines} title="Bottom zone" subtitle="Reds" openWine={openWine} />
        </div>
      ))}
    </section>
  );
}

function Zone({ cellar, zone, wines, title, subtitle, openWine }) {
  const zoneWines = wines.filter((wine) => wine.cellar === cellar && wine.zone === zone);
  const bySlot = new Map(zoneWines.map((wine) => [wine.slot, wine]));
  const slots = Array.from({ length: ZONE_CAPACITY }, (_, index) => index + 1);
  return (
    <div className="zone">
      <div className="zone-header">
        <div>
          <strong>{title}</strong>
          <span>{subtitle}</span>
        </div>
        <span>{zoneWines.length}/{ZONE_CAPACITY}</span>
      </div>
      <div className="slot-grid" style={{ "--rows": ZONE_RACKS, "--cols": SLOTS_PER_RACK }}>
        {slots.map((slot) => {
          const wine = bySlot.get(slot);
          return (
            <button
              key={slot}
              className={wine ? `slot filled ${wine.category.toLowerCase()}` : "slot"}
              onClick={() => wine && openWine(wine.id)}
              title={wine ? `${wine.producer} - ${wine.wineName}` : `Empty slot ${slot}`}
            >
              <span>{slot}</span>
              {wine && <b>{wine.producer.slice(0, 2)}</b>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Collection({ wines, query, setQuery, openWine }) {
  const filtered = wines.filter((wine) => {
    const haystack = `${wine.producer} ${wine.wineName} ${wine.region} ${wine.variety}`.toLowerCase();
    return haystack.includes(query.toLowerCase());
  });
  return (
    <section className="work-panel">
      <div className="search-row">
        <Search size={18} />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search producer, bottle, region, variety..." />
      </div>
      <div className="collection-table">
        {filtered.map((wine) => (
          <button key={wine.id} onClick={() => openWine(wine.id)} className="collection-row">
            <img src={wine.frontPhoto ? `${PHOTO_BASE}${wine.frontPhoto}` : ""} alt="" />
            <span>
              <strong>{wine.producer}</strong>
              <small>{wine.wineName}</small>
            </span>
            <span>{wine.vintage || "NV"}</span>
            <span>{wine.region}</span>
            <span>{money(wine.estimatedPrice)}</span>
            <span>C{wine.cellar} {wine.zone === "top" ? "T" : "B"}-{wine.slot}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function WineDetail({ wine, back }) {
  return (
    <section className="detail-layout">
      <button className="back-button" onClick={back}><ChevronLeft size={18} /> Collection</button>
      <div className="label-card">
        <img src={wine.frontPhoto ? `${PHOTO_BASE}${wine.frontPhoto}` : ""} alt={`${wine.producer} front label`} />
      </div>
      <div className="detail-copy">
        <p className="pill">{wine.category}</p>
        <h2>{wine.producer}</h2>
        <h3>{wine.wineName}</h3>
        <div className="detail-stats">
          <Metric label="Vintage" value={wine.vintage || "NV"} />
          <Metric label="Average price" value={money(wine.estimatedPrice)} />
          <Metric label="Location" value={`C${wine.cellar} ${wine.zone === "top" ? "Top" : "Bottom"}-${wine.slot}`} />
          <Metric label="Drink window" value={inferDrinkWindow(wine)} />
        </div>
        <div className="notes-block">
          <h4>Tasting notes</h4>
          <p>{inferNotes(wine)}</p>
        </div>
        <div className="notes-block">
          <h4>Details</h4>
          <p>{wine.variety} from {wine.region}{wine.country ? `, ${wine.country}` : ""}. {wine.notes}</p>
        </div>
        {wine.sourceUrl && <a className="source-link" href={wine.sourceUrl} target="_blank" rel="noreferrer">View price reference</a>}
      </div>
    </section>
  );
}

function ScanDrawer({ wines, onClose, onSave }) {
  const [mode, setMode] = useState("barcode");
  const [barcode, setBarcode] = useState("");
  const [draft, setDraft] = useState({
    producer: "",
    wineName: "",
    vintage: "",
    region: "",
    country: "",
    variety: "",
    category: "Red",
    estimatedPrice: "",
  });
  const [detected, setDetected] = useState("");
  const videoRef = useRef(null);

  const placement = suggestPlacement(wines, draft);

  async function startCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setDetected("Camera access is not available in this browser.");
      return;
    }
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
    videoRef.current.srcObject = stream;
    await videoRef.current.play();
    setDetected("Camera ready. Native barcode detection will run where the browser supports it.");
    if ("BarcodeDetector" in window) {
      const detector = new window.BarcodeDetector({ formats: ["ean_13", "upc_a", "upc_e", "qr_code"] });
      const tick = async () => {
        if (!videoRef.current?.srcObject) return;
        const codes = await detector.detect(videoRef.current);
        if (codes[0]?.rawValue) {
          setBarcode(codes[0].rawValue);
          setDetected(`Detected ${codes[0].rawValue}`);
        } else {
          requestAnimationFrame(tick);
        }
      };
      requestAnimationFrame(tick);
    }
  }

  function useExample() {
    const sample = seedWines.find((wine) => wine.estimatedPrice >= 50) || seedWines[0];
    setDraft({
      producer: sample.producer,
      wineName: sample.wineName,
      vintage: sample.vintage || "",
      region: sample.region,
      country: sample.country,
      variety: sample.variety,
      category: sample.category,
      estimatedPrice: sample.estimatedPrice,
    });
    setBarcode("sample-label-match");
    setDetected("Matched from label/photo data.");
  }

  return (
    <div className="drawer-backdrop">
      <aside className="scan-drawer">
        <button className="close-button" onClick={onClose}><X size={20} /></button>
        <p className="eyebrow">Bottle intake</p>
        <h2>Scan or identify a wine</h2>

        <div className="segmented">
          <button className={mode === "barcode" ? "active" : ""} onClick={() => setMode("barcode")}><Barcode size={17} /> Barcode</button>
          <button className={mode === "label" ? "active" : ""} onClick={() => setMode("label")}><Camera size={17} /> Label</button>
        </div>

        {mode === "barcode" ? (
          <div className="scanner-box">
            <video ref={videoRef} muted playsInline />
            <button onClick={startCamera}><Camera size={18} /> Start camera</button>
            <input value={barcode} onChange={(event) => setBarcode(event.target.value)} placeholder="Or enter barcode manually" />
            <small>{detected || "Barcode lookup is ready for a data provider connection."}</small>
          </div>
        ) : (
          <div className="scanner-box">
            <input type="file" accept="image/*" capture="environment" />
            <button onClick={useExample}><Sparkles size={18} /> Simulate label match</button>
            <small>Label photos can feed OCR/AI enrichment in the production build.</small>
          </div>
        )}

        <div className="form-grid">
          {["producer", "wineName", "vintage", "region", "country", "variety", "estimatedPrice"].map((field) => (
            <label key={field}>
              {field === "wineName" ? "Wine name" : field === "estimatedPrice" ? "Average price" : field}
              <input value={draft[field]} onChange={(event) => setDraft({ ...draft, [field]: event.target.value })} />
            </label>
          ))}
          <label>
            Category
            <select value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })}>
              <option>Red</option>
              <option>White</option>
              <option>Sparkling</option>
              <option>Dessert</option>
              <option>Rose</option>
            </select>
          </label>
        </div>

        <div className="placement-preview">
          <span>Suggested placement</span>
          <strong>Cellar {placement.cellar} · {placement.zone === "top" ? "Top whites zone" : "Bottom reds zone"} · Slot {placement.slot}</strong>
        </div>

        <button className="save-button" onClick={() => onSave(draft)}>Save bottle</button>
      </aside>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
