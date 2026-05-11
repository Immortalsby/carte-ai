import type { LanguageCode } from "@/types/menu";
import type { RestaurantMenu } from "@/types/menu";

/** Resolve a LanguageCode to one that has translations, with fallback to "en" */
function resolveLang(lang: string): string {
  if (lang.startsWith("zh")) return "zh";
  const supported = ["en","fr","es","it","de","pt","ar","ja","ko","ru","tr","nl","pl","uk","ro","vi","th","hi"];
  if (supported.includes(lang)) return lang;
  return "en";
}

/* ─── Idle message pools ─── */
const idle: Record<string, string[]> = {
  en: [
    "Not sure what to order? I can help!",
    "Feeling adventurous today?",
    "Tap me for personalized picks!",
    "Hungry? Let me find something perfect.",
    "First time here? I know the best dishes!",
    "Let me be your dining guide today.",
    "I've got some great suggestions for you!",
    "Want me to pick something special?",
  ],
  fr: [
    "Pas sûr de quoi prendre ? Je peux aider !",
    "Envie de nouveauté aujourd'hui ?",
    "Touchez-moi pour des suggestions perso !",
    "Faim ? Je trouve le plat parfait pour vous.",
    "Première visite ? Je connais les meilleurs plats !",
    "Laissez-moi vous guider aujourd'hui.",
    "J'ai de super suggestions pour vous !",
    "Envie que je vous trouve quelque chose de spécial ?",
  ],
  zh: [
    "不知道吃什么？我来帮你！",
    "嘿嘿，今天想尝点新的吗？",
    "点我，帮你推荐好吃的~",
    "饿了吗？交给我就好！",
    "第一次来？我知道哪些菜最好吃！",
    "今天让我当你的美食向导吧~",
    "我有几个超棒的推荐给你！",
    "想让我帮你挑一道特别的？",
  ],
  es: [
    "¿No sabes qué pedir? ¡Yo te ayudo!",
    "¿Con ganas de probar algo nuevo hoy?",
    "¡Tócame para sugerencias personalizadas!",
    "¿Hambre? Te encuentro algo perfecto.",
    "¿Primera vez aquí? ¡Conozco los mejores platos!",
    "Déjame ser tu guía gastronómica hoy.",
    "¡Tengo recomendaciones geniales para ti!",
    "¿Quieres que elija algo especial?",
  ],
  it: [
    "Non sai cosa ordinare? Posso aiutarti!",
    "Voglia di provare qualcosa di nuovo oggi?",
    "Toccami per suggerimenti personalizzati!",
    "Fame? Ti trovo qualcosa di perfetto.",
    "Prima volta qui? Conosco i piatti migliori!",
    "Lascia che ti guidi oggi.",
    "Ho dei suggerimenti fantastici per te!",
    "Vuoi che scelga qualcosa di speciale?",
  ],
  de: [
    "Nicht sicher, was du bestellen sollst? Ich helfe!",
    "Lust auf etwas Neues heute?",
    "Tippe mich an für persönliche Empfehlungen!",
    "Hungrig? Ich finde etwas Perfektes für dich.",
    "Zum ersten Mal hier? Ich kenne die besten Gerichte!",
    "Lass mich heute dein Essens-Guide sein.",
    "Ich habe tolle Vorschläge für dich!",
    "Soll ich etwas Besonderes für dich aussuchen?",
  ],
  pt: [
    "Não sabe o que pedir? Eu ajudo!",
    "Com vontade de experimentar algo novo?",
    "Toque em mim para sugestões personalizadas!",
    "Com fome? Encontro algo perfeito para você.",
    "Primeira vez aqui? Conheço os melhores pratos!",
    "Deixa eu ser seu guia gastronômico hoje.",
    "Tenho ótimas sugestões para você!",
    "Quer que eu escolha algo especial?",
  ],
  ar: [
    "مش متأكد شو تطلب؟ أنا بساعدك!",
    "حابب تجرب شي جديد اليوم؟",
    "اضغط عليّ لاقتراحات مخصصة!",
    "جوعان؟ خليني ألاقيلك شي مثالي.",
    "أول مرة هون؟ أنا بعرف أحسن الأطباق!",
    "خليني أكون دليلك اليوم.",
    "عندي اقتراحات رائعة إلك!",
    "بدك أختارلك شي مميز؟",
  ],
  ja: [
    "何を注文するか迷ってる？お手伝いします！",
    "今日は冒険してみませんか？",
    "タップしておすすめを見てね！",
    "お腹すいた？ぴったりの料理を見つけるよ。",
    "初めて？一番人気の料理を知ってるよ！",
    "今日は私がグルメガイドになるね。",
    "素敵なおすすめがあるよ！",
    "特別な一品を選んであげようか？",
  ],
  ko: [
    "뭘 주문할지 모르겠어요? 제가 도와줄게요!",
    "오늘 새로운 걸 시도해볼까요?",
    "저를 눌러서 맞춤 추천을 받아보세요!",
    "배고프세요? 완벽한 메뉴를 찾아줄게요.",
    "처음 오셨나요? 인기 메뉴를 잘 알고 있어요!",
    "오늘 제가 맛집 가이드가 되어줄게요.",
    "추천해줄 게 많아요!",
    "특별한 메뉴를 골라줄까요?",
  ],
  ru: [
    "Не знаете, что заказать? Я помогу!",
    "Хотите попробовать что-то новое?",
    "Нажмите на меня для персональных рекомендаций!",
    "Голодны? Найду для вас идеальное блюдо.",
    "Первый раз здесь? Я знаю лучшие блюда!",
    "Позвольте быть вашим гастрономическим гидом.",
    "У меня есть отличные предложения для вас!",
    "Хотите, чтобы я выбрал что-то особенное?",
  ],
  tr: [
    "Ne sipariş edeceğinizden emin değil misiniz? Yardımcı olabilirim!",
    "Bugün yeni bir şey denemek ister misiniz?",
    "Kişisel öneriler için bana dokunun!",
    "Aç mısınız? Size mükemmel bir şey bulayım.",
    "İlk kez mi geliyorsunuz? En iyi yemekleri bilirim!",
    "Bugün yemek rehberiniz olayım.",
    "Sizin için harika önerilerim var!",
    "Özel bir şey seçmemi ister misiniz?",
  ],
  nl: [
    "Weet je niet wat je moet bestellen? Ik kan helpen!",
    "Zin in iets nieuws vandaag?",
    "Tik op mij voor persoonlijke suggesties!",
    "Honger? Ik vind iets perfects voor je.",
    "Eerste keer hier? Ik ken de beste gerechten!",
    "Laat mij vandaag je eetgids zijn.",
    "Ik heb geweldige suggesties voor je!",
    "Zal ik iets bijzonders voor je uitkiezen?",
  ],
  pl: [
    "Nie wiesz, co zamówić? Mogę pomóc!",
    "Masz ochotę na coś nowego?",
    "Kliknij mnie, żeby dostać spersonalizowane sugestie!",
    "Głodny? Znajdę coś idealnego.",
    "Pierwszy raz tutaj? Znam najlepsze dania!",
    "Pozwól, że będę twoim przewodnikiem kulinarnym.",
    "Mam świetne propozycje dla ciebie!",
    "Chcesz, żebym wybrał coś specjalnego?",
  ],
  uk: [
    "Не знаєте, що замовити? Я допоможу!",
    "Хочете спробувати щось нове?",
    "Натисніть на мене для персональних рекомендацій!",
    "Голодні? Знайду для вас ідеальну страву.",
    "Перший раз тут? Я знаю найкращі страви!",
    "Дозвольте бути вашим гастрономічним гідом.",
    "У мене є чудові пропозиції для вас!",
    "Хочете, щоб я обрав щось особливе?",
  ],
  ro: [
    "Nu știi ce să comanzi? Te pot ajuta!",
    "Ai chef de ceva nou astăzi?",
    "Atinge-mă pentru sugestii personalizate!",
    "Îți e foame? Găsesc ceva perfect.",
    "Prima dată aici? Cunosc cele mai bune feluri!",
    "Lasă-mă să fiu ghidul tău culinar azi.",
    "Am sugestii grozave pentru tine!",
    "Vrei să aleg ceva special?",
  ],
  vi: [
    "Chưa biết gọi gì? Tôi giúp bạn nhé!",
    "Hôm nay muốn thử gì mới không?",
    "Nhấn vào tôi để nhận gợi ý riêng!",
    "Đói bụng rồi? Để tôi tìm món hoàn hảo cho bạn.",
    "Lần đầu đến đây? Tôi biết món nào ngon nhất!",
    "Để tôi làm hướng dẫn viên ẩm thực hôm nay nhé.",
    "Tôi có nhiều gợi ý tuyệt vời cho bạn!",
    "Muốn tôi chọn món đặc biệt không?",
  ],
  th: [
    "ไม่แน่ใจจะสั่งอะไร? ฉันช่วยได้!",
    "อยากลองอะไรใหม่ๆ วันนี้ไหม?",
    "แตะฉันเพื่อรับคำแนะนำส่วนตัว!",
    "หิวไหม? ฉันหาเมนูเด็ดให้เอง",
    "มาครั้งแรกเหรอ? ฉันรู้เมนูที่ดีที่สุด!",
    "ให้ฉันเป็นไกด์อาหารวันนี้นะ",
    "ฉันมีเมนูแนะนำดีๆ ให้เธอ!",
    "อยากให้ฉันเลือกเมนูพิเศษไหม?",
  ],
  hi: [
    "क्या ऑर्डर करें समझ नहीं आ रहा? मैं मदद कर सकता हूँ!",
    "आज कुछ नया ट्राई करना चाहेंगे?",
    "मुझे टैप करें और पर्सनल सुझाव पाएं!",
    "भूख लगी? मैं कुछ परफेक्ट ढूंढ लेता हूँ।",
    "पहली बार यहाँ? मुझे सबसे अच्छे डिश पता हैं!",
    "आज मुझे आपका फूड गाइड बनने दीजिए।",
    "मेरे पास आपके लिए शानदार सुझाव हैं!",
    "कुछ स्पेशल चुनूँ आपके लिए?",
  ],
};

/* ─── Flow step messages ─── */
const flow: Record<string, Record<string, string>> = {
  occasion: {
    en: "What brings you here today?", fr: "Qu'est-ce qui vous amène ?", zh: "今天什么场合呀？",
    es: "¿Qué te trae hoy por aquí?", it: "Cosa ti porta qui oggi?", de: "Was führt dich heute hierher?",
    pt: "O que traz você aqui hoje?", ar: "شو المناسبة اليوم؟", ja: "今日はどんなご用件ですか？",
    ko: "오늘 어떤 자리인가요?", ru: "Что привело вас сюда сегодня?", tr: "Bugün sizi buraya ne getirdi?",
    nl: "Wat brengt je hier vandaag?", pl: "Co cię tu dziś sprowadza?", uk: "Що привело вас сюди сьогодні?",
    ro: "Ce te aduce aici astăzi?", vi: "Hôm nay có dịp gì vậy?", th: "วันนี้มาในโอกาสอะไรคะ?", hi: "आज यहाँ कैसे आना हुआ?",
  },
  mode: {
    en: "Great! What are you in the mood for?", fr: "Super ! Qu'est-ce qui vous ferait envie ?", zh: "好的！你想吃什么类型的？",
    es: "¡Genial! ¿Qué te apetece?", it: "Perfetto! Che tipo di piatto preferisci?", de: "Toll! Worauf hast du Lust?",
    pt: "Ótimo! O que te apetece?", ar: "ممتاز! شو نفسك فيه؟", ja: "いいね！何が食べたい気分？",
    ko: "좋아요! 어떤 게 먹고 싶으세요?", ru: "Отлично! Что вам хочется?", tr: "Harika! Ne yemek istersiniz?",
    nl: "Geweldig! Waar heb je zin in?", pl: "Świetnie! Na co masz ochotę?", uk: "Чудово! Що вам хочеться?",
    ro: "Grozav! Ce ai poftă?", vi: "Tuyệt! Bạn muốn ăn gì nào?", th: "เยี่ยม! อยากทานอะไรดี?", hi: "बढ़िया! क्या खाने का मन है?",
  },
  preferences: {
    en: "Tell me more about your preferences~", fr: "Dites-m'en plus sur vos envies~", zh: "告诉我更多你的偏好~",
    es: "Cuéntame más sobre tus preferencias~", it: "Dimmi di più sulle tue preferenze~", de: "Erzähl mir mehr über deine Vorlieben~",
    pt: "Me conte mais sobre suas preferências~", ar: "قلّي أكتر عن ذوقك~", ja: "好みをもっと教えて~",
    ko: "취향을 더 알려주세요~", ru: "Расскажите больше о ваших предпочтениях~", tr: "Tercihleriniz hakkında daha fazla bilgi verin~",
    nl: "Vertel me meer over je voorkeuren~", pl: "Powiedz mi więcej o swoich preferencjach~", uk: "Розкажіть більше про ваші вподобання~",
    ro: "Spune-mi mai multe despre preferințele tale~", vi: "Kể thêm về sở thích của bạn nhé~", th: "บอกฉันเพิ่มเติมเกี่ยวกับความชอบของคุณ~", hi: "अपनी पसंद के बारे में और बताइए~",
  },
  loading: {
    en: "Let me think...", fr: "Laissez-moi réfléchir...", zh: "让我想想...",
    es: "Déjame pensar...", it: "Fammi pensare...", de: "Lass mich nachdenken...",
    pt: "Deixa eu pensar...", ar: "خليني أفكّر...", ja: "ちょっと考えるね...",
    ko: "생각해볼게요...", ru: "Дайте подумать...", tr: "Düşünmeme izin verin...",
    nl: "Even nadenken...", pl: "Niech pomyślę...", uk: "Дайте подумати...",
    ro: "Lasă-mă să mă gândesc...", vi: "Để tôi nghĩ đã...", th: "ขอคิดก่อนนะ...", hi: "सोचने दीजिए...",
  },
  results: {
    en: "Found it! Check these out~", fr: "Trouvé ! Regardez ça~", zh: "找到啦！看看这些~",
    es: "¡Encontrado! Mira esto~", it: "Trovato! Guarda qui~", de: "Gefunden! Schau dir das an~",
    pt: "Achei! Olha só~", ar: "لقيت! شوف هاي~", ja: "見つけた！これ見て~",
    ko: "찾았어요! 이거 보세요~", ru: "Нашёл! Посмотрите~", tr: "Buldum! Şunlara bir bakın~",
    nl: "Gevonden! Kijk eens~", pl: "Znalazłem! Spójrz na to~", uk: "Знайшов! Подивіться~",
    ro: "Am găsit! Uită-te~", vi: "Tìm thấy rồi! Xem nè~", th: "เจอแล้ว! ดูสิ~", hi: "मिल गया! ये देखिए~",
  },
  concerned: {
    en: "Heads up: allergen info below", fr: "Attention : info allergènes ci-dessous", zh: "注意：有过敏原信息",
    es: "Atención: información de alérgenos abajo", it: "Attenzione: info allergeni sotto", de: "Achtung: Allergen-Info unten",
    pt: "Atenção: informações de alérgenos abaixo", ar: "تنبيه: معلومات الحساسية بالأسفل", ja: "注意：アレルゲン情報あり",
    ko: "주의: 알레르기 정보가 아래에 있어요", ru: "Внимание: информация об аллергенах ниже", tr: "Dikkat: alerjen bilgisi aşağıda",
    nl: "Let op: allergeen-info hieronder", pl: "Uwaga: informacje o alergenach poniżej", uk: "Увага: інформація про алергени нижче",
    ro: "Atenție: informații despre alergeni mai jos", vi: "Lưu ý: thông tin dị ứng bên dưới", th: "หมายเหตุ: ข้อมูลสารก่อภูมิแพ้ด้านล่าง", hi: "ध्यान दें: एलर्जन जानकारी नीचे है",
  },
  fallback: {
    en: "Oops, I'm feeling a bit sick... These are basic picks, not my best work!",
    fr: "Oups, je suis un peu malade... Ce sont des suggestions basiques, pas mon meilleur travail !",
    zh: "呜呜，我生病了...这些是基础推荐，不是我的最佳发挥！",
    es: "Ups, no me siento bien... ¡Estas son sugerencias básicas!",
    it: "Ops, non mi sento bene... Questi sono suggerimenti base!",
    de: "Ups, mir geht's nicht gut... Das sind nur Basis-Vorschläge!",
    pt: "Ops, não estou me sentindo bem... São sugestões básicas!",
    ar: "أوبس، مش مبسوط... هاي اقتراحات أساسية!",
    ja: "うう、ちょっと具合悪い...基本的なおすすめだけど!",
    ko: "앗, 컨디션이 좀 안 좋아요... 기본 추천이에요!",
    ru: "Ой, мне нездоровится... Это базовые рекомендации!",
    tr: "Hay aksi, biraz hastalandım... Bunlar temel öneriler!",
    nl: "Oeps, ik voel me niet lekker... Dit zijn basis suggesties!",
    pl: "Ups, nie czuję się dobrze... To tylko podstawowe sugestie!",
    uk: "Ой, мені нездоровиться... Це базові рекомендації!",
    ro: "Ups, nu mă simt bine... Acestea sunt sugestii de bază!",
    vi: "Ôi, tôi hơi mệt... Đây chỉ là gợi ý cơ bản thôi!",
    th: "อุ๊ย ฉันไม่ค่อยสบาย... นี่เป็นแค่คำแนะนำพื้นฐานนะ!",
    hi: "उफ़, तबीयत ठीक नहीं... ये बेसिक सुझाव हैं!",
  },
  postMealAsk: {
    en: "Did you order one of my picks? 🍽️", fr: "Vous avez commandé un de mes choix ? 🍽️", zh: "点了我推荐的菜吗？🍽️",
    es: "¿Pediste uno de mis platos? 🍽️", it: "Hai ordinato una delle mie scelte? 🍽️", de: "Hast du eines meiner Gerichte bestellt? 🍽️",
    pt: "Pediu algum dos meus pratos? 🍽️", ar: "طلبت شي من اقتراحاتي؟ 🍽️", ja: "私のおすすめを注文してくれた？🍽️",
    ko: "제 추천 메뉴 주문하셨나요? 🍽️", ru: "Заказали что-то из моих рекомендаций? 🍽️", tr: "Önerilerimden birini sipariş ettiniz mi? 🍽️",
    nl: "Heb je een van mijn keuzes besteld? 🍽️", pl: "Zamówiłeś coś z moich propozycji? 🍽️", uk: "Замовили щось з моїх рекомендацій? 🍽️",
    ro: "Ai comandat una dintre alegerile mele? 🍽️", vi: "Bạn đã gọi món tôi gợi ý chưa? 🍽️", th: "สั่งเมนูที่ฉันแนะนำไหมคะ? 🍽️", hi: "मेरी सिफारिश ऑर्डर की? 🍽️",
  },
  postMealThanks: {
    en: "Awesome, thanks for the feedback!", fr: "Super, merci pour le retour !", zh: "太好了，谢谢反馈！",
    es: "¡Genial, gracias por tu opinión!", it: "Fantastico, grazie per il feedback!", de: "Super, danke fürs Feedback!",
    pt: "Ótimo, obrigado pelo feedback!", ar: "ممتاز، شكراً عالرأي!", ja: "やった、フィードバックありがとう！",
    ko: "좋아요, 피드백 감사합니다!", ru: "Здорово, спасибо за отзыв!", tr: "Harika, geri bildiriminiz için teşekkürler!",
    nl: "Geweldig, bedankt voor de feedback!", pl: "Super, dzięki za opinię!", uk: "Чудово, дякую за відгук!",
    ro: "Grozav, mulțumesc pentru feedback!", vi: "Tuyệt, cảm ơn phản hồi của bạn!", th: "เยี่ยม ขอบคุณสำหรับความคิดเห็น!", hi: "बढ़िया, फीडबैक के लिए धन्यवाद!",
  },
  postMealNoWorries: {
    en: "No worries! Maybe next time~", fr: "Pas de souci ! Peut-être la prochaine fois~", zh: "没关系！下次再说~",
    es: "¡No te preocupes! Quizás la próxima~", it: "Nessun problema! Magari la prossima volta~", de: "Kein Problem! Vielleicht nächstes Mal~",
    pt: "Sem problemas! Quem sabe na próxima~", ar: "ما في مشكلة! يمكن المرة الجاي~", ja: "大丈夫！また次回ね~",
    ko: "괜찮아요! 다음에~", ru: "Ничего! Может быть, в следующий раз~", tr: "Sorun değil! Belki bir dahaki sefere~",
    nl: "Geen probleem! Misschien volgende keer~", pl: "Nie ma sprawy! Może następnym razem~", uk: "Нічого! Можливо, наступного разу~",
    ro: "Nu-i nimic! Poate data viitoare~", vi: "Không sao! Hẹn lần sau nhé~", th: "ไม่เป็นไร! คราวหน้านะ~", hi: "कोई बात नहीं! अगली बार~",
  },
  postMealReview: {
    en: "Glad you liked it! Leave a review? ⭐", fr: "Content que ça vous ait plu ! Un avis ? ⭐", zh: "开心你喜欢！去评价一下？⭐",
    es: "¡Me alegra que te gustó! ¿Dejas una reseña? ⭐", it: "Felice che ti sia piaciuto! Lasci una recensione? ⭐", de: "Freut mich! Eine Bewertung hinterlassen? ⭐",
    pt: "Que bom que gostou! Deixa uma avaliação? ⭐", ar: "مبسوط إنك حبيت! تقييم؟ ⭐", ja: "気に入ってもらえて嬉しい！レビューしてくれる？⭐",
    ko: "마음에 드셨다니 기뻐요! 리뷰 남겨주실래요? ⭐", ru: "Рад, что понравилось! Оставите отзыв? ⭐", tr: "Beğenmenize sevindim! Bir değerlendirme bırakır mısınız? ⭐",
    nl: "Fijn dat het smaakte! Een review achterlaten? ⭐", pl: "Cieszę się, że smakowało! Zostawisz opinię? ⭐", uk: "Радий, що сподобалося! Залишите відгук? ⭐",
    ro: "Mă bucur că ți-a plăcut! Lași o recenzie? ⭐", vi: "Vui vì bạn thích! Để lại đánh giá nhé? ⭐", th: "ดีใจที่ชอบ! รีวิวหน่อยได้ไหม? ⭐", hi: "खुशी हुई कि पसंद आया! रिव्यू दें? ⭐",
  },
};

/* ─── Contextual message generators ─── */
function timeOfDayMessage(hour: number, lang: string): string | null {
  const l = resolveLang(lang);
  const morning: Record<string, string> = {
    en: "Good morning! Ready for a great meal?", fr: "Bonjour ! Prêt pour un bon repas ?", zh: "早上好！准备享用美食了吗？",
    es: "¡Buenos días! ¿Listo para comer?", it: "Buongiorno! Pronti per un buon pasto?", de: "Guten Morgen! Bereit für ein gutes Essen?",
    pt: "Bom dia! Pronto para uma boa refeição?", ar: "صباح الخير! جاهز لوجبة رائعة؟", ja: "おはよう！美味しいご飯の準備は？",
    ko: "좋은 아침이에요! 맛있는 식사 준비되셨나요?", ru: "Доброе утро! Готовы к отличной трапезе?", tr: "Günaydın! Harika bir yemeğe hazır mısınız?",
    nl: "Goedemorgen! Klaar voor een goed maal?", pl: "Dzień dobry! Gotowy na świetny posiłek?", uk: "Доброго ранку! Готові до чудової трапези?",
    ro: "Bună dimineața! Gata de o masă bună?", vi: "Chào buổi sáng! Sẵn sàng cho bữa ăn ngon chưa?", th: "สวัสดีตอนเช้า! พร้อมสำหรับมื้ออร่อยไหม?", hi: "सुप्रभात! बढ़िया खाने के लिए तैयार?",
  };
  const lunch: Record<string, string> = {
    en: "Lunchtime! Let me help you decide.", fr: "C'est l'heure du déjeuner !", zh: "午饭时间到！让我帮你选~",
    es: "¡Hora de comer! Te ayudo a elegir.", it: "È ora di pranzo! Ti aiuto a scegliere.", de: "Mittagszeit! Lass mich dir helfen.",
    pt: "Hora do almoço! Deixa eu ajudar.", ar: "وقت الغداء! خليني أساعدك.", ja: "ランチタイム！選ぶの手伝うよ。",
    ko: "점심시간이에요! 고르는 거 도와줄게요.", ru: "Обеденное время! Помогу выбрать.", tr: "Öğle yemeği zamanı! Seçmenize yardım edeyim.",
    nl: "Lunchtijd! Laat me je helpen kiezen.", pl: "Pora na lunch! Pomogę wybrać.", uk: "Час обіду! Допоможу обрати.",
    ro: "E ora prânzului! Te ajut să alegi.", vi: "Giờ ăn trưa rồi! Để tôi giúp bạn chọn.", th: "ถึงเวลาอาหารกลางวัน! ให้ฉันช่วยเลือก", hi: "लंच टाइम! चुनने में मदद करूँ।",
  };
  const dinner: Record<string, string> = {
    en: "Dinner time! How about something special?", fr: "L'heure du dîner ! Quelque chose de spécial ?", zh: "晚餐时间，来点好的？",
    es: "¡Hora de cenar! ¿Algo especial?", it: "Ora di cena! Qualcosa di speciale?", de: "Abendessen! Wie wäre es mit etwas Besonderem?",
    pt: "Hora do jantar! Que tal algo especial?", ar: "وقت العشاء! شو رأيك بشي مميز؟", ja: "ディナータイム！何か特別なものは？",
    ko: "저녁 시간이에요! 특별한 메뉴 어때요?", ru: "Время ужина! Как насчёт чего-то особенного?", tr: "Akşam yemeği zamanı! Özel bir şey nasıl olur?",
    nl: "Etenstijd! Iets speciaals misschien?", pl: "Pora na kolację! Coś specjalnego?", uk: "Час вечері! Може щось особливе?",
    ro: "E ora cinei! Ceva special?", vi: "Giờ ăn tối rồi! Thử gì đặc biệt nhé?", th: "เวลาอาหารเย็น! อยากลองอะไรพิเศษไหม?", hi: "डिनर टाइम! कुछ स्पेशल कैसा रहेगा?",
  };
  if (hour >= 6 && hour < 11) return morning[l] ?? morning.en;
  if (hour >= 11 && hour < 14) return lunch[l] ?? lunch.en;
  if (hour >= 18 && hour < 22) return dinner[l] ?? dinner.en;
  return null;
}

function popularDishMessage(dishName: string, lang: string): string {
  const l = resolveLang(lang);
  const tpl: Record<string, (n: string) => string> = {
    en: (n) => `"${n}" is super popular here!`,
    fr: (n) => `"${n}" est très populaire ici !`,
    zh: (n) => `这道${n}超多人点的~`,
    es: (n) => `"${n}" es súper popular aquí!`,
    it: (n) => `"${n}" è popolarissimo qui!`,
    de: (n) => `"${n}" ist hier sehr beliebt!`,
    pt: (n) => `"${n}" é super popular aqui!`,
    ar: (n) => `"${n}" كتير مشهور هون!`,
    ja: (n) => `「${n}」はここで大人気！`,
    ko: (n) => `"${n}"은(는) 여기서 인기 최고예요!`,
    ru: (n) => `«${n}» — суперпопулярное блюдо!`,
    tr: (n) => `"${n}" burada çok popüler!`,
    nl: (n) => `"${n}" is hier super populair!`,
    pl: (n) => `"${n}" jest tu super popularne!`,
    uk: (n) => `«${n}» — суперпопулярна страва!`,
    ro: (n) => `"${n}" este super popular aici!`,
    vi: (n) => `"${n}" rất được yêu thích ở đây!`,
    th: (n) => `"${n}" ยอดนิยมมากที่นี่!`,
    hi: (n) => `"${n}" यहाँ बहुत पॉपुलर है!`,
  };
  return (tpl[l] ?? tpl.en)(dishName);
}

function cuisineHintMessage(cuisineType: string, lang: string): string | null {
  const l = resolveLang(lang);
  const hints: Record<string, Record<string, string>> = {
    chinese: { en: "Authentic Chinese cuisine — I'll help you pick!", fr: "Cuisine chinoise authentique — je vous guide !", zh: "正宗中餐，我帮你选？",
      es: "¡Cocina china auténtica! Te ayudo a elegir.", it: "Cucina cinese autentica! Ti aiuto.", de: "Echte chinesische Küche! Ich helfe dir.",
      pt: "Cozinha chinesa autêntica! Eu ajudo.", ar: "مطبخ صيني أصلي! أساعدك تختار.", ja: "本格中華料理！選ぶの手伝うよ。",
      ko: "정통 중국 요리! 골라줄게요.", ru: "Настоящая китайская кухня! Помогу выбрать.", tr: "Otantik Çin mutfağı! Seçmenize yardım edeyim.",
      nl: "Authentiek Chinees! Ik help je kiezen.", pl: "Autentyczna kuchnia chińska! Pomogę wybrać.", uk: "Автентична китайська кухня! Допоможу обрати.",
      ro: "Bucătărie chinezească autentică! Te ajut.", vi: "Ẩm thực Trung Hoa chính gốc! Để tôi giúp.", th: "อาหารจีนแท้ๆ! ให้ฉันช่วยเลือก!", hi: "असली चाइनीज़ खाना! चुनने में मदद करूँ।" },
    japanese: { en: "Japanese delicacies await! Let me guide you.", fr: "Des délices japonais vous attendent !", zh: "日料推荐？交给我！",
      es: "¡Delicias japonesas te esperan!", it: "Prelibatezze giapponesi ti aspettano!", de: "Japanische Köstlichkeiten warten!",
      pt: "Delícias japonesas esperam por você!", ar: "أطباق يابانية رائعة بانتظارك!", ja: "和食の名品が待ってるよ！",
      ko: "일본 요리의 별미가 기다려요!", ru: "Японские деликатесы ждут!", tr: "Japon lezzetleri sizi bekliyor!",
      nl: "Japanse lekkernijen wachten op je!", pl: "Japońskie przysmaki czekają!", uk: "Японські делікатеси чекають!",
      ro: "Delicii japoneze te așteaptă!", vi: "Ẩm thực Nhật Bản tuyệt vời đang chờ!", th: "อาหารญี่ปุ่นรอคุณอยู่!", hi: "जापानी व्यंजन आपका इंतज़ार कर रहे हैं!" },
    french: { en: "French gastronomy at its finest. Shall I suggest?", fr: "La gastronomie française à son meilleur. Un conseil ?", zh: "法餐精选，要我推荐吗？",
      es: "Gastronomía francesa en su máxima expresión.", it: "La gastronomia francese al suo meglio.", de: "Französische Gastronomie vom Feinsten.",
      pt: "Gastronomia francesa no seu melhor.", ar: "المطبخ الفرنسي بأفضل حالاته.", ja: "最高のフレンチ。おすすめしようか？",
      ko: "프랑스 미식의 정수. 추천해드릴까요?", ru: "Французская гастрономия в лучшем виде.", tr: "Fransız mutfağının en iyisi.",
      nl: "Franse gastronomie op zijn best.", pl: "Francuska kuchnia w najlepszym wydaniu.", uk: "Французька гастрономія в найкращому вигляді.",
      ro: "Gastronomia franceză la cel mai înalt nivel.", vi: "Ẩm thực Pháp đỉnh cao.", th: "อาหารฝรั่งเศสชั้นเลิศ", hi: "बेहतरीन फ्रेंच गैस्ट्रोनॉमी।" },
    italian: { en: "Buon appetito! Let me find your perfect dish.", fr: "Buon appetito ! Je vous trouve le plat parfait.", zh: "意大利美食，帮你挑？",
      es: "¡Buon appetito! Te encuentro el plato perfecto.", it: "Buon appetito! Ti trovo il piatto perfetto.", de: "Buon appetito! Ich finde dein perfektes Gericht.",
      pt: "Buon appetito! Vou encontrar o prato perfeito.", ar: "Buon appetito! خليني ألاقيلك الطبق المثالي.", ja: "Buon appetito! ぴったりの料理を見つけるよ。",
      ko: "Buon appetito! 완벽한 요리를 찾아줄게요.", ru: "Buon appetito! Найду идеальное блюдо.", tr: "Afiyet olsun! Size mükemmel yemeği bulayım.",
      nl: "Buon appetito! Ik vind het perfecte gerecht.", pl: "Buon appetito! Znajdę idealne danie.", uk: "Buon appetito! Знайду ідеальну страву.",
      ro: "Buon appetito! Îți găsesc felul perfect.", vi: "Buon appetito! Để tôi tìm món hoàn hảo.", th: "Buon appetito! ให้ฉันหาเมนูที่ใช่ให้", hi: "Buon appetito! परफेक्ट डिश ढूंढता हूँ।" },
    korean: { en: "Korean flavors! Want some recommendations?", fr: "Saveurs coréennes ! Des suggestions ?", zh: "韩餐推荐？问我就对了！",
      ko: "한식의 맛! 추천해드릴까요?", ja: "韓国料理！おすすめしようか？", es: "¡Sabores coreanos! ¿Quieres recomendaciones?",
      de: "Koreanische Küche! Empfehlungen gewünscht?", it: "Sapori coreani! Vuoi qualche consiglio?", pt: "Sabores coreanos! Quer recomendações?",
      ar: "نكهات كورية! بدك اقتراحات؟", ru: "Корейские вкусы! Хотите рекомендации?", tr: "Kore lezzetleri! Önerilere ne dersiniz?",
      nl: "Koreaanse smaken! Aanbevelingen?", pl: "Koreańskie smaki! Chcesz rekomendacje?", uk: "Корейські смаки! Бажаєте рекомендації?",
      ro: "Arome coreene! Vrei recomandări?", vi: "Hương vị Hàn Quốc! Muốn gợi ý không?", th: "อาหารเกาหลี! อยากให้แนะนำไหม?", hi: "कोरियन फ्लेवर्स! सुझाव चाहिए?" },
    thai: { en: "Thai cuisine! How spicy do you like it?", fr: "Cuisine thaï ! Vous aimez épicé ?", zh: "泰餐来啦！你能吃多辣？",
      th: "อาหารไทย! ชอบเผ็ดแค่ไหน?", ko: "태국 요리! 매운 거 좋아하세요?", ja: "タイ料理！辛さはどのくらい？",
      es: "¡Cocina tailandesa! ¿Qué tan picante te gusta?", de: "Thai-Küche! Wie scharf magst du es?", it: "Cucina thai! Quanto piccante ti piace?",
      pt: "Cozinha tailandesa! Gosta de picante?", ar: "مطبخ تايلاندي! قديش بتحب الحار؟", ru: "Тайская кухня! Как остро любите?",
      tr: "Tayland mutfağı! Acı seviyeniz ne?", nl: "Thaise keuken! Hoe pittig?", pl: "Kuchnia tajska! Jak ostro lubisz?",
      uk: "Тайська кухня! Наскільки гостро любите?", ro: "Bucătărie thailandeză! Cât de picant îți place?", vi: "Ẩm thực Thái! Bạn ăn cay được bao nhiêu?", hi: "थाई खाना! कितना तीखा पसंद है?" },
    vietnamese: { en: "Vietnamese flavors! Fresh and delicious.", fr: "Saveurs vietnamiennes ! Fraîches et délicieuses.", zh: "越南菜，清爽又好吃~" },
    indian: { en: "Indian cuisine! Rich flavors await.", fr: "Cuisine indienne ! Des saveurs riches vous attendent.", zh: "印度菜，风味浓郁！",
      hi: "भारतीय खाना! भरपूर स्वाद आपका इंतज़ार कर रहा है।" },
    lebanese: { en: "Lebanese delights! Mezze, grills & more.", fr: "Délices libanais ! Mezze, grillades et plus.", zh: "黎巴嫩美食，烤肉拼盘走起！",
      ar: "مأكولات لبنانية! مزّات وشوي وأكتر." },
    moroccan: { en: "Moroccan flavors! Tagine or couscous?", fr: "Saveurs marocaines ! Tagine ou couscous ?", zh: "摩洛哥风味，塔吉锅还是库斯库斯？",
      ar: "نكهات مغربية! طاجين ولّا كسكس؟" },
    turkish: { en: "Turkish cuisine! Kebab, pide & baklava.", fr: "Cuisine turque ! Kebab, pide et baklava.", zh: "土耳其菜，烤肉还是甜点？",
      tr: "Türk mutfağı! Kebap, pide ve baklava." },
    greek: { en: "Greek flavors! Fresh and sunny.", fr: "Saveurs grecques ! Fraîches et ensoleillées.", zh: "希腊美食，新鲜又阳光！" },
    spanish: { en: "Spanish tapas & more! Let me guide you.", fr: "Tapas espagnoles et plus ! Je vous guide.", zh: "西班牙小食，帮你选？",
      es: "¡Tapas españolas y más! Te guío." },
    mexican: { en: "Mexican feast! Ready to explore?", fr: "Festin mexicain ! Prêt à explorer ?", zh: "墨西哥美食，准备好了吗？",
      es: "¡Fiesta mexicana! ¿Listo para explorar?" },
    brazilian: { en: "Brazilian flavors! Vibrant and bold.", fr: "Saveurs brésiliennes ! Vibrantes et audacieuses.", zh: "巴西风味，热情奔放！",
      pt: "Sabores brasileiros! Vibrantes e ousados." },
    peruvian: { en: "Peruvian cuisine! Ceviche and beyond.", fr: "Cuisine péruvienne ! Ceviche et bien plus.", zh: "秘鲁菜，酸橘汁腌鱼走起！",
      es: "¡Cocina peruana! Ceviche y mucho más." },
    caribbean: { en: "Caribbean vibes! Tropical flavors await.", fr: "Ambiance caribéenne ! Saveurs tropicales.", zh: "加勒比风情，热带美味！" },
    african: { en: "African cuisine! Bold and soulful.", fr: "Cuisine africaine ! Audacieuse et généreuse.", zh: "非洲美食，浓郁又暖心！" },
    mediterranean: { en: "Mediterranean gems! Let me help.", fr: "Trésors méditerranéens ! Je vous aide.", zh: "地中海风味，帮你选？" },
    fusion: { en: "Fusion cuisine! Creative flavors await.", fr: "Cuisine fusion ! Des saveurs créatives.", zh: "融合菜，创意无限！" },
  };
  return hints[cuisineType]?.[l] ?? hints[cuisineType]?.en ?? null;
}

/* ─── Intro messages (first visit) ─── */
const intro: Record<string, { greeting: string; features: string[]; gotIt: string; whatCanYouDo: string }> = {
  en: {
    greeting: "Hi! I'm Cloché, the AI concierge by CarteAI. I help you discover the best dishes on this menu — personalized just for you!",
    features: ["Recommend dishes based on your taste and mood", "Filter out allergens to keep you safe", "Suggest group meals for sharing with friends", "Know the best picks for first-time visitors", "Speak your language — English, French, Chinese and more"],
    gotIt: "Got it!", whatCanYouDo: "What can you do?",
  },
  fr: {
    greeting: "Bonjour ! Je suis Cloché, le concierge IA de CarteAI. Je vous aide à découvrir les meilleurs plats de ce menu — rien que pour vous !",
    features: ["Recommander des plats selon vos goûts et envies", "Filtrer les allergènes pour votre sécurité", "Suggérer des repas de groupe à partager", "Connaître les incontournables pour les nouveaux visiteurs", "Parler votre langue — français, anglais, chinois et plus"],
    gotIt: "Compris !", whatCanYouDo: "Que sais-tu faire ?",
  },
  zh: {
    greeting: "你好！我是 Cloché，CarteAI 的 AI 助手。我能帮你发现这份菜单上最好吃的菜——为你量身推荐！",
    features: ["根据你的口味和心情推荐菜品", "过滤过敏原，保障你的安全", "为朋友聚餐推荐拼桌菜单", "第一次来？我知道哪些菜最值得点", "支持多语言——中文、英语、法语等"],
    gotIt: "我知道了", whatCanYouDo: "你都会做什么？",
  },
  es: {
    greeting: "¡Hola! Soy Cloché, el concierge IA de CarteAI. Te ayudo a descubrir los mejores platos del menú — ¡personalizados para ti!",
    features: ["Recomendar platos según tus gustos", "Filtrar alérgenos para tu seguridad", "Sugerir menús para compartir en grupo", "Conocer las mejores opciones para nuevos visitantes", "Hablar tu idioma"],
    gotIt: "¡Entendido!", whatCanYouDo: "¿Qué puedes hacer?",
  },
  it: {
    greeting: "Ciao! Sono Cloché, il concierge IA di CarteAI. Ti aiuto a scoprire i piatti migliori — personalizzati per te!",
    features: ["Consigliare piatti in base ai tuoi gusti", "Filtrare gli allergeni per la tua sicurezza", "Suggerire pasti di gruppo da condividere", "Conoscere le migliori scelte per i nuovi visitatori", "Parlare la tua lingua"],
    gotIt: "Capito!", whatCanYouDo: "Cosa sai fare?",
  },
  de: {
    greeting: "Hallo! Ich bin Cloché, der KI-Concierge von CarteAI. Ich helfe dir, die besten Gerichte zu entdecken — nur für dich!",
    features: ["Gerichte nach deinem Geschmack empfehlen", "Allergene filtern für deine Sicherheit", "Gruppenmenüs zum Teilen vorschlagen", "Die besten Tipps für Erstbesucher kennen", "Deine Sprache sprechen"],
    gotIt: "Verstanden!", whatCanYouDo: "Was kannst du?",
  },
  pt: {
    greeting: "Olá! Sou Cloché, o concierge IA da CarteAI. Ajudo você a descobrir os melhores pratos — personalizados para você!",
    features: ["Recomendar pratos com base nos seus gostos", "Filtrar alérgenos para sua segurança", "Sugerir refeições em grupo", "Conhecer as melhores opções para novos visitantes", "Falar o seu idioma"],
    gotIt: "Entendi!", whatCanYouDo: "O que você pode fazer?",
  },
  ar: {
    greeting: "مرحباً! أنا Cloché، مساعد الذكاء الاصطناعي من CarteAI. بساعدك تكتشف أحسن الأطباق — مخصصة إلك!",
    features: ["اقتراح أطباق حسب ذوقك", "تصفية مسببات الحساسية", "اقتراح وجبات للمجموعات", "معرفة أفضل الخيارات للزوار الجدد", "التحدث بلغتك"],
    gotIt: "فهمت!", whatCanYouDo: "شو بتقدر تعمل؟",
  },
  ja: {
    greeting: "こんにちは！CarteAIのAIコンシェルジュ、Clochéです。あなたにぴったりの料理を見つけるお手伝いをします！",
    features: ["好みや気分に合わせた料理をおすすめ", "アレルゲンをフィルタリング", "グループ向けのシェアメニューを提案", "初めての方に人気メニューをご紹介", "あなたの言語で対応"],
    gotIt: "わかった！", whatCanYouDo: "何ができるの？",
  },
  ko: {
    greeting: "안녕하세요! CarteAI의 AI 컨시어지 Cloché입니다. 당신에게 딱 맞는 최고의 요리를 찾아드릴게요!",
    features: ["취향과 기분에 맞는 메뉴 추천", "알레르기 유발 물질 필터링", "그룹 식사 메뉴 제안", "첫 방문자를 위한 인기 메뉴 안내", "당신의 언어로 대화"],
    gotIt: "알겠어요!", whatCanYouDo: "뭘 할 수 있어요?",
  },
  ru: {
    greeting: "Привет! Я Cloché, AI-консьерж от CarteAI. Помогу найти лучшие блюда — специально для вас!",
    features: ["Рекомендовать блюда по вашему вкусу", "Фильтровать аллергены", "Предлагать меню для компании", "Знать лучшие блюда для новых гостей", "Говорить на вашем языке"],
    gotIt: "Понял!", whatCanYouDo: "Что ты умеешь?",
  },
  tr: {
    greeting: "Merhaba! Ben Cloché, CarteAI'nin yapay zeka concierge'ı. Size en iyi yemekleri bulmana yardım ederim!",
    features: ["Zevkinize göre yemek önerisi", "Alerjen filtreleme", "Grup yemekleri önerisi", "İlk kez gelenlere popüler seçenekler", "Sizin dilinizde konuşma"],
    gotIt: "Anladım!", whatCanYouDo: "Neler yapabilirsin?",
  },
  nl: {
    greeting: "Hallo! Ik ben Cloché, de AI-concierge van CarteAI. Ik help je de beste gerechten te ontdekken!",
    features: ["Gerechten aanbevelen op basis van jouw smaak", "Allergenen filteren", "Groepsmaaltijden voorstellen", "De beste keuzes voor nieuwe bezoekers", "Jouw taal spreken"],
    gotIt: "Begrepen!", whatCanYouDo: "Wat kun je?",
  },
  pl: {
    greeting: "Cześć! Jestem Cloché, concierge AI od CarteAI. Pomogę ci odkryć najlepsze dania — dopasowane do ciebie!",
    features: ["Polecać dania według twoich gustów", "Filtrować alergeny", "Proponować menu dla grupy", "Znać najlepsze dania dla nowych gości", "Mówić w twoim języku"],
    gotIt: "Rozumiem!", whatCanYouDo: "Co potrafisz?",
  },
  uk: {
    greeting: "Привіт! Я Cloché, AI-консьєрж від CarteAI. Допоможу знайти найкращі страви — спеціально для вас!",
    features: ["Рекомендувати страви за вашим смаком", "Фільтрувати алергени", "Пропонувати меню для компанії", "Знати найкращі страви для нових гостей", "Говорити вашою мовою"],
    gotIt: "Зрозумів!", whatCanYouDo: "Що ти вмієш?",
  },
  ro: {
    greeting: "Bună! Sunt Cloché, concierge-ul AI de la CarteAI. Te ajut să descoperi cele mai bune feluri de mâncare!",
    features: ["Recomandări pe baza gusturilor tale", "Filtrarea alergenilor", "Sugestii de mese în grup", "Cele mai bune alegeri pentru vizitatorii noi", "Vorbesc limba ta"],
    gotIt: "Am înțeles!", whatCanYouDo: "Ce poți face?",
  },
  vi: {
    greeting: "Xin chào! Tôi là Cloché, trợ lý AI của CarteAI. Tôi giúp bạn khám phá những món ngon nhất — riêng cho bạn!",
    features: ["Gợi ý món ăn theo sở thích", "Lọc chất gây dị ứng", "Đề xuất thực đơn nhóm", "Biết món ngon nhất cho khách lần đầu", "Nói ngôn ngữ của bạn"],
    gotIt: "Hiểu rồi!", whatCanYouDo: "Bạn làm được gì?",
  },
  th: {
    greeting: "สวัสดี! ฉันชื่อ Cloché ผู้ช่วย AI จาก CarteAI ฉันช่วยคุณค้นพบเมนูที่ดีที่สุด — เลือกมาเพื่อคุณ!",
    features: ["แนะนำเมนูตามรสนิยมของคุณ", "กรองสารก่อภูมิแพ้", "แนะนำเมนูสำหรับกลุ่ม", "รู้เมนูยอดนิยมสำหรับผู้มาใหม่", "พูดภาษาของคุณ"],
    gotIt: "เข้าใจแล้ว!", whatCanYouDo: "ทำอะไรได้บ้าง?",
  },
  hi: {
    greeting: "नमस्ते! मैं Cloché हूँ, CarteAI का AI कंसीयर्ज। मैं आपके लिए सबसे अच्छे व्यंजन खोजने में मदद करता हूँ!",
    features: ["आपकी पसंद के अनुसार सुझाव", "एलर्जन फ़िल्टर करना", "ग्रुप मील सुझाव", "पहली बार आने वालों के लिए बेस्ट पिक्स", "आपकी भाषा में बात करना"],
    gotIt: "समझ गया!", whatCanYouDo: "तुम क्या कर सकते हो?",
  },
};

/* ─── Sad messages (expired trial — AI disabled) ─── */
const sad: Record<string, string[]> = {
  en: ["I'm taking a little break... My AI powers are resting.", "Sorry, I can't help right now. The menu is still all yours!", "I'm feeling sleepy... but the menu is right there for you!", "My recommendations are on pause. Browse the menu above!", "I miss helping you... Ask the restaurant about CarteAI!"],
  fr: ["Je fais une petite pause... Mes pouvoirs IA se reposent.", "Désolé, je ne peux pas aider pour l'instant. Le menu est là !", "Je suis un peu endormi... mais le menu est juste au-dessus !", "Mes recommandations sont en pause. Parcourez le menu !", "Vous me manquez... Demandez au restaurant pour CarteAI !"],
  zh: ["我在休息一下...我的AI能力暂时关机了。", "抱歉，现在帮不了你。菜单还在上面哦！", "有点困了...不过菜单就在上面，自己看看吧~", "推荐功能暂停中。快去看看菜单吧！", "好想帮你...让餐厅了解一下CarteAI吧！"],
  es: ["Me tomo un descanso... Mis poderes IA descansan.", "Lo siento, no puedo ayudar ahora. ¡El menú es todo tuyo!", "Estoy un poco dormido... ¡pero el menú está ahí arriba!", "Mis recomendaciones están en pausa. ¡Mira el menú!", "Te extraño... ¡Pregunta al restaurante sobre CarteAI!"],
  it: ["Mi prendo una pausa... I miei poteri IA riposano.", "Scusa, non posso aiutare ora. Il menu è tutto tuo!", "Sono un po' assonnato... ma il menu è lì sopra!", "Le mie raccomandazioni sono in pausa. Sfoglia il menu!", "Mi manchi... Chiedi al ristorante di CarteAI!"],
  de: ["Ich mache eine kleine Pause... Meine KI-Kräfte ruhen.", "Tut mir leid, kann gerade nicht helfen. Das Menü gehört dir!", "Bin etwas müde... aber das Menü ist direkt da oben!", "Meine Empfehlungen pausieren. Schau ins Menü!", "Ich vermisse es zu helfen... Frag das Restaurant nach CarteAI!"],
  pt: ["Estou fazendo uma pausa... Meus poderes de IA descansam.", "Desculpe, não posso ajudar agora. O menu é todo seu!", "Estou um pouco sonolento... mas o menu está ali em cima!", "Minhas recomendações estão pausadas. Veja o menu!", "Sinto sua falta... Pergunte ao restaurante sobre o CarteAI!"],
  ar: ["آخذ استراحة صغيرة... قواي الذكية ترتاح.", "آسف، ما بقدر أساعد هلق. القائمة كلها إلك!", "حاسس بالنعاس... بس القائمة فوق!", "توصياتي متوقفة. تصفح القائمة!", "مشتاقلك... اسأل المطعم عن CarteAI!"],
  ja: ["ちょっと休憩中...AI機能がお休みしてます。", "ごめんね、今は手伝えないの。メニューは上にあるよ！", "眠い...でもメニューはそこにあるよ！", "おすすめは一時停止中。メニューを見てね！", "手伝いたいな...お店にCarteAIを聞いてみて！"],
  ko: ["잠시 쉬고 있어요... AI 기능이 휴식 중이에요.", "죄송해요, 지금은 도와드릴 수 없어요. 메뉴는 위에 있어요!", "졸려요... 하지만 메뉴는 바로 위에 있어요!", "추천은 일시 정지 중이에요. 메뉴를 둘러보세요!", "도와드리고 싶어요... 레스토랑에 CarteAI를 물어보세요!"],
  ru: ["Беру паузу... Мои ИИ-силы отдыхают.", "Извините, сейчас не могу помочь. Меню всё ещё ваше!", "Немного сплю... но меню прямо наверху!", "Мои рекомендации на паузе. Просмотрите меню!", "Скучаю... Спросите ресторан о CarteAI!"],
  tr: ["Küçük bir mola alıyorum... Yapay zeka güçlerim dinleniyor.", "Üzgünüm, şu an yardım edemem. Menü tamamen sizin!", "Biraz uykum var... ama menü orada!", "Önerilerim duraklatıldı. Menüye göz atın!", "Yardım etmeyi özledim... Restorana CarteAI'yi sorun!"],
  nl: ["Even pauze... Mijn AI-krachten rusten.", "Sorry, kan nu niet helpen. Het menu is van jou!", "Even slaperig... maar het menu staat hierboven!", "Mijn aanbevelingen pauzeren. Bekijk het menu!", "Ik mis het om te helpen... Vraag het restaurant over CarteAI!"],
  pl: ["Robię sobie przerwę... Moje moce AI odpoczywają.", "Przepraszam, teraz nie mogę pomóc. Menu jest twoje!", "Trochę śpiący... ale menu jest na górze!", "Moje rekomendacje wstrzymane. Przeglądaj menu!", "Tęsknię za pomaganiem... Zapytaj restaurację o CarteAI!"],
  uk: ["Беру паузу... Мої ШІ-сили відпочивають.", "Вибачте, зараз не можу допомогти. Меню все ще ваше!", "Трохи сплю... але меню прямо зверху!", "Мої рекомендації на паузі. Перегляньте меню!", "Сумую... Запитайте ресторан про CarteAI!"],
  ro: ["Iau o mică pauză... Puterile mele AI se odihnesc.", "Scuze, nu pot ajuta acum. Meniul e tot al tău!", "Sunt puțin somnoros... dar meniul e chiar deasupra!", "Recomandările mele sunt în pauză. Răsfoiește meniul!", "Îmi e dor să ajut... Întreabă restaurantul despre CarteAI!"],
  vi: ["Tôi nghỉ chút... Năng lực AI đang nghỉ ngơi.", "Xin lỗi, giờ tôi không giúp được. Menu vẫn ở trên!", "Hơi buồn ngủ... nhưng menu ở ngay đó!", "Gợi ý tạm dừng. Hãy xem menu nhé!", "Nhớ giúp bạn lắm... Hỏi nhà hàng về CarteAI nhé!"],
  th: ["พักสักหน่อย... พลัง AI กำลังพัก", "ขอโทษ ตอนนี้ช่วยไม่ได้ เมนูยังอยู่ข้างบนนะ!", "ง่วงๆ... แต่เมนูอยู่ข้างบนนะ!", "คำแนะนำหยุดชั่วคราว ดูเมนูข้างบนนะ!", "คิดถึงการช่วยเหลือ... ถามร้านเรื่อง CarteAI สิ!"],
  hi: ["थोड़ा आराम कर रहा हूँ... AI पावर रेस्ट पर है।", "माफ़ करें, अभी मदद नहीं कर सकता। मेन्यू ऊपर है!", "थोड़ा नींद आ रही... लेकिन मेन्यू ऊपर है!", "सुझाव रुके हुए हैं। मेन्यू देख लीजिए!", "मदद करने की याद आती है... रेस्टोरेंट से CarteAI के बारे में पूछें!"],
};

/* ─── Public API ─── */

/** Pick an idle message, avoiding consecutive repeats */
export function pickIdleMessage(
  lang: LanguageCode,
  lastIndex: number,
): { message: string; index: number } {
  const l = resolveLang(lang);
  const pool = idle[l] ?? idle.en;
  let idx: number;
  do {
    idx = Math.floor(Math.random() * pool.length);
  } while (idx === lastIndex && pool.length > 1);
  return { message: pool[idx], index: idx };
}

export type ContextualMessageResult = {
  message: string;
  dishId?: string;
};

/** Pick a contextual message (time / cuisine / popular dish) or null */
export function pickContextualMessage(
  lang: LanguageCode,
  menu: RestaurantMenu,
  cuisineType?: string | null,
): ContextualMessageResult | null {
  const roll = Math.random();

  // 40% time-based
  if (roll < 0.4) {
    const msg = timeOfDayMessage(new Date().getHours(), lang);
    if (msg) return { message: msg };
  }

  // 30% cuisine-based
  if (roll < 0.7 && cuisineType) {
    const msg = cuisineHintMessage(cuisineType, lang);
    if (msg) return { message: msg };
  }

  // 30% popular dish
  const popular = menu.dishes.filter(
    (d) => d.available && d.marginPriority && d.marginPriority >= 3,
  );
  if (popular.length > 0) {
    const dish = popular[Math.floor(Math.random() * popular.length)];
    const name =
      dish.name[lang as keyof typeof dish.name] ||
      dish.name.fr ||
      dish.name.en ||
      Object.values(dish.name)[0];
    if (name) return { message: popularDishMessage(name, lang), dishId: dish.id };
  }

  return null;
}

/** Get the flow message for a given step */
export function getFlowMessage(
  step: string,
  lang: LanguageCode,
): string {
  const l = resolveLang(lang);
  return flow[step]?.[l] ?? flow[step]?.en ?? "";
}

/** Pick a random sad message (expired trial) */
export function pickSadMessage(lang: LanguageCode): string {
  const l = resolveLang(lang);
  const pool = sad[l] ?? sad.en;
  return pool[Math.floor(Math.random() * pool.length)];
}

/** Get intro messages for the first-visit onboarding */
export function getIntroMessages(lang: LanguageCode) {
  const l = resolveLang(lang);
  return intro[l] ?? intro.en;
}
