export type LandingLocale = "en" | "fr" | "zh";

const dict = {
  // ─── Navbar ───
  nav_features: { en: "Features", fr: "Fonctionnalites", zh: "功能" },
  nav_pricing: { en: "Pricing", fr: "Tarifs", zh: "定价" },
  nav_faq: { en: "FAQ", fr: "FAQ", zh: "常见问题" },
  nav_login: { en: "Sign in", fr: "Connexion", zh: "登录" },
  nav_cta: { en: "Free trial", fr: "Essai gratuit", zh: "免费试用" },

  // ─── Hero ───
  hero_badge: {
    en: "AI concierge for restaurants in Europe",
    fr: "Concierge IA pour restaurants en Europe",
    zh: "面向欧洲餐厅的 AI 点餐顾问",
  },
  hero_title_1: {
    en: "Your customers don\u2019t know what to order.",
    fr: "Vos clients ne savent pas quoi commander.",
    zh: "你的顾客不知道点什么。",
  },
  hero_title_2: {
    en: "AI does.",
    fr: "L\u2019IA le sait.",
    zh: "AI 知道。",
  },
  hero_desc: {
    en: "A smart QR menu that recommends the right dishes based on budget, allergies and preferences \u2014 in 19 languages. Help every guest discover their perfect meal.",
    fr: "Un QR menu intelligent qui recommande les bons plats selon le budget, les allergies et les envies \u2014 en 19 langues. Aidez chaque convive a trouver son plat ideal.",
    zh: "一个智能 QR 菜单，根据预算、过敏原和口味偏好推荐合适的菜品——支持 19 种语言。帮每位顾客找到最满意的那道菜。",
  },
  hero_cta_primary: {
    en: "Get started for free",
    fr: "Commencer gratuitement",
    zh: "免费开始",
  },
  hero_cta_secondary: {
    en: "See how it works",
    fr: "Voir comment ca marche",
    zh: "了解工作原理",
  },
  hero_stat_langs: { en: "languages", fr: "langues", zh: "种语言" },
  hero_stat_speed: { en: "per recommendation", fr: "par recommandation", zh: "每次推荐" },
  hero_stat_revenue: { en: "satisfaction rate", fr: "taux de satisfaction", zh: "满意度" },
  hero_stat_free: { en: "to get started", fr: "pour demarrer", zh: "即可开始" },

  // ─── Hero mock UI ───
  hero_mock_label: { en: "QR AI Menu", fr: "QR Menu IA", zh: "QR AI 菜单" },
  hero_mock_btn1: { en: "First time here", fr: "Premiere visite", zh: "第一次来" },
  hero_mock_btn2: { en: "Under \u20ac10", fr: "Moins de 10 \u20ac", zh: "10欧以内" },
  hero_mock_btn3: { en: "Chef\u2019s signature", fr: "Signature du chef", zh: "主厨推荐" },
  hero_mock_btn4: { en: "Healthy & light", fr: "Sain & leger", zh: "健康轻食" },
  hero_mock_best: { en: "Best match", fr: "Meilleur choix", zh: "最佳匹配" },
  hero_mock_dish: { en: "Chicken Power Bowl", fr: "Poulet Power Bowl", zh: "鸡肉能量碗" },
  hero_mock_reason: {
    en: "Fits budget, high protein, not spicy, generous portion.",
    fr: "Dans le budget, proteine, pas epice, portion genereuse.",
    zh: "符合预算，高蛋白，不辣，分量足。",
  },

  // ─── Social proof ───
  social_headline: {
    en: "Trusted by restaurants across Europe",
    fr: "Adopte par les restaurants a travers l\u2019Europe",
    zh: "深受欧洲各地餐厅信赖",
  },
  social_1: { en: "19 languages supported", fr: "19 langues supportees", zh: "支持 19 种语言" },
  social_2: { en: "14 EU allergens compliant", fr: "14 allergenes EU conformes", zh: "符合欧盟 14 种过敏原标准" },
  social_3: { en: "Import menus from PDF, photo, or CSV", fr: "Importez vos menus depuis PDF, photo ou CSV", zh: "支持从 PDF、照片、CSV 导入菜单" },
  social_4: { en: "Zero app, zero customer account", fr: "Zero app, zero compte client", zh: "无需下载，无需注册" },

  // ─── Pain points ───
  pain_section: { en: "The problem", fr: "Le probleme", zh: "痛点" },
  pain_title: {
    en: "3 problems you know",
    fr: "3 problemes que vous connaissez",
    zh: "你一定遇到过的 3 个问题",
  },
  pain1_title: {
    en: "Your tourists can\u2019t read the menu",
    fr: "Vos touristes ne comprennent pas le menu",
    zh: "游客看不懂菜单",
  },
  pain1_desc: {
    en: "60% of tourists in France don\u2019t speak French. They point randomly or ask the waiter \u2014 who\u2019s already overwhelmed.",
    fr: "60% des touristes en France ne parlent pas francais. Ils pointent au hasard ou demandent au serveur \u2014 qui est deja deborde.",
    zh: "60% 的法国游客不会法语。他们要么随意乱点，要么问服务员——而服务员已经忙不过来了。",
  },
  pain2_title: {
    en: "Allergens are a legal nightmare",
    fr: "Les allergenes sont un cauchemar legal",
    zh: "过敏原是法律噩梦",
  },
  pain2_desc: {
    en: "EU 1169/2011 requires displaying 14 allergens. One mistake can be costly. AI helps you stay compliant.",
    fr: "EU 1169/2011 exige l\u2019affichage de 14 allergenes. Un oubli peut couter cher. L\u2019IA vous aide a rester conforme.",
    zh: "欧盟 1169/2011 法规要求标注 14 种过敏原。一个疏忽代价高昂。AI 帮你保持合规。",
  },
  pain3_title: {
    en: "Guests miss your best dishes",
    fr: "Vos clients passent a cote de vos meilleurs plats",
    zh: "顾客错过了你最好的菜",
  },
  pain3_desc: {
    en: "Many guests stick to what they know. AI helps them discover signature dishes and hidden gems they\u2019ll love.",
    fr: "Beaucoup de clients restent sur ce qu\u2019ils connaissent. L\u2019IA les aide a decouvrir vos plats signatures et pepites cachees.",
    zh: "很多顾客只点熟悉的菜。AI 帮他们发现招牌菜和隐藏好菜。",
  },

  // ─── How it works ───
  how_section: { en: "How it works", fr: "Comment ca marche", zh: "工作原理" },
  how_title: {
    en: "3 steps. 5 minutes. No POS change.",
    fr: "3 etapes. 5 minutes. Zero changement de caisse.",
    zh: "3 步上手。5 分钟。无需更换收银系统。",
  },
  how_subtitle: {
    en: "From your paper menu to an AI concierge, without touching your POS.",
    fr: "De votre menu papier a un concierge IA, sans toucher a votre POS.",
    zh: "从纸质菜单到 AI 顾问，无需改动收银系统。",
  },
  how1_title: { en: "Upload your menu", fr: "Importez votre menu", zh: "上传菜单" },
  how1_desc: {
    en: "Upload a PDF, photo or CSV. AI extracts dishes, prices and allergens in 30 seconds.",
    fr: "Uploadez un PDF, une photo ou un CSV. L\u2019IA extrait automatiquement les plats, prix et allergenes en 30 secondes.",
    zh: "上传 PDF、照片或 CSV。AI 在 30 秒内自动提取菜品、价格和过敏原。",
  },
  how2_title: { en: "Print the QR code", fr: "Imprimez le QR code", zh: "打印 QR 码" },
  how2_desc: {
    en: "A unique QR code + professional poster are generated automatically. Place them on your tables and at the entrance.",
    fr: "Un QR unique + une affiche professionnelle sont generes automatiquement. Posez-les sur vos tables et a l\u2019entree.",
    zh: "自动生成专属 QR 码和专业海报。放在桌上和门口即可。",
  },
  how3_title: { en: "Customers order better", fr: "Vos clients commandent mieux", zh: "顾客更好地点餐" },
  how3_desc: {
    en: "Customer scans, picks a mode (budget, discovery, healthy\u2026), and gets 3\u20134 personalized recommendations in 3 seconds.",
    fr: "Le client scanne, choisit un mode (budget, decouverte, sain\u2026), et recoit 3-4 recommandations personnalisees en 3 secondes.",
    zh: "顾客扫码，选择模式（预算、探索、健康……），3 秒内获得 3-4 个个性化推荐。",
  },

  // ─── Features ───
  feat_section: { en: "Features", fr: "Fonctionnalites", zh: "功能特性" },
  feat_title: {
    en: "Everything you need to digitize your menu",
    fr: "Tout ce qu\u2019il faut pour digitaliser votre carte",
    zh: "数字化菜单所需的一切",
  },

  feat1_tag: { en: "AI Extraction", fr: "Extraction IA", zh: "AI 提取" },
  feat1_title: {
    en: "Upload your menu, AI does the rest",
    fr: "Uploadez votre menu, l\u2019IA fait le reste",
    zh: "上传菜单，AI 搞定一切",
  },
  feat1_desc: {
    en: "PDF, menu photo, spreadsheet \u2014 our AI extracts dishes, translates into 19 languages, and detects allergens. You review and publish in 5 minutes.",
    fr: "PDF, photo de carte, tableur \u2014 notre IA extrait les plats, traduit en 19 langues, et detecte les allergenes. Vous verifiez et publiez en 5 minutes.",
    zh: "PDF、菜单照片、表格——AI 自动提取菜品，翻译成 19 种语言，检测过敏原。5 分钟内审核发布。",
  },
  feat1_b1: { en: "Supports PDF, JPG, PNG, CSV, JSON, Excel", fr: "Support PDF, JPG, PNG, CSV, JSON, Excel", zh: "支持 PDF、JPG、PNG、CSV、JSON、Excel" },
  feat1_b2: { en: "Multi-file upload (up to 10 pages)", fr: "Upload multi-fichier (jusqu\u2019a 10 pages)", zh: "多文件上传（最多 10 页）" },
  feat1_b3: { en: "Confidence score for each extraction", fr: "Score de confiance pour chaque extraction", zh: "每次提取附带置信度评分" },
  feat1_b4: { en: "Auto-translation FR/EN/ZH + 16 languages", fr: "Traduction automatique FR/EN/ZH + 16 langues", zh: "自动翻译法/英/中 + 16 种语言" },

  feat2_tag: { en: "Cultural intelligence", fr: "Intelligence culturelle", zh: "文化感知" },
  feat2_title: {
    en: "Two modes. Two experiences. One product.",
    fr: "Deux modes. Deux experiences. Un seul produit.",
    zh: "两种模式。两种体验。一个产品。",
  },
  feat2_desc: {
    en: "When an American tourist scans, they see translations and starter recommendations. When a Chinese person enters a Chinese restaurant, they see a group meal advisor \u2014 because it\u2019s not the same experience.",
    fr: "Quand un touriste americain scanne, il voit des traductions et des recommandations d\u2019initiation. Quand un Chinois entre dans un restaurant chinois, il voit un conseiller de repas de groupe \u2014 parce que ce n\u2019est pas la meme experience.",
    zh: "美国游客扫码看到翻译和入门推荐。中国人进中餐馆看到组菜顾问——因为体验完全不同。",
  },
  feat2_b1: { en: "Tourist mode: translation + starter recommendations", fr: "Mode touriste : traduction + recommandation d\u2019entree", zh: "游客模式：翻译 + 入门推荐" },
  feat2_b2: { en: "Group meal mode: composition advice by party size", fr: "Mode repas de groupe : conseil de composition par nombre de convives", zh: "组菜模式：按人数推荐搭配" },
  feat2_b3: { en: "Auto-detection by browser language + cuisine type", fr: "Detection automatique par langue du navigateur + type de cuisine", zh: "按浏览器语言 + 菜系类型自动检测" },
  feat2_b4: { en: "Discreet button to switch modes manually", fr: "Bouton discret pour changer de mode manuellement", zh: "低调按钮可手动切换模式" },

  feat3_tag: { en: "Allergen compliance", fr: "Conformite allergenes", zh: "过敏原合规" },
  feat3_title: {
    en: "14 EU allergens, zero guessing",
    fr: "14 allergenes EU, zero improvisation",
    zh: "14 种欧盟过敏原，零猜测",
  },
  feat3_desc: {
    en: "EU 1169/2011 compliant. Customers filter their allergies, AI only recommends safe dishes. If data is missing, it says so \u2014 never guesses.",
    fr: "Conforme EU 1169/2011. Le client filtre ses allergies, l\u2019IA ne recommande que les plats surs. L\u2019IA ne devine jamais les allergenes \u2014 si l\u2019information manque, elle le dit.",
    zh: "符合 EU 1169/2011。顾客筛选过敏原，AI 只推荐安全菜品。信息缺失时会明确告知——绝不猜测。",
  },
  feat3_b1: { en: "14 European allergens covered", fr: "14 allergenes europeens pris en charge", zh: "覆盖 14 种欧洲过敏原" },
  feat3_b2: { en: "Real-time filtering in recommendations", fr: "Filtre en temps reel dans les recommandations", zh: "推荐中实时过滤" },
  feat3_b3: { en: "Mandatory notice: \u201Cconfirm with staff\u201D", fr: "Mention systematique : \u00ab confirmer avec le personnel \u00bb", zh: "强制提示：「请向服务员确认」" },
  feat3_b4: { en: "Allergen query archive (compliance proof)", fr: "Historique des requetes allergenes (preuve de conformite)", zh: "过敏原查询存档（合规证据）" },

  feat4_tag: { en: "Analytics", fr: "Analytics", zh: "数据分析" },
  feat4_title: {
    en: "Understand what your customers really want",
    fr: "Comprenez ce que vos clients veulent vraiment",
    zh: "真正了解顾客想要什么",
  },
  feat4_desc: {
    en: "Scans, recommendations, adoption rate, detected languages, dwell time\u2026 Everything is visible in real-time in your dashboard.",
    fr: "Scans, recommandations, taux d\u2019adoption, langues detectees, temps de consultation\u2026 Tout est visible en temps reel dans votre dashboard.",
    zh: "扫码量、推荐次数、采纳率、检测到的语言、停留时间……全部在仪表板实时可见。",
  },
  feat4_b1: { en: "Scans and recommendations by day/week", fr: "Scans et recommandations par jour/semaine", zh: "按天/周统计扫码和推荐" },
  feat4_b2: { en: "Detected languages and recommendation modes", fr: "Langues detectees et modes de recommandation", zh: "检测到的语言和推荐模式" },
  feat4_b3: { en: "AI suggestion adoption rate", fr: "Taux d\u2019adoption des suggestions IA", zh: "AI 建议采纳率" },
  feat4_b4: { en: "Monthly LLM cost and quota usage", fr: "Cout LLM mensuel et utilisation du quota", zh: "月度 LLM 成本和配额使用" },

  // ─── Revenue boost ───
  rev_section: { en: "Smarter recommendations", fr: "Des recommandations plus intelligentes", zh: "更智能的推荐" },
  rev_title: {
    en: "Help every guest find their perfect dish",
    fr: "Aidez chaque client a trouver son plat ideal",
    zh: "帮每位顾客找到最满意的菜",
  },
  rev_desc: {
    en: "With <strong>Smart Highlights</strong>, you choose which dishes to feature. AI weaves them into personalized recommendations \u2014 guests discover dishes they love, and your best creations get the spotlight they deserve.",
    fr: "Avec <strong>Mise en avant intelligente</strong>, vous choisissez les plats a mettre en valeur. L\u2019IA les integre dans des recommandations personnalisees \u2014 vos clients decouvrent des plats qu\u2019ils adorent, et vos meilleures creations obtiennent la visibilite qu\u2019elles meritent.",
    zh: "通过<strong>智能推荐</strong>功能，你选择想要展示的菜品。AI 将它们融入个性化推荐——顾客发现喜爱的菜品，你的拿手好菜获得应有的关注。",
  },
  rev_b1: { en: "Feature your signature dishes in recommendations", fr: "Mettez vos plats signatures en avant dans les recommandations", zh: "在推荐中展示你的招牌菜" },
  rev_b2: { en: "Every guest gets personalized suggestions", fr: "Chaque client recoit des suggestions personnalisees", zh: "每位顾客都获得个性化推荐" },
  rev_b3: { en: "Seamless experience, no pop-ups or ads", fr: "Experience fluide, sans pop-ups ni pubs", zh: "流畅体验，没有弹窗和广告" },
  rev_b4: { en: "Fully customizable from your dashboard", fr: "Entierement configurable depuis votre tableau de bord", zh: "后台完全可配置" },
  rev_stat1_val: { en: "95%", fr: "95%", zh: "95%" },
  rev_stat1_label: { en: "guest satisfaction", fr: "satisfaction client", zh: "顾客满意度" },
  rev_stat2_label: { en: "discover new dishes", fr: "decouvrent de nouveaux plats", zh: "发现了新菜品" },
  rev_stat3_label: { en: "friction for guests", fr: "friction pour le client", zh: "顾客零摩擦" },
  rev_stat4_label: { en: "fully transparent", fr: "entierement transparent", zh: "完全透明" },

  // ─── Competitive edge ───
  comp_section: { en: "Positioning", fr: "Positionnement", zh: "市场定位" },
  comp_title: {
    en: "The recommendation layer is empty. We\u2019re taking it.",
    fr: "La couche recommandation est vide. On la prend.",
    zh: "推荐层是空白。我们来填补。",
  },
  comp_subtitle: {
    en: "Sunday does payments. Zenchef does reservations. Menutech does compliance. Nobody does recommendations.",
    fr: "Sunday fait le paiement. Zenchef fait la reservation. Menutech fait la conformite. Personne ne fait la recommandation.",
    zh: "Sunday 做支付。Zenchef 做预订。Menutech 做合规。没人做推荐。",
  },
  comp_col_solution: { en: "Solution", fr: "Solution", zh: "产品" },
  comp_col_layer: { en: "Layer", fr: "Couche", zh: "层级" },
  comp_col_reco: { en: "AI Reco", fr: "Reco IA", zh: "AI 推荐" },
  comp_col_langs: { en: "19 langs", fr: "19 langues", zh: "19 语言" },
  comp_col_allergens: { en: "Allergens", fr: "Allergenes", zh: "过敏原" },
  comp_sunday: { en: "Payment", fr: "Paiement", zh: "支付" },
  comp_zenchef: { en: "Reservation / CRM", fr: "Reservation / CRM", zh: "预订 / CRM" },
  comp_menutech: { en: "Compliance", fr: "Conformite", zh: "合规" },
  comp_carteai: { en: "AI Recommendation", fr: "Recommandation IA", zh: "AI 推荐" },

  // ─── Pricing ───
  price_section: { en: "Pricing", fr: "Tarifs", zh: "定价" },
  price_title: {
    en: "Simple, transparent, no commitment",
    fr: "Simple, transparent, sans engagement",
    zh: "简单透明，无需承诺",
  },
  price_subtitle: {
    en: "14-day free trial. No credit card required.",
    fr: "Essai gratuit 14 jours. Aucune carte bancaire requise.",
    zh: "14 天免费试用。无需信用卡。",
  },
  price_popular: { en: "Popular", fr: "Populaire", zh: "热门" },
  price_starter: { en: "Starter", fr: "Starter", zh: "入门版" },
  price_starter_desc: { en: "The essentials to digitize your menu.", fr: "L\u2019essentiel pour digitaliser votre carte.", zh: "数字化菜单的基础功能。" },
  price_starter_f1: { en: "1 restaurant", fr: "1 restaurant", zh: "1 家餐厅" },
  price_starter_f2: { en: "5,000 AI scans / month", fr: "5 000 scans IA / mois", zh: "每月 5,000 次 AI 扫描" },
  price_starter_f3: { en: "QR code + custom poster", fr: "QR code + affiche personnalisee", zh: "QR 码 + 定制海报" },
  price_starter_f4: { en: "19 languages", fr: "19 langues", zh: "19 种语言" },
  price_starter_f5: { en: "14 EU allergens", fr: "14 allergenes EU", zh: "14 种欧盟过敏原" },
  price_starter_f6: { en: "Basic dashboard", fr: "Dashboard basique", zh: "基础仪表板" },
  price_starter_f7: { en: "Email support", fr: "Support email", zh: "邮件支持" },
  price_pro: { en: "Pro", fr: "Pro", zh: "专业版" },
  price_pro_desc: { en: "For restaurants that want smarter recommendations.", fr: "Pour les restaurants qui veulent des recommandations plus intelligentes.", zh: "为想要更智能推荐的餐厅。" },
  price_pro_f1: { en: "Everything in Starter +", fr: "Tout Starter +", zh: "包含入门版所有功能 +" },
  price_pro_f2: { en: "Unlimited AI recommendations", fr: "Recommandations IA illimitees", zh: "无限 AI 推荐" },
  price_pro_f3: { en: "Smart Highlights (feature your best dishes)", fr: "Mise en avant intelligente (valorisez vos meilleurs plats)", zh: "智能推荐（展示你的拿手好菜）" },
  price_pro_f4: { en: "Full analytics + trends", fr: "Analytics complet + tendances", zh: "完整分析 + 趋势" },
  price_pro_f5: { en: "Advanced AI extraction (PDF, photo)", fr: "Extraction IA avancee (PDF, photo)", zh: "高级 AI 提取（PDF、照片）" },
  price_pro_f6: { en: "Automatic weekly reports", fr: "Rapports hebdomadaires automatiques", zh: "自动周报" },
  price_pro_f7: { en: "Priority support", fr: "Support prioritaire", zh: "优先支持" },
  price_enterprise: { en: "Enterprise", fr: "Enterprise", zh: "企业版" },
  price_enterprise_desc: { en: "Multi-site, white label, API.", fr: "Multi-sites, marque blanche, API.", zh: "多门店、白标、API。" },
  price_enterprise_custom: { en: "Custom", fr: "Sur devis", zh: "定制" },
  price_enterprise_f1: { en: "Everything in Pro +", fr: "Tout Pro +", zh: "包含专业版所有功能 +" },
  price_enterprise_f2: { en: "Unlimited restaurants", fr: "Restaurants illimites", zh: "无限餐厅" },
  price_enterprise_f3: { en: "White label (your domain)", fr: "Marque blanche (votre domaine)", zh: "白标（自定义域名）" },
  price_enterprise_f4: { en: "API for POS integration", fr: "API pour integration POS", zh: "POS 集成 API" },
  price_enterprise_f5: { en: "Dedicated AI model", fr: "Modele IA dedie", zh: "专属 AI 模型" },
  price_enterprise_f6: { en: "99.9% SLA guarantee", fr: "SLA garanti 99,9%", zh: "99.9% SLA 保障" },
  price_enterprise_f7: { en: "Personalized onboarding", fr: "Accompagnement personnalise", zh: "个性化陪伴" },
  price_cta_trial: { en: "14-day free trial", fr: "Essai gratuit 14 jours", zh: "14 天免费试用" },
  price_cta_contact: { en: "Contact us", fr: "Nous contacter", zh: "联系我们" },
  price_mo: { en: "/ mo", fr: "/ mois", zh: "/ 月" },

  // ─── Use cases ───
  cases_section: { en: "Use cases", fr: "Cas d\u2019usage", zh: "使用场景" },
  cases_title: { en: "They use CarteAI", fr: "Ils utilisent CarteAI", zh: "他们在用 CarteAI" },
  case1_name: { en: "Marco", fr: "Marco", zh: "Marco" },
  case1_role: { en: "American tourist in Paris", fr: "Touriste americain a Paris", zh: "在巴黎的美国游客" },
  case1_quote: {
    en: "80 dishes in Chinese and French. I scanned the QR, picked \u2018First Time\u2019 and filtered shellfish. 3 seconds later, I had my 3 dishes. Better than asking the waiter.",
    fr: "80 plats en chinois et en francais. J\u2019ai scanne le QR, choisi \u00ab First Time \u00bb et filtre les crustaces. 3 secondes plus tard, j\u2019avais mes 3 plats. Mieux que demander au serveur.",
    zh: "80 道菜，中法双语。我扫码选了「第一次来」，过滤了甲壳类。3 秒后就有了 3 道推荐。比问服务员还快。",
  },
  case2_name: { en: "Xiao Zhang", fr: "Xiao Zhang", zh: "小张" },
  case2_role: { en: "Chinese in Paris, group dinner", fr: "Chinois a Paris, repas de groupe", zh: "在巴黎的中国人，朋友聚餐" },
  case2_quote: {
    en: "5 of us, nobody wanted to decide. The \u2018group meal advisor\u2019 suggested a complete set \u2014 2 hot dishes, 1 cold, 1 soup, 1 rice. 10 minutes saved.",
    fr: "On etait 5, personne voulait choisir. Le mode \u00ab conseiller repas \u00bb a propose un menu complet \u2014 2 plats chauds, 1 froid, 1 soupe, 1 riz. 10 minutes gagnees.",
    zh: "我们 5 个人，谁都不想点菜。「组菜顾问」推荐了一套完整搭配——2 热菜、1 凉菜、1 汤、1 主食。省了 10 分钟纠结。",
  },
  case3_name: { en: "Mme Dupont", fr: "Mme Dupont", zh: "Dupont 太太" },
  case3_role: { en: "Owner, bistro in Montmartre", fr: "Proprietaire, bistro a Montmartre", zh: "蒙马特小酒馆老板" },
  case3_quote: {
    en: "I took a photo of my paper menu. 5 minutes later, everything was online in 3 languages. My tourists don\u2019t freeze in front of the menu anymore.",
    fr: "J\u2019ai pris en photo mon menu papier. 5 minutes apres, tout etait en ligne en 3 langues. Mes touristes ne bloquent plus devant la carte.",
    zh: "我拍了张纸质菜单的照片。5 分钟后，3 种语言的在线菜单就上线了。游客再也不会在菜单前发愣了。",
  },

  // ─── Coming soon ───
  coming_badge: { en: "Coming soon", fr: "Bientot disponible", zh: "即将推出" },
  coming_title: {
    en: "Manage your menu via WhatsApp",
    fr: "Gerez votre menu par WhatsApp",
    zh: "通过 WhatsApp 管理菜单",
  },
  coming_desc: {
    en: "\u201CNo more duck confit today\u201D \u2014 send a message to your CarteAI bot and the menu updates instantly. No need to log into a back-office.",
    fr: "\u00ab Aujourd\u2019hui plus de magret de canard \u00bb \u2014 envoyez un message a votre bot CarteAI et le menu est mis a jour instantanement. Plus besoin de se connecter a un back-office.",
    zh: "「今天鸭腿卖完了」——给你的 CarteAI 机器人发条消息，菜单即时更新。不用登录后台。",
  },

  // ─── FAQ ───
  faq_section: { en: "FAQ", fr: "FAQ", zh: "常见问题" },
  faq_title: { en: "Frequently asked questions", fr: "Questions frequentes", zh: "常见问题" },
  faq1_q: { en: "Do I need to change my POS system?", fr: "Est-ce que je dois changer de caisse (POS) ?", zh: "需要更换收银系统吗？" },
  faq1_a: {
    en: "No. CarteAI works alongside your current system. Customers scan the QR, get a recommendation, and order normally with your staff. No POS integration needed.",
    fr: "Non. CarteAI fonctionne en complement de votre systeme actuel. Les clients scannent le QR, obtiennent une recommandation, et commandent normalement aupres de votre equipe. Aucune integration POS n\u2019est necessaire.",
    zh: "不需要。CarteAI 是你现有系统的补充。顾客扫码获得推荐，然后正常向你的员工点餐。不需要 POS 集成。",
  },
  faq2_q: { en: "Are AI recommendations reliable?", fr: "Les recommandations de l\u2019IA sont-elles fiables ?", zh: "AI 推荐靠谱吗？" },
  faq2_a: {
    en: "AI only recommends dishes from your menu, with exact prices you\u2019ve validated. It never guesses allergens and always warns to confirm with staff. 6 safety rules are hardcoded.",
    fr: "L\u2019IA ne recommande que les plats de votre menu, avec les prix exacts que vous avez valides. Elle ne devine jamais les allergenes et affiche toujours un avertissement invitant le client a confirmer avec le personnel. 6 regles de securite sont codees en dur.",
    zh: "AI 只推荐你菜单上的菜品，使用你验证过的准确价格。绝不猜测过敏原，始终提醒顾客向服务员确认。6 条安全规则硬编码。",
  },
  faq3_q: { en: "Can I use my menu as PDF or photo?", fr: "Je peux utiliser mon menu en PDF ou en photo ?", zh: "可以用 PDF 或照片格式的菜单吗？" },
  faq3_a: {
    en: "Yes! Upload a PDF, photo, CSV or even an Excel spreadsheet. AI extracts dishes, prices and descriptions automatically. You review everything before publishing. Up to 10 files at once.",
    fr: "Oui ! Uploadez un PDF, une photo, un fichier CSV ou meme un tableur Excel. L\u2019IA extrait automatiquement les plats, prix et descriptions. Vous verifiez tout avant de publier. Jusqu\u2019a 10 fichiers simultanes.",
    zh: "可以！上传 PDF、照片、CSV 甚至 Excel 表格。AI 自动提取菜品、价格和描述。发布前你可以审核所有内容。支持同时上传 10 个文件。",
  },
  faq4_q: { en: "How does AI help guests discover more dishes?", fr: "Comment l\u2019IA aide les clients a decouvrir plus de plats ?", zh: "AI 如何帮顾客发现更多菜品？" },
  faq4_a: {
    en: "You highlight which dishes you want to feature \u2014 your signatures, seasonal specials, or chef\u2019s picks. AI naturally weaves them into personalized recommendations based on each guest\u2019s preferences. Guests discover dishes they love; your best creations get the attention they deserve.",
    fr: "Vous indiquez les plats que vous souhaitez mettre en avant \u2014 vos signatures, specialites de saison ou coups de coeur du chef. L\u2019IA les integre naturellement dans des recommandations personnalisees selon les preferences de chaque client. Vos clients decouvrent des plats qu\u2019ils adorent ; vos meilleures creations recoivent l\u2019attention qu\u2019elles meritent.",
    zh: "你选择想要展示的菜品——招牌菜、时令特色或主厨推荐。AI 根据每位顾客的偏好，自然地将这些菜品融入个性化推荐。顾客发现喜爱的菜品，你的拿手好菜获得应有的关注。",
  },
  faq5_q: { en: "Is my data safe?", fr: "Mes donnees sont-elles en securite ?", zh: "我的数据安全吗？" },
  faq5_a: {
    en: "Yes. CarteAI is GDPR compliant. We collect no personal data from customers (no login, no ad tracking). Restaurant data is hosted in Europe. Each allergen query is archived for compliance proof.",
    fr: "Oui. CarteAI est conforme RGPD. Nous ne collectons aucune donnee personnelle des clients (pas de login, pas de tracking publicitaire). Les donnees des restaurants sont hebergees en Europe. Chaque requete allergene est archivee pour preuve de conformite.",
    zh: "安全。CarteAI 符合 GDPR。我们不收集顾客个人数据（无需登录，无广告追踪）。餐厅数据托管在欧洲。每次过敏原查询都有存档作为合规证据。",
  },
  faq6_q: { en: "How many languages are supported?", fr: "Combien de langues sont supportees ?", zh: "支持多少种语言？" },
  faq6_a: {
    en: "19 languages including French, English, Chinese (Simplified), Arabic, Japanese, Korean, Spanish, Portuguese, and more. Language is auto-detected from the customer\u2019s phone.",
    fr: "19 langues dont le francais, l\u2019anglais, le chinois (simplifie), l\u2019arabe, le japonais, le coreen, l\u2019espagnol, le portugais, et bien d\u2019autres. La langue est detectee automatiquement a partir du telephone du client.",
    zh: "支持 19 种语言，包括法语、英语、中文（简体）、阿拉伯语、日语、韩语、西班牙语、葡萄牙语等。语言从顾客手机自动检测。",
  },
  faq7_q: { en: "What is \u2018cultural detection\u2019?", fr: "C\u2019est quoi la \u00ab detection culturelle \u00bb ?", zh: "什么是「文化感知」？" },
  faq7_a: {
    en: "When the customer\u2019s phone language matches the restaurant\u2019s cuisine type (e.g. Chinese in a Chinese restaurant), CarteAI automatically switches to \u2018group meal advisor\u2019 mode instead of tourist mode. A CarteAI exclusive.",
    fr: "Quand la langue du telephone du client correspond au type de cuisine du restaurant (ex: chinois dans un restaurant chinois), CarteAI passe automatiquement en mode \u00ab conseiller repas de groupe \u00bb au lieu du mode touriste. C\u2019est une exclusivite CarteAI.",
    zh: "当顾客手机语言与餐厅菜系类型匹配时（如中国人在中餐馆），CarteAI 自动切换到「组菜顾问」模式而非游客模式。这是 CarteAI 的独家功能。",
  },
  faq8_q: { en: "Can I cancel anytime?", fr: "Puis-je annuler a tout moment ?", zh: "可以随时取消吗？" },
  faq8_a: {
    en: "Absolutely. No commitment, no cancellation fees. You can also stay on the Starter plan as long as you want.",
    fr: "Absolument. Pas d\u2019engagement, pas de frais de resiliation. Vous pouvez aussi rester sur le plan Starter aussi longtemps que vous voulez.",
    zh: "当然可以。无承诺，无取消费。你也可以一直使用入门版。",
  },

  // ─── Partners ───
  partners_section: { en: "For Partners", fr: "Partenaires", zh: "合作伙伴" },
  partners_title: {
    en: "Let\u2019s redefine the dining experience together",
    fr: "Red\u00e9finissons l\u2019exp\u00e9rience en salle ensemble",
    zh: "一起重新定义餐桌体验",
  },
  partners_subtitle: {
    en: "CarteAI is looking for strategic partners to unlock the European smart dining market.",
    fr: "CarteAI recherche des partenaires strat\u00e9giques pour ouvrir le march\u00e9 europ\u00e9en de la restauration intelligente.",
    zh: "CarteAI 正在寻找战略合作伙伴，共同开拓欧洲智能餐饮市场。",
  },
  partners_enterprise_title: {
    en: "Chain / group deployment",
    fr: "D\u00e9ploiement cha\u00eene / groupe",
    zh: "连锁/集团部署",
  },
  partners_enterprise_desc: {
    en: "10+ locations? We offer a white-label enterprise plan with centralized menu management, data, and branding. Custom API for your POS/CRM.",
    fr: "10+ \u00e9tablissements ? Nous proposons une solution entreprise en marque blanche avec gestion centralis\u00e9e des menus, donn\u00e9es et branding. API personnalis\u00e9e pour votre POS/CRM.",
    zh: "10+ 家门店？我们提供企业版白标方案，统一管理多店菜单、数据和品牌。定制 API 对接你的 POS/CRM。",
  },
  partners_tech_title: {
    en: "Tech integration",
    fr: "Int\u00e9gration technique",
    zh: "技术集成",
  },
  partners_tech_desc: {
    en: "POS systems, booking platforms, payment solutions? CarteAI\u2019s recommendation layer can be embedded as an API in your product.",
    fr: "Syst\u00e8mes POS, plateformes de r\u00e9servation, solutions de paiement ? La couche recommandation de CarteAI s\u2019int\u00e8gre en API dans votre produit.",
    zh: "POS 系统、预订平台、支付方案？CarteAI 的推荐层可作为 API 嵌入你的产品。",
  },
  partners_invest_title: {
    en: "Investment opportunity",
    fr: "Opportunit\u00e9 d\u2019investissement",
    zh: "投资机会",
  },
  partners_invest_desc: {
    en: "First mover in European AI dining recommendations. Falling LLM costs + post-COVID QR adoption = timing window. Looking for early investors who understand B2B2C SaaS.",
    fr: "Premier acteur en recommandation IA pour la restauration en Europe. Baisse des co\u00fbts LLM + adoption QR post-COVID = fen\u00eatre de tir. Nous recherchons des investisseurs early-stage comprenant le SaaS B2B2C.",
    zh: "欧洲 AI 餐饮推荐赛道的先行者。LLM 成本下降 + 后疫情 QR 普及 = 窗口期。寻找理解 B2B2C SaaS 的早期投资者。",
  },
  partners_cta: { en: "Contact us", fr: "Nous contacter", zh: "联系我们" },
  partners_market: {
    en: "2M+ independent restaurants in Europe",
    fr: "2M+ restaurants ind\u00e9pendants en Europe",
    zh: "200万+ 欧洲独立餐馆",
  },
  partners_stage: { en: "POC \u2192 paid validation", fr: "POC \u2192 validation payante", zh: "POC \u2192 付费验证" },
  partners_stack: { en: "Next.js + Vercel + dual AI engine", fr: "Next.js + Vercel + double moteur IA", zh: "Next.js + Vercel + 双层 AI 引擎" },
  partners_compliance: { en: "GDPR + EU 1169/2011", fr: "RGPD + EU 1169/2011", zh: "GDPR + EU 1169/2011" },

  // ─── Final CTA ───
  cta_title: {
    en: "Ready to upgrade your menu?",
    fr: "Pret a moderniser votre menu ?",
    zh: "准备好升级你的菜单了吗？",
  },
  cta_desc: {
    en: "Join restaurants using AI to help every guest find their perfect dish. 14-day free trial, no card required.",
    fr: "Rejoignez les restaurants qui utilisent l\u2019IA pour aider chaque client a trouver son plat ideal. 14 jours d\u2019essai gratuit, aucune carte requise.",
    zh: "加入使用 AI 帮每位顾客找到最满意菜品的餐厅。14 天免费试用，无需信用卡。",
  },
  cta_primary: { en: "Create my AI menu", fr: "Creer mon menu IA", zh: "创建我的 AI 菜单" },
  cta_contact: { en: "Contact us", fr: "Nous contacter", zh: "联系我们" },

  // ─── Footer ───
  footer_tagline: {
    en: "AI concierge for restaurants.\nMade in France.",
    fr: "Concierge IA pour restaurants.\nFait en France.",
    zh: "面向餐厅的 AI 顾问。\n法国制造。",
  },
  footer_product: { en: "Product", fr: "Produit", zh: "产品" },
  footer_legal: { en: "Legal", fr: "Legal", zh: "法律" },
  footer_contact: { en: "Contact", fr: "Contact", zh: "联系" },
  footer_privacy: { en: "Privacy Policy", fr: "Politique de confidentialite", zh: "隐私政策" },
  footer_terms: { en: "Terms of Service", fr: "Conditions d\u2019utilisation", zh: "服务条款" },
  footer_rights: { en: "All rights reserved.", fr: "Tous droits reserves.", zh: "保留所有权利。" },
} as const;

type DictKey = keyof typeof dict;

export function getLandingDict(locale: LandingLocale) {
  const result: Record<string, string> = {};
  for (const key of Object.keys(dict) as DictKey[]) {
    result[key] = dict[key][locale];
  }
  return result;
}

export function detectLandingLocale(): LandingLocale {
  if (typeof navigator === "undefined") return "en";
  const lang = navigator.language?.split("-")[0]?.toLowerCase();
  if (lang === "zh") return "zh";
  if (lang === "fr") return "fr";
  return "en";
}
