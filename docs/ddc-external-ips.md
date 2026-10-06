# DDC external IPs & host map

Source: owner handoff PDF (“IP חיצוני” / external IPs for Control Applications).  
Original PDF kept locally at `docs/private/IP-external-original.pdf` (**gitignored** — contains passwords).

This is an **internal network inventory**: which public IP and hostname map to which device/service on site. It complements the DNS export in [ddc.co.il-dns-records.md](./ddc.co.il-dns-records.md). Some values may be older than the current Wix DNS snapshot — treat DNS as live truth, this file as “what the company meant each host for.”

---

## What the document is

| Column idea | Meaning |
|-------------|--------|
| **Device / note (Hebrew)** | What sits behind the address (demo PQ panel, SuperBrain at entrance, Kobi’s PC, etc.) |
| **Internal IP** | LAN address (`192.168.47.x`) inside the office/factory network |
| **External IP** | Public IP on the internet (what DNS A records should point to) |
| **Hostname** | `*.ddc.co.il` name used to reach that service |

Also includes a short note on office router/DHCP, plus **separate legacy hosting** notes for old `getelnet.com` / Bluehost (not the current Wix/Firebase sites).

---

## Public IP ↔ hostname ↔ role

| External IP | Hostname(s) | Internal IP | Notes (from PDF) |
|-------------|-------------|-------------|------------------|
| `212.235.63.33` | `demo.ddc.co.il` | `192.168.47.253` | Kobi PC (dev) / related |
| `212.235.63.34` | `elnet.ddc.co.il`, `gr.ddc.co.il`, `pq.ddc.co.il` | `192.168.47.254` | Color PQ at entrance |
| `212.235.63.35` | `pqdin.ddc.co.il` | `192.168.47.244` | PQDIN |
| `212.235.63.32` | `vero.ddc.co.il` | `192.168.47.243` | VeroPoint |
| `194.90.228.40` | `dorondp.ddc.co.il` | `192.168.47.249` | DigiPoint Doron |
| `194.90.228.41` | `superbrain.ddc.co.il`, `sb.ddc.co.il` | `192.168.47.250` | SuperBrain at entrance |
| `194.90.228.42` | `lt.ddc.co.il` | `192.168.47.251` | LT at entrance |
| `194.90.228.43` | `uniart.ddc.co.il` | `192.168.47.252` | Kobi PC (server) |
| `82.166.126.176` | `mc.ddc.co.il` | `192.168.47.248` | MC at entrance |
| `82.166.126.177` | `pavel.ddc.co.il` | `192.168.47.247` | Pavel |
| `82.166.126.178` | `pqtest.ddc.co.il` | `192.168.47.246` | PQ test |
| `82.166.126.179` | `test.ddc.co.il`, `doron.ddc.co.il` | `192.168.47.245` | Test / Doron |

Also mentioned as external (less detail in the table): `212.235.91.172`.

### LAN / router note (from PDF)

- Router: `192.168.33.254`
- Mask: `255.255.0.0`
- DHCP: `192.168.33.1`–`250`
- Block: `192.168.48.xxx`

---

## Compared to current Wix DNS

Many of the same hostnames appear in [ddc.co.il-dns-records.md](./ddc.co.il-dns-records.md). When moving DNS off Wix:

1. **Keep** these subdomain A records (they are real services, not the marketing site).
2. **Only change** apex `ddc.co.il` + `www` when cutting the public website over to Firebase.
3. If PDF IP ≠ current DNS IP for a host, verify with the owner before editing — DNS may have been updated since the PDF.

---

## Other pages in the same PDF (legacy — not current DDC site)

The PDF also documents older **Bluehost / CheapDomain / WordPress** accounts for `getelnet.com` / `getplcio.com`, and an old `ddc.co.il/wp-admin` login.

Those credentials are **not** stored in this tracked file. See gitignored:

- `docs/private/legacy-hosting-credentials.md`
- `docs/private/IP-external-original.pdf`

**Security:** those passwords are long-lived and were shared in a PDF — rotate them if those accounts still exist, and do not commit `docs/private/` to git.
