/**
 * 12 workday stages — 09:00 → 21:00
 * @typedef {{
 *   id: number;
 *   hourKo: string; hourEn: string;
 *   labelKey: string;
 *   duration: number;
 *   capMin: number; capMax: number;
 *   spawnCd: number;
 *   pool: Record<string, number>;
 *   fireMul: number;
 *   enemyShoot: boolean;
 *   printerBoss: boolean;
 *   finalBoss: boolean;
 *   theme: "dawn"|"morning"|"noon"|"afternoon"|"dusk"|"evening"|"night"|"crunch";
 *   chaos: number;
 * }} StageDef
 */

/** @type {StageDef[]} */
const STAGES = [
  {
    id: 1,
    hourKo: "09:00",
    hourEn: "9:00 AM",
    labelKey: "stage1",
    duration: 18,
    capMin: 2,
    capMax: 3,
    spawnCd: 1.55,
    pool: { postit: 1 },
    fireMul: 2.4,
    enemyShoot: false,
    printerBoss: false,
    finalBoss: false,
    theme: "dawn",
    chaos: 0.08,
  },
  {
    id: 2,
    hourKo: "10:00",
    hourEn: "10:00 AM",
    labelKey: "stage2",
    duration: 22,
    capMin: 3,
    capMax: 5,
    spawnCd: 1.25,
    pool: { postit: 0.72, mail: 0.28 },
    fireMul: 1.9,
    enemyShoot: true,
    printerBoss: false,
    finalBoss: false,
    theme: "morning",
    chaos: 0.12,
  },
  {
    id: 3,
    hourKo: "11:00",
    hourEn: "11:00 AM",
    labelKey: "stage3",
    duration: 24,
    capMin: 4,
    capMax: 6,
    spawnCd: 1.1,
    pool: { postit: 0.44, mail: 0.32, report: 0.14, ticket: 0.1 },
    fireMul: 1.6,
    enemyShoot: true,
    printerBoss: false,
    finalBoss: false,
    theme: "morning",
    chaos: 0.16,
  },
  {
    id: 4,
    hourKo: "12:00",
    hourEn: "12:00 PM",
    labelKey: "stage4",
    duration: 26,
    capMin: 4,
    capMax: 7,
    spawnCd: 1.0,
    pool: { postit: 0.34, mail: 0.3, report: 0.13, meeting: 0.1, expense: 0.08, ticket: 0.05 },
    fireMul: 1.45,
    enemyShoot: true,
    printerBoss: true,
    finalBoss: false,
    theme: "noon",
    chaos: 0.22,
  },
  {
    id: 5,
    hourKo: "13:00",
    hourEn: "1:00 PM",
    labelKey: "stage5",
    duration: 24,
    capMin: 5,
    capMax: 8,
    spawnCd: 0.92,
    pool: { postit: 0.28, mail: 0.32, report: 0.12, meeting: 0.12, slack: 0.08, ticket: 0.08 },
    fireMul: 1.35,
    enemyShoot: true,
    printerBoss: false,
    finalBoss: false,
    theme: "noon",
    chaos: 0.24,
  },
  {
    id: 6,
    hourKo: "14:00",
    hourEn: "2:00 PM",
    labelKey: "stage6",
    duration: 26,
    capMin: 5,
    capMax: 9,
    spawnCd: 0.85,
    pool: { postit: 0.22, mail: 0.26, report: 0.12, meeting: 0.16, slack: 0.1, ticket: 0.08, approval: 0.06 },
    fireMul: 1.25,
    enemyShoot: true,
    printerBoss: false,
    finalBoss: false,
    theme: "afternoon",
    chaos: 0.28,
  },
  {
    id: 7,
    hourKo: "15:00",
    hourEn: "3:00 PM",
    labelKey: "stage7",
    duration: 28,
    capMin: 6,
    capMax: 10,
    spawnCd: 0.78,
    pool: { postit: 0.2, mail: 0.28, report: 0.12, meeting: 0.16, slack: 0.1, ticket: 0.08, approval: 0.06 },
    fireMul: 1.15,
    enemyShoot: true,
    printerBoss: false,
    finalBoss: false,
    theme: "afternoon",
    chaos: 0.32,
  },
  {
    id: 8,
    hourKo: "16:00",
    hourEn: "4:00 PM",
    labelKey: "stage8",
    duration: 28,
    capMin: 6,
    capMax: 11,
    spawnCd: 0.72,
    pool: { postit: 0.18, mail: 0.26, report: 0.11, meeting: 0.18, slack: 0.11, ticket: 0.09, approval: 0.07 },
    fireMul: 1.05,
    enemyShoot: true,
    printerBoss: true,
    finalBoss: false,
    theme: "dusk",
    chaos: 0.36,
  },
  {
    id: 9,
    hourKo: "17:00",
    hourEn: "5:00 PM",
    labelKey: "stage9",
    duration: 28,
    capMin: 7,
    capMax: 12,
    spawnCd: 0.66,
    pool: { postit: 0.16, mail: 0.24, report: 0.11, meeting: 0.2, slack: 0.12, ticket: 0.09, approval: 0.08 },
    fireMul: 0.95,
    enemyShoot: true,
    printerBoss: false,
    finalBoss: false,
    theme: "dusk",
    chaos: 0.4,
  },
  {
    id: 10,
    hourKo: "18:00",
    hourEn: "6:00 PM",
    labelKey: "stage10",
    duration: 30,
    capMin: 7,
    capMax: 13,
    spawnCd: 0.6,
    pool: { postit: 0.14, mail: 0.22, report: 0.11, meeting: 0.22, slack: 0.13, ticket: 0.1, approval: 0.08 },
    fireMul: 0.88,
    enemyShoot: true,
    printerBoss: false,
    finalBoss: false,
    theme: "evening",
    chaos: 0.45,
  },
  {
    id: 11,
    hourKo: "19:00",
    hourEn: "7:00 PM",
    labelKey: "stage11",
    duration: 32,
    capMin: 8,
    capMax: 14,
    spawnCd: 0.55,
    pool: { postit: 0.12, mail: 0.2, report: 0.1, meeting: 0.24, slack: 0.14, ticket: 0.11, approval: 0.09 },
    fireMul: 0.82,
    enemyShoot: true,
    printerBoss: false,
    finalBoss: false,
    theme: "night",
    chaos: 0.5,
  },
  {
    id: 12,
    hourKo: "21:00",
    hourEn: "9:00 PM",
    labelKey: "stage12",
    duration: 45,
    capMin: 4,
    capMax: 8,
    spawnCd: 0.85,
    pool: { postit: 0.1, mail: 0.16, report: 0.1, meeting: 0.26, slack: 0.15, ticket: 0.12, approval: 0.11 },
    fireMul: 0.75,
    enemyShoot: true,
    printerBoss: false,
    finalBoss: true,
    theme: "crunch",
    chaos: 0.55,
  },
];

const STAGE_COUNT = STAGES.length;

/** @param {StageDef} stage @param {number} t stage elapsed seconds */
function stageEnemyCap(stage, t) {
  const grow = Math.min(1, t / Math.max(6, stage.duration * 0.55));
  return Math.round(stage.capMin + (stage.capMax - stage.capMin) * grow);
}

/** weighted pick from pool */
function pickEnemyKind(pool) {
  const keys = Object.keys(pool);
  let r = Math.random();
  for (const k of keys) {
    r -= pool[k];
    if (r <= 0) return k;
  }
  return keys[keys.length - 1];
}

window.OfficeWarStages = { STAGES, STAGE_COUNT, stageEnemyCap, pickEnemyKind };
