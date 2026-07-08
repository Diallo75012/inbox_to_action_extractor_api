# Inbox Action Rules

The deterministic extractor is the source of truth. It uses configurable keyword lists and caps from `src/constants.ts`.

* Task signals include request and follow-up language such as `please`, `can you`, `send`, `review`, `approve`, and `schedule`.
* Urgency is based on bounded keyword signals such as `urgent`, `asap`, `deadline`, and `critical`.
* Calendar suggestions are extracted from calendar-related wording, numeric dates, weekday words, and simple times.
* Numeric `MM/DD/YYYY` or `MM-DD-YYYY` dates are returned as `DD/MM/YYYY`.
* No output is verified, sent, scheduled, or synced to a mailbox/calendar.
