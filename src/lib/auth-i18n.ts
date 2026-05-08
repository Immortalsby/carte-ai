export type AuthLocale = "en" | "fr" | "zh";

const dict = {
  en: {
    // Login
    signInTitle: "Sign in to CarteAI",
    continueWithGoogle: "Continue with Google",
    redirecting: "Redirecting...",
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
    agreeTerms: "I agree to the",
    termsOfService: "Terms of Service",
    andThe: "and the",
    privacyPolicy: "Privacy Policy",
    mustAgreeTerms: "You must agree to the terms to continue.",
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

    // Welcome page
    sessionExpired: "Session expired",
    sessionExpiredDesc: "Please sign in again to continue.",
    welcome: (name: string) => `Welcome, ${name}!`,
    stepVerifyEmail: "Step 1: Verify your email",
    stepVerifyEmailDesc: (email: string) =>
      `We've sent a verification link to <strong class="text-foreground">${email}</strong>. Please check your inbox and spam folder.`,
    resendEmail: "Resend verification email",
    emailSentBang: "Email sent!",
    iVerified: "I've verified — check status",
    stepAccountReview: "Step 2: Account under review",
    stepAccountReviewDesc: "Your email has been verified. Your account is now being reviewed by our team. Once approved, you'll be able to create your restaurant and start using CarteAI.",
    notifyByEmail: "We'll notify you by email once your account is activated.",
    checkStatus: "Check status",
    checkingStatus: "Checking account status...",
    wrongEmail: "Wrong email?",
    signUpAgain: "Sign up again",

    // Reset password page
    setNewPassword: "Set new password",
    setNewPasswordDesc: "Choose a strong password with at least 8 characters, including uppercase, lowercase, and a number.",
    newPasswordPlaceholder: "New password",
    confirmNewPasswordPlaceholder: "Confirm new password",
    resetting: "Resetting...",
    resetPassword: "Reset password",
    passwordResetSuccess: "Password reset!",
    passwordResetSuccessDesc: "Your password has been updated successfully. You can now sign in with your new password.",
    invalidResetLink: "This reset link is invalid or has expired. Please request a new one.",
    invalidResetLinkShort: "Invalid reset link. Please request a new one.",
    resetFailed: "Failed to reset password. Please try again.",
    requestNewLink: "Request a new reset link",
  },
  fr: {
    signInTitle: "Connexion à CarteAI",
    continueWithGoogle: "Continuer avec Google",
    redirecting: "Redirection...",
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
    agreeTerms: "J\u2019accepte les",
    termsOfService: "Conditions d\u2019utilisation",
    andThe: "et la",
    privacyPolicy: "Politique de confidentialit\u00e9",
    mustAgreeTerms: "Vous devez accepter les conditions pour continuer.",
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

    sessionExpired: "Session expirée",
    sessionExpiredDesc: "Veuillez vous reconnecter pour continuer.",
    welcome: (name: string) => `Bienvenue, ${name} !`,
    stepVerifyEmail: "Étape 1 : Vérifiez votre e-mail",
    stepVerifyEmailDesc: (email: string) =>
      `Nous avons envoyé un lien de vérification à <strong class="text-foreground">${email}</strong>. Veuillez vérifier votre boîte de réception et vos spams.`,
    resendEmail: "Renvoyer l'e-mail de vérification",
    emailSentBang: "E-mail envoyé !",
    iVerified: "J'ai vérifié — vérifier le statut",
    stepAccountReview: "Étape 2 : Compte en cours de vérification",
    stepAccountReviewDesc: "Votre e-mail a été vérifié. Votre compte est en cours d'examen par notre équipe. Une fois approuvé, vous pourrez créer votre restaurant et commencer à utiliser CarteAI.",
    notifyByEmail: "Nous vous informerons par e-mail une fois votre compte activé.",
    checkStatus: "Vérifier le statut",
    checkingStatus: "Vérification du statut...",
    wrongEmail: "Mauvais e-mail ?",
    signUpAgain: "S'inscrire à nouveau",

    setNewPassword: "Nouveau mot de passe",
    setNewPasswordDesc: "Choisissez un mot de passe fort d'au moins 8 caractères, incluant majuscules, minuscules et un chiffre.",
    newPasswordPlaceholder: "Nouveau mot de passe",
    confirmNewPasswordPlaceholder: "Confirmer le nouveau mot de passe",
    resetting: "Réinitialisation...",
    resetPassword: "Réinitialiser le mot de passe",
    passwordResetSuccess: "Mot de passe réinitialisé !",
    passwordResetSuccessDesc: "Votre mot de passe a été mis à jour avec succès. Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.",
    invalidResetLink: "Ce lien de réinitialisation est invalide ou a expiré. Veuillez en demander un nouveau.",
    invalidResetLinkShort: "Lien de réinitialisation invalide. Veuillez en demander un nouveau.",
    resetFailed: "Échec de la réinitialisation. Veuillez réessayer.",
    requestNewLink: "Demander un nouveau lien",
  },
  zh: {
    signInTitle: "登录 CarteAI",
    continueWithGoogle: "使用 Google 登录",
    redirecting: "跳转中...",
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
    agreeTerms: "我同意",
    termsOfService: "服务条款",
    andThe: "和",
    privacyPolicy: "隐私政策",
    mustAgreeTerms: "请先同意服务条款和隐私政策。",
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

    sessionExpired: "会话已过期",
    sessionExpiredDesc: "请重新登录以继续。",
    welcome: (name: string) => `欢迎，${name}！`,
    stepVerifyEmail: "第 1 步：验证邮箱",
    stepVerifyEmailDesc: (email: string) =>
      `我们已向 <strong class="text-foreground">${email}</strong> 发送了验证链接。请检查收件箱和垃圾邮件。`,
    resendEmail: "重新发送验证邮件",
    emailSentBang: "邮件已发送！",
    iVerified: "我已验证 — 检查状态",
    stepAccountReview: "第 2 步：账户审核中",
    stepAccountReviewDesc: "您的邮箱已验证。您的账户正在审核中。审核通过后，您即可创建餐厅并开始使用 CarteAI。",
    notifyByEmail: "账户激活后我们会通过邮件通知您。",
    checkStatus: "检查状态",
    checkingStatus: "正在检查账户状态...",
    wrongEmail: "邮箱不对？",
    signUpAgain: "重新注册",

    setNewPassword: "设置新密码",
    setNewPasswordDesc: "请设置一个至少 8 位的强密码，需包含大写字母、小写字母和数字。",
    newPasswordPlaceholder: "新密码",
    confirmNewPasswordPlaceholder: "确认新密码",
    resetting: "重置中...",
    resetPassword: "重置密码",
    passwordResetSuccess: "密码已重置！",
    passwordResetSuccessDesc: "您的密码已成功更新。现在可以使用新密码登录了。",
    invalidResetLink: "此重置链接无效或已过期，请重新申请。",
    invalidResetLinkShort: "无效的重置链接，请重新申请。",
    resetFailed: "密码重置失败，请重试。",
    requestNewLink: "申请新的重置链接",
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

