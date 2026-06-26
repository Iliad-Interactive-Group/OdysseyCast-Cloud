# Plugin Outlier Patterns (Accepted Practices)

This bucket intentionally supports non-standard app shapes that do not fit the default Next.js + `@iliad/*` cloud app model.

## Included Outliers

1. **Airwave Player** (`apps/radio-content-creation/plugins/airwave-player/`)
   - Runtime: WordPress/PHP plugin
   - Delivery: Installed into WordPress plugin directories
   - Integration: Shortcode + optional footer injection + REST metadata bridge

2. **Proxy API Connector** (pattern)
   - Runtime: lightweight API relay for plugin-safe metadata/cross-origin access
   - Delivery: deployable as a small standalone service
   - Integration: plugin consumes normalized JSON contract

## Required Standards (Even for Outliers)

- Keep secrets out of repo (`.env.local`, host-managed secret stores only)
- Prefer documented contract interfaces for app↔plugin communication
- Support safe degradation (plugin keeps playing even if metadata endpoint fails)
- Keep integrations tenant-aware when a tenant context is available
- Add migration notes and ownership docs when absorbing external repos

## Recommended Layout

- `README.md` — install/use docs for product teams
- `INTEGRATION.md` — API contract and host integration details
- `CHANGELOG.md` — versioned behavior changes
- Optional test harness (`test-*.html`, local mock endpoints)

## Why This Exists

Most HomerDev apps are strict Hub & Spoke Next.js services. Plugin work is a sanctioned exception category, but exceptions still need consistent governance and documentation.
