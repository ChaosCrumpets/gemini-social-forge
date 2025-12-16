# C.A.L. (Content Assembly Line)

## Overview

C.A.L. is a social media content generation platform that uses AI to help creators produce high-quality short-form video content. The application guides users through a conversational workflow: gathering content requirements via chat, generating multiple hook options, allowing the user to select a hook, and then producing a complete content package including script, storyboard, B-roll suggestions, tech specs, and captions.

The system follows a state-machine pattern with four distinct phases: inputting → hook_selection → generating → complete.

## User Preferences

Preferred communication style: Simple, everyday language.

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
- `POST /api/generate-hooks` - Generates 5-6 hook options based on collected inputs
- `POST /api/generate-content` - Produces full content package after hook selection

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