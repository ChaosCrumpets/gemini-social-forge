# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-01-14

### Added - C.A.L. Enhanced System

#### Backend
- **Enhanced Prompt System** (`server/prompts/cal-enhanced-v2.ts`)
  - 133KB neurobiology-grounded content generation prompt
  - Subsystem architecture (Discovery, Hook Generation, Content Assembly)
  - Neural mechanism integration (prediction error, pattern interrupt, etc.)
  
- **Adaptive Discovery System** (`server/discovery.ts`)
  - 4-level input entropy classification (COLD, UNSTRUCTURED, INTUITIVE, ARCHITECTED)
  - Dynamic question count adaptation (2-6+ questions based on input quality)
  - `diagnoseInput()` function for quality assessment
  - `generateAdaptiveQuestions()` for targeted question creation
  - Progress tracking helpers

- **Enhanced Hook Database** (`server/hookDatabase.ts`)
  - `EnhancedHookTemplate` interface with neural mechanisms
  - `HookAdaptationContext` with UAV/SPCL markers
  - `adaptHookTemplate()` function for personalization
  - `generateEnhancedHooks()` with neuroscience validation
  - Auto-extraction of unique value propositions
  - SPCL (Status, Power, Credibility, Likeness) integration

- **Feature Flag System** (`server/lib/features.ts`)
  - `ENHANCED_CAL` environment variable control
  - `getContentGenerationPrompt()` selector function
  - Instant toggle between legacy and enhanced modes

#### Frontend
- **ProgressionGate Component** (`client/src/components/ProgressionGate.tsx`)
  - Progress bar visualization (0-100%)
  - Question count display
  - "Continue Questions" and "Generate Now" action buttons
  - Appears after question 3, hidden when complete

- **Cinematography Panel** (dual-mode)
  - Renamed from "Tech Specs" to "Cinematography"
  - Amateur Mode: Smartphone tips, equipment lists, warnings
  - Professional Mode: Camera settings (aperture, shutter, ISO), lighting, lenses
  - Mode toggle button
  - Backward compatible with legacy techSpecs

- **Deployment Panel** (6th panel - NEW)
  - Platform posting schedule with priorities
  - Platform-specific captions and hashtags
  - Cross-promotion strategy
  - Timing recommendations
  - Distribution strategy overview

- **Panel Navigation Update** (`client/src/components/OutputPanels.tsx`)
  - 6 output panels (was 5)
  - Updated tab order: Script → Storyboard → Cinematography → B-Roll → Captions → Deployment
  - Camera icon for Cinematography tab
  - Share icon for Deployment tab

#### Schema & Types
- **Cinematography Interface** (`shared/schema.ts`)
  - Replaces TechSpecs with enhanced guidance
  - `amateurMode` field (equipment, tips, warnings)
  - `professionalMode` field (camera settings, lighting, lenses)
  - Backward compatible (techSpecs preserved as optional)

- **Deployment Interface** (`shared/schema.ts`)
  - `strategy` field for distribution approach
  - `platforms` array with priority, timing, captions, hashtags
  - `crossPromotion` field for amplification
  - `timing` field for scheduling recommendations

- **ContentOutput Update**
  - Added `cinematography` field
  - Added `deployment` field
  - Preserved `techSpecs` for backward compatibility

#### Scripts & Testing
- **Integration Verification** (`scripts/verify-cal-integration.js`)
  - 27 automated integration tests
  - Validates all Phases 1-5 components
  - File structure verification
  - Schema integrity checks
  - Export validation

- **Phase-Specific Tests**
  - `scripts/test-phase2-backend.js` - Prompt integration (17 tests)
  - `scripts/test-phase3-hooks.js` - Hook database (16 tests)
  - `scripts/test-phase4-discovery.js` - Discovery system (18 tests)

- **Rollback Scripts**
  - `scripts/rollback-instant.js` - Feature flag toggle (<1 min)
  - `scripts/rollback-full.ps1` - Git revert automation (5-10 min)

#### Documentation
- `CAL-ENHANCED-SYSTEM.md` - Complete system documentation
- `ROLLBACK.md` - Comprehensive rollback procedures
- `DEPLOYMENT-CHECKLIST.md` - Production deployment guide
- `implementation_summary.md` - Full implementation details
- Phase completion docs (phase2-7_complete.md)

### Changed

#### Backend
- `server/gemini.ts`
  - Imported enhanced prompt and functions
  - Added `getContentGenerationPrompt()` selector
  - Updated prompt usage to call selector function
  - Added `buildHookAdaptationContext()` helper
  - Renamed legacy prompt to `CONTENT_GENERATION_PROMPT_LEGACY`

#### Frontend
- `client/src/components/OutputPanels.tsx`
  - Increased tab count from 5 to 6
  - Renamed 3rd tab from "Tech Specs" to "Cinematography"
  - Updated imports for new types (Cinematography, Deployment)
  - Replaced TechSpecsPanel with CinematographyPanel
  - Added DeploymentPanel component
  - Updated data mapping (techSpecs → cinematography)

### Technical Improvements
- **Type Safety**: All new interfaces fully typed with TypeScript
- **Runtime Validation**: Zod schemas for all new types
- **Backward Compatibility**: 100% maintained, zero breaking changes
- **Performance**: Minimal impact (+50ms for enhanced prompt)
- **Testing**: 78/78 tests passing (100% success rate)
- **Build**: Zero TypeScript errors
- **Rollback**: Instant recovery capability

### Metrics
- **Files Created**: 13
- **Files Modified**: 7
- **Lines Added**: ~5,400
- **New Interfaces**: 6
- **New Functions**: 7
- **Test Coverage**: 78 tests (100% passing)

---

## [1.0.0] - Previous

### Firebase Migration
- Migrated from Drizzle ORM to Firebase Firestore
- Implemented Firebase Authentication
- Updated all backend routes for Firebase compatibility

### Features
- Content Assembly Line (5-panel output)
- Hook generation system
- Script creation
- Storyboard generation
- Tech specifications
- B-Roll suggestions
- Caption generation

---

## Feature Flag Control

All v2.0 features are controlled by the `ENHANCED_CAL` environment variable:
- `ENHANCED_CAL=false` (default) - Legacy mode (v1.0)
- `ENHANCED_CAL=true` - Enhanced mode (v2.0)

This allows instant rollback and gradual feature adoption.

---

**Full Documentation**: See `CAL-ENHANCED-SYSTEM.md`  
**Rollback Procedures**: See `ROLLBACK.md`  
**Deployment Guide**: See `DEPLOYMENT-CHECKLIST.md`
