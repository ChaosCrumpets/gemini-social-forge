# C.A.L. (Content Assembly Line) - Complete

## Application Overview
A chat-to-dashboard AI content generator for social media using Gemini API.

## All Tasks Completed
1. **Schema & Frontend** - COMPLETE
2. **Backend** - COMPLETE  
3. **Integration, Polish & Testing** - COMPLETE

## Key Architecture
- Frontend: React + Zustand + TanStack Query
- Backend: Express + Gemini 2.5 Flash API
- Storage: In-memory (MemStorage)

## Key Files
- `shared/schema.ts` - All TypeScript types (UserInputs, Hook, ContentOutput, etc.)
- `client/src/lib/store.ts` - Zustand state management
- `client/src/pages/assembly-line.tsx` - Main page component with complete user flow
- `server/gemini.ts` - Gemini API wrapper with chat, generateHooks, generateContent
- `server/routes.ts` - Express API routes

## User Flow
1. Chat with AI to describe content (topic, goal, platform, audience, tone, duration)
2. AI extracts inputs and generates hook options when ready
3. User selects a hook
4. AI generates complete content package (Script, Storyboard, Tech Specs, B-Roll, Captions)
5. Dashboard displays all generated content in tabbed panels

## API Endpoints
- POST `/api/chat` - Conversational input gathering with extractedInputs
- POST `/api/generate-hooks` - Hook generation (5-6 options)
- POST `/api/generate-content` - Full content package generation
- POST/GET `/api/projects` - Project CRUD

## Bug Fixed
Fixed stale closure issue where extractedInputs from chat API were not being saved to store, causing generate-hooks to fail with "Topic is required". Solution: 
1. Call updateInputs() when extractedInputs received from chat
2. Pass merged inputs directly to generateHooks() to avoid stale closure
3. Reordered callbacks and fixed dependency arrays

## Required Secrets
- GEMINI_API_KEY - Google AI Studio API key (user provided)
