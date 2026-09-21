/**
 * Pan de Vida Dashboard — Salesforce Sync Script
 *
 * Fetches all configured Salesforce reports and writes the results to
 * dashboard-app/public/data/dashboard.json. Run this script via the
 * Plesk Scheduled Tasks cron (twice a day).
 *
 * Usage:
 *   cd scripts && node sync-salesforce.js
 *
 * Environment variables: copy ../.env.example to ../.env and fill in values.
 */

import { writeFileSync, readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createSign } from "crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Load .env ────────────────────────────────────────────────────────────────
// Try loading dotenv; if the package isn't installed yet, fall back to reading
// the .env file manually so the script still works before `npm install`.
try {
  const { default: dotenv } = await import("dotenv");
  dotenv.config({ path: resolve(__dirname, ".env") });
} catch {
  try {
    const raw = readFileSync(resolve(__dirname, ".env"), "utf8");
    for (const line of raw.split("\n")) {
      const [key, ...rest] = line.split("=");
      if (key && !key.startsWith("#") && rest.length) {
        process.env[key.trim()] = rest.join("=").trim();
      }
    }
  } catch {
    // .env not found — rely on shell environment variables
  }
}

// ─── Config ───────────────────────────────────────────────────────────────────
const {
  SF_LOGIN_URL  = "https://login.salesforce.com",
  SF_USERNAME,
  SF_CLIENT_ID,
  SF_PRIVATE_KEY_PATH = "./server.key",
  OUTPUT_PATH   = "../dashboard-app/public/data/dashboard.json",
} = process.env;

const API_VERSION = "v59.0";
const OUTPUT_FILE = OUTPUT_PATH.startsWith("/") ? OUTPUT_PATH : resolve(__dirname, OUTPUT_PATH);

// ─── JWT helpers ──────────────────────────────────────────────────────────────
function base64url(str) {
  return Buffer.from(str).toString("base64")
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function buildJWT(clientId, username, loginUrl, privateKey) {
  const header  = base64url(JSON.stringify({ alg: "RS256" }));
  const now     = Math.floor(Date.now() / 1000);
  const payload = base64url(JSON.stringify({
    iss: clientId,
    sub: username,
    aud: loginUrl,
    exp: now + 300,   // 5-minute window
  }));

  const signingInput = `${header}.${payload}`;
  const sign = createSign("RSA-SHA256");
  sign.update(signingInput);
  const signature = sign.sign(privateKey, "base64")
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");

  return `${signingInput}.${signature}`;
}

// ─── Salesforce Auth (JWT Bearer Flow — works with MFA-enforced orgs) ─────────
async function authenticate() {
  const required = { SF_USERNAME, SF_CLIENT_ID };
  const missing = Object.entries(required).filter(([, v]) => !v).map(([k]) => k);
  if (missing.length) throw new Error(`Missing env vars: ${missing.join(", ")}`);

  const keyPath = resolve(__dirname, SF_PRIVATE_KEY_PATH);
  let privateKey;
  try {
    privateKey = readFileSync(keyPath, "utf8");
  } catch {
    throw new Error(`Private key not found at ${keyPath}. Run: openssl genrsa -out server.key 2048`);
  }

  const jwt = buildJWT(SF_CLIENT_ID, SF_USERNAME, SF_LOGIN_URL, privateKey);

  const res = await fetch(`${SF_LOGIN_URL}/services/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion:  jwt,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Salesforce auth failed (${res.status}): ${body}`);
  }

  const { access_token, instance_url } = await res.json();
  console.log(`✓ Authenticated via JWT. Instance: ${instance_url}`);
  return { accessToken: access_token, instanceUrl: instance_url };
}

// ─── Fetch a single report ────────────────────────────────────────────────────
async function fetchReport(instanceUrl, accessToken, reportId) {
  const url = `${instanceUrl}/services/data/${API_VERSION}/analytics/reports/${reportId}?includeDetails=true`;
  const res = await fetch(url, {
    headers: {
      Authorization:  `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Report ${reportId} fetch failed (${res.status}): ${body}`);
  }

  return res.json();
}

// ─── Safe fetch (retries transient errors; logs but doesn't abort the sync) ────
// A failed report otherwise turns into a silent 0 in the dashboard (total(null)
// returns 0), which is how a flaky fetch once published "0 full-size farms".
// Failures that survive the retries are recorded in FAILED_REPORTS and written
// to dashboard.json as syncWarnings so a bad sync is visible in the data itself.
const FAILED_REPORTS = [];
async function safeReport(instanceUrl, accessToken, reportId, reportName) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const data = await fetchReport(instanceUrl, accessToken, reportId);
      console.log(`  ✓ ${reportName} (${reportId})${attempt > 1 ? ` [attempt ${attempt}]` : ""}`);
      return data;
    } catch (err) {
      if (attempt === 3) {
        console.warn(`  ✗ ${reportName} (${reportId}): ${err.message}`);
        FAILED_REPORTS.push(reportName);
        return null;
      }
      await new Promise((res) => setTimeout(res, 1500 * attempt));
    }
  }
}

// ─── Run a SOQL query (REST query endpoint) ────────────────────────────────────
async function runSoql(instanceUrl, accessToken, soql) {
  const url = `${instanceUrl}/services/data/${API_VERSION}/query?q=${encodeURIComponent(soql)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`SOQL failed (${res.status}): ${await res.text()}`);
  const json = await res.json();
  // Row queries page at 2000 records — follow nextRecordsUrl so a growing result
  // can never be silently truncated.
  let next = json.nextRecordsUrl;
  while (next) {
    const page = await fetch(`${instanceUrl}${next}`, {
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    });
    if (!page.ok) throw new Error(`SOQL paging failed (${page.status}): ${await page.text()}`);
    const pj = await page.json();
    json.records.push(...(pj.records ?? []));
    next = pj.nextRecordsUrl;
  }
  return json;
}

// Read a single aggregate value (aliased "e") from a SOQL aggregate query.
async function aggValue(instanceUrl, accessToken, soql) {
  const json = await runSoql(instanceUrl, accessToken, soql);
  const rec = json.records?.[0] ?? {};
  return Number(rec.e ?? rec.expr0 ?? 0) || 0;
}

// ─── Distinct people behind a set of service deliveries ────────────────────────
// = registered contacts + not-registered persons (identified by their N.r.
// document). This is the dashboard's definition of a unique beneficiary
// everywhere, and the reason every "BU …" report is now only a fallback: those
// reports group by Contact, so ALL deliveries without a contact lookup collapse
// into a single "-" group. Verified on hot meals (Sep 2026): 192 contacts + 125
// not-registered people = 317, while "BU Comida Caliente (familia)" said 193.
async function peopleCount(instanceUrl, accessToken, where) {
  const SD = "pmdm__ServiceDelivery__c";
  const contacts = await aggValue(instanceUrl, accessToken,
    `SELECT COUNT_DISTINCT(pmdm__Contact__c) e FROM ${SD} WHERE ${where}`);
  const notReg = await aggValue(instanceUrl, accessToken,
    `SELECT COUNT_DISTINCT(N_r_Identification__c) e FROM ${SD} WHERE ${where} AND pmdm__Contact__c = null`);
  return contacts + notReg;
}

// Service-name "contains" filter — mirrors the reports' CUST_NAME contains filters.
const svcLike = (...parts) =>
  `(${parts.map((p) => `pmdm__Service__r.Name LIKE '%${p}%'`).join(" OR ")})`;
// Clinic services, as the "Clínica la Y" reports define them.
const CLINIC_FILTER = svcLike("Atencion", "fisio", "odon");

// ─── Cross-level "individuals served" + grand-total reached (live SOQL) ─────────
// No single Salesforce report provides these deduplicated distinct-people counts,
// so we compute them directly from pmdm__ServiceDelivery__c:
//   • per-level served = COUNT_DISTINCT(Contact) + COUNT_DISTINCT(N.r. id) over the
//     programs mapped to each level (deduped — no double-count across programs)
//   • totalReached = distinct people in the households served this year (family reach)
// Window = current calendar year. Program→level mapping mirrors report-map.js.
async function fetchLevelMetrics(instanceUrl, accessToken) {
  const Y = new Date().getFullYear();
  // Quantity >= 1 keeps the same convention as the reports and fetchSectionMetrics:
  // zero/blank-quantity rows are planned-but-not-delivered and would inflate the
  // distinct-people counts.
  const win = `pmdm__DeliveryDate__c >= ${Y}-01-01 AND pmdm__DeliveryDate__c <= ${Y}-12-31 ` +
    `AND pmdm__Quantity__c >= 1`;
  const SD = "pmdm__ServiceDelivery__c";
  const prog = "pmdm__Service__r.pmdm__Program__r.Name";
  const levelFilters = {
    level1Served: `${prog} IN ('Programa de Mitigación del hambre (Hunger relief)','Programa de Ayuda de Emergencia (Emergency relief)')`,
    level2Served: `${prog} IN ('Programa de Salud (Health)','Programa de Educación (Education)','Programa Mejoramiento de condiciones de vida (Shelter)')`,
    level3Served: `${prog} = 'Programa de Microemprendimiento (Microbusiness)'`,
  };

  const metrics = {};
  for (const [key, filter] of Object.entries(levelFilters)) {
    metrics[key] = await peopleCount(instanceUrl, accessToken, `${win} AND (${filter})`);
  }

  // Grand total = distinct people living in any household that received a service
  // this year (served beneficiaries are a subset of these households).
  metrics.totalReached = await aggValue(instanceUrl, accessToken,
    `SELECT COUNT(Id) e FROM Contact WHERE AccountId IN ` +
    `(SELECT Contact_Assigned_Household__c FROM ${SD} WHERE ${win} AND Contact_Assigned_Household__c != null)`);

  return metrics;
}

// ─── Section metrics (live SOQL) ────────────────────────────────────────────────
// Several Salesforce reports proved unreliable as dashboard sources (verified
// against the org in Aug 2026):
//   • "Resumen ES Salud" carries a CUSTOM Jan 1 – Mar 31 date filter, so its
//     totals (431 services / 205 people) only cover Q1 — the clinic and
//     other-aids reports cover the full year, hence total < parts.
//   • "Contactos y Cuentas UIO" was narrowed to ages 5–13 plus a created-date
//     window, collapsing Quito to ~94 people.
//   • The shelter and life-farm reports have no delivery-date column, so no
//     monthly series can be derived from their rows.
// These metrics are computed straight from the objects instead, so a report
// edit in Salesforce can no longer silently skew the dashboard.
async function fetchSectionMetrics(instanceUrl, accessToken) {
  const Y = new Date().getFullYear();
  const SD = "pmdm__ServiceDelivery__c";
  // Quantity >= 1 mirrors the standard filter on all PDV reports: rows with a
  // zero/blank quantity are planned-but-not-delivered entries and would inflate
  // the distinct-people counts (sums are unaffected either way).
  const win = `pmdm__DeliveryDate__c >= ${Y}-01-01 AND pmdm__DeliveryDate__c <= ${Y}-12-31 ` +
    `AND pmdm__Quantity__c >= 1`;

  const monthlyFrom = (records, key = "e") => {
    const out = new Array(12).fill(0);
    for (const rec of records ?? []) {
      const idx = (Number(rec.m) || 0) - 1;
      if (idx >= 0 && idx < 12) out[idx] = Number(rec[key]) || 0;
    }
    return out;
  };
  // Sum of Quantity per calendar month (this year) for service deliveries
  const monthlySoql = async (filter) => {
    const j = await runSoql(instanceUrl, accessToken,
      `SELECT CALENDAR_MONTH(pmdm__DeliveryDate__c) m, SUM(pmdm__Quantity__c) e FROM ${SD} ` +
      `WHERE ${win} AND (${filter}) GROUP BY CALENDAR_MONTH(pmdm__DeliveryDate__c)`);
    return monthlyFrom(j.records);
  };
  const agg = (soql) => aggValue(instanceUrl, accessToken, soql);

  // Each section runs in its own try/catch so one failing query (field rename,
  // row limit, permission change) only reverts THAT section to its report-based
  // fallback instead of discarding every metric — several of those fallbacks are
  // the known-broken reports this function exists to bypass.
  const out = {};

  // ── Health: program-wide, full year (replaces the Q1-filtered resumen) ──────
  try {
    const HEALTH = `pmdm__Service__r.pmdm__Program__r.Name = 'Programa de Salud (Health)'`;
    out.healthServices = await agg(
      `SELECT SUM(pmdm__Quantity__c) e FROM ${SD} WHERE ${win} AND ${HEALTH}`);
    out.healthUB = await peopleCount(instanceUrl, accessToken, `${win} AND ${HEALTH}`);
    out.healthMonthly = await monthlySoql(HEALTH);
  } catch (err) { console.warn(`  ✗ health metrics: ${err.message}`); }

  // ── Unique beneficiaries per card (contacts + not-registered people) ────────
  // Replaces the "BU …" reports as the source of every per-card unique count.
  // Those reports group by Contact only, so the whole unregistered population
  // counted as one: hot meals published 188 "familias" where 317 people were
  // served (192 contacts + 125 not-registered). The service filters are the same
  // LIKE filters the monthly series use, so each card matches its own chart.
  try {
    out.cardUB = {
      hotMeals:    await peopleCount(instanceUrl, accessToken, `${win} AND ${svcLike("Comida caliente")}`),
      groceries:   await peopleCount(instanceUrl, accessToken, `${win} AND ${svcLike("víveres")}`),
      clothing:    await peopleCount(instanceUrl, accessToken, `${win} AND ${svcLike("ropa")}`),
      clinic:      await peopleCount(instanceUrl, accessToken, `${win} AND ${CLINIC_FILTER}`),
      healthOther: await peopleCount(instanceUrl, accessToken,
        `${win} AND ${svcLike("salud")} AND (NOT ${CLINIC_FILTER})`),
    };
  } catch (err) { console.warn(`  ✗ per-card unique beneficiaries: ${err.message}`); }

  // ── Shelter: the four categories the dashboard tracks ───────────────────────
  // The Salesforce reports filter on the delivery NAME ("CUST_NAME contains ..."),
  // which silently drops records whose auto-name was edited, and they lack a date
  // column. Totals, unique beneficiaries, and the monthly series are all computed
  // here from the service lookup instead so the tab stays internally consistent.
  try {
    const SHELTER_KEYS = {
      "Mobiliario (Condiciones de Vida)": "furniture",
      "Electrodomésticos (Condiciones de Vida)": "appliances",
      "Enseres del hogar (Condiciones de Vida)": "household",
      "Electrónicos y suministros (Condiciones de Vida)": "electronics",
    };
    const SHELTER4 = `pmdm__Service__r.Name IN ('${Object.keys(SHELTER_KEYS).join("','")}')`;
    const shelterMonthly = await monthlySoql(SHELTER4);
    // Pre-seed all four keys: the GROUP BY only returns categories with rows this
    // year, and a missing key must mean "0 this year", not "fall back to reports".
    const shelterCategories = Object.fromEntries(
      Object.values(SHELTER_KEYS).map((k) => [k, { services: 0, ub: 0 }]));
    const sc = await runSoql(instanceUrl, accessToken,
      `SELECT pmdm__Service__r.Name s, SUM(pmdm__Quantity__c) q, COUNT_DISTINCT(pmdm__Contact__c) u ` +
      `FROM ${SD} WHERE ${win} AND ${SHELTER4} GROUP BY pmdm__Service__r.Name`);
    for (const rec of sc.records ?? []) {
      const key = SHELTER_KEYS[rec.s];
      if (key) shelterCategories[key] = { services: Number(rec.q) || 0, ub: Number(rec.u) || 0 };
    }
    // Not-registered beneficiaries, same definition as peopleCount / the other cards.
    const snr = await runSoql(instanceUrl, accessToken,
      `SELECT pmdm__Service__r.Name s, COUNT_DISTINCT(N_r_Identification__c) u ` +
      `FROM ${SD} WHERE ${win} AND ${SHELTER4} AND pmdm__Contact__c = null GROUP BY pmdm__Service__r.Name`);
    for (const rec of snr.records ?? []) {
      const key = SHELTER_KEYS[rec.s];
      if (key) shelterCategories[key].ub += Number(rec.u) || 0;
    }
    out.shelterMonthly = shelterMonthly;
    out.shelterCategories = shelterCategories;
  } catch (err) { console.warn(`  ✗ shelter metrics: ${err.message}`); }

  // ── Evangelism ───────────────────────────────────────────────────────────────
  try {
    const BIBLES = `pmdm__Service__r.Name IN ('Biblias','Biblias Quichua','Biblia de niño (Educación)')`;
    const bibles = await agg(`SELECT SUM(pmdm__Quantity__c) e FROM ${SD} WHERE ${win} AND ${BIBLES}`);
    const biblesMonthly = await monthlySoql(BIBLES);
    const VBS = `pmdm__Service__r.Name = 'Campamentos VBS (Educación)'`;
    const vbsAttendees = await agg(`SELECT SUM(pmdm__Quantity__c) e FROM ${SD} WHERE ${win} AND ${VBS}`);
    // Unique attendees intentionally ignores the Quantity >= 1 convention: ~2,700
    // per-child VBS rows carry a blank/zero quantity (attendance was logged, the
    // quantity wasn't), and each still represents a real child linked to a camp.
    const vbsUnique = await agg(
      `SELECT COUNT_DISTINCT(pmdm__Contact__c) e FROM ${SD} ` +
      `WHERE pmdm__DeliveryDate__c >= ${Y}-01-01 AND pmdm__DeliveryDate__c <= ${Y}-12-31 AND ${VBS}`);
    const vbsMonthly = await monthlySoql(VBS);
    const POF = `pmdm__Service__r.Name = 'Profesion de Fe (Educación)'`;
    const professionsOfFaith = await agg(`SELECT SUM(pmdm__Quantity__c) e FROM ${SD} WHERE ${win} AND ${POF}`);
    const professionsOfFaithAllTime = await agg(
      `SELECT SUM(pmdm__Quantity__c) e FROM ${SD} WHERE ${POF} AND pmdm__Quantity__c >= 1`);
    const pofMonthly = await monthlySoql(POF);
    out.evangelism = {
      bibles, biblesMonthly,
      vbsAttendees, vbsUnique, vbsMonthly,
      professionsOfFaith, professionsOfFaithAllTime, pofMonthly,
    };
  } catch (err) { console.warn(`  ✗ evangelism metrics: ${err.message}`); }

  // ── Life farms: new farms added per month this year, per type ────────────────
  // One service-delivery row = one farm set up (verified: rows ≈ distinct
  // households per month). Running totals still come from the reports, which
  // apply the official active-account filters.
  const FARM_KEYS = {
    "Huerto de Vida Ideal": "ideal",
    "Huerto de Vida Completo": "full",
    "Huerto de Vida Basico": "basic",
    "Huerto de Vida Multiplicacion": "multiplication",
    "Huerto de Vida Urbano": "urban",
  };
  try {
    const farmsMonthly = { combined: new Array(12).fill(0) };
    for (const key of Object.values(FARM_KEYS)) farmsMonthly[key] = new Array(12).fill(0);
    const fm = await runSoql(instanceUrl, accessToken,
      `SELECT pmdm__Service__r.Name s, CALENDAR_MONTH(pmdm__DeliveryDate__c) m, COUNT(Id) e FROM ${SD} ` +
      `WHERE ${win} AND pmdm__Service__r.Name IN ('${Object.keys(FARM_KEYS).join("','")}') ` +
      `GROUP BY pmdm__Service__r.Name, CALENDAR_MONTH(pmdm__DeliveryDate__c)`);
    for (const rec of fm.records ?? []) {
      const key = FARM_KEYS[rec.s];
      const idx = (Number(rec.m) || 0) - 1;
      if (!key || idx < 0 || idx > 11) continue;
      const n = Number(rec.e) || 0;
      farmsMonthly[key][idx] += n;
      farmsMonthly.combined[idx] += n;
    }
    out.farmsMonthly = farmsMonthly;

    // All-time running totals as a fallback for the farm REPORTS, which have
    // proven flaky (a transient fetch failure once published "0 full-size
    // farms" while 12 were added this year). Distinct households ≈ farms.
    const farmsTotals = {};
    const ft = await runSoql(instanceUrl, accessToken,
      `SELECT pmdm__Service__r.Name s, COUNT_DISTINCT(Contact_Assigned_Household__c) e FROM ${SD} ` +
      `WHERE pmdm__Quantity__c >= 1 AND pmdm__Service__r.Name IN ('${Object.keys(FARM_KEYS).join("','")}') ` +
      `GROUP BY pmdm__Service__r.Name`);
    for (const rec of ft.records ?? []) {
      const key = FARM_KEYS[rec.s];
      if (key) farmsTotals[key] = Number(rec.e) || 0;
    }
    out.farmsTotals = farmsTotals;
  } catch (err) { console.warn(`  ✗ life-farm metrics: ${err.message}`); }

  // ── Beneficiaries: regional splits straight from Contact ────────────────────
  // MailingState is entered in mixed case ('Pichincha' / 'PICHINCHA'), so the
  // groups are normalized here. Unique people = distinct Contact_Number__c,
  // families = distinct Account.APA_Number__c — same definitions as the
  // "Contactos y Cuentas" reports.
  try {
    const BEN = `RecordType.Name = 'Beneficiary' AND Status__c = 'active'`;
    const regionOf = (st) => {
      const s = String(st ?? "").toLowerCase();
      if (s === "pichincha") return "quito";
      if (s === "imbabura") return "imbabura";
      return "other";
    };
    const bene = {
      combined: { ub: 0, fam: 0, girls: 0, boys: 0 },
      quito: { ub: 0, fam: 0, girls: 0, boys: 0 },
      imbabura: { ub: 0, fam: 0, girls: 0, boys: 0 },
    };
    const cmb = (await runSoql(instanceUrl, accessToken,
      `SELECT COUNT_DISTINCT(Contact_Number__c) ub, COUNT_DISTINCT(Account.APA_Number__c) fam ` +
      `FROM Contact WHERE ${BEN}`)).records?.[0] ?? {};
    bene.combined.ub = Number(cmb.ub) || 0;
    bene.combined.fam = Number(cmb.fam) || 0;
    const byState = await runSoql(instanceUrl, accessToken,
      `SELECT MailingState st, COUNT_DISTINCT(Contact_Number__c) ub, COUNT_DISTINCT(Account.APA_Number__c) fam ` +
      `FROM Contact WHERE ${BEN} GROUP BY MailingState`);
    for (const rec of byState.records ?? []) {
      const region = regionOf(rec.st);
      if (region === "other") continue;
      bene[region].ub += Number(rec.ub) || 0;
      bene[region].fam += Number(rec.fam) || 0;
    }
    const children = await runSoql(instanceUrl, accessToken,
      `SELECT MailingState st, Gender__c g, COUNT_DISTINCT(Contact_Number__c) e FROM Contact ` +
      `WHERE ${BEN} AND Current_Age__c <= 13 AND Gender__c IN ('Female','Male') ` +
      `GROUP BY MailingState, Gender__c`);
    for (const rec of children.records ?? []) {
      const field = String(rec.g).toLowerCase() === "female" ? "girls" : "boys";
      const n = Number(rec.e) || 0;
      bene.combined[field] += n;
      const region = regionOf(rec.st);
      if (region !== "other") bene[region][field] += n;
    }
    out.beneficiaries = bene;
  } catch (err) { console.warn(`  ✗ beneficiary metrics: ${err.message}`); }

  return out;
}

// ─── Revolving Fund / MEP metrics (live SOQL) ───────────────────────────────────
// There is no Salesforce report for MEPs (REPORT_IDS.meps was never created); the
// program is modeled across three objects, queried directly:
//   • Account (RecordType 'Microbusiness') = the MEP business. Estado_MEP__c holds
//     the status (Activo/Inactivo/Finalizado/Abortado); Ubicacion_MEP__c the community.
//     (Estado_MEP__c also exists on Household accounts — the RecordType filter matters.)
//   • MEP_Finance__c = one revolving-fund loan per disbursement. "Market ready" =
//     formula Business_active_longer_than_9_months__c = 'SI' (active business >9 months).
//   • MEP_Finance_Transaction__c = the money ledger. Sign convention: outgoing
//     (disbursements) NEGATIVE, incoming (repayments) POSITIVE — hence Math.abs().
// Monthly activity comes from pmdm__ServiceDelivery__c for the Microbusiness program.
async function fetchMepMetrics(instanceUrl, accessToken) {
  const Y = new Date().getFullYear();
  const MB = `RecordType.Name = 'Microbusiness'`;

  // Business counts by status
  const status = {};
  const st = await runSoql(instanceUrl, accessToken,
    `SELECT Estado_MEP__c s, COUNT(Id) e FROM Account WHERE ${MB} GROUP BY Estado_MEP__c`);
  for (const rec of st.records ?? []) {
    status[String(rec.s ?? "").toLowerCase()] = Number(rec.e) || 0;
  }

  // Market ready = active businesses older than 9 months (formula field, filterable).
  // COUNT_DISTINCT on the business account, not COUNT(Id): MEP_Finance__c holds one
  // record per loan, and a business with several qualifying loans was being counted
  // once per loan (which produced marketReady=17 > active=16 on the dashboard).
  const marketReady = await aggValue(instanceUrl, accessToken,
    `SELECT COUNT_DISTINCT(Account_Name__c) e FROM MEP_Finance__c WHERE Business_active_longer_than_9_months__c = 'SI'`);

  // Revolving-fund capital. Disbursed/repaid are tracked both as YTD flows and
  // as all-time program totals (transaction date = Registration_Date__c);
  // outstanding is the CURRENT portfolio balance — a snapshot across all loans.
  // The headline repayment rate is program-wide, per Erin's definition:
  // (total capital disbursed − current outstanding) ÷ total capital disbursed.
  const TX = "MEP_Finance_Transaction__c";
  const loan = `Transaction_Type__c = 'Revolving Fund Loan'`;
  const txWin = `Registration_Date__c >= ${Y}-01-01 AND Registration_Date__c <= ${Y}-12-31`;
  const disbursed = Math.abs(await aggValue(instanceUrl, accessToken,
    `SELECT SUM(Amount__c) e FROM ${TX} WHERE ${loan} AND Amount_Flow__c = 'outgoing' AND ${txWin}`));
  const repaid = Math.abs(await aggValue(instanceUrl, accessToken,
    `SELECT SUM(Amount__c) e FROM ${TX} WHERE ${loan} AND Amount_Flow__c = 'incoming' AND ${txWin}`));
  const totalDisbursed = Math.abs(await aggValue(instanceUrl, accessToken,
    `SELECT SUM(Amount__c) e FROM ${TX} WHERE ${loan} AND Amount_Flow__c = 'outgoing'`));
  const totalRepaid = Math.abs(await aggValue(instanceUrl, accessToken,
    `SELECT SUM(Amount__c) e FROM ${TX} WHERE ${loan} AND Amount_Flow__c = 'incoming'`));
  const outstanding = Math.abs(await aggValue(instanceUrl, accessToken,
    `SELECT SUM(Balance_Revolving_Fund_Loan__c) e FROM MEP_Finance__c`));

  // Loans actually made each month this year (Erin: the activity chart was being
  // read as "capital loans per month" — this series is the real one).
  const loansMonthly = new Array(12).fill(0);
  const lm = await runSoql(instanceUrl, accessToken,
    `SELECT CALENDAR_MONTH(Registration_Date__c) m, COUNT(Id) e FROM ${TX} ` +
    `WHERE ${loan} AND Amount_Flow__c = 'outgoing' AND ${txWin} ` +
    `GROUP BY CALENDAR_MONTH(Registration_Date__c)`);
  for (const rec of lm.records ?? []) {
    const idx = (Number(rec.m) || 0) - 1;
    if (idx >= 0 && idx < 12) loansMonthly[idx] = Number(rec.e) || 0;
  }

  // Communities (Ubicacion_MEP__c is null on ~55% of businesses — kept as a
  // bucket). Named communities beyond the top 6 are rolled into "__OTHERS__"
  // so the list always sums to the total business count.
  const locations = [];
  let noLocation = 0;
  let otherCommunities = 0;
  const loc = await runSoql(instanceUrl, accessToken,
    `SELECT Ubicacion_MEP__c l, COUNT(Id) e FROM Account WHERE ${MB} ` +
    `GROUP BY Ubicacion_MEP__c ORDER BY COUNT(Id) DESC`);
  for (const rec of loc.records ?? []) {
    const count = Number(rec.e) || 0;
    if (rec.l == null) noLocation += count;
    else if (locations.length < 6) locations.push({ name: String(rec.l), count });
    else otherCommunities += count;
  }
  if (otherCommunities > 0) locations.push({ name: "__OTHERS__", count: otherCommunities });
  if (noLocation > 0) locations.push({ name: null, count: noLocation });

  // Monthly program activity this year (services delivered)
  const monthly = new Array(12).fill(0);
  const mo = await runSoql(instanceUrl, accessToken,
    `SELECT CALENDAR_MONTH(pmdm__DeliveryDate__c) m, COUNT(Id) e FROM pmdm__ServiceDelivery__c ` +
    `WHERE pmdm__DeliveryDate__c >= ${Y}-01-01 AND pmdm__DeliveryDate__c <= ${Y}-12-31 ` +
    `AND pmdm__Quantity__c >= 1 ` +
    `AND pmdm__Service__r.pmdm__Program__r.Name = 'Programa de Microemprendimiento (Microbusiness)' ` +
    `GROUP BY CALENDAR_MONTH(pmdm__DeliveryDate__c)`);
  for (const rec of mo.records ?? []) {
    const idx = (Number(rec.m) || 0) - 1;
    if (idx >= 0 && idx < 12) monthly[idx] = Number(rec.e) || 0;
  }

  return {
    mepStatus: status,
    mepMarketReady: marketReady,
    mepFund: { year: Y, disbursed, repaid, totalDisbursed, totalRepaid, outstanding, loansMonthly },
    mepLocations: locations,
    mepMonthly: monthly,
  };
}

// ─── Per-card monthly series (live SOQL) ────────────────────────────────────────
// The dashboard opens a 12-month chart when a KPI card is clicked, so every
// flow-type card needs its own series. The reports can't provide them (most have
// no date column, and detail rows cap at 2000), so each series is computed here
// with the same filters the card's headline uses (verified against the report
// definitions in Sep 2026).
//
// Every series runs in isolation through trySeries: a failure leaves THAT series
// null (the card simply isn't clickable) and is recorded in SOQL_WARNINGS →
// syncWarnings. Nothing in here can affect the headline metrics above.
const SOQL_WARNINGS = [];
async function fetchMonthlySeries(instanceUrl, accessToken) {
  const now = new Date();
  const Y = now.getFullYear();
  const SD = "pmdm__ServiceDelivery__c";
  const MONTH = "CALENDAR_MONTH(pmdm__DeliveryDate__c)";
  const win = `pmdm__DeliveryDate__c >= ${Y}-01-01 AND pmdm__DeliveryDate__c <= ${Y}-12-31 ` +
    `AND pmdm__Quantity__c >= 1`;
  const soql = (q) => runSoql(instanceUrl, accessToken, q);
  const zeros = () => new Array(12).fill(0);
  const cents = (arr) => arr.map((v) => Math.round(v * 100) / 100);

  const trySeries = async (name, fn) => {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        return await fn();
      } catch (err) {
        if (attempt === 2) {
          console.warn(`  ✗ monthly ${name}: ${err.message}`);
          SOQL_WARNINGS.push(`monthly series failed: ${name}`);
          return null;
        }
        await new Promise((res) => setTimeout(res, 1500));
      }
    }
  };

  // One grouped query → { qty, ub, ...extras }, each a 12-month array.
  //   qty = SUM(Quantity), ub = distinct people = COUNT_DISTINCT(Contact) +
  //   COUNT_DISTINCT(N.r. id) among rows with no contact — the same definition as
  //   the annual card figures (peopleCount), so a card and its chart agree. The
  //   BU reports' "unico" counts registered contacts only; it is not used here.
  //   extras = { key: "Currency_Field__c" } → SUM per month, rounded to cents.
  const monthlyStats = async (filter, extras = {}) => {
    const cols = Object.entries(extras).map(([k, f]) => `, SUM(${f}) ${k}`).join("");
    const j = await soql(
      `SELECT ${MONTH} m, SUM(pmdm__Quantity__c) qty, COUNT_DISTINCT(pmdm__Contact__c) ub${cols} ` +
      `FROM ${SD} WHERE ${win} AND (${filter}) GROUP BY ${MONTH}`);
    const out = { qty: zeros(), ub: zeros() };
    for (const k of Object.keys(extras)) out[k] = zeros();
    for (const rec of j.records ?? []) {
      const idx = (Number(rec.m) || 0) - 1;
      if (idx < 0 || idx > 11) continue;
      for (const k of Object.keys(out)) out[k][idx] = Number(rec[k]) || 0;
    }
    const nr = await soql(
      `SELECT ${MONTH} m, COUNT_DISTINCT(N_r_Identification__c) e FROM ${SD} ` +
      `WHERE ${win} AND pmdm__Contact__c = null AND (${filter}) GROUP BY ${MONTH}`);
    for (const rec of nr.records ?? []) {
      const idx = (Number(rec.m) || 0) - 1;
      if (idx >= 0 && idx < 12) out.ub[idx] += Number(rec.e) || 0;
    }
    for (const k of Object.keys(extras)) out[k] = cents(out[k]);
    return out;
  };

  // Distinct people per month = contacts + not-registered persons (by N.r. id),
  // the same definition as the annual "individuals served" counts.
  const monthlyPeople = async (filter) => {
    const out = zeros();
    const legs = [
      `SELECT ${MONTH} m, COUNT_DISTINCT(pmdm__Contact__c) e FROM ${SD} WHERE ${win} AND (${filter}) GROUP BY ${MONTH}`,
      `SELECT ${MONTH} m, COUNT_DISTINCT(N_r_Identification__c) e FROM ${SD} ` +
        `WHERE ${win} AND pmdm__Contact__c = null AND (${filter}) GROUP BY ${MONTH}`,
    ];
    for (const q of legs) {
      for (const rec of (await soql(q)).records ?? []) {
        const idx = (Number(rec.m) || 0) - 1;
        if (idx >= 0 && idx < 12) out[idx] += Number(rec.e) || 0;
      }
    }
    return out;
  };

  const svc = svcLike;                 // same service-name filters as fetchSectionMetrics
  const prog = "pmdm__Service__r.pmdm__Program__r.Name";
  const CLINIC = CLINIC_FILTER;

  const ms = {};

  // ── Level 1 ─────────────────────────────────────────────────────────────────
  ms.hotMeals = await trySeries("hotMeals", () => monthlyStats(svc("Comida caliente")));
  ms.groceries = await trySeries("groceries", () => monthlyStats(svc("víveres"), { cost: "Total_Cost__c" }));
  ms.clothing = await trySeries("clothing", () => monthlyStats(svc("ropa")));

  // ── Level 2 ─────────────────────────────────────────────────────────────────
  // vozManos = Cost_per_Unit__c (what Voz y Manos pays the clinic), pdv = Cost_PDV__c.
  ms.clinic = await trySeries("clinic", () =>
    monthlyStats(CLINIC, { vozManos: "Cost_per_Unit__c", pdv: "Cost_PDV__c" }));
  ms.healthOther = await trySeries("healthOther", () =>
    monthlyStats(`${svc("salud")} AND (NOT ${CLINIC})`, { cost: "Total_Cost__c" }));
  // Distinct people for the year: the "Otras ayudas médicas" report has no unique
  // formula — its Record Count (delivery rows) was being shown as unique people.
  // Kept as the fallback for metrics.cardUB.healthOther, hence the same definition.
  ms.healthOtherUBYear = await trySeries("healthOtherUBYear", () =>
    peopleCount(instanceUrl, accessToken, `${win} AND ${svc("salud")} AND (NOT ${CLINIC})`));
  ms.healthUB = await trySeries("healthUB", () =>
    monthlyPeople(`${prog} = 'Programa de Salud (Health)'`));
  ms.shelter = await trySeries("shelter", async () => {
    const KEYS = {
      "Mobiliario (Condiciones de Vida)": "furniture",
      "Electrodomésticos (Condiciones de Vida)": "appliances",
      "Enseres del hogar (Condiciones de Vida)": "household",
      "Electrónicos y suministros (Condiciones de Vida)": "electronics",
    };
    const out = Object.fromEntries(Object.values(KEYS).map((k) => [k, { qty: zeros(), ub: zeros() }]));
    const IN4 = `pmdm__Service__r.Name IN ('${Object.keys(KEYS).join("','")}')`;
    const j = await soql(
      `SELECT pmdm__Service__r.Name s, ${MONTH} m, SUM(pmdm__Quantity__c) qty, COUNT_DISTINCT(pmdm__Contact__c) ub ` +
      `FROM ${SD} WHERE ${win} AND ${IN4} GROUP BY pmdm__Service__r.Name, ${MONTH}`);
    for (const rec of j.records ?? []) {
      const key = KEYS[rec.s];
      const idx = (Number(rec.m) || 0) - 1;
      if (!key || idx < 0 || idx > 11) continue;
      out[key].qty[idx] = Number(rec.qty) || 0;
      out[key].ub[idx] = Number(rec.ub) || 0;
    }
    // Not-registered people per month, same definition as every other ub series.
    const nr = await soql(
      `SELECT pmdm__Service__r.Name s, ${MONTH} m, COUNT_DISTINCT(N_r_Identification__c) e ` +
      `FROM ${SD} WHERE ${win} AND ${IN4} AND pmdm__Contact__c = null ` +
      `GROUP BY pmdm__Service__r.Name, ${MONTH}`);
    for (const rec of nr.records ?? []) {
      const key = KEYS[rec.s];
      const idx = (Number(rec.m) || 0) - 1;
      if (!key || idx < 0 || idx > 11) continue;
      out[key].ub[idx] += Number(rec.e) || 0;
    }
    return out;
  });

  // ── Cross-level individuals served (same program→level mapping as fetchLevelMetrics)
  ms.level1Served = await trySeries("level1Served", () => monthlyPeople(
    `${prog} IN ('Programa de Mitigación del hambre (Hunger relief)','Programa de Ayuda de Emergencia (Emergency relief)')`));
  ms.level2Served = await trySeries("level2Served", () => monthlyPeople(
    `${prog} IN ('Programa de Salud (Health)','Programa de Educación (Education)','Programa Mejoramiento de condiciones de vida (Shelter)')`));
  ms.level3Served = await trySeries("level3Served", () => monthlyPeople(
    `${prog} = 'Programa de Microemprendimiento (Microbusiness)'`));

  // ── Evangelism ──────────────────────────────────────────────────────────────
  // VBS camps held = distinct delivery dates (the report's "DeliveryDateÚnica").
  ms.vbsCamps = await trySeries("vbsCamps", async () => {
    const out = zeros();
    const j = await soql(
      `SELECT pmdm__DeliveryDate__c d, COUNT(Id) e FROM ${SD} WHERE ${win} AND ${svc("vbs")} ` +
      `GROUP BY pmdm__DeliveryDate__c`);
    for (const rec of j.records ?? []) {
      const month = Number(String(rec.d ?? "").slice(5, 7)) - 1;
      if (month >= 0 && month < 12) out[month] += 1;
    }
    return out;
  });

  // "Personas alcanzadas por el evangelio" mirrors the Salesforce report: household
  // members of primary contacts with any delivery (Qty >= 1) in the window. Per
  // month = households served THAT month, so months overlap and the bars do not
  // add up to the annual figure (the UI says so). One query per elapsed month.
  const personasSoql = (from, to) =>
    `SELECT SUM(Account.npsp__Number_of_Household_Members__c) e FROM Contact ` +
    `WHERE npsp__Primary_Contact__c = true AND Id IN (SELECT pmdm__Contact__c FROM ${SD} ` +
    `WHERE pmdm__DeliveryDate__c >= ${from} AND pmdm__DeliveryDate__c <= ${to} AND pmdm__Quantity__c >= 1)`;
  ms.personas = await trySeries("personas", async () => {
    const out = zeros();
    const pad = (n) => String(n).padStart(2, "0");
    await Promise.all(out.map(async (_, i) => {
      if (i > now.getMonth()) return; // future months stay 0
      const last = new Date(Date.UTC(Y, i + 1, 0)).getUTCDate();
      out[i] = await aggValue(instanceUrl, accessToken,
        personasSoql(`${Y}-${pad(i + 1)}-01`, `${Y}-${pad(i + 1)}-${pad(last)}`));
    }));
    return out;
  });
  // Annual value by the same query — logged next to the report's figure. The
  // report hard-codes "DeliveryDate >= 2026-01-01", so it needs a manual edit
  // every January; this is the number it should show.
  ms.personasYear = await trySeries("personasYear", () =>
    aggValue(instanceUrl, accessToken, personasSoql(`${Y}-01-01`, `${Y}-12-31`)));

  // ── New families / new individuals per month ────────────────────────────────
  // Same definition as the "NUEVOS APAs" reports: active Beneficiary contacts whose
  // household ACCOUNT was created this year; families = distinct APA numbers,
  // individuals = distinct contact numbers, split by MailingState. Row query +
  // JS binning because Account.CreatedDate is a datetime: CALENDAR_MONTH() would
  // bin in UTC, pushing evening entries on a month's last day into the next
  // month. Ecuador is UTC-5 year-round (no DST).
  ms.newBene = await trySeries("newBene", async () => {
    const TZ = "T05:00:00Z";
    const j = await soql(
      `SELECT Account.CreatedDate, Account.APA_Number__c, Contact_Number__c, MailingState FROM Contact ` +
      `WHERE RecordType.Name = 'Beneficiary' AND Status__c = 'active' ` +
      `AND Account.CreatedDate >= ${Y}-01-01${TZ} AND Account.CreatedDate < ${Y + 1}-01-01${TZ}`);
    const sets = {};
    for (const region of ["quito", "imbabura"]) {
      sets[region] = { families: zeros().map(() => new Set()), ub: zeros().map(() => new Set()) };
    }
    for (const rec of j.records ?? []) {
      const st = String(rec.MailingState ?? "").toLowerCase();
      const region = st === "pichincha" ? "quito" : st === "imbabura" ? "imbabura" : null;
      const created = Date.parse(rec.Account?.CreatedDate);
      if (!region || Number.isNaN(created)) continue;
      const idx = new Date(created - 5 * 3600e3).getUTCMonth();
      if (rec.Account?.APA_Number__c != null) sets[region].families[idx].add(rec.Account.APA_Number__c);
      if (rec.Contact_Number__c != null) sets[region].ub[idx].add(rec.Contact_Number__c);
    }
    const out = {};
    for (const region of ["quito", "imbabura"]) {
      out[region] = {
        families: sets[region].families.map((s) => s.size),
        ub: sets[region].ub.map((s) => s.size),
      };
    }
    // Combined = Quito + Imbabura, like the headline (report-map extractBeneficiaries)
    out.combined = {
      families: out.quito.families.map((v, i) => v + out.imbabura.families[i]),
      ub: out.quito.ub.map((v, i) => v + out.imbabura.ub[i]),
    };
    return out;
  });

  // ── Revolving fund: $ disbursed / repaid per month this year ────────────────
  ms.fund = await trySeries("fund", async () => {
    const out = { disbursed: zeros(), repaid: zeros() };
    const j = await soql(
      `SELECT CALENDAR_MONTH(Registration_Date__c) m, Amount_Flow__c f, SUM(Amount__c) e ` +
      `FROM MEP_Finance_Transaction__c WHERE Transaction_Type__c = 'Revolving Fund Loan' ` +
      `AND Registration_Date__c >= ${Y}-01-01 AND Registration_Date__c <= ${Y}-12-31 ` +
      `GROUP BY CALENDAR_MONTH(Registration_Date__c), Amount_Flow__c`);
    for (const rec of j.records ?? []) {
      const idx = (Number(rec.m) || 0) - 1;
      const key = rec.f === "outgoing" ? "disbursed" : rec.f === "incoming" ? "repaid" : null;
      if (key && idx >= 0 && idx < 12) out[key][idx] = Math.abs(Number(rec.e) || 0);
    }
    return { disbursed: cents(out.disbursed), repaid: cents(out.repaid) };
  });

  return ms;
}

// ─── Import report map ────────────────────────────────────────────────────────
const { REPORT_IDS, transformAll } = await import("./report-map.js");

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("Pan de Vida — Salesforce Sync");
  console.log("─".repeat(40));

  const { accessToken, instanceUrl } = await authenticate();

  // Fetch all reports in parallel
  console.log(`\nFetching ${Object.keys(REPORT_IDS).length} reports...`);
  const rawReports = {};
  await Promise.all(
    Object.entries(REPORT_IDS).map(async ([key, id]) => {
      rawReports[key] = await safeReport(instanceUrl, accessToken, id, key);
    })
  );


  // Compute deduplicated cross-level metrics + grand total via live SOQL
  console.log("\nComputing cross-level metrics (SOQL)...");
  let levelMetrics = {};
  try {
    levelMetrics = await fetchLevelMetrics(instanceUrl, accessToken);
    console.log(
      `  ✓ Relief=${levelMetrics.level1Served} Restoration=${levelMetrics.level2Served} ` +
      `Development=${levelMetrics.level3Served} totalReached=${levelMetrics.totalReached}`,
    );
  } catch (err) {
    console.warn(`  ✗ Cross-level metrics: ${err.message} (levels will stay null)`);
  }

  // Section metrics that bypass unreliable Salesforce reports (see fetchSectionMetrics)
  console.log("\nComputing section metrics (SOQL)...");
  let sectionMetrics = {};
  try {
    sectionMetrics = await fetchSectionMetrics(instanceUrl, accessToken);
    const cu = sectionMetrics.cardUB ?? {};
    console.log(
      `  ✓ unique people: hotMeals=${cu.hotMeals} groceries=${cu.groceries} clothing=${cu.clothing} ` +
      `clinic=${cu.clinic} healthOther=${cu.healthOther}`,
    );
    console.log(
      `  ✓ health: services=${sectionMetrics.healthServices} people=${sectionMetrics.healthUB} | ` +
      `bibles=${sectionMetrics.evangelism?.bibles} vbs=${sectionMetrics.evangelism?.vbsAttendees}` +
      `(${sectionMetrics.evangelism?.vbsUnique} unique) pof=${sectionMetrics.evangelism?.professionsOfFaith} | ` +
      `beneficiaries: quito=${sectionMetrics.beneficiaries?.quito?.ub} imbabura=${sectionMetrics.beneficiaries?.imbabura?.ub}`,
    );
  } catch (err) {
    console.warn(`  ✗ Section metrics: ${err.message} (report-based fallbacks will be used)`);
  }

  // Revolving Fund / MEP metrics (no Salesforce report exists for these)
  console.log("\nComputing Revolving Fund / MEP metrics (SOQL)...");
  let mepMetrics = {};
  try {
    mepMetrics = await fetchMepMetrics(instanceUrl, accessToken);
    const s = mepMetrics.mepStatus ?? {};
    console.log(
      `  ✓ businesses: activo=${s.activo ?? 0} inactivo=${s.inactivo ?? 0} ` +
      `finalizado=${s.finalizado ?? 0} abortado=${s.abortado ?? 0} | ` +
      `marketReady=${mepMetrics.mepMarketReady} | ` +
      `fund: disbursed=$${mepMetrics.mepFund?.disbursed} repaid=$${mepMetrics.mepFund?.repaid} ` +
      `outstanding=$${mepMetrics.mepFund?.outstanding}`,
    );
  } catch (err) {
    console.warn(`  ✗ MEP metrics: ${err.message} (meps will stay null)`);
  }

  // Per-card monthly series for the click-to-chart popups (see fetchMonthlySeries)
  console.log("\nComputing per-card monthly series (SOQL)...");
  let monthlySeries = {};
  try {
    monthlySeries = await fetchMonthlySeries(instanceUrl, accessToken);
    const ok = Object.values(monthlySeries).filter((v) => v != null).length;
    const sum = (arr) => (arr ?? []).reduce((a, b) => a + b, 0);
    console.log(
      `  ✓ ${ok}/${Object.keys(monthlySeries).length} series | ` +
      `new families=${sum(monthlySeries.newBene?.combined?.families)} | ` +
      `personas alcanzadas (SOQL, year)=${monthlySeries.personasYear}`,
    );
  } catch (err) {
    console.warn(`  ✗ Monthly series: ${err.message} (cards will not be clickable)`);
    SOQL_WARNINGS.push("monthly series failed: all");
  }

  // Transform raw Salesforce responses into our dashboard schema
  console.log("\nTransforming data...");
  const dashboardData = transformAll(rawReports,
    { ...levelMetrics, ...mepMetrics, ...sectionMetrics, monthlySeries });
  dashboardData.lastUpdated = new Date().toISOString();
  // Reports that failed even after retries (and monthly series that failed) —
  // visible in the JSON so a partly broken sync can't masquerade as a clean one.
  dashboardData.syncWarnings = [
    ...FAILED_REPORTS.map((name) => `report fetch failed: ${name}`),
    ...SOQL_WARNINGS,
  ];

  // Write output
  writeFileSync(OUTPUT_FILE, JSON.stringify(dashboardData, null, 2), "utf8");
  console.log(`\n✓ Written to ${OUTPUT_FILE}`);
  console.log(`  Last updated: ${dashboardData.lastUpdated}`);
}

main().catch((err) => {
  console.error("\n✗ Sync failed:", err.message);
  process.exit(1);
});
