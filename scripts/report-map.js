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
  // health_resumen (00OUc0000076XBlMAM) intentionally removed: the report carries a
  // custom Jan 1 – Mar 31 date filter, so its totals only cover Q1. Health totals
  // are computed via live SOQL instead (fetchSectionMetrics in sync-salesforce.js).
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

  // Restrict to a calendar year. Defaults to the CURRENT year: several reports
  // (Shark Tank, urban farms) are all-time, and without this their 2024/2025
  // rows land in the same 12 buckets as this year's (e.g. a Nov 2024 winner
  // showing up in this year's November). Pass year: null for all-time binning.
  const year = opts.year === undefined ? new Date().getFullYear() : opts.year;

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
  //   aggregate[2] = Average Total Cost (avg cost per DELIVERY RECORD — not per bag:
  //                  some records deliver several bags, so avgCost × bags ≠ totalCost)
  //   aggregate[3] = RowCount (unique beneficiaries — verify against groceries_bu)
  const bags = total(r.groceries_avg_cost, 0);
  const totalCost = total(r.groceries_avg_cost, 1);
  // Average unit cost per kit, so that avgCost × bags = totalCost holds on the card.
  const avgCost = bags > 0 ? totalCost / bags : 0;
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
  // Note: monthly[0] (January) = 0 is genuine — verified Aug 2026 via SOQL that
  // Salesforce has no clothing service deliveries dated January this year. If
  // January distributions happened, they were never recorded (data-entry gap).
  return {
    donations: total(r.clothing),
    ub: total(r.clothing_bu, 1), // aggregate[1] = Record Count = unique beneficiaries (50)
    monthly: monthlyByDate(r.clothing),
  };
}

function extractHealth(r, m = {}) {
  const clinicConsultations = total(r.health_clinic_atenciones);
  const clinicUB = total(r.health_clinic_bu, 1); // aggregate[1] = Record Count = unique beneficiaries (86)
  const clinicVozManos = total(r.health_clinic_monto, 1);  // aggregate[1] = formula "unico" = $3,571.50 (Voz y Manos)
  const clinicPDV = total(r.health_clinic_pdv_cost);  // aggregate[0] = Sum of Cost PDV = $62

  const otherAids = total(r.health_other);
  const otherUB = total(r.health_other, 2); // aggregate[2] = Record Count = unique beneficiaries (77)
  const otherInvested = total(r.health_other, 1); // aggregate[1] = total cost

  // Program-wide totals come from live SOQL (fetchSectionMetrics): total services =
  // sum of quantity across the Health program this year; total people = distinct
  // contacts + distinct not-registered persons (deduplicated across clinic/other,
  // which is why it is NOT clinicUB + otherUB). The old "Resumen ES Salud" report
  // was dropped as a source — it carried a custom Q1-only date filter, which made
  // the headline (431/205) smaller than its own components (650 consultations).
  const totalServices = m.healthServices ?? (clinicConsultations + otherAids);
  const totalUB = m.healthUB ?? Math.max(clinicUB, otherUB);

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
    monthly: m.healthMonthly ?? sumMonthly(
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

function extractShelter(r, m = {}) {
  // Category totals come from live SOQL over the service lookup (fetchSectionMetrics):
  // the Salesforce reports filter on the delivery NAME, which drops records whose
  // auto-name was edited, and they carry no date column for monthlies. The reports
  // remain as fallbacks:
  //   aggregate[0] = Sum of Quantity (total items/services)
  //   aggregate[1] = Unique Count (unique beneficiaries / families served)
  const cat = (key, report) => m.shelterCategories?.[key] ?? {
    services: total(report),
    ub: total(report, 1),
  };
  const furniture = cat("furniture", r.shelter_furniture);
  const appliances = cat("appliances", r.shelter_appliances);
  const household = cat("household", r.shelter_household);
  const electronics = cat("electronics", r.shelter_electronics);

  const services = furniture.services + appliances.services + household.services + electronics.services;
  const ub = furniture.ub + appliances.ub + household.ub + electronics.ub;

  return {
    services,
    ub,
    furniture,
    appliances,
    household,
    electronics,
    // The four shelter reports have no delivery-date column, so their rows can't
    // be binned by month (this is why the tab's chart was empty). The monthly
    // series comes from live SOQL over the same four service categories.
    monthly: m.shelterMonthly ?? sumMonthly(
      monthlyByDate(r.shelter_furniture),
      monthlyByDate(r.shelter_appliances),
      monthlyByDate(r.shelter_household),
      monthlyByDate(r.shelter_electronics),
    ),
  };
}

function extractLifeFarms(r, m = {}) {
  // Each report = running total of farms in that category (grand total row count).
  // "New per month" can't come from these reports (most lack a date column), so it
  // comes from live SOQL over this year's farm service deliveries (fetchSectionMetrics).
  // A report that fails to fetch (or was emptied in Salesforce) yields 0 from
  // total(); the SOQL all-time distinct-household counts (farmsTotals) back it up
  // so a flaky fetch can't publish "0 farms" next to "12 new this year".
  const ft = m.farmsTotals ?? {};
  const idealDone = total(r.life_farms_ideal) || ft.ideal || 0;
  const fullDone = total(r.life_farms_full) || ft.full || 0;
  const basicDone = total(r.life_farms_basic) || ft.basic || 0;
  const multiDone = total(r.life_farms_multiplication) || ft.multiplication || 0;
  const urbanDone = total(r.life_farms_urban) || ft.urban || 0;

  const fm = m.farmsMonthly ?? {};
  const sum = (arr) => (Array.isArray(arr) ? arr.reduce((a, b) => a + (b ?? 0), 0) : 0);

  return {
    idealFarm: { goal: 30, done: idealDone },
    fullSizeFarm: { goal: 10, done: fullDone },
    totalChampions: { goal: 40, done: idealDone + fullDone },
    basicFarm: { goal: 118, done: basicDone },
    multiplication: { goal: 108, done: multiDone },
    urbanFarm: { goal: null, done: urbanDone },
    total: idealDone + fullDone + basicDone + multiDone + urbanDone,
    newThisYear: {
      ideal: sum(fm.ideal),
      full: sum(fm.full),
      basic: sum(fm.basic),
      multiplication: sum(fm.multiplication),
      urban: sum(fm.urban),
    },
    // New farms set up per month this year (all types / urban only)
    monthly: fm.combined ?? sumMonthly(
      monthlyByDate(r.life_farms_ideal),
      monthlyByDate(r.life_farms_full),
      monthlyByDate(r.life_farms_basic),
      monthlyByDate(r.life_farms_multiplication),
      monthlyByDate(r.life_farms_urban)
    ),
    urbanMonthly: fm.urban ?? monthlyByDate(r.life_farms_urban),
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
  const totalDisbursed = fund.totalDisbursed ?? 0;
  return {
    total: Object.values(s).reduce((a, b) => a + b, 0),
    active: s["activo"] ?? 0,
    inactive: s["inactivo"] ?? 0,
    finished: s["finalizado"] ?? 0,
    aborted: s["abortado"] ?? 0,
    marketReady: m.mepMarketReady ?? 0,
    participants: m.level3Served ?? null, // distinct people served by the program this year
    fund: {
      year: fund.year ?? null, // disbursed/repaid are YTD flows; total* are all-time program totals
      disbursed,
      repaid: fund.repaid ?? 0,
      totalDisbursed,
      totalRepaid: fund.totalRepaid ?? 0,
      outstanding: fund.outstanding ?? 0,
      // Program-wide repayment rate (Erin's definition): share of all capital ever
      // disbursed that is no longer outstanding. The YTD flows are too small to
      // rate meaningfully (e.g. $278.99 disbursed in 2026).
      repaymentRate: totalDisbursed > 0
        ? Math.round(((totalDisbursed - (fund.outstanding ?? 0)) / totalDisbursed) * 100)
        : null,
      loansMonthly: fund.loansMonthly ?? new Array(12).fill(0), // loans made per month this year
    },
    locations: m.mepLocations ?? [], // [{ name, count }] — null = no location recorded, "__OTHERS__" = smaller communities
    monthly: m.mepMonthly ?? new Array(12).fill(0),
  };
}

function extractSharkTank(r) {
  if (!r.shark_tank_winners) return null;
  // The Shark Tank report is ALL-TIME (winners span 2024/2025/2026), so the
  // headline is a running total. monthlyByDate defaults to the current year,
  // which keeps prior-year winners out of this year's chart.
  const monthly = monthlyByDate(r.shark_tank_winners);
  return {
    winners: total(r.shark_tank_winners),       // aggregate[0] = Sum of Quantity = winner count (all-time)
    pdvCost: total(r.shark_tank_winners, 1),    // aggregate[1] = Sum of Cost PDV
    winnersThisYear: monthly.reduce((a, b) => a + b, 0),
    monthly,
  };
}

function extractEvangelism(r, m = {}) {
  const ev = m.evangelism ?? {};
  const biblesES = total(r.evangelism_bibles_es);
  const biblesQU = total(r.evangelism_bibles_qu);
  const biblesNinos = total(r.evangelism_bibles_ninos);
  // education_vbs report is grouped by unique delivery date:
  //   aggregate[3] = Record Count = unique dates = camps held
  //   aggregate[0] = Sum of Quantity = total children who attended
  const vbsCamps = total(r.education_vbs, 3);    // aggregate[3] = unique delivery dates = camps held
  const personasAlcanzadas = total(r.evangelism_personas); // aggregate[0] = Record Count = people reached

  // Totals and monthly series come from live SOQL (fetchSectionMetrics) so the
  // headline numbers and the charts always agree; the reports are the fallback.
  // The bible reports have no date column, which is why the old monthly chart
  // was permanently empty.
  return {
    bibles: ev.bibles ?? (biblesES + biblesQU + biblesNinos),
    vbsCamps,
    childrenVBS: ev.vbsAttendees ?? total(r.education_vbs, 0), // total attendances (children can repeat camps)
    vbsUnique: ev.vbsUnique ?? null,                           // distinct children who attended a VBS camp
    professionsOfFaith: ev.professionsOfFaith ?? null,         // this year ("Profesion de Fe (Educación)" service)
    professionsOfFaithAllTime: ev.professionsOfFaithAllTime ?? null,
    personasAlcanzadas,
    biblesMonthly: ev.biblesMonthly ?? new Array(12).fill(0),
    vbsMonthly: ev.vbsMonthly ?? new Array(12).fill(0),        // attendances per month
    pofMonthly: ev.pofMonthly ?? new Array(12).fill(0),
    monthly: ev.biblesMonthly ?? new Array(12).fill(0),        // kept for backward compatibility
  };
}

function extractBeneficiaries(r, m = {}) {
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
  const newUBUIO = total(r.nuevos_apas_uio, 1);  // Quito: new beneficiaries this year
  const newFamiliesUIO = total(r.nuevos_apas_uio, 2);  // Quito: new families this year
  const newUBIMB2 = total(r.nuevos_apas_imb2, 1);  // Imbabura: new beneficiaries this year
  const newFamiliesIMB2 = total(r.nuevos_apas_imb2, 2);  // Imbabura: new families this year

  // Regional totals and girls/boys come from live SOQL (fetchSectionMetrics).
  // The regional REPORTS proved unreliable: "Contactos y Cuentas UIO" was edited
  // in Salesforce with age (5–13) and created-date filters, collapsing Quito to
  // ~94 people — and the report-based girls/boys only covered two provinces.
  // The reports remain as fallbacks if the SOQL metrics fail.
  const sb = m.beneficiaries;

  // Girls and boys aged 0–13, extracted from per-contact detail rows
  // (Contact.Gender__c + Contact.Current_Age__c columns in the report)
  const childrenQ = countChildren(r.beneficiaries_quito);
  const childrenIMB = countChildren(r.beneficiaries_imbabura);

  return {
    combined: {
      // Report first (its unique-count semantics are the official definition and
      // count blank APA numbers as a family); SOQL backs it up so a failed or
      // silently-edited report can't zero out the dashboard's headline numbers.
      accounts: total(r.beneficiaries_combined, 2) || sb?.combined?.fam || 0,
      beneficiaries: total(r.beneficiaries_combined, 1) || sb?.combined?.ub || 0,
      girls: sb?.combined?.girls ?? (childrenQ.girls + childrenIMB.girls),
      boys: sb?.combined?.boys ?? (childrenQ.boys + childrenIMB.boys),
      newFamilies: newFamiliesUIO + newFamiliesIMB2,
      newUB: newUBUIO + newUBIMB2,
    },
    quito: {
      accounts: sb?.quito?.fam ?? total(r.beneficiaries_quito, 2),
      beneficiaries: sb?.quito?.ub ?? total(r.beneficiaries_quito, 1),
      girls: sb?.quito?.girls ?? childrenQ.girls,
      boys: sb?.quito?.boys ?? childrenQ.boys,
      newFamilies: newFamiliesUIO,
      newUB: newUBUIO,
    },
    imbabura: {
      accounts: sb?.imbabura?.fam ?? total(r.beneficiaries_imbabura, 2),
      beneficiaries: sb?.imbabura?.ub ?? total(r.beneficiaries_imbabura, 1),
      girls: sb?.imbabura?.girls ?? childrenIMB.girls,
      boys: sb?.imbabura?.boys ?? childrenIMB.boys,
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
//     mepStatus, mepMarketReady, mepFund, mepLocations, mepMonthly,      (fetchMepMetrics)
//     healthServices, healthUB, healthMonthly, shelterMonthly,           (fetchSectionMetrics)
//     evangelism, farmsMonthly, beneficiaries }
export function transformAll(r, metrics = {}) {
  const hotMeals = extractHotMeals(r);
  const groceries = extractGroceries(r);
  const clothing = extractClothing(r);
  const health = extractHealth(r, metrics);
  const education = extractEducation(r);
  const shelter = extractShelter(r, metrics);
  const lifeFarms = extractLifeFarms(r, metrics);
  const meps = buildMeps(metrics);
  const sharkTank = extractSharkTank(r);
  const evangelism = extractEvangelism(r, metrics);
  const bene = extractBeneficiaries(r, metrics);
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
