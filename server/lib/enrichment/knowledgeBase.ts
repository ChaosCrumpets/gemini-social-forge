/**
 * Static Knowledge Bases for Supported Niches
 * 
 * Contains detailed audience profiles, best practices, and content strategies.
 */

// B2B Sales Knowledge Base
const KB_B2B_SALES = {
    nicheId: "b2b_sales.cold_calling",
    displayName: "B2B Sales (Cold Calling)",

    audienceProfile: {
        primaryAudience: "B2B Sales Development Representatives (SDRs) and Account Executives (AEs)",

        psychographics: {
            motivations: [
                "Earning high commission",
                "Advancing to AE or management role",
                "Building predictable pipeline",
                "Being top performer on team"
            ],

            frustrations: [
                "Low connect rates on calls (avg 2-5%)",
                "Sounding scripted and robotic",
                "Getting hung up on immediately",
                "Difficulty bypassing gatekeepers",
                "Quota pressure"
            ],

            aspirations: [
                "Consistent 7-figure income",
                "Recognition as top rep",
                "Mastering objection handling"
            ]
        },

        commonKnowledge: {
            terminology: [
                "Pipeline", "SQL/MQL", "Discovery call", "Demo", "Close rate",
                "Quota", "Commission", "Gatekeeper", "Decision maker",
                "BANT qualification", "Objection handling", "Cold call"
            ]
        },

        platformBehavior: {
            linkedin: {
                active: true,
                consumptionStyle: "Morning scroll before work (7-9am), lunch break (12-1pm)",
                contentPreferences: "Tactical tips, case studies, call breakdowns",
                engagementTriggers: "Specific numbers, contrarian takes, call transcripts"
            },
            tiktok: {
                active: true,
                consumptionStyle: "Evening relaxation, quick tips",
                contentPreferences: "Before/after examples, quick wins, personality-driven"
            }
        }
    },

    contentOpportunities: {
        provenAngles: [
            {
                angle: "Contrarian Take",
                template: "Stop doing [common practice]. Here's why.",
                whyItWorks: "Sales pros are skeptical and like to challenge conventional wisdom"
            },
            {
                angle: "Pattern Interrupt Opening",
                template: "The [X] that got me [Y] result.",
                whyItWorks: "Promises specific, measurable outcome"
            },
            {
                angle: "Process Breakdown",
                template: "[Number]-step framework for [outcome].",
                whyItWorks: "Actionable, memorable, easy to implement"
            },
            {
                angle: "Common Mistake",
                template: "The [X] mistake that's costing you [Y].",
                whyItWorks: "Creates curiosity + fear of loss"
            }
        ],

        uavOpportunities: [
            {
                uav: "Conversational cold calling (vs. scripted)",
                marketGap: "Most content still teaches scripts; authenticity is emerging differentiator",
                recommendation: "HIGHLY RECOMMENDED"
            },
            {
                uav: "Tonality and voice control techniques",
                marketGap: "Underserved topic despite being critical to success",
                recommendation: "BLUE OCEAN OPPORTUNITY"
            }
        ]
    },

    bestPractices: {
        toneOfVoice: {
            style: "Direct, tactical, no-BS",
            avoid: ["Motivational fluff", "Get-rich-quick promises", "Vague advice"],
            embrace: ["Specific metrics", "Real examples", "Tactical frameworks"]
        },

        proofElements: {
            required: ["Specific numbers", "Time frames", "Context"],
            highImpact: ["Call recordings", "LinkedIn screenshots", "CRM dashboards"]
        },

        platformOptimization: {
            linkedin: {
                optimalLength: "30-60 seconds",
                postingTimes: ["7-9am EST", "12-1pm EST", "5-6pm EST"],
                hashtagStrategy: ["#SalesTips", "#ColdCalling", "#B2BSales", "#SalesEnablement"]
            },
            tiktok: {
                optimalLength: "15-30 seconds",
                hashtagStrategy: ["#SalesTok", "#SalesTips", "#ColdCalling"]
            }
        }
    },

    commonObjections: {
        "I don't have time": "Lead with time-saving benefit in opener",
        "Send me information via email": "Create curiosity that can't be satisfied via email",
        "We're already working with someone": "Position as complementary, not replacement"
    }
};

// Fitness Knowledge Base
const KB_FITNESS = {
    nicheId: "health_fitness.fitness.strength_training",
    displayName: "Strength Training & Muscle Building",

    audienceProfile: {
        primaryAudience: "Intermediate lifters tailored to gym goers",
        psychographics: {
            motivations: ["Looking better naked", "Personal bests", "Confidence"],
            frustrations: ["Plateaus", "Injuries", "Conflicting advice"],
            aspirations: ["Aesthetic physique", "Strength milestones"]
        },
        commonKnowledge: {
            terminology: ["PR", "Hypertrophy", "Progressive Overload", "Macros", "Cut/Bulk"]
        },
        platformBehavior: {
            instagram: { active: true, contentPreferences: "Visual progress, workout clips" },
            tiktok: { active: true, contentPreferences: "Quick tips, form checks" }
        }
    },
    contentOpportunities: {
        provenAngles: [
            { angle: "Form Fix", template: "Stop doing your [Exercise] like this.", whyItWorks: "Prevents injury/shame" },
            { angle: "Science Based", template: "What science says about [Topic] vs Bro-science.", whyItWorks: "Authority/Trust" }
        ],
        uavOpportunities: [
            { uav: "Evidence-based minimalist training", marketGap: "Efficiency focused crowds", recommendation: "HIGH" }
        ]
    },
    bestPractices: {
        toneOfVoice: { style: "Motivating but factual", avoid: ["Fake natty vibes"], embrace: ["Consistency"] },
        proofElements: { required: ["Physique", "Lift numbers"] },
        platformOptimization: {
            instagram: { optimalLength: "15-30s", hashtagStrategy: ["#GymTips", "#Hypertrophy"] }
        }
    }
};

// Export map
export const KNOWLEDGE_BASES: Record<string, any> = {
    "business.sales.b2b_sales": KB_B2B_SALES,
    "health_fitness.fitness.strength_training": KB_FITNESS
    // Add more as needed...
};
