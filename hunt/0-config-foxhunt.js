// ============================================================
//  Fox Pursuit Site Configuration
//  Edit this file via cPanel File Manager to change settings.
//  Change the VALUES only — do not rename the variables/keys.
//  Text values go inside the "double quotes".
// ============================================================

const FOXHUNT_CONFIG = {

  // ── AUTHENTICATION (passwordless) ─────────────────────────
  // The app is passwordless: users enter a handle (username) only — no password.
  // Where that handle is kept:
  //   false = kept ONLY on the user's own device (browser local storage). Nothing
  //           about the handle is written to your server. Most private. The handle
  //           still persists across sessions on the same device; the user simply
  //           re-enters it if they clear their browser data or use another device.
  //   true  = saved to Firestore (users/{uid}) so it survives even a local-storage
  //           clear on that device.
  //   Handles never sync across devices in either mode (anonymous sign-in is
  //   per-device). The Getting Started / Instructions privacy wording automatically
  //   reflects whichever setting you choose.
  persistUsernames: false,

  // ── BRANDING & THEME ──────────────────────────────────────
  // The name shown in the top nav and as the big title on the Home page.
  brandName: "FOX PURSUIT",

  // Site-wide color theme. Pick ONE preset, or "custom" to define your own
  // colors below. The MAP keeps its own functional colors — themes only re-skin
  // the surrounding app (nav, panels, buttons, headings, text).
  // Presets: "original", "light", "midnight", "forest", "graphite",
  //          "desert", "high-contrast", "violet".
  theme: "original",

  // Only used when theme is "custom". Set as few or as many as you like —
  // anything left "" is filled in automatically (panels/border derived from the
  // background, accent2 from the accent). To match an existing website, setting
  // just bg, accent, text, and muted is usually enough. Keep the accent away
  // from pure red/orange (so it isn't confused with the map's "you are here"
  // marker), and keep text easy to read against bg — the browser console logs a
  // warning if the contrast is low.
  // The following is a customTheme example.  Overwrite the hex values with the
  // colors you want to use for your own customTheme.
  customTheme: {
    bg: "#1C398E", panel: "#0033FF", panel2: "#0099FF", border: "#00CCFF",
    accent: "#00FFFF", accent2: "#99FFFF", text: "#FFFFFF", muted: "#99CCFF"
  },
    // Following are the tokens and hex values used in the "original" theme:
    //   bg: "#0d0f14", panel: "#141720", panel2: "#1a1e2a", border: "#2a2f3d",
    //   accent: "#f0a500", accent2: "#e05a00", text: "#d8dce8", muted: "#e6ddc4"


  // Optional font overrides — any valid CSS font-family, or "" to keep the
  // built-in fonts. Example: fontSans: "'Roboto', sans-serif".
  fontSans: "",
  fontMono: "",

  // ── PAGE BACKGROUND ───────────────────────────────────────
  // "grid"  = the themed grid (default)
  // "none"  = a solid background in the theme's color
  // "image" = your own image (set backgroundImage below)
  background: "none",

  // Used when background is "image". Put the file in the site folder and point
  // to it here, e.g. "assets/background.jpg".
  //
  // SMALLER IS BETTER. It loads on every page and is cached for offline use, so
  // a heavy image costs your participants time and data every time — out in the
  // field, on whatever signal they have. Keep it well compressed (JPEG or WebP
  // for photographs, PNG for flat graphics). ~1600-1920px wide is plenty for a
  // full-screen photo; a small 100-300px image is right for a repeating texture.
  //
  // A foxtail_1x1.jpg file has been supplied as an example.
  backgroundImage:    "",

  // Images larger than this (in KB) are normally skipped and the grid shown
  // instead, with a note in the browser console. The size is read from the web
  // server before the image loads; if your server does not report a file size,
  // the image loads anyway — so treat this as a guard, not a guarantee.
  backgroundMaxKB:    500,

  // backgroundSize — how the image fills the screen. Which one you want depends
  // on what KIND of image it is:
  //
  //   "cover"    Scaled up until it covers the whole screen, cropping whatever
  //              hangs over the edges. Nothing shows through, but you never see
  //              all of it, and how much is cropped differs between a phone held
  //              upright, a phone turned sideways, and a PC.
  //              Best for PHOTOGRAPHS and large artwork.
  //              Keep anything that matters — a callsign, a logo — away from the
  //              edges, because on some screens it will be cut off.
  //
  //   "contain"  Scaled until ALL of it fits, so the whole image is always
  //              visible. It keeps its proportions, so there is empty space
  //              above and below, or at the sides, filled with the theme color.
  //              Best for a CLUB LOGO or badge that must be seen complete.
  //              Note that a wide image on an upright phone ends up quite small.
  //
  //   "repeat"   Used at its own size and tiled across the screen, like
  //              wallpaper. Best for a SMALL SEAMLESS PATTERN, 100-300px — a
  //              texture, a weave, a grid. A tiny file covers any screen with no
  //              scaling. A photograph tiled this way looks like a wall of
  //              postage stamps.
  //
  // If you are unsure, start with "cover". It suits most images.
  backgroundSize:     "cover",   // "cover" | "contain" | "repeat"

  // Which part of the image survives when "cover" crops it, and where the image
  // sits within the empty space under "contain". "center" suits most images;
  // "top" is useful when the top of the picture is the part worth keeping.
  // Accepts any CSS position, e.g. "center", "top", "bottom right", "50% 20%".
  backgroundPosition: "center",

  // Readability wash: the theme color laid over the image so text stays legible.
  // 0 = image only (often too busy to read against) … 1 = theme color only.
  // This app is read outdoors in daylight, so err toward MORE wash, not less.
  backgroundDim:      0.6,

  // Desktop parallax: the image stays put while the page scrolls. Ignored on
  // most phones, so it changes nothing for the majority of your participants.
  backgroundFixed:    false,

  // ── HUNT SETTINGS ─────────────────────────────────────────
  huntDurationHours: 4,   // Hours before a hunt auto-closes
  addTimeMinutes:    30,  // Minutes added by the "+30m" button
  bearingLineMiles:  25,  // Length of each bearing line on the map

  // ── DEMO MODE (v72.11) ────────────────────────────────────
  // For a public demonstration site only. Leave false for a club installation.
  // true: a banner on every page, nothing recorded in analytics, and Create Hunt
  // refuses once demoMaxOpenHunts hunts are open (they close by themselves after
  // huntDurationHours). Set huntDurationHours low (1 or 2) on a demo site.
  demoMode:         false,
  demoMaxOpenHunts: 10,
  demoBannerText:   "DEMO SITE \u2014 hunts here are public and close automatically. Nothing you do here is private.",

  // ── MAP ───────────────────────────────────────────────────
  // The basemap is a vector .pmtiles archive read over HTTP range requests: the
  // app pulls a few kilobytes out of the middle of the file rather than
  // downloading the whole thing.
  //
  // Ready-made regional maps for most of the world are hosted for you and stream
  // straight from Fox Pursuit's map service (https://maps.foxpursuit.com) - no
  // downloading, extracting, or self-hosting required. To use YOUR region, open
  // the coverage map (mapDownloadUrl, below), find your area, and set tileUrl to
  // that region's address, for example:
  //     tileUrl: "https://maps.foxpursuit.com/USA-MO_SSW.pmtiles"
  // See SETUP.txt Section 2 for the short walkthrough.
  //
  // Ships pointed at the small bundled sample in maps/ (Southwest Missouri) so the
  // map works the instant you publish - even before you pick a region, and even
  // with no connection on that first load. Leave it as-is to try things out;
  // switch tileUrl to your region's address when you are ready.
  //
  // Prefer to host the map yourself? Point tileUrl at your own copy of a .pmtiles
  // file instead. Your server must support HTTP Range requests (206) and, if it is
  // on a different domain than this app, must send CORS headers. (The hosted
  // service above already does both, which is why the default "just works.")
  //
  // MAP SCHEMA - the one fact that is obvious today and impossible to work out
  // later. This build renders PROTOMAPS BASEMAP v4 tiles. Any .pmtiles you point
  // tileUrl at must be built to that schema. A newer schema will open and appear
  // to work, but will render wrong - missing roads, unlabelled, oddly coloured.
  // If you ever build your own map (SETUP.txt 2.4), build it to v4.
  //
  // mapDownloadUrl: the coverage / "get a map for my area" page, shown as a link
  // on the admin page. Leave blank to hide the link entirely.
  mapDownloadUrl: "https://foxpursuit.com/maps/",

  tileUrl: "maps/springfield-branson.pmtiles",

  // Offline map areas offered to the user, as a RADIUS in the app's `units`
  // (set below). Give 1, 2 or 3 CLEAN values. A single value skips the choice
  // and just downloads that size. Values are clamped to 5-160.
  //   imperial (units:"imperial"): [15, 25, 40] mi
  //   metric   (units:"metric"):   [25, 40, 65] km
  // Each download also includes roads and towns out to ~100 mi / ~160 km so the
  // drive there is mapped.  (Legacy key mapRegionRadiiMiles still works.)
  mapRegionRadii: [15, 25, 40],

  // ── BEARING-LINE CROSSING EXTENSION ───────────────────────
  // When two bearing lines cross FARTHER out than bearingLineMiles, the crossing
  // (and the fox estimate that sits there) can fall off the ends of the drawn
  // lines. With this on, each line is automatically stretched to just past the
  // farthest forward point where it crosses another line, so the "X" is always
  // visible. Lines are only ever LENGTHENED, never shortened, and this changes
  // only what is DRAWN — the triangulation math is unaffected.
  extendLinesToCrossing:     true, // false = always draw lines at exactly bearingLineMiles
  crossingExtendMaxMiles:    100,  // never extend past this. Near-parallel bearings can cross hundreds of miles out; past this cap the line just keeps its normal length (that geometry is flagged "weak" anyway)
  crossingExtendPastPercent: 15,   // draw this % beyond the crossing so the intersection is clearly enclosed, not sitting on the very tip

  // ── ESTIMATE (probable-area) QUALITY THRESHOLDS ───────────
  // These control the coarse/weak guidance shown for the fox estimate.
  // estimateCoarseMiles: if the estimated area is LONGER than this (its long
  //   axis, in your chosen units' miles), it's flagged "coarse but usable".
  // estimateWeakRatio: if the area is more than this many times LONGER than it
  //   is WIDE (shape), it's flagged a "weak" fix (bearings nearly parallel).
  // Tune both from real hunts. Larger values = fewer warnings.
  estimateCoarseMiles: 6,
  estimateWeakRatio:   20,

  // The over-map guidance toasts shown while the probable area is coarse or weak.
  // They appear whenever a new bearing leaves the fix in that state (a "good" fix
  // stays silent). Reword or translate freely — leave "" to suppress that message.
  estimateCoarseToast: "Coarse but good — move closer and take a fresh reading to tighten",
  estimateWeakToast:   "Weak fix — bearings nearly parallel; reposition to cross at a wider angle",

  // Units for ALL distances shown anywhere in the app: bearing/navigation
  // readouts, the map scale bar, the offline-region radii, and download sizes.
  //   "imperial" → feet / miles (default)
  //   "metric"   → meters / km
  units: "imperial",

  // ── BEARING SENSING ───────────────────────────────────────
  // When tracking is on, the app automatically uses whichever bearing is more
  // accurate — your GPS direction of travel or the magnetic compass — and shows
  // which one it used in the status line. Manual entry is always available too.
  gpsBearingMinMph:          1.2, // Min speed (mph) before GPS heading is considered (filters standing-still jitter)
  gpsBearingMinTravelFeet:   15,  // Min straight-line travel (feet) before a GPS heading is trusted
  gpsBearingMaxAccuracyFeet: 65,  // Ignore GPS heading when the GPS fix is coarser than this (feet)
  gpsBearingHoldSeconds:     5,   // After stopping, keep the GPS heading this long so you can submit, then revert to compass
  gpsBearingSwitchMaxDeg:    22,  // While moving, only snap from compass to the GPS heading once its estimated error is at/under this (smaller = waits for a cleaner GPS heading)
  compassAssumedErrorDeg:    12,  // Assumed compass accuracy when healthy; GPS is used when it can beat this

  // ── PROBABLE-AREA ESTIMATE ────────────────────────────────
  // Optional "Show probable area" overlay on the map: where bearing lines cross,
  // a ~95% ellipse marks where the fox most likely is. Each bearing is weighted
  // by how it was captured — a SMALLER number means MORE trusted (tighter line).
  // Tune these from field experience. (Compass uses compassAssumedErrorDeg above.)
  bearingErrorGpsDeg:    6,   // GPS direction-of-travel bearing
  bearingErrorManualDeg: 8,   // a bearing typed in as exact degrees
  bearingErrorMapDeg:    10,  // a bearing set by two taps on the map (location + direction)
  //compassAssumedErrorDeg is set in BEARING SENSING group above. Note: It also influences when the app hands off from compass to GPS during sensing.

  // After you submit a bearing, the map frames the probable-fox area; it resumes
  // following YOU once you move at least this many feet from where it framed.
  resumeFollowAfterFeet: 25,

  // ── HOME PAGE TITLE LINES ─────────────────────────────────
  // Under the fox icon, the Home page shows the brand (brandName above), then
  // an optional tagline, then an optional subtitle. Leave a line "" to hide it.
  // Each line takes a style object:
  //   size      : "xs" "sm" "md" "lg" "xl", or an explicit value like "1.4rem"
  //   color     : a hex like "#f0a500", or "" to use the theme default
  //               (tagline defaults to the accent color, subtitle to muted)
  //   bold / smallCaps / underline / italic : true or false
  homeTagline: "Your Fox Hunting Application",
  homeTaglineStyle:  { size: "", color: "", bold: false, smallCaps: true,  underline: false, italic: false },

  homeSubtitle: "Ham Radio Direction Finding",
  homeSubtitleStyle: { size: "", color: "", bold: false, smallCaps: false, underline: false, italic: false },

  // ── CONTACT PAGE CONTENT ──────────────────────────────────
  // The Contact page heading ("Contact") is fixed. Everything
  // below it is built from these 10 blocks. Fill in as many as
  // you need and leave the rest blank. For EACH block:
  //
  //   subheading : an optional bold sub-heading. Leave "" to skip.
  //   text       : an optional line/paragraph of text. Leave "" to skip.
  //   linkName   : an optional name for a link. If filled in, this
  //                text becomes the clickable link. If left "" but a
  //                linkUrl is given, the URL itself is shown as the link.
  //   linkUrl    : an optional web address, e.g. "https://example.com".
  //                The link appears at the end of the same line as the text.
  //
  // A block with everything blank simply shows nothing.
  //
  //   ── Richer option (optional) ──
  //   Instead of the four fields above, a block may use a "segments" array —
  //   each segment is its own line with its own text, link, and styling:
  //     { subheading: "Email",
  //       segments: [
  //         { text: "Reach us at", textSize: "md",
  //           linkName: "club@example.com", linkSize: "md",
  //           linkUrl: "mailto:club@example.com" },
  //         { text: "We usually reply within a day.", textSize: "sm", italic: true }
  //       ] }
  //   Per segment: textSize / linkSize use the size tiers ("xs"…"xl") or an
  //   explicit value; bold / italic / underline / smallCaps and color also work.
  //   Old blocks (subheading/text/linkName/linkUrl) keep working unchanged.
  //
  //   ── Keeping addresses away from spam harvesters ──
  //   This file is public, so an e-mail address or phone number written plainly
  //   here can be read by programs that collect them. Instead, spell the
  //   punctuation out as a word in parentheses (brackets, in some countries):
  //
  //     (at) → @     (dot) → .     (dash) → -     (plus) → +
  //     (hash) → #   (comma) → ,   (space) → one space
  //
  //   Any letter case works. Spaces on either side of a token are removed, so
  //   "club (at) example (dot) com" becomes club@example.com; use (space) where
  //   a space must stay. Only these exact words in parentheses are converted —
  //   anything else in parentheses is shown as written. The page converts them
  //   when it loads, in text, linkName and linkUrl alike:
  //     { subheading: "Email", text: "", linkName: "club (at) example (dot) com",
  //       linkUrl: "club (at) example (dot) com" }
  //     { subheading: "Phone", text: "", linkName: "417 (dash) 555 (dash) 0100",
  //       linkUrl: "(plus) 1 (dash) 417 (dash) 555 (dash) 0100" }
  //     { subheading: "Mail", text: "PO Box 123 (comma) (space) Hollister (comma) (space) MO 65672" }
  //   (the (space) after (comma) keeps the space that would otherwise be removed)
  //   A bare e-mail address in linkUrl becomes a mailto: link; a phone number in
  //   linkUrl becomes a tap-to-dial link.
  contact: [
    { subheading: "", text: "REPLACE THIS: how people should get in touch with you.", linkName: "", linkUrl: "" },
    { subheading: "", text: "", linkName: "", linkUrl: "" },
    { subheading: "", text: "", linkName: "", linkUrl: "" },
    { subheading: "", text: "", linkName: "", linkUrl: "" },
    { subheading: "", text: "", linkName: "", linkUrl: "" },
    { subheading: "", text: "", linkName: "", linkUrl: "" },
    { subheading: "", text: "", linkName: "", linkUrl: "" },
    { subheading: "", text: "", linkName: "", linkUrl: "" },
    { subheading: "", text: "", linkName: "", linkUrl: "" },
    { subheading: "", text: "", linkName: "", linkUrl: "" }
  ],

  // ── ABOUT PAGE CONTENT ────────────────────────────────────
  // Works exactly like the Contact blocks above. The "About"
  // heading is fixed; these 10 blocks build the rest of the page.
  about: [
    { subheading: "", text: "REPLACE THIS: a sentence about your club or group.", linkName: "", linkUrl: "" },
    { subheading: "", text: "REPLACE THIS: your website, if you have one.", linkName: "", linkUrl: "" },
    { subheading: "", text: "REPLACE THIS: your social media, if you have one.", linkName: "", linkUrl: "" },
    { subheading: "", text: "", linkName: "", linkUrl: "" },
    { subheading: "", text: "", linkName: "", linkUrl: "" },
    { subheading: "", text: "", linkName: "", linkUrl: "" },
    { subheading: "", text: "", linkName: "", linkUrl: "" },
    { subheading: "", text: "", linkName: "", linkUrl: "" },
    { subheading: "", text: "", linkName: "", linkUrl: "" },
    { subheading: "", text: "", linkName: "", linkUrl: "" }
  ],

  // ══════════════════════════════════════════════════════════════
  //  ADDITIONAL PAGE CONTENT
  //  Every block below uses the SAME format as the Contact/About
  //  blocks: { subheading, text, linkName, linkUrl }. Leave a block
  //  blank to skip it; add more blocks freely.
  //
  //  RICHER OPTION — "segments" (recommended for multiple lines/links
  //  in one block). Instead of the four flat fields, give a block a
  //  "segments" array; each segment is its own line with its own text,
  //  link, and styling. There is no fixed limit — add as many as you
  //  like. Example:
  //     { subheading: "Useful links", segments: [
  //         { text: "Band plan:",   linkName: "ARRL",   linkUrl: "https://..." },
  //         { text: "Propagation:", linkName: "solar",  linkUrl: "https://..." },
  //         { text: "Questions? Ask net control.", italic: true }
  //     ] }
  //   Per-segment styling: textSize / linkSize ("xs"…"xl"), bold,
  //   italic, underline, smallCaps, color. Flat blocks still work.
  // ══════════════════════════════════════════════════════════════

  // ── HUNT PAGE — extra content shown below the Create/Join panel ──
  hunt: [
    { subheading: "", text: "", linkName: "", linkUrl: "" },
    { subheading: "", text: "", linkName: "", linkUrl: "" },
    { subheading: "", text: "", linkName: "", linkUrl: "" },
    { subheading: "", text: "", linkName: "", linkUrl: "" },
    { subheading: "", text: "", linkName: "", linkUrl: "" },
    { subheading: "", text: "", linkName: "", linkUrl: "" }
  ],

  // ── GETTING STARTED PAGE — extra content below the built-in guide ──
  gettingStarted: [
    { subheading: "", text: "", linkName: "", linkUrl: "" },
    { subheading: "", text: "", linkName: "", linkUrl: "" },
    { subheading: "", text: "", linkName: "", linkUrl: "" },
    { subheading: "", text: "", linkName: "", linkUrl: "" },
    { subheading: "", text: "", linkName: "", linkUrl: "" },
    { subheading: "", text: "", linkName: "", linkUrl: "" }
  ],

  // ── GETTING STARTED PAGE — content at the TOP, under the page title (v2026.20t, C30) ──
  // Same block format as "gettingStarted". Shown in a highlighted box; hidden when every block is empty.
  // Example (a video link): { subheading: "Watch the walk-through", text: "Two and a half minutes.", linkName: "Watch on YouTube", linkUrl: "https://youtu.be/..." }
  gettingStartedTop: [
    { subheading: "", text: "", linkName: "", linkUrl: "" },
    { subheading: "", text: "", linkName: "", linkUrl: "" },
    { subheading: "", text: "", linkName: "", linkUrl: "" }
  ],

  // ── INSTRUCTIONS PAGE ─────────────────────────────────────────
  // The "In a nutshell" summary at the top of the Instructions page.
  // Edit this text freely; leave blank to hide the summary box.
  nutshell: "Sign in \u2192 create a hunt of your own, or join a group's hunt by its name \u2192 allow GPS and compass access \u2192 submit your location and the bearing toward the signal. Your bearing lines are drawn on your map; in a group hunt everyone's appear on one shared map in real time. Where the lines cross is the likely location of the hidden fox transmitter.",
  // Extra content shown below the built-in instructions.
  instructions: [
    { subheading: "", text: "", linkName: "", linkUrl: "" },
    { subheading: "", text: "", linkName: "", linkUrl: "" },
    { subheading: "", text: "", linkName: "", linkUrl: "" },
    { subheading: "", text: "", linkName: "", linkUrl: "" },
    { subheading: "", text: "", linkName: "", linkUrl: "" },
    { subheading: "", text: "", linkName: "", linkUrl: "" }
  ],

  // ── INSTRUCTIONS PAGE — content at the TOP, under the page title (v2026.20t, C30) ──
  // Same block format as "instructions". Shown in a highlighted box; hidden when every block is empty.
  // Example (a video link): { subheading: "Watch the walk-through", text: "Two and a half minutes.", linkName: "Watch on YouTube", linkUrl: "https://youtu.be/..." }
  instructionsTop: [
    { subheading: "", text: "", linkName: "", linkUrl: "" },
    { subheading: "", text: "", linkName: "", linkUrl: "" },
    { subheading: "", text: "", linkName: "", linkUrl: "" }
  ],

  // ── TROUBLESHOOTING PAGE — the whole page is built from these blocks ──
  troubleshooting: [
    { subheading: "No compass / no bearing on iPhone",
      text: "The compass needs a separate iOS permission. Open a hunt; the control panel opens by itself and shows a \"Compass permission needed\" box at the top. Tap \"Enable Compass\" there and choose Allow when iOS asks for Motion & Orientation access. It can only be granted from that button tap \u2014 allowing location alone is not enough. If the panel is closed, tap \"Show Controls\" first.", linkName: "", linkUrl: "" },
    { subheading: "You tapped \"Deny\" for the compass and want to allow it now",
      text: "iOS remembers a denial, so the button may stop prompting. On the iPhone, open Settings > Apps > Safari > Advanced > Website Data (or your browser's equivalent) and remove this site, then reload the page and tap Enable Compass again. As a fallback, you can always enter the bearing by hand.", linkName: "", linkUrl: "" },
    { subheading: "\u201cNot responding \u2014 close every Fox Pursuit window\u2026\u201d, a button stays dimmed, or the app opens to a Safari error",
      text: "iOS can leave an old copy of the app frozen in the background still holding onto the shared local database, so a new tab or icon can't get in \u2014 Create Hunt or Join dims and nothing happens, the page fails to open at all (\"Safari can't open the page\"), or you see the message above. The app waits about eight seconds for the server and up to eight more for the local copy before showing that message, and when it does, it means exactly what it says: open the app switcher and close EVERY Fox Pursuit window you find there \u2014 there may be more than one \u2014 then open the app again from the icon. Nothing is lost: your sign-in, offline maps and any queued readings are kept, and it should be rare. If it comes back after that, the message offers Repair local data: it clears this phone\u2019s local copy of the hunt database and reloads \u2014 sign-in, handle and offline maps are kept; a hunt created offline that never reached the server is lost." },
    { subheading: "Location was denied and you want to allow it now",
      text: "iPhone: open Settings > Privacy & Security > Location Services > Safari Websites, tap \"Ask Next Time Or When I Share\" (even if it is already ticked), then return to Fox Pursuit, tap Home and open the hunt again - the prompt comes back. This works from the home-screen icon and from Safari. The full step-by-step is at the top of the Getting Started page. Android (Chrome): tap the tune/lock icon by the address bar > Permissions > Location > Allow, then reload. Until location is allowed you can still tap the map to place your location or type coordinates by hand.", linkName: "", linkUrl: "" },
    { subheading: "GPS won't lock or stays inaccurate",
      text: "Go outdoors with a clear view of the sky and give it a few seconds, and make sure location permission is granted. On tablets, Chrome or Edge give the most reliable GPS; Firefox on some tablets keeps re-asking and may not update \u2014 switch browsers or place your location manually.", linkName: "", linkUrl: "" },
    { subheading: "Check that your device's compass is accurate",
      text: "Some devices \u2014 especially older tablets \u2014 have an unreliable magnetic compass. Before trusting compass bearings, verify yours: stand still away from metal and electronics, point the top of the device toward a landmark whose direction you already know (for example due north, or a tower on a known bearing), and look at the on-screen bearing line. If it points within about 15 degrees of the true direction, the compass is good enough to use. If it is off by more than that, or the line wanders, do not rely on it \u2014 walk a short distance so the GPS heading is used instead, or enter the bearing by hand.", linkName: "", linkUrl: "" },
    { subheading: "Compass readings jump around or look wrong",
      text: "Move away from metal and electronics (vehicles, railings, speakers, magnets, magnetic phone mounts and cases), which distort the magnetometer. Wave the phone in a wide figure-8, turning as you go, before your first bearing and whenever the line looks wrong; it takes five seconds and resets the compass. Near a vehicle, use the \"Walk toward the signal\" method (Instructions page, under Submitting a Location & Bearing; Getting Started, step 2) so the GPS heading is used instead of the compass.", linkName: "", linkUrl: "" },
    { subheading: "The app didn't warn me, but the compass was wrong",
      text: "On iPhone the app is told how accurate the compass is and warns you. On Android no browser is given that figure, so the app can only notice the compass disagreeing with the phone's gyroscope while the phone moves. A phone held still or lying on a car body, a truck bed or a steel table can read wrong and steady, and nothing can see that. Treat the warnings as help, not a guarantee: step away from metal, wave the phone in a wide figure-8, turning as you go, and check the line against a direction you already know.", linkName: "", linkUrl: "" },
    { subheading: "\u201cThis phone can\u2019t check its own compass\u201d (Android)",
      text: "Some Android phones (the Moto G Play, for example) have a compass but no gyroscope. The app checks the compass against the gyroscope, so on these phones it can\u2019t warn you when the reading is off. It says so once per hunt, and the compass line shows \u201c\u00b7 unchecked\u201d. Before taking bearings, step away from vehicles and metal and wave the phone in a wide figure-8, turning as you go. Then point it in a direction you know and check that the compass agrees, or check it with a hand compass. For the best bearings, walk 60\u201390 ft straight toward the signal; the compass line at the lower left of the map changes to \u201cGPS heading\u201d once GPS is supplying the bearing. To check the compass, keep pointing the same way when you stop: after a few seconds the line switches back to the compass, and the two readings should agree.", linkName: "", linkUrl: "" },
    { subheading: "iPhone: the walk-to-use-GPS-heading feature needs a jog",
      text: "Apple's iOS reports speed and position to web pages more slowly than Android, so at a normal walking pace an iPhone won't build a usable GPS heading before you have walked too far. This is an iOS limitation, not the app. On iPhone the feature still works at a jog or faster and is genuinely useful at driving speeds (where the compass is unreliable anyway). At walking speed on an iPhone, use the compass \u2014 after checking that it is accurate \u2014 or enter the bearing by hand.", linkName: "", linkUrl: "" },
    { subheading: "No probable area appears, though I have two or more bearings",
      text: "The area needs bearings taken from different places. Two bearings from within about 30 m (100 ft) of each other aren\u2019t used together \u2014 GPS wobble makes their crossing meaningless \u2014 and bearings that point away from each other never cross ahead of you. Move at least 30 m across the direction of the signal, take another bearing, and the area appears. Close in on the fox, follow the bearing lines." },
    { subheading: "Drive opens Google Maps but asks for a start location (Android)",
      text: "Drive gives Google Maps only the destination; Maps finds where you are by itself, using its own location permission. If you answered Maps\u2019 question with \u201cOnly this time\u201d, it may show \u201cChoose start location\u201d instead of a route. Tap the back arrow and the route starts from Your location. To stop the question coming back, choose \u201cWhile using the app\u201d the next time Maps asks, or set it in Android Settings \u203a Apps \u203a Maps \u203a Permissions \u203a Location (names vary by phone).", linkName: "", linkUrl: "" },
    { subheading: "The map is blank but your location dot shows",
      text: "You are outside the area this site's map covers. A notice on the map names the area and its outline is drawn; your position and bearings still work, but map detail exists only inside that outline. Zoom out to see where you are relative to it. The area's name is also shown at the top of the Download / View Offline Maps panel.", linkName: "", linkUrl: "" },
    { subheading: "The map is blank offline",
      text: "Map tiles only cache for areas you have viewed while online. Before heading into weak coverage, open the hunt area once with a connection and pan around so the tiles are stored.", linkName: "", linkUrl: "" },
    { subheading: "You can't see other people's markers",
      text: "Everyone must join the same hunt name. Confirm the spelling with the hunt organizer. Hunt names are not case-sensitive \u2014 they are always stored in capitals \u2014 but the spelling must match.", linkName: "", linkUrl: "" },
    { subheading: "A red number is stuck on the Submit button",
      text: "That is your offline queue \u2014 readings waiting to send. It clears on its own once you are back online and they finish uploading.", linkName: "", linkUrl: "" },
    { subheading: "The app didn't update to the newest version",
      text: "After a new version is deployed, tap the \"New version available\" banner if it appears, or reload the page. If it still looks old, fully close the browser tab and open the site again.", linkName: "", linkUrl: "" },
    { subheading: "Your username was rejected",
      text: "Use only letters, numbers, hyphens, and underscores; some words are blocked (such as profane words). Your name only needs to be unique within an active hunt.", linkName: "", linkUrl: "" }
  ]

};
