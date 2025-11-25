project-bayani/
├─ app/
│  ├─ layout.tsx             # Root layout (global styles, metadata)
│  ├─ page.tsx               # Main UI screen (video feed + toolbar + panels)
│  ├─ globals.css            # TailwindCSS base styles
│
├─ components/
│  ├─ ui/                    # shadcn/ui components (auto-generated)
│  │  ├─ button.tsx
│  │  ├─ card.tsx
│  │  └─ ...
│  ├─ header.tsx             # Top navbar (optional)
│  ├─ video-feed.tsx         # Video feed placeholder
│  ├─ side-panel.tsx         # Reusable panel for map/history
│  ├─ floating-toolbar.tsx   # 🆕 Floating black bar with icons
│  ├─ record-button.tsx      # (Optional standalone record logic)
│
├─ lib/
│  ├─ utils.ts               # Helper functions (e.g., className merge)
│
├─ public/
│  └─ logo.svg
│
├─ package.json
└─ tailwind.config.js
