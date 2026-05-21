import React, { useMemo, useState } from "react";
import "./luxury-cellar-book.css";

const BRAND_NAME = "Lynn Cave Privée";
const REPORT_STYLES = ["Full Cellar Book", "By Cellar / Location", "By Type", "By Region", "By Vintage", "By Price", "Tasting Notes"];

function money(value) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: Number(value || 0) % 1 ? 2 : 0 }).format(Number(value || 0));
}

function price(wine) { return Number(wine.averagePrice ?? wine.estimatedPrice ?? wine.price ?? 0); }
function qty(wine) { return Math.max(1, Number(wine.quantity || 1)); }
function wineType(wine) { return wine.category || wine.type || "Other"; }

function regionName(wine) {
  const region = String(wine.region || "Region pending").trim();
  if (!region) return "Region pending";
  const parts = region.split(",").map((part) => part.trim()).filter(Boolean);
  return parts.at(-1) || region;
}

function fullRegion(wine) { return [wine.region, wine.country].filter(Boolean).join(", ") || "Region pending"; }

function cellarLabel(wine) {
  const cellar = Number(wine.cellar || wine.cellarOverride || 0);
  if (cellar === 1) return "Left Cellar";
  if (cellar === 2) return "Right Cellar";
  const type = wineType(wine);
  if (["White", "Sparkling", "Dessert", "Rosé", "Rose"].includes(type)) return "Left Cellar";
  return price(wine) <= 50 ? "Left Cellar" : "Right Cellar";
}

function slotLabel(wine) {
  if (wine.slotLabel) return wine.slotLabel;
  const zone = wine.zone || (wineType(wine) === "White" ? "White" : "Red");
  const slot = Number(wine.slot || 1);
  const rack = Math.max(1, Math.ceil(slot / 8));
  const position = ((slot - 1) % 8) + 1;
  const prefix = String(zone).toLowerCase().includes("white") || String(zone).toLowerCase() === "top" ? "W" : "R";
  return `${prefix}${rack}-${position}`;
}

function rackLabel(wine) {
  const label = slotLabel(wine);
  const match = String(label).match(/^([A-Z]+\d+)/i);
  if (match) return match[1].toUpperCase();
  return label || "Unassigned";
}

function locationGroupTitle(wine) { return `${cellarLabel(wine)} · Rack ${rackLabel(wine)}`; }

function locationSortKey(wine) {
  const cellarRank = cellarLabel(wine) === "Left Cellar" ? 1 : 2;
  const label = slotLabel(wine);
  const match = String(label).match(/^([A-Z]+)(\d+)-(\d+)/i);
  const zoneRank = match?.[1]?.toUpperCase().startsWith("W") ? 1 : 2;
  const rack = Number(match?.[2] || 99);
  const slot = Number(match?.[3] || 99);
  return cellarRank * 10000 + zoneRank * 1000 + rack * 100 + slot;
}

function notesFor(wine) {
  const tasting = wine.tastingNotes;
  if (typeof tasting === "string" && tasting.trim()) return tasting.trim();
  if (tasting && typeof tasting === "object") return [tasting.appearance, tasting.nose, tasting.palate, tasting.finish].filter(Boolean).join(" ");
  if (wine.notes) return wine.notes;
  const text = `${wine.variety || ""} ${wine.wineName || ""} ${wine.name || ""} ${wineType(wine)}`;
  if (/cabernet/i.test(text)) return "Dark fruit, cassis, cedar, and polished tannin with a structured finish.";
  if (/bordeaux|merlot/i.test(text)) return "Blackcurrant, plum, graphite, dried herbs, and savory earth.";
  if (/chardonnay|chablis/i.test(text)) return "Pear, apple, citrus curd, and a lightly creamy texture.";
  if (/nebbiolo|barolo|barbaresco/i.test(text)) return "Rose petal, cherry, tea leaf, and firm mineral tannin.";
  if (/pinot/i.test(text)) return "Red cherry, raspberry, baking spice, and a silky finish.";
  if (/sangiovese|brunello|chianti/i.test(text)) return "Sour cherry, leather, dried herbs, and bright acidity.";
  return "Balanced fruit, savory detail, and a finish suited to the wine's style and region.";
}

function drinkWindow(wine) {
  if (wine.drinkWindow) return wine.drinkWindow;
  const vintage = Number(wine.vintage);
  if (!Number.isFinite(vintage)) return "Drink now";
  if (price(wine) >= 100) return `${vintage + 5}-${vintage + 18}`;
  if (wineType(wine) === "Red") return `${vintage + 2}-${vintage + 8}`;
  return `${vintage}-${vintage + 4}`;
}

function cleanWine(wine) {
  return { ...wine, id: wine.id || `${wine.producer}-${wine.wineName}-${wine.vintage}-${wine.slot}`, producer: wine.producer || "Producer pending", wineName: wine.wineName || wine.name || "Wine name pending", category: wineType(wine), quantity: qty(wine) };
}

function totalBottles(wines) { return wines.reduce((sum, wine) => sum + qty(wine), 0); }
function totalValue(wines) { return wines.reduce((sum, wine) => sum + price(wine) * qty(wine), 0); }

function groupBy(wines, getKey) {
  return Object.entries(wines.reduce((acc, wine) => { const key = getKey(wine); acc[key] = [...(acc[key] || []), wine]; return acc; }, {})).map(([title, groupWines]) => ({ title, wines: groupWines }));
}

function groupByType(wines) {
  const order = ["Red", "White", "Sparkling", "Rosé", "Rose", "Dessert", "Other"];
  return groupBy(wines, (wine) => wineType(wine)).sort((a, b) => order.indexOf(a.title) - order.indexOf(b.title));
}
function groupByRegion(wines) { return groupBy(wines, regionName).sort((a, b) => a.title.localeCompare(b.title)); }
function groupByVintage(wines) {
  return groupBy(wines, (wine) => wine.vintage || "NV").sort((a, b) => { if (a.title === "NV") return 1; if (b.title === "NV") return -1; return Number(b.title) - Number(a.title); });
}
function groupByPrice(wines) {
  const bands = [ { title: "Under $50", test: (n) => n < 50 }, { title: "$50–$99", test: (n) => n >= 50 && n < 100 }, { title: "$100–$199", test: (n) => n >= 100 && n < 200 }, { title: "$200+", test: (n) => n >= 200 } ];
  return bands.map((band) => ({ title: band.title, wines: wines.filter((wine) => band.test(price(wine))) })).filter((group) => group.wines.length);
}
function groupByCellarLocation(wines) {
  return groupBy(wines, locationGroupTitle).sort((a, b) => locationSortKey(a.wines[0]) - locationSortKey(b.wines[0]));
}

function sortWines(wines, mode = "alpha") {
  if (mode === "location") return [...wines].sort((a, b) => locationSortKey(a) - locationSortKey(b) || String(a.producer).localeCompare(String(b.producer)));
  return [...wines].sort((a, b) => String(a.producer).localeCompare(String(b.producer)) || Number(b.vintage || 0) - Number(a.vintage || 0));
}

function getStats(wines) {
  const bottles = totalBottles(wines);
  const value = totalValue(wines);
  const byType = groupByType(wines).map((group) => [group.title, totalBottles(group.wines)]);
  const topRegions = groupByRegion(wines).map((group) => [group.title, totalBottles(group.wines)]).sort((a, b) => b[1] - a[1]).slice(0, 6);
  return { records: wines.length, bottles, value, average: bottles ? value / bottles : 0, byType, topRegions, regions: groupByRegion(wines).length };
}

function Toolbar({ reportStyle, setReportStyle, showPrices, setShowPrices, showNotes, setShowNotes }) {
  return <div className="lux-print-toolbar"><div className="lux-toolbar-title"><span>Printable cellar catalogue</span><strong>Cellar Book</strong><small>For cleanest PDF, turn off browser Headers and Footers.</small></div><label>Report<select value={reportStyle} onChange={(e) => setReportStyle(e.target.value)}>{REPORT_STYLES.map((style) => <option key={style}>{style}</option>)}</select></label><label className="lux-check"><input type="checkbox" checked={showPrices} onChange={(e) => setShowPrices(e.target.checked)} /> Prices</label><label className="lux-check"><input type="checkbox" checked={showNotes} onChange={(e) => setShowNotes(e.target.checked)} /> Notes</label><button type="button" onClick={() => window.print()}>Print / Save PDF</button></div>;
}
function RunningHeader() { return <header className="lux-running-header"><span>{BRAND_NAME}</span><span>Private Cellar Book</span></header>; }
function Metric({ label, value }) { return <div className="lux-metric"><span>{label}</span><strong>{value}</strong></div>; }
function SectionTitle({ kicker, title }) { return <div className="lux-section-title"><p>{kicker}</p><h2>{title}</h2></div>; }
function Cover({ stats }) {
  const date = new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  return <section className="lux-print-page lux-cover-page"><div className="lux-cover-inner"><div className="lux-cover-mark">LC</div><div className="lux-cover-rule" /><p className="lux-eyebrow">Private Cellar Management</p><h1>{BRAND_NAME}</h1><h2>Private Cellar Book</h2><p className="lux-generated">Generated {date}</p><div className="lux-cover-stats"><Metric label="Records" value={stats.records} /><Metric label="Bottles" value={stats.bottles} /><Metric label="Value" value={money(stats.value)} /><Metric label="Regions" value={stats.regions} /></div><div className="lux-cover-rule" /><footer>Private wine cellar planning, organization, and collection oversight.</footer></div></section>;
}
function SummaryPanel({ title, children }) { return <article className="lux-summary-panel"><h3>{title}</h3>{children}</article>; }
function Line({ label, value }) { return <div className="lux-line"><span>{label}</span><strong>{value}</strong></div>; }
function Summary({ stats, wines, showPrices }) {
  return <section className="lux-print-page"><RunningHeader /><SectionTitle kicker="Collection Overview" title="Summary" /><div className="lux-summary-grid"><Metric label="Records" value={stats.records} /><Metric label="Bottles" value={stats.bottles} />{showPrices && <Metric label="Value" value={money(stats.value)} />}{showPrices && <Metric label="Average" value={money(stats.average)} />}<Metric label="Regions" value={stats.regions} /></div><div className="lux-panel-grid"><SummaryPanel title="Bottle Count by Type">{stats.byType.map(([label, value]) => <Line key={label} label={label} value={`${value} bottles`} />)}</SummaryPanel><SummaryPanel title="Top Regions">{stats.topRegions.map(([label, value]) => <Line key={label} label={label} value={`${value} bottles`} />)}</SummaryPanel><SummaryPanel title="Cellar Split"><Line label="Left Cellar" value={`${totalBottles(wines.filter((wine) => cellarLabel(wine) === "Left Cellar"))} bottles`} /><Line label="Right Cellar" value={`${totalBottles(wines.filter((wine) => cellarLabel(wine) === "Right Cellar"))} bottles`} /></SummaryPanel>{showPrices && <SummaryPanel title="Value by Price Band">{groupByPrice(wines).map((group) => <Line key={group.title} label={group.title} value={`${totalBottles(group.wines)} bottles · ${money(totalValue(group.wines))}`} />)}</SummaryPanel>}</div></section>;
}
function IndexPage({ wines, showPrices }) {
  const top = [...wines].sort((a, b) => price(b) - price(a)).slice(0, 10);
  return <section className="lux-print-page"><RunningHeader /><SectionTitle kicker="Cellar Reference" title="Cellar Index" /><div className="lux-index-grid"><SummaryPanel title="Placement Logic"><p>Left Cellar holds whites, sparkling, dessert bottles, and value reds. Right Cellar holds higher-value red wines. Slot references match the rack map.</p></SummaryPanel><SummaryPanel title="Quick Counts"><Line label="Left Cellar" value={`${totalBottles(wines.filter((wine) => cellarLabel(wine) === "Left Cellar"))} bottles`} /><Line label="Right Cellar" value={`${totalBottles(wines.filter((wine) => cellarLabel(wine) === "Right Cellar"))} bottles`} /></SummaryPanel></div><div className="lux-mini-list"><h3>Top Value Bottles</h3>{top.map((wine) => <div className="lux-mini-row" key={`top-${wine.id}`}><span>{wine.vintage || "NV"} {wine.producer}</span><strong>{showPrices ? money(price(wine)) : `${qty(wine)} btl`}</strong><small>{wine.wineName} · {cellarLabel(wine)} · {slotLabel(wine)}</small></div>)}</div></section>;
}
function WineRow({ wine, showPrices, showNotes }) {
  return <article className="lux-wine-row"><div className="lux-vintage-badge">{wine.vintage || "NV"}</div><div className="lux-wine-main"><strong className="lux-producer">{wine.producer}</strong><span className="lux-wine-name">{wine.wineName}</span><div className="lux-wine-meta">{fullRegion(wine)}</div><div className="lux-wine-meta">{wine.variety || "Blend"} · {wineType(wine)} · Drink window: {drinkWindow(wine)}</div>{showNotes && <p className="lux-note">{notesFor(wine)}</p>}</div><div className="lux-wine-right"><span>Qty {qty(wine)}</span>{showPrices && <strong>{money(price(wine))}</strong>}<small>{cellarLabel(wine)}</small><small>{slotLabel(wine)}</small></div></article>;
}
function Inventory({ title, groups, showPrices, showNotes, sortMode = "alpha" }) {
  return <section className="lux-print-page lux-inventory-section"><RunningHeader /><SectionTitle kicker="Cellar Inventory" title={title} />{groups.map((group) => <div className="lux-group" key={group.title}><div className="lux-group-heading"><h3>{group.title}</h3><span>{totalBottles(group.wines)} bottles{showPrices ? ` · ${money(totalValue(group.wines))}` : ""}</span></div><div className="lux-wine-list">{sortWines(group.wines, sortMode).map((wine) => <WineRow key={`${group.title}-${wine.id}`} wine={wine} showPrices={showPrices} showNotes={showNotes} />)}</div></div>)}</section>;
}
function Appendix({ title, groups, showPrices }) {
  return <section className="lux-print-page lux-appendix-section"><RunningHeader /><SectionTitle kicker="Summary Appendix" title={title} /><table className="lux-appendix-table"><thead><tr><th>Group</th><th>Bottles</th>{showPrices && <th>Value</th>}<th>Notable Bottle</th></tr></thead><tbody>{groups.map((group) => { const top = [...group.wines].sort((a, b) => price(b) - price(a))[0]; return <tr key={group.title}><td>{group.title}</td><td>{totalBottles(group.wines)}</td>{showPrices && <td>{money(totalValue(group.wines))}</td>}<td>{top ? `${top.vintage || "NV"} ${top.producer} — ${top.wineName}` : "—"}</td></tr>; })}</tbody></table></section>;
}

export default function LuxuryCellarBook({ wines = [] }) {
  const cleanWines = useMemo(() => wines.map(cleanWine), [wines]);
  const stats = useMemo(() => getStats(cleanWines), [cleanWines]);
  const [reportStyle, setReportStyle] = useState("Full Cellar Book");
  const [showPrices, setShowPrices] = useState(true);
  const [showNotes, setShowNotes] = useState(false);
  const isLocationReport = reportStyle === "By Cellar / Location";
  const groups = useMemo(() => {
    if (reportStyle === "By Cellar / Location") return groupByCellarLocation(cleanWines);
    if (reportStyle === "By Region") return groupByRegion(cleanWines);
    if (reportStyle === "By Vintage") return groupByVintage(cleanWines);
    if (reportStyle === "By Price") return groupByPrice(cleanWines);
    return groupByType(cleanWines);
  }, [cleanWines, reportStyle]);
  const printNotes = showNotes || reportStyle === "Tasting Notes";
  return <div className="lux-cellar-book-view"><Toolbar reportStyle={reportStyle} setReportStyle={setReportStyle} showPrices={showPrices} setShowPrices={setShowPrices} showNotes={showNotes} setShowNotes={setShowNotes} /><div className="lux-cellar-book"><Cover stats={stats} /><Summary stats={stats} wines={cleanWines} showPrices={showPrices} />{(reportStyle === "Full Cellar Book" || isLocationReport) && <IndexPage wines={cleanWines} showPrices={showPrices} />}<Inventory title={reportStyle === "Full Cellar Book" ? "Primary Inventory by Type" : reportStyle} groups={groups} showPrices={showPrices} showNotes={printNotes} sortMode={isLocationReport ? "location" : "alpha"} />{reportStyle === "Full Cellar Book" && <><Appendix title="By Cellar / Location" groups={groupByCellarLocation(cleanWines)} showPrices={showPrices} /><Appendix title="By Region" groups={groupByRegion(cleanWines)} showPrices={showPrices} /><Appendix title="By Vintage" groups={groupByVintage(cleanWines)} showPrices={showPrices} /><Appendix title="By Price" groups={groupByPrice(cleanWines)} showPrices={showPrices} /></>}</div></div>;
}
