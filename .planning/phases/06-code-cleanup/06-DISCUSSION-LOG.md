# Phase 6: code-cleanup - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-18
**Phase:** 06-code-cleanup
**Areas discussed:** Standar Dokumentasi, Penggunaan MUI, Struktur File, Pola Modern

---

## Standar Dokumentasi

| Option | Description | Selected |
|--------|-------------|----------|
| Full (Semua fungsi) | Minimum: function export, parameter types. Maximum: full JSDoc + inline comments | |
| API + Kompleks | Hanya API functions + complex logic (calculation, data transformation) | ✓ |
| Tidak perlu | Tinggalkan seperti sekarang — tidak perlu dokumentasi tambahan | |

**User's choice:** API + Kompleks
**Notes:** Fokus pada API functions dan logika kompleks (perhitungan, transformasi data). CRUD sederhana tidak perlu dokumentasi penuh.

---

## Penggunaan MUI

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal (Chart saja) | Hanya untuk chart dan statistik — 其余用自定义组件 | ✓ |
| Medium (Forms + Dialog) | Gunakan MUI untuk form dan dialog — 其余用自定义 | |
| Tetap MUI penuh | Tetap gunakan MUI sepenuhnya seperti sekarang | |

**User's choice:** Minimal (Chart saja)
**Notes:** MUI hanya untuk @mui/x-charts. Komponen lain (button, form, dialog, card) gunakan custom components. DataGrid yang sudah ada boleh tetap.

---

## Struktur File

| Option | Description | Selected |
|--------|-------------|----------|
| Buat komponen UI | Buat komponen reusable di src/components/ui (Button, Card, Input) | |
| Lewati komponen baru | Tidak perlu komponen baru — fokus pada cleanup kode yang ada | |
| Hybrid | Gabungan: cleanup yang ada + komponen baru jika diperlukan | ✓ |

**User's choice:** Hybrid
**Notes:** Fokus cleanup kode yang ada dulu, buat komponen baru hanya jika mengurangi duplikasi. Tidak perlu membuat komponen UI baru untuk segalanya.

---

## Pola Modern

| Option | Description | Selected |
|--------|-------------|----------|
| Ya — standarisasi | 统一错误处理、加载状态、hooks — 减少重复代码 | |
| Tidak perlu | Biarkan seperti sekarang — tidak perlu pattern baru | |
| Sesuai kebutuhan | Buat pattern baru hanya untuk hal-hal yang sering dipakai | ✓ |

**User's choice:** Sesuai kebutuhan
**Notes:** Buat standardized patterns (error handling, loading states) hanya untuk pola yang sering digunakan. Tidak perlu refactoring besar-besaran.

---

## Agent's Discretion

- Specific file-by-file cleanup decisions — delegate to planner/researcher based on code analysis
- Which existing files need JSDoc vs which are already clean
- Whether specific components warrant custom replacements vs keeping MUI

## Deferred Ideas

None mentioned during discussion.