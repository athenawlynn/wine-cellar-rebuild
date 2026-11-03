import { readFile, writeFile } from "node:fs/promises";

const [inputPath, outputPath] = process.argv.slice(2);
if (!inputPath || !outputPath) {
  throw new Error("Usage: node scripts/reconcile-photo-racks-2026-11-02.mjs input.json output.json");
}

const wines = JSON.parse(await readFile(inputPath, "utf8"));
const byId = new Map(wines.map((wine) => [String(wine.id), wine]));

// These three entries are not present in the photographed cellar. The Austin Hope
// magnum was a duplicate of the photographed 1 L record; the other two bottles do
// not appear in any of the twelve rack photographs.
for (const id of [
  "austin-hope-cabernet-sauvignon-paso-robles-1-5l-nv",
  "6a02337d-5772-44aa-b29c-5ab2f462d512",
  "post-beam-by-far-niente-chardonnay-2023",
]) {
  byId.delete(id);
}

function update(id, changes) {
  const wine = byId.get(String(id));
  if (!wine) throw new Error(`Missing wine ${id}`);
  Object.assign(wine, changes);
}

update("1dc0da93-7422-4894-912d-44ca405b0c63", {
  quantity: 7,
  size: "1L",
  bottleSize: "1 L",
  notes: "Seven 1 L bottles confirmed in the November 2, 2026 rack photographs.",
});
update("873db399-e10a-4978-b2bb-f11aee035398", { quantity: 2 });
update("d5472361-0714-4c1e-b5c1-719809ca46fb", { quantity: 2 });
update("chateau-paradis-casseuil-bordeaux-blanc-sec-2022", { vintage: 2024 });

byId.set("groth-cabernet-sauvignon-oakville-2022", {
  id: "groth-cabernet-sauvignon-oakville-2022",
  producer: "Groth",
  wineName: "Cabernet Sauvignon",
  vintage: 2022,
  region: "Oakville, Napa Valley, California",
  country: "United States",
  variety: "Cabernet Sauvignon",
  category: "Red",
  size: "750ml",
  bottleSize: "750 mL",
  quantity: 1,
  estimatedPrice: 64.99,
  averagePrice: 64.99,
  priceEstimate: "$64.99",
  sourceUrl: "https://www.zachys.com/wine/groth-oakville-cabernet-sauvignon-2022-750ml-580467.html",
  notes: "Restored from archive after the bottle was confirmed in rack 4.",
  status: "Ready",
  tags: ["United States", "California", "Napa Valley", "Oakville", "Cabernet Sauvignon"],
  criticRatings: [],
  dateAdded: "2026-11-02",
});

byId.set("le-bruciatello-brunello-di-montalcino-2020", {
  id: "le-bruciatello-brunello-di-montalcino-2020",
  producer: "Le Bruciatello",
  wineName: "Brunello di Montalcino",
  vintage: 2020,
  region: "Brunello di Montalcino, Tuscany",
  country: "Italy",
  variety: "Sangiovese",
  category: "Red",
  size: "750ml",
  bottleSize: "750 mL",
  quantity: 1,
  estimatedPrice: 45,
  averagePrice: 45,
  priceEstimate: "$45",
  notes: "Bottle and vintage confirmed in rack 1 photograph.",
  status: "Ready",
  tags: ["Italy", "Tuscany", "Brunello di Montalcino", "Sangiovese"],
  criticRatings: [],
  dateAdded: "2026-11-02",
});

const racks = {
  1: [
    "conte-fini-pinot-grigio-2024", "ponzi-vineyards-pinot-gris-willamette-valley-2022",
    "chateau-paradis-casseuil-bordeaux-blanc-sec-2022", "le-bruciatello-brunello-di-montalcino-2020",
    "chateau-guiraud-le-g-bordeaux-blanc-sec-2023", "chateau-cherubin-saint-emilion-grand-cru-2015",
    "0cac856d-7673-492e-90dd-bd36634a420f", "chateau-giscours-margaux-2014",
  ],
  2: [
    "louis-latour-macon-villages-chameroy-2023", "morin-pere-fils-chassagne-montrachet-2022",
    "chateau-doisy-vedrines-sauternes-2005", "afc9f0cd-0b43-445b-a906-3f052c67cd94",
    "the-prisoner-wine-company-the-prisoner-red-blend-2023", "toscano-brunello-di-montalcino-2019",
    "jost-jam-cabernet-sauvignon-napa-valley-2023", "antiche-terre-amarone-della-valpolicella-2022",
  ],
  3: [
    "873db399-e10a-4978-b2bb-f11aee035398", "873db399-e10a-4978-b2bb-f11aee035398",
    "d5472361-0714-4c1e-b5c1-719809ca46fb", "d5472361-0714-4c1e-b5c1-719809ca46fb",
  ],
  4: [
    "daou-vineyards-reserve-seventeen-forty-2021", "1dc0da93-7422-4894-912d-44ca405b0c63",
    "382de53e-6374-4890-ad62-68e04aa9f4fb", "1dc0da93-7422-4894-912d-44ca405b0c63",
    "vietti-langhe-nebbiolo-perbacco-2022", "tommasi-valpolicella-ripasso-classico-superiore-2021",
    "groth-cabernet-sauvignon-oakville-2022",
  ],
  5: [
    "chateau-la-tour-de-bessan-margaux-2023", "chateau-marquisat-de-binet-la-cuvee-montagne-saint-emilion-2010",
    "bideona-s4mg0-rioja-alavesa-2020", "campo-alle-noci-brunello-di-montalcino-2018",
    "quilt-copper-cane-wines-provisions-the-fabric-of-the-land-napa-valley-red-wine-2023",
    "chateau-massereau-le-rouge-eclaire-2022", "chateau-kirwan-margaux-2019",
    "chateau-kirwan-margaux-2019", "chateau-kirwan-margaux-2019",
  ],
  6: [
    "chateau-cherubin-saint-emilion-grand-cru-2015", "produttori-del-barbaresco-langhe-nebbiolo-2023",
    "le-potazzine-rosso-di-montalcino-2019", "trump-winery-cabernet-sauvignon-american-red-wine-2023",
    "austin-hope-winery-harvester-cabernet-sauvignon-paso-robles-nv", "bb096b29-736d-4262-b489-222aa0632fcc",
  ],
  7: [
    "mate-famiglia-brunello-di-montalcino-2019", "domaine-de-la-charbonniere-cuvee-mourre-des-perdrix-chateauneuf-du-pape-2015",
    "famille-isabel-ferrando-saint-prefert-chateauneuf-du-pape-2022", "chateau-faugeres-saint-emilion-grand-cru-classe-2020",
    "chateau-de-pez-saint-estephe-2022", "mano-s-wine-handcrafted-reserve-california-cabernet-sauvignon-nv",
    "st-michaels-winery-chocolate-zin-nv", "baracchi-o-lilla-toscana-igt-2022", "32",
  ],
  8: [
    "rebrook-cellars-pinot-noir-fort-ross-seaview-nv", "rebrook-cellars-pinot-noir-fort-ross-seaview-nv",
    "chateau-de-rayne-vigneau-sauternes-2014-375ml", "chateau-de-rayne-vigneau-sauternes-2014-375ml",
    "castello-di-amorosa-il-barone-cabernet-sauvignon-2016", "110d4783-5bdc-44ed-bb1c-946b3dd99e18",
    "la-sacrestia-barolo-gabutti-2020", "edouard-delaunay-beaune-greves-premier-cru-2022",
  ],
  9: [
    "rebrook-cellars-pinot-noir-fort-ross-seaview-nv", "tenuta-sette-ponti-oreno-toscana-igt-2023",
    "tenuta-sette-ponti-oreno-toscana-igt-2023", "tenuta-sette-ponti-oreno-toscana-igt-2023",
    "le-potazzine-brunello-di-montalcino-2009", "opus-one-overture-by-opus-one-nv",
    "70b8f2f0-28aa-4ae2-be4b-f93a20993a34", "michele-chiarlo-barolo-cannubi-2021",
  ],
  10: [
    "opus-one-overture-by-opus-one-nv", "opus-one-overture-by-opus-one-nv", "060989eb-9ff8-4820-a2b9-4f781291717e",
    "beaulieu-vineyard-bv-georges-de-latour-private-reserve-cabernet-sauvignon-2021",
    "continuum-estate-proprietary-red-napa-valley-2005",
  ],
  11: Array(5).fill("1dc0da93-7422-4894-912d-44ca405b0c63"),
  12: [
    "060989eb-9ff8-4820-a2b9-4f781291717e", "060989eb-9ff8-4820-a2b9-4f781291717e",
    "61036f05-2007-40f3-80ef-ab79a617cf16", "61036f05-2007-40f3-80ef-ab79a617cf16",
    "61036f05-2007-40f3-80ef-ab79a617cf16", "61036f05-2007-40f3-80ef-ab79a617cf16",
  ],
};

const expectedCounts = new Map();
for (const ids of Object.values(racks)) {
  for (const id of ids) expectedCounts.set(id, (expectedCounts.get(id) || 0) + 1);
}

// Records whose labels are obscured in the photos retain inventory presence and
// are placed into open positions in their photographed cellar.
const unassigned = [];
for (const wine of byId.values()) {
  const expected = expectedCounts.get(String(wine.id)) || 0;
  for (let i = expected; i < Number(wine.quantity || 1); i += 1) unassigned.push(String(wine.id));
  if (expected > Number(wine.quantity || 1)) {
    throw new Error(`${wine.id} is assigned ${expected} times but quantity is ${wine.quantity}`);
  }
}

for (const id of unassigned) {
  const preferred = [1, 2, 4, 6, 7, 8, 9, 10].find((rack) => racks[rack].length < 10);
  if (!preferred) throw new Error(`No free rack position for ${id}`);
  racks[preferred].push(id);
}

const positions = new Map();
for (const [rackText, ids] of Object.entries(racks)) {
  const rack = Number(rackText);
  if (ids.length > 10) throw new Error(`Rack ${rack} has ${ids.length} bottles`);
  ids.forEach((id, index) => {
    positions.set(id, [...(positions.get(id) || []), { rack, rackSlot: index + 1 }]);
  });
}

const result = [...byId.values()].map((wine) => {
  const bottlePositions = positions.get(String(wine.id)) || [];
  if (bottlePositions.length !== Number(wine.quantity || 1)) {
    throw new Error(`${wine.id}: ${bottlePositions.length} positions for quantity ${wine.quantity}`);
  }
  const bottlePlacements = bottlePositions.map(({ rack, rackSlot }, index) => {
    const cellar = rack <= 6 ? 1 : 2;
    const zone = rack <= 3 ? "top" : rack <= 6 ? "bottom" : "fullRed";
    const zoneRack = rack <= 3 ? rack : rack <= 6 ? rack - 3 : rack - 6;
    const placementPriority = (zoneRack - 1) * 10 + rackSlot;
    return { bottleNumber: index + 1, cellarOverride: cellar, zoneOverride: zone, placementPriority };
  });
  const first = bottlePlacements[0];
  return {
    ...wine,
    cellar: first.cellarOverride,
    zone: first.zoneOverride,
    slot: first.placementPriority,
    cellarOverride: first.cellarOverride,
    zoneOverride: first.zoneOverride,
    placementPriority: first.placementPriority,
    bottlePlacements,
  };
});

const total = result.reduce((sum, wine) => sum + Number(wine.quantity || 1), 0);
const rackSummary = Object.fromEntries(Object.entries(racks).map(([rack, ids]) => [rack, ids.length]));
await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify({ records: result.length, bottles: total, racks: rackSummary, unassigned }, null, 2));
