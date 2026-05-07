/**
 * Email HTML generators — importable for preview without Resend dependency.
 * The actual send functions in email.ts call these internally.
 */

const BASE = process.env.NEXT_PUBLIC_APP_URL || "https://carte-ai.link";

const C = {
  emerald: "#10b981",
  gold: "#d4a574",
  ink: "#050507",
  paper: "#f6f3ec",
  paperLine: "#e8e1d2",
  muted: "#7a7a82",
  bodyBg: "#0f0f12",
} as const;

// Use hosted image URL — data URIs are blocked by most email clients (Gmail, Outlook, etc.)
const LOGO_URL = "https://carte-ai.link/images/logo-icon.png";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function emailShell(content: string) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${C.bodyBg};font-family:Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.bodyBg};">
<tr><td align="center" style="padding:40px 16px 48px;">
<table role="presentation" width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;">
${content}
</table>
</td></tr></table></body></html>`;
}

/* ── Trilingual text block helper ── */
function tri(en: string, fr: string, zh: string, style = "") {
  const langTag = (code: string) =>
    `<span style="font-family:'Courier New',monospace;font-size:9px;letter-spacing:0.12em;color:${C.gold};text-transform:uppercase;">${code}</span>`;
  const line = (lang: string, text: string, last = false) =>
    `<div style="margin-bottom:${last ? "0" : "10px"};${style}">
      ${langTag(lang)}<br>
      <span style="margin-top:2px;display:inline-block;">${text}</span>
    </div>`;
  return line("EN", en) + line("FR", fr) + line("ZH", zh, true);
}

function stepBlock(num: string, emoji: string, en: [string, string], fr: [string, string], zh: [string, string]) {
  return `<td width="33%" align="center" valign="top" style="padding:0 6px;">
    <div style="width:48px;height:48px;border-radius:50%;background:${C.ink};border:1.5px solid #1f1f25;margin:0 auto 10px;line-height:48px;text-align:center;font-size:22px;">${emoji}</div>
    <div style="font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:${C.gold};margin-bottom:8px;">Step ${num}</div>
    <p style="margin:0 0 2px;font-size:12px;font-weight:600;color:${C.paper};">${en[0]}</p>
    <p style="margin:0 0 6px;font-size:10px;color:#6a6a72;line-height:1.4;">${en[1]}</p>
    <p style="margin:0 0 2px;font-size:12px;font-weight:600;color:${C.paper};">${fr[0]}</p>
    <p style="margin:0 0 6px;font-size:10px;color:#6a6a72;line-height:1.4;">${fr[1]}</p>
    <p style="margin:0 0 2px;font-size:12px;font-weight:600;color:${C.paper};">${zh[0]}</p>
    <p style="margin:0;font-size:10px;color:#6a6a72;line-height:1.4;">${zh[1]}</p>
  </td>`;
}

export function _previewWelcomeEmail(user: { name: string; email: string }) {
  return emailShell(`
    <!-- Logo mark -->
    <tr><td align="center" style="padding-bottom:8px;">
      <img src="${LOGO_URL}" alt="CarteAI" width="72" height="72" style="display:block;" />
    </td></tr>

    <!-- Wordmark -->
    <tr><td align="center" style="padding-bottom:6px;">
      <span style="font-family:Georgia,'Times New Roman',serif;font-size:36px;color:${C.paper};letter-spacing:-0.5px;">Carte</span><span style="font-family:'Courier New',Courier,monospace;font-size:18px;color:${C.gold};letter-spacing:2px;position:relative;top:-4px;margin-left:4px;">AI</span>
    </td></tr>
    <tr><td align="center" style="padding-bottom:32px;">
      <span style="font-family:'Courier New',Courier,monospace;font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:${C.muted};">DINING &middot; CONCIERGE</span>
    </td></tr>

    <!-- Gold divider -->
    <tr><td style="padding:0 60px 32px;">
      <div style="height:1px;background:linear-gradient(90deg,transparent,${C.gold},transparent);"></div>
    </td></tr>

    <!-- Trilingual welcome heading -->
    <tr><td align="center" style="padding-bottom:8px;">
      <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:26px;color:${C.paper};letter-spacing:-0.3px;">
        Welcome, ${escapeHtml(user.name)}!
      </h1>
    </td></tr>
    <tr><td align="center" style="padding-bottom:4px;">
      <span style="font-family:Georgia,'Times New Roman',serif;font-size:18px;color:#8a8a92;font-style:italic;">
        Bienvenue, ${escapeHtml(user.name)} !
      </span>
    </td></tr>
    <tr><td align="center" style="padding-bottom:24px;">
      <span style="font-size:18px;color:#8a8a92;">
        ${escapeHtml(user.name)}，欢迎加入！
      </span>
    </td></tr>

    <!-- Body text — trilingual -->
    <tr><td style="padding:0 20px 28px;">
      ${tri(
        "Thank you for joining CarteAI. Your registration has been received and is under review. We'll activate your account shortly.",
        "Merci d'avoir rejoint CarteAI. Votre inscription a bien &eacute;t&eacute; re&ccedil;ue et est en cours d'examen. Nous activerons votre compte tr&egrave;s prochainement.",
        "感谢您注册 CarteAI。您的申请已收到，正在审核中。我们将尽快激活您的账户。",
        "font-size:13px;line-height:1.65;color:#a8a8b0;text-align:center;"
      )}
    </td></tr>

    <!-- Divider -->
    <tr><td style="padding:0 40px 28px;">
      <div style="height:1px;background:#1f1f25;"></div>
    </td></tr>

    <!-- HOW IT WORKS — trilingual header -->
    <tr><td align="center" style="padding-bottom:6px;">
      <span style="font-family:'Courier New',Courier,monospace;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:${C.gold};">How it works</span>
    </td></tr>
    <tr><td align="center" style="padding-bottom:4px;">
      <span style="font-family:'Courier New',Courier,monospace;font-size:10px;letter-spacing:0.14em;color:#5a5a62;">Comment &ccedil;a marche</span>
    </td></tr>
    <tr><td align="center" style="padding-bottom:20px;">
      <span style="font-family:'Courier New',Courier,monospace;font-size:10px;letter-spacing:0.14em;color:#5a5a62;">使用流程</span>
    </td></tr>

    <!-- 3 Steps -->
    <tr><td style="padding:0 0 8px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
        ${stepBlock("1", "&#x1F4CB;",
          ["Upload Menu", "PDF or photos &mdash; AI extracts everything."],
          ["Importez le menu", "PDF ou photos &mdash; l'IA extrait tout."],
          ["上传菜单", "PDF 或照片，AI 自动提取菜品信息。"]
        )}
        ${stepBlock("2", "&#x1F5A8;",
          ["Print QR Poster", "Branded poster for your tables."],
          ["Imprimez le QR", "Affiche personnalis&eacute;e pour vos tables."],
          ["打印二维码海报", "品牌化海报，放在每张桌上。"]
        )}
        ${stepBlock("3", "&#x1F4F1;",
          ["Guests Scan", "Recommendations in their language."],
          ["Les clients scannent", "Recommandations dans leur langue."],
          ["顾客扫码", "用母语获得个性化推荐。"]
        )}
      </tr></table>
    </td></tr>

    <!-- Spacer -->
    <tr><td style="padding:0 0 20px;"></td></tr>

    <!-- Divider -->
    <tr><td style="padding:0 40px 28px;">
      <div style="height:1px;background:#1f1f25;"></div>
    </td></tr>

    <!-- CTA -->
    <tr><td align="center" style="padding-bottom:28px;">
      <a href="${BASE}/admin" style="display:inline-block;background:${C.emerald};color:#04140d;font-size:14px;font-weight:600;padding:13px 32px;border-radius:8px;text-decoration:none;letter-spacing:0.01em;">
        Go to Dashboard &rarr;
      </a>
    </td></tr>

    <!-- 14-day trial banner — trilingual -->
    <tr><td style="padding:0 24px 28px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.ink};border:1.5px solid ${C.gold};border-radius:10px;">
        <tr><td style="padding:22px 24px;" align="center">
          <div style="font-size:20px;margin-bottom:10px;">&#x1F381;</div>
          <div style="font-family:Georgia,'Times New Roman',serif;font-size:17px;color:${C.paper};margin-bottom:4px;">
            14 days free &mdash; on us
          </div>
          <div style="font-size:13px;color:#8a8a92;font-style:italic;margin-bottom:4px;">
            14 jours gratuits &mdash; c'est cadeau
          </div>
          <div style="font-size:13px;color:#8a8a92;margin-bottom:14px;">
            14 天免费体验，我们请客
          </div>
          <div style="font-size:12px;color:#a8a8b0;line-height:1.6;margin-bottom:10px;">
            Once approved, enjoy <strong style="color:${C.gold};">14 days of full access</strong> &mdash; AI recommendations, analytics, multilingual menus, unlimited QR scans. No credit card needed.
          </div>
          <div style="font-size:11px;color:#6a6a72;line-height:1.6;margin-bottom:8px;">
            Une fois valid&eacute;, profitez de <strong style="color:${C.gold};">14 jours d'acc&egrave;s complet</strong> &mdash; recommandations IA, analytiques, menus multilingues, scans QR illimit&eacute;s. Sans carte bancaire.
          </div>
          <div style="font-size:11px;color:#6a6a72;line-height:1.6;">
            审核通过后，您将享受 <strong style="color:${C.gold};">14 天全功能免费体验</strong>——AI 推荐、数据分析、多语言菜单、无限扫码。无需绑定信用卡。
          </div>
        </td></tr>
      </table>
    </td></tr>

    <!-- Business card -->
    <tr><td style="padding:0 24px 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.paper};border-radius:8px;">
        <tr><td style="padding:24px 28px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td width="44" valign="top">
                <img src="${LOGO_URL}" alt="" width="40" height="40" style="display:block;" />
              </td>
              <td valign="middle" style="padding-left:12px;">
                <span style="font-family:Georgia,'Times New Roman',serif;font-size:20px;color:${C.ink};letter-spacing:-0.3px;">Carte</span><span style="font-family:'Courier New',Courier,monospace;font-size:11px;color:#b88a52;letter-spacing:1px;position:relative;top:-3px;margin-left:2px;">AI</span>
                <div style="font-family:'Courier New',Courier,monospace;font-size:8px;letter-spacing:0.18em;color:#7a6f56;margin-top:3px;text-transform:uppercase;">Dining &middot; Concierge</div>
              </td>
            </tr>
          </table>
          <div style="height:1px;background:linear-gradient(90deg,transparent,#c9bfa9 30%,#c9bfa9 70%,transparent);margin:16px 0;"></div>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td valign="bottom">
                <div style="font-family:Georgia,'Times New Roman',serif;font-size:15px;color:${C.ink};">Boyuan SHI</div>
                <div style="font-family:'Courier New',Courier,monospace;font-size:8px;letter-spacing:0.16em;color:#7a6f56;margin-top:3px;text-transform:uppercase;">Founder</div>
              </td>
              <td align="right" valign="bottom" style="font-family:'Courier New',Courier,monospace;font-size:9px;color:#7a6f56;line-height:1.8;">
                <a href="${BASE}" style="color:#7a6f56;text-decoration:none;">carte-ai.link</a>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>
    </td></tr>

    <!-- Footer -->
    <tr><td align="center" style="padding:24px 20px 0;">
      <p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:9px;letter-spacing:0.1em;color:#3f3f46;text-transform:uppercase;">
        CarteAI &middot; AI Dining Concierge &middot; Est. 2026
      </p>
    </td></tr>
  `);
}

export function _previewPasswordResetEmail(data: {
  name: string;
  email: string;
  url: string;
}) {
  return emailShell(`
    <!-- Logo mark -->
    <tr><td align="center" style="padding-bottom:8px;">
      <img src="${LOGO_URL}" alt="CarteAI" width="72" height="72" style="display:block;" />
    </td></tr>

    <!-- Wordmark -->
    <tr><td align="center" style="padding-bottom:6px;">
      <span style="font-family:Georgia,'Times New Roman',serif;font-size:36px;color:${C.paper};letter-spacing:-0.5px;">Carte</span><span style="font-family:'Courier New',Courier,monospace;font-size:18px;color:${C.gold};letter-spacing:2px;position:relative;top:-4px;margin-left:4px;">AI</span>
    </td></tr>
    <tr><td align="center" style="padding-bottom:32px;">
      <span style="font-family:'Courier New',Courier,monospace;font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:${C.muted};">DINING &middot; CONCIERGE</span>
    </td></tr>

    <!-- Gold divider -->
    <tr><td style="padding:0 60px 32px;">
      <div style="height:1px;background:linear-gradient(90deg,transparent,${C.gold},transparent);"></div>
    </td></tr>

    <!-- Trilingual heading -->
    <tr><td align="center" style="padding-bottom:8px;">
      <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:26px;color:${C.paper};letter-spacing:-0.3px;">
        Reset Your Password
      </h1>
    </td></tr>
    <tr><td align="center" style="padding-bottom:4px;">
      <span style="font-family:Georgia,'Times New Roman',serif;font-size:18px;color:#8a8a92;font-style:italic;">
        R&eacute;initialisez votre mot de passe
      </span>
    </td></tr>
    <tr><td align="center" style="padding-bottom:24px;">
      <span style="font-size:18px;color:#8a8a92;">
        重置您的密码
      </span>
    </td></tr>

    <!-- Body text — trilingual -->
    <tr><td style="padding:0 20px 28px;">
      ${tri(
        `Hi ${escapeHtml(data.name)}, we received a request to reset your CarteAI password. Click the button below to choose a new one. This link expires in 1 hour.`,
        `Bonjour ${escapeHtml(data.name)}, nous avons re&ccedil;u une demande de r&eacute;initialisation de votre mot de passe CarteAI. Cliquez sur le bouton ci-dessous pour en choisir un nouveau. Ce lien expire dans 1 heure.`,
        `${escapeHtml(data.name)}，您好！我们收到了重置您 CarteAI 密码的请求。请点击下方按钮设置新密码。此链接将在 1 小时后失效。`,
        "font-size:13px;line-height:1.65;color:#a8a8b0;text-align:center;"
      )}
    </td></tr>

    <!-- CTA -->
    <tr><td align="center" style="padding-bottom:28px;">
      <a href="${escapeHtml(data.url)}" style="display:inline-block;background:${C.emerald};color:#04140d;font-size:14px;font-weight:600;padding:13px 32px;border-radius:8px;text-decoration:none;letter-spacing:0.01em;">
        Reset Password &rarr;
      </a>
    </td></tr>

    <!-- Security notice — trilingual -->
    <tr><td style="padding:0 24px 28px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.ink};border:1px solid #1f1f25;border-radius:8px;">
        <tr><td style="padding:18px 22px;" align="center">
          <div style="font-size:18px;margin-bottom:8px;">&#x1F512;</div>
          ${tri(
            "If you didn&rsquo;t request this, you can safely ignore this email. Your password will remain unchanged.",
            "Si vous n&rsquo;avez pas fait cette demande, ignorez simplement cet e-mail. Votre mot de passe restera inchang&eacute;.",
            "如果这不是您的操作，请忽略此邮件，您的密码不会被更改。",
            "font-size:11px;line-height:1.6;color:#6a6a72;text-align:center;"
          )}
        </td></tr>
      </table>
    </td></tr>

    <!-- Footer -->
    <tr><td align="center" style="padding:0 20px;">
      <p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:9px;letter-spacing:0.1em;color:#3f3f46;text-transform:uppercase;">
        CarteAI &middot; AI Dining Concierge &middot; Est. 2026
      </p>
    </td></tr>
  `);
}

export function _previewVerificationEmail(data: {
  name: string;
  email: string;
  url: string;
}) {
  return emailShell(`
    <!-- Logo mark -->
    <tr><td align="center" style="padding-bottom:8px;">
      <img src="${LOGO_URL}" alt="CarteAI" width="72" height="72" style="display:block;" />
    </td></tr>

    <!-- Wordmark -->
    <tr><td align="center" style="padding-bottom:6px;">
      <span style="font-family:Georgia,'Times New Roman',serif;font-size:36px;color:${C.paper};letter-spacing:-0.5px;">Carte</span><span style="font-family:'Courier New',Courier,monospace;font-size:18px;color:${C.gold};letter-spacing:2px;position:relative;top:-4px;margin-left:4px;">AI</span>
    </td></tr>
    <tr><td align="center" style="padding-bottom:32px;">
      <span style="font-family:'Courier New',Courier,monospace;font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:${C.muted};">DINING &middot; CONCIERGE</span>
    </td></tr>

    <!-- Gold divider -->
    <tr><td style="padding:0 60px 32px;">
      <div style="height:1px;background:linear-gradient(90deg,transparent,${C.gold},transparent);"></div>
    </td></tr>

    <!-- Trilingual heading -->
    <tr><td align="center" style="padding-bottom:8px;">
      <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:26px;color:${C.paper};letter-spacing:-0.3px;">
        Verify Your Email
      </h1>
    </td></tr>
    <tr><td align="center" style="padding-bottom:4px;">
      <span style="font-family:Georgia,'Times New Roman',serif;font-size:18px;color:#8a8a92;font-style:italic;">
        V&eacute;rifiez votre adresse e-mail
      </span>
    </td></tr>
    <tr><td align="center" style="padding-bottom:24px;">
      <span style="font-size:18px;color:#8a8a92;">
        验证您的邮箱
      </span>
    </td></tr>

    <!-- Body text — trilingual -->
    <tr><td style="padding:0 20px 28px;">
      ${tri(
        `Hi ${escapeHtml(data.name)}, thanks for signing up for CarteAI! Please click the button below to verify your email address. This link expires in 1 hour.`,
        `Bonjour ${escapeHtml(data.name)}, merci de vous &ecirc;tre inscrit(e) sur CarteAI ! Cliquez sur le bouton ci-dessous pour v&eacute;rifier votre adresse e-mail. Ce lien expire dans 1 heure.`,
        `${escapeHtml(data.name)}，您好！感谢注册 CarteAI！请点击下方按钮验证您的邮箱地址。此链接将在 1 小时后失效。`,
        "font-size:13px;line-height:1.65;color:#a8a8b0;text-align:center;"
      )}
    </td></tr>

    <!-- CTA -->
    <tr><td align="center" style="padding-bottom:28px;">
      <a href="${escapeHtml(data.url)}" style="display:inline-block;background:${C.emerald};color:#04140d;font-size:14px;font-weight:600;padding:13px 32px;border-radius:8px;text-decoration:none;letter-spacing:0.01em;">
        Verify Email &rarr;
      </a>
    </td></tr>

    <!-- Security notice -->
    <tr><td style="padding:0 24px 28px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.ink};border:1px solid #1f1f25;border-radius:8px;">
        <tr><td style="padding:18px 22px;" align="center">
          <div style="font-size:18px;margin-bottom:8px;">&#x1F512;</div>
          ${tri(
            "If you didn&rsquo;t create an account on CarteAI, you can safely ignore this email.",
            "Si vous n&rsquo;avez pas cr&eacute;&eacute; de compte sur CarteAI, vous pouvez ignorer cet e-mail.",
            "如果您没有在 CarteAI 注册账户，请忽略此邮件。",
            "font-size:11px;line-height:1.6;color:#6a6a72;text-align:center;"
          )}
        </td></tr>
      </table>
    </td></tr>

    <!-- Footer -->
    <tr><td align="center" style="padding:0 20px;">
      <p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:9px;letter-spacing:0.1em;color:#3f3f46;text-transform:uppercase;">
        CarteAI &middot; AI Dining Concierge &middot; Est. 2026
      </p>
    </td></tr>
  `);
}

export function _previewAccountActivatedEmail(user: { name: string }) {
  return emailShell(`
    <!-- Logo mark -->
    <tr><td align="center" style="padding-bottom:8px;">
      <img src="${LOGO_URL}" alt="CarteAI" width="72" height="72" style="display:block;" />
    </td></tr>

    <!-- Wordmark -->
    <tr><td align="center" style="padding-bottom:6px;">
      <span style="font-family:Georgia,'Times New Roman',serif;font-size:36px;color:${C.paper};letter-spacing:-0.5px;">Carte</span><span style="font-family:'Courier New',Courier,monospace;font-size:18px;color:${C.gold};letter-spacing:2px;position:relative;top:-4px;margin-left:4px;">AI</span>
    </td></tr>
    <tr><td align="center" style="padding-bottom:32px;">
      <span style="font-family:'Courier New',Courier,monospace;font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:${C.muted};">DINING &middot; CONCIERGE</span>
    </td></tr>

    <!-- Gold divider -->
    <tr><td style="padding:0 60px 32px;">
      <div style="height:1px;background:linear-gradient(90deg,transparent,${C.gold},transparent);"></div>
    </td></tr>

    <!-- Trilingual heading -->
    <tr><td align="center" style="padding-bottom:8px;">
      <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:26px;color:${C.paper};letter-spacing:-0.3px;">
        Your Account is Activated!
      </h1>
    </td></tr>
    <tr><td align="center" style="padding-bottom:4px;">
      <span style="font-family:Georgia,'Times New Roman',serif;font-size:18px;color:#8a8a92;font-style:italic;">
        Votre compte est activ&eacute; !
      </span>
    </td></tr>
    <tr><td align="center" style="padding-bottom:24px;">
      <span style="font-size:18px;color:#8a8a92;">
        您的账户已激活！
      </span>
    </td></tr>

    <!-- Body text — trilingual -->
    <tr><td style="padding:0 20px 28px;">
      ${tri(
        `Great news, ${escapeHtml(user.name)}! Your CarteAI account has been approved. You can now create your restaurant, upload your menu, and start offering AI-powered recommendations to your guests.`,
        `Bonne nouvelle, ${escapeHtml(user.name)} ! Votre compte CarteAI a &eacute;t&eacute; approuv&eacute;. Vous pouvez maintenant cr&eacute;er votre restaurant, importer votre menu et commencer &agrave; offrir des recommandations IA &agrave; vos clients.`,
        `好消息，${escapeHtml(user.name)}！您的 CarteAI 账户已通过审核。现在您可以创建餐厅、上传菜单，并开始为客人提供 AI 智能推荐。`,
        "font-size:13px;line-height:1.65;color:#a8a8b0;text-align:center;"
      )}
    </td></tr>

    <!-- CTA -->
    <tr><td align="center" style="padding-bottom:28px;">
      <a href="${BASE}/admin" style="display:inline-block;background:${C.emerald};color:#04140d;font-size:14px;font-weight:600;padding:13px 32px;border-radius:8px;text-decoration:none;letter-spacing:0.01em;">
        Go to Dashboard &rarr;
      </a>
    </td></tr>

    <!-- 14-day trial reminder -->
    <tr><td style="padding:0 24px 28px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.ink};border:1.5px solid ${C.gold};border-radius:10px;">
        <tr><td style="padding:22px 24px;" align="center">
          <div style="font-size:20px;margin-bottom:10px;">&#x1F389;</div>
          ${tri(
            `Your <strong style="color:${C.gold};">14-day free trial</strong> starts now. Enjoy full access &mdash; AI recommendations, analytics, multilingual menus, and unlimited QR scans. No credit card needed.`,
            `Votre <strong style="color:${C.gold};">essai gratuit de 14 jours</strong> commence maintenant. Profitez d'un acc&egrave;s complet &mdash; recommandations IA, analytiques, menus multilingues et scans QR illimit&eacute;s. Sans carte bancaire.`,
            `您的 <strong style="color:${C.gold};">14 天免费试用</strong>现在开始。尽享全部功能——AI 推荐、数据分析、多语言菜单、无限扫码。无需绑定信用卡。`,
            "font-size:12px;line-height:1.6;color:#a8a8b0;text-align:center;"
          )}
        </td></tr>
      </table>
    </td></tr>

    <!-- Footer -->
    <tr><td align="center" style="padding:0 20px;">
      <p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:9px;letter-spacing:0.1em;color:#3f3f46;text-transform:uppercase;">
        CarteAI &middot; AI Dining Concierge &middot; Est. 2026
      </p>
    </td></tr>
  `);
}

export function _previewAdminEmail(user: { name: string; email: string }) {
  return emailShell(`
    <tr><td align="center" style="padding-bottom:20px;">
      <img src="${LOGO_URL}" alt="CarteAI" width="48" height="48" style="display:block;" />
    </td></tr>

    <tr><td align="center" style="padding-bottom:24px;">
      <h2 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:22px;color:${C.paper};">New Registration</h2>
    </td></tr>

    <tr><td style="padding:0 20px 24px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.ink};border:1px solid #1f1f25;border-radius:8px;">
        <tr>
          <td style="padding:14px 18px;border-bottom:1px solid #1f1f25;">
            <span style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:${C.muted};">Name</span>
          </td>
          <td style="padding:14px 18px;border-bottom:1px solid #1f1f25;">
            <span style="font-size:14px;color:${C.paper};font-weight:600;">${escapeHtml(user.name)}</span>
          </td>
        </tr>
        <tr>
          <td style="padding:14px 18px;">
            <span style="font-family:'Courier New',monospace;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:${C.muted};">Email</span>
          </td>
          <td style="padding:14px 18px;">
            <span style="font-size:14px;color:${C.paper};">${escapeHtml(user.email)}</span>
          </td>
        </tr>
      </table>
    </td></tr>

    <tr><td align="center" style="padding-bottom:24px;">
      <a href="${BASE}/admin" style="display:inline-block;background:${C.emerald};color:#04140d;font-size:13px;font-weight:600;padding:11px 28px;border-radius:8px;text-decoration:none;">
        Open Admin Dashboard &rarr;
      </a>
    </td></tr>

    <tr><td align="center">
      <p style="margin:0;font-size:11px;color:#3f3f46;">Automated notification from CarteAI</p>
    </td></tr>
  `);
}
