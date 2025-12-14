# C.A.L. Design Guidelines

## Design Approach: Cyber-Industrial Reference

**Selected Aesthetic**: Modern cyber-industrial interfaces drawing inspiration from:
- **Linear**: Clean typography hierarchy, subtle UI elements, professional tool aesthetic
- **Vercel Dashboard**: Technical precision, monospaced code elements, status indicators
- **GitHub Copilot Chat**: Conversational AI interface patterns, message threading
- **Retool/Internal Tools**: Functional dashboards, panel-based layouts, data density

**Core Principles**:
1. **Functional Clarity**: Every element serves the content generation workflow
2. **Progressive Disclosure**: UI complexity reveals itself as user advances through stages
3. **Technical Precision**: Monospaced fonts for technical elements, clear state communication
4. **Conversational Warmth**: Balance industrial aesthetic with approachable chat interface

---

## Typography System

**Font Families** (via Google Fonts CDN):
- **Primary (Interface)**: `Inter` - Clean, modern sans-serif for UI text
- **Secondary (Technical)**: `JetBrains Mono` - Monospaced for status messages, agent names, JSON previews
- **Accent (Headers)**: `Inter` with tighter letter-spacing for impact

**Type Scale**:
- **Hero Chat Greeting**: text-4xl md:text-5xl font-bold tracking-tight
- **Section Headers**: text-2xl font-semibold tracking-tight
- **Panel Titles**: text-lg font-medium uppercase tracking-wide (e.g., "SCRIPT", "STORYBOARD")
- **Body Text**: text-base leading-relaxed
- **Chat Messages**: text-sm md:text-base
- **Status Indicators**: text-xs font-mono uppercase tracking-widest
- **Captions/Meta**: text-xs opacity-70

**Hierarchy Rules**:
- Chat input uses text-base, responses use text-sm for scannability
- Dashboard panel content uses text-sm for density
- Agent status uses font-mono with text-xs for technical feel
- All caps + letter-spacing for labels and status badges

---

## Layout & Spacing System

**Tailwind Spacing Primitives**: Use units of **2, 4, 6, 8, 12, 16** for consistency
- **Micro spacing** (p-2, gap-2): Tight element groupings, badges
- **Standard spacing** (p-4, gap-4, m-4): Default component padding, list items
- **Section spacing** (p-6, py-8): Card interiors, panel headers
- **Major spacing** (p-8, py-12, gap-8): Between major sections, dashboard columns
- **Breathing room** (py-16): Stage transitions, loading states

**Grid System**:
- **Single Column Mobile**: All content stacks (base styles)
- **Split Dashboard (Desktop)**: 40% chat / 60% output panels (lg:grid-cols-[2fr_3fr])
- **Output Panel Grid**: 2-column for storyboard frames (grid-cols-1 md:grid-cols-2)

**Container Strategy**:
- Chat interface: max-w-3xl mx-auto for comfortable reading width
- Dashboard panels: Full width within split, no artificial constraints
- Hook selection cards: max-w-4xl with grid-cols-1 md:grid-cols-2 gap-4

---

## Component Library

### 1. Chat Interface
**Message Thread**:
- User messages: Right-aligned, compact width (max-w-lg ml-auto)
- AI responses: Left-aligned, wider width (max-w-2xl)
- Message bubbles: Rounded corners (rounded-xl), padding p-4
- Spacing between messages: space-y-6

**Input Field**:
- Full-width container with rounded-2xl border
- Inner padding: p-4
- Height: min-h-[120px] with auto-expand
- Submit button: Integrated within input area (bottom-right)

### 2. Hook Selection Cards
**Card Structure**:
- Border style: border with rounded-xl
- Padding: p-6
- Hover state: Subtle transform (hover:scale-[1.02]) with transition-transform
- Selected state: Border width increase + opacity change
- Content: Hook text (font-semibold text-lg) + preview snippet (text-sm opacity-70)
- Layout: Grid of 2 columns on md+ (grid-cols-1 md:grid-cols-2 gap-4)

### 3. Status/Thinking State
**Agent Indicators**:
- Container: flex items-center gap-3
- Agent name: font-mono text-xs uppercase tracking-widest
- Status text: text-sm font-normal
- Animated pulse indicator: w-2 h-2 rounded-full with animate-pulse
- List spacing: space-y-4
- Overall container: Centered, max-w-md mx-auto p-8

### 4. Dashboard Split View
**Layout Architecture**:
- Container: lg:grid lg:grid-cols-[2fr_3fr] h-screen
- Left panel (Chat): overflow-y-auto with persistent scrollbar
- Right panel (Output): overflow-y-auto with tab navigation
- Divider: 1px border-l between panels

**Tab Navigation** (for 5 panels):
- Horizontal tabs at top of right panel
- Tab style: px-6 py-3 text-sm font-medium uppercase tracking-wide
- Active tab: border-b-2 indicator
- Tab spacing: gap-1
- Content area: p-8

### 5. Output Panels
**Script Panel**:
- Monospaced font for script lines (font-mono text-sm)
- Line numbers in left gutter (text-xs opacity-50)
- Sections separated by py-6

**Storyboard Panel**:
- Grid layout: grid-cols-1 md:grid-cols-2 gap-6
- Frame cards: border rounded-lg p-4
- Frame number: text-xs font-mono uppercase
- Shot description: text-sm leading-relaxed
- Visual notes: text-xs opacity-70 italic mt-2

**Tech Specs/B-Roll Panels**:
- Definition list style (dl/dt/dd structure)
- Labels: font-medium text-xs uppercase tracking-wide
- Values: text-sm mt-1
- Spacing: space-y-4

**Captions Panel**:
- List of timestamp + caption pairs
- Timestamp: font-mono text-xs
- Caption text: text-sm leading-snug
- Spacing: space-y-3

### 6. Buttons & Controls
**Primary CTA** (e.g., "Generate Hooks"):
- Size: px-8 py-3
- Typography: text-base font-semibold
- Rounded: rounded-xl
- Full-width on mobile: w-full md:w-auto

**Secondary Actions**:
- Size: px-6 py-2
- Typography: text-sm font-medium
- Rounded: rounded-lg

**Status Badges**:
- Size: px-3 py-1
- Typography: text-xs font-mono uppercase tracking-widest
- Rounded: rounded-full

---

## Animation Strategy

**Minimal, Purposeful Motion**:
1. **State Transitions**: Fade-in for new chat messages (animate-in)
2. **Hook Selection**: Gentle scale on hover (hover:scale-[1.02])
3. **Agent Status**: Pulse animation on active indicator dot (animate-pulse)
4. **Panel Switching**: Instant tab switch, no slide animations
5. **Loading States**: Simple spinner, no elaborate animations

**Avoid**: Page transitions, scroll-triggered effects, parallax, complex orchestrated animations

---

## No Images Required

This is a functional AI tool interface. All visual interest comes from:
- Typography hierarchy and contrast
- Structured layouts with clear information architecture
- Monospaced technical elements
- Status indicators and state visualization
- Well-designed component spacing and rhythm

No hero images, stock photos, or decorative illustrations needed. The interface is purely functional with cyber-industrial typographic treatment.