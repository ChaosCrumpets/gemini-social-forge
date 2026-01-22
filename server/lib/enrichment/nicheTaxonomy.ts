export const NICHE_TAXONOMY = {
    business: {
        sales: {
            b2b_sales: {
                keywords: ["cold calling", "enterprise sales", "account executive", "SDR", "BDR", "pipeline", "closing", "outreach"],
                subNiches: ["cold_calling", "email_outreach", "linkedin_prospecting", "sales_enablement"]
            },
            b2c_sales: {
                keywords: ["retail", "consumer sales", "door-to-door", "telemarketing", "direct sales"],
                subNiches: ["retail_sales", "direct_sales", "telemarketing"]
            }
        },

        marketing: {
            digital_marketing: {
                keywords: ["SEO", "PPC", "social media marketing", "content marketing", "growth hacking", "marketing strategy"],
                subNiches: ["seo", "paid_ads", "email_marketing", "influencer_marketing"]
            },
            brand_marketing: {
                keywords: ["brand strategy", "positioning", "brand awareness", "storytelling"],
                subNiches: ["brand_building", "storytelling", "creative_strategy"]
            }
        },

        entrepreneurship: {
            startups: {
                keywords: ["startup", "founder", "bootstrapping", "venture capital", "product-market fit", "pitch deck"],
                subNiches: ["pre_seed", "early_stage", "growth_stage", "saas_startups"]
            },
            small_business: {
                keywords: ["small business", "local business", "solopreneur", "freelancing", "consulting"],
                subNiches: ["service_business", "ecommerce", "consulting", "freelance"]
            }
        }
    },

    health_fitness: {
        fitness: {
            strength_training: {
                keywords: ["weightlifting", "bodybuilding", "powerlifting", "muscle gain", "hypertrophy", "gym"],
                subNiches: ["hypertrophy", "strength", "bodybuilding_competition"]
            },
            cardio_endurance: {
                keywords: ["running", "cycling", "marathon", "triathlon", "endurance", "5k"],
                subNiches: ["distance_running", "sprinting", "cycling", "swimming"]
            }
        },

        nutrition: {
            weight_loss: {
                keywords: ["fat loss", "cutting", "calorie deficit", "diet", "macros", "weight loss"],
                subNiches: ["flexible_dieting", "intermittent_fasting", "keto", "macro_counting"]
            },
            performance_nutrition: {
                keywords: ["sports nutrition", "meal timing", "supplements", "performance", "protein"],
                subNiches: ["pre_workout", "post_workout", "supplementation"]
            }
        }
    },

    personal_development: {
        productivity: {
            time_management: {
                keywords: ["time management", "productivity", "GTD", "deep work", "focus", "procrastination"],
                subNiches: ["calendar_blocking", "task_management", "habit_building"]
            },
            productivity_tools: {
                keywords: ["Notion", "Obsidian", "productivity apps", "workflow", "automation", "zapier"],
                subNiches: ["note_taking", "project_management", "automation"]
            }
        },

        mindset: {
            motivation: {
                keywords: ["motivation", "discipline", "consistency", "mindset", "willpower"],
                subNiches: ["goal_setting", "accountability", "morning_routine"]
            },
            mental_health: {
                keywords: ["anxiety", "stress management", "mental health", "wellness", "burnout"],
                subNiches: ["stress_reduction", "mindfulness", "therapy"]
            }
        }
    },

    technology: {
        programming: {
            web_development: {
                keywords: ["web dev", "frontend", "backend", "full stack", "React", "Node.js", "javascript", "typescript"],
                subNiches: ["frontend", "backend", "fullstack", "devops"]
            },
            mobile_development: {
                keywords: ["iOS", "Android", "React Native", "Flutter", "mobile apps", "swift", "kotlin"],
                subNiches: ["ios_dev", "android_dev", "cross_platform"]
            }
        },

        ai_ml: {
            machine_learning: {
                keywords: ["machine learning", "ML", "deep learning", "neural networks", "tensorFlow", "pytorch"],
                subNiches: ["supervised_learning", "unsupervised_learning", "nlp", "computer_vision"]
            },
            ai_tools: {
                keywords: ["ChatGPT", "AI tools", "prompt engineering", "AI automation", "LLM", "generative ai"],
                subNiches: ["prompt_engineering", "ai_workflows", "no_code_ai"]
            }
        }
    },

    finance: {
        investing: {
            stock_market: {
                keywords: ["stocks", "investing", "stock market", "trading", "portfolio", "dividend"],
                subNiches: ["value_investing", "day_trading", "dividend_investing", "index_funds"]
            },
            real_estate: {
                keywords: ["real estate", "property", "rental income", "house flipping", "airbnb"],
                subNiches: ["rental_properties", "house_hacking", "commercial_real_estate"]
            }
        },

        personal_finance: {
            budgeting: {
                keywords: ["budgeting", "saving money", "frugal living", "debt payoff", "personal finance"],
                subNiches: ["zero_based_budget", "50_30_20", "debt_snowball"]
            },
            wealth_building: {
                keywords: ["wealth", "financial independence", "FIRE", "passive income", "net worth"],
                subNiches: ["fire_movement", "passive_income", "side_hustles"]
            }
        },
        crypto: {
            trading: {
                keywords: ["crypto", "bitcoin", "ethereum", "blockchain", "web3", "defi"],
                subNiches: ["trading", "hodling", "nfts"]
            }
        }
    },

    creative: {
        content_creation: {
            youtube: {
                keywords: ["YouTube", "video editing", "thumbnails", "retention", "algorithm", "vlog"],
                subNiches: ["youtube_growth", "video_editing", "thumbnail_design", "shorts"]
            },
            social_media: {
                keywords: ["TikTok", "Instagram", "viral content", "social media growth", "reels", "ugc"],
                subNiches: ["tiktok_growth", "instagram_reels", "content_strategy"]
            }
        },

        design: {
            graphic_design: {
                keywords: ["graphic design", "branding", "logo design", "visual identity", "typography"],
                subNiches: ["brand_identity", "ui_design", "illustration"]
            },
            video_production: {
                keywords: ["video production", "cinematography", "editing", "color grading", "filmmaking"],
                subNiches: ["cinematography", "editing", "motion_graphics"]
            }
        }
    }
};
