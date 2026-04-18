# 04-UAT.md — Phase 4 Feature Additions

## Test Summary

| Test | Feature | Expected Result | Status |
|------|---------|------------------|--------|
| 1.1 | Toggle Switch - Units | Toggle bisa ubah status unit (Aktif/Nonaktif) | ⬜ |
| 1.2 | Edit Button - Units | Klik → modal edit opens dengan data | ⬜ |
| 1.3 | Status Badge - Units | 显示 Aktif/Nonaktif sesuai isDeleted | ⬜ |
| 2.1 | Toggle Switch - Plasmas | Toggle bisa ubah status plasma | ⬜ |
| 2.2 | Edit Button - Plasmas | Klik → modal edit opens dengan data | ⬜ |
| 2.3 | Status Badge - Plasmas | 显示 Aktif/Nonaktif sesuai isDeleted | ⬜ |
| 3.1 | Toggle Switch - Cycles | Toggle bisa ubah status siklus (Aktif/Selesai) | ⬜ |
| 3.2 | Edit Button - Cycles | Klik → modal edit opens dengan data | ⬜ |
| 3.3 | Status Badge - Cycles | 显示 Aktif/Selesai sesuai status | ⬜ |
| 4.1 | Edit Button - Users | Klik → modal edit opens dengan data | ⬜ |
| 4.2 | Toggle - Users | Sudah ada ( Activate/Deactivate) | ⬜ |
| 5.1 | RBAC stopPropagation | Klik toggle/edit tidak doble selection | ⬜ |

## Detailed Test Cases

### 1. Units Page

#### Test 1.1: Toggle Switch
- **Step**: Klik switch di kolom "Aksi"
- **Expected**: Status berubah dari Aktif ke Nonaktif atau sebaliknya
- **Result**: ⬜

#### Test 1.2: Edit Button
- **Step**: Klik icon edit di kolom "Aksi"
- **Expected**: Modal terbuka dengan data unit terisi
- **Result**: ⬜

#### Test 1.3: Status Badge
- **Step**: Lihat kolom "Status"
- **Expected**: 显示 Chip "Aktif" (hijau) atau "Nonaktif" (abu)
- **Result**: ⬜

---

### 2. Plasmas Page

#### Test 2.1: Toggle Switch
- **Step**: Klik switch di kolom "Aksi"
- **Expected**: Status berubah dari Aktif ke Nonaktif atau sebaliknya
- **Result**: ⬜

#### Test 2.2: Edit Button
- **Step**: Klik icon edit di kolom "Aksi"
- **Expected**: Modal terbuka dengan data plasma terisi
- **Result**: ⬜

#### Test 2.3: Status Badge
- **Step**: Lihat kolom "Status"
- **Expected**: 显示 Chip "Aktif" (hijau) atau "Nonaktif" (abu)
- **Result**: ⬜

---

### 3. Cycles Page

#### Test 3.1: Toggle Switch
- **Step**: Klik switch di kolom "Aksi"
- **Expected**: Status berubah dari Aktif ke Selesai atau sebaliknya
- **Result**: ⬜

#### Test 3.2: Edit Button
- **Step**: Klik icon edit di kolom "Aksi"
- **Expected**: Modal terbuka dengan data siklus terisi
- **Result**: ⬜

#### Test 3.3: Status Badge
- **Step**: Lihat kolom "Status"
- **Expected**: 显示 Chip "Aktif" (hijau) atau "Selesai" (biru)
- **Result**: ⬜

---

### 4. Users Page

#### Test 4.1: Edit Button
- **Step**: Klik icon edit di kolom "Aksi"
- **Expected**: Modal terbuka dengan data user terisi
- **Result**: ⬜

#### Test 4.2: Toggle (Already Existing)
- **Step**: Lihat kolom "Status" 
- **Expected**: Sudah ada toggle untuk activate/deactivate
- **Result**: ⬜

---

### 5. RBAC Manager

#### Test 5.1: stopPropagation
- **Step**: Klik toggle/user di row, lihat apakah row kehilangi
- **Expected**: Tidak ada row selection doble
- **Result**: ⬜

---

## Test Results Summary

| Passed | Failed | Pending |
|--------|--------|---------|
| 0 | 0 | 12 |

---

## Notes

- Build: ✅ SUCCESS (committed: 1ce3a49)
- Deployed: main branch
- Date: 2026-04-18