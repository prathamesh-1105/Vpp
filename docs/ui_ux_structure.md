# CampusOS – UI/UX & Design System Specification

This document details the interface sitemap, React Router layout schemas, component grid wireframes, and design system tokens to ensure a premium, modern user experience.

---

## 🎨 Visual Identity & Design System Tokens

CampusOS uses a futuristic, high-contrast dark theme alongside an elegant glassmorphism palette. This ensures visual premium feedback and keeps students engaged.

### 1. Typography & Core Google Font
* **Primary Sans-Serif Font**: **Outfit** (configured via Google Fonts). Clean, open-faced geometric shapes ideal for high-tech SaaS dashboards.
* **Secondary Monospace Font**: **JetBrains Mono** (for tables, slot indices, and numeric GPA metrics).

### 2. Custom Tailwind CSS Color Palette Config
```javascript
// tailwind.config.js - Colors & Tokens
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#0B0D19',        -- Deep rich midnight dark
          card: 'rgba(20, 24, 48, 0.65)', -- Glassmorphic dark card overlay
          border: 'rgba(255, 255, 255, 0.08)',
          glow: 'rgba(99, 102, 241, 0.15)',  -- Indigo glow boundary
          textPrimary: '#F3F4F6',
          textSecondary: '#9CA3AF'
        },
        accent: {
          indigo: '#6366F1',     -- Core focus, triggers and selections
          violet: '#8B5CF6',     -- Faculty tags, high priorities
          cyan: '#06B6D4',       -- Student indicators, analytics, booking status
          emerald: '#10B981',    -- Success, Present attendance
          rose: '#F43F5E'        -- Critical Alert, Absent attendance, danger
        }
      },
      backdropBlur: {
        xs: '2px',
        md: '12px'
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        neonCyan: '0 0 15px rgba(6, 182, 212, 0.45)',
        neonIndigo: '0 0 15px rgba(99, 102, 241, 0.45)'
      }
    }
  }
}
```

---

## 🗺️ React Router Sitemap & Route Map

CampusOS acts as a Single Page Application (SPA) driven by `react-router-dom`:

```
/ (Root Redirector or Landing Page)
├── /login (Multi-Tenant Login, Subdomain-bound)
│
├── /student (Student Main Layout - Sidebar Router Guard)
│   ├── /dashboard (Academic Overview, Quick AI Input)
│   ├── /timetable (Daily slots grid, classroom check)
│   ├── /companion (PDF Summarizer, Quiz Engine, Viva Prep)
│   ├── /career (Placements, Resume Analyzer, Interview Logs)
│   └── /navigation (Wayfinding floor planner, QR discoverer)
│
├── /faculty (Faculty Main Layout - Sidebar Router Guard)
│   ├── /dashboard (Quick stats, schedule ledger)
│   ├── /attendance (Dynamic student listing checkboxes, QR launcher)
│   ├── /resources (Upload notes, set assignments, issue notices)
│   └── /analytics (Performance trackers, warning triggers)
│
└── /admin (Institutional Admin Layout - Sidebar Router Guard)
    ├── /analytics (Department-level audits, billing logs)
    ├── /directory (CRUD catalogs for students & staff)
    └── /complaints (Escalation registry, assignment filters)
```

---

## 📐 Dashboard Layout Wireframes

### 1. The Student Dashboard Core (12-Column Grid)
The primary student dashboard layout structures visual widgets for rapid scanning:

```
┌────────────────────────────────────────────────────────────────────────┐
│ [C] CampusOS Logo        [Search bar / AI Twin input]      [Profile]  │
├────────────────────────────────────────────────────────────────────────┤
│  (Sidebar)   │  [Welcome Student! Semester 4]  [Live Ticker: DBMS next]│
│  Dashboard   ├────────────────────────────────────────────────────────┤
│  Timetable   │ ┌──────────────────────┐ ┌───────────────────────────┐  │
│  Study Comp  │ │   Attendance Ring    │ │   Upcoming Assignments    │  │
│  Placements  │ │ (6-col widget)       │ │ (6-col widget)            │  │
│  Navigation  │ │ DBMS: 88%  OS: 64% ⚠ │ │ - OS Lab Submission (1d)  │  │
│  Complaints  │ └──────────────────────┘ └───────────────────────────┘  │
│  Lost/Found  ├────────────────────────────────────────────────────────┤
│              │ ┌────────────────────────────────────────────────────┐  │
│  [Dark Mode] │ │              Weak Subject Study Guides             │  │
│  [Log Out]   │ │ (12-col card: System recommendations matching RAG) │  │
│              │ └────────────────────────────────────────────────────┘  │
└──────────────┴────────────────────────────────────────────────────────┘
```

---

## 🤖 The AI Digital Twin & Smart Wayfinder UI (Wireframe)

This specific component splits the browser viewport in half, loading the interactive 2D blueprint of the floor on the left and the glassmorphic conversational chat twin on the right.

```
┌───────────────────────────────────────┬────────────────────────────────┐
│   [Smart Navigation & Wayfinding]     │    [CampusOS Digital Twin AI]  │
├───────────────────────────────────────┼────────────────────────────────┤
│ Bldg B Floor 2 Map     [Find Vacant]  │ Welcome to [Stanford twin].    │
│ ┌───────────────────────────────────┐ │ Asking: "Where is Prof Jenkins?"│
│ │   [Room 201]  [Lab 2]────►[Room203]│ │                                │
│ │   [Stairs]                 ▲      │ │ Assistant: "Prof Jenkins is in │
│ │   [Lobby]──────────────────┘      │ │ Room 203. I have drawn the     │
│ │                                   │ │ shortest route on your left map│
│ │   Current location: scan QR       │ │ from your scanned corridor node."│
│ └───────────────────────────────────┘ │                                │
│                                       │ ┌────────────────────────────┐ │
│ [Floor 1]  [Floor 2]  [Floor 3]       │ │ Type campus query here...  │ │
└───────────────────────────────────────┴────────────────────────────────┘
```

---

## 🧩 High-Fidelity UI Reusable Component Checklist

Developers implementing the frontend components must use this reference manifest:

1. **`GlassCard`**: Main dashboard container with dynamic styling:
   ```html
   <div class="bg-brand-card border border-brand-border backdrop-blur-md rounded-2xl p-6 shadow-glass hover:border-brand-glow transition-all duration-300">
     <!-- Child nodes -->
   </div>
   ```
2. **`CircularAttendanceProgress`**: SVG circular progress dial. Receives attendance ratio. Fades color (Emerald -> Amber -> Rose) as percentage drops, including an active warn ticker when < 75%.
3. **`WayfinderCanvas`**: SVG/HTML5 Canvas loader mapping the institutional node grid. Includes touch/pinch zooming, corridor nodes, stairs nodes, and coordinate line animations.
4. **`LostFoundMatchCard`**: Item comparison card highlighting similarity percentage with a glowing cyan boundary when match probability exceeds 80%.
5. **`ResumeMeter`**: Visual progress bar showing alignment of student profile to jobs, displaying bullet-points of skill gaps inline.
