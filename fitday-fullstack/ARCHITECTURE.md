# FITDAY architecture

```text
Browser (React / Next.js)
  ├── App Router pages and client components
  ├── 3D viewer (React Three Fiber)
  ├── Supabase browser client (auth + private image upload)
  └── /api/* (same-origin calls)
          │
          ▼
Node.js Route Handlers (Next.js runtime)
  ├── request validation (Zod)
  ├── JWT claims verification (Supabase Auth)
  ├── wardrobe CRUD
  ├── outfit generation / persistence
  ├── optional AI SDK 6 → AI Gateway ranking (hard rules remain server-enforced)
  └── signed image URLs
          │
          ▼
Supabase
  ├── Auth
  ├── Postgres (RLS per user)
  └── Storage (private bucket, user folder policies)
```

## Why Next.js rather than a separate Express server?

For the first release, one Next.js codebase reduces deployment and session complexity. Route Handlers run on Node.js and form the backend API. If workload grows (background processing, image pipelines, long-running AI jobs), extract those into a dedicated Node service or queue worker without changing the browser-facing API contract.

## Outfit engine boundary

`src/lib/outfit-engine.ts` is deliberately provider-independent. It applies hard eligibility rules and creates a base candidate from clean inventory. Future ranking layers can be added without allowing an LLM to bypass hard rules:

1. Availability and laundry constraints.
2. Category completeness and garment compatibility.
3. Weather / season and occasion constraints.
4. User style preferences and liked/disliked feedback.
5. AI-generated explanation and optional alternatives.

## 3D boundary

`AvatarViewer` is an isolated client component. The placeholder procedural model can be replaced by a rigged GLB/GLTF avatar, while the wardrobe/database/API contract remains unchanged. Garment 3D assets should be mapped to body measurements and tested fit profiles; a flat image or generated outfit illustration is not equivalent to virtual try-on.
