import type { Project, TextHook, VerbalHook, VisualHook, ContentOutput } from '@shared/schema';

// Complete mock project data for end-to-end testing
export const mockTextHooks: TextHook[] = [
    {
        id: 'T1',
        modality: 'text',
        type: 'bold_statement',
        content: 'AI is Stealing Your Followers',
        placement: 'thumbnail',
        rank: 1,
        isRecommended: true
    },
    {
        id: 'T2',
        modality: 'text',
        type: 'listicle',
        content: '3 AI Tools Content Creators Need',
        placement: 'title_card',
        rank: 2,
        isRecommended: false
    },
    {
        id: 'T3',
        modality: 'text',
        type: 'question',
        content: 'Tired of Spending Hours Editing?',
        placement: 'caption_overlay',
        rank: 3,
        isRecommended: false
    }
];

export const mockVerbalHooks: VerbalHook[] = [
    {
        id: 'V1',
        modality: 'verbal',
        type: 'effort_condensed',
        content: "I spent 100 hours testing AI tools so you don't have to.",
        emotionalTrigger: 'validation',
        retentionTrigger: 'authority',
        rank: 1,
        isRecommended: true
    },
    {
        id: 'V2',
        modality: 'verbal',
        type: 'direct_question',
        content: 'Want to know the secret every top creator is using?',
        emotionalTrigger: 'curiosity',
        retentionTrigger: 'information_gap',
        rank: 2,
        isRecommended: false
    },
    {
        id: 'V3',
        modality: 'verbal',
        type: 'shared_emotion',
        content: "You know that feeling when you waste 3 hours editing one video?",
        emotionalTrigger: 'empathy',
        retentionTrigger: 'relatability',
        rank: 3,
        isRecommended: false
    }
];

export const mockVisualHooks: VisualHook[] = [
    {
        id: 'VIS1',
        modality: 'visual',
        type: 'dynamic_movement',
        fiyGuide: "Start with camera low, looking up at you. Push in slowly as you walk toward camera. Confident energy.",
        genAiPrompt: "A content creator walking confidently toward camera in a modern studio setup, cinematic push-in shot, professional lighting, 9:16 aspect ratio --ar 9:16",
        sceneDescription: 'Confident walkup with camera push',
        rank: 1,
        isRecommended: true
    },
    {
        id: 'VIS2',
        modality: 'visual',
        type: 'close_up_reveal',
        fiyGuide: "Extreme close-up on laptop screen showing editing timeline. Slow pull back to reveal frustrated face.",
        genAiPrompt: "Close-up of video editing timeline on MacBook screen, frustrated content creator in background slightly out of focus, natural window light, vertical video format --ar 9:16",
        sceneDescription: 'Frustration reveal shot',
        rank: 2,
        isRecommended: false
    }
];

export const mockOutput: ContentOutput = {
    script: [
        {
            lineNumber: 1,
            speaker: 'HOST',
            text: "I spent 100 hours testing AI tools so you don't have to.",
            timing: '0:00-0:05',
            notes: 'Confident, direct tone'
        },
        {
            lineNumber: 2,
            speaker: 'HOST',
            text: 'And I found 3 that are absolute game-changers for content creators.',
            timing: '0:05-0:10',
            notes: 'Build anticipation'
        },
        {
            lineNumber: 3,
            speaker: 'HOST',
            text: 'First up: AI editing that cuts your workflow in half.',
            timing: '0:10-0:15'
        }
    ],
    storyboard: [
        {
            frameNumber: 1,
            shotType: 'MEDIUM',
            description: 'Creator walking toward camera in studio',
            visualNotes: 'Camera push, confident energy',
            duration: '5s'
        },
        {
            frameNumber: 2,
            shotType: 'CLOSE-UP',
            description: 'Laptop screen showing AI tools interface',
            visualNotes: 'Screen capture overlay',
            duration: '5s'
        }
    ],
    techSpecs: {
        aspectRatio: '9:16',
        resolution: '1080x1920',
        frameRate: '30fps',
        duration: '60s',
        audioFormat: 'AAC 128kbps stereo',
        exportFormat: 'MP4 H.264',
        platforms: ['tiktok', 'instagram']
    },
    bRoll: [
        {
            id: 'BR1',
            description: 'Close-up of hands typing on laptop with AI editing interface visible',
            source: 'User footage',
            timestamp: '0:10',
            keywords: ['ai', 'editing', 'laptop'],
            imagePrompt: 'Professional content creator hands typing on modern laptop, AI software interface on screen, natural lighting, shallow depth of field --ar 9:16',
            videoPrompt: 'Cinematic shot of hands typing on laptop, smooth dolly in, AI editing interface visible, professional workspace, 3-5 seconds --ar 9:16'
        }
    ],
    captions: [
        {
            id: 'C1',
            timestamp: '0:00',
            text: '100 HOURS TESTING AI',
            style: 'emphasis'
        },
        {
            id: 'C2',
            timestamp: '0:05',
            text: '3 Game-Changing Tools',
            style: 'emphasis'
        }
    ]
};

export const mockProject: Partial<Project> = {
    inputs: {
        topic: 'AI productivity tools for content creators',
        goal: 'educate',
        platforms: ['tiktok', 'instagram'],
        targetAudience: 'Content creators and social media managers',
        tone: 'educational',
        duration: '60s'
    },
    visualContext: {
        location: 'desk_office',
        lighting: 'natural_window',
        onCamera: true
    },
    textHooks: mockTextHooks,
    verbalHooks: mockVerbalHooks,
    visualHooks: mockVisualHooks,
    selectedHooks: {
        text: mockTextHooks[0],
        verbal: mockVerbalHooks[0],
        visual: mockVisualHooks[0]
    },
    output: mockOutput
};
