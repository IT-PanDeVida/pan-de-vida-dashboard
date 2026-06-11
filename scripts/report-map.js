/**
 * Pan de Vida Dashboard — Salesforce Report Map
 *
 * SETUP INSTRUCTIONS:
 * ──────────────────
 * 1. Open each report in Salesforce.
 * 2. Copy the report ID from the URL bar:
 *    https://pandevidaministry.my.salesforce.com/lightning/r/Report/00O8X000005EXAMPLE/view
 *                                                                    ^^^^^^^^^^^^^^^^^^^
 *                                                                    This is the report ID
 * 3. Paste the IDs into the REPORT_IDS object below.
 * 4. Run: node inspect-report.js <reportId>  to verify the grand total value is correct.
 *
 * NOTE: Each Salesforce report here represents a single metric.
 * The grand total (factMap["T!T"].aggregates[0].value) is used for most reports.
 * Run inspect-report.js to confirm the correct aggregate index for each report.
 */

// ─── Report IDs ───────────────────────────────────────────────────────────────
export const REPORT_IDS = {
  // ── Beneficiaries ──────────────────────────────────────────────────────────
  beneficiaries_combined: "00OUc000007Y6tNMAS",  // Contactos y Cuentas (combined)
  beneficiaries_quito: "00OUc000007a44HMAQ",  // Contactos y Cuentas UIO
  beneficiaries_imbabura: "00OUc000007a4AjMAI",  // Copy of Contactos y Cuentas OTV
  nuevos_apas_uio: "00OUc000007mPhdMAE",  // NUEVOS APAs UIO (new families Quito)
  nuevos_apas_imb: "00OUc000007mQFVMA2",  // Copy of NUEVOS APAs IMB (Quito en Otavalo)
  nuevos_apas_imb2: "00OUc0000083EUrMAM",  // Copy of Copy of NUEVOS APAs IMB 2

  // ── Level 1 · Alivio ───────────────────────────────────────────────────────
  hot_meals: "00OUc00000750xpMAA",  // Comida Caliente
  hot_meals_families: "00OUc00000751vVMAQ",  // BU Comida Caliente (familia)
  groceries: "00OUc000006GEErMAO",  // VIVERES
  groceries_bu: "00OUc000006HJQzMAO",  // BU Viveres
  groceries_avg_cost: "00OUc000006IEyjMAG",  // VIVERES AVG COST
  clothing: "00OUc0000074zIbMAI",  // Ropa
  clothing_bu: "00OUc00000750PxMAI",  // BU Ropa
  emergency_viveres: "00OUc000007JjYTMA0",  // Víveres Emergencia

  // ── Level 2 · Restauración ─────────────────────────────────────────────────
  health_clinic_atenciones: "00OUc0000076IHZMA2",  // Atenciones Médicas Clínica la Y
  health_clinic_bu: "00OUc0000076MD7MAM",  // BU Atención Clinica la Y
  health_clinic_monto: "00OUc0000076QYTMA2",  // Monto pagado por Clinica la Y
  health_clinic_pdv_cost: "00OUc0000076PULMA2",  // COSTO A.MEDICA PDV
  health_other: "00OUc0000076R6LMAU",  // Otras ayudas médicas (medicina,...)
  health_other_bu: "00OUc0000076UnNMAU",  // BU otras ayudas médicas
  health_resumen: "00OUc0000076XBlMAM",  // Resumen ES Salud (totales)
  education_kits: "00OUc000007IJTBMA4",  // Kits Escolares
  education_kits_cost: "00OUc000007IucPMAS",  // Útiles Escolares AVG Cost
  education_backpacks: "00OUc000007IKAjMAO",  // Mochilas
  education_backpacks_cost: "00OUc000007IuVxMAK",  // Mochilas AVG Cost
  education_vbs: "00OUc000007IzQnMAK",  // Campamentos VBS
  shelter_furniture: "00OUc000009VEG2MAO",  // Mobiliario
  shelter_appliances: "00OUc000009VFC5MAO",  // Electrodomésticos
  shelter_household: "00OUc000009VFNNMA4",  // Enseres del hogar
  shelter_electronics: "00OUc000009VFSDMA4",  // Electrónicos y suministros

  // ── Level 3 · Desarrollo ───────────────────────────────────────────────────
  life_farms_ideal: "00OUc0000085ebJMAQ",  // HUERTOS DE VIDA IDEAL
  life_farms_full: "00OUc0000085gA5MAI",  // HUERTOS DE VIDA COMPLETO1
  life_farms_basic: "00OUc0000083PBlMAM",  // HUERTOS DE VIDA BÁSICOS
  life_farms_multiplication: "00OUc0000083PWjMAM",  // HUERTOS DE VIDA MULTIPLICACIÓN
  life_farms_urban: "00OUc000009hW5tMAE",  // HUERTOS DE VIDA URBANO
  shark_tank_winners: "00OUc000009o4o1MAA",  // Ganadores Shark Tank
  // (MEPs intentionally absent: no Salesforce report exists — computed via live SOQL
  //  in sync-salesforce.js fetchMepMetrics, see buildMeps below)

  // ── Evangelización ─────────────────────────────────────────────────────────
  evangelism_bibles_es: "00OUc000007Jm6XMAS",  // Entregas Biblias Español
  evangelism_bibles_qu: "00OUc000007Jm9lMAC",  // Entregas Biblias Quichua
  evangelism_bibles_ninos: "00OUc000007JmCzMAK",  // Entregas Biblias para Niños
  evangelism_personas: "00OUc000009JVMHMA4",  // Personas Alcanzadas por el Evangelio

  // ── Navidad ────────────────────────────────────────────────────────────────
  christmas_comida: "00OUc000008Wq26MAC",  // Comida Caliente (Navidad)
  christmas_viveres: "00OUc000008WqzlMAC",  // Fundas de víveres (Navidad)
  christmas_juguetes: "00OUc000008Wqy9MAC",  // Juguetes (Navidad)
  christmas_other: "00OUc000008Wr4bMAC",  // Otras donaciones (Navidad)
};

// ─── Helper: get grand total from a report ────────────────────────────────────
// Most PDV reports have a single aggregate (row count or sum).
// aggregateIndex: 0 is almost always the main metric. Run inspect-report.js to verify.
function total(report, aggregateIndex = 0) {
  if (!report) return 0;
  const val = report?.factMap?.["T!T"]?.aggregates?.[aggregateIndex]?.value;
  return Number(val) || 0;
}

// ─── Helper: count girls / boys aged 0–13 from beneficiaries detail rows ──────
// The beneficiaries_quito / beneficiaries_imbabura reports include per-contact
// detail rows with 5 columns (confirmed via reportMetadata.detailColumns):
//   [0] ADDRESS2_STATE         (Mailing State/Province)
//   [1] Contact.Current_Age__c
//   [2] Contact.Contact_Number__c
//   [3] Account.APA_Number__c
//   [4] Contact.Gender__c       → "Female" | "Male" | null
//
// Each factMap entry (except "T!T") is one APA grouping.
// Its .rows[] array contains the individual contacts.
function countChildren(report, maxAge = 13) {
  if (!report) return { girls: 0, boys: 0 };
  let girls = 0;
  let boys = 0;
  for (const [key, entry] of Object.entries(report.factMap ?? {})) {
    if (key === "T!T") continue;
    for (const row of entry.rows ?? []) {
      const cells = row.dataCells ?? [];
      const age = Number(cells[1]?.value ?? 999);
      const gender = (cells[4]?.value ?? "").toLowerCase();
      if (age <= maxAge) {
        if (gender === "female") girls++;
        else if (gender === "male") boys++;
      }
    }
  }
  return { girls, boys };
}

// ─── Helper: bin row delivery dates into a 12-month array ────────────────────
// Every Salesforce report now includes a delivery-date column. We auto-detect
// it from detailColumnInfo (preferring dataType=date/datetime, falling back to
// any API name containing "date"), then walk every row in the factMap and
// either sum a quantity column or count rows per month.
//
// Returns a 12-element array indexed by calendar month (0=Jan…11=Dec).
function monthlyByDate(report, opts = {}) {
  const out = new Array(12).fill(0);
  if (!report) return out;

  const colInfo = report.reportExtendedMetadata?.detailColumnInfo ?? {};
  const colNames = Object.keys(colInfo);
  if (!colNames.length) return out;

  // Locate the delivery-date column.
  let dateIdx = colNames.findIndex(n => {
    const dt = colInfo[n]?.dataType;
    return dt === "date" || dt === "datetime";
  });
  if (dateIdx === -1) {
    dateIdx = colNames.findIndex(n => /date/i.test(n) || /date/i.test(colInfo[n]?.label ?? ""));
  }
  if (dateIdx === -1) return out;

  // Locate an optional quantity column to sum (defaults to row count).
  let qtyIdx = -1;
  if (opts.quantityColumn) {
    qtyIdx = colNames.findIndex(n => n === opts.quantityColumn || n.endsWith("." + opts.quantityColumn));
  } else {
    qtyIdx = colNames.findIndex(n => /quantity/i.test(n) || /quantity/i.test(colInfo[n]?.label ?? ""));
  }

  // Restrict to a calendar year if requested.
  const year = opts.year ?? null;

  for (const [key, entry] of Object.entries(report.factMap ?? {})) {
    // Tabular reports keep rows under T!T; summary reports keep them under
    // grouping keys (0!T, 1!T, …) and leave T!T.rows empty — iterating every
    // entry covers both shapes without double-counting.
    for (const row of entry.rows ?? []) {
      const cells = row.dataCells ?? [];
      const raw = cells[dateIdx]?.value;
      if (!raw) continue;
      const d = new Date(raw);
      if (isNaN(d.getTime())) continue;
      if (year != null && d.getUTCFullYear() !== year) continue;

      let inc = 1;
      if (qtyIdx >= 0) {
        const v = Number(cells[qtyIdx]?.value);
        if (Number.isFinite(v)) inc = v;
      }
      out[d.getUTCMonth()] += inc;
    }
  }

  return out;
}

// Element-wise sum of several monthly arrays (same length).
function sumMonthly(...arrays) {
  const out = new Array(12).fill(0);
  for (const arr of arrays) {
    if (!Array.isArray(arr)) continue;
    for (let i = 0; i < out.length; i++) out[i] += arr[i] ?? 0;
  }
  return out;
}

// ─── Transform Functions ──────────────────────────────────────────────────────

function extractOverview(r) {
  // Totals are derived from component sections — computed at the end of transformAll()
  return null; // filled in by transformAll
}

function extractHotMeals(r) {
  return {
    plates: total(r.hot_meals),
    families: total(r.hot_meals_families, 1), // aggregate[1] = Record Count = unique families served
    monthly: monthlyByDate(r.hot_meals),
  };
}

function extractGroceries(r) {
  // VIVERES AVG COST report (groceries_avg_cost) contains all grocery metrics:
  //   aggregate[0] = Sum of Quantity  (bags delivered)
  //   aggregate[1] = Sum of Total Cost ($)
  //   aggregate[2] = Average Total Cost (avg cost per bag)
  //   aggregate[3] = RowCount (unique beneficiaries — verify against groceries_bu)
  const bags = total(r.groceries_avg_cost, 0);
  const totalCost = total(r.groceries_avg_cost, 1);
  const avgCost = total(r.groceries_avg_cost, 2);
  const ubBU = total(r.groceries_bu, 1); // aggregate[1] = Record Count = unique beneficiaries (97)
  return {
    bags,
    ub: ubBU,
    avgCost,
    totalCost,
    monthly: monthlyByDate(r.groceries),
  };
}

function extractClothing(r) {
  return {
    donations: total(r.clothing),
    ub: total(r.clothing_bu, 1), // aggregate[1] = Record Count = unique beneficiaries (50)
    monthly: monthlyByDate(r.clothing),
  };
}

function extractHealth(r) {
  const clinicConsultations = total(r.health_clinic_atenciones);
  const clinicUB = total(r.health_clinic_bu, 1); // aggregate[1] = Record Count = unique beneficiaries (86)
  const clinicVozManos = total(r.health_clinic_monto, 1);  // aggregate[1] = formula "unico" = $3,571.50 (Voz y Manos)
  const clinicPDV = total(r.health_clinic_pdv_cost);  // aggregate[0] = Sum of Cost PDV = $62

  const otherAids = total(r.health_other);
  const otherUB = total(r.health_other, 2); // aggregate[2] = Record Count = unique beneficiaries (77)
  const otherInvested = total(r.health_other, 1); // aggregate[1] = total cost

  // Use Resumen ES Salud for official totals (matches Power BI dashboard)
  // aggregate[0] = Sum of Quantity (total services delivered)
  // totalUB = number of unique beneficiary groupings (people who received any health service)
  const totalServices = r.health_resumen ? total(r.health_resumen, 0) : clinicConsultations + otherAids;
  const totalUB = r.health_resumen
    ? (r.health_resumen?.groupingsDown?.groupings?.length ?? Math.max(clinicUB, otherUB))
    : Math.max(clinicUB, otherUB);

  return {
    totalServices,
    totalUB,
    clinic: {
      consultations: clinicConsultations,
      ub: clinicUB,
      paidVozManos: clinicVozManos,
      paidPDV: clinicPDV,
    },
    other: {
      aids: otherAids,
      ub: otherUB,
      invested: otherInvested,
    },
    monthly: sumMonthly(
      monthlyByDate(r.health_clinic_atenciones),
      monthlyByDate(r.health_other),
    ),
  };
}

function extractEducation(r) {
  const kits = total(r.education_kits);
  const kitCost = total(r.education_kits_cost);
  const backpacks = total(r.education_backpacks);
  const backpackCost = total(r.education_backpacks_cost);
  const vbsCamps = total(r.education_vbs, 3); // aggregate[3] = Record Count = unique delivery dates = camps held

  return {
    schoolKits: kits,
    schoolKitCost: kitCost,
    backpacks,
    backpackCost,
    vbsCamps,
    monthly: sumMonthly(
      monthlyByDate(r.education_kits),
      monthlyByDate(r.education_backpacks),
    ),
  };
}

function extractShelter(r) {
  // Each shelter report:
  //   aggregate[0] = Sum of Quantity (total items/services)
  //   aggregate[1] = Unique Count (unique beneficiaries / families served)
  // Run inspect-report.js on each ID to verify aggregate indices.
  const furniture = total(r.shelter_furniture);
  const furnitureUB = total(r.shelter_furniture, 1);
  const appliances = total(r.shelter_appliances);
  const appliancesUB = total(r.shelter_appliances, 1);
  const household = total(r.shelter_household);
  const householdUB = total(r.shelter_household, 1);
  const electronics = total(r.shelter_electronics);
  const electronicsUB = total(r.shelter_electronics, 1);

  const services = furniture + appliances + household + electronics;
  const ub = furnitureUB + appliancesUB + householdUB + electronicsUB;

  return {
    services,
    ub,
    furniture: { services: furniture, ub: furnitureUB },
    appliances: { services: appliances, ub: appliancesUB },
    household: { services: household, ub: householdUB },
    electronics: { services: electronics, ub: electronicsUB },
    monthly: sumMonthly(
      monthlyByDate(r.shelter_furniture),
      monthlyByDate(r.shelter_appliances),
      monthlyByDate(r.shelter_household),
      monthlyByDate(r.shelter_electronics),
    ),
  };
}

function extractLifeFarms(r) {
  // Each report = count of farms in that category (grand total row count)
  const idealDone = total(r.life_farms_ideal);
  const fullDone = total(r.life_farms_full);
  const basicDone = total(r.life_farms_basic);
  const multiDone = total(r.life_farms_multiplication);
  const urbanDone = total(r.life_farms_urban);

  return {
    idealFarm: { goal: 30, done: idealDone },
    fullSizeFarm: { goal: 10, done: fullDone },
    totalChampions: { goal: 40, done: idealDone + fullDone },
    basicFarm: { goal: 118, done: basicDone },
    multiplication: { goal: 108, done: multiDone },
    urbanFarm: { goal: null, done: urbanDone },
    monthly: sumMonthly(
      monthlyByDate(r.life_farms_ideal),
      monthlyByDate(r.life_farms_full),
      monthlyByDate(r.life_farms_basic),
      monthlyByDate(r.life_farms_multiplication),
      monthlyByDate(r.life_farms_urban)
    ),
    urbanMonthly: monthlyByDate(r.life_farms_urban),
  };
}

// MEPs come from live SOQL metrics (fetchMepMetrics in sync-salesforce.js), not from
// a Salesforce report — none exists. Businesses = Account RecordType 'Microbusiness'
// grouped by Estado_MEP__c; capital = MEP_Finance_Transaction__c ledger sums;
// marketReady = MEP_Finance__c businesses active >9 months.
function buildMeps(m) {
  if (!m?.mepStatus) return null; // metrics fetch failed — keep null, UI falls back
  const s = m.mepStatus;
  const fund = m.mepFund ?? {};
  const disbursed = fund.disbursed ?? 0;
  return {
    total: Object.values(s).reduce((a, b) => a + b, 0),
    active: s["activo"] ?? 0,
    inactive: s["inactivo"] ?? 0,
    finished: s["finalizado"] ?? 0,
    aborted: s["abortado"] ?? 0,
    marketReady: m.mepMarketReady ?? 0,
    participants: m.level3Served ?? null, // distinct people served by the program this year
    fund: {
      year: fund.year ?? null, // disbursed/repaid/rate are YTD for this year; outstanding is current
      disbursed,
      repaid: fund.repaid ?? 0,
      outstanding: fund.outstanding ?? 0,
      repaymentRate: disbursed > 0 ? Math.round(((fund.repaid ?? 0) / disbursed) * 100) : null,
    },
    locations: m.mepLocations ?? [], // [{ name: string|null, count }] — null = no location recorded
    monthly: m.mepMonthly ?? new Array(12).fill(0),
  };
}

function extractSharkTank(r) {
  if (!r.shark_tank_winners) return null;
  return {
    winners: total(r.shark_tank_winners),       // aggregate[0] = Sum of Quantity = winner count
    pdvCost: total(r.shark_tank_winners, 1),    // aggregate[1] = Sum of Cost PDV
    monthly: monthlyByDate(r.shark_tank_winners),
  };
}

function extractEvangelism(r) {
  const biblesES = total(r.evangelism_bibles_es);
  const biblesQU = total(r.evangelism_bibles_qu);
  const biblesNinos = total(r.evangelism_bibles_ninos);
  // education_vbs report is grouped by unique delivery date:
  //   aggregate[3] = Record Count = unique dates = camps held
  //   aggregate[0] = Sum of Quantity = total children who attended
  const vbsCamps = total(r.education_vbs, 3);    // aggregate[3] = unique delivery dates = camps held
  const childrenVBS = total(r.education_vbs, 0);    // aggregate[0] = Sum of Quantity = children attended
  const personasAlcanzadas = total(r.evangelism_personas); // aggregate[0] = Record Count = people reached

  return {
    bibles: biblesES + biblesQU + biblesNinos,
    vbsCamps,
    childrenVBS,
    personasAlcanzadas,
    monthly: sumMonthly(
      monthlyByDate(r.evangelism_bibles_es),
      monthlyByDate(r.evangelism_bibles_qu),
      monthlyByDate(r.evangelism_bibles_ninos),
      monthlyByDate(r.evangelism_personas),
    ),
  };
}

function extractBeneficiaries(r) {
  // Confirmed aggregate indices via live inspection:
  //   nuevos_apas_uio / nuevos_apas_imb2 grand total (T!T):
  //     [0] = Sum of Current Age (irrelevant)
  //     [1] = Unique Count of Contact_Number__c  → new UB (beneficiaries)
  //     [2] = Unique Count of APA_Number__c      → new families
  //     [3] = RowCount (same as [1] for these reports)
  //
  //   beneficiaries_* reports grand total (T!T):
  //     [1] = Unique Count of Contact Number (APA) → total beneficiaries
  //     [2] = Unique Count of APA Number           → total accounts (families)
  const newUBUIO = total(r.nuevos_apas_uio, 1);  // Quito: 44 new beneficiaries
  const newFamiliesUIO = total(r.nuevos_apas_uio, 2);  // Quito: 15 new families
  const newUBIMB2 = total(r.nuevos_apas_imb2, 1);  // Imbabura: 41 new beneficiaries
  const newFamiliesIMB2 = total(r.nuevos_apas_imb2, 2);  // Imbabura: 12 new families

  // Girls and boys aged 0–13, extracted from per-contact detail rows
  // (Contact.Gender__c + Contact.Current_Age__c columns in the report)
  const childrenQ = countChildren(r.beneficiaries_quito);
  const childrenIMB = countChildren(r.beneficiaries_imbabura);

  return {
    combined: {
      accounts: total(r.beneficiaries_combined, 2),
      beneficiaries: total(r.beneficiaries_combined, 1),
      girls: childrenQ.girls + childrenIMB.girls,
      boys: childrenQ.boys + childrenIMB.boys,
      newFamilies: newFamiliesUIO + newFamiliesIMB2,
      newUB: newUBUIO + newUBIMB2,
    },
    quito: {
      accounts: total(r.beneficiaries_quito, 2),
      beneficiaries: total(r.beneficiaries_quito, 1),
      girls: childrenQ.girls,
      boys: childrenQ.boys,
      newFamilies: newFamiliesUIO,
      newUB: newUBUIO,
    },
    imbabura: {
      accounts: total(r.beneficiaries_imbabura, 2),
      beneficiaries: total(r.beneficiaries_imbabura, 1),
      girls: childrenIMB.girls,
      boys: childrenIMB.boys,
      newFamilies: newFamiliesIMB2,
      newUB: newUBIMB2,
    },
  };
}

function extractChristmas(r) {
  return {
    hotMeals: total(r.christmas_comida),
    groceries: total(r.christmas_viveres),
    toys: total(r.christmas_juguetes),
    monthly: sumMonthly(
      monthlyByDate(r.christmas_comida),
      monthlyByDate(r.christmas_viveres),
      monthlyByDate(r.christmas_juguetes),
      monthlyByDate(r.christmas_other),
    ),
  };
}

function extractEmergency(r) {
  return {
    groceries: total(r.emergency_viveres),
    monthly: monthlyByDate(r.emergency_viveres),
  };
}

// ─── Master transform ──────────────────────────────────────────────────────────
// `metrics` carries values computed live via SOQL in sync-salesforce.js (no single
// Salesforce report provides them). Shape:
//   { level1Served, level2Served, level3Served, totalReached,            (fetchLevelMetrics)
//     mepStatus, mepMarketReady, mepFund, mepLocations, mepMonthly }     (fetchMepMetrics)
export function transformAll(r, metrics = {}) {
  const hotMeals = extractHotMeals(r);
  const groceries = extractGroceries(r);
  const clothing = extractClothing(r);
  const health = extractHealth(r);
  const education = extractEducation(r);
  const shelter = extractShelter(r);
  const lifeFarms = extractLifeFarms(r);
  const meps = buildMeps(metrics);
  const sharkTank = extractSharkTank(r);
  const evangelism = extractEvangelism(r);
  const bene = extractBeneficiaries(r);
  const christmas = extractChristmas(r);
  const emergency = extractEmergency(r);

  const totalDeliveries =
    (hotMeals?.plates ?? 0) +
    (groceries?.bags ?? 0) +
    (clothing?.donations ?? 0) +
    (health?.totalServices ?? 0) +
    (education?.schoolKits ?? 0) +
    (education?.backpacks ?? 0) +
    (shelter?.services ?? 0);

  // New families = UIO + IMB2 (fiscal year) — aggregate[2] = Unique APA_Number__c = families
  // (aggregate[1] = unique Contact_Number = beneficiaries; aggregate[2] = unique APA_Number = families)
  const newFamiliesUIO = total(r.nuevos_apas_uio, 2);  // Quito: 15
  const newFamiliesIMB2 = total(r.nuevos_apas_imb2, 2);  // Imbabura: 12

  const overview = {
    totalBeneficiaries: bene?.combined?.beneficiaries ?? 0,
    totalAccounts: bene?.combined?.accounts ?? 0,
    newFamilies: newFamiliesUIO + newFamiliesIMB2,
    totalDeliveries,
    // Grand total = distinct people in households served this year (family reach,
    // deduplicated). Computed live via SOQL; the active-life-farms count is shown
    // beside it on the overview but NOT added in (different unit: farms, not people).
    totalReached: metrics.totalReached ?? null,
  };

  // ── Level cross-program aggregates (Overview cards) ──────────────────────────
  // totalCost: sum of every cost component currently tracked in Salesforce.
  // individualsServed: distinct beneficiaries served in each level, deduplicated
  // (COUNT_DISTINCT(Contact) + not-registered persons by N.r. id). Computed live via
  // SOQL in sync-salesforce.js and passed in as `metrics` — a plain sum of each
  // program's UB would double-count people served by more than one program.
  const level1Cost = (groceries?.totalCost ?? 0);
  const level2Cost =
    (health?.clinic?.paidVozManos ?? 0) +
    (health?.clinic?.paidPDV ?? 0) +
    (health?.other?.invested ?? 0) +
    ((education?.schoolKits ?? 0) * (education?.schoolKitCost ?? 0)) +
    ((education?.backpacks ?? 0) * (education?.backpackCost ?? 0));
  const level3Cost = 0; // no cost components tracked yet (life farms / MEPs)

  const level1 = {
    individualsServed: metrics.level1Served ?? null, // Hunger + Emergency (deduped)
    totalCost: level1Cost > 0 ? level1Cost : null,
  };
  const level2 = {
    individualsServed: metrics.level2Served ?? null, // Health + Education + Shelter (deduped)
    totalCost: level2Cost > 0 ? level2Cost : null,
  };
  const level3 = {
    individualsServed: metrics.level3Served ?? null, // Microbusiness/MEP (deduped)
    totalCost: null, // TODO: add cost components when life farms / MEPs report cost
  };

  return {
    overview,
    hotMeals,
    groceries,
    clothing,
    health,
    education,
    shelter,
    lifeFarms,
    meps,
    sharkTank,
    evangelism,
    beneficiaries: bene,
    christmas,
    emergency,
    level1,
    level2,
    level3,
  };
}
