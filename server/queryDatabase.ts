export interface QueryCategory {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  questions: string[];
}

export const queryDatabase: QueryCategory[] = [
  {
    id: "uav_context",
    name: "I. UAV & C.A.L CONTEXT",
    description: "User-specific context about background, methodology, and mission",
    keywords: ["background", "methodology", "lean", "six sigma", "engineering", "process", "workflow", "efficiency", "system", "cal", "content assembly"],
    questions: [
      "What challenges have contributed to your growth and expertise?",
      "What unique actions do you take compared to market competitors?",
      "What is your 'WHY' for content creation?",
      "How does your professional background apply to your content systems?",
      "How does your methodology differentiate your workflow from standard creative chaos?",
      "What specific 'waste' are you removing from the content creation process?",
      "How do you blend creativity with systematic thinking in your brand identity?",
      "What is the specific efficiency bottleneck you are solving for your audience?",
      "Why is 'Time to Market' the critical metric for your strategy?",
      "How does your content system function as a factory floor for ideas?"
    ]
  },
  {
    id: "identity",
    name: "II. IDENTITY, ORIGIN & THE 'WHY'",
    description: "Personal story, beliefs, values, and authentic self-expression",
    keywords: ["identity", "origin", "story", "why", "failure", "success", "belief", "mentor", "struggle", "purpose", "mission", "passion", "authentic", "personal", "journey", "experience"],
    questions: [
      "What specific moment made you realize your current industry was broken?",
      "What specific failure in your past are you most grateful for today?",
      "If you could tell your younger self one thing about your current career, what would it be?",
      "What is a belief you held 5 years ago that you have completely reversed?",
      "What is the most 'unpopular opinion' you hold about your niche?",
      "Who is the one mentor or figure who changed your trajectory, and what did they say?",
      "What is a 'hard truth' you learned the hard way that others are ignoring?",
      "What specific childhood event shaped your work ethic today?",
      "If you lost everything tomorrow, what skill would you use to rebuild?",
      "What is the one thing you are willing to suffer for in your business?",
      "What specific enemy are you fighting against (e.g., mediocrity, confusion, scams)?",
      "What is the 'origin story' of your signature method or product?",
      "When was the last time you felt like an imposter, and how did you overcome it?",
      "What is a personal flaw you have that actually helps you in your work?",
      "What hobby do you have that surprisingly informs your professional work?",
      "What is the most courageous decision you have made in the last 12 months?",
      "If you could only teach one concept for the rest of your life, what would it be?",
      "What is the specific 'villain' in your industry that you want to defeat?",
      "Why do you get out of bed in the morning for this specific work?",
      "What is the one thing you want to be remembered for after you retire?"
    ]
  },
  {
    id: "audience",
    name: "III. AUDIENCE PSYCHOGRAPHY & PAIN POINTS",
    description: "Understanding target audience fears, desires, and motivations",
    keywords: ["audience", "customer", "pain", "problem", "fear", "desire", "struggle", "target", "demographic", "psychographic", "need", "want", "frustration", "dream", "goal"],
    questions: [
      "What is the specific 'nightmare scenario' your audience wakes up thinking about?",
      "What is the 'magic pill' solution your audience secretly wishes existed?",
      "What is the specific jargon or slang your audience uses among themselves?",
      "What is the 'enemy' your audience blames for their problems?",
      "What is the specific feeling your audience has on Sunday night before Monday morning?",
      "What is the one thing your audience is too embarrassed to ask you?",
      "What is the specific 'status symbol' your audience craves?",
      "What is the 'limiting belief' that holds your audience back the most?",
      "What is the specific YouTube search your audience types at 2 AM?",
      "What is the 'dream outcome' your audience would pay anything for?",
      "What is the specific daily annoyance that drives your audience crazy?",
      "What is the 'false solution' your audience has tried and failed with?",
      "What is the specific 'trigger event' that makes them look for you?",
      "What is the 'hero' your audience looks up to (besides you)?",
      "What is the specific question your audience asks you over and over?",
      "What is the 'hidden desire' your audience won't admit to?",
      "What is the specific 'trust barrier' preventing them from buying?",
      "What is the 'identity shift' your audience needs to make?",
      "What is the 'fear of judgment' your audience carries?",
      "What is the 'gap' between where your audience is and where they want to be?"
    ]
  },
  {
    id: "positioning",
    name: "IV. STRATEGIC POSITIONING & USP",
    description: "Brand differentiation, unique value, and market position",
    keywords: ["positioning", "usp", "unique", "differentiation", "brand", "value", "promise", "guarantee", "authority", "credibility", "competition", "market", "niche", "category"],
    questions: [
      "What is the specific 'Unique Selling Proposition' (USP) of your brand?",
      "What is the 'Value Proposition' of this specific content piece?",
      "What is the specific 'Mechanism' that delivers your results?",
      "What is the 'Big Promise' you are making to the market?",
      "What is the specific 'Guarantee' you offer (explicit or implicit)?",
      "What is the 'Risk Reversal' you provide to the viewer?",
      "What is the specific 'Category' you are trying to own?",
      "What is the 'Micro-Niche' you are dominating?",
      "What is the specific 'Authority' marker you display?",
      "What is the 'Credibility' proof you have?",
      "What is the specific 'Social Proof' you leverage?",
      "What is the 'Polarity' you create in the market?",
      "What is the specific 'Controversy' you are willing to embrace?",
      "What is the 'Methodology' you trademark or name?",
      "What is the 'Framework' you use to explain complex ideas?",
      "What is the specific 'Vocabulary' you own?",
      "What is the 'Tone of Voice' that differentiates you?",
      "What is the specific 'Speed' at which you promise results?",
      "What is the 'New Opportunity' you present?",
      "Why you, and not them?"
    ]
  },
  {
    id: "formats",
    name: "V. CONTENT FORMATS & ANGLES",
    description: "Video styles, content types, and presentation approaches",
    keywords: ["format", "style", "type", "how-to", "tutorial", "listicle", "case study", "vlog", "rant", "reaction", "interview", "documentary", "talking head", "comparison", "review"],
    questions: [
      "Does this need to be a 'How-To' tutorial?",
      "Does this need to be a 'Listicle' (Top 10)?",
      "Does this need to be a 'Case Study' breakdown?",
      "Does this need to be a 'Behind the Scenes' vlog?",
      "Does this need to be a 'Day in the Life' vlog?",
      "Does this need to be a 'Rant' or opinion piece?",
      "Does this need to be a 'Reaction' to a trend?",
      "Does this need to be an 'Interview' or Q&A?",
      "Does this need to be a 'Documentary' style deep dive?",
      "Does this need to be a 'Talking Head' educational?",
      "Does this need to be a 'Screen Recording' walkthrough?",
      "Does this need to be an 'Unboxing' or review?",
      "Does this need to be a 'Comparison' (This vs That)?",
      "Does this need to be a 'Myth-Busting' video?",
      "Does this need to be a 'Mistakes to Avoid' video?",
      "Does this need to be a 'Transformation' (Before/After)?",
      "Does this need to be a 'Storytime' narrative?",
      "Does this need to be a 'Motivational' speech?",
      "Does this need to be an 'Announcement' or launch?",
      "What is the optimal video length for this content?"
    ]
  },
  {
    id: "hooks",
    name: "VI. HOOKS, HEADLINES & ATTENTION",
    description: "Opening lines, attention-grabbing techniques, and first impressions",
    keywords: ["hook", "headline", "attention", "opening", "first", "grab", "capture", "intrigue", "curiosity", "scroll", "stop", "thumb", "click", "watch"],
    questions: [
      "What is the 'Pattern Interrupt' for this hook?",
      "What is the 'Curiosity Gap' you are creating?",
      "What is the 'Controversy' angle you can use?",
      "What is the 'Specific Number' you can lead with?",
      "What is the 'Unexpected Twist' in your opening?",
      "What is the 'Bold Claim' you can make?",
      "What is the 'Question' you can start with?",
      "What is the 'Story' you can open with?",
      "What is the 'Pain Point' you address immediately?",
      "What is the 'Promise' in your first 3 seconds?",
      "What is the 'Visual Hook' you will show?",
      "What is the 'Sound' or 'Voice' hook you will use?",
      "What is the 'Text Overlay' hook you will use?",
      "What is the 'Movement' hook you will create?",
      "What is the 'Contrast' hook you can use?",
      "What is the 'Call Out' to your target audience?",
      "What is the 'Fear' you can trigger ethically?",
      "What is the 'Greed' you can trigger ethically?",
      "What is the 'Social Proof' you can lead with?",
      "What makes someone STOP scrolling for this content?"
    ]
  },
  {
    id: "scripting",
    name: "VII. SCRIPTING & STORYTELLING ARCHITECTURE",
    description: "Narrative structure, script flow, and storytelling frameworks",
    keywords: ["script", "story", "narrative", "structure", "flow", "arc", "beginning", "middle", "end", "conflict", "resolution", "hero", "journey", "framework", "outline"],
    questions: [
      "What is the 'Hero's Journey' arc for this content?",
      "What is the 'Before' state you are painting?",
      "What is the 'After' state you are promising?",
      "What is the 'Conflict' or tension in the narrative?",
      "What is the 'Resolution' or transformation?",
      "What is the 'Call to Adventure' moment?",
      "What is the 'Mentor' or guide role you play?",
      "What is the 'Obstacle' the audience faces?",
      "What is the 'Revelation' or 'Aha Moment'?",
      "What is the 'Climax' of your content?",
      "What is the 'Denouement' or conclusion?",
      "What is the 'Open Loop' you create early?",
      "What is the 'Payoff' for the open loop?",
      "What is the 'Emotional Beat' sequence?",
      "What is the 'Logical Flow' of information?",
      "What is the 'Repetition' for emphasis?",
      "What is the 'Callback' you can use?",
      "What is the 'Transition' between sections?",
      "What is the 'Call to Action' placement?",
      "What is the ONE takeaway the viewer should remember?"
    ]
  },
  {
    id: "visuals",
    name: "VIII. VISUALS, FILMING & AESTHETICS",
    description: "Visual style, filming techniques, and production aesthetics",
    keywords: ["visual", "film", "aesthetic", "shot", "camera", "lighting", "color", "composition", "b-roll", "location", "set", "background", "wardrobe", "production"],
    questions: [
      "What is the 'Visual Mood' you want to create?",
      "What is the 'Color Palette' for this content?",
      "What is the 'Lighting Style' (soft, hard, natural)?",
      "What is the 'Camera Angle' (eye level, high, low)?",
      "What is the 'Shot Composition' (rule of thirds)?",
      "What is the 'Movement' (static, pan, dolly)?",
      "What is the 'Depth of Field' (shallow, deep)?",
      "What is the 'Location' or 'Set Design'?",
      "What is the 'Background' element?",
      "What is the 'Wardrobe' or 'Costume' choice?",
      "What is the 'Props' list needed?",
      "What is the 'B-Roll' shot list?",
      "What is the 'A-Roll' (main) shot list?",
      "What is the 'Cutaway' sequence needed?",
      "What is the 'Insert Shot' needed?",
      "What is the 'Wide Shot' establishing?",
      "What is the 'Close-Up' emphasizing?",
      "What is the 'Transition' visual effect?",
      "What is the 'Text' or 'Graphics' overlay?",
      "What is the overall 'Production Value' target?"
    ]
  },
  {
    id: "editing",
    name: "IX. EDITING, PACING & POST-PRODUCTION",
    description: "Editing rhythm, pacing, and post-production techniques",
    keywords: ["edit", "editing", "pace", "pacing", "cut", "rhythm", "music", "sound", "effect", "transition", "post", "production", "color grade", "audio"],
    questions: [
      "What is the 'Pacing' style (fast, medium, slow)?",
      "What is the 'Cut Rhythm' (quick cuts, long takes)?",
      "What is the 'Music' or 'Score' choice?",
      "What is the 'Sound Effect' layer?",
      "What is the 'Voice Over' style?",
      "What is the 'Silence' or 'Pause' for emphasis?",
      "What is the 'Jump Cut' frequency?",
      "What is the 'L-Cut' or 'J-Cut' usage?",
      "What is the 'Match Cut' opportunity?",
      "What is the 'Montage' sequence?",
      "What is the 'Color Grading' style?",
      "What is the 'LUT' or filter choice?",
      "What is the 'Text Animation' style?",
      "What is the 'Lower Third' design?",
      "What is the 'Thumbnail' frame?",
      "What is the 'Caption' style?",
      "What is the 'Zoom' or 'Pan' in post?",
      "What is the 'Speed Ramp' usage?",
      "What is the 'Audio Ducking' approach?",
      "What is the 'Final Export' format and quality?"
    ]
  },
  {
    id: "distribution",
    name: "X. DISTRIBUTION, PLATFORM & GROWTH",
    description: "Platform strategy, posting, and audience growth tactics",
    keywords: ["distribution", "platform", "growth", "post", "schedule", "algorithm", "seo", "hashtag", "viral", "reach", "engagement", "community", "cross-post", "repurpose"],
    questions: [
      "What is the 'Primary Platform' for this content?",
      "What is the 'Secondary Platform' for repurposing?",
      "What is the 'Optimal Posting Time'?",
      "What is the 'Posting Frequency' strategy?",
      "What is the 'Hashtag' strategy?",
      "What is the 'SEO' title and description?",
      "What is the 'Thumbnail' A/B test plan?",
      "What is the 'Caption' or 'Description' length?",
      "What is the 'Call to Action' in the caption?",
      "What is the 'Engagement' prompt (comment, share)?",
      "What is the 'Community' engagement plan?",
      "What is the 'Collaboration' opportunity?",
      "What is the 'Cross-Promotion' strategy?",
      "What is the 'Content Series' connection?",
      "What is the 'Pillar Content' relationship?",
      "What is the 'Evergreen' vs 'Trending' balance?",
      "What is the 'Analytics' metric to track?",
      "What is the 'Growth' lever for this content?",
      "What is the 'Viral' potential element?",
      "What is the 'Repurpose' plan for this content?"
    ]
  },
  {
    id: "monetization",
    name: "XI. MONETIZATION, OFFERS & CONVERSION",
    description: "Revenue strategy, offers, and conversion optimization",
    keywords: ["monetization", "money", "revenue", "offer", "conversion", "sale", "funnel", "product", "service", "price", "cta", "lead", "customer", "profit"],
    questions: [
      "What is the 'Revenue Model' for this content?",
      "What is the 'Product' or 'Service' being promoted?",
      "What is the 'Price Point' or 'Offer'?",
      "What is the 'Call to Action' for conversion?",
      "What is the 'Lead Magnet' connection?",
      "What is the 'Funnel' this content feeds into?",
      "What is the 'Upsell' opportunity?",
      "What is the 'Downsell' alternative?",
      "What is the 'Cross-sell' connection?",
      "What is the 'Affiliate' opportunity?",
      "What is the 'Sponsorship' potential?",
      "What is the 'Ad Revenue' potential?",
      "What is the 'Membership' or 'Subscription' tie-in?",
      "What is the 'Course' or 'Digital Product' connection?",
      "What is the 'Coaching' or 'Consulting' tie-in?",
      "What is the 'Event' or 'Workshop' promotion?",
      "What is the 'Community' or 'Membership' promotion?",
      "What is the 'Trust-Building' element for future sales?",
      "What is the 'Testimonial' or 'Case Study' capture plan?",
      "What is the specific monetization requirement?"
    ]
  }
];

export function getQueryDatabase(): QueryCategory[] {
  return queryDatabase;
}

export function getCategoryById(categoryId: string): QueryCategory | undefined {
  return queryDatabase.find(cat => cat.id === categoryId);
}

export function getRandomQuestionsFromCategory(categoryId: string, count: number = 3): string[] {
  const category = getCategoryById(categoryId);
  if (!category) return [];
  
  const shuffled = [...category.questions].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

export function getAllCategories(): { id: string; name: string; description: string }[] {
  return queryDatabase.map(cat => ({
    id: cat.id,
    name: cat.name,
    description: cat.description
  }));
}
