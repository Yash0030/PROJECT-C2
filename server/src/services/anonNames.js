const ADJECTIVES = [
  'Silent', 'Wandering', 'Hidden', 'Ancient', 'Gentle',
  'Swift', 'Crimson', 'Golden', 'Silver', 'Misty',
  'Hollow', 'Distant', 'Fading', 'Rising', 'Lone',
  'Calm', 'Wild', 'Bright', 'Dark', 'Pale',

  'Shaded', 'Frozen', 'Burning', 'Glowing', 'Fierce',
  'Brave', 'Clever', 'Quiet', 'Noisy', 'Soft',
  'Rough', 'Sharp', 'Blunt', 'Cool', 'Warm',
  'Chill', 'Stormy', 'Windy', 'Dusty', 'Icy',

  'Shadowed', 'Radiant', 'Dusky', 'Amber', 'Azure',
  'Scarlet', 'Ivory', 'Obsidian', 'Velvet', 'Luminous',
  'Electric', 'Cosmic', 'Galactic', 'Solar', 'Lunar',

  'Twilight', 'Dawn', 'Dusk', 'Nocturnal', 'Eternal',
  'Infinite', 'Timeless', 'Sacred', 'Cursed', 'Blessed',

  'Mystic', 'Arcane', 'Enchanted', 'Phantom', 'Spectral',
  'Ghostly', 'Haunted', 'Divine', 'Celestial', 'Infernal',

  'Feral', 'Majestic', 'Noble', 'Royal', 'Savage',
  'Fearless', 'Restless', 'Endless', 'Boundless', 'Limitless',

  'Shimmering', 'Glittering', 'Flickering', 'Blazing', 'Smoldering',
  'Drifting', 'Floating', 'Falling', 'Soaring', 'Creeping',

  'Hidden', 'Veiled', 'Masked', 'Nameless', 'Forgotten',
  'Lost', 'Broken', 'Shattered', 'Reborn', 'Awakened'
];

const NOUNS = [
  'Fox', 'Crane', 'Wolf', 'Hawk', 'Raven',
  'Bear', 'Lynx', 'Deer', 'Owl', 'Heron',
  'Tiger', 'Falcon', 'Monk', 'Drifter', 'Nomad',
  'Echo', 'Ember', 'Storm', 'River', 'Stone',

  'Shadow', 'Flame', 'Ash', 'Blaze', 'Frost',
  'Thunder', 'Lightning', 'Rain', 'Snow', 'Wind',

  'Mountain', 'Forest', 'Desert', 'Ocean', 'Valley',
  'Cliff', 'Canyon', 'Island', 'Field', 'Meadow',

  'Hunter', 'Seeker', 'Wanderer', 'Guardian', 'Watcher',
  'Keeper', 'Runner', 'Stranger', 'Traveler', 'Outcast',

  'Spirit', 'Soul', 'Phantom', 'Wraith', 'Specter',
  'Entity', 'Being', 'Ghost', 'Shade', 'Echo',

  'Blade', 'Sword', 'Dagger', 'Shield', 'Arrow',
  'Spear', 'Hammer', 'Crown', 'Throne', 'Orb',

  'Star', 'Comet', 'Galaxy', 'Planet', 'Nebula',
  'Void', 'Cosmos', 'Orbit', 'Eclipse', 'Nova',

  'Dragon', 'Phoenix', 'Griffin', 'Serpent', 'Hydra',
  'Beast', 'Creature', 'Giant', 'Colossus', 'Titan',

  'Scholar', 'Sage', 'Oracle', 'Mystic', 'Mage',
  'Knight', 'Samurai', 'Ninja', 'Warrior', 'Champion',

  'Path', 'Journey', 'Quest', 'Saga', 'Legend',
  'Myth', 'Tale', 'Story', 'Chronicle', 'Verse'
];

export function generateAnonName() {
  const adj  = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  return `${adj} ${noun}`;
}