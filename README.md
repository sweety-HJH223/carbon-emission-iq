# 🌍 CarbonIQ

**Know your earth debt. Track it. Reduce it.**

🔗 Live: [carbon-emission-iq.vercel.app](https://carbon-emission-iq.vercel.app)
💻 Code: [github.com/sweety-HJH223/carbon-emission-iq](https://github.com/sweety-HJH223/carbon-emission-iq)

So this is a carbon footprint tracker, but I tried to build the version I'd actually want to use — not another form with five dropdowns asking me to pick "transport type" and "distance unit." You just type what you did. "Drove 45km in a bus and ate 1kg of beef." AI figures out the rest.

---

## What vertical I picked

Carbon Footprint Awareness Platform. The brief was basically: help people understand, track, and reduce their footprint without it feeling like homework.

My honest starting point was — most carbon trackers die at the input step. Nobody wants to fill out a form every time they eat lunch. So I spent most of my effort making the *typing it in* part as low-friction as possible, and let AI absorb the complexity instead of the user.

---

## How I approached it

The big decision early on was whether to build this as a 3-agent pipeline (one agent scans input, one calculates, one gives advice) or just one smart prompt doing everything.

I went with one prompt. Three agents sounded more "impressive" on paper, but it meant 3x the API calls on a free-tier key with rate limits — and more places for something to silently break. So instead, one Gemini call does all of it in a single pass:

- reads what you typed (or the bill photo you uploaded)
- pulls out the activity, quantity, and unit
- runs it against a table of emission factors I baked into the prompt (calibrated loosely for India — petrol, electricity, food, flights, etc.)
- hands back the CO2 number, a tip, and a comparison that's actually relatable, like "= 50 phone charges" instead of just a bare number

If the AI isn't confident about what it read (this happens more with photos than text), it doesn't just save garbage data — it shows you what it detected and asks you to confirm before anything touches the database. That one decision alone saved me from a bunch of weird edge cases later.

Once the basic loop worked, I kept adding things that made the *feeling* of carbon tracking less abstract:

- a homepage clock that ticks up your "Earth Debt" in real rupees, live, while you're just sitting there reading
- a Carbon Passport page that's deliberately dark and terminal-styled — completely different from the rest of the app, on purpose, because it should feel different
- a 10-year projection chart showing two versions of you: one who ignores this, one who doesn't
- a daily challenge that's actually personalized — it looks at your real logged activities, finds whatever category you're worst at, and gives you one specific thing to do about it today

---

## How it actually works, technically

```
You type something or upload a photo
        ↓
hits /api/analyze or /api/scan
        ↓
lib/gemini.ts calls Gemini 2.0 Flash
   → extracts the activity + quantity
   → applies the right emission factor
   → returns CO2, a calculation breakdown, a tip, a comparison
        ↓
if Gemini isn't sure → you confirm it first
if it's confident → saves straight to Firestore
        ↓
your streak, total CO2, and badges update automatically
        ↓
Dashboard / Passport / Challenges pages
just read real data back from Firestore — 
nothing on those pages is hardcoded
```

Stack-wise: Next.js, Tailwind, Firebase (auth + Firestore), Gemini 2.0 Flash for the AI part, Recharts for the graphs, deployed on Vercel.

The daily challenge works the same logic — it pulls your last 10 logs, figures out where you're emitting the most, and asks Gemini for one specific challenge targeting exactly that, not a random tip from a list.

---

## Assumptions I made (and a couple things I deliberately didn't do)

- I used average India-wide emission factors (like 0.82 kg CO2/kWh for electricity) instead of state-specific grid data. That level of precision felt out of scope for the time I had.
- If the AI isn't confident about what it read, I don't auto-save it. I'd rather make someone tap "confirm" once than quietly log a wrong number into their carbon history forever.
- I originally had an idea to link out to real Indian NGOs for carbon offsetting (plant a tree, fund solar, etc.) but pulled it before submitting. Listing specific organizations without their knowledge felt like it could read as an unverified endorsement, and that wasn't a tradeoff worth making for one extra feature.
- I assumed people think in terms of "today" and "yesterday," not exact 24-hour windows — so streaks reset on calendar days, not rolling time.
- Went with one AI call instead of a multi-agent setup, mostly because I was running on a free Gemini key and didn't want three API calls failing independently every time someone logged an activity.

---

## A genuinely honest note

I want to be upfront that the build wasn't smooth. I spent a confusing chunk of time on Firebase auth silently failing, then found out a CSP header I'd added was quietly blocking Google's own login script, then discovered my Gemini API key was a newer format that the SDK didn't expect, and then hit a rate limit that needed two actual days to clear before I could test again. None of that is fun to debug, and none of it shows up in the final product — but it's real, and it's in the commit history if anyone wants to see it.

It works now though. Real AI, real database, real login. Not a demo with placeholder data sitting underneath.

---

## Running it locally

```bash
git clone https://github.com/sweety-HJH223/-carbon-emission-iq.git
cd carbon-emission-iq
npm install
```

Add a `.env.local`:
```
GEMINI_API_KEY=your_gemini_key
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

```bash
npm run dev
```

---
## 👩‍💻 Built By
**SweetyCodes** — [sweetycodes-jh.vercel.app](https://sweetycodes-jh.vercel.app/)
