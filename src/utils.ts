/*
 * BoxdBuddy - Utility Functions and Constants
 * Copyright (C) 2025 Wootehfook
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

// AI Generated: GitHub Copilot - 2025-08-29T10:15:00Z
// Performance Optimization: Component Splitting - Extracted utilities for better organization

// AI Generated: GitHub Copilot - 2025-08-29T10:15:00Z
// API Configuration Constants
export const API_ENDPOINTS = {
  LETTERBOXD_FRIENDS: "/letterboxd/friends",
  LETTERBOXD_WATCHLIST_COUNT: "/letterboxd/watchlist-count",
  LETTERBOXD_COMPARE: "/api/watchlist-comparison", // Changed from "/letterboxd/compare" because some adblockers (e.g., uBlock Origin, AdBlock Plus) block requests to paths containing "compare" or "comparison" under certain URL patterns, mistaking them for tracking or advertising endpoints. Moving this endpoint under "/api/" and renaming it to "watchlist-comparison" avoids these false positives and ensures the feature works even when common adblockers are enabled.
  LETTERBOXD_AVATAR_PROXY: "/letterboxd/avatar-proxy",
} as const;

// AI Generated: GitHub Copilot - 2025-08-29T10:15:00Z
// Generate consistent colors for user display throughout the app
export function getUserColors(username: string) {
  const colors = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#96CEB4",
    "#FECA57",
    "#FF9FF3",
    "#54A0FF",
    "#5F27CD",
    "#00D2D3",
    "#FF9F43",
    "#1DD1A1",
    "#FD79A8",
    "#6C5CE7",
    "#74B9FF",
    "#A29BFE",
    "#1E90FF",
    "#FF7675",
    "#74C0FC",
    "#82CA9D",
    "#F8B500",
  ];

  // Create a simple hash from the username
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = (username.codePointAt(i) ?? 0) + ((hash << 5) - hash);
  }

  // Use the hash to pick a color consistently
  const colorIndex = Math.abs(hash) % colors.length;
  const baseColor = colors[colorIndex];

  return {
    // For avatar backgrounds
    avatarColor: baseColor,
    // For username bubbles/badges
    color: "#ffffff",
    borderColor: baseColor,
    backgroundColor: baseColor + "33", // Add 20% opacity
  };
}

// AI Generated: GitHub Copilot - 2025-08-29T10:15:00Z
// Famous movie quotes for progress display
export const FAMOUS_MOVIE_QUOTES = [
  {
    quote:
      "I have come here to chew bubblegum and kick ass... and I'm all out of bubblegum.",
    movie: "They Live",
  },
  { quote: "Groovy.", movie: "Evil Dead II" },
  {
    quote: "Where we're going, we won't need eyes to see.",
    movie: "Event Horizon",
  },
  { quote: "Garbage day!", movie: "Silent Night, Deadly Night Part 2" },
  {
    quote: "It’s screaming. It’s screaming like a banshee!",
    movie: "The Blob (1988)",
  },
  { quote: "Be afraid. Be very afraid.", movie: "The Fly" },
  {
    quote:
      "They're eating her! And then they're going to eat me! Oh my Goooooood!",
    movie: "Troll 2",
  },
  { quote: "I gave him life!", movie: "Re-Animator" },
  { quote: "Long live the new flesh.", movie: "Videodrome" },
  { quote: "Kill it! Kill it with fire!", movie: "The Thing" },
  {
    quote: "Welcome to prime time, bitch.",
    movie: "A Nightmare on Elm Street 3: Dream Warriors",
  },
  { quote: "Send more paramedics.", movie: "The Return of the Living Dead" },
  { quote: "I kick arse for the Lord!", movie: "Braindead (Dead Alive)" },
  { quote: "Not the bees! NOT THE BEES!", movie: "The Wicker Man" },
  { quote: "Sleep? I'll sleep when I'm dead.", movie: "Saturn 3" },
  { quote: "Klaatu barada nikto.", movie: "The Day the Earth Stood Still" },
  {
    quote: "Even a man who is pure in heart and says his prayers by night...",
    movie: "The Wolf Man",
  },
  { quote: "He didn't get out of the cock-a-doodie car!", movie: "Misery" },
  {
    quote:
      "One thing about living in Santa Carla I never could stomach: all the damn vampires.",
    movie: "The Lost Boys",
  },
  { quote: "It's all in the reflexes.", movie: "Big Trouble in Little China" },
  { quote: "Man is the warmest place to hide.", movie: "The Thing" },
  { quote: "Eat to live, don't live to eat.", movie: "Stuff" },
  { quote: "We have such sights to show you.", movie: "Hellraiser" },
  { quote: "Stupid, stupid, stupid!", movie: "Plan 9 from Outer Space" },
  {
    quote: "I'm your boyfriend now, Nancy.",
    movie: "A Nightmare on Elm Street",
  },
  { quote: "Good? Bad? I'm the guy with the gun.", movie: "Army of Darkness" },
  {
    quote:
      "There are two kinds of people in this world, my friend: Those with loaded guns and those who dig.",
    movie: "The Good, the Bad and the Ugly",
  },
  {
    quote:
      "Psychos do not explode when sunlight hits them, I don't give a fuck how crazy they are!",
    movie: "From Dusk Till Dawn",
  },
  { quote: "Wolfman's got nards!", movie: "The Monster Squad" },
  { quote: "I am a god! The golden god!", movie: "Five Gods" },
  {
    quote: "I'm sorry, Dave. I'm afraid I can't do that.",
    movie: "2001: A Space Odyssey",
  },
  { quote: "Game over, man! Game over!", movie: "Aliens" },
  {
    quote: "Listen to them. Children of the night. What music they make.",
    movie: "Dracula",
  },
  { quote: "Redrum. Redrum.", movie: "The Shining" },
  { quote: "If it bleeds, we can kill it.", movie: "Predator" },
  { quote: "They're here.", movie: "Poltergeist" },
  { quote: "Sometimes, dead is better.", movie: "Pet Sematary" },
  {
    quote: "Your suffering will be legendary, even in hell.",
    movie: "Hellraiser II: Hellbound",
  },
  {
    quote: "We're gonna need some more FBI guys, I guess.",
    movie: "The Frighteners",
  },
  { quote: "See you at the party, Richter!", movie: "Total Recall" },
  { quote: "Dead or alive, you're coming with me.", movie: "RoboCop" },
  { quote: "Soylent Green is people!", movie: "Soylent Green" },
  { quote: "Get away from her, you bitch!", movie: "Aliens" },
  { quote: "Hail to the king, baby.", movie: "Army of Darkness" },
  {
    quote: "I know you're out there. I can feel you now.",
    movie: "The Matrix",
  },
  { quote: "It's alive! It's alive!", movie: "Frankenstein" },
  { quote: "The power of Christ compels you!", movie: "The Exorcist" },
  { quote: "Here's Johnny!", movie: "The Shining" },
  {
    quote: "Whatever you do, don't fall asleep.",
    movie: "A Nightmare on Elm Street",
  },
  { quote: "Do you like scary movies?", movie: "Scream" },
  {
    quote:
      "I've seen things you people wouldn't believe. Attack ships on fire off the shoulder of Orion.",
    movie: "Blade Runner",
  },
  { quote: "Leeloo Dallas multipass.", movie: "The Fifth Element" },
  { quote: "I'd buy that for a dollar!", movie: "RoboCop" },
  { quote: "Service guarantees citizenship.", movie: "Starship Troopers" },
  {
    quote: "No matter where you go, there you are.",
    movie: "The Adventures of Buckaroo Banzai Across the 8th Dimension",
  },
  {
    quote: "Broke into the wrong goddamn rec room, didn't ya you bastard!",
    movie: "Tremors",
  },
  {
    quote: "He doesn't know how to use the three seashells!",
    movie: "Demolition Man",
  },
  {
    quote: "By Grabthar's Hammer, you shall be avenged.",
    movie: "Galaxy Quest",
  },
  { quote: "Consider that a divorce.", movie: "Total Recall" },
  { quote: "Welcome to Costco, I love you.", movie: "Idiocracy" },
  { quote: "The spice must flow.", movie: "Dune (1984)" },
  { quote: "Thrill me.", movie: "Night of the Creeps" },
  { quote: "Gordon's alive?!", movie: "Flash Gordon" },
  { quote: "Number 5 is alive!", movie: "Short Circuit" },
  { quote: "I aim to misbehave.", movie: "Serenity" },
  { quote: "Why are you wearing that stupid man suit?", movie: "Donnie Darko" },
  { quote: "There is no spoon.", movie: "The Matrix" },
  {
    quote: "Take your stinking paws off me, you damned dirty ape!",
    movie: "Planet of the Apes",
  },
  { quote: "Get your fookin' tentacle out of my face!", movie: "District 9" },
  { quote: "Witness me!", movie: "Mad Max: Fury Road" },
  { quote: "The only winning move is not to play.", movie: "WarGames" },
  { quote: "Call me Snake.", movie: "Escape from New York" },
  { quote: "Here is Subzero! Now, plain zero!", movie: "The Running Man" },
  { quote: "Don't run! We are your friends!", movie: "Mars Attacks!" },
  { quote: "Elvis is not dead. He just went home.", movie: "Men in Black" },
  { quote: "I never saved anything for the swim back.", movie: "Gattaca" },
  { quote: "End of line.", movie: "Tron" },
  { quote: "Run, Runner!", movie: "Logan's Run" },
  { quote: "Open the pod bay doors, HAL.", movie: "2001: A Space Odyssey" },
  { quote: "There's always time for lubricant!", movie: "Evolution" },
  { quote: "Kneel before Zod!", movie: "Superman II" },
  { quote: "Tetsuooooo!", movie: "Akira" },
  { quote: "I knew it. I'm surrounded by Assholes.", movie: "Spaceballs" },
  { quote: "Allow it.", movie: "Attack the Block" },
  { quote: "The life of a repo man is always intense.", movie: "Repo Man" },
  { quote: "Death to the demoness Allegra Geller!", movie: "eXistenZ" },
  { quote: "I'm gonna suck your brain dry!", movie: "Scanners" },
  {
    quote: "What're you gonna do with those pies, boys?",
    movie: "Killer Klowns from Outer Space",
  },
  { quote: "Sanity is a calibrated camera.", movie: "Videodrome" },
  { quote: "Negative, I am a meat popsicle.", movie: "The Fifth Element" },
  { quote: "Kill me.", movie: "Alien Resurrection" },
  { quote: "Welcome to the desert of the real.", movie: "The Matrix" },
  { quote: "Does this unit have a soul?", movie: "Mass Effect" },
  {
    quote: "Ray, when someone asks you if you're a god, you say YES!",
    movie: "Ghostbusters",
  },
  { quote: "Sleep now.", movie: "Dark City" },
  { quote: "I want to believe.", movie: "The X-Files: Fight the Future" },
  {
    quote: "Where we're going, we don't need roads.",
    movie: "Back to the Future",
  },
  { quote: "Humanity is a virus.", movie: "The Matrix" },
  {
    quote: "Are you telling me you built a time machine... out of a DeLorean?",
    movie: "Back to the Future",
  },
  { quote: "I am a leaf on the wind. Watch how I soar.", movie: "Serenity" },
  {
    quote: "You can't piss on hospitality! I won't allow it!",
    movie: "Troll 2",
  },
  {
    quote: "How'd it get burned? HOW'D IT GET BURNED?!",
    movie: "The Wicker Man (2006)",
  },
  {
    quote:
      "I am going to make you as happy as a baby Psychlo on a straight diet of Kerbango.",
    movie: "Battlefield Earth",
  },
  {
    quote: "Killing me won't bring back your goddamn honey!",
    movie: "The Wicker Man (2006)",
  },
  {
    quote: "Future events such as these will affect you in the future.",
    movie: "Plan 9 from Outer Space",
  },
  { quote: "The Gun is good! The Penis is evil!", movie: "Zardoz" },
  { quote: "Stop eating my sesame cake!", movie: "Congo" },
  {
    quote: "Deepest, bluest, my hat is like a shark's fin.",
    movie: "Deep Blue Sea",
  },
  { quote: "There's snakes out there dis big?", movie: "Anaconda" },
  { quote: "Trick or treat, motherfucker!", movie: "Halloween: Resurrection" },
  { quote: "Trust the fungus.", movie: "Super Mario Bros. (1993)" },
  { quote: "Too bad you... will die.", movie: "Mortal Kombat: Annihilation" },
  { quote: "Allow me to break the ice.", movie: "Batman & Robin" },
  { quote: "Cheese and crackers!", movie: "The Happening" },
  { quote: "I'm a vampire! I'm a vampire!", movie: "Vampire's Kiss" },
  {
    quote: "Honey, this machine's calling me an asshole!",
    movie: "Maximum Overdrive",
  },
  { quote: "No more Mr. Nice Duck.", movie: "Howard the Duck" },
  { quote: "Quick, change the channel!", movie: "Street Fighter" },
  { quote: "The moon... it's hollow.", movie: "Moonfall" },
  { quote: "Like a turd... in the wind.", movie: "Venom" },
  { quote: "I create life! And I destroy it!", movie: "Jupiter Ascending" },
  {
    quote: "I don't know anything about any artifacts!",
    movie: "Alone in the Dark",
  },
  { quote: "Imperial Battleship, halt the flow of time!", movie: "Starcrash" },
  { quote: "Eat shit and die, Ricky!", movie: "Sleepaway Camp" },
  { quote: "Look Ma, I'm a snowman!", movie: "Jack Frost" },
  { quote: "Nilbog! It's Goblin spelled backwards!", movie: "Troll 2" },
  { quote: "Mother... you're alive.", movie: "Mortal Kombat: Annihilation" },
  {
    quote:
      "I hate sand. It's coarse and rough and irritating and it gets everywhere.",
    movie: "Star Wars: Episode II – Attack of the Clones",
  },
  { quote: "Punish!", movie: "Silent Night, Deadly Night" },
  { quote: "Gobble gobble, motherfucker.", movie: "Thankskilling" },
  { quote: "Wanna date?", movie: "Frankenhooker" },
  { quote: "All you of Earth are idiots!", movie: "Plan 9 from Outer Space" },
  {
    quote: "I cannot, yet I must. How do you calculate that?",
    movie: "Robot Monster",
  },
  {
    quote:
      "Do you know what happens to a toad when it's struck by lightning? The same thing that happens to everything else.",
    movie: "X-Men",
  },
  { quote: "Sharknado!", movie: "Sharknado" },
  { quote: "Bring me my legs!", movie: "Piranha 3DD" },
  {
    quote: "They're sharks. They're scary. They don't want to be your friend.",
    movie: "Sharknado",
  },
  { quote: "We are Martians!", movie: "Santa Claus Conquers the Martians" },
  { quote: "Man-animal!", movie: "Battlefield Earth" },
  {
    quote: "Somehow, Palpatine returned.",
    movie: "Star Wars: The Rise of Skywalker",
  },
  { quote: "Chill out!", movie: "Batman & Robin" },
  { quote: "Amy want green drop drink.", movie: "Congo" },
  { quote: "Unobtainium.", movie: "The Core" },
  { quote: "Damn you! God damn you all to hell!", movie: "Planet of the Apes" },
  {
    quote:
      "Flash, I love you, but we only have fourteen hours to save the Earth!",
    movie: "Flash Gordon",
  },
  { quote: "Bio-digital jazz, man.", movie: "Tron: Legacy" },
  { quote: "You ate my bird!", movie: "Deep Blue Sea" },
  { quote: "Mexican Geostorm!", movie: "Geostorm" },
  { quote: "Welcome to my world, bitch!", movie: "Freddy vs. Jason" },
  {
    quote: "Just when you thought it was safe to go back in the water...",
    movie: "Jaws 2",
  },
];

// AI Generated: GitHub Copilot - 2025-08-29T10:15:00Z
// Secure URL validation for Letterboxd images to prevent domain spoofing
export function isValidLetterboxdUrl(url: string): boolean {
  try {
    const parsedUrl = new globalThis.URL(url);
    // Ensure the hostname ends with .ltrbxd.com (not just contains it)
    return (
      parsedUrl.hostname.endsWith(".ltrbxd.com") ||
      parsedUrl.hostname === "ltrbxd.com"
    );
  } catch {
    return false;
  }
}
