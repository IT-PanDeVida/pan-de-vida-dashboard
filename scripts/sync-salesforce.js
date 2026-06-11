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

// ─── Safe fetch (logs errors but doesn't abort the whole sync) ─────────────────
async function safeReport(instanceUrl, accessToken, reportId, reportName) {
  try {
    const data = await fetchReport(instanceUrl, accessToken, reportId);
    console.log(`  ✓ ${reportName} (${reportId})`);
    return data;
  } catch (err) {
    console.warn(`  ✗ ${reportName} (${reportId}): ${err.message}`);
    return null;
  }
}

// ─── Run a SOQL query (REST query endpoint) ────────────────────────────────────
async function runSoql(instanceUrl, accessToken, soql) {
  const url = `${instanceUrl}/services/data/${API_VERSION}/query?q=${encodeURIComponent(soql)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`SOQL failed (${res.status}): ${await res.text()}`);
  return res.json();
}

// Read a single aggregate value (aliased "e") from a SOQL aggregate query.
async function aggValue(instanceUrl, accessToken, soql) {
  const json = await runSoql(instanceUrl, accessToken, soql);
  const rec = json.records?.[0] ?? {};
  return Number(rec.e ?? rec.expr0 ?? 0) || 0;
}

// ─── Cross-level "individuals served" + grand-total reached (live SOQL) ─────────
// No single Salesforce report provides these deduplicated distinct-people counts,
// so we compute them directly from pmdm__ServiceDelivery__c:
//   • per-level served = COUNT_DISTINCT(Contact) + COUNT_DISTINCT(N.r. id) over the
//     programs mapped to each level (deduped — no double-count across programs)
//   • totalReached = distinct people in the households served this year (family reach)
// Window = current calendar year. Program→level mapping mirrors report-map.js.
async function fetchLevelMetrics(instanceUrl, accessToken) {
  const Y = new Date().getFullYear();
  const win = `pmdm__DeliveryDate__c >= ${Y}-01-01 AND pmdm__DeliveryDate__c <= ${Y}-12-31`;
  const SD = "pmdm__ServiceDelivery__c";
  const prog = "pmdm__Service__r.pmdm__Program__r.Name";
  const levelFilters = {
    level1Served: `${prog} IN ('Programa de Mitigación del hambre (Hunger relief)','Programa de Ayuda de Emergencia (Emergency relief)')`,
    level2Served: `${prog} IN ('Programa de Salud (Health)','Programa de Educación (Education)','Programa Mejoramiento de condiciones de vida (Shelter)')`,
    level3Served: `${prog} = 'Programa de Microemprendimiento (Microbusiness)'`,
  };

  const metrics = {};
  for (const [key, filter] of Object.entries(levelFilters)) {
    const contacts = await aggValue(instanceUrl, accessToken,
      `SELECT COUNT_DISTINCT(pmdm__Contact__c) e FROM ${SD} WHERE ${win} AND (${filter})`);
    const notReg = await aggValue(instanceUrl, accessToken,
      `SELECT COUNT_DISTINCT(N_r_Identification__c) e FROM ${SD} WHERE ${win} AND pmdm__Contact__c = null AND (${filter})`);
    metrics[key] = contacts + notReg;
  }

  // Grand total = distinct people living in any household that received a service
  // this year (served beneficiaries are a subset of these households).
  metrics.totalReached = await aggValue(instanceUrl, accessToken,
    `SELECT COUNT(Id) e FROM Contact WHERE AccountId IN ` +
    `(SELECT Contact_Assigned_Household__c FROM ${SD} WHERE ${win} AND Contact_Assigned_Household__c != null)`);

  return metrics;
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

  // Market ready = active businesses older than 9 months (formula field, filterable)
  const marketReady = await aggValue(instanceUrl, accessToken,
    `SELECT COUNT(Id) e FROM MEP_Finance__c WHERE Business_active_longer_than_9_months__c = 'SI'`);

  // Revolving-fund capital. Disbursed/repaid are YTD flows (transaction date =
  // Registration_Date__c); outstanding is the CURRENT portfolio balance — a snapshot
  // across all loans, which has no YTD form.
  const TX = "MEP_Finance_Transaction__c";
  const loan = `Transaction_Type__c = 'Revolving Fund Loan'`;
  const txWin = `Registration_Date__c >= ${Y}-01-01 AND Registration_Date__c <= ${Y}-12-31`;
  const disbursed = Math.abs(await aggValue(instanceUrl, accessToken,
    `SELECT SUM(Amount__c) e FROM ${TX} WHERE ${loan} AND Amount_Flow__c = 'outgoing' AND ${txWin}`));
  const repaid = Math.abs(await aggValue(instanceUrl, accessToken,
    `SELECT SUM(Amount__c) e FROM ${TX} WHERE ${loan} AND Amount_Flow__c = 'incoming' AND ${txWin}`));
  const outstanding = Math.abs(await aggValue(instanceUrl, accessToken,
    `SELECT SUM(Balance_Revolving_Fund_Loan__c) e FROM MEP_Finance__c`));

  // Top communities (Ubicacion_MEP__c is null on ~55% of businesses — kept as a bucket)
  const locations = [];
  let noLocation = 0;
  const loc = await runSoql(instanceUrl, accessToken,
    `SELECT Ubicacion_MEP__c l, COUNT(Id) e FROM Account WHERE ${MB} ` +
    `GROUP BY Ubicacion_MEP__c ORDER BY COUNT(Id) DESC`);
  for (const rec of loc.records ?? []) {
    const count = Number(rec.e) || 0;
    if (rec.l == null) noLocation += count;
    else if (locations.length < 6) locations.push({ name: String(rec.l), count });
  }
  if (noLocation > 0) locations.push({ name: null, count: noLocation });

  // Monthly program activity this year (services delivered)
  const monthly = new Array(12).fill(0);
  const mo = await runSoql(instanceUrl, accessToken,
    `SELECT CALENDAR_MONTH(pmdm__DeliveryDate__c) m, COUNT(Id) e FROM pmdm__ServiceDelivery__c ` +
    `WHERE pmdm__DeliveryDate__c >= ${Y}-01-01 AND pmdm__DeliveryDate__c <= ${Y}-12-31 ` +
    `AND pmdm__Service__r.pmdm__Program__r.Name = 'Programa de Microemprendimiento (Microbusiness)' ` +
    `GROUP BY CALENDAR_MONTH(pmdm__DeliveryDate__c)`);
  for (const rec of mo.records ?? []) {
    const idx = (Number(rec.m) || 0) - 1;
    if (idx >= 0 && idx < 12) monthly[idx] = Number(rec.e) || 0;
  }

  return {
    mepStatus: status,
    mepMarketReady: marketReady,
    mepFund: { year: Y, disbursed, repaid, outstanding },
    mepLocations: locations,
    mepMonthly: monthly,
  };
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

  // Transform raw Salesforce responses into our dashboard schema
  console.log("\nTransforming data...");
  const dashboardData = transformAll(rawReports, { ...levelMetrics, ...mepMetrics });
  dashboardData.lastUpdated = new Date().toISOString();

  // Write output
  writeFileSync(OUTPUT_FILE, JSON.stringify(dashboardData, null, 2), "utf8");
  console.log(`\n✓ Written to ${OUTPUT_FILE}`);
  console.log(`  Last updated: ${dashboardData.lastUpdated}`);
}

main().catch((err) => {
  console.error("\n✗ Sync failed:", err.message);
  process.exit(1);
});
