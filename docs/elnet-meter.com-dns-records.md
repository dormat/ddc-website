# DNS records for `elnet-meter.com`

Exported from Wix DNS (before leaving Wix).  
Primary domain for the English **Control Applications** / ElNet Wix site. Registered / renewed via Wix.

**Current nameservers (Wix):** `ns0.wixdns.net`, `ns1.wixdns.net`

---

## A (Host)

| Host | Value | TTL |
|------|-------|-----|
| `elnet-meter.com` | `185.230.63.171` | 1 Hour |
| `elnet-meter.com` | `185.230.63.186` | 1 Hour |
| `elnet-meter.com` | `185.230.63.107` | 1 Hour |

### Website-related A records (Wix)

| Host | Value | Notes |
|------|-------|-------|
| `elnet-meter.com` | `185.230.63.171` | Wix |
| `elnet-meter.com` | `185.230.63.186` | Wix |
| `elnet-meter.com` | `185.230.63.107` | Wix |

---

## CNAME (Aliases)

| Host | Value | TTL |
|------|-------|-----|
| `en.elnet-meter.com` | `cdn1.wixdns.net` | 1 Hour |
| `es.elnet-meter.com` | `cdn1.wixdns.net` | 1 Hour |
| `www.elnet-meter.com` | `cdn1.wixdns.net` | 1 Hour |

### Website-related CNAMEs (Wix)

| Host | Value | Notes |
|------|-------|-------|
| `www.elnet-meter.com` | `cdn1.wixdns.net` | Wix CDN |
| `en.elnet-meter.com` | `cdn1.wixdns.net` | Wix language / locale host |
| `es.elnet-meter.com` | `cdn1.wixdns.net` | Wix language / locale host |

---

## TXT (Text)

*(None listed in the export.)*

---

## MX (Mail Exchange)

*(No MX records in the export — mail for this domain may be unused, or handled elsewhere.)*

---

## NS (Name Servers)

| Host | Value | TTL |
|------|-------|-----|
| `elnet-meter.com` | `ns0.wixdns.net` | 1 Day |
| `elnet-meter.com` | `ns1.wixdns.net` | 1 Day |

---

## SRV

*(None listed in the export.)*

---

## Notes

- Domain is **managed by Wix**. Moving fully off Wix means a **domain transfer** out of Wix, then recreate DNS at GoDaddy (or wherever you choose).
- At website cutover, replace apex A + `www` / `en` / `es` CNAMEs with the new host’s records (or redirects to `ddc.co.il` / Firebase if this site is being retired).
- Confirm the exact registered spelling in Wix/WHOIS (`elnet-meter.com` vs `el-net-meter.com`) before starting a transfer.
