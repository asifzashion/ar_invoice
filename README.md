# MIT AR Tracker — Mannai Infotech

A React + TypeScript + Tailwind CSS application for tracking Accounts Receivable invoices with Camunda 8 BPMN workflow integration.

## Features

- **Role-based dashboard** — Admin, AR Team, CMD Finance, Business Unit, Viewer
- **Invoice entry** — Enter invoice number → auto-fetch project details from Excel (Columns A–H)
- **Camunda 8 BPMN workflow** — Start process, assign tasks, complete with variables (mock + real)
- **AR verification** — Accept/reject with comments, email notification
- **Submission tracking** — Email, Messenger, or Customer Portal channels
- **CMD follow-up** — Add comments, assign tasks to BU team with due dates
- **BU resolution** — Update status, close tasks, add technical comments
- **Analytics** — Status distribution (pie), balance by customer (bar), days late, channels
- **My Assignments** — Role-specific task list with priority and overdue indicators
- **Excel upload** — Upload .xlsx master data file (Columns A–H)
- **Activity feed** — Real-time timeline of all actions

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5173 and select a user role to log in.

## Environment Variables

Create a `.env` file in the project root:

```env
# Camunda 8 REST API base URL (leave blank to use mock)
VITE_CAMUNDA_URL=http://localhost:8080

# Set to 'false' to use real Camunda API
VITE_USE_MOCK=true
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript |
| Styling | Tailwind CSS v4 |
| Components | Radix UI primitives |
| Charts | Recharts |
| State | Zustand (with localStorage persistence) |
| Excel parsing | SheetJS (xlsx) |
| BPMN engine | Camunda 8 REST API (mock included) |
| Build | Vite |

## Project Structure

```
src/
├── components/
│   ├── layout/       # Sidebar, Header
│   └── ui/           # Badge, Button, Card, Modal, Input, Avatar, StatusBadge
├── data/
│   └── mockData.ts   # Sample invoices, tasks, activity, users
├── lib/
│   ├── utils.ts      # Formatting, status config, helpers
│   ├── excelParser.ts # SheetJS Excel parsing
│   └── camundaMock.ts # Camunda 8 REST API (mock + real)
├── pages/
│   ├── LoginPage.tsx
│   ├── Dashboard.tsx
│   ├── InvoiceList.tsx
│   ├── InvoiceDetail.tsx
│   ├── EnterInvoice.tsx
│   ├── MyAssignments.tsx
│   ├── Analytics.tsx
│   ├── DataManagement.tsx
│   └── UsersPage.tsx
├── store/
│   └── useStore.ts   # Zustand store
└── types/
    └── index.ts      # TypeScript types
```

## User Roles

| Role | Access |
|------|--------|
| Account Admin | Full access — enter invoices, upload Excel, manage users |
| AR Submission Team | Verify invoices, accept/reject, mark submission channel |
| CMD Finance | Follow-up status, comments, assign tasks to BU |
| Business Unit | Resolve technical issues, update status |
| Viewer (PM/Ops) | Read-only dashboards and invoice details |

## Excel Format

Upload a `.xlsx` file with this column structure (Row 1 = headers):

| Column | Field |
|--------|-------|
| A | Invoice Number |
| B | Customer ID |
| C | Customer Name |
| D | Transaction Date |
| E | Purchase Order |
| F | Project ID |
| G | Project Description |
| H | PM Name |

Columns I onward are ignored — all tracking is managed within the app.

## Camunda 8 Integration

The app includes a mock Camunda service (`src/lib/camundaMock.ts`) that:
- Simulates `startProcess`, `getUserTasks`, `completeTask`, `sendNotification`
- Logs all calls to the browser console
- Can be switched to real Camunda 8 REST API by setting `VITE_USE_MOCK=false`

For real Camunda 8, configure:
1. Deploy the BPMN process `ar-invoice-workflow`
2. Set `VITE_CAMUNDA_URL` to your Camunda 8 instance URL
3. Add authentication headers in `camundaMock.ts`

## Build for Production

```bash
npm run build
```

Output is in `dist/`. Deploy to Vercel, Netlify, or any static host.
