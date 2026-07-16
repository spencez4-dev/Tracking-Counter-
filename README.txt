LOAD QUEST — FINAL VERSION

WHAT IT IS
A shipment load tracker designed like a small game.

CORE WORKFLOW
- Press + every time you complete a driver check call or shipment update.
- Press - to correct an accidental entry.
- Each update is timestamped.
- Default estimated time per update is 5 minutes.
- The main count resets naturally by date because the app totals today's entries.

GAME FEATURES
- Hourly horse race to 15 loads.
- Automatic race reset at the top of every hour.
- Hourly race win tracking.
- Horse stable with unlockable racers.
- XP and levels.
- Daily load goal.
- Best hour and hourly streak stats.
- Confetti, sound, dust, and trophy celebrations.

UNLOCKS
- Mustang: starter horse
- Unicorn: 3 race wins
- Zebra: 7 race wins
- Ghost Horse: 12 race wins
- Skeleton Horse: 20 race wins
- Royal Racer: 30 race wins

NEW REPOSITORY SETUP
1. Create a new PUBLIC GitHub repository named:
   load-quest
2. Unzip this package.
3. Upload every file from the unzipped folder to the repository root.
4. Commit the files.
5. Open Settings → Pages.
6. Under Build and deployment:
   Source: Deploy from a branch
   Branch: main
   Folder: / (root)
7. Save and wait about 1–2 minutes.
8. Open:
   https://YOUR-USERNAME.github.io/load-quest/

INSTALL ON MAC
Open the live URL in Safari.
Choose File → Add to Dock.

INSTALL ON IPHONE
Open the live URL in Safari.
Tap Share → Add to Home Screen.

UPDATES
This final version uses separate index.html, styles.css, and app.js files.
That makes future changes much safer and easier.
The service worker checks the network first for new versions.

DATA
All history, settings, race wins, and horses are stored locally in the browser.
Use Export to save a JSON backup.
