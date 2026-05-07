export type AuthLocale = "en" | "fr" | "zh";

const dict = {
  en: {
    // Login
    signInTitle: "Sign in to CarteAI",
    continueWithGoogle: "Continue with Google",
    or: "or",
    emailPlaceholder: "Email",
    passwordPlaceholder: "Password",
    signingIn: "Signing in...",
    signIn: "Sign in",
    forgotPassword: "Forgot password?",
    noAccount: "Don't have an account?",
    signUp: "Sign up",
    invalidCredentials: "Invalid email or password.",

    // Register
    createAccountTitle: "Create your account",
    namePlaceholder: "Name",
    passwordHint: "Password (min 8 characters)",
    confirmPasswordPlaceholder: "Confirm password",
    pwMin8: "At least 8 characters",
    pwUppercase: "One uppercase letter",
    pwLowercase: "One lowercase letter",
    pwNumber: "One number",
    passwordsNoMatch: "Passwords do not match.",
    pleaseVerify: "Please complete the verification.",
    creatingAccount: "Creating account...",
    createAccount: "Create account",
    alreadyHaveAccount: "Already have an account?",
    registrationFailed: "Registration failed. Please try again.",

    // Post-registration
    verifyEmailTitle: "Check your email",
    verifyEmailDesc: (email: string) =>
      `We've sent a verification link to <strong class="text-foreground">${email}</strong>. Please check your inbox and spam folder to activate your account.`,
    verifyEmailNote: "You must verify your email before you can sign in.",

    // Forgot password
    resetTitle: "Reset your password",
    resetDesc: "Enter the email address associated with your account and we'll send you a reset link.",
    sending: "Sending...",
    sendResetLink: "Send reset link",
    rememberPassword: "Remember your password?",
    checkEmailTitle: "Check your email",
    checkEmailDesc: (email: string) =>
      `If an account exists for <strong class="text-foreground">${email}</strong>, we've sent a password reset link. Please check your inbox and spam folder.`,
    backToSignIn: "Back to sign in",
  },
  fr: {
    signInTitle: "Connexion à CarteAI",
    continueWithGoogle: "Continuer avec Google",
    or: "ou",
    emailPlaceholder: "E-mail",
    passwordPlaceholder: "Mot de passe",
    signingIn: "Connexion...",
    signIn: "Se connecter",
    forgotPassword: "Mot de passe oublié ?",
    noAccount: "Pas encore de compte ?",
    signUp: "S'inscrire",
    invalidCredentials: "E-mail ou mot de passe invalide.",

    createAccountTitle: "Créez votre compte",
    namePlaceholder: "Nom",
    passwordHint: "Mot de passe (min 8 caractères)",
    confirmPasswordPlaceholder: "Confirmer le mot de passe",
    pwMin8: "Au moins 8 caractères",
    pwUppercase: "Une lettre majuscule",
    pwLowercase: "Une lettre minuscule",
    pwNumber: "Un chiffre",
    passwordsNoMatch: "Les mots de passe ne correspondent pas.",
    pleaseVerify: "Veuillez compléter la vérification.",
    creatingAccount: "Création du compte...",
    createAccount: "Créer un compte",
    alreadyHaveAccount: "Vous avez déjà un compte ?",
    registrationFailed: "L'inscription a échoué. Veuillez réessayer.",

    verifyEmailTitle: "Vérifiez votre e-mail",
    verifyEmailDesc: (email: string) =>
      `Nous avons envoyé un lien de vérification à <strong class="text-foreground">${email}</strong>. Veuillez vérifier votre boîte de réception et vos spams pour activer votre compte.`,
    verifyEmailNote: "Vous devez vérifier votre e-mail avant de pouvoir vous connecter.",

    resetTitle: "Réinitialiser le mot de passe",
    resetDesc: "Entrez l'adresse e-mail associée à votre compte et nous vous enverrons un lien de réinitialisation.",
    sending: "Envoi...",
    sendResetLink: "Envoyer le lien",
    rememberPassword: "Vous vous souvenez du mot de passe ?",
    checkEmailTitle: "Vérifiez votre e-mail",
    checkEmailDesc: (email: string) =>
      `Si un compte existe pour <strong class="text-foreground">${email}</strong>, nous avons envoyé un lien de réinitialisation. Vérifiez votre boîte de réception et vos spams.`,
    backToSignIn: "Retour à la connexion",
  },
  zh: {
    signInTitle: "登录 CarteAI",
    continueWithGoogle: "使用 Google 登录",
    or: "或",
    emailPlaceholder: "邮箱",
    passwordPlaceholder: "密码",
    signingIn: "登录中...",
    signIn: "登录",
    forgotPassword: "忘记密码？",
    noAccount: "还没有账户？",
    signUp: "注册",
    invalidCredentials: "邮箱或密码错误。",

    createAccountTitle: "创建账户",
    namePlaceholder: "姓名",
    passwordHint: "密码（至少 8 位）",
    confirmPasswordPlaceholder: "确认密码",
    pwMin8: "至少 8 个字符",
    pwUppercase: "包含一个大写字母",
    pwLowercase: "包含一个小写字母",
    pwNumber: "包含一个数字",
    passwordsNoMatch: "两次密码不一致。",
    pleaseVerify: "请完成验证。",
    creatingAccount: "创建中...",
    createAccount: "创建账户",
    alreadyHaveAccount: "已有账户？",
    registrationFailed: "注册失败，请重试。",

    verifyEmailTitle: "请查收邮件",
    verifyEmailDesc: (email: string) =>
      `我们已向 <strong class="text-foreground">${email}</strong> 发送了验证链接。请检查收件箱和垃圾邮件以激活您的账户。`,
    verifyEmailNote: "您必须验证邮箱后才能登录。",

    resetTitle: "重置密码",
    resetDesc: "输入您的账户邮箱，我们将发送重置链接。",
    sending: "发送中...",
    sendResetLink: "发送重置链接",
    rememberPassword: "记起密码了？",
    checkEmailTitle: "请查收邮件",
    checkEmailDesc: (email: string) =>
      `如果 <strong class="text-foreground">${email}</strong> 对应的账户存在，我们已发送密码重置链接。请检查收件箱和垃圾邮件。`,
    backToSignIn: "返回登录",
  },
} as const;

type DictEntry = (typeof dict)["en"];
export type AuthDict = {
  [K in keyof DictEntry]: DictEntry[K] extends (...args: never[]) => string
    ? DictEntry[K]
    : string;
};

export function getAuthDict(locale: AuthLocale): AuthDict {
  return dict[locale] as unknown as AuthDict;
}

/** Detect locale from browser navigator.language */
export function detectAuthLocale(): AuthLocale {
  if (typeof navigator === "undefined") return "en";
  const lang = navigator.language?.split("-")[0]?.toLowerCase();
  if (lang === "zh") return "zh";
  if (lang === "fr") return "fr";
  return "en";
}

