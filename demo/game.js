/**
 * 水墨丹青 - 核心战斗原型 (Phase 1 MVP)
 * 
 * 纯 Canvas 2D API 实现，零外部依赖
 * 画面: 390x844 (竖屏)
 * 
 * 包含模块:
 * 1. 触控移动 (虚拟摇杆)
 * 2. 自动瞄准 + 自动射击
 * 3. 木桩敌人 + 血条
 * 4. 墨点喷溅视觉效果
 * 5. 伤害数字
 */

// 屏幕尺寸
const W = 390, H = 844;

// ==================== 关卡配置 ====================
// 当前关卡世界尺寸（由startLevel动态设置）
let WORLD_W = 1200, WORLD_H = 1600;

// 关卡定义 — 3卷，每卷独立世界/波次/背景
const LEVEL_CONFIG = [
  {
    id: 0,
    name: '山水篇',
    fullName: '卷一·山水篇',
    desc: '青绿远山，云烟缥缈',
    worldW: 1200, worldH: 1600,
    startPos: { x: 600, y: 1400 },   // 玩家出生点
    timeLimit: 90,                     // 秒
    bg: {
      base: '#f5f0e8',                // 宣纸底色
      lineColor: 'rgba(180,170,150,0.06)',
      mountainColor: 'rgba(180,175,160,0.15)',
      mountainPeaks: [[0,0.82],[0.12,0.72],[0.22,0.78],[0.35,0.68],
                       [0.48,0.74],[0.62,0.65],[0.75,0.71],[0.88,0.66],[1,0.75]],
      // 近景装饰
      decoType: 'bamboo',             // 墨竹
      decoColor: 'rgba(100,120,100,0.08)',
      decoCount: 5,
    },
    waves: [
      { enemies: 4, types: ['normal','normal','normal','fast'] },
      { enemies: 5, types: ['normal','fast','normal','heavy','fast'] },
      { enemies: 6, types: ['fast','normal','heavy','fast','normal','fast'] },
      { enemies: 4, types: ['heavy','fast','heavy','fast'] },
      { boss: true, bossHp: 500 },
    ],
    colorCircleRate: 8,              // 每N秒生成一个颜色圈
    obstacles: [
      // 石碑 — 矩形阻挡
      { type:'stele', x:300, y:800, w:30, h:60, label:'山' },
      { type:'stele', x:900, y:600, w:30, h:60, label:'水' },
      // 墨池 — 圆形阻挡+溅墨视觉
      { type:'inkpool', x:600, y:1000, r:40 },
      { type:'inkpool', x:400, y:1200, r:35 },
      // 断桥 — 长条形阻挡
      { type:'bridge', x:700, y:500, w:120, h:20, angle:0.3 },
    ],
  },
  {
    id: 1,
    name: '花鸟篇',
    fullName: '卷二·花鸟篇',
    desc: '繁花似锦，鸟语墨香',
    worldW: 1400, worldH: 1800,
    startPos: { x: 700, y: 1600 },
    timeLimit: 100,
    bg: {
      base: '#f8f2e4',               // 暖黄宣纸
      lineColor: 'rgba(190,165,130,0.05)',
      mountainColor: 'rgba(190,170,130,0.12)',
      mountainPeaks: [[0,0.85],[0.1,0.78],[0.2,0.82],[0.32,0.73],
                       [0.45,0.79],[0.55,0.70],[0.68,0.76],[0.8,0.72],[0.92,0.80],[1,0.83]],
      decoType: 'petals',            // 飘落花瓣
      decoColor: 'rgba(200,120,120,0.06)',
      decoCount: 12,
    },
    waves: [
      { enemies: 5, types: ['normal','fast','normal','fast','normal'] },
      { enemies: 6, types: ['fast','heavy','normal','fast','normal','fast'] },
      { enemies: 5, types: ['heavy','fast','heavy','fast','heavy'] },
      { enemies: 7, types: ['fast','fast','heavy','fast','normal','fast','heavy'] },
      { enemies: 4, types: ['heavy','heavy','fast','fast'] },
      { boss: true, bossHp: 700 },
    ],
    colorCircleRate: 7,
    obstacles: [
      // 花坛 — 圆形阻挡
      { type:'flowerbed', x:350, y:900, r:35 },
      { type:'flowerbed', x:1050, y:700, r:30 },
      { type:'flowerbed', x:700, y:1400, r:45 },
      // 鸟架 — 矩形阻挡
      { type:'perch', x:500, y:500, w:20, h:80 },
      { type:'perch', x:900, y:1100, w:20, h:80 },
    ],
  },
  {
    id: 2,
    name: '人物篇',
    fullName: '卷三·人物篇',
    desc: '浓墨重彩，画中乾坤',
    worldW: 1600, worldH: 2000,
    startPos: { x: 800, y: 1800 },
    timeLimit: 110,
    bg: {
      base: '#ede6d6',               // 古旧宣纸
      lineColor: 'rgba(160,150,130,0.07)',
      mountainColor: 'rgba(120,115,105,0.18)',
      mountainPeaks: [[0,0.80],[0.08,0.70],[0.18,0.76],[0.28,0.65],
                       [0.38,0.72],[0.50,0.62],[0.60,0.69],[0.72,0.60],
                       [0.82,0.68],[0.92,0.64],[1,0.73]],
      decoType: 'seals',             // 印章纹样
      decoColor: 'rgba(196,58,49,0.04)',
      decoCount: 6,
    },
    waves: [
      { enemies: 6, types: ['fast','fast','normal','heavy','normal','fast'] },
      { enemies: 6, types: ['heavy','fast','heavy','fast','heavy','fast'] },
      { enemies: 7, types: ['fast','heavy','fast','heavy','fast','normal','fast'] },
      { enemies: 6, types: ['heavy','heavy','fast','heavy','fast','heavy'] },
      { enemies: 8, types: ['fast','fast','heavy','fast','heavy','fast','fast','heavy'] },
      { enemies: 5, types: ['heavy','heavy','heavy','fast','fast'] },
      { boss: true, bossHp: 900 },
    ],
    colorCircleRate: 6,
    obstacles: [
      // 画框 — 矩形阻挡
      { type:'frame', x:400, y:600, w:80, h:20 },
      { type:'frame', x:1200, y:1000, w:80, h:20 },
      // 印章石 — 圆形阻挡
      { type:'sealstone', x:800, y:800, r:50 },
      { type:'sealstone', x:500, y:1400, r:40 },
      { type:'sealstone', x:1100, y:1600, r:45 },
      // 屏风 — 长条形阻挡
      { type:'screen', x:600, y:400, w:140, h:16, angle:-0.2 },
      { type:'screen', x:1000, y:1200, w:140, h:16, angle:0.4 },
    ],
  },
];

// 旧WAVE_CONFIG保留为默认，startLevel会覆盖
const WAVE_CONFIG_DEFAULT = [
  { enemies: 4, types: ['normal','normal','normal','fast'] },
  { enemies: 5, types: ['normal','fast','normal','heavy','fast'] },
  { enemies: 6, types: ['fast','normal','heavy','fast','normal','fast'] },
  { enemies: 4, types: ['heavy','fast','heavy','fast'] },
  { boss: true },
];
// 当前波次配置（由startLevel动态设置）
let WAVE_CONFIG = WAVE_CONFIG_DEFAULT;

const ENEMY_TYPES = {
  normal: { name: '墨傀', size: 18, hp: 80, speed: 60, color: '#555555', score: 1 },
  fast:   { name: '墨傀·疾', size: 13, hp: 30, speed: 100, color: '#888888', score: 1 },
  heavy:  { name: '墨傀·重', size: 24, hp: 180, speed: 35, color: '#2e2e2e', score: 2 },
  boss:   { name: '墨魔', size: 38, hp: 500, speed: 25, color: '#1a1a1a', score: 5 },
};

const C = {
  BG:         '#f5f0e8',
  INK_BLACK:  '#1a1a1a',
  INK_DARK:   '#2e2e2e',
  INK_MEDIUM: '#555555',
  INK_LIGHT:  '#888888',
  INK_WASH:   '#bbbbbb',
  RED:        '#c43a31',
  GREEN:      '#2d8a4e',
  YELLOW:     '#c4a835',
  BLUE:       '#3a6b9e',
  PURPLE:     '#6b3a7a',
  HP_BG:      'rgba(0,0,0,0.3)',
  HP_GREEN:   '#2d8a4e',
  HP_YELLOW:  '#c4a835',
  HP_RED:     '#c43a31',
};

const PLAYER_SPEED = 170;
const PLAYER_SIZE = 22;
const FIRE_RATE = 250;
const BULLET_SPEED = 650;
const BULLET_DAMAGE = 12;
const ATTACK_RANGE = 320;

// 闪避/冲刺
const DASH_SPEED = 800;
const DASH_DURATION = 0.15;   // 冲刺持续时间(秒)
const DASH_COOLDOWN = 2.5;    // 冷却时间(秒)
const DASH_DIST = DASH_SPEED * DASH_DURATION; // ~120px

const JOY_R = 78, JOY_THUMB_R = 30, JOY_DEAD = 10;
const joyX = 85, joyY = 730;

// 停火按钮
const CEASEFIRE_X = W - 70, CEASEFIRE_Y = 730, CEASEFIRE_R = 32;

const HIT_STOP_NORMAL = 3;
const HIT_STOP_CRIT = 12;
const HIT_STOP_KILL = 35;
const SHAKE_NORMAL = 0.15;
const SHAKE_CRIT = 0.6;
const SHAKE_KILL = 1.5;

const ENEMY_HP = 80;
const ENEMY_SPEED = 60;
const ENEMY_ATTACK_RANGE = 160;
const ENEMY_BULLET_SPEED = 180;
const ENEMY_BULLET_LIFE = 5000;

// 摄像机 — 跟随玩家，大地图自由移动
const CAM_SMOOTH = 5;           // 跟随平滑系数（越大越跟得紧）
const CAM_DEAD_ZONE = 30;       // 死区半径（玩家在中心区域时摄像机不动）


const RAGE_METER_MAX = 20;
const RAGE_DURATION = 4000;
const RAGE_FIRE_RATE = 130;
const RAGE_DAMAGE_MULT = 1.3;
const RAGE_BULLET_SIZE = 8;

// BOSS弱点击破
const BOSS_BREAK_MAX = 100;     // 击破条满值
const BOSS_BREAK_PER_HIT = 15;  // 每次属性匹配击破值
const BOSS_BREAK_STUN = 3;      // 击破后僵直(秒)

const canvas = document.getElementById('gameCanvas');
const paintCanvasEl = document.getElementById('paintCanvas');
const uiOverlay = document.getElementById('ui-overlay');
const dpr = Math.min(window.devicePixelRatio || 1, 2);
canvas.width = W * dpr;
canvas.height = H * dpr;
canvas.style.width = W + 'px';
canvas.style.height = H + 'px';
const ctx = canvas.getContext('2d');
ctx.scale(dpr, dpr);

// 涂色画布 — 命中时累积墨迹，爆发时晕染清空
paintCanvasEl.width = W * dpr;
paintCanvasEl.height = H * dpr;
paintCanvasEl.style.width = W + 'px';
paintCanvasEl.style.height = H + 'px';
const paintCtx = paintCanvasEl.getContext('2d');
paintCtx.scale(dpr, dpr);

const COLORS = [C.RED, C.GREEN, C.YELLOW, C.BLUE, C.PURPLE];
const COLOR_NAMES = ['朱砂', '石绿', '藤黄', '花青', '紫'];

// ==================== 存档系统 ====================
const SAVE_KEY = 'inkMaster_save';
const gameSave = {
  levels: [
    { unlocked: true, stars: 0, bestKills: 0 },  // 卷一·山水篇
    { unlocked: false, stars: 0, bestKills: 0 },  // 卷二·花鸟篇
    { unlocked: false, stars: 0, bestKills: 0 },  // 卷三·人物篇
  ],
  totalStars: 0,

  load() {
    try {
      const data = JSON.parse(localStorage.getItem(SAVE_KEY));
      if (data && data.levels) {
        this.levels = data.levels;
        this.totalStars = this.levels.reduce((s, l) => s + (l.stars || 0), 0);
      }
    } catch(e) { /* 首次无存档 */ }
  },

  save() {
    this.totalStars = this.levels.reduce((s, l) => s + (l.stars || 0), 0);
    try { localStorage.setItem(SAVE_KEY, JSON.stringify({ levels: this.levels })); } catch(e) {}
  },

  // 通关后更新存档
  updateLevel(levelIdx, stars, kills) {
    const lv = this.levels[levelIdx];
    if (!lv) return;
    if (stars > lv.stars) lv.stars = stars;
    if (kills > lv.bestKills) lv.bestKills = kills;
    // 解锁下一关
    if (stars > 0 && levelIdx + 1 < this.levels.length) {
      this.levels[levelIdx + 1].unlocked = true;
    }
    this.save();
  },

  reset() {
    this.levels = [
      { unlocked: true, stars: 0, bestKills: 0 },
      { unlocked: false, stars: 0, bestKills: 0 },
      { unlocked: false, stars: 0, bestKills: 0 },
    ];
    this.totalStars = 0;
    this.save();
  }
};
gameSave.load();

// ==================== 画灵角色系统 ====================
// 3个画灵，各有独特属性/被动/爆发技能
const HEROES = [
  {
    id: 'qinglan',
    name: '青岚',
    title: '山水画灵',
    desc: '均衡型 — 厚积薄发，泼墨回春',
    color: '#3a6b9e',     // 花青色
    bodyColor: '#2e5a8a',
    // 基础数值倍率
    hpMult: 1.25,         // 125% HP
    atkMult: 1.0,         // 100% 攻击
    spdMult: 1.0,         // 100% 速度
    critMult: 0.8,        // 80% 暴击率（低）
    fireRateMult: 1.15,   // 115% 射速（快）
    // 被动：墨愈 — 击杀敌人回复3HP
    passive: 'inkHeal',
    passiveDesc: '墨愈: 击杀回复3HP',
    passiveColor: '#3a6b9e',
    // 爆发技能：泼墨回春 — 爆发期间每秒回复8HP
    rageSkill: 'rageHeal',
    rageSkillDesc: '泼墨回春: 爆发期间持续回血',
  },
  {
    id: 'danxia',
    name: '丹霞',
    title: '花鸟画灵',
    desc: '暴击型 — 笔走龙蛇，一击必杀',
    color: '#c43a31',     // 朱砂色
    bodyColor: '#a83028',
    hpMult: 0.85,         // 85% HP
    atkMult: 1.3,         // 130% 攻击
    spdMult: 1.1,         // 110% 速度
    critMult: 1.5,        // 150% 暴击率（高）
    fireRateMult: 0.9,    // 90% 射速（慢）
    // 被动：丹心 — 暴击时50%触发范围溅墨(30%伤害)
    passive: 'critSplash',
    passiveDesc: '丹心: 暴击时溅墨伤害周围',
    passiveColor: '#c43a31',
    // 爆发技能：丹青万卷 — 爆发时全屏8方向散射弹
    rageSkill: 'rageScatter',
    rageSkillDesc: '丹青万卷: 爆发瞬间8方向散射',
  },
  {
    id: 'mohen',
    name: '墨痕',
    title: '人物画灵',
    desc: '范围型 — 泼墨如山，气吞万里',
    color: '#6b3a7a',     // 紫色
    bodyColor: '#5a3050',
    hpMult: 1.1,          // 110% HP
    atkMult: 0.9,         // 90% 攻击
    spdMult: 0.85,        // 85% 速度（慢）
    critMult: 1.0,        // 100% 暴击率
    fireRateMult: 0.8,    // 80% 射速（慢但大弹）
    // 被动：墨守 — 弹道+50%范围，命中时小范围AOE
    passive: 'bigBullet',
    passiveDesc: '墨守: 大弹道+小范围溅射',
    passiveColor: '#6b3a7a',
    // 爆发技能：墨影分身 — 爆发时生成2个墨影自动攻击
    rageSkill: 'rageShadow',
    rageSkillDesc: '墨影分身: 爆发时召唤2个墨影',
  },
];

// 当前选择的画灵（默认青岚）
let currentHero = HEROES[0];

// ==================== 共鸣等级系统 ====================
// 全角色共享养成 — 杀敌获得经验，升级后属性加成
const RESONANCE_KEY = 'inkMaster_resonance';
const resonance = {
  level: 1,
  exp: 0,
  // 每级所需经验
  expToNext(lv) { return 20 + lv * 15; },
  // 升级属性加成（每级）
  bonusPerLevel: { hp: 5, atk: 2, spd: 3, crit: 1 },
  // 计算当前加成
  getBonus() {
    const lv = this.level - 1; // 从0开始计算
    return {
      hp: lv * this.bonusPerLevel.hp,
      atk: lv * this.bonusPerLevel.atk,
      spd: lv * this.bonusPerLevel.spd,
      crit: lv * this.bonusPerLevel.crit,
    };
  },
  // 获取经验
  addExp(amount) {
    this.exp += amount;
    let leveled = false;
    while (this.exp >= this.expToNext(this.level)) {
      this.exp -= this.expToNext(this.level);
      this.level++;
      leveled = true;
    }
    if (leveled) this.save();
    return leveled;
  },
  load() {
    try {
      const d = JSON.parse(localStorage.getItem(RESONANCE_KEY));
      if (d) { this.level = d.level || 1; this.exp = d.exp || 0; }
    } catch(e) {}
  },
  save() {
    try { localStorage.setItem(RESONANCE_KEY, JSON.stringify({ level: this.level, exp: this.exp })); } catch(e) {}
  },
};
resonance.load();

// ==================== 屏幕状态 ====================
// screen: 'title' | 'select' | 'heroSelect' | 'battle' | 'result'
const screenState = {
  current: 'title',      // 当前屏幕
  titleFadeIn: 0,        // 标题淡入动画 0~1
  selectScrollY: 0,      // 选择画面滚动偏移
  selectHover: -1,       // 鼠标悬停的关卡索引 -1=无
  selectedLevel: -1,     // 选中的关卡
  heroHover: -1,         // 画灵选择悬停索引 -1=无
  resultLevelIdx: -1,    // 结算画面对应的关卡
  resultStars: 0,        // 结算星级
  transitionAlpha: 0,    // 屏幕过渡透明度
  transitionTarget: '',  // 过渡目标屏幕
};

const state = {
  joystick: { active: false, pointerId: -1, dx: 0, dy: 0 },
  player: { x: 600, y: 1400, hp: 100, maxHp: 100, angle: 0, isMoving: false },
  dash: { active: false, timer: 0, cooldown: 0, angle: 0, invincible: 0 },
  bullets: [],
  enemyBullets: [],
  enemies: [],
  particles: [],
  damageNumbers: [],
  actionTexts: [],
  ambientDots: [],
  hitStop: 0,
  playerHurtFlash: 0,
  shake: { intensity: 0, x: 0, y: 0 },
  rageFlash: 0,
  wave: {
    current: 0,
    spawned: 0,
    completed: false,
  },
  rage: {
    active: false,
    meter: 0,
    endTime: 0,
    fireTimer: 0,
    healTimer: 0,        // 青岚爆发回血计时
  },
  lastFire: 0,
  killCount: 0,
  shootCount: 0,
  consecCrit: 0,
  rageCount: 0,
  bulletColorIndex: 0,
  level: 0,                // 当前关卡索引
  levelPhase: 'intro',     // 'intro'|'battle'|'complete'|'transition'
  levelIntroTimer: 0,      // 卷首标题卡倒计时
  levelTransitionTimer: 0, // 关卡过渡动画
  gameOver: false,
  gameOverOverTimer: 0,
  groundStains: [],
  camera: { x: 0, y: 0, targetX: 0, targetY: 0 },
  levelTimer: 90,
  breakCount: 0,
  starRating: 0,
  timerExpired: false,
  allLevelsComplete: false, // 全部关卡通关
  paintCover: 0,           // 涂色覆盖率 0~1
  rageWash: { active: false, progress: 0 },  // 爆发晕染动画
  colorCircles: [],        // 踩圈切色 — 地面颜色圈
  colorCircleTimer: 0,     // 生成计时器
  lockedTarget: null,      // 手动锁敌目标（null=自动瞄准）
  ceaseFire: false,        // 停火状态
  paused: false,           // 暂停状态
  obstacles: [],           // 障碍物列表（由startLevel从关卡配置加载）
  heroId: 'qinglan',      // 当前画灵ID
  shadows: [],            // 墨影分身列表
  levelExpGained: 0,      // 本局获得经验
};

const SPAWN_POS = [
  [120, 140], [270, 120], [195, 200], [100, 280], [290, 260],
];

// ==================== 音频 ====================
let audioCtx = null;
function initAudio() {
  if (audioCtx) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

function playSound(type) {
  if (!audioCtx) return;
  try {
    const now = audioCtx.currentTime;
    const g = audioCtx.createGain();
    g.connect(audioCtx.destination);

    switch (type) {
      case 'shoot': {
        const osc = audioCtx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.05);
        g.gain.setValueAtTime(0.04, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
        osc.connect(g);
        osc.start(now);
        osc.stop(now + 0.06);
        break;
      }
      case 'hit': {
        const osc = audioCtx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.04);
        g.gain.setValueAtTime(0.06, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
        osc.connect(g);
        osc.start(now);
        osc.stop(now + 0.06);
        break;
      }
      case 'crit': {
        const osc = audioCtx.createOscillator();
        osc.type = 'square';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.08);
        g.gain.setValueAtTime(0.05, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.connect(g);
        osc.start(now);
        osc.stop(now + 0.1);
        break;
      }
      case 'kill': {
        const osc = audioCtx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.2);
        g.gain.setValueAtTime(0.07, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.connect(g);
        osc.start(now);
        osc.stop(now + 0.25);

        const osc2 = audioCtx.createOscillator();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(800, now);
        osc2.frequency.exponentialRampToValueAtTime(100, now + 0.15);
        const g2 = audioCtx.createGain();
        g2.gain.setValueAtTime(0.03, now);
        g2.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc2.connect(g2);
        g2.connect(audioCtx.destination);
        osc2.start(now);
        osc2.stop(now + 0.15);
        break;
      }
      case 'rage': {
        const osc = audioCtx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.linearRampToValueAtTime(80, now + 0.3);
        g.gain.setValueAtTime(0.08, now);
        g.gain.linearRampToValueAtTime(0.04, now + 0.1);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.connect(g);
        osc.start(now);
        osc.stop(now + 0.4);
        break;
      }
      case 'playerHit': {
        const osc = audioCtx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.12);
        g.gain.setValueAtTime(0.1, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.connect(g);
        osc.start(now);
        osc.stop(now + 0.15);
        break;
      }
    }
  } catch(e) {}
}

// ==================== 工具函数 ====================
function showActionText(text, x, y) {
  state.actionTexts.push({ text: text, x: x, y: y, life: 1.0, scale: 1 });
}

function getPointerPos(e) {
  const rect = canvas.getBoundingClientRect();
  const clientX = e.clientX || (e.touches ? e.touches[0].clientX : 0);
  const clientY = e.clientY || (e.touches ? e.touches[0].clientY : 0);
  return { x: clientX - rect.left, y: clientY - rect.top };
}

function getPointerId(e) {
  if (e.pointerId !== undefined) return e.pointerId;
  if (e.changedTouches) return e.changedTouches[0].identifier;
  return 0;
}

function dist(x1, y1, x2, y2) {
  return Math.sqrt((x1-x2)**2 + (y1-y2)**2);
}

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

// ==================== 障碍物碰撞 ====================
// 检测圆形实体与障碍物碰撞，返回修正后的位置 {x, y} 或 null（无碰撞）
function resolveObstacleCollision(cx, cy, entityRadius) {
  let pushX = 0, pushY = 0;
  let collided = false;
  for (const ob of state.obstacles) {
    if (ob.r) {
      // 圆形障碍物
      const dx = cx - ob.x, dy = cy - ob.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      const minDist = ob.r + entityRadius;
      if (d < minDist && d > 0.01) {
        const push = (minDist - d) / d;
        pushX += dx * push;
        pushY += dy * push;
        collided = true;
      }
    } else {
      // 矩形障碍物（支持旋转angle）
      const hw = ob.w / 2, hh = ob.h / 2;
      let rx = cx - ob.x, ry = cy - ob.y;
      // 逆旋转到矩形局部坐标
      if (ob.angle) {
        const cos = Math.cos(-ob.angle), sin = Math.sin(-ob.angle);
        const nrx = rx * cos - ry * sin;
        const nry = rx * sin + ry * cos;
        rx = nrx; ry = nry;
      }
      // AABB碰撞 + 推开（带实体半径膨胀）
      const closestX = clamp(rx, -hw, hw);
      const closestY = clamp(ry, -hh, hh);
      const ddx = rx - closestX, ddy = ry - closestY;
      const d2 = ddx * ddx + ddy * ddy;
      if (d2 < entityRadius * entityRadius) {
        let pushDist = entityRadius - Math.sqrt(d2);
        if (pushDist < 0.01) pushDist = entityRadius;
        let pdx, pdy;
        if (d2 > 0.001) {
          pdx = ddx / Math.sqrt(d2);
          pdy = ddy / Math.sqrt(d2);
        } else {
          // 实体中心在矩形内部，找最短推出方向
          const dl = rx + hw, dr = hw - rx, dt = ry + hh, db = hh - ry;
          const minD = Math.min(dl, dr, dt, db);
          if (minD === dl) { pdx = -1; pdy = 0; pushDist = dl + entityRadius; }
          else if (minD === dr) { pdx = 1; pdy = 0; pushDist = dr + entityRadius; }
          else if (minD === dt) { pdx = 0; pdy = -1; pushDist = dt + entityRadius; }
          else { pdx = 0; pdy = 1; pushDist = db + entityRadius; }
        }
        // 旋转回世界坐标
        if (ob.angle) {
          const cos = Math.cos(ob.angle), sin = Math.sin(ob.angle);
          const npx = pdx * cos - pdy * sin;
          const npy = pdx * sin + pdy * cos;
          pdx = npx; pdy = npy;
        }
        pushX += pdx * pushDist;
        pushY += pdy * pushDist;
        collided = true;
      }
    }
  }
  if (collided) {
    return { x: cx + pushX, y: cy + pushY };
  }
  return null;
}

// 检测子弹与障碍物碰撞（子弹被阻挡→涂色+消失）
function checkBulletObstacleCollision(bx, by, bulletColor) {
  for (const ob of state.obstacles) {
    if (ob.r) {
      const d = Math.sqrt((bx - ob.x) ** 2 + (by - ob.y) ** 2);
      if (d < ob.r + 4) {
        // 命中圆形障碍物
        ob.paintColor = bulletColor;
        ob.paintAlpha = Math.min(1, (ob.paintAlpha || 0) + 0.3);
        paintInk(bx, by, bulletColor, 6);
        return true;
      }
    } else {
      // 矩形障碍物
      let rx = bx - ob.x, ry = by - ob.y;
      if (ob.angle) {
        const cos = Math.cos(-ob.angle), sin = Math.sin(-ob.angle);
        const nrx = rx * cos - ry * sin;
        const nry = rx * sin + ry * cos;
        rx = nrx; ry = nry;
      }
      if (Math.abs(rx) < ob.w / 2 + 4 && Math.abs(ry) < ob.h / 2 + 4) {
        ob.paintColor = bulletColor;
        ob.paintAlpha = Math.min(1, (ob.paintAlpha || 0) + 0.3);
        paintInk(bx, by, bulletColor, 6);
        return true;
      }
    }
  }
  return false;
}

// ==================== 敌人生成 ====================
function spawnEnemy(x, y, type = 'normal', customHp = null) {
  const t = ENEMY_TYPES[type] || ENEMY_TYPES.normal;
  const hp = customHp || t.hp;
  state.enemies.push({
    x, y, hp: hp, maxHp: hp, alive: true,
    type: type,
    size: t.size,
    color: t.color,
    name: t.name,
    armorColor: COLORS[Math.floor(Math.random() * COLORS.length)],
    armorColorName: COLOR_NAMES[Math.floor(Math.random() * COLORS.length)],
    stagger: 0,
    hurtTimer: 0,
    scale: 1,
    scaleVel: 0,
    score: t.score,
    state: 'chase',  // 初始状态：追击
    attackTimer: 0,
    cooldownTimer: 0,
    chargeGlow: false,
    angle: Math.random() * Math.PI * 2,
    speed: t.speed + Math.random() * 10,
    strafeDir: Math.random() < 0.5 ? -1 : 1,
    separation: { x: 0, y: 0 },
    colorMarks: [],  // 颜色标记 [{color, timer}]
  });
}

// 初始敌人由startLevel中的wave系统管理
state.wave.waveDelay = 1.5;

// ==================== 关卡启动 ====================
function startLevel(levelIndex) {
  const cfg = LEVEL_CONFIG[levelIndex];
  if (!cfg) return;

  // 设置当前关卡
  state.level = levelIndex;
  state.levelPhase = 'intro';
  state.levelIntroTimer = 2.0;  // 2秒卷首标题卡

  // 动态世界尺寸
  WORLD_W = cfg.worldW;
  WORLD_H = cfg.worldH;

  // 波次配置
  WAVE_CONFIG = cfg.waves;

  // 画灵属性 + 共鸣加成
  const hero = currentHero;
  state.heroId = hero.id;
  const bonus = resonance.getBonus();
  const baseHp = Math.floor(100 * hero.hpMult + bonus.hp);
  const baseAtk = Math.floor(BULLET_DAMAGE * hero.atkMult + bonus.atk);
  const baseSpd = Math.floor(PLAYER_SPEED * hero.spdMult + bonus.spd);
  const baseCrit = Math.floor(15 * hero.critMult + bonus.crit); // 基础暴击15%
  state.heroStats = { maxHp: baseHp, atk: baseAtk, spd: baseSpd, crit: baseCrit };

  // 玩家
  state.player.hp = baseHp;
  state.player.maxHp = baseHp;
  state.player.x = cfg.startPos.x;
  state.player.y = cfg.startPos.y;

  // 清空战斗实体
  state.enemies = [];
  state.enemyBullets = [];
  state.bullets = [];
  state.particles = [];
  state.damageNumbers = [];
  state.actionTexts = [];
  state.rage.active = false;
  state.rage.meter = 0;
  state.killCount = 0;
  state.shootCount = 0;
  state.rageCount = 0;
  state.consecCrit = 0;
  state.wave.current = -1;   // -1表示尚未生成任何波次，首次生成时 nextIdx=-1+1=0
  state.wave.completed = false;
  state.wave.waveDelay = 0;
  state.completionStats = null;
  state.gameOver = false;
  state.gameOverTimer = 0;
  state.groundStains = [];
  state.paintCover = 0;
  state.rageWash = { active: false, progress: 0 };
  state.colorCircles = [];
  state.colorCircleTimer = 0;
  state.lockedTarget = null;
  state.paused = false;
  state.dash = { active: false, timer: 0, cooldown: 0, angle: 0, invincible: 0 };
  state.shadows = [];
  state.levelExpGained = 0;
  state.obstacles = (cfg.obstacles || []).map(o => ({
    ...o,
    // 运行时属性
    paintColor: null,    // 被涂色后的颜色（null=未涂色）
    paintAlpha: 0,       // 涂色透明度 0~1
  }));
  state.levelTimer = cfg.timeLimit;
  state.breakCount = 0;
  state.starRating = 0;
  state.timerExpired = false;
  state.allLevelsComplete = false;
  state.levelTransitionTimer = 0;
  // 重置视觉反馈状态（防止上一局泄漏）
  state.shake = { intensity: 0, x: 0, y: 0 };
  state.hitStop = 0;
  state.playerHurtFlash = 0;
  state.rageFlash = 0;

  paintCtx.clearRect(0, 0, W, H);

  // 摄像机直接对齐玩家
  state.camera.x = state.player.x - W / 2;
  state.camera.y = state.player.y - H / 2;
  state.camera.targetX = state.camera.x;
  state.camera.targetY = state.camera.y;

  // 重新生成纸张纹理
  generatePaperTexture();

  // 重新生成环境粒子
  state.ambientDots = [];
  for (let i = 0; i < 15; i++) {
    state.ambientDots.push({
      x: Math.random() * WORLD_W, y: Math.random() * WORLD_H,
      r: 2 + Math.random() * 4,
      speedX: (Math.random() - 0.5) * 8,
      speedY: -(2 + Math.random() * 6),
      floatAmp: 4 + Math.random() * 8,
      floatSpeed: 0.5 + Math.random() * 1,
      phase: Math.random() * Math.PI * 2,
    });
  }
}

// 保留resetGame作为快捷入口（从第0关开始）
function resetGame() {
  startLevel(0);
}

// ==================== 触控输入 ====================
let lastTapTime = 0;
let lastTapX = 0, lastTapY = 0;
let ceaseFirePointerId = -1;  // 停火按钮的指针ID

function onPointerDown(e) {
  e.preventDefault();
  initAudio();
  const pos = getPointerPos(e);
  const id = getPointerId(e);

  // ---- 屏幕路由 ----
  if (screenState.current === 'title') {
    // 开始按钮检测
    const btnX = W/2, btnY = H * 0.58;
    const btnW = 140, btnH = 44;
    if (Math.abs(pos.x - btnX) < btnW/2 && Math.abs(pos.y - btnY) < btnH/2) {
      screenState.current = 'select';
      playSound('hit');
      return;
    }
    return; // 标题画面不处理其他输入
  }

  if (screenState.current === 'select') {
    // 返回按钮
    if (pos.x < 80 && pos.y < 50) {
      screenState.current = 'title';
      playSound('hit');
      return;
    }
    // 关卡卡片点击
    const cardW = W - 60, cardH = 160;
    const cardX = 30, gapY = 20;
    const startY = 85;
    for (let i = 0; i < LEVEL_CONFIG.length; i++) {
      const cy = startY + i * (cardH + gapY);
      if (pos.x >= cardX && pos.x <= cardX + cardW && pos.y >= cy && pos.y <= cy + cardH) {
        if (gameSave.levels[i].unlocked) {
          screenState.selectedLevel = i;
          screenState.current = 'heroSelect';
          playSound('crit');
        } else {
          playSound('hit'); // 锁定提示音
        }
        return;
      }
    }
    return;
  }

  if (screenState.current === 'heroSelect') {
    // 返回按钮
    if (pos.x < 80 && pos.y < 50) {
      screenState.current = 'select';
      playSound('hit');
      return;
    }
    // 画灵卡片点击
    const hCardW = W - 60, hCardH = 200;
    const hCardX = 30, hGapY = 16;
    const hStartY = 80;
    for (let i = 0; i < HEROES.length; i++) {
      const cy = hStartY + i * (hCardH + hGapY);
      if (pos.x >= hCardX && pos.x <= hCardX + hCardW && pos.y >= cy && pos.y <= cy + hCardH) {
        currentHero = HEROES[i];
        startLevel(screenState.selectedLevel);
        screenState.current = 'battle';
        playSound('crit');
        return;
      }
    }
    return;
  }

  if (screenState.current === 'result') {
    const btnY = H * 0.78;
    // 再来一次按钮
    if (pos.x >= W/2 - 130 && pos.x <= W/2 - 10 && pos.y >= btnY - 20 && pos.y <= btnY + 20) {
      const lvIdx = screenState.resultLevelIdx;
      screenState.current = 'heroSelect';
      playSound('crit');
      return;
    }
    // 返回选择按钮
    if (pos.x >= W/2 + 10 && pos.x <= W/2 + 130 && pos.y >= btnY - 20 && pos.y <= btnY + 20) {
      screenState.current = 'select';
      playSound('hit');
      return;
    }
    return;
  }

  // ---- 战斗画面输入 ----

  // 停火按钮检测（优先级最高）
  const cfDist = dist(pos.x, pos.y, CEASEFIRE_X, CEASEFIRE_Y);
  if (cfDist < CEASEFIRE_R + 15) {
    state.ceaseFire = true;
    ceaseFirePointerId = id;
    return;
  }

  // 暂停按钮检测（右上角）
  if (pos.x >= W - 55 && pos.x <= W - 17 && pos.y >= 15 && pos.y <= 53) {
    state.paused = !state.paused;
    return;
  }

  // 暂停中 — 检测"返回选卷"按钮
  if (state.paused) {
    // 返回选卷按钮 — 屏幕中下方
    if (Math.abs(pos.x - W/2) < 60 && Math.abs(pos.y - (H/2 + 40)) < 20) {
      state.paused = false;
      screenState.current = 'select';
      playSound('hit');
      return;
    }
    return; // 暂停中不处理其他输入
  }

  if (state.wave.completed && state.completionStats) {
    // 通关后点击不再自动跳关（由结算画面处理）
    return;
  }

  // 双击检测 — 触发闪避/冲刺
  const now = Date.now();
  const tapDist = dist(pos.x, pos.y, lastTapX, lastTapY);
  if (now - lastTapTime < 300 && tapDist < 60) {
    if (!state.dash.active && state.dash.cooldown <= 0) {
      const dashAngle = state.joystick.active
        ? Math.atan2(state.joystick.dy, state.joystick.dx)
        : Math.atan2(pos.y + state.camera.y - state.player.y, pos.x + state.camera.x - state.player.x);
      // 如果摇杆没有方向，用最近的敌人方向
      if (state.joystick.active && Math.abs(state.joystick.dx) < 0.1 && Math.abs(state.joystick.dy) < 0.1) {
        // 静止双击 → 朝最近敌人冲刺
        let nearest = null, nd = Infinity;
        for (const en of state.enemies) {
          if (!en.alive) continue;
          const d2 = dist(state.player.x, state.player.y, en.x, en.y);
          if (d2 < nd) { nd = d2; nearest = en; }
        }
        if (nearest) dashAngle = Math.atan2(nearest.y - state.player.y, nearest.x - state.player.x);
      }
      state.dash.active = true;
      state.dash.timer = DASH_DURATION;
      state.dash.angle = dashAngle;
      state.dash.invincible = DASH_DURATION + 0.05; // 冲刺期间无敌
      playSound('crit');
      // 冲刺拖影粒子
      for (let i = 0; i < 5; i++) {
        state.particles.push({
          x: state.player.x, y: state.player.y,
          vx: (Math.random()-0.5) * 40,
          vy: (Math.random()-0.5) * 40,
          size: 3 + Math.random() * 4,
          color: C.INK_WASH,
          life: 0.2 + Math.random() * 0.2,
          maxLife: 0.4,
          alpha: 0.5,
        });
      }
    }
    lastTapTime = 0; // 重置防止三击
    return;
  }
  lastTapTime = now;
  lastTapX = pos.x;
  lastTapY = pos.y;

  // 手动锁敌 — 右侧区域点击敌人
  const joyDist = dist(pos.x, pos.y, joyX, joyY);
  if (joyDist >= JOY_R * 2.5) {
    // 屏幕坐标→世界坐标
    const worldX = pos.x + state.camera.x;
    const worldY = pos.y + state.camera.y;
    let closestEnemy = null, closestDist = 50; // 50px点击容差
    for (const e of state.enemies) {
      if (!e.alive) continue;
      const d2 = dist(worldX, worldY, e.x, e.y);
      if (d2 < closestDist) {
        closestDist = d2;
        closestEnemy = e;
      }
    }
    if (closestEnemy) {
      state.lockedTarget = closestEnemy;
      // 锁定反馈
      for (let j = 0; j < 4; j++) {
        const a = Math.random() * Math.PI * 2;
        state.particles.push({
          x: closestEnemy.x, y: closestEnemy.y,
          vx: Math.cos(a) * 60, vy: Math.sin(a) * 60,
          size: 2 + Math.random() * 2,
          color: C.RED,
          life: 0.2, maxLife: 0.3, alpha: 1,
        });
      }
      return;
    } else {
      // 点空白→解除锁定
      state.lockedTarget = null;
    }
  }

  const joyDist2 = dist(pos.x, pos.y, joyX, joyY);
  if (joyDist2 < JOY_R * 2.5 && state.joystick.pointerId === -1) {
    state.joystick.active = true;
    state.joystick.pointerId = id;
    updateJoystick(pos.x, pos.y);
  }
}

function onPointerMove(e) {
  e.preventDefault();
  const pos = getPointerPos(e);

  // ---- 标题画面hover ----
  if (screenState.current === 'title') {
    const btnX = W/2, btnY = H * 0.58;
    const btnW = 140, btnH = 44;
    screenState.titleBtnHover = Math.abs(pos.x - btnX) < btnW/2 && Math.abs(pos.y - btnY) < btnH/2;
    return;
  }

  // ---- 关卡选择hover ----
  if (screenState.current === 'select') {
    const cardW = W - 60, cardH = 160;
    const cardX = 30, gapY = 20;
    const startY = 85;
    screenState.selectHover = -1;
    for (let i = 0; i < LEVEL_CONFIG.length; i++) {
      const cy = startY + i * (cardH + gapY);
      if (pos.x >= cardX && pos.x <= cardX + cardW && pos.y >= cy && pos.y <= cy + cardH) {
        screenState.selectHover = i;
        break;
      }
    }
    return;
  }

  // ---- 画灵选择hover ----
  if (screenState.current === 'heroSelect') {
    const hCardW = W - 60, hCardH = 200;
    const hCardX = 30, hGapY = 16;
    const hStartY = 80;
    screenState.heroHover = -1;
    for (let i = 0; i < HEROES.length; i++) {
      const cy = hStartY + i * (hCardH + hGapY);
      if (pos.x >= hCardX && pos.x <= hCardX + hCardW && pos.y >= cy && pos.y <= cy + hCardH) {
        screenState.heroHover = i;
        break;
      }
    }
    return;
  }

  // ---- 结算画面hover ----
  if (screenState.current === 'result') {
    const btnY = H * 0.78;
    screenState.resultRetryHover = pos.x >= W/2 - 130 && pos.x <= W/2 - 10 && pos.y >= btnY - 20 && pos.y <= btnY + 20;
    screenState.resultBackHover = pos.x >= W/2 + 10 && pos.x <= W/2 + 130 && pos.y >= btnY - 20 && pos.y <= btnY + 20;
    return;
  }

  // ---- 战斗画面摇杆 ----
  if (!state.joystick.active) return;

  const id = getPointerId(e);
  if (id !== state.joystick.pointerId) return;
  updateJoystick(pos.x, pos.y);
}

function onPointerUp(e) {
  e.preventDefault();
  const id = getPointerId(e);

  // 停火按钮释放
  if (id === ceaseFirePointerId) {
    state.ceaseFire = false;
    ceaseFirePointerId = -1;
    return;
  }

  if (id !== state.joystick.pointerId) return;

  state.joystick.active = false;
  state.joystick.pointerId = -1;
  state.joystick.dx = 0;
  state.joystick.dy = 0;
}

function updateJoystick(px, py) {
  let dx = px - joyX;
  let dy = py - joyY;
  const d = Math.sqrt(dx*dx + dy*dy);

  if (d < JOY_DEAD) {
    state.joystick.dx = 0;
    state.joystick.dy = 0;
    return;
  }

  if (d > JOY_R) {
    dx = dx / d * JOY_R;
    dy = dy / d * JOY_R;
  }

  state.joystick.dx = dx / JOY_R;
  state.joystick.dy = dy / JOY_R;
}

canvas.addEventListener('touchstart', onPointerDown, { passive: false });
canvas.addEventListener('touchmove', onPointerMove, { passive: false });
canvas.addEventListener('touchend', onPointerUp, { passive: false });
canvas.addEventListener('touchcancel', onPointerUp, { passive: false });
canvas.addEventListener('mousedown', onPointerDown);
canvas.addEventListener('mousemove', onPointerMove);
canvas.addEventListener('mouseup', onPointerUp);

// ==================== 射击函数 ====================
function getHeroAtk() { return (state.heroStats && state.heroStats.atk) || BULLET_DAMAGE; }
function getHeroSpd() { return (state.heroStats && state.heroStats.spd) || PLAYER_SPEED; }
function getHeroCrit() { return (state.heroStats && state.heroStats.crit) || 15; }
function getHeroFireRate() { return FIRE_RATE / (currentHero.fireRateMult || 1); }
function getHeroBulletSize() { return currentHero.id === 'mohen' ? 8 : (5); } // 墨痕大弹

function fireBullet(fromX, fromY, toX, toY, isRage = false, bulletColor = 0) {
  playSound(isRage ? 'crit' : 'shoot');
  const angle = Math.atan2(toY - fromY, toX - fromX) + (Math.random() - 0.5) * 0.1;

  const colorIdx = bulletColor % COLORS.length;
  const color = COLORS[colorIdx];
  const baseSize = getHeroBulletSize();
  const size = isRage ? Math.max(baseSize, RAGE_BULLET_SIZE) : baseSize;
  const atk = getHeroAtk() * (isRage ? RAGE_DAMAGE_MULT : 1);

  state.bullets.push({
    x: fromX, y: fromY,
    vx: Math.cos(angle) * (isRage ? BULLET_SPEED * 1.2 : BULLET_SPEED),
    vy: Math.sin(angle) * (isRage ? BULLET_SPEED * 1.2 : BULLET_SPEED),
    life: isRage ? 2000 : 1500,
    color: color,
    size: size,
    colorIdx: colorIdx,
    isRage: isRage,
    damage: atk,
  });
}

function fireEnemyBullet(fromX, fromY, toX, toY) {
  const angle = Math.atan2(toY - fromY, toX - fromX);
  const isTracking = Math.random() < 0.3;
  state.enemyBullets.push({
    x: fromX, y: fromY,
    vx: Math.cos(angle) * ENEMY_BULLET_SPEED,
    vy: Math.sin(angle) * ENEMY_BULLET_SPEED,
    life: ENEMY_BULLET_LIFE,
    size: isTracking ? 3 : 4,
    tracking: isTracking,
    trackingStr: isTracking ? 1.5 : 0,
  });
}

function fireEnemyBulletPos(fromX, fromY, angle, tracking) {
  state.enemyBullets.push({
    x: fromX, y: fromY,
    vx: Math.cos(angle) * ENEMY_BULLET_SPEED,
    vy: Math.sin(angle) * ENEMY_BULLET_SPEED,
    life: ENEMY_BULLET_LIFE,
    size: tracking ? 3 : 4,
    tracking: tracking,
    trackingStr: tracking ? 2.5 : 0,
  });
}

// ==================== 视觉效果函数 ====================
function spawnDirectionalSplash(x, y, bulletAngle, color, count) {
  for (let i = 0; i < count; i++) {
    const baseAngle = bulletAngle + Math.PI;
    const spread = (Math.random() - 0.5) * Math.PI * 1.2;
    const angle = baseAngle + spread;
    const speed = 60 + Math.random() * 140;
    state.particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 3 + Math.random() * 5,
      color: color,
      life: 0.3 + Math.random() * 0.2,
      maxLife: 0.5,
      alpha: 1,
    });
  }
}

function spawnInkDrip(x, y) {
  for (let i = 0; i < 3; i++) {
    state.particles.push({
      x: x + (Math.random() - 0.5) * 10,
      y: y,
      vx: (Math.random() - 0.5) * 10,
      vy: 80 + Math.random() * 40,
      size: 2 + Math.random() * 3,
      color: C.INK_BLACK,
      life: 0.5 + Math.random() * 0.3,
      maxLife: 0.8,
      alpha: 1,
    });
  }
}

function spawnInkStain(x, y, color = C.INK_MEDIUM) {
  const stain = {
    x: x + (Math.random() - 0.5) * 8,
    y: y + (Math.random() - 0.5) * 8,
    size: 4 + Math.random() * 8,
    color: color,
    alpha: 0.25,
    life: 2,
    maxLife: 2,
    vx: 0, vy: 0, isStain: true,
  };
  state.particles.push(stain);

  state.groundStains.push({
    x: x + (Math.random() - 0.5) * 16,
    y: y + (Math.random() - 0.5) * 16,
    size: 3 + Math.random() * 10,
    color: color,
    alpha: 0.2 + Math.random() * 0.1,
  });
}

function spawnDamageNumber(x, y, damage, isCrit, breakColor) {
  // 防重叠：检查附近已有的伤害数字，偏移新数字位置
  let offX = (Math.random() - 0.5) * 14;
  let offY = (Math.random() - 0.5) * 8;
  for (const dn of state.damageNumbers) {
    if (Math.abs(dn.x - x) < 20 && Math.abs(dn.y - y) < 16) {
      offX += (Math.random() > 0.5 ? 1 : -1) * (18 + Math.random() * 10);
      offY -= 10 + Math.random() * 8;
      break; // 只偏移一次
    }
  }
  // 颜色：普通=黑，暴击=红，击破=护甲色
  let color = C.INK_BLACK;
  if (breakColor) color = breakColor;
  else if (isCrit) color = C.RED;
  state.damageNumbers.push({
    x: x + offX,
    y: y + offY,
    damage, isCrit, color,
    life: 0.9,
    alpha: 1,
    rotation: (Math.random() - 0.5) * 0.15,
  });
}

// ==================== 涂色画布系统 ====================

/**
 * 在paintCanvas上画持久墨迹 — 类似乱涂彩世界的涂色效果
 * 每次命中/弹道经过都会在画布上留下颜色，视觉上累积"涂色进度"
 */
function paintInk(wx, wy, color, radius) {
  // 世界坐标→屏幕坐标
  const x = wx - state.camera.x;
  const y = wy - state.camera.y;
  // 超出屏幕不绘制
  if (x < -30 || x > W + 30 || y < -30 || y > H + 30) return;
  radius = radius || (5 + Math.random() * 8);
  paintCtx.save();
  paintCtx.globalAlpha = 0.35 + Math.random() * 0.2;

  // 主墨点
  paintCtx.fillStyle = color;
  paintCtx.beginPath();
  paintCtx.arc(x, y, radius, 0, Math.PI * 2);
  paintCtx.fill();

  // 墨晕 — 半透明大圆模拟晕染
  paintCtx.globalAlpha = 0.08 + Math.random() * 0.07;
  paintCtx.beginPath();
  paintCtx.arc(x + (Math.random()-0.5)*4, y + (Math.random()-0.5)*4, radius * 1.8, 0, Math.PI * 2);
  paintCtx.fill();

  // 飞溅小点
  for (let i = 0; i < 2 + Math.floor(Math.random()*2); i++) {
    const sx = x + (Math.random()-0.5) * radius * 3;
    const sy = y + (Math.random()-0.5) * radius * 3;
    const sr = 1 + Math.random() * 3;
    paintCtx.globalAlpha = 0.2 + Math.random() * 0.15;
    paintCtx.beginPath();
    paintCtx.arc(sx, sy, sr, 0, Math.PI * 2);
    paintCtx.fill();
  }

  paintCtx.restore();
}

/**
 * 爆发晕染 — 泼墨爆发时，画布上的墨迹向外扩散后消散
 */
function rageWashStart() {
  state.rageWash.active = true;
  state.rageWash.progress = 0;
}

function rageWashUpdate(dt) {
  if (!state.rageWash.active) return;
  state.rageWash.progress += dt * 1.5; // ~0.67秒完成
  if (state.rageWash.progress >= 1) {
    // 晕染完成，清空画布
    paintCtx.clearRect(0, 0, W, H);
    state.rageWash.active = false;
    state.rageWash.progress = 0;
    state.paintCover = 0;
    return;
  }

  // 每帧微调画布 — 模糊扩散 + 淡出
  paintCtx.save();
  paintCtx.globalAlpha = 0.06;
  paintCtx.fillStyle = C.BG;
  paintCtx.fillRect(0, 0, W, H);

  // 墨迹向外晕染 — 随机在现有墨迹周围画更淡更大的点
  if (Math.random() < 0.4) {
    const rx = Math.random() * W;
    const ry = Math.random() * H;
    paintCtx.globalAlpha = 0.03;
    paintCtx.fillStyle = C.RED;
    paintCtx.beginPath();
    paintCtx.arc(rx, ry, 20 + Math.random() * 30, 0, Math.PI * 2);
    paintCtx.fill();
  }
  paintCtx.restore();
}

// ==================== 踩圈切色系统 ====================
const COLOR_CIRCLE_RADIUS = 30;       // 圈的半径
const COLOR_CIRCLE_LIFETIME = 8;      // 圈存在时间（秒）
const COLOR_CIRCLE_SPAWN_INTERVAL = 3; // 每3秒生成一个新圈
const COLOR_CIRCLE_MAX = 5;           // 地面最多同时5个圈

function spawnColorCircle() {
  const p = state.player;
  // 在玩家周围随机位置生成（但不要太近也不要太远）
  const angle = Math.random() * Math.PI * 2;
  const radius = 120 + Math.random() * 200;
  const cx = clamp(p.x + Math.cos(angle) * radius, 60, WORLD_W - 60);
  const cy = clamp(p.y + Math.sin(angle) * radius, 60, WORLD_H - 60);
  const colorIdx = Math.floor(Math.random() * COLORS.length);

  state.colorCircles.push({
    x: cx,
    y: cy,
    colorIdx: colorIdx,
    color: COLORS[colorIdx],
    life: COLOR_CIRCLE_LIFETIME,
    maxLife: COLOR_CIRCLE_LIFETIME,
    pulsePhase: Math.random() * Math.PI * 2,
  });

  // 超过上限则移除最老的
  if (state.colorCircles.length > COLOR_CIRCLE_MAX) {
    state.colorCircles.shift();
  }
}

function updateColorCircles(dt) {
  const p = state.player;

  // 生成计时
  state.colorCircleTimer += dt;
  if (state.colorCircleTimer >= (LEVEL_CONFIG[state.level].colorCircleRate || COLOR_CIRCLE_SPAWN_INTERVAL) && state.colorCircles.length < COLOR_CIRCLE_MAX) {
    state.colorCircleTimer = 0;
    spawnColorCircle();
  }

  // 更新 + 踩踏检测
  for (let i = state.colorCircles.length - 1; i >= 0; i--) {
    const cc = state.colorCircles[i];
    cc.life -= dt;

    // 过期移除
    if (cc.life <= 0) {
      state.colorCircles.splice(i, 1);
      continue;
    }

    // 玩家踩上检测
    const d = dist(p.x, p.y, cc.x, cc.y);
    if (d < COLOR_CIRCLE_RADIUS + PLAYER_SIZE) {
      // 切换当前攻击颜色
      state.bulletColorIndex = cc.colorIdx;

      // 踩踏反馈特效
      for (let j = 0; j < 8; j++) {
        const a = Math.random() * Math.PI * 2;
        const sp = 80 + Math.random() * 120;
        state.particles.push({
          x: cc.x, y: cc.y,
          vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
          size: 3 + Math.random() * 4,
          color: cc.color,
          life: 0.3 + Math.random() * 0.2,
          maxLife: 0.5,
          alpha: 1,
        });
      }
      paintInk(cc.x, cc.y, cc.color, 20);

      // 显示颜色名
      const cName = COLOR_NAMES[cc.colorIdx];
      showActionText(`·${cName}·`, cc.x, cc.y - 30);

      playSound('hit');
      state.colorCircles.splice(i, 1);
    }
  }
}

function drawColorCircles() {
  const now = Date.now();
  for (const cc of state.colorCircles) {
    const lifeRatio = cc.life / cc.maxLife;
    const pulse = 0.7 + Math.sin(now * 0.004 + cc.pulsePhase) * 0.3;

    // 即将消失时闪烁
    let alpha = 0.35 * pulse;
    if (lifeRatio < 0.25) {
      alpha *= (0.3 + 0.7 * Math.abs(Math.sin(now * 0.01)));
    }

    // 外圈光晕
    ctx.globalAlpha = alpha * 0.4;
    ctx.fillStyle = cc.color;
    ctx.beginPath();
    ctx.arc(cc.x, cc.y, COLOR_CIRCLE_RADIUS + 8, 0, Math.PI * 2);
    ctx.fill();

    // 主圈
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = cc.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cc.x, cc.y, COLOR_CIRCLE_RADIUS, 0, Math.PI * 2);
    ctx.stroke();

    // 内填充
    ctx.globalAlpha = alpha * 0.15;
    ctx.fillStyle = cc.color;
    ctx.beginPath();
    ctx.arc(cc.x, cc.y, COLOR_CIRCLE_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    // 中心色点
    ctx.globalAlpha = alpha * 1.5;
    ctx.fillStyle = cc.color;
    ctx.beginPath();
    ctx.arc(cc.x, cc.y, 6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// ==================== 绘制函数 ====================

// 固定种子纹理 — 预生成纸张纹理点（覆盖整个世界）
let paperTextureDots = null;
function generatePaperTexture() {
  paperTextureDots = [];
  for (let i = 0; i < 600; i++) {
    paperTextureDots.push({
      x: Math.random() * (WORLD_W + 120) - 60,
      y: Math.random() * (WORLD_H + 120) - 60,
      w: 1 + Math.random() * 1.5,
      h: 1 + Math.random() * 1.5,
      a: 0.015 + Math.random() * 0.03,
    });
  }
}
function ensurePaperTexture() {
  if (paperTextureDots) return;
  generatePaperTexture();
}

function drawBackground() {
  const cam = state.camera;
  const cfg = LEVEL_CONFIG[state.level];
  const bg = cfg.bg;
  ensurePaperTexture();

  // ---- 底色 — 关卡自定义 ----
  ctx.fillStyle = bg.base;
  ctx.fillRect(0, 0, W, H);

  // 纸张纹理 — 在世界坐标中分布，摄像机偏移后仅绘制可见区域
  for (const dot of paperTextureDots) {
    const sx = dot.x - cam.x;
    const sy = dot.y - cam.y;
    if (sx < -10 || sx > W + 10 || sy < -10 || sy > H + 10) continue;
    ctx.fillStyle = `rgba(200,200,200,${dot.a})`;
    ctx.fillRect(sx, sy, dot.w, dot.h);
  }

  // 纸张横线 — 古风信笺感
  const lineSpacing = 60;
  const lineOffY = -(cam.y % lineSpacing);
  ctx.strokeStyle = bg.lineColor;
  ctx.lineWidth = 1;
  for (let ly = lineOffY; ly < H; ly += lineSpacing) {
    ctx.beginPath();
    ctx.moveTo(0, ly);
    ctx.lineTo(W, ly);
    ctx.stroke();
  }

  // 远山 — 0.15倍视差，关卡自定义山峰和颜色
  const mxShift = -cam.x * 0.15;
  const myShift = -cam.y * 0.15;
  ctx.fillStyle = bg.mountainColor;
  ctx.beginPath();
  ctx.moveTo(-50, H);
  for (const [px, py] of bg.mountainPeaks) {
    ctx.lineTo(px * W + mxShift, py * H + myShift);
  }
  ctx.lineTo(W + 50 + mxShift, H);
  ctx.closePath();
  ctx.fill();

  // ---- 近景装饰 — 根据关卡类型 ----
  drawLevelDecoration(cfg, cam);

  // 标题 — 显示当前关卡名
  ctx.font = '24px "STKaiti","KaiTi","Microsoft YaHei",serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#888';
  ctx.globalAlpha = 0.3;
  ctx.fillText('水墨丹青', W/2, 48);
  ctx.font = '12px "STKaiti","KaiTi","Microsoft YaHei",serif';
  ctx.fillText(`·${cfg.name}·`, W/2, 74);

  // 暂停按钮
  ctx.globalAlpha = 0.2;
  ctx.strokeStyle = C.RED;
  ctx.lineWidth = 1;
  ctx.strokeRect(W - 52, 18, 32, 32);
  ctx.font = '14px "STKaiti","KaiTi","Microsoft YaHei",serif';
  ctx.fillStyle = C.RED;
  ctx.globalAlpha = state.paused ? 0.5 : 0.2;
  ctx.fillText(state.paused ? '▶' : '||', W - 36, 38);
  ctx.globalAlpha = 1;

  // 暂停遮罩
  if (state.paused) {
    ctx.fillStyle = `rgba(245,240,232,0.6)`;
    ctx.fillRect(0, 0, W, H);
    ctx.font = '32px "STKaiti","KaiTi","Microsoft YaHei",serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = C.INK_DARK;
    ctx.globalAlpha = 0.8;
    ctx.fillText('·暂歇·', W/2, H/2 - 40);
    ctx.font = '14px "STKaiti","KaiTi","Microsoft YaHei",serif';
    ctx.fillStyle = C.INK_LIGHT;
    ctx.globalAlpha = 0.5;
    ctx.fillText('点击右上角继续', W/2, H/2);

    // 返回选卷按钮
    ctx.globalAlpha = 0.4;
    ctx.font = '13px "STKaiti","KaiTi","Microsoft YaHei",serif';
    ctx.fillStyle = C.INK_MEDIUM;
    ctx.fillText('·返回选卷·', W/2, H/2 + 40);
    ctx.globalAlpha = 1;
  }
}

// 关卡近景装饰绘制
function drawLevelDecoration(cfg, cam) {
  const bg = cfg.bg;
  switch (bg.decoType) {
    case 'bamboo': {
      // 墨竹 — 屏幕左右竖线，0.4倍视差
      const bxShift = -cam.x * 0.4;
      const byShift = -cam.y * 0.4;
      ctx.strokeStyle = bg.decoColor;
      ctx.lineWidth = 2;
      for (let i = 0; i < bg.decoCount; i++) {
        const bx = (i < bg.decoCount / 2)
          ? 20 + i * 15 + bxShift % 60
          : W - 20 - (i - bg.decoCount / 2) * 15 + bxShift % 60;
        ctx.beginPath();
        ctx.moveTo(bx, 0 + byShift % 40);
        ctx.lineTo(bx + (Math.random() > 0.5 ? 3 : -3), H + byShift % 40);
        ctx.stroke();
      }
      break;
    }
    case 'petals': {
      // 飘落花瓣 — 小椭圆，0.3倍视差 + 缓慢飘落
      const pxShift = -cam.x * 0.3;
      const pyShift = -cam.y * 0.3;
      const t = Date.now() * 0.001;
      ctx.fillStyle = bg.decoColor;
      for (let i = 0; i < bg.decoCount; i++) {
        const seed = i * 137.5;
        const bx = ((seed + pxShift) % (W + 40)) - 20;
        const by = ((seed * 0.7 + t * 20 + pyShift) % (H + 40)) - 20;
        ctx.save();
        ctx.translate(bx, by);
        ctx.rotate(Math.sin(t + i) * 0.5);
        ctx.beginPath();
        ctx.ellipse(0, 0, 4, 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      break;
    }
    case 'seals': {
      // 印章纹样 — 小方块红印，0.2倍视差
      const sxShift = -cam.x * 0.2;
      const syShift = -cam.y * 0.2;
      ctx.fillStyle = bg.decoColor;
      for (let i = 0; i < bg.decoCount; i++) {
        const seed = i * 251;
        const sx = ((seed * 3.7 + sxShift) % (W + 40)) - 20;
        const sy = ((seed * 2.3 + syShift) % (H + 40)) - 20;
        const ss = 8 + (seed % 6);
        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate((seed % 30 - 15) * Math.PI / 180);
        ctx.fillRect(-ss/2, -ss/2, ss, ss);
        ctx.restore();
      }
      break;
    }
  }
}

// ==================== 障碍物绘制 ====================
function drawObstacles() {
  for (const ob of state.obstacles) {
    ctx.save();
    // 被涂色效果 — 墨迹覆盖
    if (ob.paintColor && ob.paintAlpha > 0) {
      ctx.globalAlpha = ob.paintAlpha * 0.4;
      ctx.fillStyle = ob.paintColor;
      if (ob.r) {
        // 圆形障碍物涂色
        ctx.beginPath();
        ctx.arc(ob.x, ob.y, ob.r + 4, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // 矩形障碍物涂色
        const cx = ob.x, cy = ob.y;
        ctx.translate(cx, cy);
        if (ob.angle) ctx.rotate(ob.angle);
        ctx.fillRect(-ob.w/2 - 3, -ob.h/2 - 3, ob.w + 6, ob.h + 6);
      }
      ctx.globalAlpha = 1;
    }

    switch (ob.type) {
      case 'stele': {
        // 石碑 — 竖长矩形+碑首弧形+文字
        const cx = ob.x, cy = ob.y;
        ctx.fillStyle = '#8a8070';
        ctx.fillRect(cx - ob.w/2, cy - ob.h/2, ob.w, ob.h);
        // 碑首弧形
        ctx.beginPath();
        ctx.arc(cx, cy - ob.h/2, ob.w/2, Math.PI, 0);
        ctx.fill();
        // 碑身纹理线
        ctx.strokeStyle = 'rgba(60,50,40,0.15)';
        ctx.lineWidth = 1;
        for (let ly = cy - ob.h/2 + 15; ly < cy + ob.h/2 - 5; ly += 8) {
          ctx.beginPath();
          ctx.moveTo(cx - ob.w/2 + 4, ly);
          ctx.lineTo(cx + ob.w/2 - 4, ly);
          ctx.stroke();
        }
        // 碑文
        if (ob.label) {
          ctx.fillStyle = 'rgba(60,50,40,0.4)';
          ctx.font = '14px "STKaiti","KaiTi",serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(ob.label, cx, cy);
        }
        break;
      }
      case 'inkpool': {
        // 墨池 — 圆形+波纹+深色墨水
        const cx = ob.x, cy = ob.y;
        // 外圈（地面晕染）
        ctx.fillStyle = 'rgba(30,28,24,0.08)';
        ctx.beginPath();
        ctx.arc(cx, cy, ob.r + 8, 0, Math.PI * 2);
        ctx.fill();
        // 墨池主体
        ctx.fillStyle = 'rgba(30,28,24,0.3)';
        ctx.beginPath();
        ctx.arc(cx, cy, ob.r, 0, Math.PI * 2);
        ctx.fill();
        // 波纹动画
        const t = Date.now() * 0.001;
        ctx.strokeStyle = 'rgba(80,70,60,0.12)';
        ctx.lineWidth = 1;
        for (let ri = 0; ri < 3; ri++) {
          const rr = ob.r * (0.3 + ri * 0.25) + Math.sin(t + ri) * 3;
          ctx.beginPath();
          ctx.arc(cx, cy, rr, 0, Math.PI * 2);
          ctx.stroke();
        }
        // 中心墨点
        ctx.fillStyle = 'rgba(26,26,26,0.5)';
        ctx.beginPath();
        ctx.arc(cx, cy, ob.r * 0.25, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case 'bridge': {
        // 断桥 — 倾斜长条+断裂纹理
        const cx = ob.x, cy = ob.y;
        ctx.translate(cx, cy);
        if (ob.angle) ctx.rotate(ob.angle);
        // 桥面
        ctx.fillStyle = '#9a8a70';
        ctx.fillRect(-ob.w/2, -ob.h/2, ob.w, ob.h);
        // 木纹
        ctx.strokeStyle = 'rgba(60,50,30,0.2)';
        ctx.lineWidth = 1;
        for (let bx = -ob.w/2 + 10; bx < ob.w/2; bx += 15) {
          ctx.beginPath();
          ctx.moveTo(bx, -ob.h/2);
          ctx.lineTo(bx, ob.h/2);
          ctx.stroke();
        }
        // 断裂痕迹
        ctx.strokeStyle = 'rgba(80,40,20,0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-5, -ob.h/2 - 2);
        ctx.lineTo(5, ob.h/2 + 2);
        ctx.stroke();
        break;
      }
      case 'flowerbed': {
        // 花坛 — 圆形+花瓣装饰
        const cx = ob.x, cy = ob.y;
        // 土壤
        ctx.fillStyle = '#8a7a60';
        ctx.beginPath();
        ctx.arc(cx, cy, ob.r, 0, Math.PI * 2);
        ctx.fill();
        // 花瓣
        const petalColors = ['#c47070','#d4a070','#a0c470'];
        for (let pi = 0; pi < 5; pi++) {
          const pa = pi * Math.PI * 2 / 5 + Date.now() * 0.0002;
          const pr = ob.r * 0.6;
          const px = cx + Math.cos(pa) * pr;
          const py = cy + Math.sin(pa) * pr;
          ctx.fillStyle = petalColors[pi % 3];
          ctx.globalAlpha = 0.4;
          ctx.beginPath();
          ctx.arc(px, py, 4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        break;
      }
      case 'perch': {
        // 鸟架 — 竖杆+横架
        const cx = ob.x, cy = ob.y;
        // 竖杆
        ctx.fillStyle = '#7a6a50';
        ctx.fillRect(cx - 3, cy - ob.h/2, 6, ob.h);
        // 横架
        ctx.fillRect(cx - 15, cy - ob.h/2, 30, 5);
        // 顶部装饰
        ctx.fillStyle = '#6a5a40';
        ctx.beginPath();
        ctx.arc(cx, cy - ob.h/2 - 3, 5, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case 'frame': {
        // 画框 — 矩形边框
        const cx = ob.x, cy = ob.y;
        ctx.strokeStyle = '#6a5a40';
        ctx.lineWidth = 3;
        ctx.strokeRect(cx - ob.w/2, cy - ob.h/2, ob.w, ob.h);
        // 内框
        ctx.strokeStyle = 'rgba(100,80,50,0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(cx - ob.w/2 + 4, cy - ob.h/2 + 4, ob.w - 8, ob.h - 8);
        break;
      }
      case 'sealstone': {
        // 印章石 — 圆形+红色印纹
        const cx = ob.x, cy = ob.y;
        // 石体
        ctx.fillStyle = '#8a7a6a';
        ctx.beginPath();
        ctx.arc(cx, cy, ob.r, 0, Math.PI * 2);
        ctx.fill();
        // 红印纹
        ctx.fillStyle = 'rgba(196,58,49,0.25)';
        const sSize = ob.r * 0.5;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(0.1);
        ctx.fillRect(-sSize/2, -sSize/2, sSize, sSize);
        ctx.restore();
        // 石纹
        ctx.strokeStyle = 'rgba(60,50,40,0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx - ob.r*0.2, cy - ob.r*0.1, ob.r*0.5, 0, Math.PI);
        ctx.stroke();
        break;
      }
      case 'screen': {
        // 屏风 — 倾斜长条+格纹
        const cx = ob.x, cy = ob.y;
        ctx.translate(cx, cy);
        if (ob.angle) ctx.rotate(ob.angle);
        // 屏面
        ctx.fillStyle = '#a09080';
        ctx.fillRect(-ob.w/2, -ob.h/2, ob.w, ob.h);
        // 格纹
        ctx.strokeStyle = 'rgba(80,60,40,0.15)';
        ctx.lineWidth = 1;
        const gridStep = 20;
        for (let gx = -ob.w/2 + gridStep; gx < ob.w/2; gx += gridStep) {
          ctx.beginPath();
          ctx.moveTo(gx, -ob.h/2);
          ctx.lineTo(gx, ob.h/2);
          ctx.stroke();
        }
        // 边框
        ctx.strokeStyle = '#6a5a40';
        ctx.lineWidth = 2;
        ctx.strokeRect(-ob.w/2, -ob.h/2, ob.w, ob.h);
        break;
      }
    }
    ctx.restore();
  }
}

function drawPlayer() {
  const p = state.player;
  const isRage = state.rage.active;
  const hurtFlash = state.playerHurtFlash > 0;
  const isDashing = state.dash.active;

  let bobY = 0;
  if (p.isMoving) {
    bobY = Math.sin(Date.now() * 0.008) * 2 - 1;
  }

  ctx.save();
  ctx.translate(0, bobY);

  // 冲刺无敌 — 半透明闪烁
  if (state.dash.invincible > 0) {
    ctx.globalAlpha = 0.3 + Math.sin(Date.now() * 0.03) * 0.2;
  }

  // 使用图片资源
  if (assets.player && assets.player.complete && assets.player.naturalWidth > 0) {
    const sz = isRage ? 50 : 44;
    const breath = Math.sin(Date.now() * 0.003) * 0.04 + 1;

    if (isRage) {
      const pulse = 0.15 + Math.sin(Date.now() * 0.008) * 0.1;
      ctx.fillStyle = `rgba(196,58,49,${pulse})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, sz + 6, 0, Math.PI * 2);
      ctx.fill();

      const now = Date.now() * 0.003;
      for (let i = 0; i < 3; i++) {
        const a = now + i * Math.PI * 2 / 3;
        const r = sz + 14 + Math.sin(now * 0.5 + i) * 4;
        ctx.fillStyle = C.RED;
        ctx.globalAlpha = 0.4 + Math.sin(now + i) * 0.2;
        ctx.beginPath();
        ctx.arc(p.x + Math.cos(a) * r, p.y + Math.sin(a) * r, 3 + Math.sin(now * 2 + i) * 1, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 0.15;
        ctx.beginPath();
        ctx.arc(p.x + Math.cos(a) * r * 0.7, p.y + Math.sin(a) * r * 0.7, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }

    ctx.save();
    ctx.globalAlpha = hurtFlash ? 0.6 : 1;
    const bSz = sz * breath;
    ctx.drawImage(assets.player, p.x - bSz/2, p.y - bSz/2, bSz, bSz);
    ctx.restore();

  // 方向指示器
  ctx.globalAlpha = 0.5;
  const indX = p.x + Math.cos(p.angle) * (sz/2 + 10);
  const indY = p.y + Math.sin(p.angle) * (sz/2 + 10);
  ctx.fillStyle = C.RED;
  ctx.beginPath();
  const triSize = 6;
  ctx.moveTo(indX + Math.cos(p.angle) * triSize, indY + Math.sin(p.angle) * triSize);
  ctx.lineTo(indX + Math.cos(p.angle - 2.2) * triSize, indY + Math.sin(p.angle - 2.2) * triSize);
  ctx.lineTo(indX + Math.cos(p.angle + 2.2) * triSize, indY + Math.sin(p.angle + 2.2) * triSize);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;

  // 当前攻击颜色环 — 外圈发光弧线
  const curColor = COLORS[state.bulletColorIndex];
  ctx.strokeStyle = curColor;
  ctx.globalAlpha = 0.6 + Math.sin(Date.now() * 0.006) * 0.2;
  ctx.lineWidth = 3;
  ctx.beginPath();
  const colorArcStart = -Math.PI / 2;
  ctx.arc(p.x, p.y, sz/2 + 4, colorArcStart, colorArcStart + Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 0.15;
  ctx.fillStyle = curColor;
  ctx.beginPath();
  ctx.arc(p.x, p.y, sz/2 + 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.restore();
  return;
  }

  // 图形替换绘制
  if (isRage) {
    const pulse = 0.15 + Math.sin(Date.now() * 0.008) * 0.1;
    ctx.fillStyle = `rgba(196,58,49,${pulse})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, PLAYER_SIZE + 12, 0, Math.PI * 2);
    ctx.fill();

    const now = Date.now() * 0.003;
    for (let i = 0; i < 3; i++) {
      const a = now + i * Math.PI * 2 / 3;
      const r = PLAYER_SIZE + 20 + Math.sin(now * 0.5 + i) * 4;
      const ox = Math.cos(a) * r;
      const oy = Math.sin(a) * r;
      ctx.fillStyle = C.RED;
      ctx.globalAlpha = 0.4 + Math.sin(now + i) * 0.2;
      ctx.beginPath();
      ctx.arc(p.x + ox, p.y + oy, 3 + Math.sin(now * 2 + i) * 1, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = 0.15;
      ctx.beginPath();
      ctx.arc(p.x + ox * 0.7, p.y + oy * 0.7, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // 光晕
  ctx.fillStyle = isRage ? `rgba(196,58,49,0.15)` : 'rgba(200,50,50,0.08)';
  ctx.beginPath();
  ctx.arc(p.x, p.y, PLAYER_SIZE + 6, 0, Math.PI * 2);
  ctx.fill();

  // 身体
  const bodyColor = isRage ? C.RED : (currentHero.bodyColor || C.INK_BLACK);
  ctx.fillStyle = hurtFlash ? '#ffffff' : bodyColor;
  ctx.globalAlpha = hurtFlash ? 0.9 : 0.9;
  ctx.beginPath();
  ctx.arc(p.x, p.y, PLAYER_SIZE, 0, Math.PI * 2);
  ctx.fill();

  // 外圈
  ctx.globalAlpha = isRage ? 0.3 : 0.15;
  ctx.fillStyle = isRage ? C.RED : (currentHero.color || C.INK_BLACK);
  ctx.beginPath();
  ctx.arc(p.x, p.y, PLAYER_SIZE + 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // 腰带
  ctx.strokeStyle = currentHero.color || C.RED;
  ctx.globalAlpha = 0.4;
  ctx.lineWidth = 2;
  ctx.beginPath();
  const beltAngle = p.angle + Math.PI / 2;
  ctx.arc(p.x, p.y, PLAYER_SIZE * 0.3, beltAngle - 0.8, beltAngle + 0.8);
  ctx.stroke();

  // 方向指示器
  ctx.globalAlpha = 0.5;
  const indX = p.x + Math.cos(p.angle) * (PLAYER_SIZE + 14);
  const indY = p.y + Math.sin(p.angle) * (PLAYER_SIZE + 14);
  ctx.fillStyle = C.RED;
  ctx.beginPath();
  const triSize = 6;
  ctx.moveTo(indX + Math.cos(p.angle) * triSize, indY + Math.sin(p.angle) * triSize);
  ctx.lineTo(indX + Math.cos(p.angle - 2.2) * triSize, indY + Math.sin(p.angle - 2.2) * triSize);
  ctx.lineTo(indX + Math.cos(p.angle + 2.2) * triSize, indY + Math.sin(p.angle + 2.2) * triSize);
  ctx.closePath();
  ctx.fill();

  // 当前攻击颜色环 — 图形替换版
  const curColor = COLORS[state.bulletColorIndex];
  ctx.strokeStyle = curColor;
  ctx.globalAlpha = 0.6 + Math.sin(Date.now() * 0.006) * 0.2;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(p.x, p.y, PLAYER_SIZE + 4, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 0.1;
  ctx.fillStyle = curColor;
  ctx.beginPath();
  ctx.arc(p.x, p.y, PLAYER_SIZE + 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawEnemy(e) {
  const flash = e.hurtTimer > 0;
  const charging = e.chargeGlow;
  const s = e.scale || 1;

  ctx.save();
  ctx.translate(e.x, e.y);
  ctx.scale(s, s);

  const hpW = 36, hpH = 4;

  // 使用图片资源
  if (assets.enemy && assets.enemy.complete && assets.enemy.naturalWidth > 0) {
    const sz = e.size * 2.2;

    if (flash) {
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.beginPath();
      ctx.arc(0, 0, sz/2 + 4, 0, Math.PI * 2);
      ctx.fill();
    }

    if (charging) {
      const glow = 0.3 + Math.sin(Date.now() * 0.02) * 0.2;
      ctx.fillStyle = `rgba(255,255,255,${glow})`;
      ctx.beginPath();
      ctx.arc(0, 0, sz/2 + 6, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.save();
    ctx.drawImage(assets.enemy, -sz/2, -sz/2, sz, sz);
    ctx.restore();

    if (e.armorColor) {
      const pulseColor = 0.3 + Math.sin(Date.now() * 0.005) * 0.08;
      ctx.fillStyle = e.armorColor;
      ctx.globalAlpha = flash ? 0.7 : pulseColor;
      ctx.beginPath();
      ctx.arc(sz * 0.45, -sz/2 + 5, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.restore();

    // 血条
    const hpX = e.x - hpW / 2, hpY = e.y - sz/2 - 10;
    ctx.fillStyle = C.HP_BG;
    ctx.fillRect(hpX, hpY, hpW, hpH);
    const pct = Math.max(e.hp / e.maxHp, 0);
    let hpColor = C.HP_GREEN;
    if (pct <= 0.25) hpColor = C.HP_RED;
    else if (pct <= 0.5) hpColor = C.HP_YELLOW;
    ctx.fillStyle = hpColor;
    ctx.fillRect(hpX, hpY, hpW * pct, hpH);

    ctx.font = '10px "STKaiti","KaiTi","Microsoft YaHei",serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = C.INK_LIGHT;
    ctx.fillText(e.name, e.x, e.y + sz/2 + 10);
    return;
  }

  // 图形替换绘制
  // 外圈光晕
  ctx.fillStyle = flash ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.05)';
  ctx.beginPath();
  ctx.arc(0, 0, e.size + 6, 0, Math.PI * 2);
  ctx.fill();

  // 身体
  ctx.fillStyle = flash ? '#aaaaaa' : e.color;
  ctx.globalAlpha = 0.85;
  ctx.beginPath();
  ctx.arc(0, 0, e.size, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = C.INK_BLACK;
  ctx.globalAlpha = flash ? 0.5 : 0.3;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.globalAlpha = 1;

  // 眼睛
  ctx.fillStyle = flash ? C.INK_BLACK : C.INK_DARK;
  ctx.globalAlpha = flash ? 0.8 : 0.6;
  ctx.beginPath();
  const eyeOff = e.size * 0.22;
  const eyeR = Math.max(2, e.size * 0.15);
  ctx.arc(-eyeOff, -eyeOff * 0.5, eyeR, 0, Math.PI * 2);
  ctx.arc(eyeOff, -eyeOff * 0.5, eyeR, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // 濒死X眼
  if (e.hp < e.maxHp * 0.3 && e.hp > 0) {
    ctx.strokeStyle = C.RED;
    ctx.globalAlpha = 0.3;
    ctx.lineWidth = 1.5;
    const ex = e.size * 0.22;
    for (let ox of [-ex, ex]) {
      ctx.beginPath();
      ctx.moveTo(ox - 2, -4);
      ctx.lineTo(ox + 2, 0);
      ctx.moveTo(ox + 2, -4);
      ctx.lineTo(ox - 2, 0);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  // 护甲颜色指示
  if (e.armorColor) {
    const pulseColor = 0.3 + Math.sin(Date.now() * 0.005) * 0.08;
    ctx.fillStyle = e.armorColor;
    ctx.globalAlpha = flash ? 0.7 : pulseColor;
    ctx.beginPath();
    ctx.arc(e.size * 0.45, -e.size + 5, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // 颜色标记（元素反应可视化）— 敌人头顶小圆点
  if (e.colorMarks && e.colorMarks.length > 0) {
    const markStartX = -(e.colorMarks.length - 1) * 5;
    for (let mi = 0; mi < e.colorMarks.length; mi++) {
      const mark = e.colorMarks[mi];
      const mx = markStartX + mi * 10;
      const my = -e.size - 4;
      ctx.fillStyle = mark.color;
      ctx.globalAlpha = 0.5 + (mark.stacks || 1) * 0.15;
      ctx.beginPath();
      ctx.arc(mx, my, 3 + (mark.stacks || 1), 0, Math.PI * 2);
      ctx.fill();
      // 层数指示
      if ((mark.stacks || 1) > 1) {
        ctx.fillStyle = C.BG;
        ctx.globalAlpha = 0.8;
        ctx.font = '7px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(mark.stacks, mx, my + 3);
      }
    }
    ctx.globalAlpha = 1;
  }
  ctx.restore();

  // 血条（全局坐标）
  const hpX = e.x - hpW / 2, hpY = e.y - e.size - 10;
  ctx.fillStyle = C.HP_BG;
  ctx.fillRect(hpX, hpY, hpW, hpH);

  const pct = Math.max(e.hp / e.maxHp, 0);
  let hpColor = C.HP_GREEN;
  if (pct <= 0.25) hpColor = C.HP_RED;
  else if (pct <= 0.5) hpColor = C.HP_YELLOW;
  ctx.fillStyle = hpColor;
  ctx.fillRect(hpX, hpY, hpW * pct, hpH);

  // 名称
  ctx.font = '10px "STKaiti","KaiTi","Microsoft YaHei",serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = C.INK_LIGHT;
  ctx.fillText(e.name, e.x, e.y + e.size + 12);

  // 手动锁定指示器
  if (state.lockedTarget === e) {
    const lockPulse = 0.5 + Math.sin(Date.now() * 0.008) * 0.3;
    ctx.strokeStyle = C.RED;
    ctx.globalAlpha = lockPulse;
    ctx.lineWidth = 2;
    const lockR = e.size + 8;
    // 四角标记
    for (let ci = 0; ci < 4; ci++) {
      const ca = ci * Math.PI / 2 + Date.now() * 0.001;
      ctx.beginPath();
      ctx.arc(e.x + Math.cos(ca) * lockR, e.y + Math.sin(ca) * lockR, 3, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
}

function drawJoystick() {
  const active = state.joystick.active;

  // 外圈
  ctx.strokeStyle = C.INK_WASH;
  ctx.globalAlpha = active ? 0.35 : 0.2;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(joyX, joyY, JOY_R, 0, Math.PI * 2);
  ctx.stroke();

  // 内圈
  ctx.globalAlpha = active ? 0.2 : 0.1;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(joyX, joyY, JOY_R * 0.6, 0, Math.PI * 2);
  ctx.stroke();

  // 方向线
  if (active) {
    ctx.strokeStyle = C.RED;
    ctx.globalAlpha = 0.15;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(joyX, joyY);
    ctx.lineTo(joyX + state.joystick.dx * JOY_R * 0.8, joyY + state.joystick.dy * JOY_R * 0.8);
    ctx.stroke();
  }

  // 摇杆头
  const thumbX = joyX + state.joystick.dx * JOY_R;
  const thumbY = joyY + state.joystick.dy * JOY_R;
  ctx.fillStyle = C.INK_DARK;
  ctx.globalAlpha = active ? 0.75 : 0.3;
  ctx.beginPath();
  ctx.arc(thumbX, thumbY, JOY_THUMB_R, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = C.INK_BLACK;
  ctx.globalAlpha = active ? 0.5 : 0.2;
  ctx.lineWidth = 2;
  ctx.stroke();

  // 中心亮点
  if (active) {
    ctx.fillStyle = C.BG;
    ctx.globalAlpha = 0.15;
    ctx.beginPath();
    ctx.arc(thumbX, thumbY, JOY_THUMB_R * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // 冲刺CD指示 — 摇杆外圈弧线
  if (state.dash.cooldown > 0) {
    const cdPct = state.dash.cooldown / DASH_COOLDOWN;
    ctx.strokeStyle = C.INK_LIGHT;
    ctx.globalAlpha = 0.4;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(joyX, joyY, JOY_R + 8, -Math.PI/2, -Math.PI/2 + (1 - cdPct) * Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  } else if (!state.dash.active) {
    // 冲刺就绪 — 外圈微光提示
    ctx.strokeStyle = C.INK_WASH;
    ctx.globalAlpha = 0.15 + Math.sin(Date.now() * 0.003) * 0.05;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(joyX, joyY, JOY_R + 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // ---- 停火按钮 ----
  const cfActive = state.ceaseFire;
  ctx.strokeStyle = cfActive ? C.RED : C.INK_WASH;
  ctx.globalAlpha = cfActive ? 0.5 : 0.25;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(CEASEFIRE_X, CEASEFIRE_Y, CEASEFIRE_R, 0, Math.PI * 2);
  ctx.stroke();

  // 停火图标 — 两条斜线（禁止射击）
  ctx.strokeStyle = cfActive ? C.RED : C.INK_MEDIUM;
  ctx.globalAlpha = cfActive ? 0.6 : 0.3;
  ctx.lineWidth = 2.5;
  const cr = CEASEFIRE_R * 0.4;
  ctx.beginPath();
  ctx.moveTo(CEASEFIRE_X - cr, CEASEFIRE_Y - cr);
  ctx.lineTo(CEASEFIRE_X + cr, CEASEFIRE_Y + cr);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(CEASEFIRE_X + cr, CEASEFIRE_Y - cr);
  ctx.lineTo(CEASEFIRE_X - cr, CEASEFIRE_Y + cr);
  ctx.stroke();

  // 文字标签
  ctx.font = '10px "STKaiti","KaiTi","Microsoft YaHei",serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = cfActive ? C.RED : C.INK_WASH;
  ctx.globalAlpha = cfActive ? 0.5 : 0.3;
  ctx.fillText('停火', CEASEFIRE_X, CEASEFIRE_Y + CEASEFIRE_R + 12);
  ctx.globalAlpha = 1;
}

function drawUI() {
  // BOSS血条 + 弱点击破条
  const boss = state.enemies.find(e => e.type === 'boss' && e.alive);
  if (boss) {
    const bw = 200, bh = 10, bx = W/2 - bw/2, by = 8;
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, 5);
    ctx.fill();
    const pct = Math.max(boss.hp / boss.maxHp, 0);
    const phaseColors = ['#74bb44', '#c4a835', '#c43a31'];
    const phaseIdx = pct > 0.66 ? 0 : (pct > 0.33 ? 1 : 2);
    ctx.fillStyle = phaseColors[phaseIdx];
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.roundRect(bx + 1, by + 1, (bw - 2) * pct, bh - 2, 4);
    ctx.fill();
    ctx.globalAlpha = 1;

    // 弱点击破条 — 血条下方白色进度条
    if (boss.breakGauge !== undefined) {
      const breakBy = by + bh + 2;
      const breakH = 4;
      ctx.fillStyle = 'rgba(0,0,0,0.06)';
      ctx.fillRect(bx, breakBy, bw, breakH);
      const breakPct = Math.min(boss.breakGauge / BOSS_BREAK_MAX, 1);
      if (breakPct > 0) {
        // 击破条发光脉冲
        const glow = 0.6 + Math.sin(Date.now() * 0.008) * 0.2;
        ctx.fillStyle = boss.breakStun > 0 ? C.RED : `rgba(255,255,255,${glow})`;
        ctx.fillRect(bx, breakBy, bw * breakPct, breakH);
      }
      // 当前弱点颜色指示
      if (boss.armorColor && boss.breakStun <= 0) {
        ctx.fillStyle = boss.armorColor;
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.arc(bx + bw * breakPct, breakBy + breakH / 2, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }

    ctx.textAlign = 'center';
    ctx.font = '10px "STKaiti","KaiTi","Microsoft YaHei",serif';
    ctx.fillStyle = boss.breakStun > 0 ? C.RED : C.INK_DARK;
    ctx.fillText(boss.breakStun > 0 ? '·崩破中·' : '墨魔', W/2, by + bh + 18);
  }

  // 通关面板
  if (state.wave.completed && state.completionStats) {
    const s = state.completionStats;
    const cfg = LEVEL_CONFIG[state.level];
    const isLastLevel = state.level >= LEVEL_CONFIG.length - 1;
    ctx.fillStyle = 'rgba(245,240,232,0.92)';
    ctx.beginPath();
    ctx.roundRect(W/2 - 105, H/2 - 70, 210, 140, 8);
    ctx.fill();
    ctx.strokeStyle = C.INK_WASH;
    ctx.lineWidth = 1;
    ctx.stroke();

    // 关卡名
    ctx.textAlign = 'center';
    ctx.font = '14px "STKaiti","KaiTi","Microsoft YaHei",serif';
    ctx.fillStyle = C.INK_LIGHT;
    ctx.fillText(`·${cfg.name}·`, W/2, H/2 - 48);

    ctx.font = '28px "STKaiti","KaiTi","Microsoft YaHei",serif';
    let starText = '';
    for (let i = 0; i < 3; i++) starText += i < s.rating ? '★' : '☆';
    ctx.fillStyle = s.rating >= 3 ? '#c4a835' : (s.rating >= 2 ? C.RED : C.INK_MEDIUM);
    ctx.fillText(starText, W/2, H/2 - 20);

    ctx.font = '14px "STKaiti","KaiTi","Microsoft YaHei",serif';
    ctx.fillStyle = C.INK_DARK;
    ctx.fillText(`杀: ${s.kills}  爆: ${s.rageCount}  破: ${s.breaks}`, W/2, H/2 + 8);
    ctx.font = '12px "STKaiti","KaiTi","Microsoft YaHei",serif';
    ctx.fillStyle = C.INK_LIGHT;
    ctx.fillText(`剩余: ${s.remaining}秒`, W/2, H/2 + 28);
    if (assets.seal && assets.seal.complete && assets.seal.naturalWidth > 0) {
      ctx.globalAlpha = 0.1;
      ctx.drawImage(assets.seal, W/2 + 80, H/2 - 55, 24, 24);
      ctx.globalAlpha = 1;
    }
    ctx.font = '12px "STKaiti","KaiTi","Microsoft YaHei",serif';
    ctx.fillStyle = C.INK_MEDIUM;
    ctx.fillText(isLastLevel ? '·画卷终成·' : '·续研下一卷·', W/2, H/2 + 50);
    return;
  }

  // 墨意条
  const barX = 15, barY = 12, barW = 100, barH = 10;
  const pct = Math.min(state.rage.meter / RAGE_METER_MAX, 1);
  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  ctx.beginPath();
  ctx.roundRect(barX, barY, barW, barH, 5);
  ctx.fill();
  if (state.rage.active) {
    const pulse = 0.6 + Math.sin(Date.now() * 0.01) * 0.3;
    ctx.fillStyle = `rgba(196,58,49,${pulse})`;
  } else {
    ctx.fillStyle = pct >= 1 ? C.RED : C.INK_DARK;
    ctx.globalAlpha = pct >= 1 ? 0.8 : 0.5;
  }
  ctx.beginPath();
  ctx.roundRect(barX + 1, barY + 1, (barW - 2) * pct, barH - 2, 4);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
  ctx.font = '10px "STKaiti","KaiTi","Microsoft YaHei",serif';
  ctx.fillStyle = state.rage.active ? C.RED : (pct >= 1 ? C.RED : C.INK_LIGHT);
  ctx.fillText(state.rage.active ? '·泼墨·' : (pct >= 1 ? '墨意·满' : '墨意'), barX + 4, barY + 9);

  // 泼墨倒计时条 — 激活时在墨意条下方显示剩余时间
  if (state.rage.active) {
    const remaining = Math.max(0, (state.rage.endTime - performance.now()) / RAGE_DURATION);
    const cdY = barY + barH + 3;
    ctx.fillStyle = 'rgba(0,0,0,0.06)';
    ctx.beginPath();
    ctx.roundRect(barX, cdY, barW, 5, 2);
    ctx.fill();
    const cdPulse = 0.5 + Math.sin(Date.now() * 0.008) * 0.2;
    ctx.fillStyle = `rgba(196,58,49,${cdPulse})`;
    ctx.beginPath();
    ctx.roundRect(barX + 1, cdY + 1, (barW - 2) * remaining, 3, 2);
    ctx.fill();
    const remainSec = Math.max(0, (state.rage.endTime - performance.now()) / 1000).toFixed(1);
    ctx.font = '8px "STKaiti","KaiTi","Microsoft YaHei",serif';
    ctx.fillStyle = C.RED;
    ctx.globalAlpha = 0.7;
    ctx.fillText(`${remainSec}s`, barX + barW + 4, cdY + 4);
    ctx.globalAlpha = 1;
  }

  // 涂色覆盖率
  const coverPct = Math.floor(state.paintCover * 100);
  if (coverPct > 0) {
    ctx.fillStyle = state.paintCover >= 1 ? C.RED : C.INK_LIGHT;
    ctx.globalAlpha = 0.6;
    ctx.font = '9px "STKaiti","KaiTi","Microsoft YaHei",serif';
    ctx.fillText(`涂色 ${coverPct}%`, barX + barW + 6, barY + 9);
    ctx.globalAlpha = 1;
  }

  // 波次 — 显示关卡名+波次
  ctx.font = '12px "STKaiti","KaiTi","Microsoft YaHei",serif';
  ctx.textAlign = 'left';
  ctx.fillStyle = C.INK_MEDIUM;
  const cfg = LEVEL_CONFIG[state.level];
  const waveText = state.wave.completed ? `·${cfg.name}·成·` : (state.wave.current < 0 ? `${cfg.name} ·备战·` : `${cfg.name} 第${state.wave.current + 1}波`);
  ctx.fillText(waveText, 15, 38);

  // 当前颜色（下一发将射出的颜色）
  ctx.fillStyle = COLORS[state.bulletColorIndex];
  ctx.globalAlpha = 0.7;
  ctx.beginPath();
  ctx.arc(15, 50, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = C.INK_LIGHT;
  ctx.font = '10px "STKaiti","KaiTi","Microsoft YaHei",serif';
  ctx.fillText(COLOR_NAMES[state.bulletColorIndex], 24, 54);

  // 倒计时
  if (!state.wave.completed) {
    const timeLeft = Math.ceil(state.levelTimer);
    const isUrgent = timeLeft <= 10;
    ctx.textAlign = 'center';
    ctx.font = isUrgent ? 'bold 20px "STKaiti","KaiTi","Microsoft YaHei",serif' : '16px "STKaiti","KaiTi","Microsoft YaHei",serif';
    ctx.fillStyle = isUrgent ? `rgba(196,58,49,${0.6 + Math.sin(Date.now() * 0.01) * 0.3})` : C.INK_MEDIUM;
    ctx.globalAlpha = isUrgent ? 0.9 : 0.5;
    ctx.fillText(timeLeft, W/2, 38);
    ctx.globalAlpha = 1;
  }

  // 泼墨进度条
  const stainCount = state.groundStains.length;
  const stainTarget = 200;
  const stainPct = Math.min(stainCount / stainTarget, 1);
  const sbW = 150, sbH = 6, sbX = W/2 - sbW/2, sbY = H - 24;
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  ctx.beginPath();
  ctx.roundRect(sbX, sbY, sbW, sbH, 3);
  ctx.fill();
  ctx.fillStyle = '#888';
  ctx.globalAlpha = 0.4;
  ctx.beginPath();
  ctx.roundRect(sbX, sbY, sbW * stainPct, sbH, 3);
  ctx.fill();
  ctx.globalAlpha = 1;

  // 击杀数
  ctx.font = '14px "STKaiti","KaiTi","Microsoft YaHei",serif';
  ctx.textAlign = 'right';
  ctx.fillStyle = C.INK_MEDIUM;
  ctx.fillText(`杀: ${state.killCount}`, W - 15, 16);

  // 存活敌人数
  const alive = state.enemies.filter(e => e.alive).length;
  ctx.font = '12px "STKaiti","KaiTi","Microsoft YaHei",serif';
  ctx.fillStyle = C.INK_LIGHT;
  ctx.fillText(`存: ${alive}`, W - 15, 34);

  // 玩家血条
  const hpW = 50, hpH = 6;
  const hpX = W - 15 - hpW, hpY = 44;
  ctx.fillStyle = 'rgba(0,0,0,0.1)';
  ctx.beginPath();
  ctx.roundRect(hpX, hpY, hpW, hpH, 3);
  ctx.fill();
  const hpPct = Math.max(state.player.hp / (state.player.maxHp || 100), 0);
  ctx.fillStyle = hpPct > 0.5 ? C.INK_DARK : (hpPct > 0.25 ? C.YELLOW : C.RED);
  ctx.globalAlpha = 0.7;
  ctx.beginPath();
  ctx.roundRect(hpX, hpY, hpW * hpPct, hpH, 3);
  ctx.fill();
  ctx.globalAlpha = 1;

  // 底部提示 — 画灵名+共鸣等级
  ctx.textAlign = 'center';
  ctx.font = '11px "STKaiti","KaiTi","Microsoft YaHei",serif';
  ctx.fillStyle = currentHero.color || C.INK_LIGHT;
  ctx.globalAlpha = 0.5;
  ctx.fillText(`${currentHero.name} · 共鸣Lv.${resonance.level}`, W/2, H - 18);
  ctx.globalAlpha = 1;

  // 小地图 — 右上角
  const mmW = 70, mmH = 95;
  const mmX = W - mmW - 10, mmY = 58;
  const mmScaleX = mmW / WORLD_W, mmScaleY = mmH / WORLD_H;

  // 背景
  ctx.fillStyle = 'rgba(245,240,232,0.7)';
  ctx.strokeStyle = 'rgba(150,140,120,0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(mmX, mmY, mmW, mmH, 3);
  ctx.fill();
  ctx.stroke();

  // 视口范围
  const vpX = mmX + state.camera.x * mmScaleX;
  const vpY = mmY + state.camera.y * mmScaleY;
  const vpW = W * mmScaleX;
  const vpH = H * mmScaleY;
  ctx.strokeStyle = 'rgba(150,140,120,0.5)';
  ctx.lineWidth = 1;
  ctx.strokeRect(vpX, vpY, vpW, vpH);

  // 颜色圈
  for (const cc of state.colorCircles) {
    ctx.fillStyle = cc.color;
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.arc(mmX + cc.x * mmScaleX, mmY + cc.y * mmScaleY, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // 敌人
  for (const e of state.enemies) {
    if (!e.alive) continue;
    ctx.fillStyle = e.type === 'boss' ? C.RED : C.INK_DARK;
    ctx.globalAlpha = 0.7;
    const eSize = e.type === 'boss' ? 3 : 1.5;
    ctx.beginPath();
    ctx.arc(mmX + e.x * mmScaleX, mmY + e.y * mmScaleY, eSize, 0, Math.PI * 2);
    ctx.fill();
  }

  // 玩家
  ctx.fillStyle = C.RED;
  ctx.globalAlpha = 1;
  ctx.beginPath();
  ctx.arc(mmX + state.player.x * mmScaleX, mmY + state.player.y * mmScaleY, 2.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = 1;
}

// ==================== 主绘制 ====================
function draw() {
  const cam = state.camera;
  // 安全检查
  if (!W || !H) { console.error('W/H not defined!'); return; }
  ctx.clearRect(0, 0, W, H);

  // 确保底色绘制 — 如果drawBackground失败，至少有底色
  try { drawBackground(); } catch(e) { console.error('drawBackground error:', e); ctx.fillStyle = '#f5f0e8'; ctx.fillRect(0, 0, W, H); }

  // ---- 世界坐标系绘制区 ----
  ctx.save();
  try {
  ctx.translate(-cam.x + state.shake.x, -cam.y + state.shake.y);

    // 地面墨渍（限制数量，删除最老的）
    if (state.groundStains.length > 1500) {
      state.groundStains.splice(0, state.groundStains.length - 1500);
    }
    for (const gs of state.groundStains) {
    ctx.globalAlpha = gs.alpha;
    ctx.fillStyle = gs.color;
    ctx.beginPath();
    ctx.arc(gs.x, gs.y, gs.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // 环境粒子
  ctx.fillStyle = C.INK_WASH;
  for (const d of state.ambientDots) {
    ctx.globalAlpha = 0.05;
    ctx.beginPath();
    ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // 攻击范围指示
  if (state.enemies.some(e => e.alive)) {
    ctx.strokeStyle = C.INK_WASH;
    ctx.globalAlpha = 0.06;
    ctx.beginPath();
    ctx.arc(state.player.x, state.player.y, ATTACK_RANGE, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // 敌人
  for (const e of state.enemies) {
    if (!e.alive) continue;
    try { drawEnemy(e); } catch(err) { console.error('drawEnemy error:', err); }
  }

  // 障碍物
  try { drawObstacles(); } catch(err) { console.error('drawObstacles error:', err); }

  // 踩圈切色 — 地面颜色圈
  try { drawColorCircles(); } catch(err) { console.error('drawColorCircles error:', err); }

  // 墨渍粒子
  for (const pt of state.particles) {
    if (!pt.isStain) continue;
    ctx.globalAlpha = pt.alpha * 0.3;
    ctx.fillStyle = pt.color;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // 玩家子弹
  for (const b of state.bullets) {
    // 弹道
    ctx.strokeStyle = b.color;
    ctx.globalAlpha = 0.25;
    ctx.lineWidth = 2;
    ctx.beginPath();
    const trailLen = 14;
    ctx.moveTo(b.x, b.y);
    ctx.lineTo(
      b.x - (b.vx / BULLET_SPEED) * trailLen,
      b.y - (b.vy / BULLET_SPEED) * trailLen
    );
    ctx.stroke();

    // 宽拖尾
    ctx.globalAlpha = 0.08;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(b.x, b.y);
    ctx.lineTo(
      b.x - (b.vx / BULLET_SPEED) * trailLen * 1.8,
      b.y - (b.vy / BULLET_SPEED) * trailLen * 1.8
    );
    ctx.stroke();

    // 弹体
    ctx.fillStyle = b.color;
    ctx.globalAlpha = 0.95;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
    ctx.fill();

    // 光晕
    ctx.globalAlpha = 0.2;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.size + 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // 玩家
  try { drawPlayer(); } catch(err) { console.error('drawPlayer error:', err); }

  // 墨影分身
  for (const shadow of state.shadows) {
    ctx.globalAlpha = 0.4 + Math.sin(Date.now() * 0.008) * 0.1;
    ctx.fillStyle = currentHero.color;
    ctx.beginPath();
    ctx.arc(shadow.x, shadow.y, PLAYER_SIZE * 0.8, 0, Math.PI * 2);
    ctx.fill();
    // 核心亮点
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(shadow.x, shadow.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // 敌人子弹
  for (const eb of state.enemyBullets) {
    const isTrack = eb.tracking;
    const bulletColor = isTrack ? C.RED : C.INK_WASH;

    // 拖尾
    ctx.strokeStyle = bulletColor;
    ctx.globalAlpha = isTrack ? 0.2 : 0.15;
    ctx.lineWidth = isTrack ? 2 : 3;
    ctx.beginPath();
    ctx.moveTo(eb.x, eb.y);
    ctx.lineTo(eb.x - eb.vx * 0.05, eb.y - eb.vy * 0.05);
    ctx.stroke();

    // 追踪弹光环
    if (isTrack) {
      ctx.strokeStyle = C.RED;
      ctx.globalAlpha = 0.15 + Math.sin(Date.now() * 0.01) * 0.08;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(eb.x, eb.y, eb.size + 5, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 弹体
    ctx.fillStyle = bulletColor;
    ctx.globalAlpha = isTrack ? 0.7 : 0.65;
    ctx.beginPath();
    ctx.arc(eb.x, eb.y, eb.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.15;
    ctx.beginPath();
    ctx.arc(eb.x, eb.y, eb.size + 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // 普通粒子
  for (const pt of state.particles) {
    if (pt.isStain) continue;
    ctx.globalAlpha = pt.alpha;
    ctx.fillStyle = pt.color;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, pt.size * (pt.life / pt.maxLife), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // 伤害数字
  for (const dn of state.damageNumbers) {
    ctx.save();
    ctx.globalAlpha = dn.alpha;
    ctx.translate(dn.x, dn.y);
    ctx.rotate(dn.rotation);

    const fontSize = dn.isCrit ? 24 : 17;
    ctx.font = `bold ${fontSize}px "STKaiti","KaiTi","Microsoft YaHei",serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 描边
    ctx.strokeStyle = '#f5f0e8';
    ctx.lineWidth = dn.isCrit ? 5 : 3;
    ctx.strokeText(dn.damage, 0, 0);

    // 填充（使用颜色差异化）
    ctx.fillStyle = dn.color || C.INK_BLACK;
    ctx.fillText(dn.damage, 0, 0);

    // 暴击光圈
    if (dn.isCrit) {
      ctx.globalAlpha = dn.alpha * 0.15 * (1 - dn.life / 0.9 + 0.3);
      ctx.beginPath();
      ctx.arc(0, 0, fontSize * 0.8, 0, Math.PI * 2);
      ctx.fillStyle = dn.color || C.RED;
      ctx.fill();
    }

    ctx.restore();
  }
  ctx.globalAlpha = 1;

  // 动作文字
  for (const at of state.actionTexts) {
    ctx.globalAlpha = at.life > 0.7 ? (1 - at.life) / 0.3 : at.life / 0.7;
    ctx.font = 'bold 28px "STKaiti","KaiTi","Microsoft YaHei",serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = '#f5f0e8';
    ctx.lineWidth = 4;
    ctx.strokeText(at.text, at.x, at.y);
    ctx.fillStyle = C.INK_BLACK;
    ctx.fillText(at.text, at.x, at.y);
  }
  ctx.globalAlpha = 1;

  // 世界边界指示 — 已由边界渐隐遮罩替代，不再画虚线（避免视觉干扰）

  } catch(err) { console.error('draw world-coords error:', err); }
  ctx.restore(); // ← 恢复屏幕坐标系（try-finally确保必定执行）

  // ---- 屏幕坐标系（不受摄像机影响）----

  // 泼墨红闪
  if (state.rageFlash > 0) {
    ctx.fillStyle = `rgba(196,58,49,${state.rageFlash * 0.4})`;
    ctx.fillRect(0, 0, W, H);
  }
  if (state.rage.active && assets.rage && assets.rage.complete && assets.rage.naturalWidth > 0) {
    ctx.globalAlpha = 0.06;
    ctx.drawImage(assets.rage, 0, 0, W, H);
    ctx.globalAlpha = 1;
  }

  // 泼墨状态红色叠加
  if (state.rage.active) {
    ctx.fillStyle = `rgba(196,58,49,${0.03 + Math.sin(Date.now() * 0.005) * 0.02})`;
    ctx.fillRect(0, 0, W, H);
  }

  // 边界渐隐遮罩 — 防止世界边缘露底
  const edgeFade = 60;
  const bgColor = LEVEL_CONFIG[state.level].bg.base;
  // 将bg.base转为rgba格式（用于渐变终点透明色）
  const bgR = parseInt(bgColor.slice(1,3),16);
  const bgG = parseInt(bgColor.slice(3,5),16);
  const bgB = parseInt(bgColor.slice(5,7),16);
  const bgTransparent = `rgba(${bgR},${bgG},${bgB},0)`;
  if (cam.x < edgeFade) {
    const grad = ctx.createLinearGradient(0, 0, edgeFade, 0);
    grad.addColorStop(0, bgColor);
    grad.addColorStop(1, bgTransparent);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, edgeFade, H);
  }
  if (cam.x + W > WORLD_W - edgeFade) {
    const grad = ctx.createLinearGradient(W - edgeFade, 0, W, 0);
    grad.addColorStop(0, bgTransparent);
    grad.addColorStop(1, bgColor);
    ctx.fillStyle = grad;
    ctx.fillRect(W - edgeFade, 0, edgeFade, H);
  }
  if (cam.y < edgeFade) {
    const grad = ctx.createLinearGradient(0, 0, 0, edgeFade);
    grad.addColorStop(0, bgColor);
    grad.addColorStop(1, bgTransparent);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, edgeFade);
  }
  if (cam.y + H > WORLD_H - edgeFade) {
    const grad = ctx.createLinearGradient(0, H - edgeFade, 0, H);
    grad.addColorStop(0, bgTransparent);
    grad.addColorStop(1, bgColor);
    ctx.fillStyle = grad;
    ctx.fillRect(0, H - edgeFade, W, edgeFade);
  }

  // ---- 关卡阶段覆盖层 ----
  drawLevelOverlay();

  // 摇杆（不受摄像机影响）
  drawJoystick();

  // UI（不受摄像机影响）
  drawUI();
}

// ==================== 标题画面 ====================
function drawTitleScreen() {
  const ss = screenState;

  // 底色 — 古旧宣纸渐变
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#f5f0e8');
  grad.addColorStop(0.5, '#ede6d6');
  grad.addColorStop(1, '#e0d8c4');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // 水墨山景装饰
  ctx.fillStyle = 'rgba(140,135,120,0.08)';
  ctx.beginPath();
  ctx.moveTo(0, H * 0.7);
  ctx.lineTo(W * 0.15, H * 0.55);
  ctx.lineTo(W * 0.3, H * 0.62);
  ctx.lineTo(W * 0.5, H * 0.48);
  ctx.lineTo(W * 0.7, H * 0.56);
  ctx.lineTo(W * 0.85, H * 0.44);
  ctx.lineTo(W, H * 0.52);
  ctx.lineTo(W, H);
  ctx.lineTo(0, H);
  ctx.closePath();
  ctx.fill();

  // 飘落墨点（环境粒子）
  const t = Date.now() * 0.001;
  ctx.fillStyle = 'rgba(80,75,65,0.04)';
  for (let i = 0; i < 8; i++) {
    const px = ((i * 137.5 + t * 3) % (W + 40)) - 20;
    const py = ((i * 97.3 + t * 8) % (H + 40)) - 20;
    ctx.beginPath();
    ctx.arc(px, py, 2 + Math.sin(t + i) * 1, 0, Math.PI * 2);
    ctx.fill();
  }

  // 主标题
  const titleY = H * 0.28;
  const titlePulse = Math.sin(t * 1.5) * 2;
  ctx.textAlign = 'center';

  // 副标题 — 上方小字
  ctx.font = '14px "STKaiti","KaiTi","Microsoft YaHei",serif';
  ctx.fillStyle = '#998866';
  ctx.globalAlpha = 0.6;
  ctx.fillText('·泼墨修复·', W/2, titleY - 40);

  // 大标题
  ctx.globalAlpha = 1;
  ctx.font = '48px "STKaiti","KaiTi","Microsoft YaHei",serif';
  ctx.fillStyle = '#3a3530';
  ctx.fillText('水墨丹青', W/2, titleY + titlePulse);

  // 印章装饰
  ctx.save();
  ctx.translate(W/2 + 100, titleY - 15);
  ctx.rotate(0.1);
  ctx.fillStyle = 'rgba(196,58,49,0.25)';
  ctx.fillRect(-10, -10, 20, 20);
  ctx.restore();

  // 描述
  ctx.font = '13px "STKaiti","KaiTi","Microsoft YaHei",serif';
  ctx.fillStyle = '#8a7e6a';
  ctx.fillText('上古水墨长卷，被墨魔侵蚀', W/2, titleY + 40);
  ctx.fillText('画灵泼墨还原古画世界', W/2, titleY + 58);

  // 开始按钮
  const btnX = W/2, btnY = H * 0.58;
  const btnW = 140, btnH = 44;
  const btnHover = ss.titleBtnHover;
  ctx.fillStyle = btnHover ? 'rgba(196,58,49,0.12)' : 'rgba(196,58,49,0.06)';
  ctx.beginPath();
  ctx.roundRect(btnX - btnW/2, btnY - btnH/2, btnW, btnH, 22);
  ctx.fill();
  ctx.strokeStyle = 'rgba(196,58,49,0.35)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.font = '18px "STKaiti","KaiTi","Microsoft YaHei",serif';
  ctx.fillStyle = '#c43a31';
  ctx.fillText('·研墨启卷·', btnX, btnY + 6);

  // 存档信息
  if (gameSave.totalStars > 0) {
    ctx.font = '11px "STKaiti","KaiTi","Microsoft YaHei",serif';
    ctx.fillStyle = '#aaa';
    ctx.fillText(`已获 ${gameSave.totalStars}/9 ★`, W/2, H * 0.72);
  }

  // 底部
  ctx.font = '10px "STKaiti","KaiTi","Microsoft YaHei",serif';
  ctx.fillStyle = '#bbb';
  ctx.fillText('单指操作 · 自动攻击 · 属性克制', W/2, H - 60);
  ctx.fillText('v0.3 Phase 2', W/2, H - 40);
}

// ==================== 关卡选择画面 ====================
function drawLevelSelect() {
  const ss = screenState;

  // 底色
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#f5f0e8');
  grad.addColorStop(1, '#e8e0d0');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // 标题
  ctx.textAlign = 'center';
  ctx.font = '24px "STKaiti","KaiTi","Microsoft YaHei",serif';
  ctx.fillStyle = '#3a3530';
  ctx.fillText('·选卷·', W/2, 50);

  // 返回按钮（左上角）
  ctx.font = '14px "STKaiti","KaiTi","Microsoft YaHei",serif';
  ctx.fillStyle = '#999';
  ctx.textAlign = 'left';
  ctx.fillText('← 返回', 15, 35);
  ctx.textAlign = 'center';

  // 3关卷轴卡片
  const cardW = W - 60, cardH = 160;
  const cardX = 30, gapY = 20;
  const startY = 85;

  for (let i = 0; i < LEVEL_CONFIG.length; i++) {
    const cfg = LEVEL_CONFIG[i];
    const sv = gameSave.levels[i];
    const cy = startY + i * (cardH + gapY);
    const isHover = ss.selectHover === i;
    const isLocked = !sv.unlocked;

    // 卡片背景
    ctx.save();
    if (isLocked) ctx.globalAlpha = 0.4;
    else if (isHover) ctx.globalAlpha = 1;
    else ctx.globalAlpha = 0.9;

    // 卡片阴影
    ctx.fillStyle = 'rgba(0,0,0,0.03)';
    ctx.beginPath();
    ctx.roundRect(cardX + 2, cy + 2, cardW, cardH, 8);
    ctx.fill();

    // 卡片本体
    const bgGrad = ctx.createLinearGradient(cardX, cy, cardX + cardW, cy + cardH);
    if (isLocked) {
      bgGrad.addColorStop(0, '#e8e4dc');
      bgGrad.addColorStop(1, '#ddd8d0');
    } else if (isHover) {
      bgGrad.addColorStop(0, '#faf6ee');
      bgGrad.addColorStop(1, '#f0ead8');
    } else {
      bgGrad.addColorStop(0, '#f8f4ec');
      bgGrad.addColorStop(1, '#ede6d6');
    }
    ctx.fillStyle = bgGrad;
    ctx.beginPath();
    ctx.roundRect(cardX, cy, cardW, cardH, 8);
    ctx.fill();

    // 边框
    ctx.strokeStyle = isHover ? 'rgba(196,58,49,0.3)' : 'rgba(150,140,120,0.2)';
    ctx.lineWidth = isHover ? 2 : 1;
    ctx.stroke();

    // 卷号
    ctx.font = '12px "STKaiti","KaiTi","Microsoft YaHei",serif';
    ctx.fillStyle = '#998866';
    ctx.textAlign = 'left';
    ctx.fillText(`第${['一','二','三'][i]}卷`, cardX + 16, cy + 26);

    // 关卡名
    ctx.font = '26px "STKaiti","KaiTi","Microsoft YaHei",serif';
    ctx.fillStyle = '#3a3530';
    ctx.fillText(cfg.name, cardX + 16, cy + 56);

    // 描述
    ctx.font = '12px "STKaiti","KaiTi","Microsoft YaHei",serif';
    ctx.fillStyle = '#8a7e6a';
    ctx.fillText(cfg.desc, cardX + 16, cy + 78);

    // 关卡信息
    ctx.font = '11px "STKaiti","KaiTi","Microsoft YaHei",serif';
    ctx.fillStyle = '#aaa';
    ctx.fillText(`${cfg.timeLimit}秒 · ${cfg.waves.length}波`, cardX + 16, cy + 100);

    // 星级
    if (!isLocked && sv.stars > 0) {
      ctx.font = '20px "STKaiti","KaiTi","Microsoft YaHei",serif';
      ctx.textAlign = 'right';
      let starText = '';
      for (let s = 0; s < 3; s++) starText += s < sv.stars ? '★' : '☆';
      ctx.fillStyle = sv.stars >= 3 ? '#c4a835' : '#c43a31';
      ctx.fillText(starText, cardX + cardW - 16, cy + 30);
    }

    // 最佳记录
    if (!isLocked && sv.bestKills > 0) {
      ctx.font = '10px "STKaiti","KaiTi","Microsoft YaHei",serif';
      ctx.textAlign = 'right';
      ctx.fillStyle = '#bbb';
      ctx.fillText(`最佳杀敌 ${sv.bestKills}`, cardX + cardW - 16, cy + 100);
    }

    // 锁定图标
    if (isLocked) {
      ctx.textAlign = 'center';
      ctx.font = '28px "STKaiti","KaiTi","Microsoft YaHei",serif';
      ctx.fillStyle = '#bbb';
      ctx.fillText('🔒', cardX + cardW/2, cy + cardH/2 + 8);
      // 解锁条件
      ctx.font = '11px "STKaiti","KaiTi","Microsoft YaHei",serif';
      ctx.fillStyle = '#aaa';
      ctx.fillText(`通关上一卷解锁`, cardX + cardW/2, cy + cardH - 20);
    }

    // 通关标记
    if (!isLocked && sv.stars > 0) {
      ctx.textAlign = 'right';
      ctx.font = '12px "STKaiti","KaiTi","Microsoft YaHei",serif';
      ctx.fillStyle = '#c4a835';
      ctx.fillText('✓ 已通', cardX + cardW - 16, cy + cardH - 18);
    }

    ctx.restore();
    ctx.textAlign = 'center';
  }

  // 总星数
  ctx.font = '12px "STKaiti","KaiTi","Microsoft YaHei",serif';
  ctx.fillStyle = '#aaa';
  ctx.fillText(`★ ${gameSave.totalStars} / 9`, W/2, H - 30);
}

// ==================== 结算画面 ====================
function drawResultScreen() {
  const ss = screenState;
  const cfg = LEVEL_CONFIG[ss.resultLevelIdx];

  // 底色
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#f5f0e8');
  grad.addColorStop(1, '#e8e0d0');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // 装饰墨点
  const t = Date.now() * 0.001;
  ctx.fillStyle = 'rgba(80,75,65,0.03)';
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.arc(W/2 + Math.cos(t + i * 1.2) * 100, H * 0.3 + Math.sin(t + i) * 30, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.textAlign = 'center';

  // 关卡名
  ctx.font = '14px "STKaiti","KaiTi","Microsoft YaHei",serif';
  ctx.fillStyle = '#998866';
  ctx.fillText(`·第${['一','二','三'][ss.resultLevelIdx]}卷·`, W/2, H * 0.18);

  ctx.font = '32px "STKaiti","KaiTi","Microsoft YaHei",serif';
  ctx.fillStyle = '#3a3530';
  ctx.fillText(cfg.name, W/2, H * 0.25);

  // 星级 — 大号动态
  const starY = H * 0.36;
  const stars = ss.resultStars;
  for (let i = 0; i < 3; i++) {
    const sx = W/2 - 50 + i * 50;
    const filled = i < stars;
    const delay = i * 0.3;
    const anim = Math.max(0, Math.min(1, (t - ss.resultStartTime - delay) * 2));
    const scale = filled ? (0.5 + anim * 0.5 + (anim >= 1 ? Math.sin(t * 3 + i) * 0.05 : 0)) : 0.8;

    ctx.save();
    ctx.translate(sx, starY);
    ctx.scale(scale, scale);
    ctx.font = '36px "STKaiti","KaiTi","Microsoft YaHei",serif';
    ctx.fillStyle = filled ? '#c4a835' : '#ddd';
    ctx.globalAlpha = filled ? 1 : 0.3;
    ctx.fillText('★', 0, 12);
    ctx.restore();
  }
  ctx.globalAlpha = 1;

  // 战斗数据
  if (state.completionStats) {
    const s = state.completionStats;
    const dataY = H * 0.50;
    ctx.font = '14px "STKaiti","KaiTi","Microsoft YaHei",serif';
    ctx.fillStyle = '#666';

    ctx.textAlign = 'left';
    ctx.fillText('杀敌数', 60, dataY);
    ctx.fillText('爆发次数', 60, dataY + 28);
    ctx.fillText('击破次数', 60, dataY + 56);
    ctx.fillText('剩余时间', 60, dataY + 84);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#3a3530';
    ctx.fillText(`${s.kills}`, W - 60, dataY);
    ctx.fillText(`${s.rageCount}`, W - 60, dataY + 28);
    ctx.fillText(`${s.breaks}`, W - 60, dataY + 56);
    ctx.fillText(`${s.remaining}秒`, W - 60, dataY + 84);
  }

  // 按钮
  ctx.textAlign = 'center';
  const btnY = H * 0.78;
  // 再来一次
  const retryHover = ss.resultRetryHover;
  ctx.fillStyle = retryHover ? 'rgba(196,58,49,0.1)' : 'rgba(196,58,49,0.04)';
  ctx.beginPath();
  ctx.roundRect(W/2 - 130, btnY - 20, 120, 40, 20);
  ctx.fill();
  ctx.strokeStyle = 'rgba(196,58,49,0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.font = '14px "STKaiti","KaiTi","Microsoft YaHei",serif';
  ctx.fillStyle = '#c43a31';
  ctx.fillText('再研此卷', W/2 - 70, btnY + 5);

  // 返回选择
  const backHover = ss.resultBackHover;
  ctx.fillStyle = backHover ? 'rgba(80,75,65,0.08)' : 'rgba(80,75,65,0.03)';
  ctx.beginPath();
  ctx.roundRect(W/2 + 10, btnY - 20, 120, 40, 20);
  ctx.fill();
  ctx.strokeStyle = 'rgba(80,75,65,0.2)';
  ctx.stroke();
  ctx.fillStyle = '#666';
  ctx.fillText('返回选卷', W/2 + 70, btnY + 5);
}

// ==================== 画灵选择画面 ====================
function drawHeroSelect() {
  const ss = screenState;

  // 底色
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#f5f0e8');
  grad.addColorStop(1, '#e8e0d0');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // 标题
  ctx.textAlign = 'center';
  ctx.font = '24px "STKaiti","KaiTi","Microsoft YaHei",serif';
  ctx.fillStyle = '#3a3530';
  const lvCfg = LEVEL_CONFIG[ss.selectedLevel];
  ctx.fillText(`·${lvCfg ? lvCfg.name : ''}·择灵·`, W/2, 45);

  // 返回按钮
  ctx.font = '14px "STKaiti","KaiTi","Microsoft YaHei",serif';
  ctx.fillStyle = '#999';
  ctx.textAlign = 'left';
  ctx.fillText('← 返回', 15, 35);

  // 共鸣等级 — 顶部显示
  ctx.textAlign = 'center';
  ctx.font = '12px "STKaiti","KaiTi","Microsoft YaHei",serif';
  ctx.fillStyle = '#998866';
  ctx.fillText(`共鸣 Lv.${resonance.level}  (${resonance.exp}/${resonance.expToNext(resonance.level)})`, W/2, 62);

  // 3个画灵卡片
  const hCardW = W - 60, hCardH = 200;
  const hCardX = 30, hGapY = 16;
  const hStartY = 80;

  for (let i = 0; i < HEROES.length; i++) {
    const hero = HEROES[i];
    const cy = hStartY + i * (hCardH + hGapY);
    const isHover = ss.heroHover === i;

    ctx.save();
    ctx.globalAlpha = isHover ? 1 : 0.92;

    // 卡片阴影
    ctx.fillStyle = 'rgba(0,0,0,0.03)';
    ctx.beginPath();
    ctx.roundRect(hCardX + 2, cy + 2, hCardW, hCardH, 8);
    ctx.fill();

    // 卡片背景
    const bgGrad = ctx.createLinearGradient(hCardX, cy, hCardX + hCardW, cy + hCardH);
    if (isHover) {
      bgGrad.addColorStop(0, '#faf6ee');
      bgGrad.addColorStop(1, '#f0ead8');
    } else {
      bgGrad.addColorStop(0, '#f8f4ec');
      bgGrad.addColorStop(1, '#ede6d6');
    }
    ctx.fillStyle = bgGrad;
    ctx.beginPath();
    ctx.roundRect(hCardX, cy, hCardW, hCardH, 8);
    ctx.fill();

    // 边框 — 画灵主题色
    ctx.strokeStyle = isHover ? hero.color : 'rgba(150,140,120,0.2)';
    ctx.lineWidth = isHover ? 2 : 1;
    ctx.stroke();

    // 画灵头像 — 圆形色块
    const avatarR = 28;
    const avatarX = hCardX + 44;
    const avatarY = cy + 50;
    // 外圈发光
    ctx.fillStyle = hero.color;
    ctx.globalAlpha = 0.12;
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, avatarR + 6, 0, Math.PI * 2);
    ctx.fill();
    // 主体
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = hero.color;
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, avatarR, 0, Math.PI * 2);
    ctx.fill();
    // 内圈
    ctx.fillStyle = hero.bodyColor;
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, avatarR * 0.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    // 名字在头像内
    ctx.font = 'bold 14px "STKaiti","KaiTi","Microsoft YaHei",serif';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText(hero.name.charAt(0), avatarX, avatarY + 5);

    // 名字+称号
    ctx.textAlign = 'left';
    ctx.font = '22px "STKaiti","KaiTi","Microsoft YaHei",serif';
    ctx.fillStyle = hero.color;
    ctx.fillText(hero.name, hCardX + 82, cy + 38);
    ctx.font = '12px "STKaiti","KaiTi","Microsoft YaHei",serif';
    ctx.fillStyle = '#998866';
    ctx.fillText(hero.title, hCardX + 82, cy + 58);

    // 描述
    ctx.font = '11px "STKaiti","KaiTi","Microsoft YaHei",serif';
    ctx.fillStyle = '#8a7e6a';
    ctx.fillText(hero.desc, hCardX + 16, cy + 86);

    // 属性条 — HP/ATK/SPD/CRIT
    const stats = [
      { label: 'HP', val: hero.hpMult, color: '#2d8a4e' },
      { label: 'ATK', val: hero.atkMult, color: '#c43a31' },
      { label: 'SPD', val: hero.spdMult, color: '#3a6b9e' },
      { label: 'CRIT', val: hero.critMult, color: '#c4a835' },
    ];
    const stX = hCardX + 16, stY = cy + 100, stW = hCardW - 32, stH = 8, stGap = 14;
    for (let s = 0; s < stats.length; s++) {
      const st = stats[s];
      const sy = stY + s * stGap;
      // 标签
      ctx.font = '9px "STKaiti","KaiTi","Microsoft YaHei",serif';
      ctx.fillStyle = '#aaa';
      ctx.textAlign = 'left';
      ctx.fillText(st.label, stX, sy + 7);
      // 背景
      const barX = stX + 36, barW = stW - 60;
      ctx.fillStyle = 'rgba(0,0,0,0.05)';
      ctx.beginPath();
      ctx.roundRect(barX, sy, barW, stH, 3);
      ctx.fill();
      // 数值条
      const pct = Math.min(st.val / 1.5, 1); // 1.5为最大值
      ctx.fillStyle = st.color;
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.roundRect(barX, sy, barW * pct, stH, 3);
      ctx.fill();
      ctx.globalAlpha = 1;
      // 数值文字
      ctx.font = '8px "STKaiti","KaiTi","Microsoft YaHei",serif';
      ctx.fillStyle = '#999';
      ctx.textAlign = 'right';
      ctx.fillText(`${Math.round(st.val * 100)}%`, stX + stW, sy + 7);
    }

    // 被动技能
    ctx.textAlign = 'left';
    ctx.font = '11px "STKaiti","KaiTi","Microsoft YaHei",serif';
    ctx.fillStyle = hero.passiveColor;
    ctx.globalAlpha = 0.8;
    ctx.fillText(`被动: ${hero.passiveDesc}`, hCardX + 16, cy + 168);
    // 爆发技能
    ctx.fillStyle = '#c43a31';
    ctx.fillText(`爆发: ${hero.rageSkillDesc}`, hCardX + 16, cy + 185);
    ctx.globalAlpha = 1;

    ctx.restore();
  }

  // 底部提示
  ctx.textAlign = 'center';
  ctx.font = '12px "STKaiti","KaiTi","Microsoft YaHei",serif';
  ctx.fillStyle = '#bbb';
  ctx.fillText('选择画灵进入战场', W/2, H - 20);
}

// ==================== 关卡覆盖层 ====================
function drawLevelOverlay() {
  const cfg = LEVEL_CONFIG[state.level];

  // ---- 卷首标题卡 ----
  if (state.levelPhase === 'intro') {
    const progress = 1 - (state.levelIntroTimer / 2.0); // 0→1
    // 淡入淡出：前0.5s淡入，后0.3s淡出
    let alpha = 1;
    if (progress < 0.25) alpha = progress / 0.25;
    else if (progress > 0.85) alpha = (1 - progress) / 0.15;

    // 半透明背景
    ctx.fillStyle = `rgba(30,28,24,${0.7 * alpha})`;
    ctx.fillRect(0, 0, W, H);

    ctx.textAlign = 'center';
    ctx.globalAlpha = alpha;

    // 卷号
    ctx.font = '16px "STKaiti","KaiTi","Microsoft YaHei",serif';
    ctx.fillStyle = '#aa9977';
    ctx.fillText(`第${['一','二','三'][state.level]}卷`, W/2, H/2 - 50);

    // 关卡名 — 大字
    ctx.font = '42px "STKaiti","KaiTi","Microsoft YaHei",serif';
    ctx.fillStyle = '#f5f0e8';
    ctx.fillText(cfg.name, W/2, H/2);

    // 描述
    ctx.font = '14px "STKaiti","KaiTi","Microsoft YaHei",serif';
    ctx.fillStyle = '#998866';
    ctx.fillText(cfg.desc, W/2, H/2 + 40);

    ctx.globalAlpha = 1;
  }

  // ---- 关卡过渡动画 ----
  if (state.levelPhase === 'transition') {
    const progress = 1 - (state.levelTransitionTimer / 2.0); // 0→1
    // 前1s淡入黑屏，后1s从黑屏淡出
    let alpha;
    if (progress < 0.5) {
      alpha = progress / 0.5;  // 0→1 黑屏加深
    } else {
      alpha = 1 - (progress - 0.5) / 0.5; // 1→0 黑屏消退
    }
    ctx.fillStyle = `rgba(30,28,24,${alpha})`;
    ctx.fillRect(0, 0, W, H);

    // 过渡中间显示下一关卷名
    if (progress > 0.35 && progress < 0.65) {
      const nextLevel = state.level + 1;
      if (nextLevel < LEVEL_CONFIG.length) {
        const nextCfg = LEVEL_CONFIG[nextLevel];
        const textAlpha = 1 - Math.abs(progress - 0.5) / 0.15;
        ctx.globalAlpha = Math.min(1, Math.max(0, textAlpha));
        ctx.textAlign = 'center';
        ctx.font = '14px "STKaiti","KaiTi","Microsoft YaHei",serif';
        ctx.fillStyle = '#aa9977';
        ctx.fillText(`第${['一','二','三'][nextLevel]}卷`, W/2, H/2 - 30);
        ctx.font = '32px "STKaiti","KaiTi","Microsoft YaHei",serif';
        ctx.fillStyle = '#f5f0e8';
        ctx.fillText(nextCfg.name, W/2, H/2 + 10);
        ctx.globalAlpha = 1;
      }
    }
  }

  // ---- 全部通关 ----
  if (state.levelPhase === 'complete' && state.allLevelsComplete) {
    ctx.fillStyle = 'rgba(30,28,24,0.8)';
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.globalAlpha = 1;

    ctx.font = '36px "STKaiti","KaiTi","Microsoft YaHei",serif';
    ctx.fillStyle = '#f5f0e8';
    ctx.fillText('·画卷终成·', W/2, H/2 - 40);

    ctx.font = '16px "STKaiti","KaiTi","Microsoft YaHei",serif';
    ctx.fillStyle = '#aa9977';
    ctx.fillText('三卷皆通，墨道已成', W/2, H/2 + 10);

    ctx.font = '14px "STKaiti","KaiTi","Microsoft YaHei",serif';
    ctx.fillStyle = '#998866';
    ctx.fillText('点触重游山水', W/2, H/2 + 60);

    ctx.globalAlpha = 1;
  }
}
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
    if (r > w/2) r = w/2;
    if (r > h/2) r = h/2;
    this.moveTo(x + r, y);
    this.arcTo(x + w, y, x + w, y + h, r);
    this.arcTo(x + w, y + h, x, y + h, r);
    this.arcTo(x, y + h, x, y, r);
    this.arcTo(x, y, x + w, y, r);
    return this;
  };
}

// ==================== 资源加载 ====================
const assets = {};
const assetFiles = [
  ['player', 'player_char.png'],
  ['enemy', 'enemy_ink.png'],
  ['bg', 'bg_mountains.png'],
  ['particle', 'particle_splash.png'],
  ['rage', 'rage_effect.png'],
  ['seal', 'ui_seal.png'],
];
let assetsLoaded = 0;
let gameReady = false;

for (const [key, file] of assetFiles) {
  const img = new Image();
  img.onload = () => {
    assetsLoaded++;
    if (assetsLoaded >= assetFiles.length) {
      gameReady = true;
      console.log('所有美术资源加载完成');
    }
  };
  img.onerror = () => {
    console.warn(`加载失败(将使用图形替换): ${file}`);
    assetsLoaded++;
    if (assetsLoaded >= assetFiles.length) gameReady = true;
  };
  img.src = file;
  assets[key] = img;
}

// ==================== 游戏主循环 ====================
let lastTime = 0;

function update(time) {
  const dt = Math.min((time - lastTime) / 1000, 0.05);
  lastTime = time;

  // ---- 关卡阶段状态机 ----
  if (state.levelPhase === 'intro') {
    state.levelIntroTimer -= dt;
    if (state.levelIntroTimer <= 0) {
      state.levelPhase = 'battle';
      // 开始战斗：生成第一波敌人
      state.wave.waveDelay = 1.5;
    }
    // intro期间仍更新摄像机和环境粒子
    const p = state.player;
    const cam = state.camera;
    const tX = p.x - W/2, tY = p.y - H/2;
    cam.targetX = clamp(tX, 0, WORLD_W - W);
    cam.targetY = clamp(tY, 0, WORLD_H - H);
    cam.x += (cam.targetX - cam.x) * CAM_SMOOTH * dt;
    cam.y += (cam.targetY - cam.y) * CAM_SMOOTH * dt;
    // 环境粒子
    for (const d of state.ambientDots) {
      d.x += d.speedX * dt + Math.sin(d.phase + Date.now() * 0.001 * d.floatSpeed) * 0.3;
      d.y += d.speedY * dt;
      if (d.y < -20) { d.y = WORLD_H + 20; d.x = Math.random() * WORLD_W; }
      if (d.x < -20) d.x = WORLD_W + 20;
      if (d.x > WORLD_W + 20) d.x = -20;
    }
    return; // intro期间不执行战斗逻辑
  }

  if (state.levelPhase === 'transition') {
    state.levelTransitionTimer -= dt;
    if (state.levelTransitionTimer <= 0) {
      // 过渡完成，进入下一关
      const nextLevel = state.level + 1;
      if (nextLevel < LEVEL_CONFIG.length) {
        startLevel(nextLevel);
      } else {
        state.allLevelsComplete = true;
        state.levelPhase = 'complete';
      }
    }
    return;
  }

  if (state.levelPhase === 'complete') {
    // 通关界面 — 不执行战斗逻辑
    return;
  }

  const p = state.player;

  // ---- 关卡倒计时 ----
  if (!state.wave.completed && !state.gameOver) {
    state.levelTimer -= dt;
    if (state.levelTimer <= 0) {
      state.levelTimer = 0;
      state.timerExpired = true;
      // 时间耗尽 → 玩家死亡
      if (!state.gameOver) {
        state.player.hp = 0;
      }
    }
  }

  // ---- 玩家移动 ----
  if (state.joystick.active) {
    const mag = Math.sqrt(state.joystick.dx**2 + state.joystick.dy**2);
    const norm = mag > 0.01 ? Math.min(mag, 1) : 0;

    p.x += state.joystick.dx * getHeroSpd() * norm * dt;
    p.y += state.joystick.dy * getHeroSpd() * norm * dt;

    p.x = clamp(p.x, 20, WORLD_W - 20);
    p.y = clamp(p.y, 20, WORLD_H - 20);
    // 障碍物碰撞
    const pPush = resolveObstacleCollision(p.x, p.y, PLAYER_SIZE);
    if (pPush) { p.x = pPush.x; p.y = pPush.y; }
  }

  // ---- 闪避/冲刺 ----
  if (state.dash.active) {
    state.dash.timer -= dt;
    p.x += Math.cos(state.dash.angle) * DASH_SPEED * dt;
    p.y += Math.sin(state.dash.angle) * DASH_SPEED * dt;
    p.x = clamp(p.x, 20, WORLD_W - 20);
    p.y = clamp(p.y, 20, WORLD_H - 20);
    const dPush = resolveObstacleCollision(p.x, p.y, PLAYER_SIZE);
    if (dPush) { p.x = dPush.x; p.y = dPush.y; }

    if (state.dash.timer <= 0) {
      state.dash.active = false;
      state.dash.cooldown = DASH_COOLDOWN;
    }
  }
  if (state.dash.cooldown > 0) {
    state.dash.cooldown -= dt;
  }
  if (state.dash.invincible > 0) {
    state.dash.invincible -= dt;
  }

  // ---- 寻找最近敌人（手动锁敌优先）----
  let target = null, minDist = Infinity;
  // 检查锁定目标是否仍然有效
  if (state.lockedTarget && state.lockedTarget.alive) {
    target = state.lockedTarget;
    minDist = dist(p.x, p.y, target.x, target.y);
  } else {
    state.lockedTarget = null; // 锁定目标已死，清除
    // 自动寻找最近敌人
    for (const e of state.enemies) {
      if (!e.alive) continue;
      const d = dist(p.x, p.y, e.x, e.y);
      if (d < minDist) { minDist = d; target = e; }
    }
  }

  // ---- 敌人AI ----
  for (const e of state.enemies) {
    if (!e.alive) continue;

    if (e.stagger > 0) {
      e.stagger -= dt;
      continue;
    }

    let sepX = 0, sepY = 0;
    const distToPlayer = dist(e.x, e.y, p.x, p.y);

    // 分离力
    for (const other of state.enemies) {
      if (other === e || !other.alive) continue;
      const d = dist(e.x, e.y, other.x, other.y);
      if (d < 50 && d > 0) {
        const force = (50 - d) / 50;
        sepX += (e.x - other.x) / d * force * 30;
        sepY += (e.y - other.y) / d * force * 30;
      }
    }
    e.separation.x = sepX;
    e.separation.y = sepY;

    switch (e.state) {
      case 'chase':
        e.angle = Math.atan2(p.y - e.y, p.x - e.x);
        e.x += Math.cos(e.angle) * e.speed * dt + sepX * dt;
        e.y += Math.sin(e.angle) * e.speed * dt + sepY * dt;
        e.x = clamp(e.x, 15, WORLD_W - 15);
        e.y = clamp(e.y, 50, WORLD_H - 20);
        const ePush1 = resolveObstacleCollision(e.x, e.y, e.size);
        if (ePush1) { e.x = ePush1.x; e.y = ePush1.y; }
        if (distToPlayer <= ENEMY_ATTACK_RANGE) {
          e.state = 'attack';
          e.attackTimer = 0.3 + Math.random() * 0.4;
          if (Math.random() < 0.3) e.strafeDir *= -1;
        }
        break;

      case 'attack':
        e.angle = Math.atan2(p.y - e.y, p.x - e.x);
        const strafeAngle = e.angle + Math.PI / 2 * e.strafeDir;
        e.x += Math.cos(strafeAngle) * e.speed * 0.5 * dt + sepX * dt;
        e.y += Math.sin(strafeAngle) * e.speed * 0.5 * dt + sepY * dt;
        e.y += Math.sin(e.angle) * e.speed * 0.25 * dt;
        e.x = clamp(e.x, 15, WORLD_W - 15);
        e.y = clamp(e.y, 50, WORLD_H - 20);
        const ePush2 = resolveObstacleCollision(e.x, e.y, e.size);
        if (ePush2) { e.x = ePush2.x; e.y = ePush2.y; }

        e.attackTimer -= dt;
        if (distToPlayer > ENEMY_ATTACK_RANGE * 1.3) {
          e.state = 'chase';
          break;
        }

        e.chargeGlow = true;
        if (e.attackTimer <= 0) {
          fireEnemyBullet(e.x, e.y, p.x, p.y);
          e.chargeGlow = false;
          e.state = 'cooldown';
          e.cooldownTimer = 0.6 + Math.random() * 0.4;
        }
        break;

      case 'cooldown':
        e.angle = Math.atan2(p.y - e.y, p.x - e.x);
        const cdStrafe = e.angle + Math.PI / 2 * e.strafeDir;
        e.x += Math.cos(cdStrafe) * e.speed * 0.3 * dt + sepX * dt;
        e.y += Math.sin(cdStrafe) * e.speed * 0.3 * dt + sepY * dt;
        e.x += Math.cos(e.angle) * e.speed * 0.15 * dt;
        e.y += Math.sin(e.angle) * e.speed * 0.15 * dt;
        e.x = clamp(e.x, 15, WORLD_W - 15);
        e.y = clamp(e.y, 50, WORLD_H - 20);
        const ePush3 = resolveObstacleCollision(e.x, e.y, e.size);
        if (ePush3) { e.x = ePush3.x; e.y = ePush3.y; }

        e.cooldownTimer -= dt;
        if (e.cooldownTimer <= 0) {
          if (distToPlayer <= ENEMY_ATTACK_RANGE * 1.1) {
            e.state = 'attack';
            e.attackTimer = 0.15;
          } else {
            e.state = 'chase';
          }
        }
        break;
    }
  }

  // ---- BOSS特殊逻辑 ----
  const boss = state.enemies.find(e => e.type === 'boss' && e.alive);
  if (boss) {
    const hpPct = boss.hp / boss.maxHp;

    let phase;
    if (hpPct > 0.66) phase = 1;
    else if (hpPct > 0.33) phase = 2;
    else phase = 3;

    if (boss.phase !== phase) {
      boss.phase = phase;
      const phaseTexts = { 1: '·墨凝·', 2: '·墨涌·', 3: '·墨狂·' };
      showActionText(phaseTexts[phase], boss.x, boss.y - 50);
      state.shake.intensity = 2;
      state.hitStop = 20;
    }

    // 击破僵直处理
    if (boss.breakStun > 0) {
      boss.breakStun -= dt;
      // 僵直中闪烁效果
      boss.hurtTimer = 0.06;
      if (boss.breakStun <= 0) {
        boss.breakGauge = 0; // 重置击破条
        showActionText('·墨魔苏醒·', boss.x, boss.y - 40);
      }
      // 僵直期间不行动
      boss.x = clamp(boss.x, 20, WORLD_W - 20);
      boss.y = clamp(boss.y, 30, WORLD_H - 30);
    } else {
      // 正常行动
      const phaseSpeed = { 1: 25, 2: 35, 3: 45 };
      const phaseColorChange = { 1: 5, 2: 3, 3: 2 };
      boss.speed = phaseSpeed[phase];

      const bDist = dist(boss.x, boss.y, p.x, p.y);

      if (phase === 3 && Math.random() < 0.02 && bDist > 60) {
        const chargeAngle = Math.atan2(p.y - boss.y, p.x - boss.x);
        boss.x += Math.cos(chargeAngle) * 300 * dt;
        boss.y += Math.sin(chargeAngle) * 300 * dt;
      } else {
        const bAngle = Math.atan2(p.y - boss.y, p.x - boss.x);
        boss.x += Math.cos(bAngle) * boss.speed * dt;
        boss.y += Math.sin(bAngle) * boss.speed * dt;
      }
      boss.x = clamp(boss.x, 20, WORLD_W - 20);
      boss.y = clamp(boss.y, 30, WORLD_H - 30);

      // BOSS射击 — 随机选技能
      if (!boss.bossFire) boss.bossFire = 0;
      boss.bossFire -= dt;
      const bossFireInterval = { 1: 1.2, 2: 0.9, 3: 0.6 };
      if (boss.bossFire <= 0) {
        boss.bossFire = bossFireInterval[phase];
        const angle = Math.atan2(p.y - boss.y, p.x - boss.x);

        // 随机技能选择
        const skillRoll = Math.random();
        if (skillRoll < 0.15 && phase >= 2) {
          // 技能A: 十字爆弹 — 四方向同时射击
          showActionText('·十字墨爆·', boss.x, boss.y - 40);
          for (let d = 0; d < 4; d++) {
            const crossAngle = d * Math.PI / 2;
            for (let s = -1; s <= 1; s++) {
              fireEnemyBulletPos(boss.x, boss.y, crossAngle + s * 0.1, phase >= 3);
            }
          }
        } else if (skillRoll < 0.25 && phase >= 3) {
          // 技能B: 全屏墨雨 — 8方向散射
          showActionText('·墨雨倾盆·', boss.x, boss.y - 40);
          for (let d = 0; d < 8; d++) {
            fireEnemyBulletPos(boss.x, boss.y, d * Math.PI / 4 + Math.random() * 0.2, true);
          }
        } else {
          // 普通攻击: 扇形/三连
          if (phase >= 2) {
            for (let s = -2; s <= 2; s++) {
              const spread = angle + s * 0.2;
              fireEnemyBulletPos(boss.x, boss.y, spread, phase >= 3);
            }
          } else {
            for (let b = 0; b < 3; b++) {
              setTimeout(() => {
                if (boss.alive) fireEnemyBulletPos(boss.x, boss.y, angle, false);
              }, b * 400);
            }
          }
        }
      }

      // BOSS颜色轮换
      if (!boss.colorTimer) boss.colorTimer = 0;
      boss.colorTimer += dt;
      if (boss.colorTimer >= phaseColorChange[phase]) {
        boss.colorTimer = 0;
        boss.armorColor = COLORS[Math.floor(Math.random() * COLORS.length)];
      }

      // BOSS召唤
      if (phase >= 2) {
        if (!boss.summonTimer) boss.summonTimer = 0;
        boss.summonTimer += dt;
        const summonInterval = phase >= 3 ? 7 : 10;
        if (boss.summonTimer >= summonInterval) {
          boss.summonTimer = 0;
          const summonCount = phase >= 3 ? 3 : 2;
          for (let s = 0; s < summonCount; s++) {
            spawnEnemy(boss.x + (Math.random()-0.5)*80, boss.y + 40, 'fast');
          }
          showActionText('·墨傀应召·', boss.x, boss.y - 40);
        }
      }
    }
  }

  // ---- 玩家状态 ----
  state.player.isMoving = Math.abs(state.joystick.dx) > 0.1 || Math.abs(state.joystick.dy) > 0.1;
  state.player.x = clamp(state.player.x, 20, WORLD_W - 20);

  // ---- 受击推开 — 敌人太近时推开玩家 ----
  for (const e of state.enemies) {
    if (!e.alive) continue;
    const d = dist(p.x, p.y, e.x, e.y);
    const pushDist = PLAYER_SIZE + e.size + 5; // 最小间距
    if (d < pushDist && d > 0) {
      const pushAngle = Math.atan2(p.y - e.y, p.x - e.x);
      const pushForce = (pushDist - d) * 3; // 越近推力越大
      p.x += Math.cos(pushAngle) * pushForce * dt;
      p.y += Math.sin(pushAngle) * pushForce * dt;
      p.x = clamp(p.x, 20, WORLD_W - 20);
      p.y = clamp(p.y, 20, WORLD_H - 20);
    }
  }

  // ---- 摄像机跟随玩家 ----
  // 目标：让玩家始终在屏幕中心附近
  state.camera.targetX = p.x - W / 2;
  state.camera.targetY = p.y - H / 2;
  // 限制摄像机不超出世界边界
  state.camera.targetX = clamp(state.camera.targetX, 0, WORLD_W - W);
  state.camera.targetY = clamp(state.camera.targetY, 0, WORLD_H - H);
  // 平滑插值
  state.camera.x += (state.camera.targetX - state.camera.x) * CAM_SMOOTH * dt;
  state.camera.y += (state.camera.targetY - state.camera.y) * CAM_SMOOTH * dt;

  // ---- 波次管理 ----
  let aliveCount = state.enemies.filter(e => e.alive).length;
  if (!state.wave.completed && aliveCount === 0 && state.wave.waveDelay > 0) {
    state.wave.waveDelay -= dt;
    if (state.wave.waveDelay <= 0) {
      const nextZoneIdx = state.wave.current + 1;
      if (nextZoneIdx >= WAVE_CONFIG.length) {
        state.wave.completed = true;
        const remain = state.levelTimer;
        const cfg = LEVEL_CONFIG[state.level];
        state.starRating = 2;
        state.completionStats = { kills: state.killCount, rageCount: state.rageCount, breaks: state.breakCount, remaining: Math.floor(remain), rating: 2 };
        showActionText(`·${cfg.name}·试墨大成·`, p.x, p.y - 20);
        gameSave.updateLevel(state.level, 2, state.killCount);
        setTimeout(() => {
          screenState.resultLevelIdx = state.level;
          screenState.resultStars = 2;
          screenState.resultStartTime = Date.now() * 0.001;
          screenState.current = 'result';
        }, 1500);
      } else {
        const zone = WAVE_CONFIG[nextZoneIdx];
        if (zone && zone.boss) {
          const bossHp = zone.bossHp || ENEMY_TYPES.boss.hp;
          spawnEnemy(p.x + (Math.random()-0.5)*100, p.y - 250, 'boss', bossHp);
          showActionText('·墨魔降世·', p.x, p.y - 200);
        } else if (zone) {
          for (let i = 0; i < zone.enemies; i++) {
            const type = zone.types ? zone.types[i % zone.types.length] : 'normal';
            // 在玩家视野上方/周围随机生成
            const angle = (i / zone.enemies) * Math.PI * 2 + Math.random() * 0.5;
            const radius = 200 + Math.random() * 150;
            const ex = clamp(p.x + Math.cos(angle) * radius, 30, WORLD_W - 30);
            const ey = clamp(p.y + Math.sin(angle) * radius - 100, 30, WORLD_H - 30);
            spawnEnemy(ex, ey, type);
          }
          showActionText(`·第${nextZoneIdx + 1}波·`, p.x, p.y - 120);
        }
        state.wave.current = nextZoneIdx;
        state.wave.waveDelay = 1.5;
      }
    }
  }

  // ---- 玩家死亡 ----
  if (state.player.hp <= 0 && !state.gameOver) {
    state.gameOver = true;
    state.gameOverTimer = 1.2;
    showActionText('·墨尽·', p.x, p.y - 60);
    state.shake.intensity = 3;
    state.hitStop = 50;

    for (let i = 0; i < 20; i++) {
      const a = Math.random() * Math.PI * 2;
      state.particles.push({
        x: p.x, y: p.y,
        vx: Math.cos(a) * (100 + Math.random() * 150),
        vy: Math.sin(a) * (100 + Math.random() * 150),
        size: 4 + Math.random() * 6, color: C.INK_BLACK,
        life: 0.5, maxLife: 0.8, alpha: 1,
      });
    }
  }

  if (state.gameOver) {
    state.gameOverTimer -= dt;
    if (state.gameOverTimer > 0.8 && state.gameOverTimer < 1.1) {
      showActionText('·墨尽···', p.x, p.y - 20);
    }
    if (state.gameOverTimer <= 0) {
      // 失败 → 进入结算画面（0星）
      screenState.resultLevelIdx = state.level;
      screenState.resultStars = 0;
      screenState.resultStartTime = Date.now() * 0.001;
      screenState.current = 'result';
    }
    return;
  }

  // ---- 通关检查 ----
  aliveCount = state.enemies.filter(e => e.alive).length;
  const bossExists = state.enemies.some(e => e.type === 'boss');
  const bossDead = bossExists && !state.enemies.some(e => e.type === 'boss' && e.alive);
  const allWavesDone = state.wave.current >= WAVE_CONFIG.length - 1;
  if (!state.wave.completed && aliveCount === 0 && (allWavesDone || bossDead)) {
    state.wave.completed = true;
    const remain = state.levelTimer;
    let stars = bossExists ? (remain >= 30 ? 3 : 2) : 1;
    state.starRating = stars;
    state.completionStats = {
      kills: state.killCount,
      rageCount: state.rageCount,
      maxCombo: state.consecCrit,
      breaks: state.breakCount,
      remaining: Math.floor(remain),
      rating: stars,
    };
    const cfg = LEVEL_CONFIG[state.level];
    showActionText(bossExists ? `·${cfg.name}·墨魔伏诛·` : `·${cfg.name}·试墨大成·`, p.x, p.y - 80);
    // 保存通关记录
    gameSave.updateLevel(state.level, stars, state.killCount);
    // 1.5秒后进入结算画面
    setTimeout(() => {
      screenState.resultLevelIdx = state.level;
      screenState.resultStars = stars;
      screenState.resultStartTime = Date.now() * 0.001;
      screenState.current = 'result';
    }, 1500);
  }

  // ---- 泼墨(怒气)系统 ----
  if (!state.rage.active && state.rage.meter >= RAGE_METER_MAX) {
    state.rage.active = true;
    state.rage.endTime = time + RAGE_DURATION;
    state.rage.meter = RAGE_METER_MAX;
    state.rageCount++;
    showActionText('·泼墨大法·', p.x, p.y - 60);
    playSound('rage');
    state.shake.intensity = 2.5;
    state.hitStop = 30;

    // 涂色爆发 — 全屏晕染
    rageWashStart();

    // ---- 画灵爆发技能 ----
    if (currentHero.rageSkill === 'rageScatter') {
      // 丹霞·丹青万卷：8方向散射弹
      for (let d = 0; d < 8; d++) {
        const scatterAngle = d * Math.PI / 4 + Math.random() * 0.2;
        fireBullet(p.x, p.y,
          p.x + Math.cos(scatterAngle) * 200,
          p.y + Math.sin(scatterAngle) * 200, true, state.bulletColorIndex);
      }
      showActionText('·丹青万卷·', p.x, p.y - 80);
    } else if (currentHero.rageSkill === 'rageShadow') {
      // 墨痕·墨影分身：生成2个墨影自动攻击5秒
      state.shadows = [];
      for (let s = 0; s < 2; s++) {
        const sAngle = s * Math.PI - Math.PI / 2;
        state.shadows.push({
          x: p.x + Math.cos(sAngle) * 50,
          y: p.y + Math.sin(sAngle) * 50,
          life: 5.0,
          fireTimer: 0,
        });
      }
      showActionText('·墨影分身·', p.x, p.y - 80);
    } else if (currentHero.rageSkill === 'rageHeal') {
      // 青岚·泼墨回春：爆发期间持续回血
      state.rage.healTimer = 0;
      showActionText('·泼墨回春·', p.x, p.y - 80);
    }

    const a = Math.random() * Math.PI * 2;
    const sp = 80 + Math.random() * 180;
    state.particles.push({
      x: state.player.x, y: state.player.y,
      vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
      size: 4 + Math.random() * 6,
      color: C.RED,
      life: 0.3 + Math.random() * 0.4,
      maxLife: 0.7,
      alpha: 1,
    });
  }

  // 泼墨消退（只在激活时检查）
  if (state.rage.active && time >= state.rage.endTime) {
    state.rage.active = false;
    state.rage.meter = 0;
    state.shadows = []; // 清除墨影分身
    showActionText('墨意消退', p.x, p.y - 60);
  }

  // ---- 青岚爆发回血 ----
  if (state.rage.active && currentHero.rageSkill === 'rageHeal') {
    state.rage.healTimer = (state.rage.healTimer || 0) + dt;
    if (state.rage.healTimer >= 1.0) {
      state.rage.healTimer = 0;
      const healAmt = 8;
      state.player.hp = Math.min(state.player.maxHp, state.player.hp + healAmt);
      spawnDamageNumber(p.x, p.y - 20, `+${healAmt}`, false, '#2d8a4e');
    }
  }

  // ---- 墨影分身逻辑 ----
  for (let si = state.shadows.length - 1; si >= 0; si--) {
    const shadow = state.shadows[si];
    shadow.life -= dt;
    if (shadow.life <= 0) {
      state.shadows.splice(si, 1);
      continue;
    }
    // 跟随玩家，偏移40px
    const sAngle = si * Math.PI * 0.8 + Date.now() * 0.002;
    const sTargetX = p.x + Math.cos(sAngle) * 40;
    const sTargetY = p.y + Math.sin(sAngle) * 40;
    shadow.x += (sTargetX - shadow.x) * 5 * dt;
    shadow.y += (sTargetY - shadow.y) * 5 * dt;
    // 自动射击
    shadow.fireTimer = (shadow.fireTimer || 0) + dt;
    if (shadow.fireTimer >= 0.3 && target) {
      shadow.fireTimer = 0;
      const sColorIdx = Math.floor(Math.random() * COLORS.length);
      fireBullet(shadow.x, shadow.y, target.x, target.y, true, sColorIdx);
    }
  }

  // 涂色晕染动画更新
  rageWashUpdate(dt);

  // ---- 踩圈切色 ----
  updateColorCircles(dt);

  // ---- 玩家朝向 ----
  if (target) {
    p.angle = Math.atan2(target.y - p.y, target.x - p.x);
  }

  // ---- 射击方向抑制 ----
  let fireRateMult = 1;
  if (state.joystick.active && target) {
    const joyAngle = Math.atan2(state.joystick.dy, state.joystick.dx);
    const targetAngle = Math.atan2(target.y - p.y, target.x - p.x);
    let angleDiff = joyAngle - targetAngle;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

    if (Math.abs(angleDiff) > 2.1) {
      fireRateMult = 0.3;
    }
  }

  // ---- 自动射击（停火时跳过）----
  if (state.ceaseFire) {
    // 停火中，不射击
  } else if (state.rage.active) {
    const rageInterval = RAGE_FIRE_RATE / 1000;
    state.rage.fireTimer += dt;
    if (target && minDist <= ATTACK_RANGE && state.rage.fireTimer >= rageInterval) {
      state.rage.fireTimer = 0;
      state.shootCount++;
      const colorIdx = state.bulletColorIndex;

      fireBullet(p.x, p.y, target.x, target.y, true, colorIdx);

      const spreadAngle = Math.atan2(target.y - p.y, target.x - p.x);
      fireBullet(p.x, p.y,
        p.x + Math.cos(spreadAngle + 0.3) * 100,
        p.y + Math.sin(spreadAngle + 0.3) * 100, true, colorIdx);
      fireBullet(p.x, p.y,
        p.x + Math.cos(spreadAngle - 0.3) * 100,
        p.y + Math.sin(spreadAngle - 0.3) * 100, true, colorIdx);
    }
  } else {
    const effectiveRate = getHeroFireRate();
    if (target && minDist <= ATTACK_RANGE && time - state.lastFire >= effectiveRate) {
      state.lastFire = time;
      state.shootCount++;
      const colorIdx = state.bulletColorIndex;
      state.bulletColorIndex = (state.bulletColorIndex + 1) % COLORS.length;
      fireBullet(p.x, p.y, target.x, target.y, false, colorIdx);
    }
  }

  // ---- 子弹更新 ----
  for (let i = state.bullets.length - 1; i >= 0; i--) {
    const b = state.bullets[i];
    let hit = false;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt * 1000;

    // 地面墨渍 + 涂色画布（世界坐标，不需减cam偏移）
    if (b.x > 0 && b.x < WORLD_W && b.y > 0 && b.y < WORLD_H) {
      if (state.groundStains.length < 1500) {
        state.groundStains.push({
          x: b.x + (Math.random() - 0.5) * 8,
          y: b.y + (Math.random() - 0.5) * 8,
          size: 1.5 + Math.random() * 3,
          color: b.color,
          alpha: 0.12 + Math.random() * 0.08,
        });
      }
      // 涂色画布 — 弹道轨迹留色（稀疏采样，避免过密）
      if (!b._lastPaintDist || Math.abs(b.x - b._lastPaintX) + Math.abs(b.y - b._lastPaintY) > 18) {
        paintInk(b.x, b.y, b.color, 2 + Math.random() * 3);
        b._lastPaintX = b.x;
        b._lastPaintY = b.y;
        state.paintCover = Math.min(1, state.paintCover + 0.0003);
      }
    }

    // 出界（世界坐标）
    if (b.x < -20 || b.x > WORLD_W + 20 || b.y < -20 || b.y > WORLD_H + 20 || b.life <= 0) {
      state.bullets.splice(i, 1);
      continue;
    }

    // 障碍物碰撞 — 子弹被阻挡
    if (checkBulletObstacleCollision(b.x, b.y, b.color)) {
      state.bullets.splice(i, 1);
      // 溅墨粒子
      for (let si = 0; si < 3; si++) {
        state.particles.push({
          x: b.x + (Math.random()-0.5)*10,
          y: b.y + (Math.random()-0.5)*10,
          vx: (Math.random()-0.5)*60,
          vy: (Math.random()-0.5)*60,
          size: 2 + Math.random()*2,
          alpha: 0.6,
          color: b.color,
          life: 0.4,
          isStain: false,
        });
      }
      continue;
    }

    // 命中检测
    for (const e of state.enemies) {
      if (!e.alive) continue;
      if (dist(b.x, b.y, e.x, e.y) < e.size + 6) {
        const critChance = getHeroCrit() / 100;
        const isCrit = Math.random() < critChance;
        playSound(isCrit ? 'crit' : 'hit');

        const bulletColor = b.color || C.INK_BLACK;
        const armorMatch = e.armorColor && bulletColor === e.armorColor;
        const matchBonus = state.rage.active ? 2.0 : 1.5;
        let damageMult = 1;
        let rageMeterBonus = 0.5;
        let isBreak = false;
        if (armorMatch) {
          damageMult = 2.0;
          rageMeterBonus = 2.0;
          isBreak = true;
          state.breakCount++;
          e.stagger = 0.15;

          // BOSS弱点击破条累积
          if (e.type === 'boss') {
            if (!e.breakGauge) e.breakGauge = 0;
            e.breakGauge += BOSS_BREAK_PER_HIT;
            if (e.breakGauge >= BOSS_BREAK_MAX && !e.breakStun) {
              // 击破！BOSS进入僵直
              e.breakStun = BOSS_BREAK_STUN;
              e.breakGauge = BOSS_BREAK_MAX;
              state.shake.intensity = 3;
              state.hitStop = 25;
              showActionText('·弱点崩破·', e.x, e.y - 40);
              playSound('rage');
              // 击破特效
              for (let bi = 0; bi < 20; bi++) {
                const ba = Math.random() * Math.PI * 2;
                const bsp = 150 + Math.random() * 300;
                state.particles.push({
                  x: e.x, y: e.y,
                  vx: Math.cos(ba) * bsp, vy: Math.sin(ba) * bsp,
                  size: 4 + Math.random() * 6,
                  color: e.armorColor,
                  life: 0.4 + Math.random() * 0.4,
                  maxLife: 0.8,
                  alpha: 1,
                });
              }
              paintInk(e.x, e.y, e.armorColor, 25);
            }
          }
        } else if (e.armorColor) {
          damageMult = 0.5;
          rageMeterBonus = 0.25;
        }

        const baseDmg = b.damage || BULLET_DAMAGE;
        const dmg = isCrit ? Math.floor(baseDmg * 1.5 * damageMult) : Math.floor(baseDmg * damageMult);
        state.consecCrit = isCrit ? state.consecCrit + 1 : 0;
        const finalDmg = state.rage.active ? Math.floor(dmg * RAGE_DAMAGE_MULT) : dmg;
        e.hp -= finalDmg;
        e.hurtTimer = 0.12;

        // ---- 画灵被动触发 ----
        if (currentHero.passive === 'inkHeal' && !e.alive) {
          // 青岚·墨愈：击杀回复（在敌人死亡时触发，移到击杀逻辑）
        }
        if (currentHero.passive === 'critSplash' && isCrit) {
          // 丹霞·丹心：暴击时溅墨伤害周围敌人
          for (const otherE of state.enemies) {
            if (otherE === e || !otherE.alive) continue;
            const sDist = dist(e.x, e.y, otherE.x, otherE.y);
            if (sDist < 80) {
              const splashDmg = Math.floor(baseDmg * 0.3);
              otherE.hp -= splashDmg;
              otherE.hurtTimer = 0.08;
              spawnDamageNumber(otherE.x, otherE.y - 10, splashDmg, false, null);
            }
          }
          // 溅墨视觉
          for (let si = 0; si < 5; si++) {
            const sa = Math.random() * Math.PI * 2;
            state.particles.push({
              x: e.x, y: e.y,
              vx: Math.cos(sa) * (60 + Math.random() * 40),
              vy: Math.sin(sa) * (60 + Math.random() * 40),
              size: 3 + Math.random() * 3, color: C.RED,
              life: 0.2 + Math.random() * 0.2, maxLife: 0.4, alpha: 0.7,
            });
          }
        }
        if (currentHero.passive === 'bigBullet') {
          // 墨痕·墨守：命中时小范围AOE标记
          for (const otherE of state.enemies) {
            if (otherE === e || !otherE.alive) continue;
            const sDist = dist(e.x, e.y, otherE.x, otherE.y);
            if (sDist < 40) {
              // 给附近敌人也加一层颜色标记
              otherE.colorMarks.push({ color: b.color, timer: 3 });
              if (otherE.colorMarks.length > 3) otherE.colorMarks.shift();
            }
          }
        }

        // ---- 颜色标记 + 元素反应 ----
        // bulletColor 已在上方声明
        // 检查是否已有不同颜色的标记 → 触发元素反应
        let reactionTriggered = false;
        for (let mi = e.colorMarks.length - 1; mi >= 0; mi--) {
          if (e.colorMarks[mi].color !== bulletColor) {
            // 元素反应！两种颜色碰撞 → 爆炸
            const reactColor1 = e.colorMarks[mi].color;
            const reactColor2 = bulletColor;
            e.colorMarks.splice(mi, 1);

            // 反应伤害
            const reactDmg = Math.floor(BULLET_DAMAGE * 1.2);
            e.hp -= reactDmg;
            reactionTriggered = true;

            // 爆炸特效 — 大范围喷溅+涂色
            spawnDirectionalSplash(e.x, e.y, 0, reactColor1, 8);
            spawnDirectionalSplash(e.x, e.y, Math.PI, reactColor2, 8);
            paintInk(e.x, e.y, reactColor1, 18);
            paintInk(e.x, e.y, reactColor2, 18);

            // 反应爆炸粒子
            for (let ri = 0; ri < 12; ri++) {
              const ra = Math.random() * Math.PI * 2;
              const rsp = 100 + Math.random() * 250;
              state.particles.push({
                x: e.x, y: e.y,
                vx: Math.cos(ra) * rsp, vy: Math.sin(ra) * rsp,
                size: 3 + Math.random() * 5,
                color: ri % 2 === 0 ? reactColor1 : reactColor2,
                life: 0.3 + Math.random() * 0.4,
                maxLife: 0.7,
                alpha: 1,
              });
            }

            // 反应震动+顿帧
            state.hitStop = 8;
            state.shake.intensity = 1.0;

            // 反应文字
            const c1Name = COLOR_NAMES[COLORS.indexOf(reactColor1)] || '墨';
            const c2Name = COLOR_NAMES[COLORS.indexOf(reactColor2)] || '墨';
            showActionText(`·${c1Name}×${c2Name}·融·`, e.x, e.y - 25);
            playSound('crit');

            // 反应额外怒气
            if (!state.rage.active) {
              state.rage.meter += 1.5;
              if (state.rage.meter > RAGE_METER_MAX) state.rage.meter = RAGE_METER_MAX;
            }

            state.paintCover = Math.min(1, state.paintCover + 0.02);
            break; // 一次只触发一个反应
          }
        }

        // 没触发反应 → 叠加颜色标记
        if (!reactionTriggered) {
          // 同色叠加刷新时间，最多叠3层
          const existing = e.colorMarks.find(m => m.color === bulletColor);
          if (existing) {
            existing.timer = 5; // 刷新时间
            existing.stacks = Math.min((existing.stacks || 1) + 1, 3);
          } else if (e.colorMarks.length < 3) {
            e.colorMarks.push({ color: bulletColor, timer: 5, stacks: 1 });
          }
        }

        // 怒气值
        if (!state.rage.active) {
          state.rage.meter += rageMeterBonus;
          if (state.rage.meter > RAGE_METER_MAX) state.rage.meter = RAGE_METER_MAX;
        }

        // 弹性动画
        e.scale = 0.7;
        e.scaleVel = 6;

        // 命停/震屏 — 叠加式，不覆盖更大的值
        if (isBreak) {
          state.hitStop = Math.max(state.hitStop, HIT_STOP_CRIT * 1.5);
          state.shake.intensity = Math.max(state.shake.intensity, SHAKE_CRIT * 1.2);
        } else if (isCrit) {
          state.hitStop = Math.max(state.hitStop, HIT_STOP_CRIT);
          state.shake.intensity = Math.max(state.shake.intensity, SHAKE_CRIT);
        } else {
          state.hitStop = Math.max(state.hitStop, HIT_STOP_NORMAL);
          state.shake.intensity = Math.max(state.shake.intensity, SHAKE_NORMAL);
        }

        // 喷溅效果
        const hitAngle = Math.atan2(b.vy, b.vx);
        const splashColor = isBreak ? e.armorColor : (isCrit ? C.RED : (state.rage.active ? C.RED : C.INK_BLACK));
        const splashCount = isBreak ? 12 : (isCrit ? 10 : 8);
        spawnDirectionalSplash(b.x, b.y, hitAngle, splashColor, splashCount);
        spawnInkStain(b.x, b.y, splashColor);

        // 涂色画布 — 命中时大块涂色
        paintInk(b.x, b.y, splashColor, isBreak ? 14 : (isCrit ? 11 : 8));
        state.paintCover = Math.min(1, state.paintCover + (isBreak ? 0.015 : (isCrit ? 0.01 : 0.005)));

        for (let s = 0; s < 4; s++) {
          spawnInkStain(b.x + (Math.random()-0.5)*20, b.y + (Math.random()-0.5)*20, splashColor);
        }

        if (isCrit || isBreak) spawnInkDrip(b.x, b.y);

        spawnDamageNumber(b.x, b.y - 10, finalDmg, isCrit || isBreak, isBreak ? e.armorColor : null);

        if (isCrit) {
          const breakText = isBreak ? '·' + COLOR_NAMES[COLORS.indexOf(e.armorColor)] + '·破·' : '·破·';
          showActionText(state.consecCrit >= 2 ? '·' + (isBreak ? COLOR_NAMES[COLORS.indexOf(e.armorColor)] : '') + '连破·' : breakText, b.x, b.y - 30);
        }

        // 击杀
        if (e.hp <= 0) {
          e.alive = false;
          state.killCount++;

          // ---- 画灵被动：青岚·墨愈 ----
          if (currentHero.passive === 'inkHeal') {
            state.player.hp = Math.min(state.player.maxHp, state.player.hp + 3);
            spawnDamageNumber(p.x, p.y - 20, '+3', false, '#2d8a4e');
          }

          // ---- 共鸣经验 ----
          const expGain = e.type === 'boss' ? 15 : (e.type === 'heavy' ? 3 : 1);
          const leveledUp = resonance.addExp(expGain);
          state.levelExpGained += expGain;
          if (leveledUp) {
            showActionText('·共鸣提升·', p.x, p.y - 60);
            // 升级时刷新属性
            const bonus = resonance.getBonus();
            state.heroStats.atk = Math.floor(BULLET_DAMAGE * currentHero.atkMult + bonus.atk);
            state.heroStats.crit = Math.floor(15 * currentHero.critMult + bonus.crit);
          }

          const ex = e.x, ey = e.y;

          // 死亡粒子
          const a = Math.random() * Math.PI * 2;
          const sp = 100 + Math.random() * 200;
          state.particles.push({
            x: ex, y: ey,
            vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
            size: 3 + Math.random() * 7,
            color: Math.random() < 0.3 ? C.INK_WASH : C.INK_BLACK,
            life: 0.4 + Math.random() * 0.3,
            maxLife: 0.7,
            alpha: 1,
          });

          for (let j = 0; j < 5; j++) {
            const stain = {
              x: ex + (Math.random() - 0.5) * 30,
              y: ey + (Math.random() - 0.5) * 30,
              size: 6 + Math.random() * 12,
              color: C.INK_MEDIUM,
              alpha: 0.3,
              life: 3,
              maxLife: 3,
              vx: 0, vy: 0, isStain: true,
            };
            state.particles.push(stain);
          }

          playSound('kill');
          showActionText('·墨散·', ex, ey);
          state.hitStop = HIT_STOP_KILL;
          state.shake.intensity = SHAKE_KILL;

          // 重生（世界坐标，在玩家周围生成）
          setTimeout(() => {
            const angle = Math.random() * Math.PI * 2;
            const radius = 250 + Math.random() * 150;
            const nx = clamp(state.player.x + Math.cos(angle) * radius, 30, WORLD_W - 30);
            const ny = clamp(state.player.y + Math.sin(angle) * radius, 30, WORLD_H - 30);
            // 从当前波次配置中选类型
            const zone = WAVE_CONFIG[state.wave.current] || WAVE_CONFIG[0];
            const type = zone.types ? zone.types[Math.floor(Math.random() * zone.types.length)] : 'normal';
            spawnEnemy(nx, ny, type);
          }, 2000);

          // 里程碑
          if (state.killCount % 5 === 0) {
            showActionText('·墨意渐浓·', p.x, p.y - 40);
          }
        }

        hit = true;
        break;
      }
    }

    if (hit) {
      state.bullets.splice(i, 1);
    }
  }

  // ---- 敌人子弹更新 ----
  for (let i = state.enemyBullets.length - 1; i >= 0; i--) {
    const eb = state.enemyBullets[i];
    eb.x += eb.vx * dt;
    eb.y += eb.vy * dt;
    eb.life -= dt * 1000;

    // 追踪弹
    if (eb.tracking) {
      const targetAngle = Math.atan2(p.y - eb.y, p.x - eb.x);
      const currentAngle = Math.atan2(eb.vy, eb.vx);
      let diff = targetAngle - currentAngle;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      const turn = Math.sign(diff) * Math.min(Math.abs(diff), eb.trackingStr * dt * 2);
      const newAngle = currentAngle + turn;
      const speed = Math.sqrt(eb.vx**2 + eb.vy**2);
      eb.vx = Math.cos(newAngle) * speed;
      eb.vy = Math.sin(newAngle) * speed;
    }

    // 出界
    if (eb.x < -20 || eb.x > WORLD_W + 20 || eb.y < -20 || eb.y > WORLD_H + 20 || eb.life <= 0) {
      state.enemyBullets.splice(i, 1);
      continue;
    }

    // 命中玩家（冲刺无敌期间免伤）
    if (dist(eb.x, eb.y, p.x, p.y) < PLAYER_SIZE + 6) {
      state.enemyBullets.splice(i, 1);
      if (state.dash.invincible > 0) {
        // 冲刺无敌 — 弹开+特效
        spawnDirectionalSplash(eb.x, eb.y, 0, C.INK_WASH, 3);
        continue;
      }
      p.hp -= 8;
      p.hp = Math.max(p.hp, 0);
      playSound('playerHit');

      spawnDirectionalSplash(eb.x, eb.y, 0, C.INK_WASH, 5);
      state.shake.intensity = 0.5;
      state.playerHurtFlash = 0.15;
    }
  }

  // ---- 敌人弹性恢复 + 颜色标记衰减 ----
  for (const e of state.enemies) {
    if (e.hurtTimer > 0) e.hurtTimer -= dt;

    if (e.scale < 1) {
      e.scale += e.scaleVel * dt;
      e.scaleVel -= 20 * dt;
      if (e.scale > 1) { e.scale = 1; e.scaleVel = 0; }
    }

    // 颜色标记倒计时
    for (let mi = e.colorMarks.length - 1; mi >= 0; mi--) {
      e.colorMarks[mi].timer -= dt;
      if (e.colorMarks[mi].timer <= 0) {
        e.colorMarks.splice(mi, 1);
      }
    }
  }

  // ---- 计时器 ----
  if (state.playerHurtFlash > 0) state.playerHurtFlash -= dt;
  if (state.rageFlash > 0) state.rageFlash -= dt;

  // ---- 震屏 ----
  if (state.shake.intensity > 0.05) {
    state.shake.x = (Math.random() - 0.5) * 2 * state.shake.intensity;
    state.shake.y = (Math.random() - 0.5) * 2 * state.shake.intensity;
    state.shake.intensity *= 0.85;
  } else {
    state.shake.intensity = 0;
    state.shake.x = 0;
    state.shake.y = 0;
  }

  // ---- 粒子更新 ----
  for (let i = state.particles.length - 1; i >= 0; i--) {
    const pt = state.particles[i];
    pt.x += pt.vx * dt;
    pt.y += pt.vy * dt;
    pt.vy += 60 * dt;
    pt.life -= dt;
    pt.alpha = clamp(pt.life / pt.maxLife, 0, 1);

    if (pt.life <= 0) {
      state.particles.splice(i, 1);
    }
  }

  // ---- 伤害数字更新 ----
  for (let i = state.damageNumbers.length - 1; i >= 0; i--) {
    const dn = state.damageNumbers[i];
    dn.life -= dt;
    dn.y -= 60 * dt;
    dn.alpha = clamp(dn.life / 0.8, 0, 1);

    if (dn.life <= 0) {
      state.damageNumbers.splice(i, 1);
    }
  }

  // ---- 动作文字更新 ----
  for (let i = state.actionTexts.length - 1; i >= 0; i--) {
    const at = state.actionTexts[i];
    at.life -= dt;
    at.y -= 40 * dt;

    if (at.life <= 0) {
      state.actionTexts.splice(i, 1);
    }
  }

  // ---- 环境粒子更新 ----
  for (const d of state.ambientDots) {
    d.x += d.speedX * dt + Math.sin(d.phase + Date.now() * 0.001 * d.floatSpeed) * 0.3;
    d.y += d.speedY * dt;
    if (d.y < -20) { d.y = WORLD_H + 20; d.x = Math.random() * WORLD_W; }
    if (d.x < -20) d.x = WORLD_W + 20;
    if (d.x > WORLD_W + 20) d.x = -20;
  }
}

// ==================== 主循环 — 屏幕路由 ====================
// 屏幕级动画的独立时间戳（不与update的lastTime冲突）
let lastScreenTime = 0;

function gameLoop(time) {
  // 首帧/切屏后初始化（用独立时间戳，不污染update的lastTime）
  if (time - lastScreenTime > 500) lastScreenTime = time;
  const screenDt = Math.min((time - lastScreenTime) / 1000, 0.05);
  lastScreenTime = time;

  // 标题淡入
  if (screenState.current === 'title') {
    screenState.titleFadeIn = Math.min(1, (screenState.titleFadeIn || 0) + screenDt * 0.8);
  }

  // 根据屏幕状态绘制
  switch (screenState.current) {
    case 'title':
      drawTitleScreen();
      break;
    case 'select':
      drawLevelSelect();
      break;
    case 'heroSelect':
      drawHeroSelect();
      break;
    case 'battle':
      try {
        if (state.paused) {
          draw();
          break;
        }
        if (state.hitStop > 0) {
          state.hitStop -= screenDt * 1000;
          if (state.shake.intensity > 0) {
            state.shake.x = (Math.random() - 0.5) * 2 * state.shake.intensity;
            state.shake.y = (Math.random() - 0.5) * 2 * state.shake.intensity;
            state.shake.intensity *= 0.85;
            if (state.shake.intensity < 0.05) { state.shake.intensity = 0; state.shake.x = 0; state.shake.y = 0; }
          }
          draw();
          break;
        }
        try { update(time); } catch(e) { console.error('update error:', e); }
        try { draw(); } catch(e) { console.error('draw error:', e); }
      } catch(e) { console.error('battle render error:', e); }
      break;
    case 'result':
      drawResultScreen();
      break;
  }

  requestAnimationFrame(gameLoop);
}

// ==================== 启动 ====================
console.log('水墨丹青 - 核心战斗原型已启动');
screenState.current = 'title';
screenState.titleFadeIn = 0;
requestAnimationFrame(gameLoop);
