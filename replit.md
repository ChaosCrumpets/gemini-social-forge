# C.A.L. (Content Assembly Line)

## Overview

C.A.L. (Content Assembly Line) is an AI-powered social media content generation platform designed to help creators produce high-quality short-form video content. It guides users through a conversational workflow to gather requirements, generate multiple hook options (text, verbal, visual), allow user selection, and then produce a complete content package. This package includes a script, storyboard, B-roll suggestions (with AI generation prompts), technical specifications, and captions. The system streamlines content creation, making it faster and more personalized through a state-machine driven process and AI-powered discovery questions. The platform aims to be a comprehensive solution for social media content creators, enhancing efficiency and creative output.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript, bundled by Vite.
- **Routing**: Wouter for client-side navigation.
- **State Management**: Zustand for local project state.
- **Data Fetching**: TanStack React Query for API interactions.
- **UI Components**: shadcn/ui built on Radix UI primitives.
- **Styling**: Tailwind CSS with a cyber-industrial aesthetic.

### Backend Architecture
- **Runtime**: Node.js with Express.
- **API Pattern**: RESTful endpoints.
- **AI Integration**: Google Gemini API for conversational AI and content generation.
- **Storage**: In-memory storage with an interface designed for future PostgreSQL migration via Drizzle ORM.
- **Authentication**: Replit Auth (OIDC-based) with user roles (user, admin) and premium subscription management.

### Key Design Patterns
- **State Machine**: Guides the user through seven distinct phases: `inputting`, `hook_text`, `hook_verbal`, `hook_visual`, `hook_overview`, `generating`, and `complete`.
- **Pause-and-Resume**: AI generation pauses for user input during hook selection.
- **Shared Types**: Zod schemas ensure type safety across frontend and backend.
- **Content Editing**: A separate chat interface allows post-generation content refinement.
- **Discovery Questions System**: Presents 3-5 personalized discovery questions from a database of 200+ questions across 11 categories to refine content suggestions.
- **B-Roll AI Prompts**: B-roll suggestions include practical "Film It Yourself" guides, "Alpha Image Prompts" (cinematic, photorealistic for AI image generators), and "Omega Video Prompts" (motion-focused for AI video generators). Alpha prompts use a 3-Pillar structure (Structure, Reference, Vision), and Omega prompts extend images into motion.

### UI/UX Decisions
- **Layout**: Split-view for the "Complete" stage (edit chat on left, content output on right).
- **Aesthetics**: Cyber-industrial design with Space Grotesk font, purple/teal color scheme, and gradient utilities.
- **Responsiveness**: Optimized for various screen sizes, including a mobile sidebar overlay pattern.

### Feature Specifications
- **Content Generation**: Produces script, storyboard, B-roll suggestions, tech specs, and captions.
- **Hook Selection**: Users select from ranked text, verbal, and visual hook options.
- **Admin Dashboard**: For user and subscription management.
- **Premium Subscription**: Access to all generation features, managed via Stripe integration.

## External Dependencies

### AI Services
- **Google Gemini API**: Primary AI model for conversational interactions and content generation.

### Database
- **PostgreSQL**: Target database for persistent storage (users, sessions, content_sessions) via Drizzle ORM.

### Payment Processing
- **Stripe**: For managing premium subscriptions and checkout flows.

### Authentication
- **Dual Auth Support**: Native password-based authentication AND Replit Auth (OIDC-based).
  - Native auth uses bcrypt for password hashing and express-session for session management.
  - The `server/middleware/native-auth.ts` middleware supports both auth modes seamlessly.
- **5-Tier Membership System**: Bronze (free), Silver ($10/mo), Gold ($20/mo), Platinum ($50/mo), Diamond ($200 lifetime).
  - Bronze users can access basic features including chat and discovery questions.
  - Premium tiers (Silver+) unlock hook generation and content creation features.

### Key NPM Packages
- `@google/genai`
- `drizzle-orm`, `drizzle-kit`
- `express`
- `zustand`
- `@tanstack/react-query`
- `zod`
- `stripe`
- `passport`, `openid-client`
- `express-session`, `connect-pg-simple`