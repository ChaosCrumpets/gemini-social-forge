# META-PROMPT #2: C.A.L. IMPLEMENTATION PLAN
## ADVANCED PROMPTING-GUIDED INTEGRATION FOR ANTIGRAVITY

---

## 🎯 META-PROMPT OVERVIEW

This is an **implementation meta-prompt** designed for Antigravity (agentic IDE) to execute the integration of the enhanced C.A.L. system prompt.

**Advanced Prompting Techniques Used:**
- **Chain-of-Thought (CoT):** Step-by-step reasoning through implementation decisions
- **Least-to-Most:** Breaking complex integration into incremental sub-tasks
- **Tree of Thoughts (ToT):** Exploring multiple implementation paths with backtracking
- **Chain-of-Verification (CoVe):** Validation checkpoints at each phase
- **Meta-Prompting:** Self-optimizing instructions that adapt based on execution results

---

## 📊 IMPLEMENTATION ARCHITECTURE (Least-to-Most Decomposition)

**Complex Task:** Integrate enhanced C.A.L. system prompt without breaking existing functionality

**Decomposition into Sub-Problems:**

```
LEVEL 1: Environment Preparation
  ├─ 1.1: Backup current system
  ├─ 1.2: Create feature branch
  └─ 1.3: Identify integration points

LEVEL 2: Core System Prompt Integration
  ├─ 2.1: Replace CONTENT_GENERATION_PROMPT constant
  ├─ 2.2: Verify syntax and imports
  └─ 2.3: Test basic generation flow

LEVEL 3: Hook Database Connection
  ├─ 3.1: Locate hookDatabase file
  ├─ 3.2: Verify file structure
  ├─ 3.3: Integrate access in Subsystem 3
  └─ 3.4: Test hook generation

LEVEL 4: Discovery Flow Logic
  ├─ 4.1: Implement adaptive question count
  ├─ 4.2: Add progression gate UI
  ├─ 4.3: Connect to existing chat interface
  └─ 4.4: Test full discovery sequence

LEVEL 5: Frontend Panel Updates
  ├─ 5.1: Rename "Tech Specs" to "Cinematography/Director"
  ├─ 5.2: Add 6th panel (Deployment Strategy)
  ├─ 5.3: Update panel routing
  └─ 5.4: Test all 6 panels render correctly

LEVEL 6: Verification & Testing
  ├─ 6.1: Integration tests
  ├─ 6.2: End-to-end user flow tests
  ├─ 6.3: Performance validation
  └─ 6.4: Rollback preparation

LEVEL 7: Documentation & Deployment
  ├─ 7.1: Update developer docs
  ├─ 7.2: Create user-facing changelog
  └─ 7.3: Deploy to staging → production
```

---

## 🔄 PHASE 1: ENVIRONMENT PREPARATION (CoT Reasoning)

### STEP 1.1: Backup Current System

**Chain-of-Thought Reasoning:**
```
IF I integrate new system prompt without backup:
  → Risk: Cannot revert if integration fails
  → Consequence: Production downtime or broken features
  → Decision: MUST create backup first

BACKUP STRATEGY:
  Option A: Git branch (version control)
  Option B: File copy with timestamp
  Option C: Database snapshot

EVALUATION:
  Option A: ✅ Best - allows easy revert, tracks changes, supports collaboration
  Option B: ❌ Manual, error-prone, no change tracking
  Option C: ⚠️ Only if system prompt stored in DB (unlikely)

SELECTED: Option A (Git branch)
```

**Execution Instructions:**

```bash
# Step 1.1.1: Verify you're on main/master branch
git branch --show-current

# Step 1.1.2: Create feature branch
git checkout -b feature/cal-enhanced-system-prompt

# Step 1.1.3: Confirm branch creation
git branch --list | grep "cal-enhanced"

# Expected output: "* feature/cal-enhanced-system-prompt"
```

**Verification Checkpoint (CoVe):**
- [ ] Feature branch created successfully
- [ ] Currently on feature branch (not main)
- [ ] No uncommitted changes blocking branch switch

---

### STEP 1.2: Locate Integration Points

**Chain-of-Thought Reasoning:**
```
WHERE is the current system prompt defined?
  → Search for: "CONTENT_GENERATION_PROMPT"
  → Likely locations:
    - /src/constants/prompts.ts
    - /src/config/system-prompts.ts
    - /src/lib/ai/prompts.ts
    - /server/prompts/generation.ts

HOW is it used?
  → Search for: references to CONTENT_GENERATION_PROMPT
  → Identify: Which functions call it
  → Map: Data flow from user input → prompt → LLM → output

WHAT else needs updating?
  → Frontend: Panel names, routing
  → Backend: Discovery flow, hook database access
  → Types: TypeScript interfaces for new structures
```

**Execution Instructions:**

```bash
# Step 1.2.1: Find system prompt file
grep -r "CONTENT_GENERATION_PROMPT" --include="*.ts" --include="*.js"

# Step 1.2.2: Find usage references
grep -r "CONTENT_GENERATION_PROMPT" --include="*.ts" --include="*.tsx" -n

# Step 1.2.3: Locate hookDatabase
find . -name "*hook*" -o -name "*database*" | grep -v node_modules

# Step 1.2.4: Map file structure
tree -L 3 -I 'node_modules' > file_structure.txt
```

**Document Findings:**
```
INTEGRATION POINTS IDENTIFIED:

1. System Prompt Location: [filepath]
2. Usage References:
   - [file1.ts:line] - Generation function
   - [file2.tsx:line] - UI component
   - [file3.ts:line] - API endpoint

3. hookDatabase Location: [filepath]
   - Format: [JSON/JS/TS]
   - Current structure: [describe]

4. Frontend Panels:
   - Current: Script, Storyboard, B-Roll, Tech Specs, Captions
   - New: Script, Storyboard, B-Roll, Cinematography/Director, Captions, Deployment

5. Discovery Flow:
   - Current: [describe existing flow]
   - Enhancement needed: [adaptive question count, progression gate]
```

**Verification Checkpoint (CoVe):**
- [ ] System prompt file located
- [ ] All usage references mapped
- [ ] hookDatabase found and structure understood
- [ ] Frontend components identified
- [ ] Discovery flow architecture understood

---

## 🔧 PHASE 2: CORE SYSTEM PROMPT INTEGRATION (Tree of Thoughts)

### STEP 2.1: Integration Strategy Selection (ToT - Multiple Paths)

**Path Exploration:**

```
PATH A: Complete Replacement
  ├─ Action: Delete old prompt, paste new prompt entirely
  ├─ Pros: Clean slate, no legacy code
  ├─ Cons: Breaks if new prompt has syntax errors, no gradual testing
  └─ Risk Level: HIGH

PATH B: Incremental Integration
  ├─ Action: Replace subsystem by subsystem, test each
  ├─ Pros: Can catch errors early, easier debugging
  ├─ Cons: More time-consuming, potential inconsistencies during transition
  └─ Risk Level: MEDIUM

PATH C: Parallel Implementation
  ├─ Action: Keep old prompt, add new as "CONTENT_GENERATION_PROMPT_V2", toggle via feature flag
  ├─ Pros: Zero downtime, easy rollback, A/B testing possible
  ├─ Cons: More complex codebase temporarily, need feature flag system
  └─ Risk Level: LOW

EVALUATION:
  PATH A: ❌ Too risky for production system
  PATH B: ⚠️ Time-intensive but safer
  PATH C: ✅ RECOMMENDED - Allows safe testing and easy rollback
```

**Selected Path: C (Parallel Implementation)**

---

### STEP 2.2: Execute Parallel Implementation

**Execution Instructions:**

```typescript
// Step 2.2.1: Locate existing prompt file
// File: /src/constants/prompts.ts (or your actual location)

// Step 2.2.2: Add feature flag system
// File: /src/config/features.ts
export const FEATURES = {
  USE_ENHANCED_CAL_PROMPT: process.env.ENHANCED_CAL === 'true' || false,
  // ... other features
};

// Step 2.2.3: Add new prompt constant
// File: /src/constants/prompts.ts

// Keep existing prompt (renamed)
export const CONTENT_GENERATION_PROMPT_LEGACY = `...old prompt...`;

// Add new enhanced prompt (from META-PROMPT #1 Parts 1-3)
export const CONTENT_GENERATION_PROMPT_V2 = `
═══════════════════════════════════════════════════════════════════
🧠 C.A.L. (CONTENT ASSEMBLY LINE) - NEUROBIOLOGY-GROUNDED GENERATION SYSTEM
═══════════════════════════════════════════════════════════════════
// [INSERT COMPLETE ENHANCED PROMPT FROM META-PROMPT #1]
// [Combine Parts 1 + 2 + 3 into single string]
`;

// Step 2.2.4: Create selector function
export function getContentGenerationPrompt(): string {
  if (FEATURES.USE_ENHANCED_CAL_PROMPT) {
    console.log('[CAL] Using enhanced prompt v2.0');
    return CONTENT_GENERATION_PROMPT_V2;
  }
  console.log('[CAL] Using legacy prompt v1.0');
  return CONTENT_GENERATION_PROMPT_LEGACY;
}

// Step 2.2.5: Update all usage points
// Replace direct references:
// OLD: import { CONTENT_GENERATION_PROMPT } from './constants/prompts';
// NEW: import { getContentGenerationPrompt } from './constants/prompts';

// OLD: const prompt = CONTENT_GENERATION_PROMPT;
// NEW: const prompt = getContentGenerationPrompt();
```

**Verification Checkpoint (CoVe):**

```typescript
// Test 1: Feature flag OFF (legacy prompt)
process.env.ENHANCED_CAL = 'false';
const legacyPrompt = getContentGenerationPrompt();
console.assert(legacyPrompt.includes('old identifier'), 'Legacy prompt should be returned');

// Test 2: Feature flag ON (new prompt)
process.env.ENHANCED_CAL = 'true';
const newPrompt = getContentGenerationPrompt();
console.assert(newPrompt.includes('NEUROBIOLOGY-GROUNDED'), 'New prompt should be returned');

// Test 3: Syntax validation
try {
  const prompt = getContentGenerationPrompt();
  console.assert(typeof prompt === 'string', 'Prompt should be string');
  console.assert(prompt.length > 1000, 'Prompt should be substantial');
  console.log('✅ Syntax validation passed');
} catch (error) {
  console.error('❌ Syntax validation failed:', error);
}
```

**Verification Checklist:**
- [ ] Both prompts coexist in codebase
- [ ] Feature flag controls which is used
- [ ] All references updated to use selector function
- [ ] Syntax validation passes
- [ ] Legacy prompt still works (backward compatibility)

---

## 🎣 PHASE 3: HOOK DATABASE INTEGRATION

### STEP 3.1: Hook Database Structure Verification

**Chain-of-Thought Reasoning:**
```
WHAT format is the hookDatabase?
  → Option A: JSON file with categorized templates
  → Option B: JavaScript/TypeScript module exporting object
  → Option C: Database table (SQL/NoSQL)

EXPECTED STRUCTURE (from system prompt):
{
  "patternInterrupt": ["template1", "template2", ...],
  "curiosityGap": ["template1", "template2", ...],
  "statBomb": ["template1", "template2", ...],
  // ... more categories
}

HOW should Subsystem 3 access it?
  → Import as module: import { hookDatabase } from './hookDatabase';
  → Read from file system: fs.readFileSync('hookDatabase.json')
  → Query from database: db.query('SELECT * FROM hooks')

SELECTED: Import as module (fastest, no I/O overhead)
```

**Execution Instructions:**

```typescript
// Step 3.1.1: Verify hookDatabase location
// File: /src/data/hookDatabase.ts (or your actual location)

// Step 3.1.2: Ensure correct structure
export const hookDatabase = {
  patternInterrupt: [
    "Wait, don't {action}—",
    "Stop doing {common practice}",
    "Before you {X}, watch this"
  ],
  curiosityGap: [
    "The reason {outcome} has nothing to do with {assumption}",
    "Why {unexpected connection}",
    "{X} and {Y} have more in common than you think"
  ],
  statBomb: [
    "{number}% of {audience} don't know {fact}",
    "{shocking stat} and here's why it matters"
  ],
  contrarian: [
    "{common belief} is actually making {problem} worse",
    "Everyone says {X}, but I believe {Y} because..."
  ],
  result: [
    "This {technique} got me {result} in {timeframe}",
    "I made ${amount} using {method}"
  ],
  question: [
    "Have you ever wondered why {observation}?",
    "What if I told you {counterintuitive claim}?"
  ],
  story: [
    "{timeframe} ago, I {problem}. Today, {transformation}.",
    "I was {negative state} until I discovered {method}"
  ]
};

// Step 3.1.3: Create type-safe interface
export interface HookDatabase {
  [category: string]: string[];
}

// Step 3.1.4: Export for use in generation
export type HookCategory = keyof typeof hookDatabase;
```

**Verification Checkpoint (CoVe):**
```typescript
// Test database structure
import { hookDatabase } from './data/hookDatabase';

// Test 1: All required categories present
const requiredCategories = ['patternInterrupt', 'curiosityGap', 'statBomb', 'contrarian', 'result', 'question', 'story'];
requiredCategories.forEach(category => {
  console.assert(category in hookDatabase, `Missing category: ${category}`);
});

// Test 2: Each category has templates
Object.entries(hookDatabase).forEach(([category, templates]) => {
  console.assert(Array.isArray(templates), `${category} should be array`);
  console.assert(templates.length > 0, `${category} should have templates`);
});

console.log('✅ Hook database structure validated');
```

---

### STEP 3.2: Integrate Hook Database into Subsystem 3

**Execution Instructions:**

```typescript
// File: /src/lib/ai/generation.ts (or your generation logic file)

import { hookDatabase, HookCategory } from '../data/hookDatabase';

// Function to adapt hook templates to user context
function adaptHookTemplate(template: string, context: {
  topic: string;
  uav: string;
  audience: string;
  [key: string]: any;
}): string {
  // Replace placeholders in template
  return template
    .replace(/{action}/g, context.action || 'this')
    .replace(/{common practice}/g, context.commonPractice || 'the standard approach')
    .replace(/{outcome}/g, context.outcome || 'the result')
    .replace(/{assumption}/g, context.assumption || 'what you think')
    .replace(/{X}/g, context.x || 'this')
    .replace(/{Y}/g, context.y || 'that')
    .replace(/{number}/g, context.number || '90')
    .replace(/{audience}/g, context.audience || 'people')
    .replace(/{fact}/g, context.fact || 'this')
    // ... more replacements
    ;
}

// Function called by enhanced prompt's Subsystem 3
export async function generateHooks(userContext: any): Promise<Hook[]> {
  const hooks: Hook[] = [];
  
  // 1. Pull templates from hookDatabase (SOURCE 1)
  const categories: HookCategory[] = ['patternInterrupt', 'statBomb', 'curiosityGap', 'contrarian'];
  
  categories.forEach(category => {
    const templates = hookDatabase[category];
    const template = templates[Math.floor(Math.random() * templates.length)];
    const adaptedHook = adaptHookTemplate(template, userContext);
    
    hooks.push({
      text: adaptedHook,
      category,
      source: 'hookDatabase',
      // ... other properties
    });
  });
  
  // 2. Perform viral research if web_search available (SOURCE 2)
  if (typeof web_search !== 'undefined') {
    try {
      const viralHooks = await performViralResearch(userContext);
      hooks.push(...viralHooks);
    } catch (error) {
      console.warn('Viral research failed, continuing with database hooks', error);
    }
  }
  
  // 3. Apply neuroscience principles (SOURCE 3)
  const validatedHooks = hooks.map(hook => validateNeuralMechanism(hook));
  
  // 4. Rank and return
  return rankHooksByRetentionScore(validatedHooks);
}
```

**Verification Checkpoint (CoVe):**
```typescript
// Test hook generation
const testContext = {
  topic: 'cold calling',
  audience: 'sales reps',
  uav: 'permission framework',
  number: '90',
  commonPractice: 'asking permission after calling'
};

const generatedHooks = await generateHooks(testContext);

// Test 1: Hooks generated
console.assert(generatedHooks.length >= 4, 'Should generate at least 4 hooks');

// Test 2: Each hook has required properties
generatedHooks.forEach(hook => {
  console.assert(hook.text, 'Hook should have text');
  console.assert(hook.category, 'Hook should have category');
  console.assert(hook.source, 'Hook should have source');
});

// Test 3: Templates adapted with context
const hasContextTerms = generatedHooks.some(hook => 
  hook.text.includes('sales') || hook.text.includes('90') || hook.text.includes('permission')
);
console.assert(hasContextTerms, 'Hooks should incorporate user context');

console.log('✅ Hook generation integration validated');
```

---

## 💬 PHASE 4: DISCOVERY FLOW ENHANCEMENT

### STEP 4.1: Implement Adaptive Question Count

**Chain-of-Thought Reasoning:**
```
CURRENT FLOW (inferred):
  1. User provides initial input
  2. System asks fixed number of questions (e.g., always 5)
  3. Proceed to generation

ENHANCED FLOW (required):
  1. User provides initial input
  2. System diagnoses input level (Cold/Unstructured/Intuitive/Architected)
  3. System asks 2-6+ questions based on diagnosis
  4. After 3 questions, offer progression gate
  5. User chooses: continue questions OR generate now

IMPLEMENTATION REQUIREMENTS:
  - Input level classification logic
  - Dynamic question generation
  - Progression gate UI
  - State management for question history
```

**Execution Instructions:**

```typescript
// File: /src/lib/ai/discovery.ts

export type InputLevel = 'COLD' | 'UNSTRUCTURED' | 'INTUITIVE' | 'ARCHITECTED';

// Step 4.1.1: Input level classifier
export function classifyInputLevel(userInput: string): InputLevel {
  const wordCount = userInput.split(/\s+/).length;
  const hasTopic = /video about|content about|script for/i.test(userInput);
  const hasAudience = /audience|target|viewers|customers/i.test(userInput);
  const hasStructure = /hook|context|conflict|turning point|resolution/i.test(userInput);
  const has5Part = (userInput.match(/hook|context|conflict|turning|resolution/gi) || []).length >= 3;
  
  if (has5Part && hasStructure) return 'ARCHITECTED';
  if (wordCount > 50 && hasAudience && hasTopic) return 'INTUITIVE';
  if (wordCount > 20 && hasTopic) return 'UNSTRUCTURED';
  return 'COLD';
}

// Step 4.1.2: Determine question count
export function getQuestionCount(level: InputLevel): { min: number; max: number; standard: number } {
  switch (level) {
    case 'ARCHITECTED': return { min: 2, max: 3, standard: 2 };
    case 'INTUITIVE': return { min: 3, max: 4, standard: 3 };
    case 'UNSTRUCTURED': return { min: 4, max: 5, standard: 4 };
    case 'COLD': return { min: 5, max: Infinity, standard: 6 };
  }
}

// Step 4.1.3: Discovery state management
interface DiscoveryState {
  inputLevel: InputLevel;
  questionsAsked: number;
  questionCount: { min: number; max: number; standard: number };
  answers: Record<string, string>;
  showProgressionGate: boolean;
}

export function shouldShowProgressionGate(state: DiscoveryState): boolean {
  return state.questionsAsked >= 3 && !state.showProgressionGate;
}

export function canProceedToGeneration(state: DiscoveryState): boolean {
  return state.questionsAsked >= state.questionCount.min;
}

// Step 4.1.4: Generate next question
export function getNextQuestion(state: DiscoveryState, userContext: any): string {
  const { inputLevel, questionsAsked } = state;
  
  // Question banks by input level (from enhanced prompt)
  const questionBanks = {
    COLD: [
      "Who exactly is your target audience? Please be specific about their role, pain points, and current situation.",
      "After watching this video, what specific action or realization should the viewer have?",
      "What makes YOUR perspective on this topic different or valuable?",
      "What proof or credentials do you have that will make viewers trust you?",
      "Which platforms will this content live on, and how long should it be?"
    ],
    UNSTRUCTURED: [
      "What's the 'before' state—the normal approach people currently use?",
      "What specific struggle or obstacle do people hit when they try that approach?",
      "What's the key insight that changes everything?"
    ],
    INTUITIVE: [
      "Can we make the opening more shocking to stop the scroll?",
      "What specific moment was most frustrating in the struggle?",
      "Should the call-to-action be soft, educational, conversational, or direct?"
    ],
    ARCHITECTED: [
      "Should the tone be authoritative, conversational, intense, or inspiring?",
      "Any visual style preferences?"
    ]
  };
  
  const questions = questionBanks[inputLevel];
  return questions[Math.min(questionsAsked, questions.length - 1)];
}
```

**Verification Checkpoint (CoVe):**
```typescript
// Test 1: Classification accuracy
const coldInput = "make video about AI";
console.assert(classifyInputLevel(coldInput) === 'COLD', 'Should classify as COLD');

const architectedInput = "Hook: 90% fail (RAS trigger). Context: old method. Conflict: why it fails. Turning Point: new insight. Resolution: results.";
console.assert(classifyInputLevel(architectedInput) === 'ARCHITECTED', 'Should classify as ARCHITECTED');

// Test 2: Question count logic
const coldCount = getQuestionCount('COLD');
console.assert(coldCount.min === 5, 'COLD should have min 5 questions');

const architectedCount = getQuestionCount('ARCHITECTED');
console.assert(architectedCount.min === 2, 'ARCHITECTED should have min 2 questions');

// Test 3: Progression gate
const testState: DiscoveryState = {
  inputLevel: 'UNSTRUCTURED',
  questionsAsked: 3,
  questionCount: { min: 4, max: 5, standard: 4 },
  answers: {},
  showProgressionGate: false
};
console.assert(shouldShowProgressionGate(testState) === true, 'Should show gate after 3 questions');

console.log('✅ Discovery flow logic validated');
```

---

### STEP 4.2: Progression Gate UI Implementation

**Execution Instructions:**

```typescript
// File: /src/components/DiscoveryFlow.tsx

import React, { useState } from 'react';

interface ProgressionGateProps {
  onContinueQuestions: () => void;
  onGenerateNow: () => void;
}

export const ProgressionGate: React.FC<ProgressionGateProps> = ({
  onContinueQuestions,
  onGenerateNow
}) => {
  return (
    <div className="progression-gate">
      <div className="gate-message">
        <h3>You can continue answering questions to increase output quality,</h3>
        <p>or generate hooks now with what we have.</p>
        <p className="quality-note">
          <strong>Continuing ensures the output is optimally tailored to your unique value proposition and audience.</strong>
        </p>
      </div>
      
      <div className="gate-actions">
        <button 
          onClick={onContinueQuestions}
          className="btn-secondary"
        >
          Continue Questions
        </button>
        
        <button 
          onClick={onGenerateNow}
          className="btn-primary"
        >
          Generate Hooks Now
        </button>
      </div>
    </div>
  );
};

// File: /src/components/ChatInterface.tsx

export const ChatInterface: React.FC = () => {
  const [discoveryState, setDiscoveryState] = useState<DiscoveryState>({
    inputLevel: 'COLD',
    questionsAsked: 0,
    questionCount: { min: 2, max: 6, standard: 3 },
    answers: {},
    showProgressionGate: false
  });
  
  const handleUserMessage = async (message: string) => {
    // If first message, classify input level
    if (discoveryState.questionsAsked === 0) {
      const level = classifyInputLevel(message);
      const counts = getQuestionCount(level);
      setDiscoveryState(prev => ({ ...prev, inputLevel: level, questionCount: counts }));
    }
    
    // Store answer
    const questionKey = `q${discoveryState.questionsAsked}`;
    setDiscoveryState(prev => ({
      ...prev,
      answers: { ...prev.answers, [questionKey]: message },
      questionsAsked: prev.questionsAsked + 1
    }));
    
    // Check if should show progression gate
    if (shouldShowProgressionGate(discoveryState)) {
      setDiscoveryState(prev => ({ ...prev, showProgressionGate: true }));
      return; // Show gate, don't ask next question yet
    }
    
    // Check if can proceed to generation
    if (canProceedToGeneration(discoveryState) && !discoveryState.showProgressionGate) {
      // Ask next question
      const nextQuestion = getNextQuestion(discoveryState, {});
      appendMessage({ role: 'assistant', content: nextQuestion });
    }
  };
  
  const handleContinueQuestions = () => {
    setDiscoveryState(prev => ({ ...prev, showProgressionGate: false }));
    const nextQuestion = getNextQuestion(discoveryState, {});
    appendMessage({ role: 'assistant', content: nextQuestion });
  };
  
  const handleGenerateNow = async () => {
    setDiscoveryState(prev => ({ ...prev, showProgressionGate: false }));
    // Proceed to hook generation
    await generateHooks(discoveryState.answers);
  };
  
  return (
    <div className="chat-interface">
      {/* Messages */}
      {messages.map(msg => <Message key={msg.id} {...msg} />)}
      
      {/* Progression Gate */}
      {discoveryState.showProgressionGate && (
        <ProgressionGate 
          onContinueQuestions={handleContinueQuestions}
          onGenerateNow={handleGenerateNow}
        />
      )}
      
      {/* Input */}
      <MessageInput onSend={handleUserMessage} />
    </div>
  );
};
```

**Verification Checklist:**
- [ ] Input level classification working
- [ ] Question count adapts to input level
- [ ] Progression gate appears after 3 questions
- [ ] "Continue Questions" button asks next question
- [ ] "Generate Now" button proceeds to hook generation
- [ ] State persists across interactions

---

## 🎨 PHASE 5: FRONTEND PANEL UPDATES

### STEP 5.1: Rename "Tech Specs" to "Cinematography/Director"

**Execution Instructions:**

```typescript
// File: /src/constants/panels.ts

export enum PanelType {
  SCRIPT = 'script',
  STORYBOARD = 'storyboard',
  BROLL = 'broll',
  CINEMATOGRAPHY = 'cinematography', // CHANGED from 'techSpecs'
  CAPTIONS = 'captions',
  DEPLOYMENT = 'deployment' // NEW
}

export const PANEL_LABELS = {
  [PanelType.SCRIPT]: 'Script',
  [PanelType.STORYBOARD]: 'Storyboard',
  [PanelType.BROLL]: 'B-Roll',
  [PanelType.CINEMATOGRAPHY]: 'Cinematography / Director', // CHANGED
  [PanelType.CAPTIONS]: 'Captions',
  [PanelType.DEPLOYMENT]: 'Deployment Strategy' // NEW
};

// File: /src/components/OutputPanel.tsx

export const OutputPanel: React.FC = ({ data }) => {
  const [activePanel, setActivePanel] = useState<PanelType>(PanelType.SCRIPT);
  
  return (
    <div className="output-panel">
      {/* Tab Navigation */}
      <div className="panel-tabs">
        {Object.values(PanelType).map(panel => (
          <button
            key={panel}
            className={`tab ${activePanel === panel ? 'active' : ''}`}
            onClick={() => setActivePanel(panel)}
          >
            {PANEL_LABELS[panel]}
          </button>
        ))}
      </div>
      
      {/* Panel Content */}
      <div className="panel-content">
        {activePanel === PanelType.SCRIPT && <ScriptPanel data={data.script} />}
        {activePanel === PanelType.STORYBOARD && <StoryboardPanel data={data.storyboard} />}
        {activePanel === PanelType.BROLL && <BRollPanel data={data.broll} />}
        {activePanel === PanelType.CINEMATOGRAPHY && (
          <CinematographyPanel data={data.cinematography} />
        )}
        {activePanel === PanelType.CAPTIONS && <CaptionsPanel data={data.captions} />}
        {activePanel === PanelType.DEPLOYMENT && <DeploymentPanel data={data.deployment} />}
      </div>
    </div>
  );
};
```

---

### STEP 5.2: Implement Cinematography Panel (Dual-Mode Display)

**Execution Instructions:**

```typescript
// File: /src/components/CinematographyPanel.tsx

export const CinematographyPanel: React.FC<{ data: any }> = ({ data }) => {
  const [mode, setMode] = useState<'beginner' | 'expert'>('beginner');
  
  return (
    <div className="cinematography-panel">
      {/* Mode Toggle */}
      <div className="mode-toggle">
        <button
          className={`mode-btn ${mode === 'beginner' ? 'active' : ''}`}
          onClick={() => setMode('beginner')}
        >
          Beginner Mode
          <span className="mode-desc">Accessible instructions for smartphone/basic gear</span>
        </button>
        
        <button
          className={`mode-btn ${mode === 'expert' ? 'active' : ''}`}
          onClick={() => setMode('expert')}
        >
          Expert Mode
          <span className="mode-desc">Technical cinematography breakdown</span>
        </button>
      </div>
      
      {/* Content Display */}
      {mode === 'beginner' && (
        <BeginnerCinematographyGuide data={data.beginnerMode} />
      )}
      
      {mode === 'expert' && (
        <ExpertCinematographyGuide data={data.expertMode} />
      )}
    </div>
  );
};
```

---

### STEP 5.3: Create Deployment Strategy Panel

**Execution Instructions:**

```typescript
// File: /src/components/DeploymentPanel.tsx

export const DeploymentPanel: React.FC<{ data: any }> = ({ data }) => {
  return (
    <div className="deployment-panel">
      {/* Platform Strategy */}
      <section className="platform-strategy">
        <h2>Platform Strategy</h2>
        <div className="primary-platform">
          <h3>Primary Platform: {data.primaryPlatform}</h3>
          <p>{data.primaryReasoning}</p>
        </div>
        
        <div className="secondary-platforms">
          <h3>Secondary Platforms</h3>
          {data.secondaryPlatforms.map(p => (
            <div key={p.platform} className="platform-card">
              <h4>{p.platform}</h4>
              <p>{p.adaptation}</p>
              <span className="timing">Post {p.timing} after primary</span>
            </div>
          ))}
        </div>
      </section>
      
      {/* Posting Schedule */}
      <section className="posting-schedule">
        <h2>Posting Schedule</h2>
        <div className="schedule-timeline">
          {data.postingSchedule.map((day, idx) => (
            <div key={idx} className="day-schedule">
              <h3>{day.day}</h3>
              {day.actions.map((action, aidx) => (
                <div key={aidx} className="action-item">
                  <span className="time">{action.time}</span>
                  <span className="platform-badge">{action.platform}</span>
                  <p>{action.action}</p>
                  {action.notes && <small>{action.notes}</small>}
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>
      
      {/* Algorithm Optimization */}
      <section className="algorithm-tips">
        <h2>Platform-Specific Optimization</h2>
        {Object.entries(data.algorithmTactics).map(([platform, tactics]: [string, any]) => (
          <details key={platform} className="platform-tactics">
            <summary>{platform}</summary>
            <ul>
              {Object.entries(tactics).map(([key, value]) => (
                <li key={key}>
                  <strong>{key}:</strong> {value}
                </li>
              ))}
            </ul>
          </details>
        ))}
      </section>
      
      {/* Performance Projections */}
      <section className="projections">
        <h2>Expected Performance</h2>
        <div className="projection-cards">
          {Object.entries(data.projections).map(([platform, proj]: [string, any]) => (
            <div key={platform} className="projection-card">
              <h3>{platform}</h3>
              <div className="metrics">
                {Object.entries(proj.week1).map(([metric, value]) => (
                  <div key={metric} className="metric">
                    <span className="label">{metric}:</span>
                    <span className="value">{value}</span>
                  </div>
                ))}
              </div>
              <div className="confidence">
                Confidence: {proj.confidenceLevel}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
```

**Verification Checklist:**
- [ ] 6 panels visible in tab navigation
- [ ] "Tech Specs" renamed to "Cinematography / Director"
- [ ] Cinematography panel has Beginner/Expert toggle
- [ ] Deployment Strategy panel renders correctly
- [ ] All panels receive correct data from generation output

---

## ✅ PHASE 6: INTEGRATION TESTING (CoVe - Chain of Verification)

### STEP 6.1: Unit Tests

**Test File: `__tests__/cal-enhanced.test.ts`**

```typescript
import { classifyInputLevel, getQuestionCount, adaptHookTemplate } from '../lib/ai/discovery';
import { hookDatabase } from '../data/hookDatabase';
import { getContentGenerationPrompt } from '../constants/prompts';

describe('C.A.L. Enhanced System - Unit Tests', () => {
  
  describe('Input Classification', () => {
    test('should classify cold input correctly', () => {
      const input = "make video about productivity";
      expect(classifyInputLevel(input)).toBe('COLD');
    });
    
    test('should classify architected input correctly', () => {
      const input = "Hook: stat bomb triggers RAS. Context: establish baseline. Conflict: show failure. Turning Point: reveal insight. Resolution: show results.";
      expect(classifyInputLevel(input)).toBe('ARCHITECTED');
    });
  });
  
  describe('Question Count Logic', () => {
    test('should return correct range for COLD input', () => {
      const counts = getQuestionCount('COLD');
      expect(counts.min).toBe(5);
      expect(counts.standard).toBe(6);
    });
    
    test('should return correct range for ARCHITECTED input', () => {
      const counts = getQuestionCount('ARCHITECTED');
      expect(counts.min).toBe(2);
      expect(counts.max).toBe(3);
    });
  });
  
  describe('Hook Database', () => {
    test('should have all required categories', () => {
      const required = ['patternInterrupt', 'curiosityGap', 'statBomb', 'contrarian'];
      required.forEach(cat => {
        expect(hookDatabase).toHaveProperty(cat);
        expect(Array.isArray(hookDatabase[cat])).toBe(true);
      });
    });
    
    test('should adapt templates with context', () => {
      const template = "{number}% of {audience} don't know {fact}";
      const context = { number: '90', audience: 'sales reps', fact: 'this trick' };
      const result = adaptHookTemplate(template, context);
      expect(result).toBe("90% of sales reps don't know this trick");
    });
  });
  
  describe('System Prompt Selection', () => {
    test('should return legacy prompt when flag is off', () => {
      process.env.ENHANCED_CAL = 'false';
      const prompt = getContentGenerationPrompt();
      expect(prompt).toContain('LEGACY'); // or your legacy prompt identifier
    });
    
    test('should return enhanced prompt when flag is on', () => {
      process.env.ENHANCED_CAL = 'true';
      const prompt = getContentGenerationPrompt();
      expect(prompt).toContain('NEUROBIOLOGY-GROUNDED');
    });
  });
  
});
```

**Run tests:**
```bash
npm test -- __tests__/cal-enhanced.test.ts
```

**Expected output:**
```
 PASS  __tests__/cal-enhanced.test.ts
  ✓ Input Classification (4ms)
  ✓ Question Count Logic (2ms)
  ✓ Hook Database (3ms)
  ✓ System Prompt Selection (2ms)

Test Suites: 1 passed, 1 total
Tests:       8 passed, 8 total
```

---

### STEP 6.2: End-to-End User Flow Test

**Test Scenario: Level 2 (Unstructured) Input → Full Output**

```typescript
// File: __tests__/e2e/cal-full-flow.test.ts

describe('C.A.L. Enhanced - E2E Flow', () => {
  test('should complete full generation flow for unstructured input', async () => {
    // Enable enhanced prompt
    process.env.ENHANCED_CAL = 'true';
    
    // Step 1: User provides unstructured input
    const userInput = "50% of sales reps fail because they ask permission after interrupting. Our method asks permission first. This fixes the adversarial frame.";
    
    // Step 2: System classifies input
    const level = classifyInputLevel(userInput);
    expect(level).toBe('UNSTRUCTURED');
    
    // Step 3: System asks questions (should ask 4 for UNSTRUCTURED)
    const counts = getQuestionCount(level);
    expect(counts.standard).toBe(4);
    
    // Step 4: Simulate question/answer flow
    const mockAnswers = {
      q1: "B2B sales reps making 50+ cold calls per day",
      q2: "Realize their opening line creates adversarial frame",
      q3: "Permission Framework - ask before calling",
      q4: "We tested with 500 calls, went from 3% to 31% connection rate"
    };
    
    // Step 5: Generate content
    const generationResult = await generateContent({
      input: userInput,
      answers: mockAnswers,
      duration: 90
    });
    
    // Step 6: Verify output structure
    expect(generationResult).toHaveProperty('script');
    expect(generationResult).toHaveProperty('storyboard');
    expect(generationResult).toHaveProperty('cinematography');
    expect(generationResult).toHaveProperty('broll');
    expect(generationResult).toHaveProperty('captions');
    expect(generationResult).toHaveProperty('deployment'); // NEW 6th panel
    
    // Step 7: Verify script meets duration requirements
    const wordCount = generationResult.script.reduce((sum, line) => sum + line.wordCount, 0);
    expect(wordCount).toBeGreaterThanOrEqual(210); // 90s * 2.5 * 0.9 (90% threshold)
    expect(wordCount).toBeLessThanOrEqual(245); // 90s * 2.5 * 1.1 (110% threshold)
    
    // Step 8: Verify UAV integration
    const scriptText = generationResult.script.map(l => l.text).join(' ');
    expect(scriptText).toContain('Permission'); // User's UAV term
    
    // Step 9: Verify SPCL integration
    expect(scriptText).toMatch(/3%.*31%/); // Credibility: specific numbers
    
    // Step 10: Verify failure mode prevention
    expect(generationResult.verificationReport.checkpoint4_failureModes.driftRisk).toBe('LOW');
    expect(generationResult.verificationReport.checkpoint4_failureModes.noiseRisk).toBe('LOW');
    expect(generationResult.verificationReport.checkpoint4_failureModes.rejectionRisk).toBe('LOW');
  }, 60000); // 60s timeout for full generation
});
```

**Run E2E test:**
```bash
npm run test:e2e -- __tests__/e2e/cal-full-flow.test.ts
```

**Expected output:**
```
 PASS  __tests__/e2e/cal-full-flow.test.ts (45s)
  ✓ should complete full generation flow for unstructured input (42891ms)

Test Suites: 1 passed, 1 total
Tests:       1 passed, 1 total
```

---

### STEP 6.3: Performance Validation

**Benchmark Test:**

```typescript
// File: __tests__/performance/generation-benchmark.test.ts

describe('C.A.L. Performance Benchmarks', () => {
  test('should generate content within acceptable time', async () => {
    const startTime = Date.now();
    
    await generateContent({
      input: "Test input for performance",
      answers: { /* mock answers */ },
      duration: 90
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Should complete within 30 seconds
    expect(duration).toBeLessThan(30000);
    
    console.log(`Generation completed in ${duration}ms`);
  });
  
  test('should not cause memory leaks', async () => {
    const initialMemory = process.memoryUsage().heapUsed;
    
    // Run 10 generations
    for (let i = 0; i < 10; i++) {
      await generateContent({
        input: `Test ${i}`,
        answers: {},
        duration: 90
      });
    }
    
    // Force garbage collection
    if (global.gc) global.gc();
    
    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = finalMemory - initialMemory;
    
    // Memory increase should be < 50MB
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    
    console.log(`Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
  });
});
```

**Run with:**
```bash
node --expose-gc node_modules/.bin/jest __tests__/performance/generation-benchmark.test.ts
```

---

## 🔄 PHASE 7: ROLLBACK PREPARATION

### STEP 7.1: Create Rollback Script

**File: `scripts/rollback-cal-enhanced.sh`**

```bash
#!/bin/bash

echo "🔄 Rolling back C.A.L. Enhanced System Prompt"

# Step 1: Confirm rollback
read -p "Are you sure you want to rollback to legacy prompt? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "Rollback cancelled"
    exit 1
fi

# Step 2: Set feature flag to OFF
export ENHANCED_CAL=false
echo "✓ Feature flag set to OFF"

# Step 3: Restart application
echo "🔄 Restarting application..."
npm run restart

# Step 4: Verify
sleep 5
curl -s http://localhost:3000/health | grep "legacy"
if [ $? -eq 0 ]; then
    echo "✅ Rollback successful - Legacy prompt active"
else
    echo "⚠️ Rollback verification failed - Check logs"
fi
```

**Make executable:**
```bash
chmod +x scripts/rollback-cal-enhanced.sh
```

---

### STEP 7.2: Document Rollback Procedure

**File: `docs/ROLLBACK.md`**

```markdown
# C.A.L. Enhanced Rollback Procedure

## Instant Rollback (Feature Flag)

### Method 1: Environment Variable
```bash
export ENHANCED_CAL=false
npm run restart
```

### Method 2: Rollback Script
```bash
./scripts/rollback-cal-enhanced.sh
```

### Verification
Check that legacy prompt is active:
```bash
curl http://localhost:3000/api/prompt-version
# Should return: { version: "legacy", enhanced: false }
```

## Full Rollback (Git)

If feature flag method fails:

```bash
# Step 1: Checkout main branch
git checkout main

# Step 2: Force deploy previous version
git reset --hard HEAD~1

# Step 3: Rebuild and redeploy
npm run build
npm run deploy
```

## Post-Rollback Checklist

- [ ] Verify application is accessible
- [ ] Test basic generation flow
- [ ] Check error logs for issues
- [ ] Notify team of rollback
- [ ] Document reason for rollback
- [ ] Plan fix for issues that caused rollback
```

---

## 📚 PHASE 8: DOCUMENTATION & DEPLOYMENT

### STEP 8.1: Update Developer Documentation

**File: `docs/CAL-ENHANCED-SYSTEM.md`**

```markdown
# C.A.L. Enhanced System Documentation

## Overview

The enhanced C.A.L. system implements neurobiology-grounded content generation with adaptive discovery, intelligent hook generation, and comprehensive output across 6 panels.

## Architecture

### System Prompt
- **Location:** `/src/constants/prompts.ts`
- **Versions:** Legacy (v1.0) + Enhanced (v2.0)
- **Selection:** Feature flag `ENHANCED_CAL`

### Subsystems

1. **Input Processor** - Classifies input into 4 levels (Cold/Unstructured/Intuitive/Architected)
2. **Synthetic Research Engine** - Generates insights for gaps
3. **Hook Architect** - Generates 4-7 hooks from database + research
4. **5-Part Script Engine** - Creates biologically-precise scripts
5. **Dual-Mode Cinematography** - Beginner + Expert filming guides
6. **Dynamic Storyboard** - Alpha 3-Pillar visual frames
7. **B-Roll Pipeline** - FIY, Alpha, Omega formats
8. **Platform Caption Engine** - 7-platform optimization
9. **Deployment Strategy** - NEW 6th panel with posting schedule

### Discovery Flow

**Adaptive Question Count:**
- COLD: 5-6+ questions
- UNSTRUCTURED: 4-5 questions
- INTUITIVE: 3-4 questions
- ARCHITECTED: 2-3 questions

**Progression Gate:** Appears after 3 questions, allows user to continue or generate

### Hook Database

**Location:** `/src/data/hookDatabase.ts`

**Categories:**
- patternInterrupt
- curiosityGap
- statBomb
- contrarian
- result
- question
- story

## Usage

### Enable Enhanced Prompt

```bash
export ENHANCED_CAL=true
npm run dev
```

### Test Discovery Flow

```typescript
import { classifyInputLevel } from './lib/ai/discovery';

const level = classifyInputLevel(userInput);
console.log(`Input Level: ${level}`);
```

### Generate Hooks

```typescript
import { generateHooks } from './lib/ai/generation';

const hooks = await generateHooks({
  topic: 'cold calling',
  audience: 'sales reps',
  uav: 'permission framework'
});
```

## Verification Protocols

The system includes 6 built-in verification checkpoints:

1. User Content Preservation (≥60% preserved)
2. Word Count Accuracy (90-110% of target)
3. UAV/SPCL Integration (UAV in Turning Point required)
4. Failure Mode Prevention (Drift/Noise/Rejection checks)
5. Platform Alignment (Caption format validation)
6. Coherence Check (Script ↔ Storyboard ↔ B-roll alignment)

## Monitoring

### Health Check Endpoint

```bash
GET /api/health
```

**Response:**
```json
{
  "status": "ok",
  "prompt_version": "enhanced_v2",
  "features": {
    "enhanced_cal": true
  }
}
```

### Generation Metrics

Monitor these metrics:
- Average generation time
- Word count accuracy rate
- Verification checkpoint pass rate
- User satisfaction (from feedback)

## Troubleshooting

### Issue: Script too short

**Cause:** Verification checkpoint 2 failing
**Fix:** Check `MAX_TOKENS` is set to ≥8000

### Issue: Hooks feel generic

**Cause:** Hook database not connected OR viral research unavailable
**Fix:** Verify `hookDatabase` import AND check `web_search` availability

### Issue: Discovery asks too many questions

**Cause:** Input classified as COLD when should be higher
**Fix:** Improve input classification logic in `classifyInputLevel()`

## Migration from Legacy

### Phase 1: Parallel Running
- Both prompts coexist
- Feature flag controls selection
- Users don't see difference

### Phase 2: Gradual Rollout
- Enable for 10% of users
- Monitor for issues
- Increase to 50%, then 100%

### Phase 3: Deprecate Legacy
- Remove legacy prompt code
- Update all docs
- Celebrate 🎉
```

---

### STEP 8.2: Create User-Facing Changelog

**File: `CHANGELOG.md` (append to existing)**

```markdown
## [2.0.0] - 2026-01-XX - C.A.L. Enhanced System

### 🎉 Major Features

#### Intelligent Discovery Flow
- **Adaptive Question Count:** System now asks 2-6+ questions based on how much context you provide
- **Input Level Classification:** Automatically detects if your input is Cold/Unstructured/Intuitive/Architected
- **Progression Gate:** After 3 questions, choose to continue or generate now

#### Enhanced Hook Generation
- **Multi-Source Intelligence:** Hooks now generated from database + viral research + neuroscience principles
- **Recommended Badge:** Top hook highlighted with ⭐ RECOMMENDED based on performance data
- **7 Hook Categories:** Pattern interrupt, curiosity gap, stat bomb, contrarian, result, question, story

#### Neurobiology-Grounded Scripts
- **5-Part Structure:** Hook → Context → Conflict → Turning Point → Resolution
- **Biological Precision:** Each beat designed to trigger specific neural mechanisms
- **Failure Mode Prevention:** Built-in checks prevent Drift/Noise/Rejection protocols

#### Dual-Mode Cinematography (formerly Tech Specs)
- **Beginner Mode:** Smartphone-friendly instructions for 90% of users
- **Expert Mode:** Professional cinematography breakdown with technical specs
- **Scene-by-Scene Guidance:** Filming instructions for every story beat

#### NEW: Deployment Strategy Panel (6th Panel)
- **Platform-Specific Timing:** When to post on each platform for maximum reach
- **Repurposing Schedule:** Multi-platform distribution plan
- **Algorithm Optimization:** Platform-specific tactics (first-hour engagement, hashtag strategy, etc.)
- **Performance Projections:** Expected views, engagement, and growth

#### Enhanced Output Quality
- **Word Count Verification:** Scripts now guaranteed to match requested duration (90-110% accuracy)
- **UAV/SPCL Integration:** Your unique value and authority markers woven throughout content
- **6 Verification Checkpoints:** Automatic quality checks before output delivery

### 🔧 Improvements

- **B-Roll Now Three-Format:** FIY (film yourself) + Alpha (image prompt) + Omega (video prompt)
- **Platform Captions Expanded:** Now includes 7 platforms (TikTok, Instagram, YouTube Shorts, LinkedIn, Twitter, Threads, YouTube Long)
- **Storyboard Alpha Prompts:** Each frame now includes full 3-Pillar (Structure, Reference, Vision) AI-generation-ready prompts

### ⚙️ Technical

- **Feature Flag System:** Can toggle between legacy and enhanced prompts
- **Rollback Safety:** Instant rollback to legacy prompt if issues arise
- **Performance Optimized:** Generation completes in <30 seconds

### 📖 Documentation

- New: [C.A.L. Enhanced System Guide](docs/CAL-ENHANCED-SYSTEM.md)
- New: [Rollback Procedure](docs/ROLLBACK.md)
- Updated: [API Documentation](docs/API.md)

### 🐛 Bug Fixes

- Fixed: Scripts no longer generate below target duration
- Fixed: Hooks now incorporate user's unique expertise (UAV)
- Fixed: Captions now platform-optimized (not generic)

### 💬 Migration Notes

Enhanced system is currently behind feature flag. To enable:
```bash
export ENHANCED_CAL=true
```

No breaking changes to existing functionality—legacy prompt still works.

---

## [1.x.x] - Previous Versions
...
```

---

### STEP 8.3: Deployment Checklist

**Pre-Deployment:**
- [ ] All tests passing (unit + E2E + performance)
- [ ] Code reviewed by team
- [ ] Documentation updated
- [ ] Rollback procedure tested
- [ ] Feature flag defaults to OFF
- [ ] Staging environment deployed and tested

**Deployment Steps:**

```bash
# Step 1: Merge feature branch
git checkout main
git merge feature/cal-enhanced-system-prompt

# Step 2: Tag release
git tag -a v2.0.0 -m "C.A.L. Enhanced System"
git push origin v2.0.0

# Step 3: Deploy to staging
npm run deploy:staging

# Step 4: Smoke test on staging
./scripts/smoke-test.sh staging

# Step 5: Deploy to production (feature flag OFF)
export ENHANCED_CAL=false
npm run deploy:production

# Step 6: Verify production deployment
./scripts/smoke-test.sh production

# Step 7: Enable for 10% of users (gradual rollout)
# Update feature flag service to enable for 10% traffic
./scripts/set-feature-flag.sh ENHANCED_CAL 0.10

# Step 8: Monitor for 24 hours
# Check dashboards, logs, user feedback

# Step 9: Increase to 50% if no issues
./scripts/set-feature-flag.sh ENHANCED_CAL 0.50

# Step 10: Full rollout after 48 hours success
./scripts/set-feature-flag.sh ENHANCED_CAL 1.00
```

**Post-Deployment:**
- [ ] Monitor error rates
- [ ] Check generation completion rates
- [ ] Review user feedback
- [ ] Measure performance metrics
- [ ] Document any issues

---

## 🎯 SUCCESS METRICS

### Technical Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Script Duration Accuracy | 90%+ within target range | Verification checkpoint 2 pass rate |
| Generation Time | <30 seconds | Average time from request to output |
| Error Rate | <1% | Failed generations / total generations |
| User Content Preservation | ≥60% | Verification checkpoint 1 score |

### User Experience Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| User Satisfaction | 4.5+/5 stars | Post-generation feedback survey |
| Feature Adoption | 80%+ use new features | Track 6th panel views, progression gate usage |
| Content Quality | 8+/10 user rating | "Rate this output" prompt |
| Time to Complete | <5 min discovery | Average discovery phase duration |

### Business Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| User Retention | +15% | Week-over-week active users |
| Content Published | +25% | Users who generate → publish |
| Referrals | +20% | "Share with colleague" clicks |
| Premium Upgrades | +10% | Free → paid conversions |

---

## 🎬 FINAL IMPLEMENTATION CHECKLIST

### Core Integration
- [ ] System prompt replaced with enhanced version
- [ ] Feature flag system implemented
- [ ] Both prompts (legacy + enhanced) coexist safely
- [ ] Rollback procedure documented and tested

### Hook Database
- [ ] hookDatabase file created/verified
- [ ] 7 categories with templates
- [ ] Template adaptation logic implemented
- [ ] Integration into Subsystem 3 complete

### Discovery Flow
- [ ] Input level classification working
- [ ] Adaptive question count implemented
- [ ] Progression gate UI created
- [ ] Discovery state management functional

### Frontend Updates
- [ ] "Tech Specs" renamed to "Cinematography/Director"
- [ ] Dual-mode toggle (Beginner/Expert) implemented
- [ ] 6th panel (Deployment Strategy) created
- [ ] All 6 panels render correctly

### Testing
- [ ] Unit tests passing
- [ ] E2E flow test passing
- [ ] Performance benchmarks acceptable
- [ ] Smoke tests on staging passed

### Documentation
- [ ] Developer docs updated
- [ ] User changelog created
- [ ] Rollback procedure documented
- [ ] API docs updated if needed

### Deployment
- [ ] Deployed to staging
- [ ] Smoke tested on staging
- [ ] Deployed to production (flag OFF)
- [ ] Gradual rollout plan ready (10% → 50% → 100%)

---

**END OF META-PROMPT #2 - IMPLEMENTATION PLAN COMPLETE**

This meta-prompt uses advanced prompting techniques (CoT, ToT, Least-to-Most, CoVe) to guide Antigravity through a safe, methodical, and verifiable integration of the enhanced C.A.L. system.
