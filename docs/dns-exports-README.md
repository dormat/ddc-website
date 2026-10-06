# Domain DNS exports (Wix)

Snapshot of DNS before leaving Wix.

| Domain | File | Registered where (from Wix UI) | Role |
|--------|------|-------------------------------|------|
| `ddc.co.il` | [ddc.co.il-dns-records.md](./ddc.co.il-dns-records.md) | Third party (connected by DNS) | Primary Hebrew / main site |
| `elnetddc.com` | [elnetddc.com-dns-records.md](./elnetddc.com-dns-records.md) | Wix | Redirects to `ddc.co.il` |
| `elnet-meter.com` | [elnet-meter.com-dns-records.md](./elnet-meter.com-dns-records.md) | Wix | English ElNet / Control Applications site |

## Related

| Doc | What it is |
|-----|------------|
| [ddc-external-ips.md](./ddc-external-ips.md) | Owner handoff: public IP ↔ internal IP ↔ `*.ddc.co.il` device map (safe to keep in git) |
| [ddc.co.il-cloudflare-import.txt](./ddc.co.il-cloudflare-import.txt) | BIND zone file to import into Cloudflare (**Proxy unchecked**) |
| `docs/private/` | Original PDF + hosting passwords (**gitignored** — do not commit) |
