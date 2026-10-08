# Price Watch Setup — Quick Reference

## What to provide when requesting a price watch

Tell the agent (or fill this template) with **exactly these fields**:

```yaml
# --- Watch Contract ---
name: <short slug e.g. "sony-wh1000xm5-black">
type: product | flight | hotel | listing | ticket

# Item identification (be specific enough that no two variants confuse)
item:
  title: <full product/listing name>
  url: <exact product page URL>
  variant: <color / size / edition / cabin class / room type>
  quantity: 1
  condition: new | used | refurbished | n/a
  seller: <Amazon, Best Buy, direct, etc. or "any authorized">
  location: <for flights/hotels: origin-dest, city>
  dates: <for time-bound items: check-in/check-out, travel dates>

# Alert condition
alert:
  currency: USD | EUR | GBP | ...
  target_price: <number — what "below" triggers the alert>
  price_basis: all_in | pre_tax  # include shipping? taxes? fees?
  availability: in_stock | any | refundable_only | n/a
  cooldown_hours: 24  # don't re-alert for the same offer
  notify: chat | bot-chat | email | local

# Optional: acceptable substitutes
substitutes:
  - <variant/color the user would also accept>
```

## Example — complete setup prompt

> "Set up a price watch for me:
> - **Item:** Sony WH-1000XM5 wireless headphones, **black**, **new**, from Amazon.com
> - **URL:** https://amazon.com/dp/B09Y1RG8M3 (verify this is the black variant)
> - **Target:** all-in price below $280 (currently ~$348)
> - **Currency:** USD
> - **Alert when:** price drops below target AND in stock
> - **Check:** every 6 hours
> - **Notify me in:** this chat"

## Example — flight

> "Watch: round-trip MCO → CDG, Nov 12–22, 2026, economy, 1 adult
> - **Target:** all-in (taxes + bags) under $450
> - **Source:** Google Flights / Kayak
> - **Alert only:** non-stop preferred, 1-stop max 2hr layover
> - **Re-check:** every 6h
> - **Stop watching if:** price rises above $600"

## Example — hotel

> "Watch: Hotel Le Marais, Paris, single queen room, Dec 20–23
> - **Target:** refundable rate under €180/night all-in
> - **Source:** hotel direct booking page
> - **Alert:** if available at target (stock watch, not just price)
> - **Cooldown:** 12h"

## How the agent uses this

1. Reads your item + condition
2. Fetches one live baseline via `web_extract` or `browser_exec`
3. Confirms the fetch works → writes `~/.hermes/price-watches/<slug>.json`
4. Creates a cron job with the product-price-monitor skill prompt
5. From then on: every tick compares vs. your target, suppresses duplicates

## Common mistakes to avoid

- **Vague item:** "Sony headphones" — which model? which color? Amazon or Best Buy?
- **Base vs. all-in:** "$280 target" but shipping is $15 → actual $295 → never alerts
- **No URL:** the agent will search and may pick the wrong variant
- **Aggressive cadence:** <1h risks blocking/CAPTCHA on shopping sites
- **Substitutes confusion:** two variants mixed in one watch = never know which triggered
