# C.A.L. Design Guidelines

## Design Approach: Modern Creative Platform

**Selected Aesthetic**: Clean, modern creative platform inspired by Lovable's content-spark-studio design:
- **Primary Colors**: Purple gradient (violet-to-purple) for brand identity and CTAs
- **Accent Colors**: Teal/cyan for success states and highlights
- **Dark Sidebar**: Professional dark theme sidebar for navigation
- **Clean Cards**: White/light cards with subtle hover effects

**Core Principles**:
1. **Functional Clarity**: Every element serves the content generation workflow
2. **Progressive Disclosure**: UI complexity reveals itself as user advances through stages
3. **Gradient Branding**: Purple gradient as primary brand color across buttons and accents
4. **Conversational Warmth**: Balance professional aesthetic with approachable chat interface

---

## Typography System

**Font Families** (via Google Fonts CDN):
- **Primary (Interface)**: `Space Grotesk` - Modern, geometric sans-serif for all UI text
- **Secondary (Technical)**: `JetBrains Mono` - Monospaced for code, status messages, technical elements

**Type Scale**:
- **Hero Titles**: text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight
- **Section Headers**: text-2xl md:text-3xl font-bold
- **Panel Titles**: text-lg font-semibold
- **Body Text**: text-base leading-relaxed
- **Chat Messages**: text-sm md:text-base
- **Status Indicators**: text-xs font-mono uppercase tracking-widest
- **Captions/Meta**: text-xs text-muted-foreground

---

## Color System

### Light Mode
- **Background**: Soft blue-gray (`220 20% 97%`)
- **Foreground**: Dark blue-gray (`220 30% 10%`)
- **Primary**: Vibrant purple (`250 75% 55%`)
- **Accent**: Teal (`170 70% 45%`)
- **Cards**: Pure white (`0 0% 100%`)
- **Muted**: Soft gray (`220 15% 94%`)

### Dark Mode
- **Background**: Deep blue-gray (`220 25% 8%`)
- **Foreground**: Light blue-gray (`220 10% 95%`)
- **Primary**: Bright purple (`250 75% 60%`)
- **Accent**: Bright teal (`170 70% 50%`)
- **Cards**: Elevated dark (`220 25% 12%`)
- **Muted**: Dark gray (`220 20% 15%`)

### Sidebar (Always Dark)
- **Background**: Very dark blue (`220 25% 12%` light, `220 30% 6%` dark)
- **Primary**: Purple accent (`250 75% 60%`)
- **Accent Hover**: Elevated dark (`220 20% 18%`)
- **Border**: Subtle dark border (`220 20% 20%`)

### Custom C.A.L. Tokens
- **Gradient Start**: Purple (`250 75% 55%`)
- **Gradient End**: Magenta-purple (`280 80% 60%`)
- **Success**: Green (`145 65% 45%`)
- **Warning**: Orange (`40 90% 50%`)
- **Info**: Blue (`200 85% 50%`)

---

## Gradient Utilities

```css
.gradient-primary {
  background: linear-gradient(135deg, hsl(var(--cal-gradient-start)), hsl(var(--cal-gradient-end)));
}

.gradient-text {
  background: linear-gradient(135deg, hsl(var(--cal-gradient-start)), hsl(var(--cal-gradient-end)));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

Use `gradient-primary` for:
- Primary CTA buttons
- Hero icon backgrounds
- Feature card icons
- CTA section backgrounds

Use `gradient-text` for:
- Hero headlines (second line)
- Special emphasis text

---

## Layout & Spacing System

**Tailwind Spacing Primitives**: Use units of **2, 4, 6, 8, 12, 16** for consistency
- **Micro spacing** (p-2, gap-2): Tight element groupings, badges
- **Standard spacing** (p-4, gap-4, m-4): Default component padding, list items
- **Section spacing** (p-6, py-8): Card interiors, panel headers
- **Major spacing** (p-8, py-12, gap-8): Between major sections, dashboard columns
- **Hero spacing** (py-24, py-32): Large landing page sections

**Container Strategy**:
- Use Tailwind's `container` class with centered padding
- Max width: 1400px for 2xl screens
- Default padding: 2rem

---

## Component Patterns

### 1. Cards
**Feature Cards**:
- Border style: `border rounded-xl`
- Hover: `hover:shadow-lg hover:border-primary/50 transition-all duration-200`
- Icon container: `h-12 w-12 rounded-xl gradient-primary flex items-center justify-center`
- Content padding: `p-6`

**Project Cards**:
- Click to navigate: `cursor-pointer`
- Delete button: `opacity-0 group-hover:opacity-100`
- Status badge in header

### 2. Buttons
**Primary CTA**:
- Class: `gradient-primary text-lg h-12 px-8`
- With icon: `<ArrowRight className="ml-2 h-5 w-5" />`

**Secondary**:
- Variant: `variant="outline"` or `variant="secondary"`

**Icon Buttons**:
- Size: `size="icon"`
- Variant: `variant="ghost"`

### 3. Badges
**Status Badges**:
- Use shadcn Badge component
- Variants: `default` (complete), `secondary` (in progress), `outline` (pending)
- Include status icon: `<Clock className="h-3 w-3" />`

### 4. Sidebar
**Structure**:
- Dark background: `bg-sidebar text-sidebar-foreground`
- Logo header with border: `p-4 border-b border-sidebar-border`
- Action buttons section
- Scrollable sessions list
- Footer with collapse toggle

**Session Items**:
- Hover: `hover:bg-sidebar-accent/50`
- Active: `bg-sidebar-accent text-sidebar-accent-foreground`

### 5. Landing Page
**Hero Section**:
- Gradient background overlay: `bg-gradient-to-br from-primary/5 via-transparent to-accent/5`
- Centered content: `max-w-3xl mx-auto text-center`
- Chip/pill badge above title
- Two-line headline with gradient second line
- Description paragraph
- Button group with primary + secondary

**Features Grid**:
- `grid md:grid-cols-2 lg:grid-cols-4 gap-6`
- Cards with icon, title, description

**CTA Section**:
- Full-width card with gradient background
- Centered content
- Icon + headline + description + button

---

## Animation Strategy

**Keyframe Animations**:
- `fade-in`: Opacity 0 to 1 with translateY(10px) to 0
- `slide-in-right`: Opacity 0 to 1 with translateX(20px) to 0
- `pulse-glow`: Box-shadow pulse between 20px and 40px spread

**Usage**:
- `animate-fade-in`: New content appearing
- `animate-slide-in-right`: Sliding panel content
- `animate-pulse-glow`: Highlighted active elements (feature icons on hover)
- `animate-spin`: Loading states (with Loader2 icon)

---

## Interaction Patterns

**Hover States**:
- Cards: `hover:shadow-lg hover:border-primary/50`
- Buttons: Built-in shadcn hover elevation (no custom hover colors)
- Links: Underline or color change

**Delete Confirmation**:
- Use AlertDialog component
- Destructive action button: `bg-destructive hover:bg-destructive/90`

**Loading States**:
- Spinner: `<Loader2 className="h-4 w-4 animate-spin" />`
- Disable button during loading
- Show loading state in button content

---

## Accessibility

**Test IDs**:
- All interactive elements: `data-testid="button-{action}"`
- Display elements: `data-testid="text-{content}"`
- Cards with IDs: `data-testid="card-{type}-{id}"`

**Focus States**:
- Use shadcn's built-in focus ring styling
- Ensure all interactive elements are keyboard accessible

---

## Files Modified

The design system is implemented in:
- `client/src/index.css` - CSS variables and utility classes
- `tailwind.config.ts` - Tailwind configuration with CAL tokens
- Components use these tokens via standard Tailwind classes
