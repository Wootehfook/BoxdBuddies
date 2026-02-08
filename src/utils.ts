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
const FAMOUS_MOVIE_QUOTES_RAW = `
I have come here to chew bubblegum and kick ass... and I'm all out of bubblegum.|They Live
Groovy.|Evil Dead II
Where we're going, we won't need eyes to see.|Event Horizon
Garbage day!|Silent Night, Deadly Night Part 2
It’s screaming. It’s screaming like a banshee!|The Blob (1988)
Be afraid. Be very afraid.|The Fly
They're eating her! And then they're going to eat me! Oh my Goooooood!|Troll 2
I gave him life!|Re-Animator
Long live the new flesh.|Videodrome
Kill it! Kill it with fire!|The Thing
Welcome to prime time, bitch.|A Nightmare on Elm Street 3: Dream Warriors
Send more paramedics.|The Return of the Living Dead
I kick arse for the Lord!|Braindead (Dead Alive)
Not the bees! NOT THE BEES!|The Wicker Man
Sleep? I'll sleep when I'm dead.|Saturn 3
Klaatu barada nikto.|The Day the Earth Stood Still
Even a man who is pure in heart and says his prayers by night...|The Wolf Man
He didn't get out of the cock-a-doodie car!|Misery
One thing about living in Santa Carla I never could stomach: all the damn vampires.|The Lost Boys
It's all in the reflexes.|Big Trouble in Little China
Man is the warmest place to hide.|The Thing
Eat to live, don't live to eat.|Stuff
We have such sights to show you.|Hellraiser
Stupid, stupid, stupid!|Plan 9 from Outer Space
I'm your boyfriend now, Nancy.|A Nightmare on Elm Street
Good? Bad? I'm the guy with the gun.|Army of Darkness
There are two kinds of people in this world, my friend: Those with loaded guns and those who dig.|The Good, the Bad and the Ugly
Psychos do not explode when sunlight hits them, I don't give a fuck how crazy they are!|From Dusk Till Dawn
Wolfman's got nards!|The Monster Squad
I am a god! The golden god!|Five Gods
I'm sorry, Dave. I'm afraid I can't do that.|2001: A Space Odyssey
Game over, man! Game over!|Aliens
Listen to them. Children of the night. What music they make.|Dracula
Redrum. Redrum.|The Shining
If it bleeds, we can kill it.|Predator
They're here.|Poltergeist
Sometimes, dead is better.|Pet Sematary
Your suffering will be legendary, even in hell.|Hellraiser II: Hellbound
We're gonna need some more FBI guys, I guess.|The Frighteners
See you at the party, Richter!|Total Recall
Dead or alive, you're coming with me.|RoboCop
Soylent Green is people!|Soylent Green
Get away from her, you bitch!|Aliens
Hail to the king, baby.|Army of Darkness
I know you're out there. I can feel you now.|The Matrix
It's alive! It's alive!|Frankenstein
The power of Christ compels you!|The Exorcist
Here's Johnny!|The Shining
Whatever you do, don't fall asleep.|A Nightmare on Elm Street
Do you like scary movies?|Scream
I've seen things you people wouldn't believe. Attack ships on fire off the shoulder of Orion.|Blade Runner
Leeloo Dallas multipass.|The Fifth Element
I'd buy that for a dollar!|RoboCop
Service guarantees citizenship.|Starship Troopers
No matter where you go, there you are.|The Adventures of Buckaroo Banzai Across the 8th Dimension
Broke into the wrong goddamn rec room, didn't ya you bastard!|Tremors
He doesn't know how to use the three seashells!|Demolition Man
By Grabthar's Hammer, you shall be avenged.|Galaxy Quest
Consider that a divorce.|Total Recall
Welcome to Costco, I love you.|Idiocracy
The spice must flow.|Dune (1984)
Thrill me.|Night of the Creeps
Gordon's alive?!|Flash Gordon
Number 5 is alive!|Short Circuit
I aim to misbehave.|Serenity
Why are you wearing that stupid man suit?|Donnie Darko
There is no spoon.|The Matrix
Take your stinking paws off me, you damned dirty ape!|Planet of the Apes
Get your fookin' tentacle out of my face!|District 9
Witness me!|Mad Max: Fury Road
The only winning move is not to play.|WarGames
Call me Snake.|Escape from New York
Here is Subzero! Now, plain zero!|The Running Man
Don't run! We are your friends!|Mars Attacks!
Elvis is not dead. He just went home.|Men in Black
I never saved anything for the swim back.|Gattaca
End of line.|Tron
Run, Runner!|Logan's Run
Open the pod bay doors, HAL.|2001: A Space Odyssey
There's always time for lubricant!|Evolution
Kneel before Zod!|Superman II
Tetsuooooo!|Akira
I knew it. I'm surrounded by Assholes.|Spaceballs
Allow it.|Attack the Block
The life of a repo man is always intense.|Repo Man
Death to the demoness Allegra Geller!|eXistenZ
I'm gonna suck your brain dry!|Scanners
What're you gonna do with those pies, boys?|Killer Klowns from Outer Space
Sanity is a calibrated camera.|Videodrome
Negative, I am a meat popsicle.|The Fifth Element
Kill me.|Alien Resurrection
Welcome to the desert of the real.|The Matrix
Does this unit have a soul?|Mass Effect
Ray, when someone asks you if you're a god, you say YES!|Ghostbusters
Sleep now.|Dark City
I want to believe.|The X-Files: Fight the Future
Where we're going, we don't need roads.|Back to the Future
Humanity is a virus.|The Matrix
Are you telling me you built a time machine... out of a DeLorean?|Back to the Future
I am a leaf on the wind. Watch how I soar.|Serenity
You can't piss on hospitality! I won't allow it!|Troll 2
How'd it get burned? HOW'D IT GET BURNED?!|The Wicker Man (2006)
I am going to make you as happy as a baby Psychlo on a straight diet of Kerbango.|Battlefield Earth
Killing me won't bring back your goddamn honey!|The Wicker Man (2006)
Future events such as these will affect you in the future.|Plan 9 from Outer Space
The Gun is good! The Penis is evil!|Zardoz
Stop eating my sesame cake!|Congo
Deepest, bluest, my hat is like a shark's fin.|Deep Blue Sea
There's snakes out there dis big?|Anaconda
Trick or treat, motherfucker!|Halloween: Resurrection
Trust the fungus.|Super Mario Bros. (1993)
Too bad you... will die.|Mortal Kombat: Annihilation
Allow me to break the ice.|Batman & Robin
Cheese and crackers!|The Happening
I'm a vampire! I'm a vampire!|Vampire's Kiss
Honey, this machine's calling me an asshole!|Maximum Overdrive
No more Mr. Nice Duck.|Howard the Duck
Quick, change the channel!|Street Fighter
The moon... it's hollow.|Moonfall
Like a turd... in the wind.|Venom
I create life! And I destroy it!|Jupiter Ascending
I don't know anything about any artifacts!|Alone in the Dark
Imperial Battleship, halt the flow of time!|Starcrash
Eat shit and die, Ricky!|Sleepaway Camp
Look Ma, I'm a snowman!|Jack Frost
Nilbog! It's Goblin spelled backwards!|Troll 2
Mother... you're alive.|Mortal Kombat: Annihilation
I hate sand. It's coarse and rough and irritating and it gets everywhere.|Star Wars: Episode II – Attack of the Clones
Punish!|Silent Night, Deadly Night
Gobble gobble, motherfucker.|Thankskilling
Wanna date?|Frankenhooker
All you of Earth are idiots!|Plan 9 from Outer Space
I cannot, yet I must. How do you calculate that?|Robot Monster
Do you know what happens to a toad when it's struck by lightning? The same thing that happens to everything else.|X-Men
Sharknado!|Sharknado
Bring me my legs!|Piranha 3DD
They're sharks. They're scary. They don't want to be your friend.|Sharknado
We are Martians!|Santa Claus Conquers the Martians
Man-animal!|Battlefield Earth
Somehow, Palpatine returned.|Star Wars: The Rise of Skywalker
Chill out!|Batman & Robin
Amy want green drop drink.|Congo
Unobtainium.|The Core
Damn you! God damn you all to hell!|Planet of the Apes
Flash, I love you, but we only have fourteen hours to save the Earth!|Flash Gordon
Bio-digital jazz, man.|Tron: Legacy
You ate my bird!|Deep Blue Sea
Mexican Geostorm!|Geostorm
Welcome to my world, bitch!|Freddy vs. Jason
Just when you thought it was safe to go back in the water...|Jaws 2
`;

export const FAMOUS_MOVIE_QUOTES = FAMOUS_MOVIE_QUOTES_RAW.split("\n")
  .map((line) => line.trim())
  .filter(Boolean)
  .map((line) => {
    const [quote, movie] = line.split("|");
    return { quote, movie };
  });

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
