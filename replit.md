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