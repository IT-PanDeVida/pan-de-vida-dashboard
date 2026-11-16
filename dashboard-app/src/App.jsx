import { useState, useEffect, useCallback, useRef, useId } from "react";
import { createPortal } from "react-dom";

// ─────────────────────────────────────────────────────────────
// PAN DE VIDA FOUNDATION — DASHBOARD 2026
// Antigravity-inspired redesign — no emojis, clean SVG icons
// ─────────────────────────────────────────────────────────────

// ─── FALLBACK DATA (mirrors public/data/dashboard.json schema) ─
// Used when the JSON hasn't been fetched yet or fetch fails.
const FALLBACK_DATA = {
  overview:  { totalBeneficiaries: 2337, totalAccounts: 623, newFamilies: 23, totalDeliveries: 2437, totalReached: 1668 },
  hotMeals:  { plates: 882, families: 100 },
  groceries: { bags: 133, ub: 80, avgCost: 12.70, totalCost: 1118.70, monthly: [44, 133, 45, 0, 0, 0] },
  clothing:  { donations: 96, ub: 39 },
  health: {
    totalServices: 266, totalUB: 140,
    clinic: { consultations: 175, ub: 86, paidVozManos: 3571.50, paidPDV: 62.00 },
    other:  { aids: 91, ub: 75, invested: 341.80 },
    monthly: [84, 91, 0, 0, 0, 0],
  },
  education: { schoolKits: 1, schoolKitCost: 13.75, backpacks: 1, backpackCost: 8.75, vbsCamps: 9 },
  shelter:   {
    services: 143, ub: 0,
    furniture:   { services: 0, ub: 0 },
    appliances:  { services: 0, ub: 0 },
    household:   { services: 0, ub: 0 },
    electronics: { services: 0, ub: 0 },
  },
  lifeFarms: {
    idealFarm:      { goal: 30, done: 42 },
    fullSizeFarm:   { goal: 10, done: 10 },
    totalChampions: { goal: 40, done: 52 },
    basicFarm:      { goal: 118, done: 154 },
    multiplication: { goal: 108, done: 112 },
    urbanFarm:      { goal: null, done: 0 },
  },
  meps: {
    total: 264, active: 16, inactive: 67, finished: 102, aborted: 79, marketReady: 17,
    participants: 223,
    fund: { year: 2026, disbursed: 278.99, repaid: 206.89, totalDisbursed: 31184.19, totalRepaid: 23747.63, outstanding: 9107.31, repaymentRate: 71, loansMonthly: new Array(12).fill(0) },
    locations: [
      { name: "AZAMA", count: 28 }, { name: "CUMBASCONDE", count: 27 },
      { name: "PIGULCA", count: 15 }, { name: "CHUCHUQUI", count: 8 },
      { name: "GONZALÉS SUÁREZ Y PIJAL", count: 7 }, { name: null, count: 146 },
    ],
    monthly: [13, 79, 65, 281, 213, 37, 0, 0, 0, 0, 0, 0],
  },
  sharkTank:    { winners: 0, pdvCost: 0, monthly: new Array(12).fill(0) },
  level1: { individualsServed: 356, totalCost: null },
  level2: { individualsServed: 471, totalCost: null },
  level3: { individualsServed: 223, totalCost: null },
  evangelism:   { bibles: 34, vbsCamps: 9, childrenVBS: 228, personasAlcanzadas: 593 },
  beneficiaries: {
    combined: { accounts: 623, beneficiaries: 2337, girls: 359, boys: 364, newFamilies: 23, newUB: 557 },
    quito:    { accounts: 349, beneficiaries: 1166, girls: 212, boys: 215, newFamilies: 11, newUB: 415 },
    imbabura: { accounts: 274, beneficiaries: 1171, girls: 147, boys: 149, newFamilies: 12, newUB: 142 },
  },
};

const C = {
  blue:      "#1a73e8",
  blueBg:    "#e8f0fe",
  blueLight: "#4285f4",
  green:     "#1e8e3e",
  greenBg:   "#e6f4ea",
  yellow:    "#f29900",
  yellowBg:  "#fef7e0",
  red:       "#d93025",
  redBg:     "#fce8e6",
  orange:    "#e8710a",
  orangeBg:  "#fef3e8",
  purple:    "#8430ce",
  purpleBg:  "#f3e8fd",
  teal:      "#007b83",
  tealBg:    "#e4f7fb",
  pink:      "#c0006a",
  pinkBg:    "#fce4ec",
  text1:     "#202124",
  text2:     "#3c4043",
  text3:     "#5f6368",
  text4:     "#9aa0a6",
  border:    "rgba(0,0,0,0.06)",
  bg:        "#EEEEF5",
  white:     "#ffffff",
};

const i18n = {
  en: {
    overview: "Overview",
    level1: "Level 1", level1Name: "Relief", level1Desc: "Immediate assistance",
    level2: "Level 2", level2Name: "Restoration", level2Desc: "Rebuilding lives",
    level3: "Level 3", level3Name: "Development", level3Desc: "Sustainable growth",
    evangelism: "Evangelism", evangelismDesc: "Across all levels",
    beneficiaries: "Beneficiaries", beneficiariesDesc: "People we serve",
    lastUpdated: "Last updated", dataSynced: "Data synced",
    totalBeneficiaries: "Active Beneficiaries (Individuals)", totalAccounts: "Active Family Accounts (Families)",
    newFamilies: "New Families Added This Year", totalDeliveries: "Total # of Services Delivered",
    impactByLevel: "Impact by Level",
    hotMeals: "Hot Meals", hotMealsDelivered: "Hot meals served",
    familiesHotMeals: "Families served",
    hotMealsPeople: "People in those families (est.)",
    groceries: "Food kits", groceryBags: "Food kits delivered",
    ubGrocery: "Families served", avgCost: "Avg. unit cost",
    totalCost: "Total estimated cost",
    clothing: "Clothing", clothingDonations: "Clothing distributed to families",
    ubClothing: "Families served",
    emergency: "Emergency", christmas: "Christmas",
    christmasHotMeals: "Hot meal plates distributed",
    christmasToys: "Toys distributed",
    christmasCandy: "Candy bags distributed",
    noDataYet: "No data recorded yet for this period",
    monthlyDistribution: "Monthly Distribution",
    jan: "Jan", feb: "Feb", mar: "Mar", apr: "Apr", may: "May", jun: "Jun",
    jul: "Jul", aug: "Aug", sep: "Sep", oct: "Oct", nov: "Nov", dec: "Dec",
    health: "Health", education: "Education", shelter: "Living Conditions",
    medicalAttention: "Medical appointments", ubMedical: "Individuals served",
    paidByVozManos: "Paid by Voz y Manos", paidByPDV: "Paid by Pan de Vida",
    otherMedicalAidsTitle: "Other Health Assistance",
    otherMedicalAids: "Other medical assistance (specialists, exams, treatment, medicines)", ubOtherMedical: "Individuals served",
    otherMedicalAidsAll: "Medical Assistance (Specialist appointment, medicine, etc)",
    investedOther: "Invested in other medical",
    otherHealthTotalCost: "Total invested in other health assistance",
    hygieneKits: "Hygiene kits delivered", hygieneCost: "Hygiene kits cost",
    vitaminsDelivered: "Vitamins delivered", vitaminsCost: "Vitamins cost",
    diapers: "Diapers", diapersAdult: "Adult diapers delivered", diapersChild: "Children's diapers delivered (babies 0–2)",
    healthUBNote: "The {n} individuals served are unique beneficiaries: someone who received several kinds of help counts only once, so this total is not the sum of the partial figures below.",
    totalHealthServices: "Total Health Services Provided", totalHealthUB: "Individuals served",
    schoolKits: "School supplies distributed", backpacks: "Backpacks distributed",
    schoolSuppliesShort: "school supplies",
    schoolKitsFull: "School kits delivered", schoolKitsFullCost: "Total cost (supplies + backpacks)",
    educationMonthlyTitle: "School Kits Delivered Per Month",
    totalEducationServices: "Total Education Services Provided", totalEducationUB: "Individuals served",
    unitCost: "Unit cost", totalCostLabel: "Total cost",
    vbsCamps: "VBS camps held", shelterServices: "Total services",
    shelterUB: "Families served",
    shelterFurniture: "Furniture (beds, mattresses, furnishings)", shelterAppliances: "Appliances",
    shelterHousehold: "Household goods", shelterElectronics: "Electronics & supplies",
    shelterConstruction: "Construction projects / Hit Squads",
    shelterCost: "Cost (purchases)", shelterTotalCost: "Total cost (purchases)",
    shelterItemsDelivered: "Items delivered", shelterFamiliesServed: "Families served",
    lifeFarms: "Life Farms", sharkTank: "Shark Tank PDV",
    revolvingFund: "Revolving Fund",
    idealFarm: "Ideal Life Farm",
    idealFarmDesc: "Seed banks + compost + animals + others",
    fullSizeFarm: "Full Size Life Farm",
    fullSizeFarmDesc: "No additionals",
    totalChampions: "Total Champions",
    basicFarm: "Basic Life Farms",
    basicFarmDesc: "New cases + seedling production",
    multiplicationFarm: "Multiplication",
    multiplicationDesc: "Selected cases + support",
    urbanFarms: "Urban Life Farms", urbanFarmsTabDesc: "Family-run home gardens adapted for urban areas.", urbanFarmsCount: "Urban Life Farms Count",
    sharkTankWinners: "Shark Tank Winners (all time)", sharkTankPdvCost: "PDV Cost",
    goal: "Goal", done: "Done",
    totalMEPs: "Total MEPs", active: "Active", inactive: "Inactive",
    finished: "Finished", aborted: "Aborted", marketReady: "Market Ready",
    mepParticipants: "People served this year",
    fundCapital: "Revolving Fund Capital",
    capitalDisbursed: "Capital disbursed (loans)",
    repaidByEntrepreneurs: "Repaid by entrepreneurs",
    outstandingBalance: "Current outstanding balance",
    repaymentRate: "Repayment rate",
    noLocation: "No location recorded",
    goals2026: "2026 Plan",
    goals2026Sub: "Beneficiary Aid & Services Plan — annual goals",
    progressYtd: "Progress this year",
    buTarget: "People benefited (BU)",
    sharkTankPlaceholder: "Data coming soon — this program's metrics are being integrated.",
    viewDetail: "View detail",
    monthlyShort: "Monthly",
    monthlyBreakdown: "Monthly breakdown",
    yearTotal: "Year total",
    close: "Close",
    noMonthlyData: "No records for this year yet.",
    uniqueMonthlyNote: "Each bar counts the unique people served that month. The same person can be served in several months, so the bars do not add up to the annual total.",
    uniqueFamiliesMonthlyNote: "Each bar counts the unique families served that month. The same family can be served in several months, so the bars do not add up to the annual total.",
    personasMonthlyNote: "People living in households that received at least one delivery that month. Months overlap, so the bars do not add up to the annual total.",
    newFamiliesMonthlyNote: "By the month the family's account was created in Salesforce.",
    fundFlowNote: "Bars show this year's flows; the card shows the all-time program total.",
    capitalDisbursedThisYear: "Capital disbursed — this year",
    repaidThisYear: "Repayments — this year",
    farmsMonthlyNote: "New farms set up per month this year (the card shows the running total).",
    deliveriesMonthlyNote: "Hot meals + food kits + clothing + health + education + shelter.",
    byLocation: "By Location",
    quito: "Quito", otavalo: "Otavalo", mantaRiobamba: "Manta & Riobamba",
    biblesDelivered: "Bibles distributed",
    biblesByTypeTitle: "Bibles by Type",
    biblesAdult: "Adult Bibles (Spanish)", biblesQuichua: "Quichua Bibles", biblesChildren: "Children's Bibles",
    vbsCampsHeld: "VBS CAMPS HELD",
    childrenVBS: "VBS attendances (total)",
    personasAlcanzadas: "Individuals reached by the gospel",
    individualsServed: "Individuals served",
    totalReached: "Total Individuals Reached",
    activeLifeFarms: "Active Life Farms",
    clothingDonationsCount: "Number of clothing donations",
    activeAccounts: "Active accounts", activeBeneficiaries: "Active beneficiaries",
    activeGirls: "Active girls (0–13)", activeBoys: "Active boys (0–13)",
    acceptedFamilies: "New families this year", acceptedUB: "New Individuals",
    combined: "Combined", imbabura: "Imbabura",
    statusDist: "Status Distribution",
    championsLabel: "Champions (Full Size)",
    growthLabel: "Growth Pipeline",
    clinicTitle: "Medical Care Provided By Clinica la Y",
    totalLifeFarms: "Total Life Farms (all types)",
    newThisYear: "New this year",
    newFarmsMonthly: "New Farms Added Per Month",
    vbsUnique: "Unique VBS attendees",
    professionsOfFaith: "Professions of Faith",
    professionsOfFaithAllTime: "all time",
    biblesMonthlyTitle: "Bibles Distributed Per Month",
    vbsMonthlyTitle: "VBS Attendance Per Month",
    pofMonthlyTitle: "Professions of Faith Per Month",
    mepActivitiesTitle: "Monthly Program Activities",
    loansMonthlyTitle: "Loans Disbursed Per Month",
    totalCapitalDisbursed: "Total capital disbursed (all time)",
    totalRepaidLabel: "Repaid by entrepreneurs (all time)",
    programRepaymentRate: "Program repayment rate",
    thisYear: "This year",
    otherCommunities: "Other communities",
    sharkNewThisYear: "New winners this year",
    sharkMonthlyTitle: "New Winners Per Month",
    hotMealsTabDesc: "Freshly prepared meals served on-site to families and children at outreach events and weekly community gatherings.",
    groceriesTabDesc: "Bags of staple groceries delivered to vulnerable families to cover basic monthly nutrition needs.",
    clothingTabDesc: "Donated clothing distributed to families in our service communities, sorted and given according to need.",
    emergencyTabDesc: "Rapid-response aid delivered to beneficiaries facing natural disasters, accidents, or unexpected crises.",
    christmasTabDesc: "Annual Christmas program providing hot meals, toys, and candy bags to children and families across our communities.",
    healthTabDesc: "Medical care through Clínica la Y, plus specialist appointments, medicines, and other health assistance for beneficiaries.",
    educationTabDesc: "School kits, backpacks, and educational support that keep beneficiary children enrolled and ready for the school year.",
    shelterTabDesc: "Furniture, appliances, household goods, electronics, and construction projects that improve the daily living environment of beneficiary families.",
    lifeFarmsTabDesc: "Family-run home gardens with seedlings, training, and supplies that produce food and generate income.",
    revolvingFundTabDesc: "Micro-Entrepreneurial Projects (MEPs) backed by seed capital and accompaniment so families can launch sustainable businesses.",
    sharkTankTabDesc: "Pitch and accelerator program connecting promising MEPs with mentorship, exposure, and additional investment.",
    // Breakdown table + chart selector (Health, Evangelism)
    colLineItem: "Line item", colServices: "Services", colPeople: "Individuals served", colCost: "Cost",
    healthBreakdownTitle: "Breakdown by line item",
    selectFigureHint: "Select any figure to see it month by month in the chart below.",
    rowOtherMedical: "Other medical assistance", rowOtherMedicalHint: "Specialists, exams, treatment, medicines",
    rowHygiene: "Hygiene kits", rowVitamins: "Vitamins",
    rowDiapersAdult: "Adult diapers", rowDiapersChild: "Children's diapers (babies 0–2)",
    subtotalOtherHealth: "Subtotal · other health assistance",
    healthTotalCost: "Total cost (clinic + other assistance)",
    infoHealthTotalCost: "Clinic payments (Voz y Manos {vm} + Pan de Vida {pdv}) + other health assistance ({other}), this year.",
    clinicCost: "Clinic cost",
    vbsCampsShort: "VBS camps held", vbsUniqueShort: "Unique children",
    allTime: "All time",
    // 2026 Plan
    goalsMetLabel: "tracked goals met",
    sectionMet: "{met} of {n} met",
    statusMet: "Goal met", statusOnTrack: "On pace", statusBehind: "Below pace", statusUntracked: "Not tracked",
    paceNote: "{pct}% of the year has passed. The mark on each bar shows where a goal would be at an even pace through the year.",
    viewProgram: "View program",
    // Education / Living Conditions / Level 3
    colComponent: "Component", colUnits: "Units", colCategory: "Category",
    kitBreakdownTitle: "What goes into each kit",
    rowSupplies: "School supplies", rowBackpacks: "Backpacks", rowKitTotal: "Complete kit",
    eduVitaminsNote: "Each kit also includes vitamins. They are recorded under Health ({vitamins} this year), so they are not added here.",
    shelterBreakdownTitle: "Breakdown by category", inKind: "In kind",
    farmsByTypeTitle: "Progress by type",
    farmsByTypeHint: "Select “New this year” on any type to see it month by month in the chart below.",
    farmsUnit: "farms", noGoal: "No goal set", allTypes: "All types",
    locationNote: "{n} of {total} microbusinesses have no location recorded and are not shown.",
    // Level 1 / Beneficiaries / Overview
    colProgram: "Program", colDelivered: "Delivered", colMeasure: "Measure",
    l1BreakdownTitle: "Breakdown by program",
    hotMealsPeopleSub: "≈ {n} people in those families (est.)",
    perKit: "per kit (average)", noRecordsShort: "No records yet",
    benByRegion: "By region", benActiveSection: "Active today",
    otherBeneficiaries: "Other active beneficiaries",
    combinedInfo: "Counts every province, so it can be higher than Quito + Imbabura.",
    servicesShort: "Services delivered",
    unitPlates: "plates", unitKits: "kits", unitDonations: "donations", unitServices: "services",
    unitSchoolKits: "school kits", unitItems: "items", unitMeps: "MEPs", unitWinners: "winners",
    // Hover text of each box's "i" icon: what the number counts and where it comes from.
    info: {
      totalReached: "Unique people living in any household that received at least one service this year, across all programs. Each person counts once, however many times their family was served.",
      activeLifeFarms: "All life farms set up to date, every type (ideal, full size, basic, multiplication, urban). Shown separately — farms are not people, so they are not added to the total.",
      totalBeneficiaries: "Active beneficiaries in Salesforce (Beneficiary contacts with status active), each counted once. A current snapshot, not limited to this year.",
      totalAccounts: "Families (household accounts, by APA number) with at least one active beneficiary. A current snapshot.",
      newFamilies: "Families whose household account was created in Salesforce this year (reports “NUEVOS APAs” Quito + Imbabura).",
      totalDeliveries: "Services delivered this year: hot-meal plates + food kits + clothing + health services + school supplies + backpacks + living-conditions items and projects.",
      l1Served: "Unique people who received any Hunger Relief or Emergency Relief service this year: registered beneficiaries plus walk-ins identified by their ID. Each person counts once across programs.",
      l2Served: "Unique people who received any Health, Education or Living Conditions service this year (registered + walk-ins by ID). Each person counts once across programs.",
      l3Served: "Unique people who received any Microbusiness program service this year (registered + walk-ins by ID).",
      l1Cost: "Costs recorded in Salesforce for this level: the total cost of this year's food kits. Other level 1 costs are not recorded yet.",
      l2Cost: "Clinic payments (Voz y Manos + Pan de Vida) + other medical assistance + hygiene kits + vitamins + school supplies and backpacks + living-conditions purchases, this year.",
      l3Cost: "No costs are recorded in Salesforce yet for life farms or microbusinesses.",
      education: "School kits delivered this year. Each kit (school supplies + backpack) counts once.",
      lifeFarmsTotal: "All life farms set up to date, every type (reports “HUERTOS DE VIDA …”).",
      mepTotal: "Microbusiness accounts in Salesforce, all statuses (active, inactive, finished, aborted).",
      marketReady: "Active businesses running for more than 9 months, counted once each.",
      sharkWinners: "All Shark Tank winners since the program began (report “Ganadores Shark Tank”).\n\nWhich winning businesses are still operating can't be shown yet: each winner would need to be linked to its Microbusiness record in Salesforce.",
      hotMealsPlates: "Hot-meal plates served this year, as recorded in Salesforce (report “Comida Caliente”).",
      hotMealsFamilies: "Counts unique people: registered beneficiaries plus walk-ins identified by their ID document, each counted once however many meals they received. Many plates are served at open community events, and the same families eat with us repeatedly through the year.",
      hotMealsPeople: "An estimate. For the {households} registered families served we add up the household members recorded in Salesforce ({registered} people). The {notRegistered} walk-ins have no family recorded, so each is counted as an average-sized family: {avg} people, the average of all {activeHouseholds} active families. Household sizes are only as current as each family's last registration update.",
      uniquePeople: "Unique people served this year: registered beneficiaries plus walk-ins identified by their ID document. Each person counts once, however many times they were served.",
      groceryBags: "Food kits delivered this year (report “VIVERES AVG COST”).",
      groceryAvgCost: "Total cost ÷ food kits delivered, so unit cost × kits = total cost.",
      groceryTotalCost: "Sum of the total cost recorded on this year's food-kit deliveries.",
      clothingDonations: "Clothing donations delivered to families this year (report “Ropa”).",
      chartHotMeals: "Hot-meal plates served each month this year.",
      chartGroceries: "Food kits delivered each month this year.",
      chartClothing: "Clothing donations delivered each month this year.",
      chartEmergency: "Emergency food kits delivered each month this year (report “Víveres Emergencia”).",
      chartChristmas: "Christmas hot meals, food kits, toys and other donations per month (the four Christmas reports).",
      healthServices: "Every Health program service delivered this year (sum of quantities): clinic appointments plus other medical assistance, hygiene kits, vitamins and diapers.",
      healthUB: "Unique people who received any health service this year (registered + walk-ins by ID). Someone served by the clinic and also given vitamins or a hygiene kit counts once, so this is less than the “individuals served” cards below added together.",
      clinicAppointments: "Medical, physiotherapy and dental appointments at Clínica la Y this year (report “Atenciones Médicas Clínica la Y”).",
      clinicVozManos: "Amount Voz y Manos paid for this year's clinic services (cost per unit recorded on each appointment).",
      clinicPDV: "Clinic costs paid by Pan de Vida (report “COSTO A.MEDICA PDV”).",
      otherAids: "Health services outside the clinic delivered this year: specialists, medical exams, medicines, nutritionist, health talks and fairs, and other health donations. Hygiene kits, vitamins and diapers are counted apart, in the rows below.",
      otherAidsAll: "Specialist appointments, medicines and other health aid outside the clinic, delivered this year.",
      otherInvested: "Total cost recorded for this year's other medical assistance. Hygiene kits and vitamins have their own cost cards.",
      otherHealthTotalCost: "The cost of every line above added together: other medical assistance ({other}) + hygiene kits ({hygiene}) + vitamins ({vitamins}) + diapers ({diapers}). Clinic payments are not included.",
      hygieneKits: "Hygiene kits delivered this year (Health program service “Kit de higiene”).",
      hygieneCost: "Total cost recorded on this year's hygiene-kit deliveries.",
      vitamins: "Vitamins delivered this year. Most of them go inside the school kits (school supplies + backpack + vitamins) and are counted here, under Health.",
      vitaminsCost: "Total cost recorded on this year's vitamin deliveries.",
      diapersAdult: "Adult diaper donations delivered this year (sum of the quantities recorded in Salesforce).",
      diapersChild: "Diaper donations for babies aged 0–2 delivered this year (sum of the quantities recorded in Salesforce).",
      chartHealth: "Health services delivered each month this year (clinic + all other health assistance).",
      schoolKits: "School-supplies sets distributed this year (Salesforce service “Kit de útiles escolares”). The backpack and the vitamins of each school kit are counted separately.",
      schoolKitsFull: "Complete school kits given to children this year. Each kit = school supplies + a backpack + vitamins.",
      schoolKitsFullCost: "School supplies ({supplies}) + backpacks ({backpacks}). The vitamins are recorded under Health ({vitamins} this year), so they are not added here.",
      unitCost: "Total cost ÷ units delivered (report “{report}”), so unit cost × units = total cost.",
      totalCostUnits: "Sum of the total cost recorded on this year's deliveries (report “{report}”).",
      backpacks: "Backpacks distributed this year (report “Mochilas”).",
      chartEducation: "School kits delivered each month this year. Each kit (school supplies + backpack) counts once.",
      shelterServices: "Items and projects delivered this year in the five categories: furniture, appliances, household goods, electronics & supplies, and construction projects.\n\nService providers include Joshua Expeditions, Staff PDV, Grace Baptist Church Wilmington, and New Life Church.",
      shelterUB: "The five categories' “families served” added together. Someone who received items in two categories counts in both.",
      shelterItems: "{category} items delivered this year (sum of quantities).",
      shelterFurniture: "Furniture delivered this year (sum of quantities). Beds, bunk beds, mattresses, bedding and tables are recorded here — mattresses do not have a category of their own.",
      shelterConstruction: "Construction and home-improvement projects carried out this year, most of them with mission teams (Hit Squads), plus donations of construction materials.",
      shelterFamilies: "Unique families: {deliveries} deliveries were recorded for {ub} different recipients. Anyone who received more than once counts a single time.",
      shelterCost: "Total cost recorded in Salesforce for this category this year. Most items are in-kind donations, recorded at $0; only what Pan de Vida purchased (beds, mattresses, etc.) carries a cost.",
      shelterTotalCost: "Sum of the costs recorded in the five categories this year. In-kind donations are recorded at $0, so this is what was purchased.",
      chartShelter: "Living-conditions items and projects delivered each month this year (all categories).",
      lifeFarmsNew: "Farms set up this year, every type. Each farm service delivery recorded in Salesforce = one farm.",
      farmProgress: "Farms of this type set up to date, against the goal. “New this year” counts the ones set up this year.",
      championsProgress: "Ideal + full-size farms set up to date, against the goal.",
      chartFarms: "New farms set up each month this year, every type.",
      urbanCount: "Urban life farms set up to date (report “HUERTOS DE VIDA URBANO”).",
      urbanNew: "Urban farms set up this year.",
      chartUrban: "New urban farms set up each month this year.",
      mepActive: "Microbusinesses whose status is Active.",
      mepParticipants: "Unique people who received Microbusiness program services this year (trainings, meetings, visits, farm support) — not the number of businesses.",
      capitalDisbursed: "All revolving-fund capital ever lent to entrepreneurs. This year ({year}): ${amount}.",
      capitalRepaid: "All repayments ever received from entrepreneurs. This year ({year}): ${amount}.",
      outstanding: "What entrepreneurs still owe today across all loans.",
      repaymentRate: "(Total disbursed − current outstanding balance) ÷ total disbursed, over the whole history of the fund.",
      mepStatus: "Microbusinesses by their current status in Salesforce.",
      mepLocations: "Microbusinesses by community. The six largest are listed; smaller ones are grouped, and businesses without a community recorded are shown apart.",
      chartLoans: "Number of revolving-fund loans disbursed each month this year.",
      chartMepActivities: "Services delivered by the Microbusiness program — trainings, community meetings, technical assistance, supervision visits, and farm support. These are not capital loans.",
      sharkNew: "Shark Tank winners added this year.",
      sharkCost: "What Pan de Vida has paid for Shark Tank winners, all time.",
      chartShark: "New Shark Tank winners each month this year.",
      bibles: "Bibles distributed this year: Spanish, Quichua and children's bibles.",
      biblesAdult: "Spanish Bibles for adults and youth distributed this year (Salesforce service “Biblias”).",
      biblesQuichua: "Quichua Bibles distributed this year (Salesforce service “Biblias Quichua”).",
      biblesChildren: "Children's Bibles distributed this year (Salesforce service “Biblia de niño”).",
      vbsCamps: "VBS camps held this year (each camp date counts once).",
      vbsAttendances: "Total VBS attendances this year. A child who attended several camps counts each time.",
      vbsUnique: "Different children who attended at least one VBS camp this year.",
      personasAlcanzadas: "People living in the households of beneficiaries who received any service this year (report “Personas Alcanzadas por el Evangelio”).",
      pofYear: "Professions of faith recorded in Salesforce this year.",
      pofAllTime: "Professions of faith recorded in Salesforce since records began.",
      chartBibles: "Bibles distributed each month this year.",
      chartVbs: "VBS attendances each month this year.",
      chartPof: "Professions of faith recorded each month this year.",
      activeAccounts: "Families (household accounts, by APA number) with at least one active beneficiary. Quito = mailing province Pichincha, Imbabura = province Imbabura; Combined counts every province.",
      activeBeneficiaries: "Active beneficiaries (Beneficiary contacts with status active), each counted once. Quito = mailing province Pichincha, Imbabura = province Imbabura; Combined counts every province.",
      activeChildren: "Active beneficiaries aged 0–13 recorded with this gender.",
      newFamiliesYear: "Families whose household account was created in Salesforce this year (reports “NUEVOS APAs”).",
      newIndividuals: "Active beneficiaries who belong to those new families.",
      goals: "Targets are set by PDV planning (not stored in Salesforce). Progress bars compare live Salesforce data against each annual goal ({n} goals tracked live).",
    },
  },
  es: {
    overview: "Resumen",
    level1: "Nivel 1", level1Name: "Alivio", level1Desc: "Asistencia inmediata",
    level2: "Nivel 2", level2Name: "Restauración", level2Desc: "Reconstruyendo vidas",
    level3: "Nivel 3", level3Name: "Desarrollo", level3Desc: "Crecimiento sostenible",
    evangelism: "Evangelización", evangelismDesc: "En todos los niveles",
    beneficiaries: "Beneficiarios", beneficiariesDesc: "Personas que servimos",
    lastUpdated: "Última actualización", dataSynced: "Datos sincronizados",
    totalBeneficiaries: "Beneficiarios Activos (Individuos)", totalAccounts: "Cuentas Familiares Activas (Familias)",
    newFamilies: "Nuevas Familias Añadidas Este Año", totalDeliveries: "Total de Servicios Entregados",
    impactByLevel: "Impacto por Nivel",
    hotMeals: "Comida Caliente", hotMealsDelivered: "Comidas calientes servidas",
    familiesHotMeals: "Familias servidas",
    hotMealsPeople: "Personas en esas familias (est.)",
    groceries: "Víveres", groceryBags: "Víveres entregados",
    ubGrocery: "Familias servidas", avgCost: "Costo promedio",
    totalCost: "Costo total estimado",
    clothing: "Ropa", clothingDonations: "Ropa distribuida a familias",
    ubClothing: "Familias servidas",
    emergency: "Emergencia", christmas: "Navidad",
    christmasHotMeals: "Platos de comida caliente distribuidos",
    christmasToys: "Juguetes distribuidos",
    christmasCandy: "Fundas de caramelos distribuidas",
    noDataYet: "Sin datos registrados aún para este período",
    monthlyDistribution: "Distribución Mensual",
    jan: "Ene", feb: "Feb", mar: "Mar", apr: "Abr", may: "May", jun: "Jun",
    jul: "Jul", aug: "Ago", sep: "Sep", oct: "Oct", nov: "Nov", dec: "Dic",
    health: "Salud", education: "Educación", shelter: "Condiciones de Vida",
    medicalAttention: "Citas médicas", ubMedical: "Individuos servidos",
    paidByVozManos: "Pagado por Voz y Manos", paidByPDV: "Pagado por Pan de Vida",
    otherMedicalAidsTitle: "Otras asistencias de salud",
    otherMedicalAids: "Otras asistencias médicas (especialistas, exámenes, tratamiento, medicamentos)", ubOtherMedical: "Individuos servidos",
    otherMedicalAidsAll: "Asistencia médica (Citas de especialidad, medicinas, etc.)",
    investedOther: "Invertido en otras asistencias médicas",
    otherHealthTotalCost: "Total invertido en otras asistencias de salud",
    hygieneKits: "Kits de higiene entregados", hygieneCost: "Costo de kits de higiene",
    vitaminsDelivered: "Vitaminas entregadas", vitaminsCost: "Costo de vitaminas",
    diapers: "Pañales", diapersAdult: "Pañales de adulto entregados", diapersChild: "Pañales de niño entregados (bebés 0–2)",
    healthUBNote: "Los {n} individuos servidos son beneficiarios únicos: quien recibió varios tipos de ayuda cuenta una sola vez, por eso este total no es la suma de los números parciales de abajo.",
    totalHealthServices: "Total de servicios de salud provistos", totalHealthUB: "Individuos servidos",
    schoolKits: "Útiles escolares distribuidos", backpacks: "Mochilas distribuidas",
    schoolSuppliesShort: "útiles escolares",
    schoolKitsFull: "Kits escolares entregados", schoolKitsFullCost: "Costo total (útiles + mochilas)",
    educationMonthlyTitle: "Kits Escolares Entregados por Mes",
    totalEducationServices: "Total de servicios educativos provistos", totalEducationUB: "Individuos servidos",
    unitCost: "Costo unitario", totalCostLabel: "Costo total",
    vbsCamps: "Campamentos EBV", shelterServices: "Total servicios",
    shelterUB: "Familias servidas",
    shelterFurniture: "Mobiliario (camas, colchones, muebles)", shelterAppliances: "Electrodomésticos",
    shelterHousehold: "Enseres del hogar", shelterElectronics: "Electrónicos y suministros",
    shelterConstruction: "Proyectos de construcción / Hit Squads",
    shelterCost: "Costo (compras)", shelterTotalCost: "Costo total (compras)",
    shelterItemsDelivered: "Items entregados", shelterFamiliesServed: "Familias servidas",
    lifeFarms: "Huertos de Vida", sharkTank: "Shark Tank PDV",
    revolvingFund: "Fondo Rotativo",
    idealFarm: "Huerto Ideal",
    idealFarmDesc: "Banco semillas + compost + animales + otros",
    fullSizeFarm: "Huerto Completo",
    fullSizeFarmDesc: "Sin adicionales",
    totalChampions: "Total Campeones",
    basicFarm: "Huertos Básicos",
    basicFarmDesc: "Nuevos casos + producción plántulas",
    multiplicationFarm: "Multiplicación",
    multiplicationDesc: "Casos seleccionados + apoyo",
    urbanFarms: "Huertos de Vida Urbanos", urbanFarmsTabDesc: "Huertos familiares adaptados para zonas urbanas.", urbanFarmsCount: "Cantidad de Huertos Urbanos",
    sharkTankWinners: "Ganadores Shark Tank (histórico)", sharkTankPdvCost: "Costo PDV",
    goal: "Meta", done: "Realizado",
    totalMEPs: "Total MEPs", active: "Activos", inactive: "Inactivos",
    finished: "Finalizados", aborted: "Cancelados", marketReady: "Listos para Mercado",
    mepParticipants: "Personas servidas este año",
    fundCapital: "Capital del Fondo Rotativo",
    capitalDisbursed: "Capital desembolsado (préstamos)",
    repaidByEntrepreneurs: "Reembolsado por emprendedores",
    outstandingBalance: "Saldo pendiente actual",
    repaymentRate: "Tasa de reembolso",
    noLocation: "Sin ubicación registrada",
    goals2026: "Plan 2026",
    goals2026Sub: "Plan de Ayudas y Servicios a Beneficiarios — metas anuales",
    progressYtd: "Avance este año",
    buTarget: "Personas beneficiadas (BU)",
    sharkTankPlaceholder: "Datos próximamente — las métricas de este programa están siendo integradas.",
    viewDetail: "Ver detalle",
    monthlyShort: "Mensual",
    monthlyBreakdown: "Desglose mensual",
    yearTotal: "Total del año",
    close: "Cerrar",
    noMonthlyData: "Aún no hay registros este año.",
    uniqueMonthlyNote: "Cada barra cuenta las personas únicas atendidas ese mes. Una misma persona puede ser atendida en varios meses, por lo que las barras no suman el total anual.",
    uniqueFamiliesMonthlyNote: "Cada barra cuenta las familias únicas atendidas ese mes. Una misma familia puede ser atendida en varios meses, por lo que las barras no suman el total anual.",
    personasMonthlyNote: "Personas en hogares que recibieron al menos una entrega ese mes. Los meses se superponen, por lo que las barras no suman el total anual.",
    newFamiliesMonthlyNote: "Según el mes en que se creó la cuenta de la familia en Salesforce.",
    fundFlowNote: "Las barras muestran los flujos de este año; la tarjeta muestra el total histórico del programa.",
    capitalDisbursedThisYear: "Capital desembolsado — este año",
    repaidThisYear: "Pagos recibidos — este año",
    farmsMonthlyNote: "Huertos nuevos por mes este año (la tarjeta muestra el total acumulado).",
    deliveriesMonthlyNote: "Comidas + víveres + ropa + salud + educación + vivienda.",
    byLocation: "Por Ubicación",
    quito: "Quito", otavalo: "Otavalo", mantaRiobamba: "Manta y Riobamba",
    biblesDelivered: "Biblias distribuidas",
    biblesByTypeTitle: "Biblias por tipo",
    biblesAdult: "Biblias de adulto (español)", biblesQuichua: "Biblias en quichua", biblesChildren: "Biblias de niños",
    vbsCampsHeld: "CAMPAMENTOS EBV REALIZADOS",
    childrenVBS: "Asistencias EBV (total)",
    personasAlcanzadas: "Individuos alcanzados por el evangelio",
    individualsServed: "Individuos servidos",
    totalReached: "Total de Personas Alcanzadas",
    activeLifeFarms: "Huertos de Vida Activos",
    clothingDonationsCount: "Número de donaciones de ropa",
    activeAccounts: "Cuentas activas", activeBeneficiaries: "Beneficiarios activos",
    activeGirls: "Niñas activas (0–13)", activeBoys: "Niños activos (0–13)",
    acceptedFamilies: "Nuevas familias este año", acceptedUB: "Nuevos Individuos",
    combined: "Combinado", imbabura: "Imbabura",
    statusDist: "Distribución por Estado",
    championsLabel: "Campeones (Tamaño Completo)",
    growthLabel: "Pipeline de Crecimiento",
    clinicTitle: "Atención Médica Provista por Clínica la Y",
    totalLifeFarms: "Total Huertos de Vida (todos los tipos)",
    newThisYear: "Nuevos este año",
    newFarmsMonthly: "Nuevos Huertos por Mes",
    vbsUnique: "Asistentes únicos EBV",
    professionsOfFaith: "Profesiones de Fe",
    professionsOfFaithAllTime: "histórico",
    biblesMonthlyTitle: "Biblias Distribuidas por Mes",
    vbsMonthlyTitle: "Asistencia EBV por Mes",
    pofMonthlyTitle: "Profesiones de Fe por Mes",
    mepActivitiesTitle: "Actividades Mensuales del Programa",
    loansMonthlyTitle: "Préstamos Desembolsados por Mes",
    totalCapitalDisbursed: "Capital total desembolsado (histórico)",
    totalRepaidLabel: "Reembolsado por emprendedores (histórico)",
    programRepaymentRate: "Tasa de reembolso del programa",
    thisYear: "Este año",
    otherCommunities: "Otras comunidades",
    sharkNewThisYear: "Nuevos ganadores este año",
    sharkMonthlyTitle: "Nuevos Ganadores por Mes",
    hotMealsTabDesc: "Comidas recién preparadas servidas en el lugar a familias y niños en eventos de extensión y reuniones comunitarias semanales.",
    groceriesTabDesc: "Fundas de víveres básicos entregadas a familias vulnerables para cubrir las necesidades alimenticias mensuales.",
    clothingTabDesc: "Ropa donada distribuida a familias de las comunidades que servimos, clasificada y entregada según la necesidad.",
    emergencyTabDesc: "Ayuda de respuesta rápida entregada a beneficiarios que enfrentan desastres naturales, accidentes o crisis inesperadas.",
    christmasTabDesc: "Programa navideño anual que provee comidas calientes, juguetes y fundas de caramelos a niños y familias de nuestras comunidades.",
    healthTabDesc: "Atención médica en Clínica la Y, además de citas con especialistas, medicinas y otras ayudas de salud para los beneficiarios.",
    educationTabDesc: "Kits escolares, mochilas y apoyo educativo que mantienen a los niños beneficiarios matriculados y listos para el año escolar.",
    shelterTabDesc: "Mobiliario, electrodomésticos, enseres del hogar, electrónicos y proyectos de construcción que mejoran el entorno diario de las familias beneficiarias.",
    lifeFarmsTabDesc: "Huertos familiares con plántulas, capacitación y suministros para producir alimentos y generar ingresos.",
    revolvingFundTabDesc: "Proyectos Micro-Empresariales (MEPs) con capital semilla y acompañamiento para que las familias inicien negocios sostenibles.",
    sharkTankTabDesc: "Programa de pitch y aceleración que conecta MEPs prometedores con mentoría, exposición e inversión adicional.",
    colLineItem: "Rubro", colServices: "Servicios", colPeople: "Individuos servidos", colCost: "Costo",
    healthBreakdownTitle: "Desglose por rubro",
    selectFigureHint: "Selecciona cualquier cifra para verla mes a mes en el gráfico de abajo.",
    rowOtherMedical: "Otras asistencias médicas", rowOtherMedicalHint: "Especialistas, exámenes, tratamiento, medicamentos",
    rowHygiene: "Kits de higiene", rowVitamins: "Vitaminas",
    rowDiapersAdult: "Pañales de adulto", rowDiapersChild: "Pañales de niño (bebés 0–2)",
    subtotalOtherHealth: "Subtotal · otras asistencias de salud",
    healthTotalCost: "Costo total (clínica + otras asistencias)",
    infoHealthTotalCost: "Pagos de la clínica (Voz y Manos {vm} + Pan de Vida {pdv}) + otras asistencias de salud ({other}), este año.",
    clinicCost: "Costo de la clínica",
    vbsCampsShort: "Campamentos EBV", vbsUniqueShort: "Niños únicos",
    allTime: "Histórico",
    goalsMetLabel: "metas con seguimiento cumplidas",
    sectionMet: "{met} de {n} cumplidas",
    statusMet: "Meta cumplida", statusOnTrack: "En ritmo", statusBehind: "Bajo el ritmo", statusUntracked: "Sin seguimiento",
    paceNote: "Ha transcurrido el {pct}% del año. La marca en cada barra muestra dónde estaría la meta con un ritmo parejo durante el año.",
    viewProgram: "Ver programa",
    colComponent: "Componente", colUnits: "Unidades", colCategory: "Categoría",
    kitBreakdownTitle: "Qué lleva cada kit",
    rowSupplies: "Útiles escolares", rowBackpacks: "Mochilas", rowKitTotal: "Kit completo",
    eduVitaminsNote: "Cada kit incluye además vitaminas. Se registran en Salud ({vitamins} este año), por eso no se suman aquí.",
    shelterBreakdownTitle: "Desglose por categoría", inKind: "En especie",
    farmsByTypeTitle: "Avance por tipo",
    farmsByTypeHint: "Selecciona “Nuevos este año” en cualquier tipo para verlo mes a mes en el gráfico de abajo.",
    farmsUnit: "huertos", noGoal: "Sin meta definida", allTypes: "Todos los tipos",
    locationNote: "{n} de {total} micronegocios no tienen ubicación registrada y no se muestran.",
    colProgram: "Programa", colDelivered: "Entregado", colMeasure: "Medida",
    l1BreakdownTitle: "Desglose por programa",
    hotMealsPeopleSub: "≈ {n} personas en esas familias (est.)",
    perKit: "por kit (promedio)", noRecordsShort: "Sin registros aún",
    benByRegion: "Por región", benActiveSection: "Activos hoy",
    otherBeneficiaries: "Otros beneficiarios activos",
    combinedInfo: "Cuenta todas las provincias, por eso puede ser mayor que Quito + Imbabura.",
    servicesShort: "Servicios entregados",
    unitPlates: "platos", unitKits: "kits", unitDonations: "donaciones", unitServices: "servicios",
    unitSchoolKits: "kits escolares", unitItems: "artículos", unitMeps: "MEPs", unitWinners: "ganadores",
    info: {
      totalReached: "Personas únicas que viven en algún hogar que recibió al menos un servicio este año, en todos los programas. Cada persona cuenta una vez, sin importar cuántas veces se atendió a su familia.",
      activeLifeFarms: "Todos los huertos de vida instalados a la fecha, de todo tipo (ideal, completo, básico, multiplicación, urbano). Se muestra aparte: los huertos no son personas, así que no se suman al total.",
      totalBeneficiaries: "Beneficiarios activos en Salesforce (contactos tipo Beneficiary con estado activo), cada uno contado una vez. Es una foto actual, no solo de este año.",
      totalAccounts: "Familias (cuentas de hogar, por número de APA) con al menos un beneficiario activo. Es una foto actual.",
      newFamilies: "Familias cuya cuenta de hogar se creó en Salesforce este año (reportes “NUEVOS APAs” Quito + Imbabura).",
      totalDeliveries: "Servicios entregados este año: platos de comida caliente + víveres + ropa + servicios de salud + útiles escolares + mochilas + artículos y proyectos de condiciones de vida.",
      l1Served: "Personas únicas que recibieron algún servicio de Mitigación del Hambre o Ayuda de Emergencia este año: beneficiarios registrados más personas no registradas identificadas por su cédula. Cada persona cuenta una vez entre programas.",
      l2Served: "Personas únicas que recibieron algún servicio de Salud, Educación o Condiciones de Vida este año (registrados + no registrados por cédula). Cada persona cuenta una vez entre programas.",
      l3Served: "Personas únicas que recibieron algún servicio del programa de Microemprendimiento este año (registrados + no registrados por cédula).",
      l1Cost: "Costos registrados en Salesforce para este nivel: el costo total de los víveres de este año. Los demás costos del nivel 1 aún no se registran.",
      l2Cost: "Pagos de la clínica (Voz y Manos + Pan de Vida) + otras asistencias médicas + kits de higiene + vitaminas + útiles escolares y mochilas + compras de condiciones de vida, este año.",
      l3Cost: "Aún no se registran costos en Salesforce para huertos de vida ni microemprendimientos.",
      education: "Kits escolares entregados este año. Cada kit (útiles escolares + mochila) cuenta una vez.",
      lifeFarmsTotal: "Todos los huertos de vida instalados a la fecha, de todo tipo (reportes “HUERTOS DE VIDA …”).",
      mepTotal: "Cuentas de Micronegocio en Salesforce, en todos los estados (activo, inactivo, finalizado, abortado).",
      marketReady: "Negocios activos con más de 9 meses de funcionamiento, cada uno contado una vez.",
      sharkWinners: "Todos los ganadores de Shark Tank desde el inicio del programa (reporte “Ganadores Shark Tank”).\n\nAún no se puede mostrar cuáles negocios ganadores siguen operando: habría que vincular cada ganador con su registro de Micronegocio en Salesforce.",
      hotMealsPlates: "Platos de comida caliente servidos este año, según Salesforce (reporte “Comida Caliente”).",
      hotMealsFamilies: "Cuenta personas únicas: beneficiarios registrados más personas no registradas identificadas por su cédula, cada una contada una vez sin importar cuántas comidas recibió. Muchos platos se sirven en eventos comunitarios abiertos y las mismas familias comen con nosotros varias veces al año.",
      hotMealsPeople: "Número estimado. Para las {households} familias registradas que se atendieron sumamos los miembros del hogar registrados en Salesforce ({registered} personas). Las {notRegistered} personas no registradas no tienen su familia registrada, así que cada una se cuenta como una familia de tamaño promedio: {avg} personas, el promedio de las {activeHouseholds} familias activas. El tamaño de cada hogar es tan actual como su último registro.",
      uniquePeople: "Personas únicas atendidas este año: beneficiarios registrados más personas no registradas identificadas por su cédula. Cada persona cuenta una vez, sin importar cuántas veces se le atendió.",
      groceryBags: "Fundas de víveres entregadas este año (reporte “VIVERES AVG COST”).",
      groceryAvgCost: "Costo total ÷ fundas entregadas, así costo unitario × fundas = costo total.",
      groceryTotalCost: "Suma del costo total registrado en las entregas de víveres de este año.",
      clothingDonations: "Donaciones de ropa entregadas a familias este año (reporte “Ropa”).",
      chartHotMeals: "Platos de comida caliente servidos cada mes de este año.",
      chartGroceries: "Fundas de víveres entregadas cada mes de este año.",
      chartClothing: "Donaciones de ropa entregadas cada mes de este año.",
      chartEmergency: "Víveres de emergencia entregados cada mes de este año (reporte “Víveres Emergencia”).",
      chartChristmas: "Comida caliente, víveres, juguetes y otras donaciones de Navidad por mes (los cuatro reportes de Navidad).",
      healthServices: "Todos los servicios del programa de Salud entregados este año (suma de cantidades): atenciones en la clínica más otras asistencias médicas, kits de higiene, vitaminas y pañales.",
      healthUB: "Personas únicas que recibieron algún servicio de salud este año (registrados + no registrados por cédula). Quien fue atendido en la clínica y además recibió vitaminas o un kit de higiene cuenta una vez, por eso es menor que la suma de las tarjetas de “individuos servidos” de abajo.",
      clinicAppointments: "Atenciones médicas, de fisioterapia y odontología en la Clínica la Y este año (reporte “Atenciones Médicas Clínica la Y”).",
      clinicVozManos: "Monto que pagó Voz y Manos por los servicios de la clínica de este año (costo unitario registrado en cada atención).",
      clinicPDV: "Costos de la clínica pagados por Pan de Vida (reporte “COSTO A.MEDICA PDV”).",
      otherAids: "Servicios de salud fuera de la clínica entregados este año: especialistas, exámenes médicos, medicinas, nutricionista, charlas y ferias de salud, y otras donaciones de salud. Los kits de higiene, las vitaminas y los pañales se cuentan aparte, en las filas de abajo.",
      otherAidsAll: "Citas con especialistas, medicinas y otras ayudas de salud fuera de la clínica, entregadas este año.",
      otherInvested: "Costo total registrado en las otras asistencias médicas de este año. Los kits de higiene y las vitaminas tienen sus propias tarjetas de costo.",
      otherHealthTotalCost: "La suma del costo de todos los rubros de arriba: otras asistencias médicas ({other}) + kits de higiene ({hygiene}) + vitaminas ({vitamins}) + pañales ({diapers}). No incluye los pagos de la clínica.",
      hygieneKits: "Kits de higiene entregados este año (servicio “Kit de higiene” del programa de Salud).",
      hygieneCost: "Costo total registrado en las entregas de kits de higiene de este año.",
      vitamins: "Vitaminas entregadas este año. La mayoría va dentro de los kits escolares (útiles + mochila + vitaminas) y se cuenta aquí, en Salud.",
      vitaminsCost: "Costo total registrado en las entregas de vitaminas de este año.",
      diapersAdult: "Donaciones de pañales para adulto entregadas este año (suma de las cantidades registradas en Salesforce).",
      diapersChild: "Donaciones de pañales para bebés de 0 a 2 años entregadas este año (suma de las cantidades registradas en Salesforce).",
      chartHealth: "Servicios de salud entregados cada mes de este año (clínica + todas las demás asistencias de salud).",
      schoolKits: "Juegos de útiles escolares entregados este año (servicio “Kit de útiles escolares” en Salesforce). La mochila y las vitaminas de cada kit escolar se cuentan aparte.",
      schoolKitsFull: "Kits escolares completos entregados a niños este año. Cada kit = útiles escolares + mochila + vitaminas.",
      schoolKitsFullCost: "Útiles escolares ({supplies}) + mochilas ({backpacks}). Las vitaminas se registran en Salud ({vitamins} este año), por eso no se suman aquí.",
      unitCost: "Costo total ÷ unidades entregadas (reporte “{report}”), así costo unitario × unidades = costo total.",
      totalCostUnits: "Suma del costo total registrado en las entregas de este año (reporte “{report}”).",
      backpacks: "Mochilas entregadas este año (reporte “Mochilas”).",
      chartEducation: "Kits escolares entregados cada mes de este año. Cada kit (útiles escolares + mochila) cuenta una vez.",
      shelterServices: "Artículos y proyectos entregados este año en las cinco categorías: mobiliario, electrodomésticos, enseres del hogar, electrónicos y suministros, y proyectos de construcción.\n\nProveedores de servicio: Joshua Expeditions, Staff PDV, Grace Baptist Church Wilmington y New Life Church.",
      shelterUB: "Suma de las “familias servidas” de las cinco categorías. Quien recibió artículos de dos categorías cuenta en ambas.",
      shelterItems: "Artículos de {category} entregados este año (suma de cantidades).",
      shelterFurniture: "Mobiliario entregado este año (suma de cantidades). Aquí se registran camas, literas, colchones, ropa de cama y mesas: los colchones no tienen una categoría propia.",
      shelterConstruction: "Proyectos de construcción y mejora de vivienda realizados este año, la mayoría con equipos misioneros (Hit Squads), más las donaciones de materiales de construcción.",
      shelterFamilies: "Familias únicas: se registraron {deliveries} entregas para {ub} beneficiarios distintos. Quien recibió más de una vez cuenta una sola vez.",
      shelterCost: "Costo total registrado en Salesforce para esta categoría este año. La mayoría son donaciones en especie, registradas en $0; solo lo que Pan de Vida compró (camas, colchones, etc.) lleva costo.",
      shelterTotalCost: "Suma de los costos registrados en las cinco categorías este año. Las donaciones en especie se registran en $0, así que es lo que se compró.",
      chartShelter: "Artículos y proyectos de condiciones de vida entregados cada mes de este año (todas las categorías).",
      lifeFarmsNew: "Huertos instalados este año, de todo tipo. Cada entrega de servicio de huerto registrada en Salesforce = un huerto.",
      farmProgress: "Huertos de este tipo instalados a la fecha, frente a la meta. “Nuevos este año” cuenta los instalados este año.",
      championsProgress: "Huertos ideales + completos instalados a la fecha, frente a la meta.",
      chartFarms: "Huertos nuevos instalados cada mes de este año, de todo tipo.",
      urbanCount: "Huertos de vida urbanos instalados a la fecha (reporte “HUERTOS DE VIDA URBANO”).",
      urbanNew: "Huertos urbanos instalados este año.",
      chartUrban: "Huertos urbanos nuevos instalados cada mes de este año.",
      mepActive: "Micronegocios cuyo estado es Activo.",
      mepParticipants: "Personas únicas que recibieron servicios del programa de Microemprendimiento este año (capacitaciones, reuniones, visitas, apoyo a huertos) — no es el número de negocios.",
      capitalDisbursed: "Todo el capital del fondo rotativo prestado a emprendedores desde el inicio. Este año ({year}): ${amount}.",
      capitalRepaid: "Todos los reembolsos recibidos de emprendedores desde el inicio. Este año ({year}): ${amount}.",
      outstanding: "Lo que los emprendedores aún deben hoy, sumando todos los préstamos.",
      repaymentRate: "(Total desembolsado − saldo pendiente actual) ÷ total desembolsado, sobre toda la historia del fondo.",
      mepStatus: "Micronegocios según su estado actual en Salesforce.",
      mepLocations: "Micronegocios por comunidad. Se listan las seis más grandes; las demás se agrupan y los negocios sin comunidad registrada se muestran aparte.",
      chartLoans: "Número de préstamos del fondo rotativo desembolsados cada mes de este año.",
      chartMepActivities: "Servicios entregados por el programa de Microemprendimiento — capacitaciones, reuniones comunitarias, asistencia técnica, visitas de supervisión y apoyo a huertos. No son préstamos de capital.",
      sharkNew: "Ganadores de Shark Tank agregados este año.",
      sharkCost: "Lo que Pan de Vida ha pagado por los ganadores de Shark Tank, desde el inicio.",
      chartShark: "Ganadores nuevos de Shark Tank cada mes de este año.",
      bibles: "Biblias entregadas este año: en español, en quichua y para niños.",
      biblesAdult: "Biblias en español para adultos y jóvenes entregadas este año (servicio “Biblias” en Salesforce).",
      biblesQuichua: "Biblias en quichua entregadas este año (servicio “Biblias Quichua” en Salesforce).",
      biblesChildren: "Biblias para niños entregadas este año (servicio “Biblia de niño” en Salesforce).",
      vbsCamps: "Campamentos VBS realizados este año (cada fecha de campamento cuenta una vez).",
      vbsAttendances: "Asistencias totales a VBS este año. Un niño que asistió a varios campamentos cuenta cada vez.",
      vbsUnique: "Niños distintos que asistieron al menos a un campamento VBS este año.",
      personasAlcanzadas: "Personas que viven en los hogares de beneficiarios que recibieron algún servicio este año (reporte “Personas Alcanzadas por el Evangelio”).",
      pofYear: "Profesiones de fe registradas en Salesforce este año.",
      pofAllTime: "Profesiones de fe registradas en Salesforce desde que hay registros.",
      chartBibles: "Biblias entregadas cada mes de este año.",
      chartVbs: "Asistencias a VBS cada mes de este año.",
      chartPof: "Profesiones de fe registradas cada mes de este año.",
      activeAccounts: "Familias (cuentas de hogar, por número de APA) con al menos un beneficiario activo. Quito = provincia Pichincha, Imbabura = provincia Imbabura; Combinado cuenta todas las provincias.",
      activeBeneficiaries: "Beneficiarios activos (contactos tipo Beneficiary con estado activo), cada uno contado una vez. Quito = provincia Pichincha, Imbabura = provincia Imbabura; Combinado cuenta todas las provincias.",
      activeChildren: "Beneficiarios activos de 0 a 13 años registrados con este género.",
      newFamiliesYear: "Familias cuya cuenta de hogar se creó en Salesforce este año (reportes “NUEVOS APAs”).",
      newIndividuals: "Beneficiarios activos que pertenecen a esas familias nuevas.",
      goals: "Las metas las define la planificación de PDV (no viven en Salesforce). Las barras de avance comparan los datos vivos de Salesforce contra cada meta anual ({n} metas con seguimiento en vivo).",
    },
  },
};

// ─── COLOR HELPERS ────────────────────────────────────────────

const bgOf = (color) => ({
  [C.blue]:      C.blueBg,
  [C.blueLight]: C.blueBg,
  [C.green]:     C.greenBg,
  [C.red]:       C.redBg,
  [C.yellow]:    C.yellowBg,
  [C.orange]:    C.orangeBg,
  [C.purple]:    C.purpleBg,
  [C.teal]:      C.tealBg,
  [C.pink]:      C.pinkBg,
  [C.text1]:     "#e8eaed",
})[color] ?? C.blueBg;

// ─── SVG ICONS (no emojis) ────────────────────────────────────

const Icon = {
  overview:      () => <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" width="18" height="18"><rect x="2" y="2" width="7" height="7" rx="1.5"/><rect x="11" y="2" width="7" height="7" rx="1.5"/><rect x="2" y="11" width="7" height="7" rx="1.5"/><rect x="11" y="11" width="7" height="7" rx="1.5"/></svg>,
  relief:        () => <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" width="18" height="18"><path d="M10 3v14M3 10h14"/></svg>,
  restoration:   () => <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" width="18" height="18"><path d="M4 10a6 6 0 1 1 4 5.66"/><path d="M4 14v-4h4"/></svg>,
  development:   () => <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" width="18" height="18"><polyline points="3,13 7,8 11,11 17,5"/><polyline points="14,5 17,5 17,8"/></svg>,
  evangelism:    () => <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" width="18" height="18"><path d="M12 2a2 2 0 0 1 2 2v1h1a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h1V4a2 2 0 0 1 2-2z"/><path d="M9 10h6M9 13h4"/></svg>,
  beneficiaries: () => <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" width="18" height="18"><circle cx="8" cy="7" r="3"/><path d="M2 17c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="15" cy="7" r="2"/><path d="M17 17c0-2.2-1.3-4-3-5"/></svg>,
  menu:          () => <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20"><line x1="3" y1="6" x2="17" y2="6"/><line x1="3" y1="10" x2="17" y2="10"/><line x1="3" y1="14" x2="17" y2="14"/></svg>,
  // Stat card icons
  people:        () => <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16"><circle cx="8" cy="7" r="3"/><path d="M2 17c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="15" cy="7" r="2"/><path d="M17 17c0-2.2-1.3-4-3-5"/></svg>,
  folder:        () => <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16"><path d="M2 6a2 2 0 0 1 2-2h3.17a2 2 0 0 1 1.42.59L9.83 6H16a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6z"/></svg>,
  home:          () => <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16"><path d="M3 9.5L10 3l7 6.5V17a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/><path d="M8 18v-6h4v6"/></svg>,
  box:           () => <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16"><path d="M16 7l-6 3-6-3M10 10v8M2 7l8-5 8 5v7l-8 5-8-5V7z"/></svg>,
  book:          () => <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16"><path d="M4 2h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"/><line x1="8" y1="7" x2="12" y2="7"/><line x1="8" y1="11" x2="14" y2="11"/></svg>,
  tent:          () => <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16"><path d="M1 17L10 3l9 14H1z"/><path d="M8 17v-5h4v5"/></svg>,
  child:         () => <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16"><circle cx="10" cy="6" r="3"/><path d="M5 17c0-2.8 2.2-5 5-5s5 2.2 5 5"/></svg>,
  chart:         () => <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16"><polyline points="3,13 7,8 11,11 17,5"/></svg>,
  bars:          () => <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="14" height="14"><path d="M4 16v-5M10 16V4M16 16V8"/></svg>,
  check:         () => <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16"><polyline points="4,10 8,14 16,6"/></svg>,
  star:          () => <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16"><polygon points="10,2 12.5,8 19,8.5 14,13 15.9,19.5 10,16 4.1,19.5 6,13 1,8.5 7.5,8"/></svg>,
  money:         () => <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16"><circle cx="10" cy="10" r="8"/><path d="M10 6v8M8 8.5c0-1.1.9-2 2-2s2 .9 2 2-1 1.5-2 2-2 .9-2 2 .9 2 2 2 2-.9 2-2"/></svg>,
  cart:          () => <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16"><path d="M1 1h3l2 9h10l2-6H5"/><circle cx="8" cy="16" r="1.5"/><circle cx="15" cy="16" r="1.5"/></svg>,
  bag:           () => <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16"><rect x="3" y="7" width="14" height="11" rx="2"/><path d="M7 7V5a3 3 0 0 1 6 0v2"/></svg>,
  doctor:        () => <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16"><rect x="4" y="2" width="12" height="16" rx="2"/><path d="M8 8h4M10 6v4M7 14h6"/></svg>,
  leaf:          () => <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16"><path d="M17 3C11 3 5 6 4 14c3-2 6-3 9-1 1.5.9 3 1.5 4 1.5V3z"/><path d="M4 14c0 0 0 2 2 3"/></svg>,
  backpack:      () => <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16"><rect x="5" y="4" width="10" height="14" rx="3"/><path d="M8 4V3a2 2 0 0 1 4 0v1"/><path d="M5 10h10"/></svg>,
  shirt:         () => <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16"><path d="M1 5l4-3 2 2a3 3 0 0 0 6 0l2-2 4 3-2 3h-3v10H5V8H2L1 5z"/></svg>,
  dollar:        () => <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16"><path d="M10 2v16M7 5.5A3 3 0 0 1 10 4c1.66 0 3 1.12 3 2.5S11.66 9 10 9s-3 1.12-3 2.5S8.34 14 10 14c1.66 0 3-.84 3-2.5"/></svg>,
  warn:          () => <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16"><path d="M10 3L18 17H2L10 3z"/><line x1="10" y1="9" x2="10" y2="12"/><circle cx="10" cy="14.5" r="0.5" fill="currentColor"/></svg>,
  target:        () => <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" width="18" height="18"><circle cx="10" cy="10" r="7.5"/><circle cx="10" cy="10" r="4"/><circle cx="10" cy="10" r="0.8" fill="currentColor"/></svg>,
};

// ─── PRIMITIVES ───────────────────────────────────────────────

function Card({ children, style, className = "", ...rest }) {
  return (
    <div className={`pdv-card ${className}`} style={style} {...rest}>
      {children}
    </div>
  );
}

// ─── INFO TOOLTIP ─────────────────────────────────────────────
// The "i" next to a box's label: hover, focus or tap shows where the number
// comes from. The bubble is portaled to <body> with fixed coordinates, so card
// transforms / overflow / stacking can't clip it, and clicks on the icon never
// reach the card (which may navigate or open the monthly popup).
function InfoTip({ text }) {
  const btnRef = useRef(null);
  const [pos, setPos] = useState(null);
  const id = useId();

  const show = () => {
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    const vw = window.innerWidth;
    const w = Math.min(300, vw - 32);
    const left = Math.max(16, Math.min(r.left + r.width / 2 - w / 2, vw - w - 16));
    // Below the icon unless it sits in the lower part of the screen.
    setPos(r.bottom > window.innerHeight * 0.6
      ? { left, width: w, bottom: window.innerHeight - r.top + 8 }
      : { left, width: w, top: r.bottom + 8 });
  };
  const hide = () => setPos(null);

  // While open: any scroll or a tap elsewhere closes it (touch has no mouseleave).
  useEffect(() => {
    if (!pos) return;
    const onDown = (e) => { if (!btnRef.current?.contains(e.target)) hide(); };
    window.addEventListener("scroll", hide, true);
    document.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("scroll", hide, true);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [pos]);

  if (!text) return null;
  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className="pdv-info-btn"
        aria-label="Info"
        aria-describedby={pos ? id : undefined}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        onClick={(e) => { e.stopPropagation(); show(); }}
        onKeyDown={(e) => { e.stopPropagation(); if (e.key === "Escape") hide(); }}
      >
        <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.4">
          <circle cx="8" cy="8" r="6.5" />
          <path d="M8 7.2v4" strokeLinecap="round" />
          <circle cx="8" cy="4.9" r="0.5" fill="currentColor" stroke="none" />
        </svg>
      </button>
      {pos && createPortal(
        <div id={id} role="tooltip" className="pdv-tooltip" style={pos}>{text}</div>,
        document.body,
      )}
    </>
  );
}

// $1,234.50 — every dollar figure on the cards.
const money = (n) =>
  `$${(n ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Rounds a float sum back to whole cents.
const cents = (v) => Math.round(v * 100) / 100;

// Month-by-month sum of several 12-month series; null if any is missing.
const sumSeries = (...arrs) =>
  arrs.every(Array.isArray)
    ? arrs[0].map((_, i) => cents(arrs.reduce((a, m) => a + (m[i] ?? 0), 0)))
    : null;

// Builds the `figure` helper of a tab: it registers a figure's monthly series
// in `series` (what the tab's SeriesChart can show) and returns its table cell.
//   seriesOpts = { format, note, parts, info } · extra = { sub, tag, info, muted }
const figureFactory = (series, color) => (id, label, value, monthly, seriesOpts = {}, extra = {}) => {
  if (value == null) return null;
  const display = seriesOpts.format === "money" ? money(value) : value.toLocaleString();
  const has = Array.isArray(monthly);
  if (has) series[id] = { label, monthly, total: display, color, ...seriesOpts };
  return { value: display, series: has ? id : null, ...extra };
};

// Total of a 12-month series (0 when it is missing).
const sumOf = (m) => (Array.isArray(m) ? m.reduce((a, b) => a + (b ?? 0), 0) : 0);

// Fills {name} placeholders in an i18n string.
const fill = (str, vars) =>
  str.replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? vars[k].toLocaleString() : m));

// Bar labels stay compact so 12 columns fit on a phone; the full value is in the
// column's tooltip / aria-label.
function formatBarValue(v, format) {
  if (format !== "money") return v.toLocaleString();
  if (v >= 1000) return `$${(v / 1000).toFixed(1)}k`;
  return `$${Math.round(v)}`;
}
function formatFullValue(v, format) {
  return format === "money"
    ? `$${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : v.toLocaleString();
}

function BarChart({ data, color = C.blue, format }) {
  const [a, setA] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setA(true), 300);
    return () => clearTimeout(t);
  }, []);
  const mx = Math.max(...data.map(d => d.value), 1);

  return (
    <div className="pdv-barchart">
      {data.map((d, i) => {
        // `parts` (optional) stacks the column: one coloured slice per part.
        const parts = d.value ? d.parts?.filter((p) => p.value > 0) : null;
        const title = `${d.label}: ${formatFullValue(d.value, format)}` +
          (parts?.length ? ` (${parts.map((p) => `${p.label} ${formatFullValue(p.value, format)}`).join(" · ")})` : "");
        return (
          <div key={i} className="pdv-bar-col" title={title}>
            {d.value > 0 && <span className="pdv-bar-val">{formatBarValue(d.value, format)}</span>}
            <div
              className={`pdv-bar ${parts?.length ? "pdv-bar--stack" : ""}`}
              style={{
                background: parts?.length ? "transparent" : d.value ? (d.color || color) : "rgba(0,0,0,0.08)",
                height: a ? `${d.value ? Math.max((d.value / mx) * 120, 6) : 3}px` : "0px",
                opacity: d.value ? 1 : 0.4,
              }}
            >
              {parts?.map((p, j) => (
                <div key={j} style={{ flex: `${p.value} 1 0`, background: p.color }} />
              ))}
            </div>
            <span className="pdv-bar-lbl">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

const monthLabels = (t) => [t.jan, t.feb, t.mar, t.apr, t.may, t.jun, t.jul, t.aug, t.sep, t.oct, t.nov, t.dec];

// ─── SELECTABLE FIGURES + ONE CHART ───────────────────────────
// Pages that use these keep a single visible chart instead of a fixed chart
// per card: every figure with a monthly series is a toggle, and
// the chart (SeriesChart) shows whichever one is selected.
//   series = { [id]: { label, monthly, total, color, format, note, info, parts } }
//   parts  = [{ label, color, monthly }] stacks the bars (e.g. bibles by type).

// Props that turn an element into the selector of series `id`, or null.
function selectProps(id, active, onSelect) {
  if (!id || !onSelect) return null;
  return {
    role: "button",
    tabIndex: 0,
    "aria-pressed": active === id,
    onClick: () => onSelect(id),
    onKeyDown: (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(id); }
    },
  };
}

// A labelled number inside a card. size: "lg" (headline) | "md" (supporting).
function Figure({ label, value, info, size = "lg", color, seriesId, active, onSelect }) {
  const sel = selectProps(seriesId, active, onSelect);
  return (
    <div className={`pdv-figure pdv-figure--${size} ${sel ? "pdv-figure--btn" : ""}`} {...sel}>
      <div className="pdv-stat-label">
        {label}{sel && <> <span className="pdv-figure-hint"><Icon.bars /></span></>}<InfoTip text={info} />
      </div>
      <div className="pdv-figure-value" style={color ? { color } : undefined}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
    </div>
  );
}

// A total split into its parts: one proportional bar + a legend with each
// part's value (and share of the total).
function SegmentBar({ segments, showPct = true }) {
  const total = segments.reduce((a, s) => a + (s.value ?? 0), 0);
  return (
    <div>
      <div className="pdv-segbar" role="img"
        aria-label={segments.map((s) => `${s.label}: ${s.value}`).join(", ")}>
        {segments.filter((s) => s.value > 0).map((s, i) => (
          <div key={i} style={{ flex: `${s.value} 1 0`, background: s.color }} title={`${s.label}: ${s.value.toLocaleString()}`} />
        ))}
      </div>
      <div className="pdv-segbar-legend">
        {segments.map((s, i) => (
          <span key={i} className="pdv-segbar-item">
            <span className="pdv-segbar-dot" style={{ background: s.color }} />
            <span>{s.label}</span>
            <InfoTip text={s.info} />
            <span className="pdv-segbar-val">{(s.value ?? 0).toLocaleString()}</span>
            {showPct && total > 0 && <span className="pdv-segbar-pct">{Math.round(((s.value ?? 0) / total) * 100)}%</span>}
          </span>
        ))}
      </div>
    </div>
  );
}

// The page's single chart. `options` (ids) adds a pill selector above the bars;
// without it the chart only follows the figures selected elsewhere on the page.
function SeriesChart({ t, year, series, active, onChange, options }) {
  const ref = useRef(null);
  const prev = useRef(active);
  // A figure far above the chart was selected: bring the chart into view.
  useEffect(() => {
    if (prev.current === active) return;
    prev.current = active;
    const r = ref.current?.getBoundingClientRect();
    if (r && (r.top < 0 || r.bottom > window.innerHeight)) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [active]);

  const s = series[active] ?? Object.values(series)[0];
  if (!s) return null;
  const labels = monthLabels(t);
  const parts = s.parts?.filter((p) => Array.isArray(p.monthly));
  const data = labels.map((label, i) => {
    if (!parts?.length) return { label, value: s.monthly?.[i] ?? 0 };
    const slices = parts.map((p) => ({ label: p.label, color: p.color, value: p.monthly[i] ?? 0 }));
    return { label, parts: slices, value: cents(slices.reduce((a, p) => a + p.value, 0)) };
  });
  const empty = data.every((d) => !d.value);
  const opts = options?.filter((id) => series[id]);
  return (
    <div className="pdv-card pdv-chart-card" ref={ref}>
      <div className="pdv-chart-hdr">
        <div>
          <h3 className="pdv-section-title">{s.label}<InfoTip text={s.info} /></h3>
          <div className="pdv-card-sub">{t.monthlyBreakdown}{year ? ` · ${year}` : ""}</div>
        </div>
        {s.total != null && (
          <div className="pdv-chart-total">
            <span className="pdv-modal-total-lbl">{t.yearTotal}</span>
            <span className="pdv-chart-total-val">{s.total}</span>
          </div>
        )}
      </div>
      {opts?.length > 1 && (
        <div className="pdv-seg" role="group">
          {opts.map((id) => (
            <button key={id} type="button" className="pdv-seg-btn" aria-pressed={id === active} onClick={() => onChange(id)}>
              {series[id].short ?? series[id].label}
            </button>
          ))}
        </div>
      )}
      {empty
        ? <div className="pdv-chart-empty">{t.noMonthlyData}</div>
        : <BarChart color={s.color} format={s.format} data={data} />}
      {!empty && parts?.length > 0 && (
        <div className="pdv-segbar-legend">
          {parts.map((p, i) => (
            <span key={i} className="pdv-segbar-item">
              <span className="pdv-segbar-dot" style={{ background: p.color }} />
              <span>{p.label}</span>
            </span>
          ))}
        </div>
      )}
      {s.note && <p className="pdv-chart-note">{s.note}</p>}
    </div>
  );
}

// One number in a MetricTable: a toggle when it has a monthly series.
//   cell = { value, series, sub: [lines], tag, info }
// `label` (the column's name) is repeated above the number on phones, where
// each row stacks instead of lining up under the table header.
function TableCell({ cell, label, active, onSelect }) {
  if (!cell) return <td className="num" data-label={label}>—</td>;
  const pressable = cell.series && onSelect;
  return (
    <td className="num" data-label={label}>
      <span className="pdv-cell">
        <InfoTip text={cell.info} />
        {pressable
          ? <button type="button" className="pdv-cell-btn" aria-pressed={active === cell.series} onClick={() => onSelect(cell.series)}>{cell.value}</button>
          : <span className={`pdv-cell-val ${cell.muted ? "pdv-cell-val--muted" : ""}`}>{cell.value}</span>}
      </span>
      {cell.tag && <span className="pdv-cell-sub">{cell.tag}</span>}
      {cell.sub?.map((line, i) => <span key={i} className="pdv-cell-sub">{line}</span>)}
    </td>
  );
}

function TableRow({ row, columns, active, onSelect, className = "pdv-table-row" }) {
  return (
    <tr className={className}>
      <th scope="row">
        {row.color && <span className="pdv-segbar-dot pdv-table-dot" style={{ background: row.color }} />}
        {row.label}<InfoTip text={row.info} />
        {row.hint && <span className="pdv-table-hint">{row.hint}</span>}
      </th>
      {columns.map((c) => <TableCell key={c.key} cell={row.cells[c.key]} label={c.label} active={active} onSelect={onSelect} />)}
    </tr>
  );
}

// Line items as rows, measures as columns — replaces the rows of three loose
// cards where the same column label repeated on every row.
//   sections = [{ title, rows: [{ label, hint, info, cells: { [col.key]: cell } }], subtotal: row }]
function MetricTable({ caption, columns, sections, active, onSelect }) {
  return (
    <div className="pdv-table-wrap">
      <table className="pdv-table">
        <thead>
          <tr>
            <th scope="col">{caption}</th>
            {columns.map((c) => <th key={c.key} scope="col" className="num">{c.label}<InfoTip text={c.info} /></th>)}
          </tr>
        </thead>
        {sections.map((sec, i) => (
          <tbody key={i}>
            {sec.title && (
              <tr className="pdv-table-group"><th scope="colgroup" colSpan={columns.length + 1}>{sec.title}</th></tr>
            )}
            {sec.rows.map((row, j) => <TableRow key={j} row={row} columns={columns} active={active} onSelect={onSelect} />)}
            {sec.subtotal && <TableRow row={sec.subtotal} columns={columns} active={active} onSelect={onSelect} className="pdv-table-subtotal" />}
          </tbody>
        ))}
      </table>
    </div>
  );
}

// A pill that selects a series in the page's SeriesChart (plain text without one).
function SeriesChip({ label, seriesId, active, onSelect }) {
  if (!seriesId || !onSelect) return <span className="pdv-goal-meta">{label}</span>;
  return (
    <button type="button" className="pdv-chip-btn" aria-pressed={active === seriesId} onClick={() => onSelect(seriesId)}>
      <Icon.bars />{label}
    </button>
  );
}

// A running figure against its goal: what it is on the left, how far along on
// the right. `indent` nests it under the row above; `children` sits under the
// description (e.g. a SeriesChip).
function ProgressRow({ t, title, meta, info, color, done, goal, unit, indent, children }) {
  const has = goal != null && goal > 0;
  const pct = has ? Math.round((done / goal) * 100) : null;
  const met = has && done >= goal;
  return (
    <div className={`pdv-goal ${indent ? "pdv-goal--child" : ""}`}>
      <div className="pdv-goal-main">
        <div className="pdv-goal-label">
          {color && <span className="pdv-segbar-dot" style={{ background: color }} />}
          <div>
            <span className="pdv-goal-title">{title}<InfoTip text={info} /></span>
            {meta && <span className="pdv-goal-meta">{meta}</span>}
            {children}
          </div>
        </div>
        <div>
          <div className="pdv-goal-nums">
            <span>
              <span className="pdv-goal-live">{(done ?? 0).toLocaleString()}</span>
              {has && <span className="pdv-goal-of"> / {goal.toLocaleString()} {unit}</span>}
            </span>
            <span>
              {has && <span className="pdv-goal-pct">{pct.toLocaleString()}%</span>}
              {met && <span className="pdv-pill" style={{ color: C.green, background: C.greenBg }}>{t.statusMet}</span>}
              {!has && <span className="pdv-pill" style={{ color: C.text3, background: "#f1f3f4" }}>{t.noGoal}</span>}
            </span>
          </div>
          {has && (
            <div className="pdv-goal-track">
              <div className="pdv-goal-fill" style={{ background: met ? C.green : (color ?? C.blue), width: `${Math.min(pct, 100)}%` }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TabBar({ tabs, active, onChange }) {
  return (
    <div className="pdv-tabbar">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`pdv-tab ${active === tab.id ? "active" : ""}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function TabDescription({ children }) {
  if (!children) return null;
  return (
    <div className="pdv-tab-desc">
      {children}
    </div>
  );
}

function LevelBadge({ level, name, color }) {
  return (
    <div className="pdv-level-badge" style={{ background: bgOf(color) }}>
      <div className="pdv-level-badge-num" style={{ background: color }}>{level}</div>
      <span className="pdv-level-badge-text" style={{ color }}>{name}</span>
    </div>
  );
}

function SectionTitle({ children, style }) {
  return <h3 className="pdv-section-title" style={style}>{children}</h3>;
}

function Grid({ cols = 4, children, style }) {
  const cls = cols === 2 ? "pdv-grid pdv-grid-2"
    : cols === 3 ? "pdv-grid pdv-grid-3"
    : "pdv-grid pdv-grid-4";
  return <div className={cls} style={style}>{children}</div>;
}

// ─── NAV ──────────────────────────────────────────────────────

function NavSection({ label }) {
  return <div className="pdv-nav-section">{label}</div>;
}

function NavItem({ iconEl, label, sublabel, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`pdv-nav-item ${active ? "active" : ""}`}
    >
      <span className="pdv-nav-icon">{iconEl}</span>
      <div className="pdv-nav-item-text">
        <div className="pdv-nav-item-label">{label}</div>
        {sublabel && <div className="pdv-nav-item-sub">{sublabel}</div>}
      </div>
    </button>
  );
}

// One figure inside a blue summary card (the header of a tab). With `seriesId`
// it selects that series in the page's SeriesChart.
function SummaryStat({ label, value, info, seriesId, active, onSelect }) {
  const sel = selectProps(seriesId, active, onSelect);
  return (
    <div className={sel ? "pdv-summary-metric" : undefined} {...sel}>
      <div className="pdv-summary-lbl">{label}{sel && <> <Icon.bars /></>}<InfoTip text={info} /></div>
      <div className="pdv-summary-val">{typeof value === "number" ? value.toLocaleString() : value}</div>
    </div>
  );
}

// ─── PAGES ────────────────────────────────────────────────────

const ArrowIcon = () => (
  <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" width="11" height="11" aria-hidden="true">
    <path d="M2.5 6h7M6.5 3l3 3-3 3" />
  </svg>
);

// On the Overview there are two kinds of control, and they look different:
// figures with the bars icon change the chart; anything with an arrow navigates.
function LinkButton({ children, onClick }) {
  return <button type="button" className="pdv-link-btn" onClick={onClick}>{children}<ArrowIcon /></button>;
}

// One program inside a level card: its headline number, and a jump to its tab.
function NavRow({ label, value, unit, onClick }) {
  return (
    <button type="button" className="pdv-nav-row" onClick={onClick}>
      <span className="pdv-nav-row-label">{label}</span>
      <span className="pdv-nav-row-val"><strong>{(value ?? 0).toLocaleString()}</strong> {unit}</span>
      <ArrowIcon />
    </button>
  );
}

// A figure that opens its page (Evangelism tiles).
function NavStat({ label, value, onClick }) {
  return (
    <button type="button" className="pdv-nav-stat" onClick={onClick}>
      <span className="pdv-stat-label">{label} <ArrowIcon /></span>
      <span className="pdv-figure-value">{(value ?? 0).toLocaleString()}</span>
    </button>
  );
}

function OverviewPage({ t, onNavigate, data, year }) {
  const D = data ?? FALLBACK_DATA;
  const I = t.info;
  const ev = D.evangelism ?? {};
  const lifeFarmsTotal = D.lifeFarms?.total ??
    ["idealFarm", "fullSizeFarm", "basicFarm", "multiplication", "urbanFarm"]
      .reduce((a, k) => a + (D.lifeFarms?.[k]?.done ?? 0), 0);

  // Each level: who it served, what it cost, and its programs (each a link to its tab).
  const levels = [
    { lvl: "1", page: "level1", name: t.level1Name, color: C.orange, totals: D.level1, servedInfo: I.l1Served, costInfo: I.l1Cost, rows: [
      { label: t.hotMeals,  value: D.hotMeals?.plates,    unit: t.unitPlates,    tab: "hotmeals",  key: "hotMeals" },
      { label: t.groceries, value: D.groceries?.bags,     unit: t.unitKits,      tab: "groceries", key: "groceries" },
      { label: t.clothing,  value: D.clothing?.donations, unit: t.unitDonations, tab: "clothing",  key: "clothing" },
    ] },
    { lvl: "2", page: "level2", name: t.level2Name, color: C.blue, totals: D.level2, servedInfo: I.l2Served, costInfo: I.l2Cost, rows: [
      { label: t.health,    value: D.health?.totalServices, unit: t.unitServices,   tab: "health",    key: "health" },
      { label: t.education, value: D.education?.schoolKits, unit: t.unitSchoolKits, tab: "education", key: "education" },
      { label: t.shelter,   value: D.shelter?.services,     unit: t.unitItems,      tab: "shelter",   key: "shelter" },
    ] },
    { lvl: "3", page: "level3", name: t.level3Name, color: C.green, totals: D.level3, servedInfo: I.l3Served, costInfo: I.l3Cost, rows: [
      { label: t.lifeFarms,     value: lifeFarmsTotal,        unit: t.farmsUnit,   tab: "lifefarms", key: "lifeFarms" },
      { label: t.revolvingFund, value: D.meps?.total,         unit: t.unitMeps,    tab: "revolving", key: "revolvingFund" },
      { label: t.marketReady,   value: D.meps?.marketReady,   unit: t.unitMeps,    tab: "revolving", key: "marketReady" },
      { label: t.sharkTank,     value: D.sharkTank?.winners,  unit: t.unitWinners, tab: "sharktank", key: "sharkTank" },
    ] },
  ];

  // The page's chart: services delivered, people served per level, new families.
  const series = {};
  const figure = figureFactory(series, C.blue);
  figure("services", t.totalDeliveries, D.overview?.totalDeliveries ?? 0, D.overview?.deliveriesMonthly,
    { info: I.totalDeliveries, note: t.deliveriesMonthlyNote, short: t.servicesShort });
  levels.forEach((l) => {
    const name = `${t[`level${l.lvl}`]} · ${l.name}`;
    figure(`served.${l.lvl}`, `${t.individualsServed} — ${name}`, l.totals?.individualsServed, l.totals?.servedMonthly,
      { color: l.color, info: l.servedInfo, note: t.uniqueMonthlyNote, short: `${t.individualsServed} · ${t[`level${l.lvl}`]}` });
  });
  figure("newFamilies", t.newFamilies, D.overview?.newFamilies ?? 0, D.beneficiaries?.combined?.newFamiliesMonthly,
    { info: I.newFamilies, note: t.newFamiliesMonthlyNote, short: t.acceptedFamilies });
  const [sel, setSel] = useState("services");
  const pick = (id) => ({ seriesId: series[id] ? id : null, active: sel, onSelect: setSel });

  const tally = goalTally(D, yearElapsed(D));
  const trackedGoals = tally.met + tally.onTrack + tally.behind;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <div className="pdv-overview-top">
        {/* People: everyone reached this year, next to who is registered today */}
        <Card>
          <Figure label={t.totalReached} value={D.overview?.totalReached ?? "—"} color={C.green} info={I.totalReached} />
          <div className="pdv-figure-row pdv-figure-row--cols">
            <Figure size="md" label={t.totalBeneficiaries} value={D.overview?.totalBeneficiaries ?? 0} info={I.totalBeneficiaries} />
            <Figure size="md" label={t.totalAccounts} value={D.overview?.totalAccounts ?? 0} info={I.totalAccounts} />
            <Figure size="md" label={t.newFamilies} value={D.overview?.newFamilies ?? 0} info={I.newFamilies} {...pick("newFamilies")} />
          </div>
          <div className="pdv-card-foot">
            <LinkButton onClick={() => onNavigate("beneficiaries")}>{t.beneficiaries}</LinkButton>
          </div>
        </Card>

        {/* The annual plan in one line: how many goals are met, how the rest stand */}
        <Card style={{ display: "flex", flexDirection: "column" }}>
          <div className="pdv-stat-label">{t.goals2026}<InfoTip text={fill(I.goals, { n: trackedGoals })} /></div>
          <div>
            <span className="pdv-goals-big">{tally.met}<small> / {trackedGoals}</small></span>
            <div className="pdv-card-sub">{t.goalsMetLabel}</div>
          </div>
          <SegmentBar showPct={false} segments={["met", "onTrack", "behind", "untracked"].map((k) => ({
            label: t[GOAL_STATUS[k].key], value: tally[k], color: GOAL_STATUS[k].color,
          }))} />
          <div className="pdv-card-foot" style={{ marginTop: "auto", paddingTop: 16 }}>
            <LinkButton onClick={() => onNavigate("goals")}>{t.viewDetail}</LinkButton>
          </div>
        </Card>
      </div>

      <SeriesChart t={t} year={year} series={series} active={sel} onChange={setSel}
        options={["services", "served.1", "served.2", "served.3", "newFamilies"]} />

      <div>
        <SectionTitle>{t.impactByLevel}</SectionTitle>
        <Grid cols={3}>
          {levels.map((l) => (
            <Card key={l.lvl} style={{ borderLeft: `3px solid ${l.color}` }}>
              <div className="pdv-level-hdr">
                <LevelBadge level={l.lvl} name={l.name} color={l.color} />
                <LinkButton onClick={() => onNavigate(l.page)}>{t.viewDetail}</LinkButton>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: "16px 32px" }}>
                <Figure label={t.individualsServed} value={l.totals?.individualsServed ?? "—"} color={l.color} info={l.servedInfo} {...pick(`served.${l.lvl}`)} />
                <Figure size="md" label={t.totalCost} value={l.totals?.totalCost != null ? money(l.totals.totalCost) : "—"} info={l.costInfo} />
              </div>
              <div className="pdv-nav-rows">
                {l.rows.map((r) => (
                  <NavRow key={r.key} label={r.label} value={r.value} unit={r.unit} onClick={() => onNavigate(l.page, r.tab, r.key)} />
                ))}
              </div>
            </Card>
          ))}
        </Grid>
      </div>

      <div>
        <SectionTitle>{t.evangelism}</SectionTitle>
        <Card style={{ padding: 12 }}>
          <div className="pdv-nav-tiles">
            <NavStat label={t.biblesDelivered}    value={ev.bibles}             onClick={() => onNavigate("evangelism", null, "bibles")} />
            <NavStat label={t.vbsCampsShort}      value={ev.vbsCamps}           onClick={() => onNavigate("evangelism", null, "vbsCamps")} />
            <NavStat label={t.childrenVBS}        value={ev.childrenVBS}        onClick={() => onNavigate("evangelism", null, "childrenVBS")} />
            <NavStat label={t.personasAlcanzadas} value={ev.personasAlcanzadas} onClick={() => onNavigate("evangelism", null, "personasAlcanzadas")} />
          </div>
        </Card>
      </div>
    </div>
  );
}

// Level 1 has no tabs: its five programs are rows of one table, so they can be
// compared at a glance, and the chart shows whichever figure is selected.
// `initialTab` / `highlightKey` (from an Overview link) pre-select a program.
function Level1Page({ t, initialTab, data, highlightKey, year }) {
  const D = data ?? FALLBACK_DATA;
  const I = t.info;
  const hm = D.hotMeals ?? {};
  const gr = D.groceries ?? {};
  const cl = D.clothing ?? {};
  const series = {};
  const figure = figureFactory(series, C.orange);
  figure("served", t.individualsServed, D.level1?.individualsServed, D.level1?.servedMonthly, { note: t.uniqueMonthlyNote, info: I.l1Served });

  // What the program is + what its number counts, in the row's "i".
  const about = (desc, info) => `${desc}\n\n${info}`;
  // A program with nothing recorded this year: one muted cell instead of zeros.
  const seasonal = (id, label, desc, info, total, monthly) => ({
    label, info: about(desc, info),
    cells: { qty: total > 0 ? figure(`${id}.qty`, label, total, monthly, { info }) : { value: t.noRecordsShort, muted: true } },
  });
  const xmas = D.christmas ?? {};
  const rows = [
    { label: t.hotMeals, info: about(t.hotMealsTabDesc, I.hotMealsPlates), cells: {
      qty: figure("hotmeals.qty", t.hotMealsDelivered, hm.plates ?? 0, hm.monthly, { info: I.chartHotMeals }),
      ub:  figure("hotmeals.ub", `${t.hotMeals} — ${t.familiesHotMeals}`, hm.families ?? 0, hm.familiesMonthly, { note: t.uniqueFamiliesMonthlyNote }, {
        info: I.hotMealsFamilies,
        sub: hm.people ? [
          <>{fill(t.hotMealsPeopleSub, { n: hm.people.estimate })}<InfoTip text={fill(I.hotMealsPeople, { ...hm.people, avg: hm.people.avgHouseholdSize })} /></>,
        ] : null,
      }),
    } },
    { label: t.groceries, info: about(t.groceriesTabDesc, I.groceryBags), cells: {
      qty:  figure("groceries.qty", t.groceryBags, gr.bags ?? 0, gr.monthly, { info: I.chartGroceries }),
      ub:   figure("groceries.ub", `${t.groceries} — ${t.ubGrocery}`, gr.ub ?? 0, gr.ubMonthly, { note: t.uniqueFamiliesMonthlyNote }, { info: I.uniquePeople }),
      // unit cost × kits = total cost
      cost: figure("groceries.cost", `${t.groceries} — ${t.colCost}`, gr.totalCost ?? 0, gr.costMonthly, { format: "money" }, {
        info: I.groceryTotalCost,
        sub: [<>{money(gr.avgCost)} {t.perKit}<InfoTip text={I.groceryAvgCost} /></>],
      }),
    } },
    { label: t.clothing, info: about(t.clothingTabDesc, I.clothingDonations), cells: {
      qty: figure("clothing.qty", t.clothingDonations, cl.donations ?? 0, cl.monthly, { info: I.chartClothing }),
      ub:  figure("clothing.ub", `${t.clothing} — ${t.ubClothing}`, cl.ub ?? 0, cl.ubMonthly, { note: t.uniqueFamiliesMonthlyNote }, { info: I.uniquePeople }),
    } },
    seasonal("emergency", t.emergency, t.emergencyTabDesc, I.chartEmergency,
      D.emergency?.groceries ?? sumOf(D.emergency?.monthly), D.emergency?.monthly),
    seasonal("christmas", t.christmas, t.christmasTabDesc, I.chartChristmas,
      sumOf(xmas.monthly) || (xmas.hotMeals ?? 0) + (xmas.groceries ?? 0) + (xmas.toys ?? 0), xmas.monthly),
  ];

  const linked = highlightKey === "totalCost" ? "groceries.cost"
    : { hotmeals: "hotmeals.qty", groceries: "groceries.qty", clothing: "clothing.qty" }[initialTab];
  const [sel, setSel] = useState(series[linked] ? linked : "served");

  return (
    <div>
      <LevelBadge level="1" name={t.level1Name} color={C.orange} />
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div className="pdv-card pdv-summary-card">
          <div className="pdv-summary-inner">
            <SummaryStat label={t.individualsServed} value={D.level1?.individualsServed ?? "—"} info={I.l1Served} seriesId={series.served && "served"} active={sel} onSelect={setSel} />
            <SummaryStat label={t.totalCost} value={D.level1?.totalCost != null ? money(D.level1.totalCost) : "—"} info={I.l1Cost} seriesId={series["groceries.cost"] && "groceries.cost"} active={sel} onSelect={setSel} />
          </div>
        </div>

        <Card>
          <div className="pdv-chart-hdr">
            <div>
              <h3 className="pdv-section-title">{t.l1BreakdownTitle}</h3>
              <div className="pdv-card-sub">{t.selectFigureHint}</div>
            </div>
          </div>
          <MetricTable
            caption={t.colProgram}
            columns={[
              { key: "qty",  label: t.colDelivered },
              { key: "ub",   label: t.familiesHotMeals },
              { key: "cost", label: t.colCost },
            ]}
            sections={[{ rows }]}
            active={sel}
            onSelect={setSel}
          />
        </Card>

        <SeriesChart t={t} year={year} series={series} active={sel} onChange={setSel} />
      </div>
    </div>
  );
}

function Level2Page({ t, initialTab = "health", data, highlightKey, year }) {
  const [tab, setTab] = useState(initialTab);
  const D = data ?? FALLBACK_DATA;
  const I = t.info;
  // Health: true when the sync split "other assistance" into its budget lines.
  const split = Boolean(D.health?.hygiene);
  // Combined cost of every "other health assistance" line (medical + hygiene
  // kits + vitamins + diapers), with its month-by-month series when all exist.
  const h = D.health ?? {};
  const otherHealth = (() => {
    const parts = [
      [h.other?.invested, h.other?.investedMonthly],
      [h.hygiene?.cost, h.hygiene?.costMonthly],
      [h.vitamins?.cost, h.vitamins?.costMonthly],
      [h.diapers?.cost, h.diapers ? sumSeries(h.diapers.adult?.costMonthly, h.diapers.child?.costMonthly) : null],
    ];
    return {
      cost: cents(parts.reduce((a, [c]) => a + (c ?? 0), 0)),
      costMonthly: sumSeries(...parts.map(([, m]) => m)),
    };
  })();
  const clinicCost = cents((h.clinic?.paidVozManos ?? 0) + (h.clinic?.paidPDV ?? 0));
  const clinicCostMonthly = sumSeries(h.clinic?.paidVozManosMonthly, h.clinic?.paidPDVMonthly);
  const healthCost = cents(clinicCost + otherHealth.cost);

  // Health tab: every figure with a monthly series registers it here, and the
  // tab's single chart shows the selected one (`sel`).
  const [sel, setSel] = useState("total.qty");
  const healthSeries = {};
  const figure = figureFactory(healthSeries, C.blue);
  figure("total.qty",  t.totalHealthServices, h.totalServices ?? 0, h.monthly, { info: I.chartHealth });
  figure("total.ub",   t.totalHealthUB, h.totalUB ?? 0, h.ubMonthly, { note: t.uniqueMonthlyNote });
  figure("total.cost", t.healthTotalCost, healthCost, sumSeries(clinicCostMonthly, otherHealth.costMonthly), { format: "money" });
  // qty · individuals · cost for one budget line.
  const healthRow = (id, label, src, extra = {}) => ({
    label, ...extra,
    cells: {
      qty:  figure(`${id}.qty`,  label, src.qty, src.qtyMonthly),
      ub:   figure(`${id}.ub`,   `${label} — ${t.colPeople}`, src.ub, src.ubMonthly, { note: t.uniqueMonthlyNote }),
      cost: figure(`${id}.cost`, `${label} — ${t.colCost}`, src.cost, src.costMonthly, { format: "money" }),
    },
  });
  const otherRows = [
    healthRow("other", split ? t.rowOtherMedical : t.otherMedicalAidsAll,
      { qty: h.other?.aids ?? 0, qtyMonthly: h.other?.aidsMonthly, ub: h.other?.ub ?? 0, ubMonthly: h.other?.ubMonthly, cost: h.other?.invested ?? 0, costMonthly: h.other?.investedMonthly },
      { hint: split ? t.rowOtherMedicalHint : null, info: split ? I.otherAids : I.otherAidsAll }),
    h.hygiene  && healthRow("hygiene",  t.rowHygiene,  h.hygiene,  { info: I.hygieneKits }),
    h.vitamins && healthRow("vitamins", t.rowVitamins, h.vitamins, { info: I.vitamins }),
    h.diapers?.adult && healthRow("diapersAdult", t.rowDiapersAdult, h.diapers.adult, { info: I.diapersAdult }),
    h.diapers?.child && healthRow("diapersChild", t.rowDiapersChild, h.diapers.child, { info: I.diapersChild }),
  ].filter(Boolean);
  const healthSections = [
    { title: t.clinicTitle, rows: [{
      label: t.medicalAttention, info: I.clinicAppointments,
      cells: {
        qty: figure("clinic.qty", t.medicalAttention, h.clinic?.consultations ?? 0, h.clinic?.consultationsMonthly),
        ub:  figure("clinic.ub", `${t.medicalAttention} — ${t.colPeople}`, h.clinic?.ub ?? 0, h.clinic?.ubMonthly, { note: t.uniqueMonthlyNote }),
        // Who paid: both payers under the figure, and stacked in the chart.
        cost: figure("clinic.cost", t.clinicCost, clinicCost, clinicCostMonthly, {
          format: "money",
          parts: [
            { label: t.paidByVozManos, color: C.teal, monthly: h.clinic?.paidVozManosMonthly },
            { label: t.paidByPDV,      color: C.blue, monthly: h.clinic?.paidPDVMonthly },
          ],
        }, {
          sub: [`${t.paidByVozManos} ${money(h.clinic?.paidVozManos)}`, `${t.paidByPDV} ${money(h.clinic?.paidPDV)}`],
          info: `${t.paidByVozManos}: ${I.clinicVozManos}\n\n${t.paidByPDV}: ${I.clinicPDV}`,
        }),
      },
    }] },
    { title: t.otherMedicalAidsTitle, rows: otherRows,
      // The budget lines above added back together.
      subtotal: split ? {
        label: t.subtotalOtherHealth,
        cells: {
          qty: { value: ((h.other?.aids ?? 0) + (h.hygiene?.qty ?? 0) + (h.vitamins?.qty ?? 0) +
            (h.diapers?.adult?.qty ?? 0) + (h.diapers?.child?.qty ?? 0)).toLocaleString() },
          cost: figure("otherAll.cost", t.otherHealthTotalCost, otherHealth.cost, otherHealth.costMonthly, { format: "money" }, {
            info: fill(I.otherHealthTotalCost, {
              other: money(h.other?.invested), hygiene: money(h.hygiene?.cost),
              vitamins: money(h.vitamins?.cost), diapers: money(h.diapers?.cost),
            }),
          }),
        },
      } : null },
  ];
  // Education: exact totals from the sync; units × unit cost only as a fallback.
  const edu = D.education ?? {};
  const suppliesCost = edu.schoolKitTotalCost ?? (edu.schoolKits ?? 0) * (edu.schoolKitCost ?? 0);
  const backpacksCost = edu.backpackTotalCost ?? (edu.backpacks ?? 0) * (edu.backpackCost ?? 0);
  const kitsCost = cents(suppliesCost + backpacksCost);
  const [selEdu, setSelEdu] = useState("kits");
  const eduSeries = {};
  const eduFigure = figureFactory(eduSeries, C.blue);
  eduFigure("kits", t.schoolKitsFull, edu.schoolKits ?? 0, edu.kitsMonthly ?? edu.monthly, { info: I.chartEducation });
  // A school kit = supplies + backpack (+ vitamins, counted under Health).
  const eduPart = (id, label, seriesLabel, qty, monthly, unitCost, totalCost, report, info) => ({
    label, info,
    cells: {
      qty:  eduFigure(id, seriesLabel, qty ?? 0, monthly),
      unit: { value: money(unitCost), info: fill(I.unitCost, { report }) },
      cost: { value: money(totalCost), info: fill(I.totalCostUnits, { report }) },
    },
  });
  const eduSections = [{
    rows: [
      eduPart("supplies",  t.rowSupplies,  t.schoolKits, edu.schoolKits, edu.kitsMonthly,      edu.schoolKitCost, suppliesCost,  "Útiles Escolares AVG Cost", I.schoolKits),
      eduPart("backpacks", t.rowBackpacks, t.backpacks,  edu.backpacks,  edu.backpacksMonthly, edu.backpackCost,  backpacksCost, "Mochilas AVG Cost",          I.backpacks),
    ],
    subtotal: {
      label: t.rowKitTotal, info: I.schoolKitsFull,
      cells: {
        qty:  { value: (edu.schoolKits ?? 0).toLocaleString() },
        unit: { value: edu.schoolKits ? money(kitsCost / edu.schoolKits) : "—" },
        cost: { value: money(kitsCost), info: fill(I.schoolKitsFullCost, { supplies: money(suppliesCost), backpacks: money(backpacksCost), vitamins: money(h.vitamins?.cost) }) },
      },
    },
  }];

  // Living conditions: one row per category; the chart's total stacks them.
  const sh = D.shelter ?? {};
  const [selShelter, setSelShelter] = useState("total.qty");
  const shelterSeries = {};
  const shFigure = figureFactory(shelterSeries, C.blue);
  const shelterCats = [
    ["furniture",    t.shelterFurniture,    C.blue,   I.shelterFurniture],
    ["appliances",   t.shelterAppliances,   C.orange],
    ["household",    t.shelterHousehold,    C.green],
    ["electronics",  t.shelterElectronics,  C.purple],
    ["construction", t.shelterConstruction, C.red,    I.shelterConstruction],
  ].filter(([key]) => sh[key]).map(([key, label, color, info]) => ({ key, label, color, info, cat: sh[key] }));
  const shelterHasCost = shelterCats.some((c) => c.cat.cost != null);
  shFigure("total.qty", t.shelterServices, sh.services ?? 0, sh.monthly, {
    info: I.chartShelter,
    parts: shelterCats.every((c) => Array.isArray(c.cat.monthly))
      ? shelterCats.map((c) => ({ label: c.label, color: c.color, monthly: c.cat.monthly }))
      : null,
  });
  shFigure("total.ub", t.shelterUB, sh.ub ?? 0, sh.ubMonthly, { note: t.uniqueFamiliesMonthlyNote });
  shFigure("total.cost", t.shelterTotalCost, sh.cost, sh.costMonthly, { format: "money" });
  // `cost` and `deliveries` only exist when the sync computed them (not in the
  // report fallback). A $0 cost is an in-kind donation, not a purchase.
  const shelterRows = shelterCats.map(({ key, label, color, info, cat }) => ({
    label, color, info: info ?? fill(I.shelterItems, { category: label }),
    cells: {
      qty: shFigure(`${key}.qty`, label, cat.services ?? 0, cat.monthly, { color }),
      ub:  shFigure(`${key}.ub`, `${label} — ${t.shelterFamiliesServed}`, cat.ub ?? 0, cat.ubMonthly, { note: t.uniqueFamiliesMonthlyNote, color },
        { info: cat.deliveries != null ? fill(I.shelterFamilies, { deliveries: cat.deliveries, ub: cat.ub ?? 0 }) : I.uniquePeople }),
      cost: cat.cost === 0
        ? { value: t.inKind, muted: true }
        : shFigure(`${key}.cost`, `${label} — ${t.shelterCost}`, cat.cost, cat.costMonthly, { format: "money", color }),
    },
  }));
  return (
    <div>
      <LevelBadge level="2" name={t.level2Name} color={C.blue} />
      <TabBar tabs={[
        { id: "health",    label: t.health    },
        { id: "education", label: t.education },
        { id: "shelter",   label: t.shelter   },
      ]} active={tab} onChange={setTab} />

      {tab === "health" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <TabDescription>{t.healthTabDesc}</TabDescription>
          <div className={`pdv-card pdv-summary-card ${highlightKey === 'health' || highlightKey === 'totalHealthUB' ? 'pdv-highlight' : ''}`}>
            <div className="pdv-summary-inner">
              <SummaryStat label={t.totalHealthServices} value={h.totalServices ?? 0} info={I.healthServices} seriesId={healthSeries["total.qty"] && "total.qty"} active={sel} onSelect={setSel} />
              <SummaryStat label={t.totalHealthUB} value={h.totalUB ?? 0} info={I.healthUB} seriesId={healthSeries["total.ub"] && "total.ub"} active={sel} onSelect={setSel} />
              <SummaryStat label={t.healthTotalCost} value={money(healthCost)} seriesId={healthSeries["total.cost"] && "total.cost"} active={sel} onSelect={setSel}
                info={fill(t.infoHealthTotalCost, { vm: money(h.clinic?.paidVozManos), pdv: money(h.clinic?.paidPDV), other: money(otherHealth.cost) })} />
            </div>
            {/* Shown in the open (not only in the "i"): the total was being read as a wrong sum of the rows below. */}
            <p className="pdv-summary-note">{fill(t.healthUBNote, { n: h.totalUB ?? 0 })}</p>
          </div>

          {/* One row per budget line, one column per measure. Without the split
              (sync fallback) the "other" row carries everything under its old label. */}
          <Card>
            <div className="pdv-chart-hdr">
              <div>
                <h3 className="pdv-section-title">{t.healthBreakdownTitle}</h3>
                <div className="pdv-card-sub">{t.selectFigureHint}</div>
              </div>
            </div>
            <MetricTable
              caption={t.colLineItem}
              columns={[
                { key: "qty",  label: t.colServices },
                { key: "ub",   label: t.colPeople },
                { key: "cost", label: t.colCost },
              ]}
              sections={healthSections}
              active={sel}
              onSelect={setSel}
            />
          </Card>

          <SeriesChart t={t} year={year} series={healthSeries} active={sel} onChange={setSel} />
        </div>
      )}

      {tab === "education" && (
        <div className={highlightKey === 'education' ? 'pdv-highlight' : ''} style={{ display: "flex", flexDirection: "column", gap: 20, padding: highlightKey === 'education' ? 8 : 0, borderRadius: 24 }}>
          <TabDescription>{t.educationTabDesc}</TabDescription>
          <div className="pdv-card pdv-summary-card">
            <div className="pdv-summary-inner">
              <SummaryStat label={t.schoolKitsFull} value={edu.schoolKits ?? 0} info={I.schoolKitsFull} seriesId={eduSeries.kits && "kits"} active={selEdu} onSelect={setSelEdu} />
              <SummaryStat label={t.schoolKitsFullCost} value={money(kitsCost)}
                info={fill(I.schoolKitsFullCost, { supplies: money(suppliesCost), backpacks: money(backpacksCost), vitamins: money(h.vitamins?.cost) })} />
            </div>
          </div>

          {/* The kit's two costed parts as rows; the last row adds them back into one kit. */}
          <Card>
            <div className="pdv-chart-hdr">
              <h3 className="pdv-section-title">{t.kitBreakdownTitle}</h3>
            </div>
            <MetricTable
              caption={t.colComponent}
              columns={[
                { key: "qty",  label: t.colUnits },
                { key: "unit", label: t.unitCost },
                { key: "cost", label: t.totalCostLabel },
              ]}
              sections={eduSections}
              active={selEdu}
              onSelect={setSelEdu}
            />
            {h.vitamins && <p className="pdv-chart-note">{fill(t.eduVitaminsNote, { vitamins: money(h.vitamins.cost) })}</p>}
          </Card>

          <SeriesChart t={t} year={year} series={eduSeries} active={selEdu} onChange={setSelEdu} />
        </div>
      )}

      {tab === "shelter" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <TabDescription>{t.shelterTabDesc}</TabDescription>
          <div className={`pdv-card pdv-summary-card ${highlightKey === 'shelter' ? 'pdv-highlight' : ''}`}>
            <div className="pdv-summary-inner">
              <SummaryStat label={t.shelterServices} value={sh.services ?? 0} info={I.shelterServices} seriesId={shelterSeries["total.qty"] && "total.qty"} active={selShelter} onSelect={setSelShelter} />
              <SummaryStat label={t.shelterUB} value={sh.ub ?? 0} info={I.shelterUB} seriesId={shelterSeries["total.ub"] && "total.ub"} active={selShelter} onSelect={setSelShelter} />
              {sh.cost != null && (
                <SummaryStat label={t.shelterTotalCost} value={money(sh.cost)} info={I.shelterTotalCost} seriesId={shelterSeries["total.cost"] && "total.cost"} active={selShelter} onSelect={setSelShelter} />
              )}
            </div>
          </div>

          <Card>
            <div className="pdv-chart-hdr">
              <div>
                <h3 className="pdv-section-title">{t.shelterBreakdownTitle}</h3>
                <div className="pdv-card-sub">{t.selectFigureHint}</div>
              </div>
            </div>
            <MetricTable
              caption={t.colCategory}
              columns={[
                { key: "qty", label: t.shelterItemsDelivered },
                { key: "ub",  label: t.shelterFamiliesServed },
                ...(shelterHasCost ? [{ key: "cost", label: t.shelterCost, info: I.shelterCost }] : []),
              ]}
              sections={[{ rows: shelterRows }]}
              active={selShelter}
              onSelect={setSelShelter}
            />
          </Card>

          <SeriesChart t={t} year={year} series={shelterSeries} active={selShelter} onChange={setSelShelter} />
        </div>
      )}
    </div>
  );
}

function Level3Page({ t, initialTab = "lifefarms", data, highlightKey, year }) {
  const [tab, setTab] = useState(initialTab);
  const D = data ?? FALLBACK_DATA;
  const I = t.info;
  const count = (n) => (n ?? 0).toLocaleString();

  // ── Life farms: one entry per type; urban farms are a type, not a tab ──
  const lf = D.lifeFarms ?? {};
  const lfNew = lf.newThisYear ?? {};
  const farmTypes = [
    { id: "ideal",          label: t.idealFarm,          desc: t.idealFarmDesc,      color: C.yellow, src: lf.idealFarm,      monthly: lf.idealMonthly,          fresh: lfNew.ideal,          info: I.farmProgress },
    { id: "full",           label: t.fullSizeFarm,       desc: t.fullSizeFarmDesc,   color: C.blue,   src: lf.fullSizeFarm,   monthly: lf.fullMonthly,           fresh: lfNew.full,           info: I.farmProgress },
    { id: "basic",          label: t.basicFarm,          desc: t.basicFarmDesc,      color: C.orange, src: lf.basicFarm,      monthly: lf.basicMonthly,          fresh: lfNew.basic,          info: I.farmProgress },
    { id: "multiplication", label: t.multiplicationFarm, desc: t.multiplicationDesc, color: C.purple, src: lf.multiplication, monthly: lf.multiplicationMonthly, fresh: lfNew.multiplication, info: I.farmProgress },
    { id: "urban",          label: t.urbanFarms,         desc: t.urbanFarmsTabDesc,  color: C.teal,   src: lf.urbanFarm,      monthly: lf.urbanMonthly,          fresh: lfNew.urban ?? sumOf(lf.urbanMonthly), info: I.urbanCount },
  ];
  const farm = Object.fromEntries(farmTypes.map((f) => [f.id, f]));
  const lfTotal = lf.total ?? farmTypes.reduce((a, f) => a + (f.src?.done ?? 0), 0);
  const lfNewTotal = farmTypes.reduce((a, f) => a + (f.fresh ?? 0), 0);
  const championsNew = (lfNew.ideal ?? 0) + (lfNew.full ?? 0);

  // ── Every monthly series of the level; each tab's chart shows the selected one ──
  const m = D.meps ?? {};
  const fund = m.fund ?? {};
  const stackOf = (types) => (types.every((f) => Array.isArray(f.monthly))
    ? types.map((f) => ({ label: f.label, color: f.color, monthly: f.monthly }))
    : null);
  const all = {
    "farms.all": { label: t.newFarmsMonthly, short: t.allTypes, monthly: lf.monthly, total: count(lfNewTotal), info: I.chartFarms, parts: stackOf(farmTypes) },
    "farms.champions": { label: `${t.totalChampions} — ${t.newThisYear}`, monthly: sumSeries(lf.idealMonthly, lf.fullMonthly), total: count(championsNew), parts: stackOf([farm.ideal, farm.full]) },
    ...Object.fromEntries(farmTypes.map((f) => [`farms.${f.id}`, {
      label: `${f.label} — ${t.newThisYear}`, short: f.label, monthly: f.monthly, total: count(f.fresh), color: f.color,
    }])),
    "meps.activities": { label: t.mepActivitiesTitle, monthly: m.monthly, total: count(sumOf(m.monthly)), info: I.chartMepActivities },
    "meps.people":     { label: t.mepParticipants, monthly: m.participantsMonthly, total: count(m.participants), info: I.mepParticipants, note: t.uniqueMonthlyNote },
    "fund.loans":      { label: t.loansMonthlyTitle, monthly: fund.loansMonthly, total: count(sumOf(fund.loansMonthly)), info: I.chartLoans },
    "fund.disbursed":  { label: t.capitalDisbursedThisYear, monthly: fund.disbursedMonthly, total: money(fund.disbursed), format: "money" },
    "fund.repaid":     { label: t.repaidThisYear, monthly: fund.repaidMonthly, total: money(fund.repaid), format: "money" },
    "shark.new":       { label: t.sharkMonthlyTitle, monthly: D.sharkTank?.monthly, total: count(D.sharkTank?.winnersThisYear), info: I.chartShark },
  };
  const series = Object.fromEntries(
    Object.entries(all)
      .filter(([, s]) => Array.isArray(s.monthly))
      .map(([id, s]) => [id, { color: C.green, note: id.startsWith("farms.") ? t.farmsMonthlyNote : undefined, ...s }]),
  );
  const [selFarms, setSelFarms] = useState("farms.all");
  const [selMeps, setSelMeps] = useState("meps.activities");
  const pickFarm = (id) => ({ seriesId: series[id] ? id : null, active: selFarms, onSelect: setSelFarms });
  const pickMep = (id) => ({ seriesId: series[id] ? id : null, active: selMeps, onSelect: setSelMeps });

  const farmRow = (f, indent) => (
    <ProgressRow key={f.id} t={t} indent={indent} title={f.label} meta={f.desc} info={f.info} color={f.color}
      done={f.src?.done ?? 0} goal={f.src?.goal} unit={t.farmsUnit}>
      <SeriesChip label={`${t.newThisYear}: ${count(f.fresh)}`} {...pickFarm(`farms.${f.id}`)} />
    </ProgressRow>
  );

  // ── Microbusinesses by community: located ones as bars, the rest as a note ──
  const locations = (m.locations ?? []).filter((l) => l.name != null);
  const unlocated = (m.locations ?? []).find((l) => l.name == null)?.count ?? 0;
  const maxLoc = Math.max(1, ...locations.map((l) => l.count));
  const rate = fund.repaymentRate;

  return (
    <div>
      <LevelBadge level="3" name={t.level3Name} color={C.green} />
      <TabBar tabs={[
        { id: "lifefarms",  label: t.lifeFarms     },
        { id: "revolving",  label: t.revolvingFund },
        { id: "sharktank",  label: t.sharkTank     },
      ]} active={tab} onChange={setTab} />

      {tab === "lifefarms" && (
        <div className={highlightKey === 'lifeFarms' ? 'pdv-highlight' : ''} style={{ display: "flex", flexDirection: "column", gap: 20, padding: highlightKey === 'lifeFarms' ? 8 : 0, borderRadius: 24 }}>
          <TabDescription>{t.lifeFarmsTabDesc}</TabDescription>

          {/* The total and the types it is made of */}
          <Card>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: "20px 48px" }}>
              <Figure label={t.totalLifeFarms} value={lfTotal} color={C.green} info={I.lifeFarmsTotal} />
              <Figure size="md" label={t.newThisYear} value={lfNewTotal} info={I.lifeFarmsNew} {...pickFarm("farms.all")} />
            </div>
            <SegmentBar segments={farmTypes.map((f) => ({ label: f.label, value: f.src?.done ?? 0, color: f.color }))} />
          </Card>

          {/* Each type against its goal; the champions total sits above its two types */}
          <Card>
            <div className="pdv-chart-hdr">
              <div>
                <h3 className="pdv-section-title">{t.farmsByTypeTitle}</h3>
                <div className="pdv-card-sub">{t.farmsByTypeHint}</div>
              </div>
            </div>
            <div className="pdv-group-label">{t.championsLabel}</div>
            <ProgressRow t={t} title={t.totalChampions} info={I.championsProgress}
              done={lf.totalChampions?.done ?? 0} goal={lf.totalChampions?.goal} unit={t.farmsUnit}>
              <SeriesChip label={`${t.newThisYear}: ${count(championsNew)}`} {...pickFarm("farms.champions")} />
            </ProgressRow>
            {farmRow(farm.ideal, true)}
            {farmRow(farm.full, true)}
            <div className="pdv-group-label">{t.growthLabel}</div>
            {farmRow(farm.basic)}
            {farmRow(farm.multiplication)}
            <div className="pdv-group-label">{t.urbanFarms}</div>
            {farmRow({ ...farm.urban, label: t.urbanFarmsCount })}
          </Card>

          <SeriesChart t={t} year={year} series={series} active={selFarms} onChange={setSelFarms}
            options={["farms.all", ...farmTypes.map((f) => `farms.${f.id}`)]} />
        </div>
      )}

      {tab === "revolving" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <TabDescription>{t.revolvingFundTabDesc}</TabDescription>
          <Grid cols={2}>
            {/* All microbusinesses and the status each one is in */}
            <Card className={highlightKey === 'revolvingFund' || highlightKey === 'marketReady' ? 'pdv-highlight' : ''}>
              <Figure label={t.totalMEPs} value={m.total ?? 0} color={C.green} info={I.mepTotal} />
              <SegmentBar segments={[
                { label: t.active,   value: m.active   ?? 0, color: C.green,   info: I.mepActive },
                { label: t.finished, value: m.finished ?? 0, color: C.blue },
                { label: t.inactive, value: m.inactive ?? 0, color: "#bdc1c6" },
                { label: t.aborted,  value: m.aborted  ?? 0, color: C.red },
              ]} />
              <div className="pdv-figure-row">
                <Figure size="md" label={t.marketReady} value={m.marketReady ?? 0} info={I.marketReady} />
                <Figure size="md" label={t.mepParticipants} value={m.participants ?? "—"} info={I.mepParticipants} {...pickMep("meps.people")} />
              </div>
            </Card>

            {/* Revolving-fund capital — program-wide totals; the repayment rate is
                (total disbursed − outstanding) ÷ total disbursed. */}
            <Card>
              <Figure label={t.totalCapitalDisbursed} value={money(fund.totalDisbursed)} color={C.green}
                info={fill(I.capitalDisbursed, { year: String(fund.year ?? "—"), amount: money(fund.disbursed).slice(1) })} />
              <div className="pdv-rate">
                <div className="pdv-goal-track">
                  <div className="pdv-goal-fill" style={{ background: C.green, width: `${Math.min(rate ?? 0, 100)}%` }} />
                </div>
                <div className="pdv-rate-caps">
                  <span><strong>{rate != null ? `${rate}%` : "—"}</strong> {t.programRepaymentRate}<InfoTip text={I.repaymentRate} /></span>
                  <span><strong>{money(fund.outstanding)}</strong> {t.outstandingBalance}<InfoTip text={I.outstanding} /></span>
                </div>
              </div>
              <div className="pdv-figure-row">
                <Figure size="md" label={t.totalRepaidLabel} value={money(fund.totalRepaid)}
                  info={fill(I.capitalRepaid, { year: String(fund.year ?? "—"), amount: money(fund.repaid).slice(1) })} />
                <Figure size="md" label={t.capitalDisbursedThisYear} value={money(fund.disbursed)} {...pickMep("fund.disbursed")} />
                <Figure size="md" label={t.repaidThisYear} value={money(fund.repaid)} {...pickMep("fund.repaid")} />
              </div>
            </Card>
          </Grid>

          <SeriesChart t={t} year={year} series={series} active={selMeps} onChange={setSelMeps}
            options={["meps.activities", "meps.people", "fund.loans", "fund.disbursed", "fund.repaid"]} />

          <Card>
            <SectionTitle>{t.byLocation}<InfoTip text={I.mepLocations} /></SectionTitle>
            <div className="pdv-loc-list">
              {locations.map((loc, i) => {
                const others = loc.name === "__OTHERS__";
                return (
                  <div key={i} className="pdv-loc-item">
                    <div className="pdv-loc-row">
                      <div className="pdv-loc-name">{others ? t.otherCommunities : loc.name}</div>
                      <span className="pdv-loc-val">{loc.count}</span>
                    </div>
                    <div className="pdv-loc-track">
                      <div className="pdv-loc-fill" style={{ background: others ? "#bdc1c6" : C.green, width: `${(loc.count / maxLoc) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
            {unlocated > 0 && (
              <p className="pdv-chart-note">{fill(t.locationNote, { n: unlocated, total: m.total ?? 0 })}</p>
            )}
          </Card>
        </div>
      )}

      {tab === "sharktank" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <TabDescription>{t.sharkTankTabDesc}</TabDescription>
          <Card>
            <Figure label={t.sharkTankWinners} value={D.sharkTank?.winners ?? 0} color={C.green} info={I.sharkWinners} />
            <div className="pdv-figure-row">
              <Figure size="md" label={t.sharkNewThisYear} value={D.sharkTank?.winnersThisYear ?? 0} info={I.sharkNew} />
              <Figure size="md" label={t.sharkTankPdvCost} value={money(D.sharkTank?.pdvCost)} info={I.sharkCost} />
            </div>
          </Card>
          <SeriesChart t={t} year={year} series={series} active="shark.new" onChange={() => {}} />
        </div>
      )}
    </div>
  );
}

function EvangelismPage({ t, data, highlightKey, year }) {
  const D = data ?? FALLBACK_DATA;
  const I = t.info;
  const ev = D.evangelism ?? {};
  const bt = ev.biblesByType; // adult (Spanish) / Quichua / children
  // One colour per bible type, shared by the composition bar and the stacked chart.
  const bibleTypes = bt ? [
    { label: t.biblesAdult,    color: C.purple, value: bt.adult?.qty    ?? 0, monthly: bt.adult?.monthly,    info: I.biblesAdult },
    { label: t.biblesChildren, color: C.orange, value: bt.children?.qty ?? 0, monthly: bt.children?.monthly, info: I.biblesChildren },
    { label: t.biblesQuichua,  color: C.teal,   value: bt.quichua?.qty  ?? 0, monthly: bt.quichua?.monthly,  info: I.biblesQuichua },
  ] : null;

  // Every monthly series of the page; the single chart shows the selected one.
  const count = (n) => (n ?? 0).toLocaleString();
  const all = {
    bibles:   { label: t.biblesDelivered,    monthly: ev.biblesMonthly ?? ev.monthly, total: count(ev.bibles), info: I.chartBibles, parts: bibleTypes },
    vbs:      { label: t.childrenVBS,        monthly: ev.vbsMonthly,      total: count(ev.childrenVBS), info: I.chartVbs },
    vbsCamps: { label: t.vbsCampsShort,      monthly: ev.vbsCampsMonthly, total: count(ev.vbsCamps),    info: I.vbsCamps },
    personas: { label: t.personasAlcanzadas, monthly: ev.personasMonthly, total: count(ev.personasAlcanzadas), info: I.personasAlcanzadas, note: t.personasMonthlyNote },
    pof:      { label: t.professionsOfFaith, monthly: ev.pofMonthly,      total: count(ev.professionsOfFaith), info: I.chartPof },
  };
  const series = Object.fromEntries(
    Object.entries(all)
      .filter(([, s]) => Array.isArray(s.monthly))
      .map(([id, s]) => [id, { color: C.purple, ...s }]),
  );
  // Arriving from an Overview card selects that card's series.
  const fromOverview = { bibles: "bibles", vbsCamps: "vbsCamps", childrenVBS: "vbs", personasAlcanzadas: "personas" }[highlightKey];
  const [sel, setSel] = useState(fromOverview ?? "bibles");
  const pick = (id) => ({ seriesId: series[id] ? id : null, active: sel, onSelect: setSel });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <TabDescription>{t.evangelismDesc}</TabDescription>

      <Grid cols={2}>
        {/* Bibles: the total and the types it is made of */}
        <Card>
          <Figure label={t.biblesDelivered} value={ev.bibles ?? 0} color={C.purple} info={I.bibles} {...pick("bibles")} />
          {bibleTypes && <SegmentBar segments={bibleTypes} />}
        </Card>

        {/* VBS: attendances, the camps they happened in, the children behind them */}
        <Card>
          <Figure label={t.childrenVBS} value={ev.childrenVBS ?? 0} color={C.purple} info={I.vbsAttendances} {...pick("vbs")} />
          <div className="pdv-figure-row">
            <Figure size="md" label={t.vbsCampsShort}  value={ev.vbsCamps ?? 0}    info={I.vbsCamps} {...pick("vbsCamps")} />
            <Figure size="md" label={t.vbsUniqueShort} value={ev.vbsUnique ?? "—"} info={I.vbsUnique} />
          </div>
        </Card>
      </Grid>

      <Grid cols={2}>
        <Card>
          <Figure label={t.personasAlcanzadas} value={ev.personasAlcanzadas ?? 0} color={C.purple} info={I.personasAlcanzadas} {...pick("personas")} />
        </Card>
        <Card style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: "20px 48px" }}>
          <Figure label={`${t.professionsOfFaith} (${t.thisYear.toLowerCase()})`} value={ev.professionsOfFaith ?? "—"} color={C.purple} info={I.pofYear} {...pick("pof")} />
          <Figure size="md" label={t.allTime} value={ev.professionsOfFaithAllTime ?? "—"} info={I.pofAllTime} />
        </Card>
      </Grid>

      <SeriesChart t={t} year={year} series={series} active={sel} onChange={setSel}
        options={["bibles", "vbs", "vbsCamps", "personas", "pof"]} />
    </div>
  );
}

// The three regions side by side (no tabs), so they can be compared without
// switching views; the two "new this year" rows feed the chart.
function BeneficiariesPage({ t, data, highlightKey, year }) {
  const D = data ?? FALLBACK_DATA;
  const I = t.info;
  const bene = D.beneficiaries ?? FALLBACK_DATA.beneficiaries;
  const regions = [["quito", t.quito], ["imbabura", t.imbabura], ["combined", t.combined]];
  const series = {};
  const figure = figureFactory(series, C.blue);
  const row = (key, label, info, monthlyKey) => ({
    label, info,
    cells: Object.fromEntries(regions.map(([id, name]) => [id,
      figure(`${id}.${key}`, `${label} — ${name}`, bene[id]?.[key] ?? 0, monthlyKey ? bene[id]?.[monthlyKey] : null,
        monthlyKey ? { note: t.newFamiliesMonthlyNote } : {}),
    ])),
  });
  const sections = [
    { title: t.benActiveSection, rows: [
      row("accounts",      t.activeAccounts,      I.activeAccounts),
      row("beneficiaries", t.activeBeneficiaries, I.activeBeneficiaries),
      row("girls",         t.activeGirls,         I.activeChildren),
      row("boys",          t.activeBoys,          I.activeChildren),
    ] },
    { title: t.newThisYear, rows: [
      row("newFamilies", t.acceptedFamilies, I.newFamiliesYear, "newFamiliesMonthly"),
      row("newUB",       t.acceptedUB,       I.newIndividuals,  "newUBMonthly"),
    ] },
  ];
  const [sel, setSel] = useState("combined.newFamilies");
  const all = bene.combined ?? {};
  const others = Math.max(0, (all.beneficiaries ?? 0) - (all.girls ?? 0) - (all.boys ?? 0));
  const arrived = ["totalAccounts", "totalBeneficiaries"].includes(highlightKey);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Everyone we serve today, and how many of them are children */}
      <Card className={arrived ? "pdv-highlight" : ""}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: "20px 48px" }}>
          <Figure label={t.activeBeneficiaries} value={all.beneficiaries ?? 0} color={C.blue} info={I.activeBeneficiaries} />
          <Figure size="md" label={t.activeAccounts} value={all.accounts ?? 0} info={I.activeAccounts} />
        </div>
        <SegmentBar segments={[
          { label: t.activeGirls, value: all.girls ?? 0, color: C.pink, info: I.activeChildren },
          { label: t.activeBoys,  value: all.boys  ?? 0, color: C.teal, info: I.activeChildren },
          { label: t.otherBeneficiaries, value: others, color: "#bdc1c6" },
        ]} />
      </Card>

      <Card>
        <div className="pdv-chart-hdr">
          <div>
            <h3 className="pdv-section-title">{t.benByRegion}</h3>
            <div className="pdv-card-sub">{t.selectFigureHint}</div>
          </div>
        </div>
        <MetricTable
          caption={t.colMeasure}
          columns={regions.map(([id, name]) => ({ key: id, label: name, info: id === "combined" ? t.combinedInfo : null }))}
          sections={sections}
          active={sel}
          onSelect={setSel}
        />
      </Card>

      <SeriesChart t={t} year={year} series={series} active={sel} onChange={setSel} />
    </div>
  );
}

// ─── 2026 GOALS (Plan de Ayudas y Servicios a Beneficiarios) ──
// UI-level catalog: these targets come from PDV's annual planning and are NOT
// stored in Salesforce. Where a goal maps cleanly onto a metric the dashboard
// already syncs, `live(D)` returns the running value and the card shows a
// progress bar against the annual goal; the rest render as target cards.
const GOALS_2026 = [
  {
    id: "hambre",
    color: C.orange,
    title: { en: "Hunger Relief", es: "Alivio del Hambre" },
    items: [
      {
        title: { en: "Meals at the PDV facilities", es: "Comidas en las instalaciones de PDV" },
        detail: {
          en: "Three Sundays a month, 100 people per Sunday — Quito only. $4 per meal covers all operating costs except in-kind donations.",
          es: "Tres domingos al mes, 100 personas por domingo — exclusivo Quito. $4 por comida cubre los costos operativos menos donaciones en especie.",
        },
        chips: [
          { en: "300 meals / month", es: "300 comidas / mes" },
          { en: "3,600 meals / year", es: "3.600 comidas / año" },
          { en: "$4 each", es: "$4 c/u" },
        ],
        bu: { en: "332 families · 1,094 people", es: "332 familias · 1.094 personas" },
        where: { en: "Quito", es: "Quito" },
        goal: 3600,
        unit: { en: "meals", es: "comidas" },
        nav: { page: "level1", tab: "hotmeals" },
        live: (D) => D.hotMeals?.plates,
      },
      {
        title: { en: "Grocery kits", es: "Kits de víveres" },
        detail: {
          en: "Staple-grocery kits for vulnerable families in Quito and Otavalo.",
          es: "Kits de víveres básicos para familias vulnerables en Quito y Otavalo.",
        },
        chips: [
          { en: "100 kits / month", es: "100 kits / mes" },
          { en: "1,200 kits / year", es: "1.200 kits / año" },
        ],
        bu: { en: "600 families", es: "600 familias" },
        where: { en: "Quito & Otavalo", es: "Quito y Otavalo" },
        goal: 1200,
        unit: { en: "kits", es: "kits" },
        nav: { page: "level1", tab: "groceries" },
        live: (D) => D.groceries?.bags,
      },
      {
        title: { en: "Used clothing + snack (mercy donations)", es: "Ropa usada + snack (donaciones de misericordia)" },
        detail: {
          en: "In-kind used clothing plus a snack, handed out every Tuesday to people who come seeking help. $1 each.",
          es: "Ropa usada en especie más un snack, entregados todos los martes a las personas que vienen en busca de ayuda. $1 cada una.",
        },
        chips: [
          { en: "50 donations / month", es: "50 donaciones / mes" },
          { en: "600 donations / year", es: "600 donaciones / año" },
          { en: "$1 each", es: "$1 c/u" },
        ],
        bu: { en: "600 people", es: "600 personas" },
        where: { en: "Quito", es: "Quito" },
        goal: 600,
        unit: { en: "donations", es: "donaciones" },
        nav: { page: "level1", tab: "clothing" },
        live: (D) => D.clothing?.donations,
      },
      {
        title: { en: "Hygiene kits", es: "Kits de higiene" },
        detail: {
          en: "60 hygiene kits for children aged 0–12.",
          es: "60 kits de higiene para niños de 0 a 12 años.",
        },
        chips: [
          { en: "60 kits / year", es: "60 kits / año" },
          { en: "$10 each", es: "$10 c/u" },
        ],
        bu: { en: "60 children", es: "60 niños" },
        where: { en: "Quito", es: "Quito" },
        goal: 60,
        unit: { en: "kits", es: "kits" },
        nav: { page: "level2", tab: "health" },
        live: (D) => D.health?.hygiene?.qty,
      },
      {
        title: { en: "Children's diapers", es: "Pañales para niños" },
        detail: {
          en: "12 packs of 48 units per year.",
          es: "12 paquetes de 48 unidades al año.",
        },
        chips: [
          { en: "12 packs / year", es: "12 paquetes / año" },
          { en: "$10 each", es: "$10 c/u" },
        ],
        bu: { en: "12 children", es: "12 niños" },
        where: { en: "Quito", es: "Quito" },
        goal: 12,
        unit: { en: "packs", es: "paquetes" },
        nav: { page: "level2", tab: "health" },
        live: (D) => D.health?.diapers?.child?.qty,
      },
      {
        title: { en: "Adult diapers", es: "Pañales para adultos" },
        detail: {
          en: "12 packs of 20 units per year.",
          es: "12 paquetes de 20 unidades al año.",
        },
        chips: [
          { en: "12 packs / year", es: "12 paquetes / año" },
          { en: "$16 each", es: "$16 c/u" },
        ],
        bu: { en: "12 adults", es: "12 adultos" },
        where: { en: "Quito", es: "Quito" },
        goal: 12,
        unit: { en: "packs", es: "paquetes" },
        nav: { page: "level2", tab: "health" },
        live: (D) => D.health?.diapers?.adult?.qty,
      },
      {
        title: { en: "Bible distribution", es: "Distribución de Biblias" },
        detail: {
          en: "60 Quichua Bibles ($17 each, Otavalo) and 180 Spanish Bibles ($4 each, Quito & Otavalo).",
          es: "60 Biblias en quichua ($17 c/u, Otavalo) y 180 Biblias en español ($4 c/u, Quito y Otavalo).",
        },
        chips: [
          { en: "240 Bibles / year", es: "240 Biblias / año" },
        ],
        bu: { en: "240 people", es: "240 personas" },
        where: { en: "Quito & Otavalo", es: "Quito y Otavalo" },
        goal: 240,
        unit: { en: "Bibles", es: "Biblias" },
        nav: { page: "evangelism" },
        live: (D) => D.evangelism?.bibles,
      },
      {
        title: { en: "Families in extreme need", es: "Familias en situación de extrema necesidad" },
        detail: {
          en: "Help for 10 families: mattresses, beds, blankets, pillows, refrigerator, stove, gas cylinder, among others.",
          es: "Ayuda a 10 familias: colchones, camas, mantas, almohadas, refrigerador, estufa, cilindro de gas, entre otros.",
        },
        chips: [
          { en: "10 families / year", es: "10 familias / año" },
        ],
        bu: { en: "10 families", es: "10 familias" },
        where: { en: "Quito & Otavalo", es: "Quito y Otavalo" },
        goal: 10, // no matching metric in the sync yet — shown as "not tracked"
        unit: { en: "families", es: "familias" },
        nav: { page: "level2", tab: "shelter" },
      },
    ],
  },
  {
    id: "educacion",
    color: C.blue,
    title: { en: "Education", es: "Educación" },
    items: [
      {
        title: { en: "School kits", es: "Kits escolares" },
        detail: {
          en: "Backpack, school supplies and vitamins for 300 children aged 6–12, including delivery in the Quito and Otavalo areas (plus transport). $25 per child.",
          es: "Mochila, útiles escolares y vitaminas para 300 niños de 6 a 12 años, incluida la entrega en Quito y Otavalo (más transporte). $25 por niño.",
        },
        chips: [
          { en: "300 kits / year", es: "300 kits / año" },
          { en: "$25 per child", es: "$25 por niño" },
        ],
        bu: { en: "300 children & teens (6–18)", es: "300 niños y adolescentes (6–18)" },
        where: { en: "Quito & Otavalo", es: "Quito y Otavalo" },
        goal: 300,
        unit: { en: "kits", es: "kits" },
        nav: { page: "level2", tab: "education" },
        live: (D) => D.education?.schoolKits,
      },
      {
        title: { en: "Sunday school / VBS programs", es: "Escuelas dominicales / programas EBV" },
        detail: {
          en: "Materials for 32 Sunday-school / VBS programs run by mission teams, $100 per program. Average attendance: 25 children (some repeat programs).",
          es: "Materiales para 32 escuelas dominicales / programas EBV (equipos misioneros), $100 por programa. Asistencia promedio: 25 niños (algunos repiten programas).",
        },
        chips: [
          { en: "32 programs / year", es: "32 programas / año" },
          { en: "$100 per program", es: "$100 por programa" },
        ],
        bu: { en: "300 children & teens (6–18)", es: "300 niños y adolescentes (6–18)" },
        where: { en: "Quito & Otavalo", es: "Quito y Otavalo" },
        goal: 32,
        unit: { en: "programs", es: "programas" },
        nav: { page: "evangelism" },
        live: (D) => D.education?.vbsCamps,
      },
    ],
  },
  {
    id: "salud",
    color: C.teal,
    title: { en: "Health", es: "Salud" },
    items: [
      {
        title: { en: "Medical care at Clínica la Y", es: "Atención médica en Clínica la Y" },
        detail: {
          en: "Basic-diagnosis medical care under the HCJB agreement ($40,000); PDV covers special cases that cannot afford the copay.",
          es: "Atención médica de diagnóstico básico bajo el convenio con HCJB ($40.000); PDV cubre los casos especiales que no pueden pagar el copago.",
        },
        chips: [
          { en: "20 people / week", es: "20 personas / semana" },
          { en: "1,600 appointments / year", es: "1.600 citas / año" },
        ],
        bu: { en: "650 people attended", es: "650 personas atendidas" },
        where: { en: "Quito", es: "Quito" },
        goal: 1600,
        unit: { en: "appointments", es: "citas" },
        nav: { page: "level2", tab: "health" },
        live: (D) => D.health?.clinic?.consultations,
      },
      {
        title: { en: "Specific medical interventions & procedures", es: "Intervenciones y procedimientos médicos específicos" },
        detail: {
          en: "Medicine, medical exams and tests, and other medical services including dental care and equipment.",
          es: "Medicinas, exámenes y pruebas médicas, y otros servicios médicos incluidos los dentales y equipos.",
        },
        chips: [
          { en: "24 deliveries / year", es: "24 entregas / año" },
        ],
        bu: { en: "24 people", es: "24 personas" },
        where: { en: "Quito", es: "Quito" },
        goal: 24,
        unit: { en: "deliveries", es: "entregas" },
        nav: { page: "level2", tab: "health" },
        live: (D) => D.health?.other?.aids,
      },
    ],
  },
  {
    id: "condvida",
    color: C.purple,
    title: { en: "Living Conditions Improvement", es: "Mejoramiento de Condiciones de Vida" },
    items: [
      {
        title: { en: "Home-improvement projects", es: "Proyectos de mejora del hogar" },
        detail: {
          en: "Living-conditions or home-improvement projects — 8 projects at $500 each.",
          es: "Proyectos de mejora de las condiciones de vida o del hogar — 8 proyectos a $500 cada uno.",
        },
        chips: [
          { en: "8 projects / year", es: "8 proyectos / año" },
          { en: "$500 each", es: "$500 c/u" },
        ],
        bu: { en: "8 people", es: "8 personas" },
        where: { en: "Quito & Otavalo", es: "Quito y Otavalo" },
        goal: 8,
        unit: { en: "projects", es: "proyectos" },
        nav: { page: "level2", tab: "shelter" },
        live: (D) => D.shelter?.construction?.services, // Hit Squads + construction materials
      },
    ],
  },
];

// Share of the plan year already gone (0–1), as of the last sync.
const PLAN_YEAR = 2026;
function yearElapsed(D) {
  const now = D.lastUpdated ? new Date(D.lastUpdated) : new Date();
  const start = Date.UTC(PLAN_YEAR, 0, 1);
  const end = Date.UTC(PLAN_YEAR + 1, 0, 1);
  return Math.max(0, Math.min(1, (now - start) / (end - start)));
}

// met: goal reached · onTrack: at or ahead of an even pace through the year ·
// behind: below that pace · untracked: no live metric for this goal yet.
function goalProgress(g, D, pace) {
  const live = g.live ? g.live(D) : null;
  if (g.goal == null || typeof live !== "number") return { status: "untracked" };
  const ratio = live / g.goal;
  return { live, ratio, pct: Math.round(ratio * 100), status: ratio >= 1 ? "met" : ratio >= pace ? "onTrack" : "behind" };
}

// How many goals are in each status.
function goalTally(D, pace) {
  const tally = { met: 0, onTrack: 0, behind: 0, untracked: 0 };
  GOALS_2026.flatMap((s) => s.items).forEach((g) => { tally[goalProgress(g, D, pace).status] += 1; });
  return tally;
}

const GOAL_STATUS = {
  met:       { key: "statusMet",       color: C.green,  text: C.green,  bg: C.greenBg },
  onTrack:   { key: "statusOnTrack",   color: C.blue,   text: C.blue,   bg: C.blueBg },
  behind:    { key: "statusBehind",    color: C.yellow, text: "#a45f00", bg: C.yellowBg },
  untracked: { key: "statusUntracked", color: "#bdc1c6", text: C.text3, bg: "#f1f3f4" },
};

// One goal = one row: what it is on the left, how far along on the right. The
// description and its figures stay folded until the row is opened.
function GoalRow({ g, color, t, L, data, pace, onNavigate }) {
  const [open, setOpen] = useState(false);
  const p = goalProgress(g, data, pace);
  const st = GOAL_STATUS[p.status];
  const tracked = p.status !== "untracked";
  return (
    <div className="pdv-goal">
      <div className="pdv-goal-main">
        <button type="button" className="pdv-goal-head" aria-expanded={open} onClick={() => setOpen(!open)}>
          <svg className="pdv-goal-chev" viewBox="0 0 12 12" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4.5 2.5L8 6l-3.5 3.5" />
          </svg>
          <span>
            <span className="pdv-goal-title">{g.title[L]}</span>
            <span className="pdv-goal-meta">{g.where[L]} · {g.bu[L]}</span>
          </span>
        </button>
        <div>
          <div className="pdv-goal-nums">
            <span>
              <span className="pdv-goal-live">{tracked ? p.live.toLocaleString() : "—"}</span>
              <span className="pdv-goal-of"> / {g.goal.toLocaleString()} {g.unit[L]}</span>
            </span>
            <span>
              {tracked && <span className="pdv-goal-pct">{p.pct.toLocaleString()}%</span>}
              <span className="pdv-pill" style={{ color: st.text, background: st.bg }}>{t[st.key]}</span>
            </span>
          </div>
          <div className="pdv-goal-track">
            <div className="pdv-goal-fill" style={{ background: st.color, width: tracked ? `${Math.min(p.pct, 100)}%` : 0 }} />
            {tracked && p.status !== "met" && <div className="pdv-goal-tick" style={{ left: `${pace * 100}%` }} />}
          </div>
        </div>
      </div>
      {open && (
        <div className="pdv-goal-detail">
          <p>{g.detail[L]}</p>
          <div className="pdv-goal-chips">
            {g.chips.map((c, i) => (
              <span key={i} className="pdv-pill" style={{ color, background: bgOf(color) }}>{c[L]}</span>
            ))}
            {g.nav && (
              <button type="button" className="pdv-link-btn" onClick={() => onNavigate(g.nav.page, g.nav.tab)}>
                {t.viewProgram}
                <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" width="11" height="11">
                  <path d="M2.5 6h7M6.5 3l3 3-3 3" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function GoalsPage({ t, lang, data, onNavigate }) {
  const D = data ?? FALLBACK_DATA;
  const L = lang === "es" ? "es" : "en";
  const pace = yearElapsed(D);
  const tally = goalTally(D, pace);
  const trackedCount = tally.met + tally.onTrack + tally.behind;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      {/* The answer first: how many goals are met, and how the rest are doing. */}
      <Card>
        <div className="pdv-stat-label">{t.goals2026Sub}<InfoTip text={fill(t.info.goals, { n: trackedCount })} /></div>
        <div className="pdv-goals-summary">
          <div>
            <span className="pdv-goals-big">{tally.met}<small> / {trackedCount}</small></span>
            <div className="pdv-card-sub">{t.goalsMetLabel}</div>
          </div>
          <SegmentBar showPct={false} segments={["met", "onTrack", "behind", "untracked"].map((k) => ({
            label: t[GOAL_STATUS[k].key], value: tally[k], color: GOAL_STATUS[k].color,
          }))} />
        </div>
        <p className="pdv-chart-note">{fill(t.paceNote, { pct: Math.round(pace * 100) })}</p>
      </Card>

      {GOALS_2026.map((sec) => {
        const met = sec.items.filter((g) => goalProgress(g, D, pace).status === "met").length;
        return (
          <Card key={sec.id}>
            <div className="pdv-goals-section-hdr">
              <SectionTitle style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 9, height: 9, borderRadius: "50%", background: sec.color, display: "inline-block" }} />
                {sec.title[L]}
              </SectionTitle>
              <span className="pdv-card-sub">{fill(t.sectionMet, { met, n: sec.items.length })}</span>
            </div>
            {sec.items.map((g, i) => (
              <GoalRow key={i} g={g} color={sec.color} t={t} L={L} data={D} pace={pace} onNavigate={onNavigate} />
            ))}
          </Card>
        );
      })}
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────

export default function Dashboard() {
  const [lang, setLang] = useState("en");
  const [page, setPage] = useState("overview");
  const [navTab, setNavTab] = useState(null);
  const [highlightKey, setHighlightKey] = useState(null);
  const [mobileNav, setMobileNav] = useState(false);
  const [dashData, setDashData] = useState(FALLBACK_DATA);
  const [lastUpdated, setLastUpdated] = useState(null);
  const t = i18n[lang];

  // Fetch live data from /data/dashboard.json (written by the sync script)
  useEffect(() => {
    fetch("/data/dashboard.json")
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(json => {
        // Shallow merge, dropping null sections so a failed extract in the sync
        // (e.g. an unreachable report) can't clobber the FALLBACK_DATA values.
        const clean = Object.fromEntries(
          Object.entries(json).filter(([, v]) => v != null),
        );
        setDashData(prev => ({ ...prev, ...clean }));
        if (json.lastUpdated) setLastUpdated(new Date(json.lastUpdated));
      })
      .catch(() => { /* network or file error — silently keep fallback */ });
  }, []);

  const titles = {
    overview:      t.overview,
    level1:        `${t.level1} · ${t.level1Name}`,
    level2:        `${t.level2} · ${t.level2Name}`,
    level3:        `${t.level3} · ${t.level3Name}`,
    evangelism:    t.evangelism,
    beneficiaries: t.beneficiaries,
    goals:         t.goals2026,
  };

  // navigate(page, tab?, highlightKey?) — used from Overview clickable cards
  const navigate = useCallback((p, tab = null, hKey = null) => {
    setNavTab(tab);
    setPage(p);
    setMobileNav(false);
    setHighlightKey(hKey);
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (hKey) {
      setTimeout(() => setHighlightKey(null), 2500);
    }
  }, []);

  const go = useCallback((p) => { navigate(p); }, [navigate]);

  const year = lastUpdated?.getFullYear();

  return (
    <>
      {/* Mobile header */}
      <div className="pdv-mobile-hdr">
        <button
          className="pdv-mobile-menu-btn"
          onClick={() => setMobileNav(!mobileNav)}
          aria-label="Toggle navigation"
        >
          <Icon.menu />
        </button>
        <span style={{ fontSize: 14, fontWeight: 600, color: C.text1, letterSpacing: "-0.01em" }}>
          Pan de Vida
        </span>
      </div>

      {mobileNav && (
        <div className="pdv-overlay" onClick={() => setMobileNav(false)} />
      )}

      <div className="pdv-app">

        {/* ── SIDEBAR ── */}
        <aside className={`pdv-sidebar ${mobileNav ? "open" : ""}`}>
          <div className="pdv-sidebar-logo">
            <img
              src="/logo.png"
              alt="Pan de Vida"
              style={{ width: 44, height: 44, borderRadius: 10, flexShrink: 0, objectFit: "contain" }}
            />
            <div>
              <div className="pdv-sidebar-name">Pan de Vida</div>
              <div className="pdv-sidebar-subtitle">Dashboard 2026</div>
            </div>
          </div>

          <nav className="pdv-nav">
            <NavItem
              iconEl={<Icon.overview />}
              label={t.overview}
              active={page === "overview"}
              onClick={() => go("overview")}
            />

            <NavSection label={t.level1Desc} />
            <NavItem
              iconEl={<Icon.relief />}
              label={`${t.level1} · ${t.level1Name}`}
              active={page === "level1"}
              onClick={() => go("level1")}
            />

            <NavSection label={t.level2Desc} />
            <NavItem
              iconEl={<Icon.restoration />}
              label={`${t.level2} · ${t.level2Name}`}
              active={page === "level2"}
              onClick={() => go("level2")}
            />

            <NavSection label={t.level3Desc} />
            <NavItem
              iconEl={<Icon.development />}
              label={`${t.level3} · ${t.level3Name}`}
              active={page === "level3"}
              onClick={() => go("level3")}
            />

            <div className="pdv-nav-divider" />

            <NavItem
              iconEl={<Icon.evangelism />}
              label={t.evangelism}
              sublabel={t.evangelismDesc}
              active={page === "evangelism"}
              onClick={() => go("evangelism")}
            />
            <NavItem
              iconEl={<Icon.beneficiaries />}
              label={t.beneficiaries}
              active={page === "beneficiaries"}
              onClick={() => go("beneficiaries")}
            />
            <NavItem
              iconEl={<Icon.target />}
              label={t.goals2026}
              active={page === "goals"}
              onClick={() => go("goals")}
            />
          </nav>

          {/* Language toggle */}
          <div className="pdv-lang-toggle">
            <div className="pdv-lang-inner">
              {["en", "es"].map(l => (
                <button
                  key={l}
                  className={`pdv-lang-btn ${lang === l ? "active" : ""}`}
                  onClick={() => setLang(l)}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <main className="pdv-main">
          <div className="pdv-page-header">
            <div>
              <h1 className="pdv-page-title">{titles[page]}</h1>
              <p className="pdv-page-date">
                {t.lastUpdated}: {lastUpdated
                  ? lastUpdated.toLocaleDateString(lang === "es" ? "es-EC" : "en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })
                  : "—"}
              </p>
            </div>
            <div className="pdv-status-chip">
              <span className="pdv-status-dot" />
              {t.dataSynced}
            </div>
          </div>

          {page === "overview"      && <OverviewPage      t={t} onNavigate={navigate} data={dashData} year={year} />}
          {page === "level1"        && <Level1Page        t={t} key={navTab} initialTab={navTab}                 data={dashData} highlightKey={highlightKey} year={year} />}
          {page === "level2"        && <Level2Page        t={t} key={navTab} initialTab={navTab || "health"}     data={dashData} highlightKey={highlightKey} year={year} />}
          {page === "level3"        && <Level3Page        t={t} key={navTab} initialTab={navTab || "lifefarms"}  data={dashData} highlightKey={highlightKey} year={year} />}
          {page === "evangelism"    && <EvangelismPage    t={t} data={dashData} highlightKey={highlightKey} year={year} />}
          {page === "beneficiaries" && <BeneficiariesPage t={t} data={dashData} highlightKey={highlightKey} year={year} />}
          {page === "goals"         && <GoalsPage         t={t} lang={lang} data={dashData} onNavigate={navigate} />}
        </main>
      </div>

    </>
  );
}
