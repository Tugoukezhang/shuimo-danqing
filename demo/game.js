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

// 计算缩放：390×844等比适配窗口
function calcDisplaySize() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const scale = Math.min(vw / W, vh / H);
  return { dw: W * scale, dh: H * scale, scale };
}
const { dw: initDW, dh: initDH } = calcDisplaySize();

// Canvas内部分辨率（高清）
canvas.width = W * dpr;
canvas.height = H * dpr;
// Canvas CSS显示尺寸（等比缩放适配窗口）
canvas.style.width = initDW + 'px';
canvas.style.height = initDH + 'px';
const ctx = canvas.getContext('2d');
ctx.scale(dpr, dpr);

// 涂色画布
paintCanvasEl.width = W * dpr;
paintCanvasEl.height = H * dpr;
paintCanvasEl.style.width = initDW + 'px';
paintCanvasEl.style.height = initDH + 'px';
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

// ==================== 资源系统 ====================
const RES_KEY = 'inkMaster_resources';
const resources = {
  moYu: 100,       // 墨玉（高级货币，≈钻石）— 新手送100
  moJing: 500,     // 墨晶（中级货币，≈金币）
  lingMo: 200,     // 灵墨（低级货币，养成用）
  gachaTicket: 10, // 墨韵券（抽卡券）— 新手送10
  // 离线挂机时间戳
  lastOnline: Date.now(),
  // 挂机收益上限（12小时）
  idleMaxHours: 12,
  // 每小时挂机产出
  idlePerHour: { moJing: 30, lingMo: 10 },

  load() {
    try {
      const d = JSON.parse(localStorage.getItem(RES_KEY));
      if (d) {
        this.moYu = d.moYu ?? 100;
        this.moJing = d.moJing ?? 500;
        this.lingMo = d.lingMo ?? 200;
        this.gachaTicket = d.gachaTicket ?? 10;
        this.lastOnline = d.lastOnline ?? Date.now();
      }
    } catch(e) {}
  },
  save() {
    try {
      localStorage.setItem(RES_KEY, JSON.stringify({
        moYu: this.moYu, moJing: this.moJing,
        lingMo: this.lingMo, gachaTicket: this.gachaTicket,
        lastOnline: Date.now(),
      }));
    } catch(e) {}
  },
  // 计算离线挂机收益
  calcIdleReward() {
    const now = Date.now();
    const elapsedMs = now - this.lastOnline;
    const elapsedHours = Math.min(elapsedMs / 3600000, this.idleMaxHours);
    return {
      moJing: Math.floor(elapsedHours * this.idlePerHour.moJing),
      lingMo: Math.floor(elapsedHours * this.idlePerHour.lingMo),
      hours: elapsedHours,
    };
  },
  // 领取挂机收益
  claimIdleReward() {
    const reward = this.calcIdleReward();
    if (reward.moJing <= 0 && reward.lingMo <= 0) return null;
    this.moJing += reward.moJing;
    this.lingMo += reward.lingMo;
    this.lastOnline = Date.now();
    this.save();
    return reward;
  },
  // 检查是否足够
  canAfford(costs) {
    for (const [k, v] of Object.entries(costs)) {
      if ((this[k] || 0) < v) return false;
    }
    return true;
  },
  // 扣除资源
  spend(costs) {
    if (!this.canAfford(costs)) return false;
    for (const [k, v] of Object.entries(costs)) {
      this[k] -= v;
    }
    this.save();
    return true;
  },
};
resources.load();

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

// 当前选择的画灵（默认青岚）— 仅非战斗时使用
let currentHero = HEROES[0];

// 战斗中获取当前操控画灵（3人队系统）
function getActiveHero() {
  if (state.party.length === 0) return HEROES[0];
  const slot = state.party[state.activeSlot];
  if (!slot) return HEROES[0];
  return HEROES[slot.heroIndex];
}

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
// screen: 'title' | 'lobby' | 'select' | 'heroSelect' | 'battle' | 'result' | 'heroList' | 'heroDetail' | 'gacha' | 'gachaResult' | 'shop' | 'settings'
const screenState = {
  current: 'title',      // 当前屏幕
  titleFadeIn: 0,        // 标题淡入动画 0~1
  lobbyTab: 0,           // 大厅底部Tab: 0=探卷 1=画灵 2=墨宝阁 3=文房四宝
  selectScrollY: 0,      // 选择画面滚动偏移
  selectHover: -1,       // 鼠标悬停的关卡索引 -1=无
  selectedLevel: -1,     // 选中的关卡
  heroHover: -1,         // 画灵选择悬停索引 -1=无
  selectedHeroes: [],    // 已选画灵索引数组（最多3个）
  resultLevelIdx: -1,    // 结算画面对应的关卡
  resultStars: 0,        // 结算星级
  transitionAlpha: 0,    // 屏幕过渡透明度
  transitionTarget: '',  // 过渡目标屏幕
  heroDetailIdx: 0,      // 画灵详情查看的画灵索引
  heroListHover: -1,     // 画灵列表悬停索引
  gachaPool: 'normal',   // 当前抽卡池: 'normal' | 'limited'
  gachaPity: { normal: 0, limited: 0 },  // 保底计数器
  gachaResultItems: [],  // 抽卡结果物品列表
  shopHover: -1,         // 商店悬停商品索引
  idleRewardShown: false, // 是否已展示挂机收益弹窗
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
  // ---- 3人队切换系统 ----
  party: [],               // [{heroIndex, hp, maxHp, rage, alive}, ...] 最多3个
  activeSlot: 0,           // 当前操控画灵在party中的索引
  switchCd: 0,             // 切换冷却（秒）
  switchInvincible: 0,     // 切换后无敌帧（秒）
  switchAnim: 0,           // 切换动画播放（秒，>0表示正在播放）
  switchAnimType: '',      // 'in' | 'out' — 水墨消散/凝聚
  prevSlot: -1,            // 上一个操控的画灵slot（QTE用）
  // ---- QTE联携系统 ----
  qteWindow: 0,            // QTE窗口剩余时间（秒，>0可点击）
  qteCombo: 0,             // 连续合笔成功次数
  qteBtnVisible: false,    // 合笔按钮是否可见
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
  // Canvas CSS尺寸是缩放后的，需要反算回390×844逻辑坐标
  const scaleX = W / rect.width;
  const scaleY = H / rect.height;
  return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
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

  // 画灵属性 + 共鸣加成 — 初始化3人队
  const bonus = resonance.getBonus();
  // 从screenState.selectedHeroes构建party（至少1人，最多3人）
  const heroIndices = screenState.selectedHeroes.length > 0
    ? screenState.selectedHeroes
    : [0]; // 兜底：至少青岚
  state.party = heroIndices.map(hi => {
    const h = HEROES[hi];
    const hp = Math.floor(100 * h.hpMult + bonus.hp);
    return { heroIndex: hi, hp: hp, maxHp: hp, rage: 0, alive: true };
  });
  state.activeSlot = 0;
  state.switchCd = 0;
  state.switchInvincible = 0;
  state.switchAnim = 0;
  state.switchAnimType = '';
  state.prevSlot = -1;
  state.qteWindow = 0;
  state.qteCombo = 0;
  state.qteBtnVisible = false;
  const hero = getActiveHero();
  const baseHp = state.party[0].maxHp;
  const baseAtk = Math.floor(BULLET_DAMAGE * hero.atkMult + bonus.atk);
  const baseSpd = Math.floor(PLAYER_SPEED * hero.spdMult + bonus.spd);
  const baseCrit = Math.floor(15 * hero.critMult + bonus.crit);
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
      screenState.current = 'lobby';
      screenState.lobbyTab = 0;
      playSound('hit');
      return;
    }
    return; // 标题画面不处理其他输入
  }

  if (screenState.current === 'select') {
    // 返回按钮 → 回大厅
    if (pos.x < 80 && pos.y < 50) {
      screenState.current = 'lobby';
      screenState.lobbyTab = 0;
      playSound('hit');
      return;
    }
    // 底部Tab检测
    const tabIdx = hitBottomTab(pos.x, pos.y);
    if (tabIdx >= 0) {
      screenState.lobbyTab = tabIdx;
      screenState.current = LOBBY_TABS[tabIdx].target;
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
          screenState.selectedHeroes = []; // 每次进入重新选人
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
    // 返回按钮 → 回关卡选择
    if (pos.x < 80 && pos.y < 50) {
      screenState.current = 'select';
      playSound('hit');
      return;
    }
    // 出发按钮
    if (screenState.selectedHeroes.length >= 1) {
      const btnW = 160, btnH = 44;
      const btnX = W/2 - btnW/2, btnY = H - 110;
      if (pos.x >= btnX && pos.x <= btnX + btnW && pos.y >= btnY && pos.y <= btnY + btnH) {
        // 补齐3人：未选位置补0号(青岚)
        while (screenState.selectedHeroes.length < 3) {
          if (!screenState.selectedHeroes.includes(0)) screenState.selectedHeroes.push(0);
          else if (!screenState.selectedHeroes.includes(1)) screenState.selectedHeroes.push(1);
          else if (!screenState.selectedHeroes.includes(2)) screenState.selectedHeroes.push(2);
          else break;
        }
        startLevel(screenState.selectedLevel);
        screenState.current = 'battle';
        playSound('crit');
        return;
      }
    }
    // 画灵卡片点击 — 多选切换
    const hCardW = W - 60, hCardH = 195;
    const hCardX = 30, hGapY = 8;
    const hStartY = 130;
    for (let i = 0; i < HEROES.length; i++) {
      const cy = hStartY + i * (hCardH + hGapY);
      if (pos.x >= hCardX && pos.x <= hCardX + hCardW && pos.y >= cy && pos.y <= cy + hCardH) {
        const idx = screenState.selectedHeroes.indexOf(i);
        if (idx >= 0) {
          // 取消选择
          screenState.selectedHeroes.splice(idx, 1);
          playSound('hit');
        } else if (screenState.selectedHeroes.length < 3) {
          // 选择
          screenState.selectedHeroes.push(i);
          playSound('crit');
        } else {
          // 已满3人，提示
          playSound('hit');
        }
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
      screenState.selectedHeroes = [];
      screenState.current = 'heroSelect';
      playSound('crit');
      return;
    }
    // 返回选择按钮 → 回大厅
    if (pos.x >= W/2 + 10 && pos.x <= W/2 + 130 && pos.y >= btnY - 20 && pos.y <= btnY + 20) {
      screenState.current = 'lobby';
      screenState.lobbyTab = 0;
      playSound('hit');
      return;
    }
    return;
  }

  // ---- 大厅交互 ----
  if (screenState.current === 'lobby') {
    const barH = 36;
    // 设置齿轮
    if (pos.x >= W - 44 && pos.x <= W && pos.y >= barH + 4 && pos.y <= barH + 24) {
      screenState.current = 'settings';
      playSound('hit');
      return;
    }
    // 一键领取挂机收益
    const idleReward = resources.calcIdleReward();
    if (idleReward.moJing > 0 || idleReward.lingMo > 0) {
      const progressY = barH + 10;
      const avatarR = 50;
      const avatarCY = progressY + (H - barH - 52 - 10) * 0.1 + avatarR + 10;
      const idleY = avatarCY + avatarR + 58 + 8 + 32 + 32;
      const btnW = 80, btnH = 24;
      const btnX = W / 2 - btnW / 2;
      const btnY = idleY + 44;
      if (pos.x >= btnX && pos.x <= btnX + btnW && pos.y >= btnY && pos.y <= btnY + btnH) {
        const claimed = resources.claimIdleReward();
        if (claimed) {
          playSound('crit');
        }
        return;
      }
    }
    // 快捷入口3按钮
    const progressY2 = barH + 10;
    const avatarR2 = 50;
    const avatarCY2 = progressY2 + (H - barH - 52 - 10) * 0.1 + avatarR2 + 10;
    const idleY2 = avatarCY2 + avatarR2 + 58 + 8 + 32;
    const cardH2 = 70;
    const shortcutY = idleY2 + cardH2 + 16;
    const scGap = 10;
    const scW = (W - 60 - scGap * 2) / 3;
    for (let i = 0; i < 3; i++) {
      const sx = 30 + i * (scW + scGap);
      if (pos.x >= sx && pos.x <= sx + scW && pos.y >= shortcutY && pos.y <= shortcutY + 56) {
        if (i === 0) { screenState.current = 'heroSelect'; screenState.lobbyTab = 0; }
        else if (i === 1) { screenState.current = 'heroList'; screenState.lobbyTab = 1; }
        else if (i === 2) { screenState.current = 'gacha'; screenState.lobbyTab = 2; }
        playSound('hit');
        return;
      }
    }
    // 底部Tab
    const tabIdx = hitBottomTab(pos.x, pos.y);
    if (tabIdx >= 0) {
      screenState.lobbyTab = tabIdx;
      screenState.current = LOBBY_TABS[tabIdx].target;
      playSound('hit');
      return;
    }
    return;
  }

  // ---- 画灵列表交互 ----
  if (screenState.current === 'heroList') {
    const barH = 36;
    const cardTopY = barH + 60;
    const cardH = 130;
    const cardGap = 12;
    const cardX = 20;
    const cardW = W - 40;
    for (let i = 0; i < HEROES.length; i++) {
      const cy = cardTopY + i * (cardH + cardGap);
      if (pos.x >= cardX && pos.x <= cardX + cardW && pos.y >= cy && pos.y <= cy + cardH) {
        screenState.heroDetailIdx = i;
        screenState.current = 'heroDetail';
        playSound('crit');
        return;
      }
    }
    // 底部Tab
    const tabIdx = hitBottomTab(pos.x, pos.y);
    if (tabIdx >= 0) {
      screenState.lobbyTab = tabIdx;
      screenState.current = LOBBY_TABS[tabIdx].target;
      playSound('hit');
      return;
    }
    return;
  }

  // ---- 画灵详情交互 ----
  if (screenState.current === 'heroDetail') {
    const barH = 36;
    // 返回按钮
    if (pos.x < 80 && pos.y >= barH + 4 && pos.y <= barH + 26) {
      screenState.current = 'heroList';
      playSound('hit');
      return;
    }
    // 升级按钮
    const upgCost = { moJing: 50 * resonance.level, lingMo: 20 * resonance.level };
    const avatarR = 38;
    const avCY = barH + 60;
    const expY = avCY + avatarR + 54;
    const attrY = expY + 46;
    const skillY = attrY + 82;
    const equipY = skillY + 78;
    const upgY = equipY + 82;
    const btnH = 36;
    const btnX = 40, btnW = W - 80;
    if (pos.x >= btnX && pos.x <= btnX + btnW && pos.y >= upgY && pos.y <= upgY + btnH) {
      if (resources.spend(upgCost)) {
        resonance.addExp(resonance.expToNext(resonance.level));
        playSound('crit');
      } else {
        playSound('hit');
      }
      return;
    }
    // 底部Tab
    const tabIdx = hitBottomTab(pos.x, pos.y);
    if (tabIdx >= 0) {
      screenState.lobbyTab = tabIdx;
      screenState.current = LOBBY_TABS[tabIdx].target;
      playSound('hit');
      return;
    }
    return;
  }

  // ---- 抽卡交互 ----
  if (screenState.current === 'gacha') {
    // 池子选择
    const poolY = 100;
    const poolW = (W - 60) / 2;
    for (let i = 0; i < 2; i++) {
      const px = 20 + i * (poolW + 20);
      if (pos.x >= px && pos.x <= px + poolW && pos.y >= poolY && pos.y <= poolY + 40) {
        screenState.gachaPool = i === 0 ? 'normal' : 'limited';
        playSound('hit');
        return;
      }
    }
    // 保底信息位置
    const scrollY = 160, scrollH = 280;
    const pityY = scrollY + scrollH + 20;
    const btnY = pityY + 28;
    const btnW1 = 140, btnH1 = 42;
    const btnX1 = W / 2 - btnW1 - 10;
    const btnX2 = W / 2 + 10;

    // 单抽
    if (pos.x >= btnX1 && pos.x <= btnX1 + btnW1 && pos.y >= btnY && pos.y <= btnY + btnH1) {
      if (resources.gachaTicket >= 1) {
        resources.gachaTicket -= 1;
        screenState.gachaPity[screenState.gachaPool] = (screenState.gachaPity[screenState.gachaPool] || 0) + 1;
        screenState.gachaResultItems = [generateGachaItem(screenState.gachaPity[screenState.gachaPool])];
        screenState.current = 'gachaResult';
        resources.save();
        playSound('crit');
      }
      return;
    }
    // 十连
    if (pos.x >= btnX2 && pos.x <= btnX2 + btnW1 && pos.y >= btnY && pos.y <= btnY + btnH1) {
      if (resources.gachaTicket >= 10) {
        resources.gachaTicket -= 10;
        const items = [];
        for (let j = 0; j < 10; j++) {
          screenState.gachaPity[screenState.gachaPool] = (screenState.gachaPity[screenState.gachaPool] || 0) + 1;
          items.push(generateGachaItem(screenState.gachaPity[screenState.gachaPool]));
        }
        screenState.gachaResultItems = items;
        screenState.current = 'gachaResult';
        resources.save();
        playSound('crit');
      }
      return;
    }
    // 底部Tab
    const tabIdx = hitBottomTab(pos.x, pos.y);
    if (tabIdx >= 0) {
      screenState.lobbyTab = tabIdx;
      screenState.current = LOBBY_TABS[tabIdx].target;
      playSound('hit');
      return;
    }
    return;
  }

  // ---- 抽卡结果交互 ----
  if (screenState.current === 'gachaResult') {
    // 确认按钮
    if (pos.x >= W / 2 - 50 && pos.x <= W / 2 + 50 && pos.y >= H - 100 && pos.y <= H - 64) {
      screenState.current = 'gacha';
      playSound('hit');
      return;
    }
    return;
  }

  // ---- 商店交互 ----
  if (screenState.current === 'shop') {
    const barH = 36;
    const listY = barH + 60;
    const cardH = 60;
    const cardX = 20;
    const cardW = W - 40;
    SHOP_ITEMS.forEach((item, i) => {
      const cy = listY + i * (cardH + 8);
      if (pos.x >= cardX && pos.x <= cardX + cardW && pos.y >= cy && pos.y <= cy + cardH) {
        const buyW = 52, buyH = 28;
        const buyX = cardX + cardW - buyW - 12;
        const buyY = cy + (cardH - buyH) / 2;
        // 购买按钮
        if (pos.x >= buyX && pos.x <= buyX + buyW && pos.y >= buyY && pos.y <= buyY + buyH) {
          if (item.stock > 0 && resources.spend(item.cost)) {
            // 发放商品
            if (item.id === 'gacha1') resources.gachaTicket += 1;
            else if (item.id === 'gacha10') resources.gachaTicket += 10;
            else if (item.id === 'lingMo50') resources.lingMo += 50;
            else if (item.id === 'lingMo200') resources.lingMo += 200;
            if (item.daily) item.stock--;
            resources.save();
            playSound('crit');
          } else {
            playSound('hit');
          }
        }
      }
    });
    // 底部Tab
    const tabIdx = hitBottomTab(pos.x, pos.y);
    if (tabIdx >= 0) {
      screenState.lobbyTab = tabIdx;
      screenState.current = LOBBY_TABS[tabIdx].target;
      playSound('hit');
      return;
    }
    return;
  }

  // ---- 设置交互 ----
  if (screenState.current === 'settings') {
    // 返回按钮
    if (pos.x < 80 && pos.y >= 24 && pos.y <= 48) {
      screenState.current = 'lobby';
      playSound('hit');
      return;
    }
    // 音量滑块
    const sliderX = 24, sliderW = W - 48, sliderY = 92;
    if (pos.y >= sliderY - 12 && pos.y <= sliderY + 18 && pos.x >= sliderX && pos.x <= sliderX + sliderW) {
      gameSettings.volume = Math.max(0, Math.min(1, (pos.x - sliderX) / sliderW));
      gameSettings.save();
      return;
    }
    // 操作模式
    const modeY = 130;
    for (let i = 0; i < 2; i++) {
      const mx = 24 + i * (W / 2 - 12);
      const my = modeY + 22;
      if (pos.x >= mx && pos.x <= mx + W / 2 - 36 && pos.y >= my && pos.y <= my + 32) {
        gameSettings.manualTarget = (i === 1);
        gameSettings.save();
        playSound('hit');
        return;
      }
    }
    // 重置存档
    const resetY = 210;
    if (pos.x >= 24 && pos.x <= W - 24 && pos.y >= resetY && pos.y <= resetY + 36) {
      gameSave.reset();
      resonance.level = 1; resonance.exp = 0; resonance.save();
      resources.moYu = 100; resources.moJing = 500; resources.lingMo = 200; resources.gachaTicket = 10; resources.save();
      screenState.current = 'title';
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

  // QTE合笔按钮检测（最高优先级，限时操作）
  if (state.qteBtnVisible && state.qteWindow > 0) {
    const qteX = W / 2, qteY = H * 0.45, qteR = 35;
    if (dist(pos.x, pos.y, qteX, qteY) < qteR) {
      qteSuccess();
      return;
    }
  }

  // 画灵头像点击切换
  if (state.party.length > 1) {
    const avatarSize = 22;
    const avatarGap = 10;
    const avatarBaseX = W - 20 - avatarSize;
    const avatarBaseY = H / 2 - (state.party.length * (avatarSize * 2 + avatarGap)) / 2;
    for (let i = 0; i < state.party.length; i++) {
      const ay = avatarBaseY + i * (avatarSize * 2 + avatarGap);
      if (dist(pos.x, pos.y, avatarBaseX, ay) < avatarSize + 5) {
        if (i !== state.activeSlot && state.party[i].alive) {
          switchHero(i);
        }
        return;
      }
    }
  }

  // 暂停中 — 检测"返回选卷"按钮
  if (state.paused) {
    // 返回选卷按钮 — 屏幕中下方
    if (Math.abs(pos.x - W/2) < 60 && Math.abs(pos.y - (H/2 + 40)) < 20) {
      state.paused = false;
      screenState.current = 'lobby';
      screenState.lobbyTab = 0;
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
    const hCardW = W - 60, hCardH = 195;
    const hCardX = 30, hGapY = 8;
    const hStartY = 130;
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

  // ---- 画灵列表hover ----
  if (screenState.current === 'heroList') {
    const barH = 36;
    const cardTopY = barH + 60;
    const cardH = 130;
    const cardGap = 12;
    const cardX = 20;
    const cardW = W - 40;
    screenState.heroListHover = -1;
    for (let i = 0; i < HEROES.length; i++) {
      const cy = cardTopY + i * (cardH + cardGap);
      if (pos.x >= cardX && pos.x <= cardX + cardW && pos.y >= cy && pos.y <= cy + cardH) {
        screenState.heroListHover = i;
        break;
      }
    }
    return;
  }

  // ---- 商店hover ----
  if (screenState.current === 'shop') {
    const barH = 36;
    const listY = barH + 60;
    const cardH = 60;
    const cardX = 20;
    const cardW = W - 40;
    screenState.shopHover = -1;
    SHOP_ITEMS.forEach((item, i) => {
      const cy = listY + i * (cardH + 8);
      if (pos.x >= cardX && pos.x <= cardX + cardW && pos.y >= cy && pos.y <= cy + cardH) {
        screenState.shopHover = i;
      }
    });
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
function getHeroFireRate() { return FIRE_RATE / (getActiveHero().fireRateMult || 1); }
function getHeroBulletSize() { return getActiveHero().id === 'mohen' ? 8 : (5); } // 墨痕大弹

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

// ==================== 3人队切换系统 ====================
const SWITCH_CD = 3;          // 切换冷却（秒）
const SWITCH_INVINCIBLE = 0.3;// 切换无敌帧（秒）
const SWITCH_ANIM_DUR = 0.25; // 切换动画时长（秒）
const QTE_WINDOW = 0.8;       // QTE合笔窗口（秒）
const SWITCH_AOE_RADIUS = 60; // 入场冲击AOE半径
const SWITCH_AOE_MULT = 1.0;  // 入场冲击伤害倍率

// 切换画灵
function switchHero(slotIndex) {
  if (slotIndex === state.activeSlot) return false;
  if (slotIndex < 0 || slotIndex >= state.party.length) return false;
  if (state.switchCd > 0) return false;
  const targetSlot = state.party[slotIndex];
  if (!targetSlot || !targetSlot.alive) return false;

  // 保存当前画灵状态
  const curSlot = state.party[state.activeSlot];
  curSlot.hp = state.player.hp;
  curSlot.rage = state.rage.meter;

  // 记录上一个slot（QTE用）
  state.prevSlot = state.activeSlot;

  // 切换
  state.activeSlot = slotIndex;
  const hero = HEROES[targetSlot.heroIndex];
  const bonus = resonance.getBonus();

  // 加载目标画灵状态
  state.player.hp = targetSlot.hp;
  state.player.maxHp = targetSlot.maxHp;
  state.rage.meter = targetSlot.rage;

  // 更新heroStats
  state.heroStats = {
    maxHp: targetSlot.maxHp,
    atk: Math.floor(BULLET_DAMAGE * hero.atkMult + bonus.atk),
    spd: Math.floor(PLAYER_SPEED * hero.spdMult + bonus.spd),
    crit: Math.floor(15 * hero.critMult + bonus.crit),
  };

  // 切换效果
  state.switchCd = SWITCH_CD;
  state.switchInvincible = SWITCH_INVINCIBLE;
  state.switchAnim = SWITCH_ANIM_DUR;
  state.switchAnimType = 'in';

  // 入场冲击AOE
  const p = state.player;
  for (const e of state.enemies) {
    if (!e.alive) continue;
    const d = dist(p.x, p.y, e.x, e.y);
    if (d < SWITCH_AOE_RADIUS) {
      const aoeDmg = Math.floor(getHeroAtk() * SWITCH_AOE_MULT);
      e.hp -= aoeDmg;
      e.hurtTimer = 0.1;
      spawnDamageNumber(e.x, e.y - 10, aoeDmg, false, hero.color);
    }
  }
  // 入场冲击粒子
  for (let i = 0; i < 10; i++) {
    const a = Math.random() * Math.PI * 2;
    state.particles.push({
      x: p.x, y: p.y,
      vx: Math.cos(a) * (80 + Math.random() * 80),
      vy: Math.sin(a) * (80 + Math.random() * 80),
      size: 3 + Math.random() * 4,
      color: hero.color,
      life: 0.3 + Math.random() * 0.2,
      maxLife: 0.5, alpha: 0.9,
    });
  }

  // QTE窗口
  state.qteWindow = QTE_WINDOW;
  state.qteBtnVisible = true;

  // 水墨消散+凝聚视觉反馈
  showActionText(`·${hero.name}·`, p.x, p.y - 50);
  playSound('crit');
  state.shake.intensity = 1.0;

  return true;
}

// QTE合笔成功
function qteSuccess() {
  if (!state.qteBtnVisible) return;
  state.qteCombo++;
  const p = state.player;
  const atk = getHeroAtk();

  if (state.qteCombo >= 2) {
    // ---- 3人合笔：五色晕染全屏 ----
    const dmg = Math.floor(atk * 2.5);
    // 全屏AOE
    for (const e of state.enemies) {
      if (!e.alive) continue;
      e.hp -= dmg;
      e.hurtTimer = 0.15;
      spawnDamageNumber(e.x, e.y - 10, dmg, true, C.RED);
    }
    // 全屏涂色
    for (let i = 0; i < 5; i++) {
      paintInk(p.x + (Math.random() - 0.5) * 200, p.y + (Math.random() - 0.5) * 200, COLORS[i], 25);
    }
    state.paintCover = Math.min(1, state.paintCover + 0.08);
    showActionText('·三灵合笔·五色晕染·', p.x, p.y - 80);
    // 全屏粒子
    for (let i = 0; i < 30; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 150 + Math.random() * 250;
      state.particles.push({
        x: p.x, y: p.y,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        size: 4 + Math.random() * 8,
        color: COLORS[i % 5],
        life: 0.4 + Math.random() * 0.5, maxLife: 0.9, alpha: 1,
      });
    }
    state.shake.intensity = 4;
    state.hitStop = 20;
    rageWashStart();
    state.qteCombo = 0; // 重置
  } else {
    // ---- 2人合笔：两色墨流交汇 ----
    const dmg = Math.floor(atk * 1.5);
    const hero1 = getActiveHero();
    const prevSlot = state.party[state.prevSlot];
    const hero2 = prevSlot ? HEROES[prevSlot.heroIndex] : hero1;
    // 中等AOE
    for (const e of state.enemies) {
      if (!e.alive) continue;
      const d = dist(p.x, p.y, e.x, e.y);
      if (d < 120) {
        e.hp -= dmg;
        e.hurtTimer = 0.12;
        spawnDamageNumber(e.x, e.y - 10, dmg, true, hero1.color);
      }
    }
    // 两色墨流粒子
    for (let i = 0; i < 16; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 100 + Math.random() * 150;
      state.particles.push({
        x: p.x, y: p.y,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        size: 3 + Math.random() * 5,
        color: i % 2 === 0 ? hero1.color : hero2.color,
        life: 0.3 + Math.random() * 0.3, maxLife: 0.6, alpha: 0.9,
      });
    }
    paintInk(p.x, p.y, hero1.color, 15);
    paintInk(p.x, p.y, hero2.color, 15);
    state.paintCover = Math.min(1, state.paintCover + 0.03);
    showActionText('·合笔·', p.x, p.y - 70);
    state.shake.intensity = 2;
    state.hitStop = 10;
  }

  state.qteBtnVisible = false;
  state.qteWindow = 0;
  playSound('rage');
}

// 画灵死亡处理
function handleHeroDeath() {
  const slot = state.party[state.activeSlot];
  if (!slot) return;
  slot.alive = false;
  slot.hp = 0;
  state.player.hp = 0;

  // 自动切换到下一个存活的画灵
  let switched = false;
  for (let i = 0; i < state.party.length; i++) {
    if (i !== state.activeSlot && state.party[i].alive) {
      // 先恢复state.player.hp让switchHero正常工作
      state.switchCd = 0; // 死亡切换无视CD
      switchHero(i);
      switched = true;
      break;
    }
  }

  if (!switched) {
    // 3人全灭
    state.gameOver = true;
    state.player.hp = 0;
  }
}

// 退场画灵被动效果
let offFieldTimer = 0;
function applyOffFieldPassives(dt) {
  if (state.party.length <= 1) return; // 只有1人无退场效果
  offFieldTimer += dt;
  if (offFieldTimer < 5.0) return; // 每5秒触发一次
  offFieldTimer = 0;

  const p = state.player;
  for (let i = 0; i < state.party.length; i++) {
    if (i === state.activeSlot) continue; // 在场的不算
    const slot = state.party[i];
    if (!slot.alive) continue;
    const hero = HEROES[slot.heroIndex];

    if (hero.passive === 'inkHeal') {
      // 青岚墨愈：退场全队每5秒+3HP
      for (const s of state.party) {
        if (s.alive) {
          s.hp = Math.min(s.maxHp, s.hp + 3);
        }
      }
      // 给当前操控画灵回血
      if (state.party[state.activeSlot].alive) {
        state.player.hp = Math.min(state.player.maxHp, state.party[state.activeSlot].hp + 3);
        spawnDamageNumber(p.x, p.y - 20, '+3', false, '#2d8a4e');
      }
    }
    // 丹霞丹心和墨痕墨守是常驻属性加成，在getHeroStats中处理
  }
}

// 获取含退场被动的属性
function getHeroStatsWithPassives() {
  const hero = getActiveHero();
  const bonus = resonance.getBonus();
  let atkMult = hero.atkMult;
  let critMult = hero.critMult;
  let defMult = 1.0; // 伤害减免

  for (let i = 0; i < state.party.length; i++) {
    if (i === state.activeSlot) continue;
    const slot = state.party[i];
    if (!slot.alive) continue;
    const h = HEROES[slot.heroIndex];
    if (h.passive === 'critSplash') {
      critMult += 0.05; // 丹霞丹心：全队暴击+5%
    }
    if (h.passive === 'bigBullet') {
      defMult -= 0.1; // 墨痕墨守：全队防御+10%（受伤-10%）
    }
  }

  return {
    maxHp: state.party[state.activeSlot].maxHp,
    atk: Math.floor(BULLET_DAMAGE * atkMult + bonus.atk),
    spd: Math.floor(PLAYER_SPEED * hero.spdMult + bonus.spd),
    crit: Math.floor(15 * critMult + bonus.crit),
    defMult: Math.max(0.5, defMult), // 最低50%受伤
  };
}

// ==================== 踩圈切色系统（墨池） ====================
const COLOR_CIRCLE_RADIUS = 35;       // 墨池半径
const COLOR_CIRCLE_LIFETIME = 8;      // 墨池存在时间（秒）
const COLOR_CIRCLE_FORM_TIME = 0.5;   // 出现动画时长（秒）
const COLOR_CIRCLE_DRY_TIME = 1.0;    // 干涸动画时长（秒）
const COLOR_CIRCLE_SPAWN_INTERVAL = 6; // 每6秒生成新墨池
const COLOR_CIRCLE_MAX = 3;           // 地面最多同时3个墨池

function spawnColorCircle() {
  const p = state.player;
  // 在玩家周围300-500px随机位置生成
  const angle = Math.random() * Math.PI * 2;
  const radius = 300 + Math.random() * 200;
  const cx = clamp(p.x + Math.cos(angle) * radius, 60, WORLD_W - 60);
  const cy = clamp(p.y + Math.sin(angle) * radius, 60, WORLD_H - 60);

  // 排除当前弹丸颜色——保证有换的必要
  let colorIdx;
  const availableIdxs = [];
  for (let ci = 0; ci < COLORS.length; ci++) {
    if (ci !== state.bulletColorIndex) availableIdxs.push(ci);
  }
  colorIdx = availableIdxs[Math.floor(Math.random() * availableIdxs.length)];

  state.colorCircles.push({
    x: cx,
    y: cy,
    colorIdx: colorIdx,
    color: COLORS[colorIdx],
    life: COLOR_CIRCLE_LIFETIME,
    maxLife: COLOR_CIRCLE_LIFETIME,
    pulsePhase: Math.random() * Math.PI * 2,
    phase: 'forming',       // forming → active → drying → dead
    formTimer: 0,           // forming动画计时
    dryTimer: 0,            // drying动画计时
  });

  // 超过上限则移除最老的
  if (state.colorCircles.length > COLOR_CIRCLE_MAX) {
    state.colorCircles.shift();
  }
}

function updateColorCircles(dt) {
  const p = state.player;

  // 仅第2波起生成墨池
  const canSpawn = state.wave.current >= 1; // wave从0开始，1=第2波
  // 生成计时
  if (canSpawn) {
    state.colorCircleTimer += dt;
    if (state.colorCircleTimer >= (LEVEL_CONFIG[state.level].colorCircleRate || COLOR_CIRCLE_SPAWN_INTERVAL) && state.colorCircles.length < COLOR_CIRCLE_MAX) {
      state.colorCircleTimer = 0;
      spawnColorCircle();
    }
  }

  // 更新 + 踩踏检测
  for (let i = state.colorCircles.length - 1; i >= 0; i--) {
    const cc = state.colorCircles[i];

    // 状态机更新
    if (cc.phase === 'forming') {
      cc.formTimer += dt;
      if (cc.formTimer >= COLOR_CIRCLE_FORM_TIME) {
        cc.phase = 'active';
      }
    } else if (cc.phase === 'active') {
      cc.life -= dt;
      // 进入干涸阶段
      if (cc.life <= COLOR_CIRCLE_DRY_TIME) {
        cc.phase = 'drying';
        cc.dryTimer = 0;
      }
    } else if (cc.phase === 'drying') {
      cc.life -= dt;
      cc.dryTimer += dt;
      if (cc.life <= 0) {
        cc.phase = 'dead';
      }
    }

    // 死亡移除
    if (cc.phase === 'dead') {
      state.colorCircles.splice(i, 1);
      continue;
    }

    // 仅active/drying状态可踩踏
    if (cc.phase === 'forming') continue;

    // 玩家踩上检测
    const d = dist(p.x, p.y, cc.x, cc.y);
    if (d < COLOR_CIRCLE_RADIUS + PLAYER_SIZE) {
      // 切换当前攻击颜色
      state.bulletColorIndex = cc.colorIdx;

      // 踩踏反馈特效——墨池溅起水花
      for (let j = 0; j < 10; j++) {
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

    let alpha = 0.35 * pulse;
    let r = COLOR_CIRCLE_RADIUS;

    // 状态机视觉
    if (cc.phase === 'forming') {
      // 出现动画：从0渐显+扩大
      const formPct = cc.formTimer / COLOR_CIRCLE_FORM_TIME;
      alpha *= formPct;
      r *= 0.5 + formPct * 0.5;
    } else if (cc.phase === 'active') {
      // 正常显示，即将干涸时闪烁
      if (lifeRatio < 0.25) {
        alpha *= (0.3 + 0.7 * Math.abs(Math.sin(now * 0.01)));
      }
    } else if (cc.phase === 'drying') {
      // 干涸渐隐+缩小+波纹
      const dryPct = cc.dryTimer / COLOR_CIRCLE_DRY_TIME;
      alpha *= (1 - dryPct);
      r *= (1 - dryPct * 0.3);
    }

    // 外圈光晕
    ctx.globalAlpha = alpha * 0.4;
    ctx.fillStyle = cc.color;
    ctx.beginPath();
    ctx.arc(cc.x, cc.y, r + 8, 0, Math.PI * 2);
    ctx.fill();

    // 波纹（active/drying状态）
    if (cc.phase !== 'forming') {
      const wavePhase = (now * 0.002 + cc.pulsePhase) % 1;
      ctx.globalAlpha = alpha * 0.2 * (1 - wavePhase);
      ctx.strokeStyle = cc.color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cc.x, cc.y, r + wavePhase * 20, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 主圈
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = cc.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cc.x, cc.y, r, 0, Math.PI * 2);
    ctx.stroke();

    // 内填充
    ctx.globalAlpha = alpha * 0.15;
    ctx.fillStyle = cc.color;
    ctx.beginPath();
    ctx.arc(cc.x, cc.y, r, 0, Math.PI * 2);
    ctx.fill();

    // 中心色点
    ctx.globalAlpha = alpha * 1.5;
    ctx.fillStyle = cc.color;
    ctx.beginPath();
    ctx.arc(cc.x, cc.y, 6, 0, Math.PI * 2);
    ctx.fill();

    // 颜色名标签
    if (cc.phase === 'active' && lifeRatio > 0.3) {
      ctx.globalAlpha = alpha * 2;
      ctx.font = '10px "STKaiti","KaiTi","Microsoft YaHei",serif';
      ctx.fillStyle = cc.color;
      ctx.textAlign = 'center';
      ctx.fillText(COLOR_NAMES[cc.colorIdx], cc.x, cc.y - r - 6);
    }
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
    const sx = Math.round(dot.x - cam.x);
    const sy = Math.round(dot.y - cam.y);
    if (sx < -10 || sx > W + 10 || sy < -10 || sy > H + 10) continue;
    ctx.fillStyle = `rgba(200,200,200,${dot.a})`;
    ctx.fillRect(sx, sy, dot.w, dot.h);
  }

  // 纸张横线 — 古风信笺感（亚像素对齐防闪烁）
  const lineSpacing = 60;
  const lineOffY = -(cam.y % lineSpacing);
  ctx.strokeStyle = bg.lineColor;
  ctx.lineWidth = 1;
  for (let ly = lineOffY; ly < H; ly += lineSpacing) {
    // 0.5对齐：1px线条在整数+0.5坐标渲染最锐利，杜绝亚像素闪烁
    const snapY = Math.floor(ly) + 0.5;
    ctx.beginPath();
    ctx.moveTo(0, snapY);
    ctx.lineTo(W, snapY);
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
        // 用索引代替random，杜绝每帧闪烁
        const lean = (i % 2 === 0) ? 3 : -3;
        ctx.beginPath();
        ctx.moveTo(bx, 0 + byShift % 40);
        ctx.lineTo(bx + lean, H + byShift % 40);
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
  // 切换无敌 — 水墨消散效果
  if (state.switchInvincible > 0) {
    ctx.globalAlpha = 0.4 + Math.sin(Date.now() * 0.025) * 0.3;
    // 消散粒子
    if (Math.random() < 0.3) {
      state.particles.push({
        x: p.x + (Math.random() - 0.5) * 30,
        y: p.y + (Math.random() - 0.5) * 30,
        vx: (Math.random() - 0.5) * 60,
        vy: (Math.random() - 0.5) * 60 - 20,
        size: 2 + Math.random() * 4,
        color: getActiveHero().color,
        life: 0.2 + Math.random() * 0.2,
        maxLife: 0.4, alpha: 0.6,
      });
    }
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
  const bodyColor = isRage ? C.RED : (getActiveHero().bodyColor || C.INK_BLACK);
  ctx.fillStyle = hurtFlash ? '#ffffff' : bodyColor;
  ctx.globalAlpha = hurtFlash ? 0.9 : 0.9;
  ctx.beginPath();
  ctx.arc(p.x, p.y, PLAYER_SIZE, 0, Math.PI * 2);
  ctx.fill();

  // 外圈
  ctx.globalAlpha = isRage ? 0.3 : 0.15;
  ctx.fillStyle = isRage ? C.RED : (getActiveHero().color || C.INK_BLACK);
  ctx.beginPath();
  ctx.arc(p.x, p.y, PLAYER_SIZE + 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // 腰带
  ctx.strokeStyle = getActiveHero().color || C.RED;
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
  ctx.fillStyle = getActiveHero().color || C.INK_LIGHT;
  ctx.globalAlpha = 0.5;
  ctx.fillText(`${getActiveHero().name} · 共鸣Lv.${resonance.level}`, W/2, H - 18);
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

  // ---- 右侧画灵头像 ----
  if (state.party.length > 0) {
    const avatarSize = 22;
    const avatarGap = 10;
    const avatarBaseX = W - 20 - avatarSize;
    const avatarBaseY = H / 2 - (state.party.length * (avatarSize * 2 + avatarGap)) / 2;

    for (let i = 0; i < state.party.length; i++) {
      const slot = state.party[i];
      const hero = HEROES[slot.heroIndex];
      const ax = avatarBaseX;
      const ay = avatarBaseY + i * (avatarSize * 2 + avatarGap);
      const isActive = i === state.activeSlot;

      // 背景
      ctx.fillStyle = isActive ? 'rgba(245,240,232,0.9)' : 'rgba(245,240,232,0.5)';
      ctx.beginPath();
      ctx.arc(ax, ay, avatarSize, 0, Math.PI * 2);
      ctx.fill();

      if (!slot.alive) {
        // 已阵亡 — 暗红裂痕
        ctx.fillStyle = 'rgba(80,30,30,0.7)';
        ctx.beginPath();
        ctx.arc(ax, ay, avatarSize, 0, Math.PI * 2);
        ctx.fill();
        // 裂痕
        ctx.strokeStyle = '#c43a31';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(ax - 6, ay - 6); ctx.lineTo(ax + 6, ay + 6);
        ctx.moveTo(ax + 6, ay - 6); ctx.lineTo(ax - 6, ay + 6);
        ctx.stroke();
      } else {
        // 头像颜色
        ctx.fillStyle = hero.color;
        ctx.globalAlpha = isActive ? 0.9 : 0.5;
        ctx.beginPath();
        ctx.arc(ax, ay, avatarSize - 3, 0, Math.PI * 2);
        ctx.fill();
        // 名字首字
        ctx.font = 'bold 11px "STKaiti","KaiTi","Microsoft YaHei",serif';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.globalAlpha = isActive ? 1 : 0.6;
        ctx.fillText(hero.name.charAt(0), ax, ay + 4);
      }

      // 当前操控 — 亮色边框+呼吸动画
      if (isActive && slot.alive) {
        const breathe = 0.6 + Math.sin(Date.now() * 0.006) * 0.3;
        ctx.strokeStyle = hero.color;
        ctx.lineWidth = 2;
        ctx.globalAlpha = breathe;
        ctx.beginPath();
        ctx.arc(ax, ay, avatarSize + 1, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.globalAlpha = 1;

      // 小HP条
      if (slot.alive) {
        const hpBarW = avatarSize * 2;
        const hpBarH = 3;
        const hpBarX = ax - avatarSize;
        const hpBarY = ay + avatarSize + 3;
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.fillRect(hpBarX, hpBarY, hpBarW, hpBarH);
        const hpPct = Math.max(slot.hp / slot.maxHp, 0);
        ctx.fillStyle = hpPct > 0.5 ? '#2d8a4e' : (hpPct > 0.25 ? '#c4a835' : '#c43a31');
        ctx.globalAlpha = 0.7;
        ctx.fillRect(hpBarX, hpBarY, hpBarW * hpPct, hpBarH);
        ctx.globalAlpha = 1;
      }

      // 切换CD遮罩
      if (isActive && state.switchCd > 0) {
        const cdPct = state.switchCd / SWITCH_CD;
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.arc(ax, ay, avatarSize, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * cdPct);
        ctx.closePath();
        ctx.fill();
        // CD倒计时
        ctx.font = '9px "STKaiti","KaiTi","Microsoft YaHei",serif';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.fillText(Math.ceil(state.switchCd), ax, ay + 3);
      }
    }
  }

  // ---- QTE合笔按钮 ----
  if (state.qteBtnVisible && state.qteWindow > 0) {
    const qteX = W / 2;
    const qteY = H * 0.45;
    const qteR = 30;
    // 水墨圆章
    const pulse = 0.7 + Math.sin(Date.now() * 0.015) * 0.3;
    ctx.fillStyle = `rgba(196,58,49,${pulse * 0.3})`;
    ctx.beginPath();
    ctx.arc(qteX, qteY, qteR + 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(196,58,49,${pulse})`;
    ctx.beginPath();
    ctx.arc(qteX, qteY, qteR, 0, Math.PI * 2);
    ctx.fill();
    // 文字
    ctx.font = 'bold 16px "STKaiti","KaiTi","Microsoft YaHei",serif';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText('合笔', qteX, qteY + 5);
    // 倒计时弧线
    const qtePct = state.qteWindow / QTE_WINDOW;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.arc(qteX, qteY, qteR + 4, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * qtePct);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

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
    ctx.fillStyle = getActiveHero().color;
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

// ==================== 大厅/主界面 ====================
// 底部Tab定义
const LOBBY_TABS = [
  { id: 0, label: '探卷', icon: 'scroll', target: 'select' },
  { id: 1, label: '画灵', icon: 'hero', target: 'heroList' },
  { id: 2, label: '墨宝阁', icon: 'gacha', target: 'gacha' },
  { id: 3, label: '文房四宝', icon: 'shop', target: 'shop' },
];

// 绘制顶部资源条（大厅和子界面共用）
function drawResourceBar() {
  const barH = 36;
  // 背景
  ctx.fillStyle = 'rgba(40,35,30,0.85)';
  ctx.fillRect(0, 0, W, barH);
  // 底线
  ctx.strokeStyle = 'rgba(180,160,130,0.3)';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(0, barH);
  ctx.lineTo(W, barH);
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const y = barH / 2;
  const items = [
    { label: '墨玉', value: resources.moYu, color: '#88b4e8' },
    { label: '墨晶', value: resources.moJing, color: '#c4a882' },
    { label: '灵墨', value: resources.lingMo, color: '#8bc48b' },
    { label: '墨韵券', value: resources.gachaTicket, color: '#d4a0d4' },
  ];
  const gap = W / items.length;
  items.forEach((it, i) => {
    const x = gap * i + gap / 2;
    ctx.font = '500 10px sans-serif';
    ctx.fillStyle = it.color;
    ctx.fillText(it.label, x - 14, y);
    ctx.font = '500 12px sans-serif';
    ctx.fillStyle = '#f0e8d8';
    ctx.fillText(it.value, x + 16, y);
  });

  // 共鸣等级（右上角）
  ctx.font = '500 10px sans-serif';
  ctx.fillStyle = '#e8d080';
  ctx.textAlign = 'right';
  ctx.fillText(`共鸣Lv.${resonance.level}`, W - 8, y);
  ctx.textAlign = 'center';

  return barH;
}

// 绘制底部Tab导航（大厅和子界面共用）
function drawBottomTabs() {
  const tabH = 52;
  const tabY = H - tabH;
  // 背景
  ctx.fillStyle = 'rgba(40,35,30,0.9)';
  ctx.fillRect(0, tabY, W, tabH);
  // 顶线
  ctx.strokeStyle = 'rgba(180,160,130,0.3)';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(0, tabY);
  ctx.lineTo(W, tabY);
  ctx.stroke();

  const tabW = W / LOBBY_TABS.length;
  LOBBY_TABS.forEach((tab, i) => {
    const x = tabW * i;
    const cx = x + tabW / 2;
    const cy = tabY + tabH / 2;
    const active = screenState.lobbyTab === i;

    // 高亮背景
    if (active) {
      ctx.fillStyle = 'rgba(180,160,130,0.15)';
      ctx.fillRect(x, tabY, tabW, tabH);
      // 顶线高亮
      ctx.strokeStyle = '#c4a060';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + 8, tabY);
      ctx.lineTo(x + tabW - 8, tabY);
      ctx.stroke();
    }

    // 图标（简化为文字符号）
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${active ? '500' : '400'} 18px sans-serif`;
    const icons = ['📜', '👤', '🎲', '🏪'];
    ctx.fillStyle = active ? '#e8d080' : '#887860';
    ctx.fillText(icons[i], cx, cy - 6);

    // 标签文字
    ctx.font = `${active ? '500' : '400'} 10px sans-serif`;
    ctx.fillStyle = active ? '#f0e8d8' : '#887860';
    ctx.fillText(tab.label, cx, cy + 14);
  });

  return tabH;
}

// 检测底部Tab点击
function hitBottomTab(px, py) {
  const tabH = 52;
  const tabY = H - tabH;
  if (py < tabY || py > H) return -1;
  const tabW = W / LOBBY_TABS.length;
  const idx = Math.floor(px / tabW);
  if (idx >= 0 && idx < LOBBY_TABS.length) return idx;
  return -1;
}

function drawLobby() {
  const ss = screenState;

  // 背景 — 水墨古卷风
  const grd = ctx.createLinearGradient(0, 0, 0, H);
  grd.addColorStop(0, '#f5f0e8');
  grd.addColorStop(0.5, '#ede5d5');
  grd.addColorStop(1, '#e0d8c8');
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, W, H);

  // 纸张纹理点缀
  ctx.fillStyle = 'rgba(160,150,130,0.04)';
  for (let i = 0; i < 60; i++) {
    const dx = ((i * 73 + 17) % W);
    const dy = ((i * 97 + 41) % H);
    const r = 1 + (i % 3);
    ctx.beginPath();
    ctx.arc(dx, dy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // 顶部资源条
  const barH = drawResourceBar();

  // 中央展示区 — 当前画灵立绘 + 画卷修复进度
  const centerY = barH + 10;
  const centerH = H - barH - 52 - 10; // 减去顶部和底部Tab

  // 画灵展示区域
  const hero = HEROES[0]; // 默认展示青岚
  const displayY = centerY + centerH * 0.1;

  // 画灵圆形头像（大）
  const avatarR = 50;
  const avatarCX = W / 2;
  const avatarCY = displayY + avatarR + 10;
  // 色环
  ctx.strokeStyle = hero.color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(avatarCX, avatarCY, avatarR + 4, 0, Math.PI * 2);
  ctx.stroke();
  // 头像背景
  ctx.fillStyle = hero.color + '30';
  ctx.beginPath();
  ctx.arc(avatarCX, avatarCY, avatarR, 0, Math.PI * 2);
  ctx.fill();
  // 头像文字
  ctx.font = '500 28px sans-serif';
  ctx.fillStyle = hero.color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(hero.name.charAt(0), avatarCX, avatarCY);

  // 画灵名字+称号
  ctx.font = '500 16px sans-serif';
  ctx.fillStyle = '#3a3020';
  ctx.fillText(hero.name, avatarCX, avatarCY + avatarR + 20);
  ctx.font = '400 11px sans-serif';
  ctx.fillStyle = '#8a7a60';
  ctx.fillText(hero.title, avatarCX, avatarCY + avatarR + 38);

  // 画卷修复进度条
  const progressY = avatarCY + avatarR + 58;
  const progressW = W - 80;
  const progressH = 8;
  const progressX = 40;
  // 修复进度 = 基于总星数
  const maxStars = 9;
  const progress = gameSave.totalStars / maxStars;
  // 背景条
  ctx.fillStyle = 'rgba(100,90,70,0.15)';
  roundRect(ctx, progressX, progressY, progressW, progressH, 4);
  ctx.fill();
  // 进度条
  if (progress > 0) {
    const fillW = Math.max(8, progressW * Math.min(1, progress));
    const pgrd = ctx.createLinearGradient(progressX, 0, progressX + fillW, 0);
    pgrd.addColorStop(0, '#7ab87a');
    pgrd.addColorStop(1, '#4a8a4a');
    ctx.fillStyle = pgrd;
    roundRect(ctx, progressX, progressY, fillW, progressH, 4);
    ctx.fill();
  }
  ctx.font = '400 10px sans-serif';
  ctx.fillStyle = '#8a7a60';
  ctx.textAlign = 'center';
  ctx.fillText(`画卷修复 ${Math.floor(progress * 100)}%`, W / 2, progressY + progressH + 14);

  // 挂机收益区域
  const idleY = progressY + progressH + 32;
  const idleReward = resources.calcIdleReward();
  const hasIdleReward = idleReward.moJing > 0 || idleReward.lingMo > 0;

  // 收益卡片背景
  const cardX = 30, cardW = W - 60, cardH = 70;
  ctx.fillStyle = 'rgba(60,50,40,0.06)';
  roundRect(ctx, cardX, idleY, cardW, cardH, 10);
  ctx.fill();
  ctx.strokeStyle = 'rgba(160,140,110,0.2)';
  ctx.lineWidth = 0.5;
  roundRect(ctx, cardX, idleY, cardW, cardH, 10);
  ctx.stroke();

  if (hasIdleReward) {
    // 有可领取收益
    ctx.font = '500 12px sans-serif';
    ctx.fillStyle = '#5a4a30';
    ctx.textAlign = 'center';
    ctx.fillText('离线收益', W / 2, idleY + 18);
    ctx.font = '400 11px sans-serif';
    ctx.fillStyle = '#c4a882';
    ctx.fillText(`墨晶 +${idleReward.moJing}  灵墨 +${idleReward.lingMo}`, W / 2, idleY + 36);

    // 领取按钮
    const btnW = 80, btnH = 24;
    const btnX = W / 2 - btnW / 2;
    const btnY = idleY + 44;
    const pulse = 0.8 + Math.sin(Date.now() * 0.004) * 0.2;
    ctx.fillStyle = `rgba(120,160,80,${pulse})`;
    roundRect(ctx, btnX, btnY, btnW, btnH, 6);
    ctx.fill();
    ctx.font = '500 11px sans-serif';
    ctx.fillStyle = '#fff';
    ctx.fillText('一键领取', W / 2, btnY + btnH / 2);
  } else {
    // 无收益
    ctx.font = '400 11px sans-serif';
    ctx.fillStyle = '#a09080';
    ctx.textAlign = 'center';
    ctx.fillText('离线收益', W / 2, idleY + 22);
    ctx.font = '400 10px sans-serif';
    ctx.fillStyle = '#c0b8a8';
    ctx.fillText('收益将在离线后累积', W / 2, idleY + 42);
  }

  // 快捷入口 — 3个小按钮（最近使用的功能）
  const shortcutY = idleY + cardH + 16;
  const shortcuts = [
    { label: '编队', sub: '选择画灵', icon: '⚔️' },
    { label: '养成', sub: '升级画灵', icon: '📖' },
    { label: '抽卡', sub: '墨宝阁', icon: '🎲' },
  ];
  const scGap = 10;
  const scW = (W - 60 - scGap * 2) / 3;
  shortcuts.forEach((sc, i) => {
    const sx = 30 + i * (scW + scGap);
    ctx.fillStyle = 'rgba(60,50,40,0.05)';
    roundRect(ctx, sx, shortcutY, scW, 56, 8);
    ctx.fill();
    ctx.strokeStyle = 'rgba(160,140,110,0.15)';
    ctx.lineWidth = 0.5;
    roundRect(ctx, sx, shortcutY, scW, 56, 8);
    ctx.stroke();
    ctx.font = '16px sans-serif';
    ctx.fillStyle = '#6a5a40';
    ctx.textAlign = 'center';
    ctx.fillText(sc.icon, sx + scW / 2, shortcutY + 20);
    ctx.font = '500 11px sans-serif';
    ctx.fillStyle = '#5a4a30';
    ctx.fillText(sc.label, sx + scW / 2, shortcutY + 38);
    ctx.font = '400 9px sans-serif';
    ctx.fillStyle = '#a09080';
    ctx.fillText(sc.sub, sx + scW / 2, shortcutY + 50);
  });

  // 右上角设置齿轮
  const gearX = W - 30, gearY = barH + 14;
  ctx.font = '16px sans-serif';
  ctx.fillStyle = '#a09080';
  ctx.textAlign = 'center';
  ctx.fillText('⚙', gearX, gearY);

  // 底部Tab导航
  drawBottomTabs();
}

// ==================== 画灵列表 ====================
function drawHeroList() {
  const ss = screenState;

  // 背景
  ctx.fillStyle = '#f5f0e8';
  ctx.fillRect(0, 0, W, H);

  // 顶部资源条
  const barH = drawResourceBar();

  // 标题
  ctx.font = '500 16px sans-serif';
  ctx.fillStyle = '#3a3020';
  ctx.textAlign = 'center';
  ctx.fillText('画灵录', W / 2, barH + 24);

  // 共鸣等级提示
  ctx.font = '400 11px sans-serif';
  ctx.fillStyle = '#8a7a60';
  ctx.fillText(`共鸣等级 Lv.${resonance.level} — 全画灵共享成长`, W / 2, barH + 44);

  // 画灵卡片
  const cardTopY = barH + 60;
  const cardH = 130;
  const cardGap = 12;
  const cardX = 20;
  const cardW = W - 40;

  HEROES.forEach((hero, i) => {
    const cy = cardTopY + i * (cardH + cardGap);
    const hover = ss.heroListHover === i;

    // 卡片背景
    ctx.fillStyle = hover ? 'rgba(60,50,40,0.08)' : 'rgba(60,50,40,0.04)';
    roundRect(ctx, cardX, cy, cardW, cardH, 12);
    ctx.fill();
    ctx.strokeStyle = hover ? hero.color : 'rgba(160,140,110,0.2)';
    ctx.lineWidth = hover ? 1.5 : 0.5;
    roundRect(ctx, cardX, cy, cardW, cardH, 12);
    ctx.stroke();

    // 色环头像
    const avR = 28;
    const avCX = cardX + 44;
    const avCY = cy + cardH / 2;
    ctx.strokeStyle = hero.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(avCX, avCY, avR + 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = hero.color + '20';
    ctx.beginPath();
    ctx.arc(avCX, avCY, avR, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = '500 18px sans-serif';
    ctx.fillStyle = hero.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(hero.name.charAt(0), avCX, avCY);

    // 文字信息
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    const tx = avCX + avR + 16;
    // 名字+称号
    ctx.font = '500 14px sans-serif';
    ctx.fillStyle = '#3a3020';
    ctx.fillText(`${hero.name} · ${hero.title}`, tx, cy + 14);
    // 描述
    ctx.font = '400 10px sans-serif';
    ctx.fillStyle = '#8a7a60';
    ctx.fillText(hero.desc, tx, cy + 34);
    // 属性概要
    const stats = getHeroStatsWithPassives(i);
    ctx.font = '400 10px sans-serif';
    ctx.fillStyle = '#6a5a40';
    ctx.fillText(`HP:${stats.hp}  ATK:${stats.atk}  SPD:${stats.spd}  CRIT:${stats.crit}%`, tx, cy + 52);
    // 技能
    ctx.font = '400 10px sans-serif';
    ctx.fillStyle = hero.passiveColor;
    ctx.fillText(`被动: ${hero.passiveDesc}`, tx, cy + 70);
    ctx.fillStyle = '#8a7a60';
    ctx.fillText(`爆发: ${hero.rageSkillDesc}`, tx, cy + 86);

    // 右箭头
    ctx.font = '400 14px sans-serif';
    ctx.fillStyle = hover ? '#5a4a30' : '#c0b8a8';
    ctx.textAlign = 'right';
    ctx.fillText('›', cardX + cardW - 14, cy + cardH / 2 - 6);
    ctx.textAlign = 'left';
  });

  // 底部Tab
  drawBottomTabs();
}

// ==================== 画灵详情/养成 ====================
function drawHeroDetail() {
  const ss = screenState;
  const hero = HEROES[ss.heroDetailIdx] || HEROES[0];
  const stats = getHeroStatsWithPassives(ss.heroDetailIdx);

  // 背景
  ctx.fillStyle = '#f5f0e8';
  ctx.fillRect(0, 0, W, H);

  // 顶部资源条
  const barH = drawResourceBar();

  // 返回按钮
  ctx.font = '500 13px sans-serif';
  ctx.fillStyle = '#8a7a60';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('← 返回', 12, barH + 10);

  // 画灵头像+色环
  const avR = 38;
  const avCX = W / 2;
  const avCY = barH + 60;
  ctx.strokeStyle = hero.color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(avCX, avCY, avR + 3, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = hero.color + '25';
  ctx.beginPath();
  ctx.arc(avCX, avCY, avR, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = '500 24px sans-serif';
  ctx.fillStyle = hero.color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(hero.name.charAt(0), avCX, avCY);

  // 名字+称号
  ctx.font = '500 16px sans-serif';
  ctx.fillStyle = '#3a3020';
  ctx.textBaseline = 'top';
  ctx.fillText(hero.name, W / 2, avCY + avR + 14);
  ctx.font = '400 11px sans-serif';
  ctx.fillStyle = '#8a7a60';
  ctx.fillText(hero.title, W / 2, avCY + avR + 34);

  // 共鸣等级+经验条
  const expY = avCY + avR + 54;
  ctx.font = '500 11px sans-serif';
  ctx.fillStyle = '#5a4a30';
  ctx.fillText(`共鸣 Lv.${resonance.level}`, W / 2, expY);
  // 经验条
  const expBarX = 50, expBarW = W - 100, expBarH = 6;
  const expRatio = resonance.exp / resonance.expToNext(resonance.level);
  ctx.fillStyle = 'rgba(100,90,70,0.12)';
  roundRect(ctx, expBarX, expY + 16, expBarW, expBarH, 3);
  ctx.fill();
  if (expRatio > 0) {
    ctx.fillStyle = '#c4a060';
    roundRect(ctx, expBarX, expY + 16, Math.max(6, expBarW * expRatio), expBarH, 3);
    ctx.fill();
  }
  ctx.font = '400 9px sans-serif';
  ctx.fillStyle = '#a09080';
  ctx.fillText(`${resonance.exp}/${resonance.expToNext(resonance.level)}`, W / 2, expY + 30);

  // 属性面板
  const attrY = expY + 46;
  ctx.fillStyle = 'rgba(60,50,40,0.04)';
  roundRect(ctx, 20, attrY, W - 40, 72, 8);
  ctx.fill();
  ctx.font = '500 11px sans-serif';
  ctx.fillStyle = '#5a4a30';
  ctx.textAlign = 'left';
  ctx.fillText('属性面板', 32, attrY + 14);

  const attrItems = [
    { label: '生命', value: stats.hp, color: '#c45a5a' },
    { label: '攻击', value: stats.atk, color: '#c4a040' },
    { label: '速度', value: stats.spd, color: '#4a8ac4' },
    { label: '暴击', value: stats.crit + '%', color: '#c48040' },
    { label: '防御', value: stats.def || 0, color: '#6aaa6a' },
  ];
  attrItems.forEach((a, i) => {
    const ax = 32 + (i % 3) * 112;
    const ay = attrY + 32 + Math.floor(i / 3) * 20;
    ctx.font = '400 10px sans-serif';
    ctx.fillStyle = '#8a7a60';
    ctx.fillText(a.label, ax, ay);
    ctx.font = '500 11px sans-serif';
    ctx.fillStyle = a.color;
    ctx.fillText('' + a.value, ax + 32, ay);
  });

  // 技能区域
  const skillY = attrY + 82;
  ctx.fillStyle = 'rgba(60,50,40,0.04)';
  roundRect(ctx, 20, skillY, W - 40, 68, 8);
  ctx.fill();
  ctx.font = '500 11px sans-serif';
  ctx.fillStyle = '#5a4a30';
  ctx.textAlign = 'left';
  ctx.fillText('技能', 32, skillY + 14);
  // 被动
  ctx.font = '400 10px sans-serif';
  ctx.fillStyle = hero.passiveColor;
  ctx.fillText('被动: ' + hero.passiveDesc, 32, skillY + 32);
  // 爆发
  ctx.fillStyle = '#8a7a60';
  ctx.fillText('爆发: ' + hero.rageSkillDesc, 32, skillY + 50);

  // 装备槽位
  const equipY = skillY + 78;
  ctx.fillStyle = 'rgba(60,50,40,0.04)';
  roundRect(ctx, 20, equipY, W - 40, 72, 8);
  ctx.fill();
  ctx.font = '500 11px sans-serif';
  ctx.fillStyle = '#5a4a30';
  ctx.textAlign = 'left';
  ctx.fillText('装备', 32, equipY + 14);
  // 3个装备槽
  const slots = ['墨笔', '宣纸', '印章'];
  const slotColors = ['#c4a040', '#6aaa6a', '#c48040'];
  slots.forEach((s, i) => {
    const sx = 32 + i * 112;
    const sy = equipY + 30;
    ctx.strokeStyle = slotColors[i] + '60';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    roundRect(ctx, sx, sy, 96, 32, 6);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.font = '400 10px sans-serif';
    ctx.fillStyle = '#b0a890';
    ctx.textAlign = 'center';
    ctx.fillText(`${s}（空）`, sx + 48, sy + 18);
  });
  ctx.textAlign = 'left';

  // 升级按钮
  const upgY = equipY + 82;
  const upgCost = { moJing: 50 * resonance.level, lingMo: 20 * resonance.level };
  const canUpg = resources.canAfford(upgCost);
  const btnW = W - 80, btnH = 36;
  const btnX = 40;
  ctx.fillStyle = canUpg ? 'rgba(120,160,80,0.8)' : 'rgba(140,130,110,0.4)';
  roundRect(ctx, btnX, upgY, btnW, btnH, 8);
  ctx.fill();
  ctx.font = '500 13px sans-serif';
  ctx.fillStyle = canUpg ? '#fff' : '#a0a0a0';
  ctx.textAlign = 'center';
  ctx.fillText(`共鸣升级 (墨晶×${upgCost.moJing} 灵墨×${upgCost.lingMo})`, W / 2, upgY + btnH / 2);

  // 底部Tab
  drawBottomTabs();
}

// ==================== 抽卡界面 ====================
function drawGacha() {
  const ss = screenState;

  // 背景
  const grd = ctx.createLinearGradient(0, 0, 0, H);
  grd.addColorStop(0, '#2a2040');
  grd.addColorStop(1, '#1a1428');
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, W, H);

  // 星光点缀
  ctx.fillStyle = 'rgba(200,180,255,0.15)';
  for (let i = 0; i < 40; i++) {
    const sx = ((i * 83 + 23) % W);
    const sy = ((i * 67 + 11) % (H - 100)) + 40;
    const sr = 0.5 + (i % 3) * 0.5;
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
    ctx.fill();
  }

  // 顶部资源条（深色版）
  drawResourceBar();

  // 标题
  ctx.font = '500 18px sans-serif';
  ctx.fillStyle = '#e0d0f0';
  ctx.textAlign = 'center';
  ctx.fillText('墨宝阁', W / 2, 56);
  ctx.font = '400 11px sans-serif';
  ctx.fillStyle = '#a090c0';
  ctx.fillText('以墨为媒，唤灵入卷', W / 2, 76);

  // 两个池子选择
  const poolY = 100;
  const poolW = (W - 60) / 2;
  const poolH = 40;
  ['normal', 'limited'].forEach((pool, i) => {
    const px = 20 + i * (poolW + 20);
    const active = ss.gachaPool === pool;
    ctx.fillStyle = active ? 'rgba(180,140,255,0.2)' : 'rgba(100,80,140,0.1)';
    roundRect(ctx, px, poolY, poolW, poolH, 8);
    ctx.fill();
    ctx.strokeStyle = active ? '#b48cff' : 'rgba(140,120,180,0.3)';
    ctx.lineWidth = active ? 1.5 : 0.5;
    roundRect(ctx, px, poolY, poolW, poolH, 8);
    ctx.stroke();
    ctx.font = `${active ? '500' : '400'} 12px sans-serif`;
    ctx.fillStyle = active ? '#e0d0f0' : '#9080a0';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(pool === 'normal' ? '常驻墨韵' : '限定墨韵', px + poolW / 2, poolY + poolH / 2);
  });
  ctx.textBaseline = 'top';

  // 中央画卷展示
  const scrollY = 160;
  const scrollH = 280;
  const scrollW = 200;
  const scrollX = (W - scrollW) / 2;
  // 画卷边框
  ctx.strokeStyle = 'rgba(180,140,255,0.3)';
  ctx.lineWidth = 1;
  roundRect(ctx, scrollX, scrollY, scrollW, scrollH, 12);
  ctx.stroke();
  ctx.fillStyle = 'rgba(60,40,80,0.3)';
  roundRect(ctx, scrollX, scrollY, scrollW, scrollH, 12);
  ctx.fill();
  // 中央文字
  ctx.font = '400 14px sans-serif';
  ctx.fillStyle = '#a090c0';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('墨韵涌动', W / 2, scrollY + scrollH / 2 - 10);
  ctx.font = '400 11px sans-serif';
  ctx.fillStyle = '#8070a0';
  ctx.fillText('点击下方按钮召唤画灵', W / 2, scrollY + scrollH / 2 + 12);

  // 保底信息
  const pityY = scrollY + scrollH + 20;
  const pity = ss.gachaPity[ss.gachaPool] || 0;
  ctx.font = '400 11px sans-serif';
  ctx.fillStyle = '#b48cff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(`已抽 ${pity} 次 | 保底 ${40 - pity % 40} 次内`, W / 2, pityY);

  // 抽卡按钮
  const btnY = pityY + 28;
  const btnW1 = 140, btnH1 = 42;
  const btnX1 = W / 2 - btnW1 - 10;
  const btnX2 = W / 2 + 10;

  // 单抽
  const canSingle = resources.gachaTicket >= 1;
  ctx.fillStyle = canSingle ? 'rgba(180,140,255,0.6)' : 'rgba(100,80,140,0.3)';
  roundRect(ctx, btnX1, btnY, btnW1, btnH1, 8);
  ctx.fill();
  ctx.font = '500 13px sans-serif';
  ctx.fillStyle = canSingle ? '#fff' : '#808080';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('单抽', btnX1 + btnW1 / 2, btnY + 14);
  ctx.font = '400 10px sans-serif';
  ctx.fillStyle = canSingle ? '#e0d0f0' : '#606060';
  ctx.fillText('墨韵券×1', btnX1 + btnW1 / 2, btnY + 30);

  // 十连
  const canTen = resources.gachaTicket >= 10;
  ctx.fillStyle = canTen ? 'rgba(255,180,80,0.6)' : 'rgba(140,100,40,0.3)';
  roundRect(ctx, btnX2, btnY, btnW1, btnH1, 8);
  ctx.fill();
  ctx.font = '500 13px sans-serif';
  ctx.fillStyle = canTen ? '#fff' : '#808080';
  ctx.fillText('十连', btnX2 + btnW1 / 2, btnY + 14);
  ctx.font = '400 10px sans-serif';
  ctx.fillStyle = canTen ? '#ffe0a0' : '#606060';
  ctx.fillText('墨韵券×10', btnX2 + btnW1 / 2, btnY + 30);
  ctx.textBaseline = 'top';

  // 底部Tab
  drawBottomTabs();
}

// 抽卡结果
function drawGachaResult() {
  const ss = screenState;
  const items = ss.gachaResultItems || [];

  // 深色背景
  ctx.fillStyle = 'rgba(20,15,30,0.95)';
  ctx.fillRect(0, 0, W, H);

  ctx.font = '500 16px sans-serif';
  ctx.fillStyle = '#e0d0f0';
  ctx.textAlign = 'center';
  ctx.fillText('墨韵显现', W / 2, 60);

  // 结果物品
  items.forEach((item, i) => {
    const cols = items.length <= 3 ? items.length : Math.min(5, items.length);
    const row = Math.floor(i / 5);
    const col = i % 5;
    const totalInRow = row === Math.floor((items.length - 1) / 5) ? ((items.length - 1) % 5) + 1 : Math.min(5, items.length);
    const cellW = 60;
    const startX = W / 2 - (Math.min(totalInRow, 5) * (cellW + 8)) / 2;
    const cx = startX + col * (cellW + 8) + cellW / 2;
    const cy = 120 + row * 90;

    // 品质颜色
    const qColors = { white: '#d0d0d0', green: '#6aaa6a', blue: '#4a8ac4', purple: '#9a5ac4', gold: '#c4a040' };
    const qColor = qColors[item.quality] || '#d0d0d0';

    // 卡片
    ctx.fillStyle = qColor + '20';
    roundRect(ctx, cx - 26, cy - 26, 52, 52, 8);
    ctx.fill();
    ctx.strokeStyle = qColor + '80';
    ctx.lineWidth = 1;
    roundRect(ctx, cx - 26, cy - 26, 52, 52, 8);
    ctx.stroke();

    // 物品图标
    ctx.font = '400 18px sans-serif';
    ctx.fillStyle = qColor;
    ctx.textBaseline = 'middle';
    ctx.fillText(item.icon || '?', cx, cy - 2);

    // 名字
    ctx.font = '400 9px sans-serif';
    ctx.fillStyle = qColor;
    ctx.textBaseline = 'top';
    ctx.fillText(item.name, cx, cy + 30);
  });

  // 确认按钮
  ctx.fillStyle = 'rgba(180,140,255,0.5)';
  roundRect(ctx, W / 2 - 50, H - 100, 100, 36, 8);
  ctx.fill();
  ctx.font = '500 13px sans-serif';
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('确认', W / 2, H - 82);
}

// ==================== 商店界面 ====================
const SHOP_ITEMS = [
  { id: 'gacha1', name: '墨韵券×1', desc: '抽卡凭证', cost: { moYu: 10 }, icon: '🎲', stock: 10, daily: true },
  { id: 'gacha10', name: '墨韵券×10', desc: '十连凭证', cost: { moYu: 90 }, icon: '🎲', stock: 5, daily: true },
  { id: 'lingMo50', name: '灵墨×50', desc: '养成材料', cost: { moYu: 20 }, icon: '🟢', stock: 10, daily: true },
  { id: 'lingMo200', name: '灵墨×200', desc: '养成材料', cost: { moJing: 500 }, icon: '🟢', stock: 0, daily: false },
];

function drawShop() {
  const ss = screenState;

  // 背景
  ctx.fillStyle = '#f5f0e8';
  ctx.fillRect(0, 0, W, H);

  // 顶部资源条
  const barH = drawResourceBar();

  // 标题
  ctx.font = '500 16px sans-serif';
  ctx.fillStyle = '#3a3020';
  ctx.textAlign = 'center';
  ctx.fillText('文房四宝', W / 2, barH + 24);
  ctx.font = '400 11px sans-serif';
  ctx.fillStyle = '#8a7a60';
  ctx.fillText('以墨换宝，物尽其用', W / 2, barH + 44);

  // 商品列表
  const listY = barH + 60;
  const cardW = W - 40;
  const cardH = 60;
  const cardX = 20;

  SHOP_ITEMS.forEach((item, i) => {
    const cy = listY + i * (cardH + 8);
    const hover = ss.shopHover === i;
    const canBuy = resources.canAfford(item.cost) && item.stock > 0;

    // 卡片背景
    ctx.fillStyle = hover ? 'rgba(60,50,40,0.07)' : 'rgba(60,50,40,0.03)';
    roundRect(ctx, cardX, cy, cardW, cardH, 8);
    ctx.fill();
    ctx.strokeStyle = canBuy ? 'rgba(160,140,110,0.2)' : 'rgba(160,140,110,0.08)';
    ctx.lineWidth = 0.5;
    roundRect(ctx, cardX, cy, cardW, cardH, 8);
    ctx.stroke();

    // 图标
    ctx.font = '20px sans-serif';
    ctx.fillStyle = '#6a5a40';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(item.icon, cardX + 16, cy + cardH / 2);

    // 名称+描述
    ctx.font = '500 12px sans-serif';
    ctx.fillStyle = canBuy ? '#3a3020' : '#a0a0a0';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(item.name, cardX + 48, cy + 12);
    ctx.font = '400 10px sans-serif';
    ctx.fillStyle = '#8a7a60';
    ctx.fillText(item.desc, cardX + 48, cy + 30);

    // 价格+库存
    const costStr = Object.entries(item.cost).map(([k, v]) => {
      const labels = { moYu: '墨玉', moJing: '墨晶', lingMo: '灵墨' };
      return `${labels[k] || k}×${v}`;
    }).join(' ');
    ctx.font = '400 10px sans-serif';
    ctx.fillStyle = canBuy ? '#c4a040' : '#a0a0a0';
    ctx.fillText(costStr, cardX + 48, cy + 44);

    // 购买按钮
    const buyW = 52, buyH = 28;
    const buyX = cardX + cardW - buyW - 12;
    const buyY = cy + (cardH - buyH) / 2;
    ctx.fillStyle = canBuy ? 'rgba(120,160,80,0.7)' : 'rgba(140,130,110,0.3)';
    roundRect(ctx, buyX, buyY, buyW, buyH, 6);
    ctx.fill();
    ctx.font = '500 11px sans-serif';
    ctx.fillStyle = canBuy ? '#fff' : '#a0a0a0';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(item.stock > 0 ? '购买' : '售罄', buyX + buyW / 2, buyY + buyH / 2);
  });

  // 底部Tab
  drawBottomTabs();
}

// ==================== 设置界面 ====================
function drawSettings() {
  // 背景
  ctx.fillStyle = '#f5f0e8';
  ctx.fillRect(0, 0, W, H);

  // 标题
  ctx.font = '500 16px sans-serif';
  ctx.fillStyle = '#3a3020';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('设置', W / 2, 30);

  // 返回按钮
  ctx.font = '500 13px sans-serif';
  ctx.fillStyle = '#8a7a60';
  ctx.textAlign = 'left';
  ctx.fillText('← 返回', 12, 30);

  const optY = 70;

  // 音量控制
  ctx.font = '500 12px sans-serif';
  ctx.fillStyle = '#3a3020';
  ctx.textAlign = 'left';
  ctx.fillText('音量', 24, optY);
  // 滑块背景
  const sliderX = 24, sliderW = W - 48, sliderH = 6;
  const sliderY = optY + 22;
  ctx.fillStyle = 'rgba(100,90,70,0.15)';
  roundRect(ctx, sliderX, sliderY, sliderW, sliderH, 3);
  ctx.fill();
  // 滑块位置
  const vol = gameSettings.volume;
  const thumbX = sliderX + sliderW * vol;
  ctx.fillStyle = '#c4a060';
  roundRect(ctx, sliderX, sliderY, Math.max(6, sliderW * vol), sliderH, 3);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(thumbX, sliderY + sliderH / 2, 8, 0, Math.PI * 2);
  ctx.fillStyle = '#e8d080';
  ctx.fill();
  ctx.font = '400 10px sans-serif';
  ctx.fillStyle = '#8a7a60';
  ctx.textAlign = 'right';
  ctx.fillText(`${Math.round(vol * 100)}%`, W - 24, optY);

  // 操作模式
  const modeY = optY + 60;
  ctx.font = '500 12px sans-serif';
  ctx.fillStyle = '#3a3020';
  ctx.textAlign = 'left';
  ctx.fillText('操作模式', 24, modeY);
  const modes = ['自动瞄准', '手动锁敌'];
  modes.forEach((m, i) => {
    const mx = 24 + i * (W / 2 - 12);
    const my = modeY + 22;
    const active = (i === 0 && !gameSettings.manualTarget) || (i === 1 && gameSettings.manualTarget);
    ctx.fillStyle = active ? 'rgba(120,160,80,0.2)' : 'rgba(60,50,40,0.05)';
    roundRect(ctx, mx, my, W / 2 - 36, 32, 6);
    ctx.fill();
    ctx.strokeStyle = active ? '#6aaa6a' : 'rgba(160,140,110,0.2)';
    ctx.lineWidth = active ? 1 : 0.5;
    roundRect(ctx, mx, my, W / 2 - 36, 32, 6);
    ctx.stroke();
    ctx.font = `${active ? '500' : '400'} 11px sans-serif`;
    ctx.fillStyle = active ? '#3a6b3a' : '#8a7a60';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(m, mx + (W / 2 - 36) / 2, my + 16);
  });

  // 重置存档
  const resetY = modeY + 80;
  ctx.fillStyle = 'rgba(200,80,60,0.1)';
  roundRect(ctx, 24, resetY, W - 48, 36, 8);
  ctx.fill();
  ctx.font = '500 12px sans-serif';
  ctx.fillStyle = '#c45a3a';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('重置存档', W / 2, resetY + 18);
}

// 设置数据
const SETTINGS_KEY = 'inkMaster_settings';
const gameSettings = {
  volume: 0.7,
  manualTarget: false,
  load() {
    try {
      const d = JSON.parse(localStorage.getItem(SETTINGS_KEY));
      if (d) { this.volume = d.volume ?? 0.7; this.manualTarget = d.manualTarget ?? false; }
    } catch(e) {}
  },
  save() {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify({ volume: this.volume, manualTarget: this.manualTarget })); } catch(e) {}
  },
};
gameSettings.load();

// 辅助：圆角矩形路径
function roundRect(c, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  c.beginPath();
  c.moveTo(x + r, y);
  c.lineTo(x + w - r, y);
  c.arcTo(x + w, y, x + w, y + r, r);
  c.lineTo(x + w, y + h - r);
  c.arcTo(x + w, y + h, x + w - r, y + h, r);
  c.lineTo(x + r, y + h);
  c.arcTo(x, y + h, x, y + h - r, r);
  c.lineTo(x, y + r);
  c.arcTo(x, y, x + r, y, r);
  c.closePath();
}

// 抽卡物品生成
function generateGachaItem(pityCount) {
  const pool = screenState.gachaPool;
  // 保底：40抽必出紫色
  const isPity = pityCount % 40 === 0;
  let quality, name, icon, type;

  if (isPity) {
    quality = 'purple';
    const rand = Math.random();
    if (rand < 0.4) { name = '青岚碎片'; icon = '🌿'; type = 'heroShard'; }
    else if (rand < 0.7) { name = '丹霞碎片'; icon = '🔥'; type = 'heroShard'; }
    else { name = '墨痕碎片'; icon = '🌑'; type = 'heroShard'; }
  } else {
    const rand = Math.random();
    if (rand < 0.45) { quality = 'white'; name = '灵墨×20'; icon = '🟢'; type = 'resource'; }
    else if (rand < 0.75) { quality = 'green'; name = '墨晶×100'; icon = '🟡'; type = 'resource'; }
    else if (rand < 0.92) { quality = 'blue'; name = '墨笔残卷'; icon = '🖌️'; type = 'equipShard'; }
    else { quality = 'purple'; name = '画灵之魂'; icon = '✨'; type = 'heroShard'; }
  }

  // 直接发放奖励
  if (type === 'resource') {
    if (name.includes('灵墨')) resources.lingMo += 20;
    else if (name.includes('墨晶')) resources.moJing += 100;
  } else if (type === 'equipShard') {
    resources.lingMo += 30;
  } else if (type === 'heroShard') {
    resources.lingMo += 50;
    resources.moJing += 50;
  }

  return { quality, name, icon, type };
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
  ctx.fillText(`★ ${gameSave.totalStars} / 9`, W/2, H - 80);

  // 底部Tab导航
  drawBottomTabs();
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

  // 队伍预览 — 顶部已选画灵缩略图
  const selHeros = ss.selectedHeroes;
  const previewY = 62;
  ctx.textAlign = 'center';
  ctx.font = '12px "STKaiti","KaiTi","Microsoft YaHei",serif';
  ctx.fillStyle = '#998866';
  ctx.fillText(`编队 (${selHeros.length}/3)`, W/2, previewY);
  // 3个位置圆圈
  for (let si = 0; si < 3; si++) {
    const px = W/2 - 50 + si * 50;
    const py = previewY + 22;
    if (si < selHeros.length) {
      const sh = HEROES[selHeros[si]];
      ctx.fillStyle = sh.color;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.arc(px, py, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.font = 'bold 11px "STKaiti","KaiTi","Microsoft YaHei",serif';
      ctx.fillStyle = '#fff';
      ctx.fillText(sh.name.charAt(0), px, py + 4);
    } else {
      ctx.strokeStyle = 'rgba(150,140,120,0.3)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.arc(px, py, 14, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.font = '9px "STKaiti","KaiTi","Microsoft YaHei",serif';
      ctx.fillStyle = '#ccc';
      ctx.fillText(si + 1, px, py + 3);
    }
  }

  // 共鸣等级
  ctx.textAlign = 'center';
  ctx.font = '12px "STKaiti","KaiTi","Microsoft YaHei",serif';
  ctx.fillStyle = '#998866';
  ctx.fillText(`共鸣 Lv.${resonance.level}  (${resonance.exp}/${resonance.expToNext(resonance.level)})`, W/2, previewY + 52);

  // 3个画灵卡片 — 高度容纳属性条+被动+爆发
  const hCardW = W - 60, hCardH = 195;
  const hCardX = 30, hGapY = 8;
  const hStartY = 130;

  for (let i = 0; i < HEROES.length; i++) {
    const hero = HEROES[i];
    const cy = hStartY + i * (hCardH + hGapY);
    const isHover = ss.heroHover === i;
    const isSelected = selHeros.includes(i);
    const selOrder = selHeros.indexOf(i) + 1; // 1/2/3

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

    // 边框 — 已选=主题色+序号，悬停=浅色，默认=淡灰
    if (isSelected) {
      ctx.strokeStyle = hero.color;
      ctx.lineWidth = 2.5;
      ctx.stroke();
      // 序号角标
      ctx.fillStyle = hero.color;
      ctx.beginPath();
      ctx.arc(hCardX + hCardW - 16, cy + 16, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = 'bold 12px "STKaiti","KaiTi","Microsoft YaHei",serif';
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText(selOrder, hCardX + hCardW - 16, cy + 20);
    } else if (isHover) {
      ctx.strokeStyle = hero.color;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else {
      ctx.strokeStyle = 'rgba(150,140,120,0.2)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

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

  // 底部 — 出发按钮 / 提示
  ctx.textAlign = 'center';
  if (selHeros.length >= 1) {
    // 出发按钮
    const btnW = 160, btnH = 44;
    const btnX = W/2 - btnW/2, btnY = H - 110;
    ctx.fillStyle = 'rgba(196,58,49,0.12)';
    ctx.beginPath();
    ctx.roundRect(btnX, btnY, btnW, btnH, 8);
    ctx.fill();
    ctx.strokeStyle = 'rgba(196,58,49,0.6)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.font = '20px "STKaiti","KaiTi","Microsoft YaHei",serif';
    ctx.fillStyle = '#c43a31';
    ctx.fillText(selHeros.length < 3 ? '·点将出征·' : '·三灵出征·', W/2, btnY + 28);
    ctx.font = '10px "STKaiti","KaiTi","Microsoft YaHei",serif';
    ctx.fillStyle = '#aa8866';
    ctx.fillText('可少选，未选位置自动补青岚', W/2, btnY + btnH + 14);
  } else {
    ctx.font = '12px "STKaiti","KaiTi","Microsoft YaHei",serif';
    ctx.fillStyle = '#bbb';
    ctx.fillText('点选画灵加入编队', W/2, H - 80);
  }

  // 底部Tab导航
  drawBottomTabs();
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

  // ---- 3人队切换系统更新 ----
  if (state.switchCd > 0) state.switchCd -= dt;
  if (state.switchInvincible > 0) state.switchInvincible -= dt;
  if (state.switchAnim > 0) state.switchAnim -= dt;
  // QTE窗口倒计时
  if (state.qteWindow > 0) {
    state.qteWindow -= dt;
    if (state.qteWindow <= 0) {
      state.qteWindow = 0;
      state.qteBtnVisible = false;
      state.qteCombo = 0; // 超时未点，连携中断
    }
  }
  // 玩家HP同步到party
  if (state.party.length > 0) {
    const curSlot = state.party[state.activeSlot];
    if (curSlot) curSlot.hp = state.player.hp;
  }
  // 被动效果：退场画灵
  applyOffFieldPassives(dt);

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
    // 3人队系统：画灵死亡→尝试切换，全灭才game over
    if (state.party.length > 1) {
      handleHeroDeath();
      if (!state.gameOver) {
        // 切换成功，继续战斗
        showActionText('·换灵·', p.x, p.y - 60);
      }
    }
    // 如果game over了或只有1个画灵
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
    if (getActiveHero().rageSkill === 'rageScatter') {
      // 丹霞·丹青万卷：8方向散射弹
      for (let d = 0; d < 8; d++) {
        const scatterAngle = d * Math.PI / 4 + Math.random() * 0.2;
        fireBullet(p.x, p.y,
          p.x + Math.cos(scatterAngle) * 200,
          p.y + Math.sin(scatterAngle) * 200, true, state.bulletColorIndex);
      }
      showActionText('·丹青万卷·', p.x, p.y - 80);
    } else if (getActiveHero().rageSkill === 'rageShadow') {
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
    } else if (getActiveHero().rageSkill === 'rageHeal') {
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
  if (state.rage.active && getActiveHero().rageSkill === 'rageHeal') {
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
        if (getActiveHero().passive === 'inkHeal' && !e.alive) {
          // 青岚·墨愈：击杀回复（在敌人死亡时触发，移到击杀逻辑）
        }
        if (getActiveHero().passive === 'critSplash' && isCrit) {
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
        if (getActiveHero().passive === 'bigBullet') {
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
          if (getActiveHero().passive === 'inkHeal') {
            const slot = state.party[state.activeSlot];
            slot.hp = Math.min(slot.maxHp, slot.hp + 3);
            state.player.hp = slot.hp;
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
            state.heroStats.atk = Math.floor(BULLET_DAMAGE * getActiveHero().atkMult + bonus.atk);
            state.heroStats.crit = Math.floor(15 * getActiveHero().critMult + bonus.crit);
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

    // 命中玩家（冲刺无敌/切换无敌期间免伤）
    if (dist(eb.x, eb.y, p.x, p.y) < PLAYER_SIZE + 6) {
      state.enemyBullets.splice(i, 1);
      if (state.dash.invincible > 0 || state.switchInvincible > 0) {
        // 无敌 — 弹开+特效
        spawnDirectionalSplash(eb.x, eb.y, 0, C.INK_WASH, 3);
        continue;
      }
      // 退场被动防御减伤
      const defMult = getHeroStatsWithPassives().defMult;
      const rawDmg = 8;
      p.hp -= Math.max(1, Math.floor(rawDmg * defMult));
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
    case 'lobby':
      drawLobby();
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
    case 'heroList':
      drawHeroList();
      break;
    case 'heroDetail':
      drawHeroDetail();
      break;
    case 'gacha':
      drawGacha();
      break;
    case 'gachaResult':
      drawGachaResult();
      break;
    case 'shop':
      drawShop();
      break;
    case 'settings':
      drawSettings();
      break;
  }

  requestAnimationFrame(gameLoop);
}

// ==================== 启动 ====================
console.log('水墨丹青 - 核心战斗原型已启动');
screenState.current = 'title';
screenState.titleFadeIn = 0;
requestAnimationFrame(gameLoop);

// ==================== 自适应缩放 ====================
// 窗口变化时重算Canvas CSS尺寸，container自动包裹
function resizeGame() {
  const { dw, dh } = calcDisplaySize();
  canvas.style.width = dw + 'px';
  canvas.style.height = dh + 'px';
  paintCanvasEl.style.width = dw + 'px';
  paintCanvasEl.style.height = dh + 'px';
}
window.addEventListener('resize', resizeGame);
