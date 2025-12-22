# C.A.L. (Content Assembly Line)

## Overview

C.A.L. is a social media content generation platform that uses AI to help creators produce high-quality short-form video content. The application guides users through a conversational workflow: gathering content requirements via chat, generating multiple hook options, allowing the user to select a hook, and then producing a complete content package including script, storyboard, B-roll suggestions, tech specs, and captions.

The system follows a state-machine pattern with seven distinct phases:
1. **inputting** - Conversational chat to gather content requirements, followed by discovery questions
2. **hook_text** - Select from 6 ranked text hooks (on-screen captions/titles)
3. **hook_verbal** - Select from 6 ranked verbal hooks (script openers)
4. **hook_visual** - Provide filming context, then select from 6 visual hooks (dual output: FIY filming guide + GenAI prompt)
5. **hook_overview** - Review all 3 hook selections before final generation
6. **generating** - AI agents produce the content package
7. **complete** - View final output with script, storyboard, tech specs, B-roll (with AI generation prompts), and captions

### Discovery Questions System
After gathering basic inputs (topic, goal, platform), the system presents 3-5 personalized discovery questions from a database of 200+ questions across 11 categories:
- Topic Depth (expertise level, unique perspectives)
- Audience Insights (pain points, desired outcomes)
- Content Style (format preferences, energy level)
- Emotional Resonance (feelings to evoke, stories to share)
- Authority Building (credentials, experience)
- Practical Details (resources, timeline)
- Differentiation (unique value, competition gaps)
- Call to Action (desired outcomes, next steps)
- Platform Optimization (posting habits, engagement goals)
- Content Constraints (limitations, must-includes)
- Trend Alignment (current trends, timely topics)

The user's answers are stored as `discoveryContext` and passed to all hook generation prompts, resulting in more targeted and personalized content suggestions.

### Complete Stage Features
The complete stage has a split-view layout:
- **Left Panel (Edit Content)**: Chat interface for editing the generated content. Users can request changes like "make the script more energetic" and the AI will apply those edits.
- **Right Panel (Content Output)**: Tabbed view of Script, Storyboard, Tech Specs, B-Roll, and Captions.

Two ways to start a new content plan:
- "New Plan" button in the Edit Content header
- "Create New Content Plan" button next to the Content Output title

The edit chat uses a separate message thread (`editMessages`) from the initial creation chat, keeping the workflows distinct.

### B-Roll AI Prompts
Each B-roll suggestion now includes three output types:
- **FIY (Film It Yourself)**: Practical filming instructions
- **Alpha Image Prompt**: Cinematic, photorealistic prompt for AI image generation (Midjourney, DALL-E, etc.)
- **Omega Video Prompt**: Motion-focused prompt for AI video generation (Runway, Sora, etc.)

The prompts follow the Alpha/Omega framework:
- Alpha prompts use the 3-Pillar structure: Structure (technical), Reference (style), Vision (emotion)
- Omega prompts extend images into motion with camera movement, narrative arc, and controlled chaos

## User Preferences

Preferred communication style: Simple, everyday language.

## Authentication & Subscription

### User Authentication
- **Replit Auth**: OIDC-based authentication supporting Google, GitHub, X, Apple, and email/password
- Users are stored in `users` table with role-based access control
- Auth sessions stored in `sessions` table (PostgreSQL-backed)

### User Roles
- **user**: Standard access, can use the app with premium subscription
- **admin**: Full access including admin dashboard at `/admin`

### Premium Subscription
- Premium users have access to all content generation features
- Free users are blocked from generation endpoints (403 response)
- Stripe integration for subscription payments
- Upgrade page available at `/upgrade`

### Protected Endpoints (Premium Required)
All content generation endpoints require authentication + premium subscription:
- `POST /api/generate-hooks`
- `POST /api/generate-text-hooks`
- `POST /api/generate-verbal-hooks`
- `POST /api/generate-visual-hooks`
- `POST /api/generate-content`
- `POST /api/generate-content-multi`
- `POST /api/edit-content`
- `POST /api/generate-discovery-questions`

### Admin Endpoints
- `GET /api/admin/users` - List all users
- `PATCH /api/admin/users/:id/premium` - Toggle user premium status
- `PATCH /api/admin/users/:id/role` - Change user role

### Stripe Integration
- `POST /api/create-checkout-session` - Create Stripe checkout for premium subscription
- `POST /api/webhook/stripe` - Handle Stripe webhook events
- `GET /api/upgrade/success` - Handle successful subscription redirect

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript, bundled via Vite
- **Routing**: Wouter (lightweight client-side routing)
- **State Management**: Zustand for local project state
- **Data Fetching**: TanStack React Query for API communication
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens following a cyber-industrial aesthetic

### Backend Architecture
- **Runtime**: Node.js with Express
- **API Pattern**: RESTful endpoints under `/api/` prefix
- **AI Integration**: Google Gemini API (`@google/genai`) for conversational AI and content generation
- **Storage**: In-memory storage (MemStorage class) with interface designed for future database migration

### Key Design Patterns
- **State Machine**: Project progresses through defined states (inputting, hook_selection, generating, complete)
- **Pause-and-Resume**: AI generation pauses at hook_selection stage, waiting for user input before proceeding
- **Shared Types**: Zod schemas in `shared/schema.ts` provide type safety across frontend and backend

### Database Schema
- Drizzle ORM configured for PostgreSQL
- Schema defined in `shared/schema.ts`
- Current implementation uses in-memory storage; database can be added later
- Run `npm run db:push` to sync schema with database

### API Endpoints
- `POST /api/chat` - Conversational input gathering with extracted parameters
- `POST /api/generate-text-hooks` - Generates 6 ranked text hook options (on-screen captions/titles)
- `POST /api/generate-verbal-hooks` - Generates 6 ranked verbal hook options (script openers)
- `POST /api/generate-visual-hooks` - Generates 6 ranked visual hook options with filming context (dual output: FIY + GenAI)
- `POST /api/generate-content-multi` - Produces full content package using all three selected hooks
- `POST /api/edit-content` - Edits existing content output based on user message (for post-generation refinement)
- `GET /api/query-database` - Returns all discovery questions from the database
- `GET /api/query-database/categories` - Returns list of all question categories
- `GET /api/query-database/category/:category` - Returns questions for a specific category
- `POST /api/query-database/select` - AI-powered selection of relevant discovery questions based on topic/intent
- `POST /api/generate-hooks` - (Legacy) Generates 5-6 hook options based on collected inputs
- `POST /api/generate-content` - (Legacy) Produces full content package after single hook selection

## External Dependencies

### AI Services
- **Google Gemini API**: Primary AI model for conversation and content generation
- Requires `GEMINI_API_KEY` environment variable

### Database
- **PostgreSQL**: Target database (via Drizzle ORM)
- Requires `DATABASE_URL` environment variable when database is provisioned

### Key NPM Packages
- `@google/genai` - Gemini API client
- `drizzle-orm` / `drizzle-kit` - Database ORM and migrations
- `express` - HTTP server framework
- `zustand` - Frontend state management
- `@tanstack/react-query` - Data fetching
- `zod` - Schema validation (shared between frontend/backend)
- `stripe` - Payment processing for subscriptions
- `passport` / `openid-client` - Authentication via Replit Auth OIDC
- `express-session` / `connect-pg-simple` - Session management with PostgreSQL

## Development Changelog

### Phase 1: Foundation & AI Integration
1. **Initial Setup** - Created React + Express full-stack application with Vite bundling
2. **Gemini AI Integration** - Added Google Gemini API for conversational AI and content generation
3. **Dashboard Interface** - Built main chat-to-dashboard UI for content creation workflow

### Phase 2: Hook Generation System
4. **Hook Generation** - Added ability to generate content hooks from user inputs
5. **Hook Database & Ranking** - Created hook schema with ranking and recommendation fields
6. **Hook Selection UI** - Added visual indicators for ranked and recommended hooks
7. **Multi-Stage Hook Selection** - Introduced distinct text, verbal, and visual hook stages:
   - Text hooks (on-screen captions/titles)
   - Verbal hooks (script openers)
   - Visual hooks (filming guides with dual FIY + GenAI output)
8. **Visual Context Form** - Added filming context collection before visual hook generation
9. **Hook Overview Stage** - Added review screen showing all 3 hook selections before final generation

### Phase 3: Content Output & B-Roll
10. **B-Roll AI Prompts** - Added AI-generated prompts for B-roll creation with three output types:
    - FIY (Film It Yourself) - Practical filming instructions
    - Alpha Image Prompt - Cinematic prompts for AI image generation (Midjourney, DALL-E)
    - Omega Video Prompt - Motion-focused prompts for AI video generation (Runway, Sora)
11. **Alpha/Omega Framework** - Implemented 3-Pillar structure for Alpha prompts and motion extension for Omega prompts

### Phase 4: Editing & Chat Enhancement
12. **Content Editing** - Added chat interface for editing generated content post-creation
13. **New Plan Flow** - Added "New Plan" buttons to start fresh content generation
14. **Split-View Layout** - Created left panel (edit chat) and right panel (content output) design

### Phase 5: Persistence & Session Management
15. **Database Storage** - Added persistent storage for chat sessions and messages using PostgreSQL
16. **Session Management** - Implemented database-backed session management for content generation
17. **Project Store Sessions** - Added session management functionality to Zustand store
18. **Chat History Persistence** - Enabled saving and loading of chat history across sessions
19. **Session Reset** - Added proper session reset when creating new content

### Phase 6: UI/UX Improvements
20. **Mobile Sidebar** - Updated sidebar to use overlay pattern on mobile devices
21. **Responsive Design** - Ensured proper layout across different screen sizes

### Phase 7: Discovery Questions System
22. **Discovery Questions Database** - Created system to store 200+ discovery questions across 11 categories:
    - Topic Depth, Audience Insights, Content Style, Emotional Resonance
    - Authority Building, Practical Details, Differentiation, Call to Action
    - Platform Optimization, Content Constraints, Trend Alignment
23. **Interactive Discovery UI** - Added interactive discovery questions to gather user context
24. **AI-Powered Question Selection** - Implemented AI selection of 3-5 relevant questions based on topic/intent
25. **Discovery Context Integration** - Passed discovery answers to all hook generation prompts for personalization

### Phase 8: Authentication & Premium Paywall
26. **Replit Auth Integration** - Added OIDC-based authentication (Google, GitHub, X, Apple, email)
27. **User Model** - Created user table with role (user/admin) and premium subscription fields
28. **Auth Middleware** - Built isAuthenticated, adminRequired, and premiumRequired middleware
29. **Stripe Integration** - Added Stripe checkout for premium subscriptions with webhook handling
30. **Admin Dashboard** - Created `/admin` page for managing users, roles, and premium status
31. **Upgrade Page** - Built `/upgrade` page with Stripe checkout integration
32. **Protected Endpoints** - Secured all AI generation endpoints behind authentication + premium requirement:
    - generate-hooks, generate-text-hooks, generate-verbal-hooks, generate-visual-hooks
    - generate-content, generate-content-multi, edit-content, generate-discovery-questions

### Database Tables
- `users` - User accounts with role, premium status, Stripe IDs
- `sessions` - Auth session storage (PostgreSQL-backed)
- `content_sessions` - Content generation sessions with userId, messages, hooks, output

### Key Files Structure
```
client/src/
├── pages/
│   ├── home.tsx          # Main content generation interface
│   ├── admin.tsx         # Admin dashboard
│   ├── upgrade.tsx       # Premium upgrade page
│   └── not-found.tsx     # 404 page
├── components/
│   ├── ChatPanel.tsx     # Chat interface component
│   ├── ContentOutput.tsx # Generated content display
│   ├── HookSelection.tsx # Hook selection UI
│   └── ui/               # shadcn components
├── store/
│   └── projectStore.ts   # Zustand state management
└── lib/
    └── queryClient.ts    # TanStack Query setup

server/
├── routes.ts             # All API endpoints
├── storage.ts            # Storage interface (MemStorage)
├── gemini.ts             # Gemini AI integration
├── middleware/
│   └── auth.ts           # Auth middleware (admin, premium)
└── replit_integrations/
    └── auth/             # Replit Auth OIDC setup

shared/
├── schema.ts             # Drizzle schema & Zod types
└── models/
    └── auth.ts           # Auth-related types
```