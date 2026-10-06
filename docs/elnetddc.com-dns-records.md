# DNS records for `elnetddc.com`

Exported from Wix DNS (before leaving Wix).  
In Wix this domain **redirects to the primary** (`ddc.co.il`). Registered / renewed via Wix.

**Current nameservers (Wix):** `ns0.wixdns.net`, `ns1.wixdns.net`

---

## A (Host)

| Host | Value | TTL |
|------|-------|-----|
| `elnetddc.com` | `185.230.63.171` | 1 Hour |
| `elnetddc.com` | `185.230.63.186` | 1 Hour |
| `elnetddc.com` | `185.230.63.107` | 1 Hour |

### Website-related A records (Wix)

| Host | Value | Notes |
|------|-------|-------|
| `elnetddc.com` | `185.230.63.171` | Wix |
| `elnetddc.com` | `185.230.63.186` | Wix |
| `elnetddc.com` | `185.230.63.107` | Wix |

---

## CNAME (Aliases)

| Host | Value | TTL |
|------|-------|-----|
| `www.elnetddc.com` | `cdn1.wixdns.net` | 1 Hour |

### Website-related CNAME (Wix)

| Host | Value | Notes |
|------|-------|-------|
| `www.elnetddc.com` | `cdn1.wixdns.net` | Wix CDN |

---

## TXT (Text)

*(None listed in the export.)*

---

## MX (Mail Exchange) — Google

| Host | Points to | Priority | TTL |
|------|-----------|----------|-----|
| `elnetddc.com` | `aspmx.l.google.com` | 10 | 1 Hour |
| `elnetddc.com` | `alt1.aspmx.l.google.com` | 20 | 1 Hour |
| `elnetddc.com` | `alt2.aspmx.l.google.com` | 30 | 1 Hour |
| `elnetddc.com` | `alt3.aspmx.l.google.com` | 40 | 1 Hour |
| `elnetddc.com` | `alt4.aspmx.l.google.com` | 50 | 1 Hour |

**Keep these** if this domain still receives mail.  
Note: priorities differ from the usual Google defaults on `ddc.co.il` (10/20/30/40/50 here vs 1/5/5/10/10 there) — recreate exactly as above unless Google Admin says otherwise.

---

## NS (Name Servers)

| Host | Value | TTL |
|------|-------|-----|
| `elnetddc.com` | `ns0.wixdns.net` | 1 Day |
| `elnetddc.com` | `ns1.wixdns.net` | 1 Day |

---

## SRV

*(None listed in the export.)*

---

## Notes

- Domain is **managed by Wix** (has a Wix renewal date). Moving fully off Wix means a **domain transfer** out of Wix, then recreate these DNS records at the new registrar.
- If it only needs to keep redirecting to `ddc.co.il`, after cutover you can point it with a redirect/forwarding rule or a simple Firebase/hosting redirect instead of a full Wix site.
