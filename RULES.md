# UNKNW PM — Project Rules

## Business Logic

- **Balance** = billed − paid. Это долг клиента. Красный = есть долг, зелёный = settled.
- **Report** считается автоматически из task entries со статусом `done`. Нет ручного ввода отчёта.
- **Report** группирует по ролям (design 150h × £30), НЕ по исполнителям.
- **Fixed price** = название × цена × кол-во = итого. Внутри — косты (outsourcer или direct).
- **Costs** существуют ТОЛЬКО внутри fixed price items. Не отдельная сущность.
- **Outsourcer cost** = человек × ставка × часы. **Direct cost** = описание + сумма (софт, лицензии, покупки).
- **Коэффициент** на задачах — editable, влияет на расчёт (hours × coeff × rate = amount).
- **VAT** — per client toggle, не per entry. Клиент либо с VAT, либо без.
- **Estimate и Paid** — editable inline (click на число → поле ввода → Enter).

## Data Model

```
Client
├── currency (GBP / USD / EUR)
├── vat (boolean) + vatRate (%)
├── dealLead (string)
├── rates[] (role + rate per hour)
├── estimates{} (month → amount)
├── payments{} (month → amount)
│
├── Entries[] (task rows — source of truth for report)
│   ├── date, task, owner, role
│   ├── hours, coeff (editable)
│   └── status: in progress | done | submitted | pending | rejected | paused
│
├── Fixed Price Items[]
│   ├── name, month, price, qty, total (price × qty)
│   ├── paid (editable)
│   ├── status
│   └── Costs[]
│       ├── type: outsourcer | direct
│       ├── desc, amount, status (planned | spent | paid)
│       └── (outsourcer: personId, hours, rate)
│
└── Team (per client)
    ├── Assigned outsourcers (from global team)
    └── Internal — auto from entries this month

Team Member (global)
├── type: internal | outsource
├── role, email
├── costRate (outsource only)
├── createdBy (outsource only)
└── projects[] (outsource only — assigned clients)
```

## Navigation

3 раздела: **001 Clients → 002 Approvals → 003 Settings**.

Clients — dashboard с карточками (earned, owes, current month). Клик → detail с табами.

Client detail — 4 таба: **Report · Tasks · Fixed Price · Team**.

Summary stats (hours, billed, estimate, paid, owes) видны и в Report, и в Tasks.

Approvals — submitted entries от outsourcers. Approve/reject.

Settings — 3 таба: **Team** (internal + outsource, + ADD MEMBER), **Clients** (+ ADD CLIENT, VAT toggle), **Rates** (per client).

New client создаётся и на dashboard (+ NEW CLIENT), и в Settings.

## CRUD Checklist

| Сущность | Create | Read | Edit | Delete |
|----------|--------|------|------|--------|
| Client | Dashboard + Settings | Dashboard cards | Settings (VAT toggle) | — |
| Rates | Client → Team tab | Client header + Team tab | Client → Team tab | × button |
| Entry/Task | Client → Tasks → + ADD | Tasks table | coeff (click), status (dropdown) | × button |
| Fixed price | Client → FP → + NEW | FP tab | — | — |
| FP Cost | FP item → + ADD COST | Cost list | — | × button |
| FP Paid | FP item → paid stat | Click → input | Click → input | — |
| Team member | Settings → Team → + ADD | Settings table | — | × button |
| Contractor on project | Client → Team → assign dropdown | Team tab | — | REMOVE button |
| Estimate | Report → click stat | Report | Click → input | — |
| Payment | Report → click stat | Report | Click → input | — |

## UI Rules

- Числа: крупные (22px) = главные метрики, мелкие (16px) = вторичные. Разделять линией.
- Editable значения: dashed underline = можно кликнуть.
- Status: `<select>` стилизованный под цвет статуса, не статичный badge.
- Цвета: зелёный = earned/paid/settled, красный = owes/rejected, жёлтый = in progress/outsource/costs, фиолетовый = submitted/pending, серый = estimate/planned.

## Design Tokens

```
Background: #181818
Cards: #212121
Borders: #2d2d2d
Text: #f2f0ec
Muted: #505050 / #888
Accent: #FF2E1A
Green: #3BD080
Yellow: #FFB800
Purple: #818CF8
Font: Inter 300–900
Headings: uppercase, weight 800, line-height 0.92
Corners: sharp (border-radius: 0)
```

## Real Data (for testing)

**Ben** — GBP, +VAT 20%, deal lead Serge. Rates: design £30/h, code £48/h. Data Dec 2025 – Apr 2026. Internal: rozov, emir, deni. Outsource: kate m.

**Paysend** — USD, no VAT, deal lead Misha K. Rates: middle $31/h, senior $38/h, creative dir $100/h. Data Jan/Mar/Apr 2026. Internal: misha, dima. Outsource: kate m.

**deni = internal.** Не outsource.

## Stack

Current: Vite + React (single App.jsx prototype).
Target: Next.js + Supabase + Vercel. Auth: email+password для outsourcers.
