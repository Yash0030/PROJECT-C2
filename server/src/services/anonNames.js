const ADJECTIVES = [
  'Silent','Wandering','Hidden','Ancient','Gentle','Swift','Crimson','Golden','Silver','Misty',
  'Hollow','Distant','Fading','Rising','Lone','Calm','Wild','Bright','Dark','Pale',

  'Shimmering','Frozen','Burning','Whispering','Restless','Fierce','Brave','Clever','Nimble','Radiant',
  'Stormy','Velvet','Glowing','Dusky','Eternal','Sacred','Broken','Fearless','Curious','Playful',

  'Shadowy','Blazing','Crystal','Electric','Floating','Hidden','Lost','Majestic','Noble','Quiet',
  'Rugged','Serene','Soothing','Thunderous','Vivid','Witty','Zealous','Amber','Azure','Blissful',

  'Cloudy','Dreamy','Emerald','Flaming','Glacial','Heavenly','Icy','Jolly','Kind','Luminous',
  'Mystic','Neon','Obsidian','Primal','Quick','Royal','Solar','Tranquil','Urban','Vast',

  'Wavy','Young','Zesty','Arcane','Bold','Chill','Daring','Epic','Funky','Grand'
];

const NOUNS = [
  'Fox','Crane','Wolf','Hawk','Raven','Bear','Lynx','Deer','Owl','Heron',
  'Tiger','Falcon','Monk','Drifter','Nomad','Echo','Ember','Storm','River','Stone',

  'Shadow','Flame','Leaf','Mountain','Ocean','Breeze','Cloud','Star','Moon','Sun',
  'Comet','Galaxy','Forest','Meadow','Valley','Cliff','Desert','Rain','Thunder','Lightning',

  'Blossom','Petal','Root','Branch','Feather','Scale','Fang','Claw','Wing','Shell',
  'Pearl','Crystal','Dust','Ash','Smoke','Spark','Wave','Tide','Current','Drift',

  'Knight','Samurai','Ninja','Warrior','Hunter','Seeker','Wanderer','Traveler','Guardian','Watcher',
  'Spirit','Phantom','Ghost','Soul','Oracle','Sage','Wizard','Mage','Alchemist','Druid',

  'Cipher','Code','Signal','Pulse','Matrix','Vector','Pixel','Node','Core','Circuit'
];

export function generateAnonName() {
  const adj  = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  return `${adj} ${noun}`;
}