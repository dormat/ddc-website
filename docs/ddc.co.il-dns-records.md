# DNS records for `ddc.co.il`

Exported from Wix DNS (before leaving Wix).  
**Do not delete MX / SPF / subdomain A records** when pointing the website to Firebase — only change website-related A/CNAME for the root and `www`.

**Current nameservers (Wix):** `ns0.wixdns.net`, `ns1.wixdns.net`

---

## A (Host)

| Host | Value | TTL |
|------|-------|-----|
| `ddc.co.il` | `185.230.63.171` | 1 Hour |
| `ddc.co.il` | `185.230.63.186` | 1 Hour |
| `ddc.co.il` | `185.230.63.107` | 1 Hour |
| `billing.ddc.co.il` | `82.166.126.178` | 1 Hour |
| `billing2.ddc.co.il` | `82.166.126.178` | 1 Hour |
| `c.ddc.co.il` | `82.166.126.178` | 1 Hour |
| `demo1.ddc.co.il` | `82.166.126.178` | 1 Hour |
| `demo2.ddc.co.il` | `82.166.126.178` | 1 Hour |
| `demo3.ddc.co.il` | `82.166.126.178` | 1 Hour |
| `doron.ddc.co.il` | `82.166.126.179` | 1 Hour |
| `elnet.ddc.co.il` | `212.235.63.34` | 1 Hour |
| `elnetweb.ddc.co.il` | `212.235.63.33` | 1 Hour |
| `ftp.ddc.co.il` | `62.219.78.159` | 1 Hour |
| `gr.ddc.co.il` | `212.235.63.34` | 1 Hour |
| `hmi02.ddc.co.il` | `34.165.42.49` | 1 Hour |
| `kobi.ddc.co.il` | `212.235.63.33` | 1 Hour |
| `lt.ddc.co.il` | `194.90.228.42` | 1 Hour |
| `mail02.ddc.co.il` | `34.165.16.238` | 1 Hour |
| `mc.ddc.co.il` | `212.235.63.35` | 1 Hour |
| `oldbilling.ddc.co.il` | `82.166.126.177` | 1 Hour |
| `plc.ddc.co.il` | `212.235.63.32` | 1 Hour |
| `pq.ddc.co.il` | `212.235.63.34` | 1 Hour |
| `pqdin.ddc.co.il` | `212.235.63.35` | 1 Hour |
| `pqtest.ddc.co.il` | `82.166.126.178` | 1 Hour |
| `qr.ddc.co.il` | `37.142.76.81` | 1 Hour |
| `test.qr.ddc.co.il` | `37.142.162.9` | 1 Hour |
| `qrtest.ddc.co.il` | `37.142.162.9` | 1 Hour |
| `sb.ddc.co.il` | `194.90.228.41` | 1 Hour |
| `sim.ddc.co.il` | `62.90.182.228` | 1 Hour |
| `superbrain.ddc.co.il` | `194.90.228.41` | 1 Hour |
| `test.ddc.co.il` | `82.166.126.179` | 1 Hour |
| `qr.test.ddc.co.il` | `37.142.162.9` | 1 Hour |
| `test1.ddc.co.il` | `212.235.63.35` | 1 Hour |
| `test2.ddc.co.il` | `212.235.63.32` | 1 Hour |
| `uniart.ddc.co.il` | `194.90.228.43` | 1 Hour |
| `vero.ddc.co.il` | `212.235.63.32` | 1 Hour |
| `vpn-remote.ddc.co.il` | `34.165.50.211` | 1 Hour |

### Website-related A records (Wix — replace at cutover)

These three point the **apex** site at Wix. Replace with Firebase A records when going live:

| Host | Value | Notes |
|------|-------|-------|
| `ddc.co.il` | `185.230.63.171` | Wix |
| `ddc.co.il` | `185.230.63.186` | Wix |
| `ddc.co.il` | `185.230.63.107` | Wix |

---

## CNAME (Aliases)

| Host | Value | TTL |
|------|-------|-----|
| `mail.ddc.co.il` | `ghs.google.com` | 1 Hour |
| `4iatdcteh3iv.test1.ddc.co.il` | `gv-3vlntzj6udcb63.dv.googlehosted.com` | 1 Hour |
| `www.ddc.co.il` | `cdn3.wixdns.net` | 1 Hour |

### Website-related CNAME (Wix — replace at cutover)

| Host | Value | Notes |
|------|-------|-------|
| `www.ddc.co.il` | `cdn3.wixdns.net` | Wix CDN — replace with Firebase `www` CNAME |

Keep Google CNAMEs (`mail…`, verification) unless Google says otherwise.

---

## TXT (Text)

| Host | Value | TTL |
|------|-------|-----|
| `ddc.co.il` | `v=spf1 include:_spf.google.com ~all` | 1 Hour |

*(Google Workspace SPF — keep when moving DNS.)*

---

## MX (Mail Exchange) — Google Workspace

| Host | Points to | Priority | TTL |
|------|-----------|----------|-----|
| `ddc.co.il` | `aspmx.l.google.com` | 1 | 1 Hour |
| `ddc.co.il` | `alt1.aspmx.l.google.com` | 5 | 1 Hour |
| `ddc.co.il` | `alt2.aspmx.l.google.com` | 5 | 1 Hour |
| `ddc.co.il` | `alt3.aspmx.l.google.com` | 10 | 1 Hour |
| `ddc.co.il` | `alt4.aspmx.l.google.com` | 10 | 1 Hour |

**Keep these exactly** when moving DNS so email does not break.

---

## NS (Name Servers)

Not editable in the Wix DNS panel while using Wix DNS. Change these at the **domain registrar** when moving DNS away from Wix.

| Host | Value | TTL |
|------|-------|-----|
| `ddc.co.il` | `ns0.wixdns.net` | 1 Day |
| `ddc.co.il` | `ns1.wixdns.net` | 1 Day |

---

## SRV

*(None listed in the export.)*

---

## Cutover checklist (website only)

When pointing `ddc.co.il` at Firebase:

1. Recreate **all** subdomain A records, Google MX, SPF TXT, and Google CNAMEs at the new DNS host.
2. Remove / replace only:
   - Apex A records → `185.230.63.*` (Wix)
   - `www` CNAME → `cdn3.wixdns.net`
3. Add Firebase’s A / AAAA / TXT / `www` CNAME as shown in Firebase Hosting.
4. Leave mail and internal hosts (`billing`, `elnet`, `plc`, etc.) unchanged.
