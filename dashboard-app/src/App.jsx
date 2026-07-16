import { useState, useEffect, useCallback } from "react";

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
    fund: { year: 2026, disbursed: 278.99, repaid: 206.89, outstanding: 9107.31, repaymentRate: 74 },
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
    combined: { accounts: 623, beneficiaries: 2337, girls: 359, boys: 364, families: 23, newUB: 557 },
    quito:    { accounts: 349, beneficiaries: 1166, girls: 212, boys: 215, families: 11, newUB: 415 },
    imbabura: { accounts: 274, beneficiaries: 1171, girls: 147, boys: 149, families: 12, newUB: 142 },
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
    health: "Health", education: "Education", shelter: "Living Conditions",
    medicalAttention: "Medical appointments", ubMedical: "Individuals served",
    paidByVozManos: "Paid by Voz y Manos", paidByPDV: "Paid by Pan de Vida",
    otherMedicalAidsTitle: "Other Medical Assistance",
    otherMedicalAids: "Medical Assistance (Specialist appointment, medicine, etc)", ubOtherMedical: "Individuals served",
    investedOther: "Invested in other medical",
    totalHealthServices: "Total Health Services Provided", totalHealthUB: "Individuals served",
    schoolKits: "School kits distributed", backpacks: "Backpacks distributed",
    totalEducationServices: "Total Education Services Provided", totalEducationUB: "Individuals served",
    unitCost: "Unit cost", totalCostLabel: "Total cost",
    vbsCamps: "VBS camps held", shelterServices: "Total services",
    shelterUB: "Families served",
    shelterFurniture: "Furniture", shelterAppliances: "Appliances",
    shelterHousehold: "Household goods", shelterElectronics: "Electronics & supplies",
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
    sharkTankWinners: "Shark Tank Winners", sharkTankPdvCost: "PDV Cost",
    goal: "Goal", done: "Done",
    totalMEPs: "Total MEPs", active: "Active", inactive: "Inactive",
    finished: "Finished", aborted: "Aborted", marketReady: "Market Ready",
    mepParticipants: "Participants served this year",
    fundCapital: "Revolving Fund Capital",
    capitalDisbursed: "Capital disbursed (loans)",
    repaidByEntrepreneurs: "Repaid by entrepreneurs",
    outstandingBalance: "Current outstanding balance",
    repaymentRate: "Repayment rate",
    noLocation: "No location recorded",
    mepMarketReadyDesc: "Active businesses running for more than 9 months",
    goals2026: "2026 Plan",
    goals2026Sub: "Beneficiary Aid & Services Plan — annual goals",
    goals2026Note: "Targets are set by PDV planning (not stored in Salesforce). Progress bars compare live Salesforce data against each annual goal.",
    progressYtd: "Progress this year",
    buTarget: "People benefited (BU)",
    goalTracked: "tracked live",
    sharkTankPlaceholder: "Data coming soon — this program's metrics are being integrated.",
    viewDetail: "View detail",
    byLocation: "By Location",
    quito: "Quito", otavalo: "Otavalo", mantaRiobamba: "Manta & Riobamba",
    biblesDelivered: "Bibles distributed",
    vbsCampsHeld: "VBS CAMPS HELD",
    childrenVBS: "Kids served",
    personasAlcanzadas: "Individuals reached by the gospel",
    individualsServed: "Individuals served",
    totalReached: "Total Individuals Reached",
    totalReachedDesc: "Unique people in households served this year",
    activeLifeFarms: "Active Life Farms",
    activeLifeFarmsNote: "Shown separately — not added to the total",
    clothingDonationsCount: "Number of clothing donations",
    activeAccounts: "Active accounts", activeBeneficiaries: "Active beneficiaries",
    activeGirls: "Active girls (0–13)", activeBoys: "Active boys (0–13)",
    acceptedFamilies: "New families this year", acceptedUB: "New Individuals",
    combined: "Combined", imbabura: "Imbabura",
    statusDist: "Status Distribution",
    serviceProviders: "Service providers include Joshua Expeditions, Staff PDV, Grace Baptist Church Wilmington, and New Life Church.",
    championsLabel: "Champions (Full Size)",
    growthLabel: "Growth Pipeline",
    clinicTitle: "Medical Care Provided By Clinica la Y",
    hotMealsTabDesc: "Freshly prepared meals served on-site to families and children at outreach events and weekly community gatherings.",
    groceriesTabDesc: "Bags of staple groceries delivered to vulnerable families to cover basic monthly nutrition needs.",
    clothingTabDesc: "Donated clothing distributed to families in our service communities, sorted and given according to need.",
    emergencyTabDesc: "Rapid-response aid delivered to beneficiaries facing natural disasters, accidents, or unexpected crises.",
    christmasTabDesc: "Annual Christmas program providing hot meals, toys, and candy bags to children and families across our communities.",
    healthTabDesc: "Medical care through Clínica la Y, plus specialist appointments, medicines, and other health assistance for beneficiaries.",
    educationTabDesc: "School kits, backpacks, and educational support that keep beneficiary children enrolled and ready for the school year.",
    shelterTabDesc: "Furniture, appliances, household goods, and electronics donated to improve the daily living environment of beneficiary families.",
    lifeFarmsTabDesc: "Family-run home gardens with seedlings, training, and supplies that produce food and generate income.",
    revolvingFundTabDesc: "Micro-Entrepreneurial Projects (MEPs) backed by seed capital and accompaniment so families can launch sustainable businesses.",
    sharkTankTabDesc: "Pitch and accelerator program connecting promising MEPs with mentorship, exposure, and additional investment.",
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
    health: "Salud", education: "Educación", shelter: "Condiciones de Vida",
    medicalAttention: "Citas médicas", ubMedical: "Individuos servidos",
    paidByVozManos: "Pagado por Voz y Manos", paidByPDV: "Pagado por Pan de Vida",
    otherMedicalAidsTitle: "Otra asistencia médica",
    otherMedicalAids: "Asistencia médica (Citas de especialidad, medicinas, etc.)", ubOtherMedical: "Individuos servidos",
    investedOther: "Invertido en otras ayudas",
    totalHealthServices: "Total de servicios de salud provistos", totalHealthUB: "Individuos servidos",
    schoolKits: "Kits escolares distribuidos", backpacks: "Mochilas distribuidas",
    totalEducationServices: "Total de servicios educativos provistos", totalEducationUB: "Individuos servidos",
    unitCost: "Costo unitario", totalCostLabel: "Costo total",
    vbsCamps: "Campamentos EBV", shelterServices: "Total servicios",
    shelterUB: "Familias servidas",
    shelterFurniture: "Mobiliario", shelterAppliances: "Electrodomésticos",
    shelterHousehold: "Enseres del hogar", shelterElectronics: "Electrónicos y suministros",
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
    sharkTankWinners: "Ganadores Shark Tank", sharkTankPdvCost: "Costo PDV",
    goal: "Meta", done: "Realizado",
    totalMEPs: "Total MEPs", active: "Activos", inactive: "Inactivos",
    finished: "Finalizados", aborted: "Cancelados", marketReady: "Listos para Mercado",
    mepParticipants: "Participantes servidos este año",
    fundCapital: "Capital del Fondo Rotativo",
    capitalDisbursed: "Capital desembolsado (préstamos)",
    repaidByEntrepreneurs: "Reembolsado por emprendedores",
    outstandingBalance: "Saldo pendiente actual",
    repaymentRate: "Tasa de reembolso",
    noLocation: "Sin ubicación registrada",
    mepMarketReadyDesc: "Negocios activos con más de 9 meses de funcionamiento",
    goals2026: "Plan 2026",
    goals2026Sub: "Plan de Ayudas y Servicios a Beneficiarios — metas anuales",
    goals2026Note: "Las metas las define la planificación de PDV (no viven en Salesforce). Las barras de avance comparan los datos vivos de Salesforce contra cada meta anual.",
    progressYtd: "Avance este año",
    buTarget: "Personas beneficiadas (BU)",
    goalTracked: "con seguimiento en vivo",
    sharkTankPlaceholder: "Datos próximamente — las métricas de este programa están siendo integradas.",
    viewDetail: "Ver detalle",
    byLocation: "Por Ubicación",
    quito: "Quito", otavalo: "Otavalo", mantaRiobamba: "Manta y Riobamba",
    biblesDelivered: "Biblias distribuidas",
    vbsCampsHeld: "CAMPAMENTOS EBV REALIZADOS",
    childrenVBS: "Niños servidos",
    personasAlcanzadas: "Individuos alcanzados por el evangelio",
    individualsServed: "Individuos servidos",
    totalReached: "Total de Personas Alcanzadas",
    totalReachedDesc: "Personas únicas en hogares servidos este año",
    activeLifeFarms: "Huertos de Vida Activos",
    activeLifeFarmsNote: "Se muestra aparte — no se suma al total",
    clothingDonationsCount: "Número de donaciones de ropa",
    activeAccounts: "Cuentas activas", activeBeneficiaries: "Beneficiarios activos",
    activeGirls: "Niñas activas (0–13)", activeBoys: "Niños activos (0–13)",
    acceptedFamilies: "Nuevas familias este año", acceptedUB: "Nuevos Individuos",
    combined: "Combinado", imbabura: "Imbabura",
    statusDist: "Distribución por Estado",
    serviceProviders: "Proveedores de servicio: Joshua Expeditions, Staff PDV, Grace Baptist Church Wilmington y New Life Church.",
    championsLabel: "Campeones (Tamaño Completo)",
    growthLabel: "Pipeline de Crecimiento",
    clinicTitle: "Atención Médica Provista por Clínica la Y",
    hotMealsTabDesc: "Comidas recién preparadas servidas en el lugar a familias y niños en eventos de extensión y reuniones comunitarias semanales.",
    groceriesTabDesc: "Fundas de víveres básicos entregadas a familias vulnerables para cubrir las necesidades alimenticias mensuales.",
    clothingTabDesc: "Ropa donada distribuida a familias de las comunidades que servimos, clasificada y entregada según la necesidad.",
    emergencyTabDesc: "Ayuda de respuesta rápida entregada a beneficiarios que enfrentan desastres naturales, accidentes o crisis inesperadas.",
    christmasTabDesc: "Programa navideño anual que provee comidas calientes, juguetes y fundas de caramelos a niños y familias de nuestras comunidades.",
    healthTabDesc: "Atención médica en Clínica la Y, además de citas con especialistas, medicinas y otras ayudas de salud para los beneficiarios.",
    educationTabDesc: "Kits escolares, mochilas y apoyo educativo que mantienen a los niños beneficiarios matriculados y listos para el año escolar.",
    shelterTabDesc: "Mobiliario, electrodomésticos, enseres del hogar y electrónicos donados para mejorar el entorno diario de las familias beneficiarias.",
    lifeFarmsTabDesc: "Huertos familiares con plántulas, capacitación y suministros para producir alimentos y generar ingresos.",
    revolvingFundTabDesc: "Proyectos Micro-Empresariales (MEPs) con capital semilla y acompañamiento para que las familias inicien negocios sostenibles.",
    sharkTankTabDesc: "Programa de pitch y aceleración que conecta MEPs prometedores con mentoría, exposición e inversión adicional.",
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

function Card({ children, style, className = "" }) {
  return (
    <div className={`pdv-card ${className}`} style={style}>
      {children}
    </div>
  );
}

function StatCard({ label, value, prefix = "", color = C.blue, iconEl, delay = 0, highlight }) {
  const [v, setV] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setV(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <Card className={highlight ? "pdv-highlight" : ""} style={{
      opacity: v ? 1 : 0,
      transform: v ? "translateY(0)" : "translateY(10px)",
      transition: "opacity 0.3s cubic-bezier(0.2,0,0,1), transform 0.3s cubic-bezier(0.2,0,0,1)",
    }}>
      <div className="pdv-stat-card">
        <div>
          <div className="pdv-stat-label">{label}</div>
          <div className="pdv-stat-value" style={{ color }}>
            {prefix}{typeof value === "number" ? value.toLocaleString() : value}
          </div>
        </div>
        {iconEl && (
          <div className="pdv-stat-icon" style={{ background: bgOf(color), color }}>
            {iconEl}
          </div>
        )}
      </div>
    </Card>
  );
}

function ProgressBar({ label, goal, done, color = C.blue, description, highlight }) {
  const [a, setA] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setA(true), 200);
    return () => clearTimeout(t);
  }, []);
  const pct = Math.min(Math.round((done / goal) * 100), 200);
  const over = done >= goal;

  return (
    <Card className={highlight ? "pdv-highlight" : ""} style={{ padding: "20px 24px" }}>
      <div className="pdv-progress-header">
        <div>
          <div className="pdv-progress-label">{label}</div>
          {description && <div className="pdv-progress-desc">{description}</div>}
        </div>
        <div className="pdv-progress-values">
          <span className="pdv-progress-done" style={{ color: over ? C.green : C.text1 }}>{done}</span>
          <span className="pdv-progress-goal"> / {goal}</span>
        </div>
      </div>
      <div className="pdv-progress-track">
        <div
          className="pdv-progress-fill"
          style={{
            background: over ? C.green : color,
            width: a ? `${Math.min(pct, 100)}%` : "0%",
          }}
        />
      </div>
      <div className="pdv-progress-pct" style={{ color: over ? C.green : C.text4 }}>{pct}%</div>
    </Card>
  );
}

function BarChart({ data, color = C.blue }) {
  const [a, setA] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setA(true), 300);
    return () => clearTimeout(t);
  }, []);
  const mx = Math.max(...data.map(d => d.value), 1);

  return (
    <div className="pdv-barchart">
      {data.map((d, i) => (
        <div key={i} className="pdv-bar-col">
          {d.value > 0 && <span className="pdv-bar-val">{d.value}</span>}
          <div
            className="pdv-bar"
            style={{
              background: d.value ? (d.color || color) : "rgba(0,0,0,0.08)",
              height: a ? `${d.value ? Math.max((d.value / mx) * 120, 6) : 3}px` : "0px",
              opacity: d.value ? 1 : 0.4,
            }}
          />
          <span className="pdv-bar-lbl">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

function MonthlyDistribution({ t, monthly, color = C.blue }) {
  const m = Array.isArray(monthly) ? monthly : [];
  return (
    <Card>
      <SectionTitle>{t.monthlyDistribution}</SectionTitle>
      <BarChart
        color={color}
        data={[
          { label: t.jan, value: m[0] ?? 0 },
          { label: t.feb, value: m[1] ?? 0 },
          { label: t.mar, value: m[2] ?? 0 },
          { label: t.apr, value: m[3] ?? 0 },
          { label: t.may, value: m[4] ?? 0 },
          { label: t.jun, value: m[5] ?? 0 },
        ]}
      />
    </Card>
  );
}

function DonutChart({ segments, size = 140, stroke = 20 }) {
  const [a, setA] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setA(true), 300);
    return () => clearTimeout(t);
  }, []);
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  let off = 0;

  return (
    <div className="pdv-donut-wrap">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth={stroke} />
        {segments.map((seg, i) => {
          const dash = (seg.value / total) * circ;
          const cur = off;
          off += dash;
          return (
            <circle
              key={i} cx={size / 2} cy={size / 2} r={r} fill="none"
              stroke={seg.color} strokeWidth={stroke} strokeLinecap="butt"
              strokeDasharray={`${a ? dash : 0} ${circ}`}
              strokeDashoffset={-cur}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              style={{ transition: `stroke-dasharray 1s cubic-bezier(0.2,0,0,1) ${i * 80}ms` }}
            />
          );
        })}
        <text
          x={size / 2} y={size / 2 + 1}
          textAnchor="middle" dominantBaseline="middle"
          style={{ fontSize: 19, fontWeight: 600, fill: "#202124", fontFamily: "'Inter',sans-serif", letterSpacing: "-0.03em" }}
        >{total}</text>
      </svg>
      <div className="pdv-donut-legend">
        {segments.map((seg, i) => (
          <div key={i} className="pdv-donut-legend-item">
            <div className="pdv-donut-legend-dot" style={{ background: seg.color }} />
            <span className="pdv-donut-legend-label">{seg.label}</span>
            <span className="pdv-donut-legend-val">{seg.value}</span>
          </div>
        ))}
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

function EmptyState({ message }) {
  return (
    <Card>
      <div className="pdv-empty">
        <div className="pdv-empty-icon">
          <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" width="48" height="48">
            <rect x="6" y="10" width="36" height="28" rx="4"/>
            <line x1="15" y1="21" x2="33" y2="21"/>
            <line x1="15" y1="27" x2="26" y2="27"/>
          </svg>
        </div>
        <div className="pdv-empty-text">{message}</div>
      </div>
    </Card>
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

// ─── PAGES ────────────────────────────────────────────────────

// Map: label key → { page, tab? }
const ITEM_NAV = {
  hotMeals:    { page: "level1", tab: "hotmeals"  },
  groceries:   { page: "level1", tab: "groceries" },
  clothing:    { page: "level1", tab: "clothing"  },
  totalCost:   { page: "level1", tab: "groceries" },
  health:      { page: "level2", tab: "health"    },
  education:   { page: "level2", tab: "education" },
  shelter:     { page: "level2", tab: "shelter"   },
  totalHealthUB: { page: "level2", tab: "health"  },
  lifeFarms:   { page: "level3", tab: "lifefarms" },
  revolvingFund: { page: "level3", tab: "revolving" },
  marketReady: { page: "level3", tab: "revolving" },
  sharkTank:   { page: "level3", tab: "sharktank" },
};

const LEVEL_NAV = {
  "1": { page: "level1" },
  "2": { page: "level2" },
  "3": { page: "level3" },
};

function ClickableCard({ children, onClick, style, color, label = "Ver detalle" }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      className="pdv-card pdv-card--clickable"
      style={{
        ...style,
        cursor: "pointer",
        padding: 0,
        display: "flex",
        flexDirection: "column",
        outline: hov ? `2px solid ${color || "rgba(0,0,0,0.15)"}` : "2px solid transparent",
        transition: "outline 120ms ease, transform 120ms ease, box-shadow 120ms ease",
        transform: hov ? "translateY(-2px)" : "translateY(0)",
        boxShadow: hov ? "0 4px 16px rgba(0,0,0,0.08)" : "none",
      }}
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <div style={{ flex: 1, padding: "24px 24px 16px" }}>
        {children}
      </div>
      <div style={{
        borderTop: `1px solid ${hov ? (color ? color + "33" : "rgba(0,0,0,0.08)") : "rgba(0,0,0,0.06)"}`,
        padding: "10px 20px",
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        gap: 5,
        fontSize: 13,
        fontWeight: 600,
        color: hov ? (color || "#5f6368") : "#c0c4c9",
        transition: "color 140ms ease, border-color 140ms ease",
        borderBottomLeftRadius: "var(--radius-xl)",
        borderBottomRightRadius: "var(--radius-xl)",
        background: hov ? (color ? color + "08" : "rgba(0,0,0,0.02)") : "transparent",
      }}>
        {label}
        <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" width="11" height="11">
          <path d="M2.5 6h7M6.5 3l3 3-3 3"/>
        </svg>
      </div>
    </div>
  );
}

function OverviewPage({ t, onNavigate, data }) {
  const D = data ?? FALLBACK_DATA;
  const eduTotal = (D.education?.schoolKits ?? 0) + (D.education?.backpacks ?? 0);
  const lifeFarmsTotal =
    (D.lifeFarms?.idealFarm?.done      ?? 0) +
    (D.lifeFarms?.fullSizeFarm?.done   ?? 0) +
    (D.lifeFarms?.basicFarm?.done      ?? 0) +
    (D.lifeFarms?.multiplication?.done ?? 0) +
    (D.lifeFarms?.urbanFarm?.done      ?? 0);

  const fmtCount = (n) => (n == null ? "—" : n.toLocaleString());
  const fmtMoney = (n) =>
    n == null ? "—" : `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // label keys matching ITEM_NAV keys
  const levelSections = [
    { lvl: "1", name: t.level1Name, color: C.orange, items: [
      { label: t.hotMeals,                val: D.hotMeals?.plates      ?? 0, navKey: "hotMeals"          },
      { label: t.groceries,               val: D.groceries?.bags       ?? 0, navKey: "groceries"         },
      { label: t.clothingDonationsCount,  val: D.clothing?.donations   ?? 0, navKey: "clothing"          },
      { label: t.individualsServed,       val: fmtCount(D.level1?.individualsServed), navKey: "individualsServedL1" },
      { label: t.totalCost,               val: fmtMoney(D.level1?.totalCost),          navKey: "totalCost" },
    ]},
    { lvl: "2", name: t.level2Name, color: C.blue, items: [
      { label: t.health,             val: D.health?.totalServices ?? 0, navKey: "health"       },
      { label: t.education,          val: eduTotal,                     navKey: "education"    },
      { label: t.shelter,            val: D.shelter?.services     ?? 0, navKey: "shelter"      },
      { label: t.individualsServed,  val: fmtCount(D.level2?.individualsServed), navKey: "individualsServedL2" },
      { label: t.totalCost,          val: fmtMoney(D.level2?.totalCost),          navKey: "totalCostL2" },
    ]},
    { lvl: "3", name: t.level3Name, color: C.green, items: [
      { label: t.lifeFarms,          val: lifeFarmsTotal,               navKey: "lifeFarms"    },
      { label: t.revolvingFund,      val: D.meps?.total           ?? 0, navKey: "revolvingFund"},
      { label: t.marketReady,        val: D.meps?.marketReady     ?? 0, navKey: "marketReady" },
      { label: t.sharkTank,          val: "—",                          navKey: "sharkTank"    },
      { label: t.individualsServed,  val: fmtCount(D.level3?.individualsServed), navKey: "individualsServedL3" },
      { label: t.totalCost,          val: fmtMoney(D.level3?.totalCost),          navKey: "totalCostL3" },
    ]},
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      {/* Grand total — unique people reached this year, with active life farms as a separate line */}
      <Card style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 24, borderLeft: `4px solid ${C.green}`, padding: "22px 26px" }}>
        <div>
          <div className="pdv-stat-label">{t.totalReached}</div>
          <div style={{ fontSize: 44, fontWeight: 600, color: C.green, letterSpacing: "-0.03em", lineHeight: 1.05 }}>
            {(D.overview?.totalReached ?? 0).toLocaleString()}
          </div>
          <div style={{ fontSize: 12, color: C.text4, marginTop: 4 }}>{t.totalReachedDesc}</div>
        </div>
        <div style={{ textAlign: "right", paddingLeft: 24, borderLeft: "1px solid rgba(0,0,0,0.08)", minWidth: 170 }}>
          <div className="pdv-stat-label">{t.activeLifeFarms}</div>
          <div style={{ fontSize: 30, fontWeight: 500, color: C.text1, letterSpacing: "-0.02em" }}>
            {lifeFarmsTotal.toLocaleString()}
          </div>
          <div style={{ fontSize: 11, color: C.text4, marginTop: 4 }}>{t.activeLifeFarmsNote}</div>
        </div>
      </Card>

      {/* Top summary stats — navigate to beneficiaries */}
      <Grid cols={4}>
        {[
          { label: t.totalBeneficiaries, value: D.overview?.totalBeneficiaries ?? 0, color: C.blue,   icon: <Icon.people />,  nav: { page: "beneficiaries" }, navKey: "totalBeneficiaries" },
          { label: t.totalAccounts,      value: D.overview?.totalAccounts      ?? 0, color: C.teal,   icon: <Icon.folder />,  nav: { page: "beneficiaries" }, navKey: "totalAccounts" },
          { label: t.newFamilies,        value: D.overview?.newFamilies         ?? 0, color: C.green,  icon: <Icon.home />,    nav: { page: "beneficiaries" }, navKey: "newFamilies" },
          { label: t.totalDeliveries,    value: D.overview?.totalDeliveries     ?? 0, color: C.orange, icon: <Icon.box />,     nav: { page: "level1", tab: "hotmeals" }, navKey: "hotMeals" },
        ].map((s, i) => (
          <ClickableCard key={i} color={s.color} label={t.viewDetail} onClick={() => onNavigate(s.nav.page, s.nav.tab, s.navKey)}>
            <div className="pdv-stat-card">
              <div>
                <div className="pdv-stat-label">{s.label}</div>
                <div className="pdv-stat-value" style={{ color: s.color }}>
                  {s.value.toLocaleString()}
                </div>
              </div>
              <div className="pdv-stat-icon" style={{ background: bgOf(s.color), color: s.color }}>
                {s.icon}
              </div>
            </div>
          </ClickableCard>
        ))}
      </Grid>

      {/* Impact by Level — each card navigates to the level */}
      <div>
        <SectionTitle>{t.impactByLevel}</SectionTitle>
        <Grid cols={3}>
          {levelSections.map((sec) => (
            <div key={sec.lvl} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {/* Level header card — navigates to level page */}
              <ClickableCard
                color={sec.color}
                label={t.viewDetail}
                style={{ borderLeft: `3px solid ${sec.color}`, paddingTop: 20, paddingBottom: 22, paddingLeft: 22, paddingRight: 22, minHeight: 360 }}
                onClick={() => onNavigate(LEVEL_NAV[sec.lvl].page)}
              >
                <LevelBadge level={sec.lvl} name={sec.name} color={sec.color} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: 22, rowGap: 22, marginTop: 14 }}>
                  {sec.items.map((item, j) => (
                    <div
                      key={j}
                      onClick={(e) => {
                        const nav = ITEM_NAV[item.navKey];
                        if (nav) {
                          e.stopPropagation();
                          onNavigate(nav.page, nav.tab, item.navKey);
                        }
                      }}
                      style={{
                        cursor: "pointer",
                        padding: "10px 12px",
                        borderRadius: 10,
                        transition: "background 120ms ease",
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(0,0,0,0.04)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <div style={{
                        fontSize: 12, fontWeight: 600, color: C.text4,
                        marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em",
                        lineHeight: 1.3, minHeight: 32,
                      }}>{item.label}</div>
                      <div style={{
                        fontSize: 30, fontWeight: 500, color: C.text1, letterSpacing: "-0.03em",
                      }}>
                        {typeof item.val === "number" ? item.val.toLocaleString() : item.val}
                      </div>
                    </div>
                  ))}
                </div>
              </ClickableCard>
            </div>
          ))}
        </Grid>
      </div>

      {/* Evangelism — navigate to evangelism page */}
      <div>
        <SectionTitle>{t.evangelism}</SectionTitle>
        <Grid cols={4}>
          {[
            { label: t.biblesDelivered,    value: D.evangelism?.bibles             ?? 0, icon: <Icon.book />,   navKey: "bibles" },
            { label: t.vbsCampsHeld,       value: D.evangelism?.vbsCamps           ?? 0, icon: <Icon.tent />,   navKey: "vbsCamps" },
            { label: t.childrenVBS,        value: D.evangelism?.childrenVBS        ?? 0, icon: <Icon.child />,  navKey: "childrenVBS" },
            { label: t.personasAlcanzadas, value: D.evangelism?.personasAlcanzadas ?? 0, icon: <Icon.people />, navKey: "personasAlcanzadas" },
          ].map((s, i) => (
            <ClickableCard key={i} color={C.purple} label={t.viewDetail} onClick={() => onNavigate("evangelism", null, s.navKey)}>
              <div className="pdv-stat-card">
                <div>
                  <div className="pdv-stat-label">{s.label}</div>
                  <div className="pdv-stat-value" style={{ color: C.purple }}>
                    {s.value.toLocaleString()}
                  </div>
                </div>
                <div className="pdv-stat-icon" style={{ background: bgOf(C.purple), color: C.purple }}>
                  {s.icon}
                </div>
              </div>
            </ClickableCard>
          ))}
        </Grid>
      </div>
    </div>
  );
}

function Level1Page({ t, initialTab = "hotmeals", data, highlightKey }) {
  const [tab, setTab] = useState(initialTab);
  const D = data ?? FALLBACK_DATA;
  return (
    <div>
      <LevelBadge level="1" name={t.level1Name} color={C.orange} />
      <TabBar tabs={[
        { id: "hotmeals",  label: t.hotMeals  },
        { id: "groceries", label: t.groceries  },
        { id: "clothing",  label: t.clothing   },
        { id: "emergency", label: t.emergency  },
        { id: "christmas", label: t.christmas  },
      ]} active={tab} onChange={setTab} />

      {tab === "hotmeals" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <TabDescription>{t.hotMealsTabDesc}</TabDescription>
          <Grid cols={2}>
            <StatCard label={t.hotMealsDelivered} value={D.hotMeals?.plates   ?? 0} color={C.red}    iconEl={<Icon.bag />}    highlight={highlightKey === 'hotMeals'} delay={0}  />
            <StatCard label={t.familiesHotMeals}  value={D.hotMeals?.families ?? 0} color={C.orange} iconEl={<Icon.people />} delay={60} />
          </Grid>
          <MonthlyDistribution t={t} monthly={D.hotMeals?.monthly} color={C.red} />
        </div>
      )}

      {tab === "groceries" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <TabDescription>{t.groceriesTabDesc}</TabDescription>
          <Grid cols={4}>
            <StatCard label={t.groceryBags} value={D.groceries?.bags ?? 0}      color={C.yellow} iconEl={<Icon.cart />}   highlight={highlightKey === 'groceries'} delay={0}   />
            <StatCard label={t.ubGrocery}   value={D.groceries?.ub   ?? 0}       color={C.orange} iconEl={<Icon.people />} delay={60}  />
            <StatCard label={t.avgCost}     value={(D.groceries?.avgCost   ?? 0).toFixed(2)} prefix="$" color={C.teal}  iconEl={<Icon.dollar />} delay={120} />
            <StatCard label={t.totalCost}   value={(D.groceries?.totalCost ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} prefix="$" color={C.green} iconEl={<Icon.money />} highlight={highlightKey === 'totalCost'} delay={180} />
          </Grid>
          <MonthlyDistribution t={t} monthly={D.groceries?.monthly} color={C.yellow} />
        </div>
      )}

      {tab === "clothing" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <TabDescription>{t.clothingTabDesc}</TabDescription>
          <Grid cols={2}>
            <StatCard label={t.clothingDonations} value={D.clothing?.donations ?? 0} color={C.purple} iconEl={<Icon.shirt />} highlight={highlightKey === 'clothing'} delay={0}  />
            <StatCard label={t.ubClothing}        value={D.clothing?.ub        ?? 0} color={C.teal}   iconEl={<Icon.people />} delay={60} />
          </Grid>
          <MonthlyDistribution t={t} monthly={D.clothing?.monthly} color={C.purple} />
        </div>
      )}

      {tab === "emergency" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <TabDescription>{t.emergencyTabDesc}</TabDescription>
          <MonthlyDistribution t={t} monthly={D.emergency?.monthly} color={C.red} />
        </div>
      )}
      {tab === "christmas" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <TabDescription>{t.christmasTabDesc}</TabDescription>
          <MonthlyDistribution t={t} monthly={D.christmas?.monthly} color={C.green} />
        </div>
      )}
    </div>
  );
}

function Level2Page({ t, initialTab = "health", data, highlightKey }) {
  const [tab, setTab] = useState(initialTab);
  const D = data ?? FALLBACK_DATA;
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
              <div>
                <div className="pdv-summary-lbl">{t.totalHealthServices}</div>
                <div className="pdv-summary-val">{D.health?.totalServices ?? 0}</div>
              </div>
              <div>
                <div className="pdv-summary-lbl">{t.totalHealthUB}</div>
                <div className="pdv-summary-val">{D.health?.totalUB ?? 0}</div>
              </div>
            </div>
          </div>

          <SectionTitle>{t.clinicTitle}</SectionTitle>
          <Grid cols={4}>
            <StatCard label={t.medicalAttention} value={D.health?.clinic?.consultations ?? 0}  color={C.blue}  iconEl={<Icon.doctor />} delay={0}   />
            <StatCard label={t.ubMedical}        value={D.health?.clinic?.ub             ?? 0}  color={C.teal}  iconEl={<Icon.people />} delay={60}  />
            <StatCard label={t.paidByVozManos}   value={(D.health?.clinic?.paidVozManos ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} prefix="$" color={C.green} iconEl={<Icon.dollar />} delay={120} />
            <StatCard label={t.paidByPDV}        value={(D.health?.clinic?.paidPDV       ?? 0).toFixed(2)} prefix="$" color={C.blue}  iconEl={<Icon.money />}  delay={180} />
          </Grid>

          <SectionTitle style={{ marginTop: 4 }}>{t.otherMedicalAidsTitle}</SectionTitle>
          <Grid cols={3}>
            <StatCard label={t.otherMedicalAids} value={D.health?.other?.aids     ?? 0}  color={C.orange} iconEl={<Icon.doctor />} delay={0}   />
            <StatCard label={t.ubOtherMedical}   value={D.health?.other?.ub       ?? 0}  color={C.teal}   iconEl={<Icon.people />} delay={60}  />
            <StatCard label={t.investedOther}     value={(D.health?.other?.invested ?? 0).toFixed(2)} prefix="$" color={C.green} iconEl={<Icon.dollar />} delay={120} />
          </Grid>

          <MonthlyDistribution t={t} monthly={D.health?.monthly} color={C.blue} />
        </div>
      )}

      {tab === "education" && (
        <div className={highlightKey === 'education' ? 'pdv-highlight' : ''} style={{ display: "flex", flexDirection: "column", gap: 20, padding: highlightKey === 'education' ? 8 : 0, borderRadius: 24 }}>
          <TabDescription>{t.educationTabDesc}</TabDescription>
          <Grid cols={3}>
            <StatCard label={t.schoolKits}                 value={D.education?.schoolKits   ?? 0}   color={C.red}    iconEl={<Icon.backpack />} delay={0}   />
            <StatCard label={`${t.unitCost} (kit)`}        value={(D.education?.schoolKitCost ?? 0).toFixed(2)} prefix="$" color={C.yellow} iconEl={<Icon.dollar />} delay={60}  />
            <StatCard label={`${t.totalCostLabel} (kits)`} value={((D.education?.schoolKits ?? 0) * (D.education?.schoolKitCost ?? 0)).toFixed(2)} prefix="$" color={C.green}  iconEl={<Icon.money />}  delay={120} />
          </Grid>
          <Grid cols={3}>
            <StatCard label={t.backpacks}                                          value={D.education?.backpacks    ?? 0}   color={C.blue}   iconEl={<Icon.backpack />} delay={180} />
            <StatCard label={`${t.unitCost} (${t.backpacks.toLowerCase()})`}       value={(D.education?.backpackCost ?? 0).toFixed(2)} prefix="$" color={C.yellow} iconEl={<Icon.dollar />} delay={240} />
            <StatCard label={`${t.totalCostLabel} (${t.backpacks.toLowerCase()})`} value={((D.education?.backpacks ?? 0) * (D.education?.backpackCost ?? 0)).toFixed(2)} prefix="$" color={C.green}  iconEl={<Icon.money />}  delay={300} />
          </Grid>
          <MonthlyDistribution t={t} monthly={D.education?.monthly} color={C.blue} />
        </div>
      )}

      {tab === "shelter" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <TabDescription>{t.shelterTabDesc}</TabDescription>
          <div className={`pdv-card pdv-summary-card ${highlightKey === 'shelter' ? 'pdv-highlight' : ''}`}>
            <div className="pdv-summary-inner">
              <div>
                <div className="pdv-summary-lbl">{t.shelterServices}</div>
                <div className="pdv-summary-val">{D.shelter?.services ?? 0}</div>
              </div>
              <div>
                <div className="pdv-summary-lbl">{t.shelterUB}</div>
                <div className="pdv-summary-val">{D.shelter?.ub ?? 0}</div>
              </div>
            </div>
          </div>

          <Grid cols={2}>
            <StatCard label={t.shelterFurniture}   value={D.shelter?.furniture?.services   ?? 0} color={C.blue}   iconEl={<Icon.home />}   delay={0}   />
            <StatCard label={`${t.shelterFamiliesServed}`} value={D.shelter?.furniture?.ub ?? 0} color={C.teal} iconEl={<Icon.people />} delay={60}  />
          </Grid>
          <Grid cols={2}>
            <StatCard label={t.shelterAppliances}  value={D.shelter?.appliances?.services  ?? 0} color={C.orange} iconEl={<Icon.home />}   delay={120} />
            <StatCard label={`${t.shelterFamiliesServed}`} value={D.shelter?.appliances?.ub ?? 0} color={C.teal} iconEl={<Icon.people />} delay={180} />
          </Grid>
          <Grid cols={2}>
            <StatCard label={t.shelterHousehold}   value={D.shelter?.household?.services   ?? 0} color={C.green}  iconEl={<Icon.home />}   delay={240} />
            <StatCard label={`${t.shelterFamiliesServed}`} value={D.shelter?.household?.ub ?? 0} color={C.teal} iconEl={<Icon.people />} delay={300} />
          </Grid>
          <Grid cols={2}>
            <StatCard label={t.shelterElectronics} value={D.shelter?.electronics?.services ?? 0} color={C.purple} iconEl={<Icon.home />}   delay={360} />
            <StatCard label={`${t.shelterFamiliesServed}`} value={D.shelter?.electronics?.ub ?? 0} color={C.teal} iconEl={<Icon.people />} delay={420} />
          </Grid>

          <Card>
            <p className="pdv-info-text">{t.serviceProviders}</p>
          </Card>
          <MonthlyDistribution t={t} monthly={D.shelter?.monthly} color={C.purple} />
        </div>
      )}
    </div>
  );
}

function Level3Page({ t, initialTab = "lifefarms", data, highlightKey }) {
  const [tab, setTab] = useState(initialTab);
  const D = data ?? FALLBACK_DATA;
  // Year the YTD fund flows (disbursed/repaid/rate) belong to — written by the sync.
  const fundYear = D.meps?.fund?.year;
  const ytd = (label) => (fundYear ? `${label} · ${fundYear}` : label);
  return (
    <div>
      <LevelBadge level="3" name={t.level3Name} color={C.green} />
      <TabBar tabs={[
        { id: "lifefarms",  label: t.lifeFarms     },
        { id: "urbanfarms", label: t.urbanFarms    },
        { id: "revolving",  label: t.revolvingFund },
        { id: "sharktank",  label: t.sharkTank     },
      ]} active={tab} onChange={setTab} />

      {tab === "lifefarms" && (
        <div className={highlightKey === 'lifeFarms' ? 'pdv-highlight' : ''} style={{ display: "flex", flexDirection: "column", gap: 20, padding: highlightKey === 'lifeFarms' ? 8 : 0, borderRadius: 24 }}>
          <TabDescription>{t.lifeFarmsTabDesc}</TabDescription>
          <SectionTitle>{t.championsLabel}</SectionTitle>
          <Grid cols={3}>
            <ProgressBar label={t.idealFarm}     description={t.idealFarmDesc}    goal={D.lifeFarms?.idealFarm?.goal      ?? 30}  done={D.lifeFarms?.idealFarm?.done      ?? 0}  color={C.yellow} />
            <ProgressBar label={t.fullSizeFarm}  description={t.fullSizeFarmDesc} goal={D.lifeFarms?.fullSizeFarm?.goal   ?? 10}  done={D.lifeFarms?.fullSizeFarm?.done   ?? 0}  color={C.blue}   />
            <ProgressBar label={t.totalChampions}                                  goal={D.lifeFarms?.totalChampions?.goal ?? 40}  done={D.lifeFarms?.totalChampions?.done ?? 0}  color={C.green}  />
          </Grid>
          <SectionTitle style={{ marginTop: 8 }}>{t.growthLabel}</SectionTitle>
          <Grid cols={2}>
            <ProgressBar label={t.basicFarm}          description={t.basicFarmDesc}      goal={D.lifeFarms?.basicFarm?.goal      ?? 118} done={D.lifeFarms?.basicFarm?.done      ?? 0} color={C.orange} />
            <ProgressBar label={t.multiplicationFarm} description={t.multiplicationDesc} goal={D.lifeFarms?.multiplication?.goal ?? 108} done={D.lifeFarms?.multiplication?.done ?? 0} color={C.purple} />
          </Grid>
        </div>
      )}

      {tab === "urbanfarms" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <TabDescription>{t.urbanFarmsTabDesc}</TabDescription>
          <Grid cols={4}>
            <StatCard label={t.urbanFarmsCount} value={D.lifeFarms?.urbanFarm?.done ?? 0} color={C.green} iconEl={<Icon.leaf />} delay={0} />
          </Grid>
        </div>
      )}

      {tab === "revolving" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <TabDescription>{t.revolvingFundTabDesc}</TabDescription>
          <Grid cols={4}>
            <StatCard label={t.totalMEPs}        value={D.meps?.total        ?? 0} color={C.text1} iconEl={<Icon.chart />}  highlight={highlightKey === 'revolvingFund'} delay={0}   />
            <StatCard label={t.active}           value={D.meps?.active       ?? 0} color={C.green} iconEl={<Icon.check />}  delay={60}  />
            <StatCard label={t.marketReady}      value={D.meps?.marketReady  ?? 0} color={C.yellow} iconEl={<Icon.star />}  highlight={highlightKey === 'marketReady'} delay={120} />
            <StatCard label={t.mepParticipants}  value={D.meps?.participants ?? 0} color={C.teal}  iconEl={<Icon.people />} delay={180} />
          </Grid>
          <div style={{ fontSize: 12, color: C.text4, marginTop: -10 }}>
            {t.marketReady}: {t.mepMarketReadyDesc}
          </div>

          {/* Revolving-fund capital — YTD flows; the outstanding balance is the current
              portfolio snapshot (a balance has no YTD form) */}
          <div>
            <SectionTitle>{t.fundCapital}</SectionTitle>
            <Grid cols={4}>
              <StatCard label={ytd(t.capitalDisbursed)}      prefix="$" value={D.meps?.fund?.disbursed   ?? 0} color={C.purple} iconEl={<Icon.money />}  delay={0}   />
              <StatCard label={ytd(t.repaidByEntrepreneurs)} prefix="$" value={D.meps?.fund?.repaid      ?? 0} color={C.green}  iconEl={<Icon.dollar />} delay={60}  />
              <StatCard label={t.outstandingBalance}         prefix="$" value={D.meps?.fund?.outstanding ?? 0} color={C.orange} iconEl={<Icon.warn />}   delay={120} />
              <StatCard label={ytd(t.repaymentRate)}         value={D.meps?.fund?.repaymentRate != null ? `${D.meps.fund.repaymentRate}%` : "—"} color={C.blue} iconEl={<Icon.chart />} delay={180} />
            </Grid>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Card>
              <SectionTitle>{t.statusDist}</SectionTitle>
              <DonutChart segments={[
                { label: t.active,   value: D.meps?.active   ?? 0,  color: C.green },
                { label: t.inactive, value: D.meps?.inactive ?? 0,  color: "#bdc1c6" },
                { label: t.finished, value: D.meps?.finished ?? 0,  color: C.blue },
                { label: t.aborted,  value: D.meps?.aborted  ?? 0,  color: C.red },
              ]} />
            </Card>
            <Card>
              <SectionTitle>{t.byLocation}</SectionTitle>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 8 }}>
                {(D.meps?.locations ?? []).map((loc, i) => {
                  const palette = [C.blue, C.green, C.orange, C.purple, C.teal, C.pink];
                  const color = loc.name == null ? "#bdc1c6" : palette[i % palette.length];
                  return (
                    <div key={i} className="pdv-loc-item">
                      <div className="pdv-loc-row">
                        <div className="pdv-loc-name">
                          <div className="pdv-loc-dot" style={{ background: color }} />
                          {loc.name ?? t.noLocation}
                        </div>
                        <span className="pdv-loc-val">{loc.count}</span>
                      </div>
                      <div className="pdv-loc-track">
                        <div
                          className="pdv-loc-fill"
                          style={{ background: color, width: `${(loc.count / (D.meps?.total || 1)) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          <MonthlyDistribution t={t} monthly={D.meps?.monthly} color={C.green} />
        </div>
      )}

      {tab === "sharktank" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <TabDescription>{t.sharkTankTabDesc}</TabDescription>
          <Grid cols={4}>
            <StatCard label={t.sharkTankWinners} value={D.sharkTank?.winners ?? 0} color={C.teal} iconEl={<Icon.star />} delay={0} />
            <StatCard label={t.sharkTankPdvCost} value={(D.sharkTank?.pdvCost ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} prefix="$" color={C.green} iconEl={<Icon.money />} delay={60} />
          </Grid>
        </div>
      )}
    </div>
  );
}

function EvangelismPage({ t, data, highlightKey }) {
  const D = data ?? FALLBACK_DATA;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div className="pdv-level-badge" style={{ background: C.purpleBg, alignSelf: "flex-start" }}>
        <div style={{
          width: 22, height: 22, borderRadius: "50%",
          background: C.purple,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff",
        }}>
          <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" width="10" height="10">
            <path d="M6 1v10M1 6h10"/>
          </svg>
        </div>
        <span className="pdv-level-badge-text" style={{ color: C.purple }}>{t.evangelismDesc}</span>
      </div>
      <Grid cols={4}>
        <StatCard label={t.biblesDelivered}     value={D.evangelism?.bibles              ?? 0} color={C.purple} iconEl={<Icon.book />}   highlight={highlightKey === 'bibles'} delay={0}   />
        <StatCard label={t.vbsCampsHeld}        value={D.evangelism?.vbsCamps            ?? 0} color={C.blue}   iconEl={<Icon.tent />}   highlight={highlightKey === 'vbsCamps'} delay={80}  />
        <StatCard label={t.childrenVBS}         value={D.evangelism?.childrenVBS         ?? 0} color={C.red}    iconEl={<Icon.child />}  highlight={highlightKey === 'childrenVBS'} delay={160} />
        <StatCard label={t.personasAlcanzadas}  value={D.evangelism?.personasAlcanzadas  ?? 0} color={C.green}  iconEl={<Icon.people />} highlight={highlightKey === 'personasAlcanzadas'} delay={240} />
      </Grid>
      <MonthlyDistribution t={t} monthly={D.evangelism?.monthly} color={C.purple} />
    </div>
  );
}

function BeneficiariesPage({ t, data, highlightKey }) {
  const [tab, setTab] = useState("combined");
  const D = data ?? FALLBACK_DATA;
  const bene = D.beneficiaries ?? FALLBACK_DATA.beneficiaries;
  const tableData = {
    combined: { accounts: bene.combined?.accounts ?? 0, bene: bene.combined?.beneficiaries ?? 0, girls: bene.combined?.girls ?? 0, boys: bene.combined?.boys ?? 0, families: bene.combined?.newFamilies ?? 0, ub: bene.combined?.newUB ?? 0 },
    quito:    { accounts: bene.quito?.accounts    ?? 0, bene: bene.quito?.beneficiaries    ?? 0, girls: bene.quito?.girls    ?? 0, boys: bene.quito?.boys    ?? 0, families: bene.quito?.newFamilies    ?? 0, ub: bene.quito?.newUB    ?? 0 },
    imbabura: { accounts: bene.imbabura?.accounts ?? 0, bene: bene.imbabura?.beneficiaries ?? 0, girls: bene.imbabura?.girls ?? 0, boys: bene.imbabura?.boys ?? 0, families: bene.imbabura?.newFamilies ?? 0, ub: bene.imbabura?.newUB ?? 0 },
  };
  const d = tableData[tab];

  return (
    <div>
      <TabBar tabs={[
        { id: "combined", label: t.combined },
        { id: "quito",    label: t.quito    },
        { id: "imbabura", label: t.imbabura },
      ]} active={tab} onChange={setTab} />

      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 16 }}>
        {/* Nivel 1: Active Accounts y Active Beneficiaries */}
        <Grid cols={2}>
          <StatCard label={t.activeAccounts}      value={d.accounts} color={C.teal}  iconEl={<Icon.folder />} highlight={highlightKey === 'totalAccounts'} delay={0}   />
          <StatCard label={t.activeBeneficiaries} value={d.bene}     color={C.blue}  iconEl={<Icon.people />} highlight={highlightKey === 'totalBeneficiaries'} delay={60}  />
        </Grid>

        {/* Nivel 2: Active Girls y Active Boys (Bloques más grandes) */}
        <div style={{ display: "flex", gap: 16, flexDirection: "row" }}>
          <Card style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", padding: 32, background: C.pinkBg }}>
            <div>
              <div style={{ color: C.pink, fontWeight: 600, fontSize: 14, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>{t.activeGirls}</div>
              <div style={{ color: C.pink, fontSize: 48, fontWeight: 500, lineHeight: 1, letterSpacing: "-0.03em" }}>{d.girls.toLocaleString()}</div>
            </div>
            <div style={{ color: C.pink, opacity: 0.5, transform: "scale(3.5)", transformOrigin: "right center" }}>
              <Icon.child />
            </div>
          </Card>
          <Card style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", padding: 32, background: C.tealBg }}>
            <div>
              <div style={{ color: C.teal, fontWeight: 600, fontSize: 14, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>{t.activeBoys}</div>
              <div style={{ color: C.teal, fontSize: 48, fontWeight: 500, lineHeight: 1, letterSpacing: "-0.03em" }}>{d.boys.toLocaleString()}</div>
            </div>
            <div style={{ color: C.teal, opacity: 0.5, transform: "scale(3.5)", transformOrigin: "right center" }}>
              <Icon.child />
            </div>
          </Card>
        </div>

        {/* Nivel 3: Families Accepted y New UB */}
        <Grid cols={2}>
          <StatCard label={t.acceptedFamilies}    value={d.families} color={C.green}  iconEl={<Icon.home />} highlight={highlightKey === 'newFamilies'} delay={240} />
          <StatCard label={t.acceptedUB}          value={d.ub}       color={C.orange} iconEl={<Icon.star />} delay={300} />
        </Grid>
      </div>
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
    title: { en: "1 · Hunger Relief", es: "1 · Alivio del Hambre" },
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
      },
    ],
  },
  {
    id: "educacion",
    color: C.blue,
    title: { en: "2 · Education", es: "2 · Educación" },
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
        live: (D) => D.education?.vbsCamps,
      },
    ],
  },
  {
    id: "salud",
    color: C.teal,
    title: { en: "3 · Health", es: "3 · Salud" },
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
        live: (D) => D.health?.other?.aids,
      },
    ],
  },
  {
    id: "condvida",
    color: C.purple,
    title: { en: "4 · Living Conditions Improvement", es: "4 · Mejoramiento de Condiciones de Vida" },
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
      },
    ],
  },
];

function GoalCard({ g, color, t, L, data }) {
  const live = g.live ? g.live(data) : null;
  const tracked = g.goal != null && typeof live === "number";
  const pct = tracked ? Math.min(Math.round((live / g.goal) * 100), 200) : 0;
  const over = tracked && live >= g.goal;
  const barColor = over ? C.green : color;
  return (
    <Card style={{ borderLeft: `3px solid ${color}`, display: "flex", flexDirection: "column", gap: 10 }}>
      <div>
        <div style={{ fontSize: 14.5, fontWeight: 600, color: C.text1, lineHeight: 1.35 }}>{g.title[L]}</div>
        <div style={{ fontSize: 12.5, color: C.text4, marginTop: 4, lineHeight: 1.55 }}>{g.detail[L]}</div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {g.chips.map((c, i) => (
          <span key={i} style={{
            fontSize: 11.5, fontWeight: 600, color, background: bgOf(color),
            padding: "3px 10px", borderRadius: 999, whiteSpace: "nowrap",
          }}>{c[L]}</span>
        ))}
        <span style={{
          fontSize: 11.5, fontWeight: 600, color: C.text4, background: "#f1f3f4",
          padding: "3px 10px", borderRadius: 999, whiteSpace: "nowrap",
        }}>{g.where[L]}</span>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span style={{
          fontSize: 11, fontWeight: 600, color: C.text4,
          textTransform: "uppercase", letterSpacing: "0.06em",
        }}>{t.buTarget}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: C.text1 }}>{g.bu[L]}</span>
      </div>
      {tracked && (
        <div style={{ marginTop: 2 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
            <span style={{ fontSize: 11.5, fontWeight: 600, color: C.text4 }}>{t.progressYtd}</span>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: over ? C.green : C.text1 }}>
              {live.toLocaleString()} <span style={{ color: C.text4, fontWeight: 500 }}>/ {g.goal.toLocaleString()}</span>
              <span style={{ marginLeft: 8, color: over ? C.green : C.text4 }}>{pct}%</span>
            </span>
          </div>
          <div className="pdv-loc-track">
            <div className="pdv-loc-fill" style={{ background: barColor, width: `${Math.min(pct, 100)}%` }} />
          </div>
        </div>
      )}
    </Card>
  );
}

function GoalsPage({ t, lang, data }) {
  const D = data ?? FALLBACK_DATA;
  const L = lang === "es" ? "es" : "en";
  const trackedCount = GOALS_2026.flatMap((s) => s.items).filter((g) => g.goal != null && g.live).length;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <Card style={{ borderLeft: `4px solid ${C.green}`, padding: "18px 24px" }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: C.text1 }}>{t.goals2026Sub}</div>
        <div style={{ fontSize: 12.5, color: C.text4, marginTop: 4, lineHeight: 1.55 }}>
          {t.goals2026Note} ({trackedCount} {t.goalTracked})
        </div>
      </Card>
      {GOALS_2026.map((sec) => (
        <div key={sec.id}>
          <SectionTitle style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 9, height: 9, borderRadius: "50%", background: sec.color, display: "inline-block" }} />
            {sec.title[L]}
          </SectionTitle>
          <Grid cols={2}>
            {sec.items.map((g, i) => (
              <GoalCard key={i} g={g} color={sec.color} t={t} L={L} data={D} />
            ))}
          </Grid>
        </div>
      ))}
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

          {page === "overview"      && <OverviewPage      t={t} onNavigate={navigate} data={dashData} />}
          {page === "level1"        && <Level1Page        t={t} key={navTab} initialTab={navTab || "hotmeals"}   data={dashData} highlightKey={highlightKey} />}
          {page === "level2"        && <Level2Page        t={t} key={navTab} initialTab={navTab || "health"}     data={dashData} highlightKey={highlightKey} />}
          {page === "level3"        && <Level3Page        t={t} key={navTab} initialTab={navTab || "lifefarms"}  data={dashData} highlightKey={highlightKey} />}
          {page === "evangelism"    && <EvangelismPage    t={t} data={dashData} highlightKey={highlightKey} />}
          {page === "beneficiaries" && <BeneficiariesPage t={t} data={dashData} highlightKey={highlightKey} />}
          {page === "goals"         && <GoalsPage         t={t} lang={lang} data={dashData} />}
        </main>
      </div>
    </>
  );
}
