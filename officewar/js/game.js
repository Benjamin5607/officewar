/** @typedef {{ phaseLabel: string; score: number; lives: number; bombs: number; stageNum: number; stageTotal: number; weaponLabel: string }} HudState */

/** @typedef {"default"|"keyboard"|"mouse"|"papers"|"docs"} PlayerWeaponMode */

/** 12-stage data bundled here so the game runs even if js/stages.js fails to load. */
/** @type {any[]} */
const STAGES_BUNDLED = [
  { id: 1, hourKo: "09:00", hourEn: "9:00 AM", labelKey: "stage1", duration: 18, capMin: 2, capMax: 3, spawnCd: 1.55, pool: { postit: 1 }, fireMul: 2.4, enemyShoot: false, printerBoss: false, finalBoss: false, theme: "dawn", chaos: 0.08 },
  { id: 2, hourKo: "10:00", hourEn: "10:00 AM", labelKey: "stage2", duration: 22, capMin: 3, capMax: 5, spawnCd: 1.25, pool: { postit: 0.72, mail: 0.28 }, fireMul: 1.9, enemyShoot: true, printerBoss: false, finalBoss: false, theme: "morning", chaos: 0.12 },
  { id: 3, hourKo: "11:00", hourEn: "11:00 AM", labelKey: "stage3", duration: 24, capMin: 4, capMax: 6, spawnCd: 1.1, pool: { postit: 0.44, mail: 0.32, report: 0.14, ticket: 0.1 }, fireMul: 1.6, enemyShoot: true, printerBoss: false, finalBoss: false, theme: "morning", chaos: 0.16 },
  { id: 4, hourKo: "12:00", hourEn: "12:00 PM", labelKey: "stage4", duration: 26, capMin: 4, capMax: 7, spawnCd: 1.0, pool: { postit: 0.34, mail: 0.3, report: 0.13, meeting: 0.1, expense: 0.08, ticket: 0.05 }, fireMul: 1.45, enemyShoot: true, printerBoss: true, finalBoss: false, theme: "noon", chaos: 0.22 },
  { id: 5, hourKo: "13:00", hourEn: "1:00 PM", labelKey: "stage5", duration: 24, capMin: 5, capMax: 8, spawnCd: 0.92, pool: { postit: 0.28, mail: 0.32, report: 0.12, meeting: 0.12, slack: 0.08, ticket: 0.08 }, fireMul: 1.35, enemyShoot: true, printerBoss: false, finalBoss: false, theme: "noon", chaos: 0.24 },
  { id: 6, hourKo: "14:00", hourEn: "2:00 PM", labelKey: "stage6", duration: 26, capMin: 5, capMax: 9, spawnCd: 0.85, pool: { postit: 0.22, mail: 0.26, report: 0.12, meeting: 0.16, slack: 0.1, ticket: 0.08, approval: 0.06 }, fireMul: 1.25, enemyShoot: true, printerBoss: false, finalBoss: false, theme: "afternoon", chaos: 0.28 },
  { id: 7, hourKo: "15:00", hourEn: "3:00 PM", labelKey: "stage7", duration: 28, capMin: 6, capMax: 10, spawnCd: 0.78, pool: { postit: 0.2, mail: 0.28, report: 0.12, meeting: 0.16, slack: 0.1, ticket: 0.08, approval: 0.06 }, fireMul: 1.15, enemyShoot: true, printerBoss: false, finalBoss: false, theme: "afternoon", chaos: 0.32 },
  { id: 8, hourKo: "16:00", hourEn: "4:00 PM", labelKey: "stage8", duration: 28, capMin: 6, capMax: 11, spawnCd: 0.72, pool: { postit: 0.18, mail: 0.26, report: 0.11, meeting: 0.18, slack: 0.11, ticket: 0.09, approval: 0.07 }, fireMul: 1.05, enemyShoot: true, printerBoss: true, finalBoss: false, theme: "dusk", chaos: 0.36 },
  { id: 9, hourKo: "17:00", hourEn: "5:00 PM", labelKey: "stage9", duration: 28, capMin: 7, capMax: 12, spawnCd: 0.66, pool: { postit: 0.16, mail: 0.24, report: 0.11, meeting: 0.2, slack: 0.12, ticket: 0.09, approval: 0.08 }, fireMul: 0.95, enemyShoot: true, printerBoss: false, finalBoss: false, theme: "dusk", chaos: 0.4 },
  { id: 10, hourKo: "18:00", hourEn: "6:00 PM", labelKey: "stage10", duration: 30, capMin: 7, capMax: 13, spawnCd: 0.6, pool: { postit: 0.14, mail: 0.22, report: 0.11, meeting: 0.22, slack: 0.13, ticket: 0.1, approval: 0.08 }, fireMul: 0.88, enemyShoot: true, printerBoss: false, finalBoss: false, theme: "evening", chaos: 0.45 },
  { id: 11, hourKo: "19:00", hourEn: "7:00 PM", labelKey: "stage11", duration: 32, capMin: 8, capMax: 14, spawnCd: 0.55, pool: { postit: 0.12, mail: 0.2, report: 0.1, meeting: 0.24, slack: 0.14, ticket: 0.11, approval: 0.09 }, fireMul: 0.82, enemyShoot: true, printerBoss: false, finalBoss: false, theme: "night", chaos: 0.5 },
  { id: 12, hourKo: "21:00", hourEn: "9:00 PM", labelKey: "stage12", duration: 45, capMin: 4, capMax: 8, spawnCd: 0.85, pool: { postit: 0.1, mail: 0.16, report: 0.1, meeting: 0.26, slack: 0.15, ticket: 0.12, approval: 0.11 }, fireMul: 0.75, enemyShoot: true, printerBoss: false, finalBoss: true, theme: "crunch", chaos: 0.55 },
];
function stageEnemyCap(stage, t) {
  const grow = Math.min(1, t / Math.max(6, stage.duration * 0.55));
  return Math.round(stage.capMin + (stage.capMax - stage.capMin) * grow);
}
function pickEnemyKind(pool) {
  const keys = Object.keys(pool);
  let r = Math.random();
  for (const k of keys) {
    r -= pool[k];
    if (r <= 0) return k;
  }
  return keys[keys.length - 1];
}
const STAGES = STAGES_BUNDLED;
const STAGE_COUNT = STAGES.length;

if (!window.OfficeWarStages) window.OfficeWarStages = { STAGES, STAGE_COUNT, stageEnemyCap, pickEnemyKind };

const W = 720;
const H = 960;
/** Player & enemies ~30% larger (sprites via SCREEN_MAX; hitboxes match). */
const ENTITY_SCALE = 1.3;

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const len = (x, y) => Math.hypot(x, y);
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[(Math.random() * arr.length) | 0];

/** Display order on results screen */
const KILL_TRACK_KINDS = /** @type {const} */ ([
  "postit",
  "mail",
  "meeting",
  "report",
  "ticket",
  "expense",
  "slack",
  "approval",
  "printer",
  "boss",
]);

function emptyKillCounts() {
  /** @type {Record<string, number>} */
  const o = {};
  for (const k of KILL_TRACK_KINDS) o[k] = 0;
  return o;
}

/** @param {string} mode */
function bulletStyleFromWeapon(mode) {
  switch (mode) {
    case "keyboard":
      return "keys";
    case "mouse":
      return "mouse";
    case "papers":
      return "paper";
    case "docs":
      return "doc";
    default:
      return "ally";
  }
}

function atkHueShort(short) {
  let h = 0;
  for (let i = 0; i < short.length; i++) h = (h + short.charCodeAt(i) * 37) % 320;
  return 20 + h;
}

function enemyBulletLife(vx, vy) {
  const spd = Math.max(40, Math.hypot(vx, vy));
  return Math.min(28, Math.max(9, (H + W * 0.8) / spd * 1.35));
}

/** @type {Record<string, { en: string; style: string; shortEn?: string }>} */
const BULLET_META = {
  PAY: { en: "Payroll", style: "coin" },
  RED: { en: "Redline", style: "stamp" },
  NO: { en: "Rejected", style: "stamp" },
  HOT: { en: "Hotfix", style: "code" },
  "1:1": { en: "1:1", style: "heart" },
  SQL: { en: "SQL", style: "funnel" },
  MFA: { en: "MFA", style: "lock" },
  LOG: { en: "Audit log", style: "doc" },
  BI: { en: "BI", style: "grid" },
  "911": { en: "On-call", style: "bolt" },
  SPAM: { en: "Spam", style: "mail" },
  NL: { en: "Newsletter", style: "mail" },
  P1: { en: "P1", style: "alert" },
  DRIP: { en: "Drip", style: "mail" },
  CAL: { en: "Calendar", style: "cal" },
  DUE: { en: "Due", style: "cal" },
  SU: { en: "Stand-up", style: "cal" },
  PX: { en: "Pixel", style: "pixel" },
  PTO: { en: "PTO", style: "pto" },
  AL: { en: "AL", style: "pto" },
  SICK: { en: "Sick", style: "cross" },
  DOC: { en: "Docs", style: "doc" },
  NOTE: { en: "Note", style: "doc" },
  RE: { en: "Re:", style: "mail" },
  WFH: { en: "WFH", style: "wifi" },
  AWOL: { en: "AWOL", style: "ghost" },
  JAM: { en: "Jam", style: "paper" },
  INK: { en: "Toner", style: "blob" },
  "2SIDE": { en: "Duplex", style: "paper" },
  SYNC: { en: "Sync", style: "ring" },
  ALL: { en: "All-hands", style: "doc" },
  AI: { en: "Action", style: "clip" },
  OT: { en: "OT", style: "bolt" },
  REOP: { en: "Reopen", style: "mail" },
  BLG: { en: "Backlog", style: "grid" },
  SPR: { en: "Sprint", style: "bolt" },
  BLK: { en: "Blocker", style: "alert" },
  DEP: { en: "Dependency", style: "mail" },
  CARD: { en: "Corp card", style: "coin" },
  VAT: { en: "VAT", style: "stamp" },
  RCP: { en: "Receipt", style: "paper" },
  ATT: { en: "Attach", style: "doc" },
  HERE: { en: "@channel", style: "alert" },
  THR: { en: "Thread", style: "mail" },
  DM: { en: "DM flood", style: "mail" },
  WAIT: { en: "Pending approval", style: "cal" },
  RESUB: { en: "Resubmit", style: "doc" },
  STAMP: { en: "Stamp rush", style: "stamp" },
};

/** @param {any} ctx */
function pushB(ctx, x, y, vx, vy, full, short, o = {}) {
  const hue = o.hue ?? atkHueShort(short);
  const m = BULLET_META[short] || { en: full, style: "doc" };
  ctx.enemyBullets.push(
    new Bullet(x, y, vx, vy, 8, o.damage ?? 1, false, hue, {
      label: full,
      labelEn: o.labelEn ?? m.en,
      labelShort: short,
      shortEn: o.shortEn ?? m.shortEn ?? short,
      style: o.style ?? m.style,
      life: o.life ?? enemyBulletLife(vx, vy),
      armTime: o.armTime ?? 0,
      zig: o.zig ?? 0,
    }),
  );
}

/** @type {Record<string, { deptKo: string; deptEn: string; sprite: string; key: string; interval: number }[]>} */
const ARCHETYPES = {
  postit: [
    { deptKo: "재무·정산", deptEn: "Finance & Accounting", sprite: "fin", key: "postit_fin_drop", interval: 0.55 },
    { deptKo: "법무·컴플라이언스", deptEn: "Legal & Compliance", sprite: "legal", key: "postit_leg_wall", interval: 0.58 },
    { deptKo: "R&D 엔지니어링", deptEn: "R&D Engineering", sprite: "dev", key: "postit_eng_snipe", interval: 0.5 },
    { deptKo: "HR 오퍼레이션", deptEn: "HR Operations", sprite: "hr", key: "postit_hr_pulse", interval: 0.54 },
    { deptKo: "세일즈 오퍼레이션", deptEn: "Sales Operations", sprite: "sales", key: "postit_mkt_fan", interval: 0.48 },
    { deptKo: "정보보안", deptEn: "InfoSec", sprite: "sec", key: "postit_sec_scan", interval: 0.6 },
    { deptKo: "데이터·분석", deptEn: "Data & Analytics", sprite: "data", key: "postit_data_grid", interval: 0.56 },
    { deptKo: "CS·온콜", deptEn: "CS / On-call", sprite: "cs", key: "postit_cs_ping", interval: 0.52 },
  ],
  mail: [
    { deptKo: "아웃바운드", deptEn: "Outbound SDR", sprite: "out", key: "mail_snake", interval: 0.38 },
    { deptKo: "리텐션 CRM", deptEn: "Retention CRM", sprite: "crm", key: "mail_dump", interval: 0.34 },
    { deptKo: "IT 알림봇", deptEn: "IT Alerts", sprite: "it", key: "mail_priority", interval: 0.3 },
    { deptKo: "마케팅 오토메이션", deptEn: "Marketing Automation", sprite: "mkt", key: "mail_nurture", interval: 0.36 },
  ],
  meeting: [
    { deptKo: "임원 싱크", deptEn: "Exec sync", sprite: "exec", key: "meeting_spin", interval: 0.42 },
    { deptKo: "PMO 위클리", deptEn: "PMO weekly", sprite: "pmo", key: "meeting_column", interval: 0.4 },
    { deptKo: "올핸즈", deptEn: "All-hands", sprite: "all", key: "meeting_breathe", interval: 0.44 },
    { deptKo: "디자인 크리틱", deptEn: "Design critique", sprite: "design", key: "meeting_crit", interval: 0.38 },
  ],
  report: [{ deptKo: "다이렉트 리포트", deptEn: "Direct report", sprite: "rep", key: "report_cycle", interval: 0.62 }],
  printer: [
    { deptKo: "오피스 인프라", deptEn: "Office IT / Infra", sprite: "infra", key: "printer_jam", interval: 0.26 },
    { deptKo: "문서실", deptEn: "Records / Doc room", sprite: "doc", key: "printer_toner", interval: 0.3 },
    { deptKo: "복합기 렌탈", deptEn: "MFD rental", sprite: "rental", key: "printer_duplex", interval: 0.28 },
  ],
  boss: [
    { deptKo: "Steering Committee", deptEn: "Steering Committee", sprite: "boss", key: "boss_mix", interval: 0.11 },
    { deptKo: "Board 준비", deptEn: "Board prep", sprite: "boss", key: "boss_mix", interval: 0.11 },
    { deptKo: "People Committee", deptEn: "People Committee", sprite: "boss", key: "boss_mix", interval: 0.11 },
  ],
  ticket: [
    { deptKo: "프로덕트 백로그", deptEn: "Product backlog", sprite: "pb", key: "ticket_backlog", interval: 0.52 },
    { deptKo: "애자일 코치", deptEn: "Agile coach", sprite: "ag", key: "ticket_sprint", interval: 0.48 },
    { deptKo: "테크 리드", deptEn: "Tech lead", sprite: "tl", key: "ticket_blocker", interval: 0.56 },
    { deptKo: "QA 회귀", deptEn: "QA regression", sprite: "qa", key: "ticket_reopen", interval: 0.5 },
  ],
  expense: [
    { deptKo: "재무 정산", deptEn: "Finance settlement", sprite: "fin", key: "expense_card", interval: 0.42 },
    { deptKo: "세무 검증", deptEn: "Tax review", sprite: "tax", key: "expense_vat", interval: 0.46 },
    { deptKo: "경영지원", deptEn: "Business support", sprite: "biz", key: "expense_rcpt", interval: 0.44 },
  ],
  slack: [
    { deptKo: "전사 공지 채널", deptEn: "Company-wide channel", sprite: "pub", key: "slack_here", interval: 0.38 },
    { deptKo: "프로젝트 채널", deptEn: "Project channel", sprite: "proj", key: "slack_thread", interval: 0.36 },
    { deptKo: "DM 봇", deptEn: "DM bot", sprite: "dm", key: "slack_dm", interval: 0.34 },
  ],
  approval: [
    { deptKo: "결재 라인", deptEn: "Approval chain", sprite: "chain", key: "appr_wait", interval: 0.58 },
    { deptKo: "임원 결재", deptEn: "Exec approval", sprite: "exe", key: "appr_reject", interval: 0.62 },
    { deptKo: "인감 관리", deptEn: "Seal custody", sprite: "seal", key: "appr_stamp", interval: 0.54 },
  ],
};

/**
 * @param {any} ctx
 * @param {Enemy} e
 * @param {Player} p
 * @param {number} ph game phaseIndex
 */
const FIRE = {
  postit_fin_drop(ctx, e, p) {
    for (let i = -1; i <= 1; i++) {
      pushB(ctx, e.x + i * 22, e.y + 12, i * 18, 320, "급여 반영", "PAY", { hue: 38 });
    }
  },
  postit_leg_wall(ctx, e, p) {
    const row = (Math.floor(e.patternT * 2) % 5) - 2;
    pushB(ctx, -40, e.y + 8 + row * 16, 520, 40, "레드라인", "RED", { hue: 0 });
    pushB(ctx, W + 40, e.y + 8 + row * 16, -520, 40, "반려 사유", "NO", { hue: 350 });
  },
  postit_eng_snipe(ctx, e, p) {
    const base = Math.atan2(p.y - e.y, p.x - e.x);
    for (let i = -2; i <= 2; i++) {
      const a = base + i * 0.12;
      pushB(ctx, e.x, e.y + 8, Math.cos(a) * 380, Math.sin(a) * 380, "핫픽스", "HOT", { hue: 200 });
    }
  },
  postit_hr_pulse(ctx, e, p) {
    const n = 8;
    const off = (e.patternT * 140) % 360;
    for (let i = 0; i < n; i++) {
      const a = ((i / n) * 360 + off) * (Math.PI / 180);
      pushB(ctx, e.x, e.y + 10, Math.cos(a) * 180, Math.sin(a) * 180, "1:1 캘박", "1:1", { hue: 300 });
    }
  },
  postit_mkt_fan(ctx, e, p) {
    const fan = 7;
    const mid = Math.atan2(p.y - e.y, p.x - e.x);
    for (let i = 0; i < fan; i++) {
      const a = mid - 0.55 + (i / (fan - 1)) * 1.1;
      pushB(ctx, e.x, e.y + 10, Math.cos(a) * 260, Math.sin(a) * 260, "리드 냉각", "SQL", { hue: 160 });
    }
  },
  postit_sec_scan(ctx, e, p) {
    const sx = ((e.patternT * 120) % (W + 160)) - 80;
    pushB(ctx, sx, e.y + 6, 0, 420, "MFA 리셋", "MFA", { hue: 210 });
    pushB(ctx, W - sx, e.y + 6, 0, 400, "감사 로그", "LOG", { hue: 220 });
  },
  postit_data_grid(ctx, e, p) {
    for (let gx = -2; gx <= 2; gx++) {
      pushB(ctx, e.x + gx * 28, e.y + 8, gx * 25, 300, "대시보드", "BI", { hue: 190 });
    }
  },
  postit_cs_ping(ctx, e, p) {
    const ang = rnd(0, Math.PI * 2);
    for (let k = 0; k < 6; k++) {
      const a = ang + (k / 6) * Math.PI * 2;
      pushB(ctx, e.x, e.y + 8, Math.cos(a) * 200, Math.sin(a) * 200 + 120, "온콜", "911", { hue: 25 });
    }
  },

  mail_snake(ctx, e, p) {
    const base = Math.atan2(p.y - e.y, p.x - e.x);
    const a = base + rnd(-0.2, 0.2);
    pushB(ctx, e.x, e.y + 14, Math.cos(a) * 200, Math.sin(a) * 200, "리드 스팸", "SPAM", { zig: 2.2, hue: 330 });
  },
  mail_dump(ctx, e, p) {
    for (let i = 0; i < 14; i++) {
      const a = rnd(0, Math.PI * 2);
      const sp = rnd(120, 280);
      pushB(ctx, e.x + rnd(-30, 30), e.y + 10, Math.cos(a) * sp, Math.sin(a) * sp + 80, "뉴스레터", "NL", { hue: 280 + (i % 5) * 8 });
    }
  },
  mail_priority(ctx, e, p) {
    for (const ox of [-50, 0, 50]) {
      pushB(ctx, e.x + ox, e.y + 12, rnd(-20, 20), 340, "P1 장애", "P1", { hue: 0 });
    }
  },
  mail_nurture(ctx, e, p) {
    for (let i = 0; i < 5; i++) {
      const t = (e.patternT * 3 + i * 0.4) % (Math.PI * 2);
      pushB(ctx, e.x + Math.cos(t) * 40, e.y + 10, Math.sin(t) * 180, 260, "드립 캠페인", "DRIP", { hue: 310 });
    }
  },

  meeting_spin(ctx, e, p, ph) {
    const n = 12;
    const off = e.patternT * (90 + ph * 25);
    for (let i = 0; i < n; i++) {
      const a = ((i / n) * 360 + off) * (Math.PI / 180);
      const sp = 240 + ph * 30;
      pushB(ctx, e.x, e.y + 24, Math.cos(a) * sp, Math.sin(a) * sp, "캘린더 초대", "CAL", { hue: 210 });
    }
  },
  meeting_column(ctx, e, p) {
    const cols = 6;
    for (let i = 0; i < cols; i++) {
      const x = (W / (cols + 1)) * (i + 1) + rnd(-15, 15);
      pushB(ctx, x, e.y + 10, rnd(-10, 10), 380, "데드라인", "DUE", { hue: 40 });
    }
  },
  meeting_breathe(ctx, e, p) {
    const sp = 200 + Math.sin(e.patternT * 5) * 90;
    const n = 10;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + e.patternT * 2;
      pushB(ctx, e.x, e.y + 24, Math.cos(a) * sp, Math.sin(a) * sp, "스탠드업", "SU", { hue: 175 });
    }
  },
  meeting_crit(ctx, e, p) {
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const vx = Math.cos(a) * 160;
      const vy = Math.sin(a) * 160 + 140;
      pushB(ctx, e.x, e.y + 20, vx, vy, "픽셀 푸시백", "PX", { hue: 265 });
    }
  },

  report_cycle(ctx, e, p) {
    const shot = e._repShot ?? 0;
    e._repShot = (shot + 1) % 4;
    if (shot === 0) {
      pushB(ctx, e.x - 18, e.y + 8, 0, 120, "휴가 신청", "PTO", { life: enemyBulletLife(0, 120) * 1.2, hue: 130 });
      pushB(ctx, e.x + 18, e.y + 8, 0, 120, "연차 잔여", "AL", { life: enemyBulletLife(0, 120) * 1.2, hue: 125 });
    } else if (shot === 1) {
      const sp = 290;
      pushB(ctx, e.x, e.y + 10, 0, sp, "병가 제출", "SICK", { hue: 140 });
      pushB(ctx, e.x, e.y + 10, sp, 0, "서류 첨부", "DOC", { hue: 145 });
      pushB(ctx, e.x, e.y + 10, -sp, 0, "진단서", "NOTE", { hue: 135 });
      pushB(ctx, e.x, e.y + 10, 0, -sp * 0.35, "회신 요청", "RE", { hue: 138 });
    } else if (shot === 2) {
      for (let i = -2; i <= 2; i++) {
        pushB(ctx, e.x + i * 16, e.y + 10, i * 35, 240, "재택 근무", "WFH", { zig: 1.8, hue: 195 });
      }
    } else {
      const base = Math.atan2(p.y - e.y, p.x - e.x);
      for (let k = 0; k < 3; k++) {
        const a = base + (k - 1) * 0.25;
        pushB(ctx, e.x, e.y + 8, Math.cos(a) * 420, Math.sin(a) * 420, "잠수 이력", "AWOL", { armTime: 0.85 + k * 0.08, hue: 240 });
      }
    }
  },

  printer_jam(ctx, e, p) {
    for (const ox of [-36, -12, 12, 36]) {
      pushB(ctx, e.x + ox, e.y + 32, rnd(-8, 8), 400, "용지 걸림", "JAM", { hue: 30 });
    }
  },
  printer_toner(ctx, e, p) {
    const arms = 9;
    for (let i = 0; i < arms; i++) {
      const a = (i / arms) * Math.PI * 2 + e.patternT * 2.5;
      pushB(ctx, e.x, e.y + 28, Math.cos(a) * 140, Math.sin(a) * 140 + 60, "토너 부족", "INK", { hue: 45 });
    }
  },
  printer_duplex(ctx, e, p) {
    const base = (e.patternT * 60) % 360;
    for (let side of [-1, 1]) {
      for (let i = 0; i < 4; i++) {
        const a = ((base + i * 22) * Math.PI) / 180;
        pushB(ctx, e.x + side * 8, e.y + 26, Math.cos(a) * 220 * side, Math.sin(a) * 220, "양면 인쇄", "2SIDE", { hue: 55 });
      }
    }
  },

  boss_mix(ctx, e, p, ph) {
    const seg = Math.floor(e.patternT * 1.2) % 5;
    if (seg === 0) {
      for (let w = 0; w < 4; w++) {
        const base = (e.patternT * 70 + w * 22) % 360;
        const a = (base * Math.PI) / 180;
        pushB(ctx, e.x, e.y + 40, Math.cos(a) * 210, Math.sin(a) * 210, "싱크 재조정", "SYNC", { hue: 280 });
      }
    } else if (seg === 1) {
      for (let x = 60; x < W; x += 70) {
        pushB(ctx, x, e.y + 20, 0, 360, "전사 공지", "ALL", { hue: 260 });
      }
    } else if (seg === 2) {
      const base = Math.atan2(p.y - e.y, p.x - e.x);
      for (let i = -4; i <= 4; i++) {
        const a = base + i * 0.11;
        pushB(ctx, e.x, e.y + 36, Math.cos(a) * 300, Math.sin(a) * 300, "액션 아이템", "AI", { hue: 300 });
      }
    } else if (seg === 3) {
      const n = 16;
      const off = e.patternT * 100;
      for (let i = 0; i < n; i++) {
        const a = ((i / n) * 360 + off) * (Math.PI / 180);
        pushB(ctx, e.x, e.y + 36, Math.cos(a) * 280, Math.sin(a) * 280, "야근 싱크", "OT", { hue: 320 });
      }
    } else {
      for (let i = 0; i < 6; i++) {
        pushB(ctx, e.x + rnd(-20, 20), e.y + 40, rnd(-80, 80), 320, "리오픈", "REOP", { zig: 1.2, hue: 340 });
      }
    }
  },

  ticket_backlog(ctx, e, p) {
    for (let gx = -2; gx <= 2; gx++) {
      pushB(ctx, e.x + gx * 22, e.y + 10, gx * 28, 260, "백로그", "BLG", { hue: 265 });
    }
  },
  ticket_sprint(ctx, e, p) {
    const base = Math.atan2(p.y - e.y, p.x - e.x);
    for (let i = -2; i <= 2; i++) {
      const a = base + i * 0.19;
      pushB(ctx, e.x, e.y + 10, Math.cos(a) * 280, Math.sin(a) * 280 + 45, "스프린트", "SPR", { hue: 155 });
    }
  },
  ticket_blocker(ctx, e, p) {
    pushB(ctx, e.x - 38, e.y + 12, 210, 85, "블로커", "BLK", { hue: 5 });
    pushB(ctx, e.x + 38, e.y + 12, -210, 85, "의존성", "DEP", { hue: 18 });
  },
  ticket_reopen(ctx, e, p) {
    for (let i = 0; i < 7; i++) {
      const a = rnd(0, Math.PI * 2);
      pushB(ctx, e.x + rnd(-22, 22), e.y + 10, Math.cos(a) * 170, Math.sin(a) * 170 + 95, "리오픈", "REOP", { zig: 1.45, hue: 285 });
    }
  },

  expense_card(ctx, e, p) {
    for (let i = 0; i < 5; i++) {
      pushB(ctx, e.x + rnd(-18, 18), e.y + 10, rnd(-35, 35), 305, "법인카드", "CARD", { hue: 48, zig: 1.15 });
    }
  },
  expense_vat(ctx, e, p) {
    const n = 8;
    const off = e.patternT * 82;
    for (let i = 0; i < n; i++) {
      const a = ((i / n) * 360 + off) * (Math.PI / 180);
      pushB(ctx, e.x, e.y + 14, Math.cos(a) * 175, Math.sin(a) * 175 + 65, "부가세", "VAT", { hue: 85 });
    }
  },
  expense_rcpt(ctx, e, p) {
    const base = Math.atan2(p.y - e.y, p.x - e.x);
    pushB(ctx, e.x, e.y + 12, Math.cos(base) * 215, Math.sin(base) * 215, "영수증", "RCP", { hue: 72 });
    pushB(ctx, e.x, e.y + 12, Math.cos(base + 0.42) * 195, Math.sin(base + 0.42) * 195, "첨부 요청", "ATT", { hue: 68 });
  },

  slack_here(ctx, e, p) {
    for (const ox of [-52, -26, 0, 26, 52]) {
      pushB(ctx, e.x + ox, e.y + 12, rnd(-14, 14), 335, "@channel", "HERE", { hue: 328 });
    }
  },
  slack_thread(ctx, e, p) {
    const cols = 5;
    for (let i = 0; i < cols; i++) {
      const x = (W / (cols + 1)) * (i + 1) + rnd(-12, 12);
      pushB(ctx, x, e.y + 10, rnd(-18, 18), 315, "스레드", "THR", { hue: 292 });
    }
  },
  slack_dm(ctx, e, p) {
    const fan = 6;
    const mid = Math.atan2(p.y - e.y, p.x - e.x);
    for (let i = 0; i < fan; i++) {
      const a = mid - 0.44 + (i / (fan - 1)) * 0.88;
      pushB(ctx, e.x, e.y + 10, Math.cos(a) * 235, Math.sin(a) * 235, "DM 폭주", "DM", { hue: 305 });
    }
  },

  appr_wait(ctx, e, p) {
    for (let i = -3; i <= 3; i++) {
      pushB(ctx, e.x + i * 23, e.y + 10, i * 17, 255, "결재 대기", "WAIT", { hue: 32 });
    }
  },
  appr_reject(ctx, e, p) {
    pushB(ctx, e.x - 28, e.y + 12, 250, 65, "반려", "NO", { hue: 0 });
    pushB(ctx, e.x + 28, e.y + 12, -250, 65, "재상신", "RESUB", { hue: 12 });
  },
  appr_stamp(ctx, e, p) {
    const n = 10;
    const off = e.patternT * 108;
    for (let i = 0; i < n; i++) {
      const a = ((i / n) * 360 + off) * (Math.PI / 180);
      pushB(ctx, e.x, e.y + 20, Math.cos(a) * 195, Math.sin(a) * 195 + 85, "도장", "STAMP", { hue: 42 });
    }
  },
};

/** @param {string} kind */
function enemyMaxHp(kind) {
  switch (kind) {
    case "boss":
      return 520;
    case "printer":
      return 220;
    case "meeting":
      return 28;
    case "approval":
      return 17;
    case "report":
      return 16;
    case "ticket":
      return 11;
    case "mail":
      return 5;
    case "expense":
      return 6;
    case "slack":
      return 7;
    case "postit":
      return 2;
    default:
      return 2;
  }
}

function circleHit(ax, ay, ar, bx, by, br) {
  return len(ax - bx, ay - by) < ar + br;
}

class Player {
  constructor() {
    this.x = W / 2;
    this.y = H - 120;
    const prm = typeof window.OfficeWarAssets?.playerRadiusMul === "function" ? window.OfficeWarAssets.playerRadiusMul() : 1;
    this.r = Math.round(16 * ENTITY_SCALE * prm);
    this.speed = 5.2;
    this.shootCd = 0;
    this.invuln = 0;
    this.focus = false;
    /** @type {"m"|"f"} */
    this.gender = "m";
  }

  update(keys, dt) {
    let mx = 0;
    let my = 0;
    if (keys.left) mx -= 1;
    if (keys.right) mx += 1;
    if (keys.up) my -= 1;
    if (keys.down) my += 1;
    if (mx || my) {
      const n = len(mx, my);
      mx /= n;
      my /= n;
    }
    const sp = this.speed * (keys.focus ? 0.62 : 1);
    this.x = clamp(this.x + mx * sp, 40, W - 40);
    this.y = clamp(this.y + my * sp, 80, H - 60);
    this.shootCd = Math.max(0, this.shootCd - dt);
    this.invuln = Math.max(0, this.invuln - dt);
  }
}

class Bullet {
  /**
   * @param {{ life?: number; label?: string; labelShort?: string }} [opts]
   */
  constructor(x, y, vx, vy, r, damage, ally, hue, opts = {}) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.r = r;
    this.damage = damage;
    this.ally = ally;
    this.hue = hue;
    this.life = ally ? 1.2 : opts.life ?? enemyBulletLife(vx, vy);
    this.label = opts.label ?? "";
    this.labelEn = opts.labelEn ?? this.label;
    this.labelShort = opts.labelShort ?? "";
    this.shortEn = opts.shortEn ?? this.labelShort;
    this.style = opts.style ?? (ally ? "ally" : "doc");
    this.armTime = opts.armTime ?? 0;
    this.zig = opts.zig ?? 0;
    this._zigPh = rnd(0, Math.PI * 2);
  }

  update(dt) {
    if (this.armTime > 0) this.armTime -= dt;
    this._zigPh += dt * 12;
    this.x += Math.sin(this._zigPh) * this.zig * 95 * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt;
  }
}

class Particle {
  constructor(x, y, vx, vy, life, color) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.life = life;
    this.max = life;
    this.color = color;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vy += 40 * dt;
    this.life -= dt;
  }
}

class Enemy {
  /**
   * @param {"postit"|"mail"|"meeting"|"report"|"ticket"|"expense"|"slack"|"approval"|"printer"|"boss"} kind
   */
  constructor(kind, x, y, extra = {}) {
    this.kind = kind;
    this.x = x;
    this.y = y;
    this.extra = extra;
    this.hp = 1;
    this.r = Math.round(18 * ENTITY_SCALE);
    this.vx = 0;
    this.vy = 40;
    this.shootAcc = 0;
    this.patternT = 0;
    this.score = 100;
    this.entered = false;
    this.skin = pick(["#fdba74", "#fca5a5", "#fcd34d", "#fbcfe8", "#bae6fd", "#c4b5fd"]);
    this.cheek = pick(["#fda4af", "#fb7185"]);

    if (kind === "postit") {
      this.hp = 2;
      this.r = Math.round(16 * ENTITY_SCALE);
      this.vy = rnd(55, 95);
      this.vx = rnd(-25, 25);
      this.score = 120;
    } else if (kind === "mail") {
      this.hp = 5;
      this.r = Math.round(20 * ENTITY_SCALE);
      this.vy = 45;
      this.score = 280;
    } else if (kind === "meeting") {
      this.hp = 28;
      this.r = Math.round(32 * ENTITY_SCALE);
      this.vy = 22;
      this.score = 900;
    } else if (kind === "report") {
      this.hp = 16;
      this.r = Math.round(22 * ENTITY_SCALE);
      this.vy = 26;
      this.score = 640;
    } else if (kind === "ticket") {
      this.hp = 11;
      this.r = Math.round(20 * ENTITY_SCALE);
      this.vy = 30;
      this.score = 460;
    } else if (kind === "expense") {
      this.hp = 6;
      this.r = Math.round(19 * ENTITY_SCALE);
      this.vy = 44;
      this.score = 310;
    } else if (kind === "slack") {
      this.hp = 7;
      this.r = Math.round(18 * ENTITY_SCALE);
      this.vy = 50;
      this.score = 330;
    } else if (kind === "approval") {
      this.hp = 17;
      this.r = Math.round(24 * ENTITY_SCALE);
      this.vy = 23;
      this.score = 780;
    } else if (kind === "printer") {
      this.hp = 220;
      this.r = Math.round(44 * ENTITY_SCALE);
      this.vy = 18;
      this.score = 4500;
    } else if (kind === "boss") {
      this.hp = 520;
      this.r = Math.round(52 * ENTITY_SCALE);
      this.vy = 10;
      this.score = 12000;
    }

    const list = ARCHETYPES[kind];
    const ar = list[(Math.random() * list.length) | 0];
    this.deptKo = ar.deptKo;
    this.deptEn = ar.deptEn;
    this.sprite = ar.sprite;
    this.fireKey = ar.key;
    this.fireInterval = ar.interval;
    this.canShoot = extra.canShoot !== false;
  }

  update(dt, ctx) {
    this.patternT += dt;
    if (!this.entered && this.y > -this.r + 40) this.entered = true;

    if (this.kind === "postit") {
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.vx *= 0.985;
    } else if (this.kind === "mail") {
      this.x += Math.sin(this.patternT * 2.2) * 70 * dt;
      this.y += this.vy * dt;
    } else if (this.kind === "meeting") {
      this.x += Math.sin(this.patternT * 1.4) * 40 * dt;
      this.y += this.vy * dt;
    } else if (this.kind === "report") {
      this.x += Math.sin(this.patternT * 1.85) * 55 * dt;
      this.y += this.vy * dt;
    } else if (this.kind === "ticket") {
      this.x += Math.sin(this.patternT * 1.78) * 52 * dt;
      this.y += this.vy * dt;
    } else if (this.kind === "expense") {
      this.x += Math.sin(this.patternT * 2.35) * 68 * dt;
      this.y += this.vy * dt;
    } else if (this.kind === "slack") {
      this.x += Math.sin(this.patternT * 3.5) * 88 * dt;
      this.y += this.vy * dt;
    } else if (this.kind === "approval") {
      this.x += Math.sin(this.patternT * 1.48) * 36 * dt;
      this.y += this.vy * dt;
    } else if (this.kind === "printer") {
      this.x += (ctx.player.x - this.x) * 0.35 * dt;
      this.y += this.vy * dt;
      this.x = clamp(this.x, 90, W - 90);
    } else if (this.kind === "boss") {
      const phase = ctx.phaseT;
      this.x = W / 2 + Math.sin(phase * 0.9) * 200;
      this.y = 140 + Math.sin(phase * 1.7) * 18;
    }

    this.shootAcc += dt;
    const p = ctx.player;
    if (!this.entered || !this.canShoot) return;
    const fireMul = ctx.stage?.fireMul ?? 1;
    const interval = this.fireInterval * fireMul;
    if (this.shootAcc < interval) return;
    this.shootAcc = 0;
    const fn = FIRE[this.fireKey];
    if (fn) fn(ctx, this, p, ctx.stageIndex ?? 0);
  }
}

/** @param {CanvasRenderingContext2D} c */
function pixarEyes(c, cx, cy, scl, lookX, lookY) {
  for (const side of [-1, 1]) {
    c.save();
    c.translate(cx + side * 7.5 * scl, cy);
    const ew = 5.2 * scl;
    const eh = 7 * scl;
    c.fillStyle = "#fffbeb";
    c.beginPath();
    c.ellipse(0, 0, ew, eh, 0, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = "rgba(15,23,42,0.32)";
    c.lineWidth = 1.1;
    c.stroke();
    const iris = c.createRadialGradient(lookX * 0.4, lookY * 0.35, 0, 0, 0, eh);
    iris.addColorStop(0, "#7dd3fc");
    iris.addColorStop(0.55, "#0284c7");
    iris.addColorStop(1, "#0c4a6e");
    c.fillStyle = iris;
    c.beginPath();
    c.ellipse(lookX * 0.12, lookY * 0.1, ew * 0.5, eh * 0.52, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "#0f172a";
    c.beginPath();
    c.arc(lookX * 0.18, lookY * 0.12, ew * 0.26, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "rgba(255,255,255,0.95)";
    c.beginPath();
    c.arc(-ew * 0.28, -eh * 0.32, ew * 0.16, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }
}

function pixarSmile(c, cy) {
  c.strokeStyle = "rgba(15,23,42,0.42)";
  c.lineWidth = 1.7;
  c.lineCap = "round";
  c.beginPath();
  c.arc(0, cy - 2, 8, 0.2 * Math.PI, 0.8 * Math.PI);
  c.stroke();
}

/** @param {CanvasRenderingContext2D} c @param {number} cx @param {number} cy @param {string} dept */
function deptChip(c, cx, cy, dept) {
  const t = dept.length > 34 ? dept.slice(0, 32) + "…" : dept;
  c.save();
  c.translate(cx, cy);
  c.font = "800 7px 'Noto Sans KR',Inter,system-ui,sans-serif";
  const w = Math.min(118, Math.max(72, c.measureText(t).width + 14));
  roundRect(c, -w / 2, -8, w, 16, 5);
  const g = c.createLinearGradient(-w / 2, 0, w / 2, 0);
  g.addColorStop(0, "rgba(255,255,255,0.95)");
  g.addColorStop(1, "rgba(226,232,240,0.92)");
  c.fillStyle = g;
  c.fill();
  c.strokeStyle = "rgba(15,23,42,0.28)";
  c.lineWidth = 1.2;
  c.stroke();
  c.fillStyle = "rgba(15,23,42,0.9)";
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.fillText(t, 0, 0);
  c.restore();
}

/**
 * Small prop so each archetype reads as a role, not a generic blob.
 * @param {CanvasRenderingContext2D} c
 * @param {string} kind
 * @param {string} sprite
 */
function drawEnemyRoleAccent(c, kind, sprite, patternT) {
  c.save();
  c.translate(18, -26);
  if (kind === "postit") {
    if (sprite === "fin") {
      c.fillStyle = "#facc15";
      c.beginPath();
      c.arc(0, 0, 7, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = "#a16207";
      c.lineWidth = 1.2;
      c.stroke();
      c.fillStyle = "#713f12";
      c.font = "800 8px system-ui,sans-serif";
      c.textAlign = "center";
      c.fillText("₩", 0, 1);
    } else if (sprite === "legal") {
      c.fillStyle = "#7f1d1d";
      roundRect(c, -8, -6, 16, 12, 2);
      c.fill();
      c.fillStyle = "#fecaca";
      c.font = "700 7px system-ui,sans-serif";
      c.textAlign = "center";
      c.fillText("§", 0, 1);
    } else if (sprite === "dev") {
      c.strokeStyle = "#15803d";
      c.lineWidth = 2;
      c.strokeRect(-8, -7, 16, 14);
      c.fillStyle = "#22c55e";
      c.font = "800 9px ui-monospace,monospace";
      c.textAlign = "center";
      c.fillText("</>", 0, 2);
    } else if (sprite === "hr") {
      c.fillStyle = "#fff";
      roundRect(c, -7, -8, 14, 16, 2);
      c.fill();
      c.strokeStyle = "#64748b";
      c.stroke();
      c.strokeStyle = "#334155";
      c.lineWidth = 1.2;
      c.beginPath();
      c.moveTo(-4, -3);
      c.lineTo(4, -3);
      c.moveTo(-4, 1);
      c.lineTo(4, 1);
      c.moveTo(-4, 5);
      c.lineTo(2, 5);
      c.stroke();
    } else if (sprite === "sales") {
      c.strokeStyle = "#0ea5e9";
      c.lineWidth = 2;
      c.beginPath();
      c.arc(0, -2, 6, 0.2 * Math.PI, 1.2 * Math.PI);
      c.stroke();
      c.beginPath();
      c.moveTo(4, 2);
      c.lineTo(8, 6);
      c.stroke();
    } else if (sprite === "sec") {
      c.fillStyle = "#1e3a8a";
      c.beginPath();
      c.moveTo(0, -8);
      c.lineTo(7, -3);
      c.lineTo(4, 8);
      c.lineTo(-4, 8);
      c.lineTo(-7, -3);
      c.closePath();
      c.fill();
      c.fillStyle = "#fde047";
      c.font = "800 8px system-ui,sans-serif";
      c.textAlign = "center";
      c.fillText("!", 0, 2);
    } else if (sprite === "data") {
      for (let i = 0; i < 3; i++) {
        const h = 4 + i * 3;
        c.fillStyle = i === 2 ? "#38bdf8" : "#94a3b8";
        c.fillRect(-8 + i * 5, 4 - h, 3, h);
      }
    } else if (sprite === "cs") {
      c.strokeStyle = "#6366f1";
      c.lineWidth = 2;
      c.beginPath();
      c.arc(0, 0, 7, 0.35 * Math.PI, 1.65 * Math.PI);
      c.stroke();
      c.beginPath();
      c.moveTo(-5, 5);
      c.quadraticCurveTo(0, 10, 5, 5);
      c.stroke();
    } else {
      c.fillStyle = "rgba(234,88,12,0.9)";
      c.beginPath();
      c.moveTo(0, -7);
      c.lineTo(6, 6);
      c.lineTo(-6, 6);
      c.closePath();
      c.fill();
    }
  } else if (kind === "mail") {
    c.translate(-36, 4);
    if (sprite === "out") {
      c.fillStyle = "#f97316";
      c.beginPath();
      c.moveTo(0, -6);
      c.lineTo(8, 0);
      c.lineTo(0, 6);
      c.fill();
    } else if (sprite === "crm") {
      c.fillStyle = "#ec4899";
      c.beginPath();
      c.moveTo(0, 2);
      c.bezierCurveTo(-8, -6, 8, -6, 0, 2);
      c.fill();
    } else if (sprite === "it") {
      c.strokeStyle = "#eab308";
      c.lineWidth = 2;
      c.beginPath();
      c.arc(0, 0, 6, 0.3 * Math.PI, 1.7 * Math.PI);
      c.stroke();
      c.beginPath();
      c.moveTo(4, 3);
      c.lineTo(9, 7);
      c.stroke();
    } else if (sprite === "mkt") {
      c.strokeStyle = "#22c55e";
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(-6, 4);
      c.lineTo(-2, 0);
      c.lineTo(2, 4);
      c.lineTo(6, -4);
      c.stroke();
    } else {
      c.fillStyle = "#64748b";
      c.fillRect(-6, -5, 12, 10);
    }
  } else if (kind === "report") {
    c.translate(-20, -40);
    c.fillStyle = "#1d4ed8";
    c.font = "800 8px system-ui,sans-serif";
    c.textAlign = "center";
    c.fillText(sprite === "rep" ? "1:1" : "IC", 0, 0);
  } else if (kind === "printer") {
    c.translate(-40, -40);
    c.fillStyle = "#ef4444";
    c.font = "800 8px system-ui,sans-serif";
    c.textAlign = "center";
    const lab = sprite === "doc" ? "INK" : sprite === "rental" ? "2in1" : "JAM";
    c.fillText(lab, 0, 0);
  } else if (kind === "ticket") {
    c.translate(-20, -38);
    if (sprite === "pb") {
      for (let i = 0; i < 3; i++) {
        c.fillStyle = i === 1 ? "#22c55e" : "#94a3b8";
        c.fillRect(-10 + i * 7, -4, 5, 12);
      }
    } else if (sprite === "ag") {
      c.strokeStyle = "#d97706";
      c.lineWidth = 2;
      c.strokeRect(-9, -7, 18, 14);
      c.fillStyle = "#d97706";
      c.font = "800 8px ui-monospace,monospace";
      c.textAlign = "center";
      c.fillText("2wk", 0, 3);
    } else if (sprite === "tl") {
      c.fillStyle = "#dc2626";
      c.beginPath();
      c.moveTo(0, -8);
      c.lineTo(7, 6);
      c.lineTo(-7, 6);
      c.closePath();
      c.fill();
    } else {
      c.fillStyle = "#6366f1";
      c.fillRect(-8, -6, 16, 12);
      c.fillStyle = "#fff";
      c.font = "800 7px system-ui,sans-serif";
      c.textAlign = "center";
      c.fillText("QA", 0, 2);
    }
  } else if (kind === "expense") {
    c.translate(-30, 4);
    if (sprite === "fin") {
      c.fillStyle = "#0ea5e9";
      c.beginPath();
      c.arc(0, 0, 7, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#fff";
      c.font = "800 8px system-ui,sans-serif";
      c.textAlign = "center";
      c.fillText("₩", 0, 2);
    } else if (sprite === "tax") {
      c.fillStyle = "#16a34a";
      roundRect(c, -8, -6, 16, 12, 2);
      c.fill();
      c.fillStyle = "#fff";
      c.font = "800 7px system-ui,sans-serif";
      c.textAlign = "center";
      c.fillText("10%", 0, 2);
    } else {
      c.fillStyle = "#f59e0b";
      roundRect(c, -7, -8, 14, 16, 2);
      c.fill();
      c.fillStyle = "#78350f";
      c.font = "700 8px system-ui,sans-serif";
      c.textAlign = "center";
      c.fillText("R", 0, 2);
    }
  } else if (kind === "slack") {
    c.translate(-34, -6);
    if (sprite === "pub") {
      c.fillStyle = "#ec4899";
      c.font = "800 10px system-ui,sans-serif";
      c.textAlign = "center";
      c.fillText("@", 0, 2);
    } else if (sprite === "proj") {
      c.strokeStyle = "#8b5cf6";
      c.lineWidth = 2;
      c.strokeRect(-8, -7, 16, 14);
      c.fillStyle = "#8b5cf6";
      c.font = "700 7px ui-monospace,monospace";
      c.textAlign = "center";
      c.fillText("#p", 0, 3);
    } else {
      c.fillStyle = "#3b82f6";
      roundRect(c, -8, -6, 16, 12, 3);
      c.fill();
      c.fillStyle = "#fff";
      c.font = "800 7px system-ui,sans-serif";
      c.textAlign = "center";
      c.fillText("DM", 0, 2);
    }
  } else if (kind === "approval") {
    c.translate(-22, -40);
    if (sprite === "chain") {
      c.strokeStyle = "#b45309";
      c.lineWidth = 2;
      c.beginPath();
      c.arc(-4, 0, 4, 0, Math.PI * 2);
      c.stroke();
      c.beginPath();
      c.arc(4, 0, 4, 0, Math.PI * 2);
      c.stroke();
    } else if (sprite === "exe") {
      c.fillStyle = "#991b1b";
      roundRect(c, -8, -6, 16, 12, 2);
      c.fill();
      c.fillStyle = "#fecaca";
      c.font = "800 8px system-ui,sans-serif";
      c.textAlign = "center";
      c.fillText("✕", 0, 2);
    } else {
      c.fillStyle = "#b91c1c";
      c.beginPath();
      c.arc(0, 0, 8, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#fde68a";
      c.font = "800 7px system-ui,sans-serif";
      c.textAlign = "center";
      c.fillText("印", 0, 2);
    }
  } else if (kind === "boss") {
    c.translate(0, -54);
    c.fillStyle = "#fbbf24";
    c.font = "800 11px system-ui,sans-serif";
    c.textAlign = "center";
    c.fillText("★", 0, 0);
  }
  c.restore();
}

class Game {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {{
   *   onHud: (s: HudState) => void;
   *   onToast: (msg: string, ms: number) => void;
   *   onGameEnd?: (payload: { outcome: "win" | "lose"; score: number; kills: Record<string, number> }) => void;
   * }} hooks
   */
  constructor(canvas, hooks) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) {
      throw new Error("Canvas 2D 컨텍스트를 만들 수 없습니다. 브라우저를 확인해 주세요.");
    }
    this.ctx2d = ctx;
    this.hooks = hooks;
    this.running = false;
    this.paused = false;
    /** @type {"m"|"f"} */
    this.playerGender = "m";
    this.time = 0;
    this.score = 0;
    this.lives = 3;
    this.bombs = 2;
    this.stageTimer = 0;
    this.spawnAcc = 0;
    this.stageIndex = 0;
    this.phaseT = 0;
    this.printerSpawned = false;
    this.bossSpawned = false;
    this._assetsReady = false;
    window.OfficeWarAssets?.init?.().then(() => {
      this._assetsReady = true;
    });
    this.player = new Player();
    this.keys = {
      left: false,
      right: false,
      up: false,
      down: false,
      fire: false,
      bomb: false,
      focus: false,
    };
    this.playerBullets = /** @type {Bullet[]} */ ([]);
    this.enemyBullets = /** @type {Bullet[]} */ ([]);
    this.enemies = /** @type {Enemy[]} */ ([]);
    this.particles = /** @type {Particle[]} */ ([]);
    /** @type {PlayerWeaponMode} */
    this.playerWeaponMode = "default";
    /** @type {{ x: number; y: number; vy: number; r: number; life: number; weapon: "keyboard"|"mouse"|"papers"|"docs" }[]} */
    this.weaponPickups = [];
    this._bombEdge = false;
    this.pointer = { ax: 0, ay: 0, fire: false };
    /** @type {"ko"|"en"} */
    this.lang = "ko";

    /** @type {Record<string, number>} */
    this.killCounts = emptyKillCounts();
    this._onKeyDown = (e) => this.handleKey(e, true);
    this._onKeyUp = (e) => this.handleKey(e, false);
    window.addEventListener("keydown", this._onKeyDown, { passive: false });
    window.addEventListener("keyup", this._onKeyUp);
  }

  getStage() {
    return STAGES[this.stageIndex] ?? STAGES[0];
  }

  get phaseLabel() {
    const st = this.getStage();
    const name = this.t(st.labelKey);
    const hour = this.lang === "en" ? st.hourEn : st.hourKo;
    return `${hour} · ${name}`;
  }

  /** @param {"ko"|"en"} l */
  setLang(l) {
    this.lang = l === "en" ? "en" : "ko";
    this.pushHud();
  }

  getLang() {
    return this.lang;
  }

  getLocale() {
    return this.lang === "en" ? "en-US" : "ko-KR";
  }

  weaponHudLabelKey() {
    const /** @type {Record<PlayerWeaponMode, string>} */ m = {
      default: "weaponHudDefault",
      keyboard: "weaponHudKeyboard",
      mouse: "weaponHudMouse",
      papers: "weaponHudPapers",
      docs: "weaponHudDocs",
    };
    return m[this.playerWeaponMode] || "weaponHudDefault";
  }

  /** @param {string} key */
  t(key) {
    const pack = window.OfficeWarI18n?.[this.lang] ?? window.OfficeWarI18n?.ko ?? {};
    const ko = window.OfficeWarI18n?.ko ?? {};
    return pack[key] ?? ko[key] ?? key;
  }

  /** @param {Enemy} e */
  deptFor(e) {
    return this.lang === "en" ? e.deptEn : e.deptKo;
  }

  softEnemyCount() {
    return this.enemies.filter((e) => e.hp > 0 && e.kind !== "boss" && e.kind !== "printer").length;
  }

  enemyCap() {
    const st = this.getStage();
    if (st.finalBoss && this.bossSpawned) return 4;
    return stageEnemyCap(st, this.stageTimer);
  }

  spawnCooldown() {
    const st = this.getStage();
    const ramp = Math.max(0.45, st.spawnCd - this.stageTimer * 0.008);
    return ramp;
  }

  advanceStage() {
    if (this.stageIndex >= STAGE_COUNT - 1) return;
    this.stageIndex += 1;
    this.stageTimer = 0;
    this.printerSpawned = false;
    this.bossSpawned = false;
    this.enemyBullets.length = 0;
    const st = this.getStage();
    this.hooks.onToast(`${this.t("toastStage")} — ${this.t(st.labelKey)}`, 2200);
    this.pushHud();
  }

  tryStageEvents() {
    const st = this.getStage();
    if (st.printerBoss && !this.printerSpawned && this.stageTimer >= st.duration * 0.72) {
      if (!this.enemies.some((e) => e.kind === "printer")) {
        this.enemies.push(new Enemy("printer", W / 2, -90, { canShoot: true }));
        this.printerSpawned = true;
        this.hooks.onToast(this.t("toastPrinter"), 2000);
      }
      return;
    }
    if (st.finalBoss && !this.bossSpawned && this.stageTimer >= st.duration * 0.55) {
      if (!this.enemies.some((e) => e.kind === "boss")) {
        this.spawnBoss();
        this.bossSpawned = true;
        this.hooks.onToast(this.t("toastBoss"), 2600);
      }
      return;
    }
    if (this.stageTimer < st.duration) return;
    if (st.printerBoss && this.enemies.some((e) => e.kind === "printer" && e.hp > 0)) return;
    if (st.finalBoss && !this.bossSpawned) {
      this.spawnBoss();
      this.bossSpawned = true;
      this.hooks.onToast(this.t("toastBoss"), 2600);
      return;
    }
    if (st.finalBoss) return;
    this.hooks.onToast(this.t("toastStageClear"), 1400);
    this.advanceStage();
  }

  handleKey(e, down) {
    const k = e.code;
    if (down && this.running && !this.paused) {
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space"].includes(k)) {
        e.preventDefault();
      }
    }
    if (["ArrowLeft", "KeyA"].includes(k)) this.keys.left = down;
    if (["ArrowRight", "KeyD"].includes(k)) this.keys.right = down;
    if (["ArrowUp", "KeyW"].includes(k)) this.keys.up = down;
    if (["ArrowDown", "KeyS"].includes(k)) this.keys.down = down;
    if (["KeyZ", "Space"].includes(k)) this.keys.fire = down;
    if (k === "KeyX") this.keys.bomb = down;
    if (k === "ShiftLeft" || k === "ShiftRight") this.keys.focus = down;
  }

  setPointerAxes(ax, ay) {
    this.pointer.ax = clamp(ax, -1, 1);
    this.pointer.ay = clamp(ay, -1, 1);
  }

  setPointerFire(on) {
    this.pointer.fire = !!on;
  }

  triggerTouchBomb() {
    if (!this.running || this.paused) return;
    if (this.bombs > 0) this.useBomb();
  }

  setPlayerGender(g) {
    this.playerGender = g === "f" ? "f" : "m";
  }

  bulletCaption(b) {
    if (this.lang === "en") {
      const s = String(b.labelEn || b.shortEn || b.labelShort || "?");
      return s.length > 14 ? s.slice(0, 13) + "…" : s;
    }
    const ko = b.label || "";
    if (ko.length <= 10) return ko || b.labelShort || "?";
    return b.labelShort || ko.slice(0, 9) + "…";
  }

  start() {
    if (this._raf) {
      cancelAnimationFrame(this._raf);
      this._raf = 0;
    }
    this.running = true;
    this.paused = false;
    this.time = 0;
    this.score = 0;
    this.lives = 3;
    this.bombs = 2;
    this.stageTimer = 0;
    this.spawnAcc = 0;
    this.stageIndex = 0;
    this.phaseT = 0;
    this.printerSpawned = false;
    this.bossSpawned = false;
    this.player = new Player();
    this.player.gender = this.playerGender;
    this.playerBullets.length = 0;
    this.enemyBullets.length = 0;
    this.enemies.length = 0;
    this.particles.length = 0;
    this.playerWeaponMode = "default";
    this.weaponPickups.length = 0;
    this.pointer.ax = 0;
    this.pointer.ay = 0;
    this.pointer.fire = false;
    this._last = undefined;
    this.killCounts = emptyKillCounts();
    this.hooks.onToast(this.t("toastStart"), 2200);
    this.pushHud();
    this.loop();
  }

  togglePause() {
    this.paused = !this.paused;
    if (this.paused) {
      this.pointer.ax = 0;
      this.pointer.ay = 0;
      this.pointer.fire = false;
      this.hooks.onToast(this.t("toastPause"), 1200);
    }
  }

  pushHud() {
    this.hooks.onHud({
      phaseLabel: this.phaseLabel,
      score: this.score,
      lives: this.lives,
      bombs: this.bombs,
      stageNum: this.stageIndex + 1,
      stageTotal: STAGE_COUNT,
      weaponLabel: this.t(this.weaponHudLabelKey()),
    });
  }

  gameOver() {
    this.running = false;
    if (this._raf) {
      cancelAnimationFrame(this._raf);
      this._raf = 0;
    }
    this._last = undefined;
    this.pointer.ax = 0;
    this.pointer.ay = 0;
    this.pointer.fire = false;
    const kills = { ...this.killCounts };
    this.hooks.onGameEnd?.({ outcome: "lose", score: this.score, kills });
  }

  loop() {
    const now = performance.now();
    if (!this._last) this._last = now;
    let dt = (now - this._last) / 1000;
    this._last = now;
    dt = clamp(dt, 0, 0.05);

    if (this.running && !this.paused) this.update(dt);
    this.render();

    if (this.running || this.paused) {
      this._raf = requestAnimationFrame(() => this.loop());
    } else {
      this._raf = 0;
    }
  }

  update(dt) {
    this.time += dt;
    this.phaseT += dt;
    this.stageTimer += dt;
    this.tryStageEvents();

    this.spawnAcc += dt;
    const cd = this.spawnCooldown();
    const st = this.getStage();
    if (!st.finalBoss || !this.bossSpawned) {
      if (this.spawnAcc >= cd) {
        this.spawnAcc = 0;
        if (this.softEnemyCount() < this.enemyCap()) this.spawnWave();
      }
    }

    const p = this.player;
    const pk = { ...this.keys };
    const ax = this.pointer.ax;
    const ay = this.pointer.ay;
    if (Math.hypot(ax, ay) > 0.08) {
      pk.left = pk.left || ax < -0.22;
      pk.right = pk.right || ax > 0.22;
      pk.up = pk.up || ay < -0.22;
      pk.down = pk.down || ay > 0.22;
    }
    p.update(pk, dt);

    const firing = pk.fire || this.pointer.fire;
    if (firing && p.shootCd <= 0) {
      const power = 1 + Math.min(3, Math.floor(this.score / 8000));
      const wMode = this.playerWeaponMode;
      /** @type {{ bx: number; by: number; vx: number; vy: number; r: number; dmg: number; hue: number; style?: string; zig?: number }[]} */
      const shots = [];

      if (wMode === "default") {
        const dmg = 2 + (power > 2 ? 1 : 0);
        for (let i = 0; i < power; i++) {
          const ox = (i - (power - 1) / 2) * 10;
          shots.push({ bx: p.x + ox, by: p.y - 20, vx: 0, vy: -720, r: 4, dmg, hue: 165, style: "ally" });
        }
      } else if (wMode === "keyboard") {
        const dmg = 2 + (power > 1 ? 1 : 0);
        for (let ii = -1; ii <= 1; ii++) {
          shots.push({
            bx: p.x + ii * 13,
            by: p.y - 22,
            vx: rnd(-26, 26),
            vy: rnd(-700, -655),
            r: 3.5,
            dmg,
            hue: 205,
            style: "keys",
            zig: 0.04,
          });
        }
      } else if (wMode === "mouse") {
        shots.push({
          bx: p.x,
          by: p.y - 22,
          vx: rnd(-40, 40),
          vy: -668,
          r: 6.8,
          dmg: 3 + (power > 2 ? 1 : 0),
          hue: 215,
          style: "mouse",
        });
      } else if (wMode === "papers") {
        const dmg = 2 + (power > 2 ? 1 : 0);
        for (const sx of [-9, 9]) {
          shots.push({
            bx: p.x + sx,
            by: p.y - 21,
            vx: rnd(-24, 24),
            vy: rnd(-695, -655),
            r: 3.8,
            dmg,
            hue: 172,
            style: "paper",
            zig: 0.16,
          });
        }
      } else if (wMode === "docs") {
        shots.push({
          bx: p.x,
          by: p.y - 24,
          vx: rnd(-50, 50),
          vy: -820,
          r: 4.2,
          dmg: 3 + Math.min(2, Math.floor(this.score / 13000)),
          hue: 180,
          style: "doc",
          zig: 0.025,
        });
      }

      for (const s of shots) {
        const opt = {};
        if (s.style && s.style !== "ally") opt.style = s.style;
        if (s.zig != null && s.zig > 0) opt.zig = s.zig;
        this.playerBullets.push(new Bullet(s.bx, s.by, s.vx, s.vy, s.r, s.dmg, true, s.hue, opt));
      }

      const slowMouse = wMode === "mouse";
      const slowDoc = wMode === "docs";
      p.shootCd = slowDoc ? 0.155 : slowMouse ? 0.143 : power >= 3 ? 0.095 : 0.11;
    }

    const bombEdge = this.keys.bomb;
    if (bombEdge && !this._bombEdge && this.bombs > 0) {
      this.useBomb();
    }
    this._bombEdge = bombEdge;

    const ectx = {
      player: p,
      enemyBullets: this.enemyBullets,
      phaseT: this.phaseT,
      stageIndex: this.stageIndex,
      stage: st,
    };
    for (const e of this.enemies) e.update(dt, ectx);

    while (this.enemyBullets.length > 360) this.enemyBullets.shift();

    for (const b of this.playerBullets) b.update(dt);
    for (const b of this.enemyBullets) b.update(dt);
    for (const q of this.particles) q.update(dt);

    this.playerBullets = this.playerBullets.filter((b) => b.life > 0 && b.y > -40 && b.x > -20 && b.x < W + 20);
    this.enemyBullets = this.enemyBullets.filter((b) => b.life > 0 && b.y < H + 240 && b.y > -320 && b.x > -200 && b.x < W + 200);

    for (const pk of this.weaponPickups) {
      pk.y += pk.vy * dt;
      pk.life -= dt;
    }
    this.weaponPickups = this.weaponPickups.filter((pk) => pk.life > 0 && pk.y < H + 150 && pk.y > -90);

    const pickupToastKeys = /** @type {Record<string, string>} */ ({
      keyboard: "toastWeaponKeyboard",
      mouse: "toastWeaponMouse",
      papers: "toastWeaponPapers",
      docs: "toastWeaponDocs",
    });
    const pickupPrm = typeof window.OfficeWarAssets?.playerRadiusMul === "function" ? window.OfficeWarAssets.playerRadiusMul() : 1;
    const pickupReach = p.r + Math.round(14 * ENTITY_SCALE * pickupPrm);
    for (let wi = this.weaponPickups.length - 1; wi >= 0; wi--) {
      const pk = this.weaponPickups[wi];
      if (!circleHit(pk.x, pk.y, pk.r, p.x, p.y, pickupReach)) continue;
      const wRaw = pk.weapon;
      this.playerWeaponMode =
        wRaw === "keyboard" ? "keyboard" : wRaw === "mouse" ? "mouse" : wRaw === "papers" ? "papers" : "docs";
      this.hooks.onToast(this.t(pickupToastKeys[wRaw]), 1650);
      this.weaponPickups.splice(wi, 1);
      this.pushHud();
    }

    for (const b of this.playerBullets) {
      for (const e of this.enemies) {
        if (e.hp <= 0) continue;
        if (circleHit(b.x, b.y, b.r, e.x, e.y, e.r)) {
          b.life = 0;
          e.hp -= b.damage;
          this.spawnHitSpark(b.x, b.y);
          if (e.hp <= 0) this.killEnemy(e);
        }
      }
    }

    if (p.invuln <= 0) {
      for (const b of this.enemyBullets) {
        if (b.armTime > 0) continue;
        if (circleHit(b.x, b.y, b.r, p.x, p.y, p.r)) {
          b.life = 0;
          this.playerHit();
        }
      }
      for (const e of this.enemies) {
        if (e.entered && circleHit(e.x, e.y, e.r * 0.72, p.x, p.y, p.r)) {
          this.playerHit();
        }
      }
    }

    this.enemies = this.enemies.filter((e) => e.y < H + 120 && e.hp > 0);
    this.particles = this.particles.filter((q) => q.life > 0);

    this.pushHud();
  }

  spawnWave() {
    const cap = this.enemyCap();
    const soft = this.softEnemyCount();
    if (soft >= cap) return;

    const st = this.getStage();
    const kind = pickEnemyKind(st.pool);
    const lane = rnd(80, W - 80);
    const canShoot = st.enemyShoot;
    const wideSpawn = kind === "meeting" || kind === "approval";
    const spawnX = wideSpawn ? rnd(120, W - 120) : lane;
    const e = new Enemy(kind, spawnX, -30 - rnd(0, 40), { canShoot });
    if (st.id === 1) e.vy *= 0.75;
    this.enemies.push(e);

    if (st.id >= 6 && soft + 1 < cap && Math.random() < 0.12) {
      const k2 = pickEnemyKind(st.pool);
      this.enemies.push(new Enemy(k2, rnd(70, W - 70), -50, { canShoot }));
    }
  }

  spawnBoss() {
    this.enemies.push(new Enemy("boss", W / 2, -120));
  }

  spawnWeaponPickup(x, y) {
    const pool = /** @type {const} */ (["keyboard", "mouse", "papers", "docs"]);
    const weapon = pool[(Math.random() * pool.length) | 0];
    this.weaponPickups.push({
      x,
      y: y + 4,
      vy: rnd(54, 86),
      r: Math.round(20 * ENTITY_SCALE),
      life: 11,
      weapon,
    });
  }

  killEnemy(e) {
    if (e._gone) return;
    e._gone = true;
    this.score += e.score;
    if (this.killCounts[e.kind] != null) this.killCounts[e.kind] += 1;
    const n =
      e.kind === "boss"
        ? 48
        : e.kind === "printer"
          ? 32
          : e.kind === "meeting"
            ? 20
            : e.kind === "approval"
              ? 19
              : e.kind === "report"
                ? 18
                : e.kind === "ticket"
                  ? 16
                  : e.kind === "mail" || e.kind === "expense" || e.kind === "slack"
                    ? 15
                    : 14;
    for (let i = 0; i < n; i++) {
      const a = rnd(0, Math.PI * 2);
      const sp = rnd(40, 220);
      this.particles.push(
        new Particle(e.x, e.y, Math.cos(a) * sp, Math.sin(a) * sp - rnd(20, 120), rnd(0.25, 0.55), `hsla(${rnd(20, 60)},90%,${rnd(55, 72)}%,1)`),
      );
    }
    if (e.kind === "boss" || e.kind === "printer") {
      this.enemyBullets.length = 0;
      this.hooks.onToast(e.kind === "boss" ? this.t("toastClearBoss") : this.t("toastClearPrinter"), 2400);
    } else if (Math.random() < 0.135) {
      this.spawnWeaponPickup(e.x, e.y);
    }
    if (e.kind === "boss" && this.getStage().finalBoss) {
      this.running = false;
      if (this._raf) {
        cancelAnimationFrame(this._raf);
        this._raf = 0;
      }
      this._last = undefined;
      this.pointer.ax = 0;
      this.pointer.ay = 0;
      this.pointer.fire = false;
      const kills = { ...this.killCounts };
      this.hooks.onGameEnd?.({ outcome: "win", score: this.score, kills });
    }
  }

  playerHit() {
    if (this.lives <= 0) return;
    this.lives -= 1;
    this.player.invuln = 1.8;
    this.enemyBullets.length = 0;
    this.spawnHitSpark(this.player.x, this.player.y, true);
    this.hooks.onToast(this.lives <= 0 ? this.t("toastDead") : this.t("toastRetry"), 1600);
    if (this.lives <= 0) this.gameOver();
  }

  useBomb() {
    if (this.bombs <= 0) return;
    this.bombs -= 1;
    this.player.invuln = 0.9;
    this.enemyBullets.length = 0;
    for (const e of this.enemies) {
      if (e.hp <= 0) continue;
      if (e.kind === "boss" || e.kind === "printer") e.hp -= 40;
      else e.hp -= 80;
      if (e.hp <= 0) this.killEnemy(e);
    }
    const A = window.OfficeWarAssets;
    if (A?.ready) {
      for (let i = 0; i < 6; i++) {
        const a = rnd(0, Math.PI * 2);
        const sp = rnd(80, 200);
        this.particles.push(
          new Particle(
            this.player.x,
            this.player.y,
            Math.cos(a) * sp,
            Math.sin(a) * sp,
            rnd(0.4, 0.75),
            "rgba(251,191,36,0.9)",
          ),
        );
      }
    }
    for (let i = 0; i < 40; i++) {
      const a = rnd(0, Math.PI * 2);
      const sp = rnd(120, 420);
      this.particles.push(new Particle(this.player.x, this.player.y, Math.cos(a) * sp, Math.sin(a) * sp, rnd(0.35, 0.7), "rgba(94,234,212,0.85)"));
    }
    this.hooks.onToast(this.t("toastBomb"), 1400);
    this.pushHud();
  }

  spawnHitSpark(x, y, big = false) {
    const m = big ? 28 : 10;
    for (let i = 0; i < m; i++) {
      const a = rnd(0, Math.PI * 2);
      const sp = rnd(60, big ? 320 : 180);
      this.particles.push(new Particle(x, y, Math.cos(a) * sp, Math.sin(a) * sp, rnd(0.2, 0.45), "rgba(244,114,182,0.9)"));
    }
  }

  render() {
    const c = this.ctx2d;
    c.save();
    c.clearRect(0, 0, W, H);

    this.drawBackground(c);
    this.drawStageBar(c);

    for (const q of this.particles) {
      const t = q.life / q.max;
      c.globalAlpha = clamp(t, 0, 1);
      c.fillStyle = q.color;
      c.beginPath();
      c.arc(q.x, q.y, 2.2, 0, Math.PI * 2);
      c.fill();
    }
    c.globalAlpha = 1;

    for (const e of this.enemies) this.drawEnemy(c, e);

    const Paw = window.OfficeWarAssets;
    for (const pk of this.weaponPickups) {
      const bob = Math.sin(this.time * 8 + pk.x * 0.05) * 4;
      c.save();
      c.shadowColor = "rgba(251,191,106,0.45)";
      c.shadowBlur = 12;
      c.fillStyle = "rgba(251,191,112,0.28)";
      c.beginPath();
      c.arc(pk.x, pk.y + bob * 0.15, pk.r + 8, 0, Math.PI * 2);
      c.fill();
      c.restore();

      const stPk = bulletStyleFromWeapon(pk.weapon);
      if (Paw?.ready) {
        const key = Paw.spriteForBullet(stPk, true);
        const sc = typeof Paw.scaleToTarget === "function" ? Paw.scaleToTarget(key, 0.58) : 0.62;
        const pulse = 0.92 + Math.sin(this.time * 15 + pk.y) * 0.06;
        Paw.draw(c, key, pk.x, pk.y + bob, sc * pulse, 1, Math.sin(this.time * 5 + pk.x * 0.08) * 0.55);
      } else {
        c.fillStyle = "#fde68a";
        c.strokeStyle = "rgba(245,158,11,0.9)";
        c.lineWidth = 2;
        c.beginPath();
        c.arc(pk.x, pk.y + bob, pk.r * 0.52, 0, Math.PI * 2);
        c.fill();
        c.stroke();
      }
    }

    const A = window.OfficeWarAssets;
    for (const b of this.playerBullets) {
      const sk = A?.spriteForBullet?.(b.style, true);
      let drew = false;
      if (A?.ready && sk) {
        const sc = typeof A.scaleToTarget === "function" ? A.scaleToTarget(sk, 0.44) : 0.42;
        drew = A.draw(c, sk, b.x, b.y, sc, 1, Math.atan2(b.vy, b.vx) + Math.PI / 2);
      }
      if (drew) continue;
      const grd = c.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r * 3);
      grd.addColorStop(0, `hsla(${b.hue},85%,74%,1)`);
      grd.addColorStop(1, `hsla(${b.hue},70%,52%,0)`);
      c.fillStyle = grd;
      c.beginPath();
      c.arc(b.x, b.y, b.r * 2.2, 0, Math.PI * 2);
      c.fill();
    }

    for (const b of this.enemyBullets) this.drawEnemyBullet(c, b);

    this.drawPlayer(c);

    if (this.paused) {
      c.save();
      c.fillStyle = "rgba(5,8,14,0.45)";
      c.fillRect(0, 0, W, H);
      c.fillStyle = "rgba(226,232,240,0.95)";
      c.font = "800 28px 'Noto Sans KR',system-ui,sans-serif";
      c.textAlign = "center";
      c.fillText(this.t("pauseTitle"), W / 2, H / 2);
      c.font = "600 14px 'Noto Sans KR',system-ui,sans-serif";
      c.fillStyle = "rgba(148,163,184,0.95)";
      c.fillText(this.t("pauseResume"), W / 2, H / 2 + 32);
      c.restore();
    }

    c.restore();
  }

  drawStageBar(c) {
    if (!this.running) return;
    const st = this.getStage();
    const prog = clamp(this.stageTimer / st.duration, 0, 1);
    c.save();
    c.fillStyle = "rgba(15,23,42,0.5)";
    roundRect(c, 14, H - 22, W - 28, 8, 4);
    c.fill();
    const g = c.createLinearGradient(14, 0, W - 14, 0);
    g.addColorStop(0, "#5eead4");
    g.addColorStop(1, st.finalBoss ? "#a78bfa" : "#38bdf8");
    c.fillStyle = g;
    roundRect(c, 14, H - 22, (W - 28) * prog, 8, 4);
    c.fill();
    c.restore();
  }

  drawBackground(c) {
    const t = this.time;
    const theme = this.getStage().theme;
    const A = window.OfficeWarAssets;
    let hasPhoto = !!(A?.ready && A.drawBackdrop?.(c, W, H, theme, t));
    if (!hasPhoto) {
      if (theme === "dawn") this.drawOfficeMorning(c, t);
      else if (theme === "morning" || theme === "noon") this.drawOfficeNoon(c, t);
      else if (theme === "afternoon" || theme === "dusk") this.drawOfficeNoon(c, t, 0.85);
      else if (theme === "crunch") this.drawOfficeCrunch(c, t);
      else if (theme === "evening" || theme === "night") this.drawOfficeNight(c, t);
      else this.drawOfficeMorning(c, t);
    }
    const overlay = hasPhoto ? 0.52 : 1;
    c.save();
    c.globalAlpha = overlay;
    this.drawOfficeInterior(c, t);
    c.restore();
    c.save();
    c.globalAlpha = hasPhoto ? this.getStage().chaos * 0.85 : this.getStage().chaos;
    this.drawOfficeChaos(c, t, this.getStage().chaos);
    c.restore();
  }

  drawOfficeInterior(c, t) {
    c.save();
    const flicker = 0.92 + Math.sin(t * 14) * 0.04;
    c.globalAlpha = 0.55 * flicker;
    c.strokeStyle = "rgba(148,163,184,0.35)";
    c.lineWidth = 1;
    const tile = 40;
    for (let x = 0; x < W; x += tile) {
      for (let y = 0; y < 140; y += tile) {
        c.strokeRect(x + 0.5, y + 0.5, tile - 1, tile - 1);
      }
    }
    c.globalAlpha = 0.4;
    c.strokeStyle = "rgba(226,232,240,0.25)";
    for (let x = 0; x < W; x += tile) {
      c.beginPath();
      c.moveTo(x, 140);
      c.lineTo(x, H - 40);
      c.stroke();
    }
    c.restore();

    c.save();
    c.globalAlpha = 0.22;
    c.fillStyle = "rgba(15,23,42,0.35)";
    for (let row = 0; row < 4; row++) {
      const y0 = 200 + row * 160;
      for (let col = 0; col < 5; col++) {
        const x0 = 40 + col * 150 + Math.sin(t * 0.4 + row + col) * 6;
        roundRect(c, x0, y0, 110, 72, 6);
        c.fill();
        c.strokeStyle = "rgba(148,163,184,0.25)";
        c.lineWidth = 1.2;
        c.stroke();
        c.fillStyle = "rgba(30,41,59,0.5)";
        roundRect(c, x0 + 8, y0 + 10, 54, 36, 3);
        c.fill();
        const glow = c.createRadialGradient(x0 + 35, y0 + 28, 2, x0 + 35, y0 + 28, 28);
        glow.addColorStop(0, "rgba(56,189,248,0.35)");
        glow.addColorStop(1, "rgba(56,189,248,0)");
        c.fillStyle = glow;
        c.fillRect(x0 + 6, y0 + 8, 58, 40);
        c.fillStyle = "rgba(15,23,42,0.35)";
        roundRect(c, x0 + 70, y0 + 44, 28, 18, 2);
        c.fill();
      }
    }
    c.restore();

    c.save();
    c.globalAlpha = 0.18;
    c.strokeStyle = "rgba(251,191,36,0.5)";
    c.lineWidth = 3;
    for (let i = 0; i < 5; i++) {
      const lx = 80 + i * 140 + Math.sin(t * 0.5 + i) * 10;
      c.beginPath();
      c.moveTo(lx - 40, 130);
      c.lineTo(lx + 40, 130);
      c.stroke();
      c.fillStyle = "rgba(254,243,199,0.35)";
      c.fillRect(lx - 30, 128, 60, 6);
    }
    c.restore();

    c.save();
    c.globalAlpha = 0.12;
    c.fillStyle = "rgba(248,250,252,0.9)";
    for (let i = 0; i < 28; i++) {
      const ph = (i * 1.7 + t * (0.6 + (i % 5) * 0.08)) % (H + 80);
      const x = ((i * 97) % W) + Math.sin(t + i) * 12;
      c.save();
      c.translate(x, ph);
      c.rotate(0.4 + Math.sin(i + t) * 0.3);
      c.fillRect(-3, -18, 6, 36);
      c.restore();
    }
    c.restore();

    c.save();
    c.globalAlpha = 0.08;
    c.fillStyle = "rgba(239,68,68,0.85)";
    for (let i = 0; i < 8; i++) {
      const cx = ((i * 173 + t * 35) % (W + 40)) - 20;
      const cy = 320 + ((i * 67) % 420);
      c.beginPath();
      c.arc(cx, cy, 5 + (i % 3), 0, Math.PI * 2);
      c.fill();
    }
    c.restore();
  }

  drawOfficeMorning(c, t) {
    const g = c.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, "#1e3a5f");
    g.addColorStop(0.35, "#2d4a6e");
    g.addColorStop(0.7, "#1a2744");
    g.addColorStop(1, "#0f172a");
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);
    c.save();
    c.fillStyle = "rgba(253, 224, 71, 0.22)";
    c.beginPath();
    c.ellipse(80 + Math.sin(t * 0.08) * 20, 100, 180, 120, 0, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }

  drawOfficeNoon(c, t, dim = 1) {
    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#334155");
    g.addColorStop(0.4, "#1e293b");
    g.addColorStop(1, "#0f172a");
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);
    c.save();
    c.globalAlpha = 0.35 * dim;
    c.fillStyle = "rgba(248, 250, 252, 0.15)";
    c.fillRect(0, 0, W, H * 0.45);
    c.restore();
  }

  drawOfficeNight(c, t) {
    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#1a1033");
    g.addColorStop(0.5, "#0f172a");
    g.addColorStop(1, "#020617");
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);
    c.save();
    const lx = 520 + Math.sin(t * 0.12) * 30;
    const lamp = c.createRadialGradient(lx, 200, 5, lx, 280, 200);
    lamp.addColorStop(0, "rgba(253, 224, 71, 0.35)");
    lamp.addColorStop(1, "rgba(253, 224, 71, 0)");
    c.fillStyle = lamp;
    c.fillRect(0, 0, W, H);
    c.restore();
  }

  drawOfficeCrunch(c, t) {
    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#2e1065");
    g.addColorStop(0.45, "#1e1b4b");
    g.addColorStop(1, "#020617");
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);
    c.save();
    c.globalAlpha = 0.2;
    for (let i = 0; i < 6; i++) {
      const x = ((t * 40 + i * 120) % (W + 100)) - 50;
      const lamp = c.createRadialGradient(x, 180, 4, x, 220, 120);
      lamp.addColorStop(0, "rgba(167,139,250,0.45)");
      lamp.addColorStop(1, "rgba(167,139,250,0)");
      c.fillStyle = lamp;
      c.fillRect(0, 0, W, H);
    }
    c.restore();
    c.save();
    c.fillStyle = "rgba(15,23,42,0.35)";
    c.fillRect(0, 0, W, 48);
    c.fillStyle = "rgba(248,250,252,0.12)";
    c.font = "600 11px Inter,'Noto Sans KR',system-ui,sans-serif";
    c.textAlign = "center";
    c.fillText(this.lang === "en" ? "OVERTIME MODE" : "야근 모드", W / 2, 30);
    c.restore();
  }

  drawOfficeChaos(c, t, chaos = 0.2) {
    const si = this.stageIndex;
    c.save();
    c.globalAlpha = 0.12 + chaos * 0.5;
    for (let layer = 0; layer < 3; layer++) {
      const speed = 50 + layer * 60 + si * 12;
      const yOff = (t * speed) % 160;
      c.strokeStyle = layer === 0 ? "rgba(148,163,184,0.45)" : "rgba(94,234,212,0.2)";
      c.lineWidth = 1.5 + si * 0.35;
      for (let y = -160; y < H + 160; y += 32) {
        const yy = y + yOff + layer * 10;
        const wobble = Math.sin(t * 2 + y * 0.02) * (6 + si * 3 + chaos * 8);
        c.beginPath();
        c.moveTo(0, yy);
        c.lineTo(W, yy + 20 + layer * 5 + wobble);
        c.stroke();
      }
    }
    c.restore();

    c.save();
    c.globalAlpha = 0.1 + chaos * 0.35;
    for (let i = 0; i < 14 + Math.floor(chaos * 40); i++) {
      const seed = i * 997 + si * 13;
      const x = ((seed * 47 + t * (40 + i * 3)) % (W + 120)) - 40;
      const y = ((seed * 91 + t * (55 + i * 2)) % (H + 100)) - 30;
      c.fillStyle = i % 3 === 0 ? "rgba(254, 240, 138, 0.9)" : "rgba(226, 232, 240, 0.75)";
      c.save();
      c.translate(x, y);
      c.rotate((seed + t * 50) * 0.01);
      roundRect(c, -6, -8, 12, 16, 2);
      c.fill();
      c.restore();
    }
    c.restore();

    c.save();
    c.globalAlpha = 0.08;
    c.strokeStyle = "rgba(15, 23, 42, 0.6)";
    c.lineWidth = 3;
    for (let k = 0; k < 4 + Math.floor(chaos * 12); k++) {
      const x1 = ((k * 137 + t * 22) % W) | 0;
      c.beginPath();
      c.moveTo(x1, 0);
      c.quadraticCurveTo(x1 + Math.sin(t + k) * 40, H * 0.5, x1 + 30, H);
      c.stroke();
    }
    c.restore();

    c.save();
    c.globalAlpha = 0.25;
    const bx = (Math.sin(t * 0.18) * 0.5 + 0.5) * W;
    const rg = c.createRadialGradient(bx, 140, 10, bx, 200, 380 + si * 60);
    rg.addColorStop(0, si >= 10 ? "rgba(167,139,250,0.35)" : "rgba(94,234,212,0.28)");
    rg.addColorStop(1, "rgba(94,234,212,0)");
    c.fillStyle = rg;
    c.fillRect(0, 0, W, H);
    c.restore();
  }

  /** @param {CanvasRenderingContext2D} c */
  drawEnemyBullet(c, b) {
    const ang = Math.atan2(b.vy, b.vx) || 0;
    const A = window.OfficeWarAssets;
    if (A?.ready) {
      const key = A.spriteForBullet(b.style, false);
      const ok = A.draw(c, key, b.x, b.y, 0.38, b.armTime > 0 ? 0.2 : 1, ang + Math.PI / 2);
      if (ok) return;
    }
    const caption = this.bulletCaption(b);
    const hue = b.hue;
    const st = b.style || "doc";

    const pillFallback = () => {
      const pillW = Math.min(64, Math.max(26, 12 + caption.length * 5));
      const pillH = 13;
      const g = c.createLinearGradient(-pillW / 2, 0, pillW / 2, 0);
      g.addColorStop(0, `hsla(${hue},92%,46%,1)`);
      g.addColorStop(0.42, `hsla(${hue},80%,72%,1)`);
      g.addColorStop(1, `hsla(${hue},90%,40%,1)`);
      c.fillStyle = g;
      roundRect(c, -pillW / 2, -pillH / 2, pillW, pillH, 6);
      c.fill();
      c.strokeStyle = "rgba(15,23,42,0.35)";
      c.lineWidth = 1.2;
      c.stroke();
      c.fillStyle = "rgba(15,23,42,0.92)";
      c.font = "800 7px 'Noto Sans KR',system-ui,sans-serif";
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillText(caption, 0, 0.5);
    };

    const cap = () => {
      c.fillStyle = "rgba(15,23,42,0.92)";
      c.font = "800 7px 'Noto Sans KR',system-ui,sans-serif";
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillText(caption.slice(0, 8), 0, 0.5);
    };

    c.save();
    c.translate(b.x, b.y);
    c.rotate(ang);
    c.globalAlpha = b.armTime > 0 ? 0.2 : 1;

    if (st === "coin") {
      c.fillStyle = `hsl(${hue},88%,52%)`;
      c.beginPath();
      c.arc(0, 0, 12, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = "#854d0e";
      c.lineWidth = 1.5;
      c.stroke();
      cap();
    } else if (st === "stamp") {
      c.fillStyle = `hsl(${hue},75%,42%)`;
      roundRect(c, -14, -10, 28, 20, 3);
      c.fill();
      c.strokeStyle = "#450a0a";
      c.lineWidth = 1.2;
      c.stroke();
      c.fillStyle = "#fecdd3";
      c.fillRect(-10, -6, 20, 12);
      cap();
    } else if (st === "code") {
      c.strokeStyle = `hsl(${hue},70%,45%)`;
      c.lineWidth = 2.5;
      c.strokeRect(-14, -10, 28, 20);
      c.fillStyle = `hsl(${hue},85%,88%)`;
      c.font = "800 9px ui-monospace,monospace";
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillText("{ }", 0, 0);
    } else if (st === "heart") {
      c.fillStyle = `hsl(${hue},85%,55%)`;
      c.beginPath();
      c.moveTo(0, 4);
      c.bezierCurveTo(-10, -6, -14, 2, 0, 12);
      c.bezierCurveTo(14, 2, 10, -6, 0, 4);
      c.fill();
      cap();
    } else if (st === "funnel") {
      c.fillStyle = `hsl(${hue},80%,50%)`;
      c.beginPath();
      c.moveTo(0, -12);
      c.lineTo(12, 4);
      c.lineTo(6, 4);
      c.lineTo(6, 12);
      c.lineTo(-6, 12);
      c.lineTo(-6, 4);
      c.lineTo(-12, 4);
      c.closePath();
      c.fill();
      cap();
    } else if (st === "lock") {
      c.strokeStyle = "#475569";
      c.lineWidth = 2;
      c.beginPath();
      c.arc(0, -2, 6, Math.PI, 0);
      c.stroke();
      c.fillStyle = "#94a3b8";
      roundRect(c, -7, -1, 14, 12, 2);
      c.fill();
      cap();
    } else if (st === "grid") {
      c.strokeStyle = `hsl(${hue},70%,55%)`;
      c.lineWidth = 2;
      for (let gx = -1; gx <= 0; gx++) {
        for (let gy = -1; gy <= 0; gy++) {
          c.strokeRect(gx * 10 - 5, gy * 10 - 5, 9, 9);
        }
      }
      cap();
    } else if (st === "bolt") {
      c.fillStyle = `hsl(${hue},95%,55%)`;
      c.beginPath();
      c.moveTo(2, -14);
      c.lineTo(-8, 2);
      c.lineTo(-1, 2);
      c.lineTo(-4, 14);
      c.lineTo(10, -4);
      c.lineTo(2, -4);
      c.closePath();
      c.fill();
      cap();
    } else if (st === "mail") {
      c.fillStyle = "#f8fafc";
      c.strokeStyle = `hsl(${hue},60%,45%)`;
      c.lineWidth = 1.5;
      c.beginPath();
      c.moveTo(-14, -8);
      c.lineTo(14, -8);
      c.lineTo(14, 10);
      c.lineTo(-14, 10);
      c.closePath();
      c.fill();
      c.stroke();
      c.beginPath();
      c.moveTo(-14, -8);
      c.lineTo(0, 2);
      c.lineTo(14, -8);
      c.stroke();
      cap();
    } else if (st === "alert") {
      c.fillStyle = `hsl(${hue},90%,52%)`;
      c.beginPath();
      c.moveTo(0, -14);
      c.lineTo(13, 12);
      c.lineTo(-13, 12);
      c.closePath();
      c.fill();
      c.fillStyle = "#0f172a";
      c.font = "800 11px system-ui,sans-serif";
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillText("!", 0, 3);
    } else if (st === "cal") {
      c.fillStyle = "#e2e8f0";
      roundRect(c, -12, -12, 24, 22, 3);
      c.fill();
      c.fillStyle = `hsl(${hue},70%,45%)`;
      c.fillRect(-12, -12, 24, 7);
      c.fillStyle = "#0f172a";
      c.font = "800 8px system-ui,sans-serif";
      c.textAlign = "center";
      c.fillText(caption.slice(0, 5), 0, 4);
    } else if (st === "pixel") {
      c.fillStyle = `hsl(${hue},80%,60%)`;
      c.fillRect(-10, -10, 8, 8);
      c.fillStyle = `hsl(${hue + 40},80%,45%)`;
      c.fillRect(-2, -2, 8, 8);
      cap();
    } else if (st === "pto") {
      c.fillStyle = `hsl(${hue},85%,55%)`;
      c.beginPath();
      c.arc(0, -4, 10, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#0ea5e9";
      c.fillRect(-12, 2, 24, 6);
      cap();
    } else if (st === "cross") {
      c.strokeStyle = `hsl(${hue},85%,50%)`;
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(-8, -8);
      c.lineTo(8, 8);
      c.moveTo(8, -8);
      c.lineTo(-8, 8);
      c.stroke();
      cap();
    } else if (st === "paper") {
      c.fillStyle = "#f8fafc";
      c.save();
      c.rotate(-0.25);
      roundRect(c, -12, -10, 24, 20, 2);
      c.fill();
      c.strokeStyle = "#94a3b8";
      c.stroke();
      c.restore();
      cap();
    } else if (st === "blob") {
      c.fillStyle = `hsl(${hue},40%,35%)`;
      c.beginPath();
      c.ellipse(0, 0, 12, 9, 0.3, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = `hsl(${hue},60%,25%)`;
      c.beginPath();
      c.ellipse(3, 2, 5, 4, 0, 0, Math.PI * 2);
      c.fill();
      cap();
    } else if (st === "ring") {
      c.strokeStyle = `hsl(${hue},80%,60%)`;
      c.lineWidth = 2;
      for (let i = 1; i <= 3; i++) {
        c.beginPath();
        c.arc(0, 0, i * 5, 0, Math.PI * 2);
        c.stroke();
      }
      cap();
    } else if (st === "clip") {
      c.strokeStyle = `hsl(${hue},70%,45%)`;
      c.lineWidth = 2.5;
      c.beginPath();
      c.arc(-4, -4, 6, 0.4 * Math.PI, 1.6 * Math.PI);
      c.stroke();
      c.beginPath();
      c.arc(4, -4, 6, 0.4 * Math.PI, 1.6 * Math.PI);
      c.stroke();
      cap();
    } else if (st === "wifi") {
      c.strokeStyle = `hsl(${hue},70%,55%)`;
      c.lineWidth = 2;
      for (let i = 1; i <= 3; i++) {
        c.beginPath();
        c.arc(0, 4, i * 5, -Math.PI, 0);
        c.stroke();
      }
      cap();
    } else if (st === "ghost") {
      c.fillStyle = "rgba(226,232,240,0.85)";
      c.beginPath();
      c.arc(0, -2, 10, Math.PI, 0);
      c.lineTo(10, 10);
      for (let i = 0; i < 4; i++) c.lineTo(10 - i * 6, 12 + (i % 2));
      c.lineTo(-10, 10);
      c.closePath();
      c.fill();
      c.fillStyle = "#0f172a";
      c.beginPath();
      c.arc(-4, -4, 1.5, 0, Math.PI * 2);
      c.arc(4, -4, 1.5, 0, Math.PI * 2);
      c.fill();
    } else if (st === "doc") {
      c.fillStyle = "#f1f5f9";
      c.beginPath();
      c.moveTo(-10, -12);
      c.lineTo(4, -12);
      c.lineTo(12, -4);
      c.lineTo(12, 12);
      c.lineTo(-12, 12);
      c.closePath();
      c.fill();
      c.strokeStyle = "#94a3b8";
      c.stroke();
      cap();
    } else {
      pillFallback();
    }

    c.restore();
  }

  /** @param {CanvasRenderingContext2D} c */
  drawEnemy(c, e) {
    const A = window.OfficeWarAssets;
    if (A?.ready) {
      const key = A.spriteForEnemy(e.kind);
      const bob = Math.sin(e.patternT * 2.2) * 2;
      A.draw(c, key, e.x, e.y + bob, A.enemyScale(e.kind));
      deptChip(c, e.x, e.y + e.r + 20 + bob, this.deptFor(e));
      const maxHp = enemyMaxHp(e.kind);
      const ratio = clamp(e.hp / maxHp, 0, 1);
      const showHpBar =
        e.kind === "meeting" ||
        e.kind === "report" ||
        e.kind === "ticket" ||
        e.kind === "approval" ||
        e.kind === "printer" ||
        e.kind === "boss";
      if (showHpBar) {
        c.save();
        c.fillStyle = "rgba(15,23,42,0.55)";
        c.fillRect(e.x - 40, e.y - e.r - 14, 80, 6);
        c.fillStyle = "#34d399";
        c.fillRect(e.x - 40, e.y - e.r - 14, 80 * ratio, 6);
        c.restore();
      }
      return;
    }

    const lookX = Math.sin(e.patternT * 2.1) * 3;
    const lookY = Math.cos(e.patternT * 1.7) * 2;
    c.save();
    c.translate(e.x, e.y);
    c.scale(ENTITY_SCALE, ENTITY_SCALE);

    if (e.kind === "postit") {
      c.rotate(Math.sin(e.patternT * 3) * 0.12);
      const body = c.createRadialGradient(-8, -10, 4, 0, 6, 30);
      body.addColorStop(0, "#fff7ed");
      body.addColorStop(0.45, e.skin);
      body.addColorStop(1, "#ea580c");
      c.fillStyle = body;
      c.beginPath();
      c.ellipse(0, 6, 20, 24, 0, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = "rgba(15,23,42,0.22)";
      c.lineWidth = 2;
      c.stroke();
      c.fillStyle = e.cheek;
      c.globalAlpha = 0.55;
      c.beginPath();
      c.ellipse(-12, 10, 5, 3.5, 0, 0, Math.PI * 2);
      c.ellipse(12, 10, 5, 3.5, 0, 0, Math.PI * 2);
      c.fill();
      c.globalAlpha = 1;
      pixarEyes(c, 0, -6, 1.05, lookX, lookY);
      pixarSmile(c, 10);
      c.save();
      c.rotate(-0.35);
      c.fillStyle = "#fef08a";
      c.strokeStyle = "rgba(120,53,15,0.35)";
      c.lineWidth = 1.5;
      roundRect(c, -16, -34, 32, 22, 4);
      c.fill();
      c.stroke();
      c.fillStyle = "rgba(15,23,42,0.5)";
      c.font = "700 7px 'Noto Sans KR',sans-serif";
      c.textAlign = "center";
      c.fillText("TODO", 0, -22);
      c.restore();
      drawEnemyRoleAccent(c, "postit", e.sprite, e.patternT);
      deptChip(c, 0, 36, this.deptFor(e));
    } else if (e.kind === "mail") {
      const body = c.createRadialGradient(0, -6, 2, 0, 8, 26);
      body.addColorStop(0, "#fff7ed");
      body.addColorStop(1, e.skin);
      c.fillStyle = body;
      c.beginPath();
      c.ellipse(0, 8, 18, 22, 0, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = "rgba(15,23,42,0.2)";
      c.stroke();
      pixarEyes(c, 0, -4, 1, lookX, lookY);
      pixarSmile(c, 14);
      c.fillStyle = e.cheek;
      c.globalAlpha = 0.45;
      c.beginPath();
      c.ellipse(-11, 10, 4, 3, 0, 0, Math.PI * 2);
      c.ellipse(11, 10, 4, 3, 0, 0, Math.PI * 2);
      c.fill();
      c.globalAlpha = 1;
      c.fillStyle = "#f8fafc";
      c.strokeStyle = "#94a3b8";
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(-26, -8);
      c.lineTo(0, -30);
      c.lineTo(26, -8);
      c.lineTo(26, 22);
      c.lineTo(-26, 22);
      c.closePath();
      c.fill();
      c.stroke();
      const env = c.createLinearGradient(-20, -20, 20, 20);
      env.addColorStop(0, "rgba(244,114,182,0.35)");
      env.addColorStop(1, "rgba(249,168,212,0.15)");
      c.fillStyle = env;
      c.fillRect(-22, -6, 44, 22);
      c.fillStyle = "#be123c";
      c.font = "800 11px 'Noto Sans KR',sans-serif";
      c.textAlign = "center";
      c.fillText("99+", 0, 8);
      c.fillStyle = "rgba(15,23,42,0.75)";
      c.font = "700 7px 'Noto Sans KR',sans-serif";
      c.fillText("INBOX", 0, -2);
      drawEnemyRoleAccent(c, "mail", e.sprite, e.patternT);
      deptChip(c, 0, 38, this.deptFor(e));
    } else if (e.kind === "report") {
      const body = c.createRadialGradient(-6, -8, 3, 0, 4, 24);
      body.addColorStop(0, "#fff7ed");
      body.addColorStop(1, e.skin);
      c.fillStyle = body;
      c.beginPath();
      c.ellipse(0, 6, 19, 23, 0, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = "rgba(15,23,42,0.22)";
      c.lineWidth = 2;
      c.stroke();
      pixarEyes(c, 0, -5, 1.05, lookX * 1.4, lookY * 1.2);
      c.strokeStyle = "rgba(15,23,42,0.42)";
      c.lineWidth = 1.7;
      c.lineCap = "round";
      c.beginPath();
      c.arc(0, 18, 7, 1.05 * Math.PI, 1.95 * Math.PI);
      c.stroke();
      c.fillStyle = "#93c5fd";
      roundRect(c, -12, 16, 24, 16, 4);
      c.fill();
      c.strokeStyle = "rgba(30,58,138,0.35)";
      c.lineWidth = 1.2;
      c.stroke();
      c.fillStyle = "#1e3a8a";
      c.font = "800 8px 'Noto Sans KR',sans-serif";
      c.textAlign = "center";
      c.fillText("IC", 0, 25);
      drawEnemyRoleAccent(c, "report", e.sprite, e.patternT);
      deptChip(c, 0, 40, this.deptFor(e));
    } else if (e.kind === "meeting") {
      c.fillStyle = "#0f172a";
      c.strokeStyle = "#334155";
      c.lineWidth = 3;
      roundRect(c, -36, -18, 72, 48, 10);
      c.fill();
      c.stroke();
      const scr = c.createLinearGradient(-30, -14, 30, 18);
      scr.addColorStop(0, "#1e293b");
      scr.addColorStop(0.5, "#2563eb");
      scr.addColorStop(1, "#0ea5e9");
      c.fillStyle = scr;
      roundRect(c, -30, -14, 60, 34, 6);
      c.fill();
      c.strokeStyle = "rgba(148,163,184,0.5)";
      c.lineWidth = 1.2;
      c.stroke();
      pixarEyes(c, 0, -2, 0.85, lookX * 0.6, lookY * 0.6);
      c.fillStyle = "#fcd34d";
      c.font = "800 7px ui-monospace,monospace";
      c.textAlign = "left";
      const mtag =
        e.sprite === "exec" ? "BOD" : e.sprite === "pmo" ? "PMO" : e.sprite === "all" ? "Q&A" : e.sprite === "design" ? "FIG" : "SYNC";
      c.fillText(mtag, -26, -8);
      c.fillStyle = "#22c55e";
      c.font = "800 9px 'Noto Sans KR',sans-serif";
      c.textAlign = "center";
      c.fillText("● LIVE", 0, 12);
      c.fillStyle = "#475569";
      roundRect(c, -32, 22, 64, 14, 4);
      c.fill();
      c.fillStyle = "#94a3b8";
      for (let i = 0; i < 10; i++) c.fillRect(-28 + i * 6, 26, 4, 3);
      deptChip(c, 0, 46, this.deptFor(e));
    } else if (e.kind === "ticket") {
      const body = c.createRadialGradient(-5, -8, 3, 0, 5, 26);
      body.addColorStop(0, "#faf5ff");
      body.addColorStop(1, e.skin);
      c.fillStyle = body;
      c.beginPath();
      c.ellipse(0, 7, 18, 22, 0, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = "rgba(15,23,42,0.22)";
      c.lineWidth = 2;
      c.stroke();
      pixarEyes(c, 0, -5, 1.02, lookX * 1.2, lookY);
      pixarSmile(c, 14);
      c.fillStyle = "#ede9fe";
      roundRect(c, -22, -28, 44, 34, 6);
      c.fill();
      c.strokeStyle = "#7c3aed";
      c.lineWidth = 2;
      c.stroke();
      c.fillStyle = "#5b21b6";
      c.font = "800 9px ui-monospace,monospace";
      c.textAlign = "center";
      c.fillText("OPS-842", 0, -14);
      c.fillStyle = "#64748b";
      c.font = "700 7px system-ui,sans-serif";
      c.fillText("In Progress", 0, -4);
      drawEnemyRoleAccent(c, "ticket", e.sprite, e.patternT);
      deptChip(c, 0, 40, this.deptFor(e));
    } else if (e.kind === "expense") {
      const body = c.createRadialGradient(0, -6, 2, 0, 9, 24);
      body.addColorStop(0, "#fffbeb");
      body.addColorStop(1, e.skin);
      c.fillStyle = body;
      c.beginPath();
      c.ellipse(0, 9, 17, 21, 0, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = "rgba(15,23,42,0.2)";
      c.stroke();
      pixarEyes(c, 0, -3, 0.98, lookX, lookY);
      pixarSmile(c, 15);
      c.fillStyle = "#fefce8";
      c.strokeStyle = "#a8a29e";
      c.lineWidth = 1.5;
      c.beginPath();
      c.moveTo(-18, -22);
      for (let i = 0; i < 8; i++) {
        const zig = ((i % 2) * 2 - 1) * 1.2;
        c.lineTo(-18 + i * 5 + zig, -26 + Math.sin(i * 1.4 + e.patternT * 3) * 2);
      }
      c.lineTo(22, -18);
      c.lineTo(20, 18);
      c.lineTo(-20, 22);
      c.closePath();
      c.fill();
      c.stroke();
      c.fillStyle = "rgba(15,23,42,0.55)";
      c.font = "700 6px ui-monospace,monospace";
      c.textAlign = "left";
      for (let row = 0; row < 4; row++) c.fillText("···········", -14, -14 + row * 7);
      drawEnemyRoleAccent(c, "expense", e.sprite, e.patternT);
      deptChip(c, 0, 38, this.deptFor(e));
    } else if (e.kind === "slack") {
      const body = c.createRadialGradient(0, -6, 2, 0, 8, 23);
      body.addColorStop(0, "#ecfeff");
      body.addColorStop(1, e.skin);
      c.fillStyle = body;
      c.beginPath();
      c.ellipse(0, 8, 17, 21, 0, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = "rgba(15,23,42,0.2)";
      c.stroke();
      pixarEyes(c, 0, -4, 1, lookX * 1.3, lookY);
      pixarSmile(c, 14);
      c.fillStyle = "#581c87";
      roundRect(c, -26, -24, 52, 28, 10);
      c.fill();
      c.fillStyle = "#e9d5ff";
      c.font = "800 11px ui-monospace,monospace";
      c.textAlign = "center";
      c.fillText("#war-room", 0, -8);
      c.fillStyle = "#22d3ee";
      c.font = "800 8px system-ui,sans-serif";
      c.fillText("unread 99+", 0, 4);
      drawEnemyRoleAccent(c, "slack", e.sprite, e.patternT);
      deptChip(c, 0, 38, this.deptFor(e));
    } else if (e.kind === "approval") {
      const body = c.createRadialGradient(-6, -8, 3, 0, 5, 25);
      body.addColorStop(0, "#fff7ed");
      body.addColorStop(1, e.skin);
      c.fillStyle = body;
      c.beginPath();
      c.ellipse(0, 7, 19, 23, 0, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = "rgba(15,23,42,0.22)";
      c.lineWidth = 2;
      c.stroke();
      pixarEyes(c, 0, -6, 1.08, lookX * 1.2, lookY * 1.1);
      c.strokeStyle = "rgba(15,23,42,0.38)";
      c.lineWidth = 1.6;
      c.lineCap = "round";
      c.beginPath();
      c.arc(0, 16, 8, 1.05 * Math.PI, 1.92 * Math.PI);
      c.stroke();
      for (let layer = 0; layer < 3; layer++) {
        c.fillStyle = layer === 0 ? "#fff" : "#f1f5f9";
        roundRect(c, -14 + layer * 3, -28 + layer * 5, 36 + layer * 2, 46, 4);
        c.fill();
        c.strokeStyle = "rgba(148,163,184,0.45)";
        c.stroke();
      }
      c.fillStyle = "#dc2626";
      c.font = "800 9px 'Noto Sans KR',sans-serif";
      c.textAlign = "center";
      c.fillText("결재", -2, -8);
      drawEnemyRoleAccent(c, "approval", e.sprite, e.patternT);
      deptChip(c, 0, 42, this.deptFor(e));
    } else if (e.kind === "printer") {
      const box = c.createLinearGradient(-48, -36, 48, 36);
      box.addColorStop(0, "#475569");
      box.addColorStop(0.5, "#64748b");
      box.addColorStop(1, "#334155");
      c.fillStyle = box;
      c.strokeStyle = "#94a3b8";
      c.lineWidth = 3;
      roundRect(c, -48, -34, 96, 68, 12);
      c.fill();
      c.stroke();
      c.fillStyle = "#e2e8f0";
      roundRect(c, -32, -22, 64, 18, 4);
      c.fill();
      pixarEyes(c, 0, -12, 1.15, lookX * 1.4, lookY * 1.2);
      pixarSmile(c, 4);
      c.fillStyle = "#f1f5f9";
      roundRect(c, -28, 6, 56, 10, 3);
      c.fill();
      c.fillStyle = "#ef4444";
      for (let i = 0; i < 5; i++) c.fillRect(-22 + i * 10, 10, 6, 12);
      c.fillStyle = "rgba(255,255,255,0.85)";
      c.beginPath();
      c.moveTo(-8, 26);
      c.quadraticCurveTo(0, 40, 8, 26);
      c.lineTo(8, 22);
      c.lineTo(-8, 22);
      c.closePath();
      c.fill();
      drawEnemyRoleAccent(c, "printer", e.sprite, e.patternT);
      deptChip(c, 0, 48, this.deptFor(e));
    } else if (e.kind === "boss") {
      const suit = c.createLinearGradient(-50, -50, 50, 50);
      suit.addColorStop(0, "#312e81");
      suit.addColorStop(0.5, "#4c1d95");
      suit.addColorStop(1, "#1e1b4b");
      c.fillStyle = suit;
      c.strokeStyle = "#c4b5fd";
      c.lineWidth = 4;
      c.beginPath();
      c.arc(0, 4, 48, 0, Math.PI * 2);
      c.fill();
      c.stroke();
      c.fillStyle = "#1e1b4b";
      c.beginPath();
      c.moveTo(-22, -8);
      c.lineTo(0, 2);
      c.lineTo(22, -8);
      c.lineTo(18, 18);
      c.lineTo(-18, 18);
      c.closePath();
      c.fill();
      pixarEyes(c, 0, -8, 1.35, lookX * 1.2, lookY * 0.8);
      pixarSmile(c, 16);
      c.fillStyle = "#fde68a";
      c.font = "800 11px 'Noto Sans KR',sans-serif";
      c.textAlign = "center";
      c.fillText("VP", 0, 6);
      c.fillStyle = "rgba(244,114,182,0.9)";
      for (let i = 0; i < 8; i++) {
        const a = (e.patternT * 2.2 + (i / 8) * Math.PI * 2) % (Math.PI * 2);
        c.beginPath();
        c.arc(Math.cos(a) * 62, Math.sin(a) * 62, 7, 0, Math.PI * 2);
        c.fill();
      }
      drawEnemyRoleAccent(c, "boss", e.sprite, e.patternT);
      deptChip(c, 0, 58, this.deptFor(e));
    }
    c.restore();

    const maxHp = enemyMaxHp(e.kind);
    const ratio = clamp(e.hp / maxHp, 0, 1);
    const showHpBar =
      e.kind === "meeting" ||
      e.kind === "report" ||
      e.kind === "ticket" ||
      e.kind === "approval" ||
      e.kind === "printer" ||
      e.kind === "boss";
    if (showHpBar) {
      c.save();
      c.fillStyle = "rgba(15,23,42,0.55)";
      c.fillRect(e.x - 40, e.y - e.r - 14, 80, 6);
      c.fillStyle = "#34d399";
      c.fillRect(e.x - 40, e.y - e.r - 14, 80 * ratio, 6);
      c.restore();
    }
  }

  /** @param {CanvasRenderingContext2D} c */
  drawPlayer(c) {
    const p = this.player;
    const g = p.gender;
    const A = window.OfficeWarAssets;
    const blink = p.invuln > 0 && Math.floor(p.invuln * 12) % 2 === 0;
    if (A?.ready) {
      const key = g === "f" ? "player_f" : "player_m";
      const sc = typeof A.playerScale === "function" ? A.playerScale(p.gender) : 0.92;
      A.draw(c, key, p.x, p.y, sc, blink ? 0.35 : 1);
      return;
    }
    const pm = typeof A?.playerRadiusMul === "function" ? A.playerRadiusMul() : 1;
    c.save();
    c.translate(p.x, p.y);
    c.scale(ENTITY_SCALE * pm, ENTITY_SCALE * pm);
    c.globalAlpha = blink ? 0.35 : 1;
    const lookX = Math.sin(this.time * 2.4) * 2.5;
    const lookY = Math.cos(this.time * 1.9) * 1.5;

    const flame = 10 + Math.sin(this.time * 28) * 4;
    for (const side of [-1, 1]) {
      c.save();
      c.translate(side * 8, 0);
      const jet = c.createRadialGradient(0, 30, 2, 0, 38, flame + 8);
      jet.addColorStop(0, "rgba(253,224,71,0.95)");
      jet.addColorStop(0.35, "rgba(249,115,22,0.7)");
      jet.addColorStop(0.7, "rgba(236,72,153,0.35)");
      jet.addColorStop(1, "rgba(239,68,68,0)");
      c.fillStyle = jet;
      c.beginPath();
      c.ellipse(0, 36, 7, flame * 0.92, 0, 0, Math.PI * 2);
      c.fill();
      c.restore();
    }

    const skin = g === "f" ? "#fecdd3" : "#fdba74";
    const bodyG = c.createRadialGradient(-6, -8, 4, 0, 6, 28);
    bodyG.addColorStop(0, "#fff7ed");
    bodyG.addColorStop(0.55, skin);
    bodyG.addColorStop(1, g === "f" ? "#fb7185" : "#ea580c");
    c.fillStyle = bodyG;
    c.beginPath();
    c.ellipse(0, 2, 20, 22, 0, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = "rgba(15,23,42,0.18)";
    c.lineWidth = 2;
    c.stroke();

    if (g === "m") {
      c.fillStyle = "#1e293b";
      roundRect(c, -18, -28, 36, 14, 8);
      c.fill();
    } else {
      c.fillStyle = "#9f1239";
      c.beginPath();
      c.arc(-16, -22, 10, 0, Math.PI * 2);
      c.arc(16, -22, 10, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#fbcfe8";
      c.beginPath();
      c.ellipse(0, -26, 8, 6, 0, 0, Math.PI * 2);
      c.fill();
    }

    const shirt = g === "f" ? "#be185d" : "#0369a1";
    c.fillStyle = shirt;
    c.beginPath();
    c.moveTo(-16, -4);
    c.lineTo(16, -4);
    c.lineTo(14, 14);
    c.lineTo(-14, 14);
    c.closePath();
    c.fill();
    c.strokeStyle = "rgba(15,23,42,0.15)";
    c.stroke();

    if (g === "f") {
      c.strokeStyle = "rgba(255,255,255,0.7)";
      c.lineWidth = 1.4;
      c.beginPath();
      c.moveTo(0, 2);
      c.lineTo(0, 12);
      c.stroke();
      c.fillStyle = "#fef3c7";
      roundRect(c, -4, 4, 8, 6, 2);
      c.fill();
    } else {
      c.fillStyle = "#0f172a";
      c.beginPath();
      c.arc(0, 6, 3, 0, Math.PI * 2);
      c.fill();
    }

    c.fillStyle = g === "f" ? "#fda4af" : "#fb923c";
    c.globalAlpha = 0.5;
    c.beginPath();
    c.ellipse(-11, 6, 5, 3.5, 0, 0, Math.PI * 2);
    c.ellipse(11, 6, 5, 3.5, 0, 0, Math.PI * 2);
    c.fill();
    c.globalAlpha = 1;

    pixarEyes(c, 0, -14, 1.1, lookX, lookY);
    c.fillStyle = "rgba(255,255,255,0.75)";
    c.beginPath();
    c.arc(-4 + lookX * 0.1, -16 + lookY * 0.08, 1.2, 0, Math.PI * 2);
    c.arc(4 + lookX * 0.1, -16 + lookY * 0.08, 1.2, 0, Math.PI * 2);
    c.fill();
    pixarSmile(c, -2);

    c.strokeStyle = "rgba(148,163,184,0.85)";
    c.lineWidth = 1.6;
    c.beginPath();
    c.moveTo(0, -2);
    c.quadraticCurveTo(-3, 6, -12, 12);
    c.moveTo(0, -2);
    c.quadraticCurveTo(3, 6, 12, 12);
    c.stroke();
    c.fillStyle = "#f8fafc";
    roundRect(c, -14, 8, 28, 14, 4);
    c.fill();
    c.strokeStyle = "rgba(148,163,184,0.8)";
    c.lineWidth = 1.1;
    c.stroke();
    c.fillStyle = "#0f172a";
    c.font = "800 6px ui-monospace,monospace";
    c.textAlign = "center";
    c.fillText("IC", 0, 17);

    const podBg = c.createLinearGradient(-24, 26, 24, 42);
    podBg.addColorStop(0, "#1e293b");
    podBg.addColorStop(0.45, "#0f172a");
    podBg.addColorStop(1, "#334155");
    c.fillStyle = podBg;
    c.strokeStyle = "#5eead4";
    c.lineWidth = 2.5;
    roundRect(c, -24, 26, 48, 14, 6);
    c.fill();
    c.stroke();
    c.fillStyle = "#a5f3fc";
    c.font = "800 8px ui-monospace,monospace";
    c.fillText(this.lang === "en" ? "DESK-01" : "데스크-01", 0, 36);

    c.restore();
  }
}

function roundRect(c, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  c.beginPath();
  c.moveTo(x + rr, y);
  c.arcTo(x + w, y, x + w, y + h, rr);
  c.arcTo(x + w, y + h, x, y + h, rr);
  c.arcTo(x, y + h, x, y, rr);
  c.arcTo(x, y, x + w, y, rr);
  c.closePath();
}

try {
  window.OfficeWarKillKinds = KILL_TRACK_KINDS;
  window.OfficeWarGame = Game;
} catch (e) {
  window.OfficeWarBootstrapError = String(e?.message ?? e);
  window.OfficeWarGame = undefined;
}
