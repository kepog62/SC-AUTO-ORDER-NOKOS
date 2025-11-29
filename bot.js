const { Telegraf, Markup } = require("telegraf");
const fs = require("fs-extra");
const axios = require("axios");
const archiver = require("archiver");
const AdmZip = require("adm-zip");
const path = require("path");
const moment = require("moment-timezone");
const unzipper = require("unzipper"); 
const JsConfuser = require("js-confuser");
const FormData = require("form-data");
const config = require("./config.js");

const bot = new Telegraf(config.botToken);
const LOGIN_FILE = "./logins.json";
const NOTIF_FILE = "./notifs.json";
const KEAMANAN_FILE = "./keamanan.json";
const RESELLER_FILE = "./resellers.json";
const HISTORY_FILE = "./history.json";
const GPH_FILE = "./gph.json";
const TRX_FILE = "./trx.json";
const FITUR_FILE = "./fitur_data.json";

if (!fs.existsSync(FITUR_FILE)) {
  fs.writeJSONSync(FITUR_FILE, {
    startmenu: [],
    toolsmenu: [],
    githmenu: []
  }, { spaces: 2 });
}
if (!fs.existsSync(TRX_FILE)) fs.writeJSONSync(TRX_FILE, { transaksi: [] }, { spaces: 2 });
if (!fs.existsSync(RESELLER_FILE)) fs.writeJSONSync(RESELLER_FILE, { resellers: [] }, { spaces: 2 });
if (!fs.existsSync(HISTORY_FILE)) fs.writeJSONSync(HISTORY_FILE, { history: [] }, { spaces: 2 });
if (!fs.existsSync(GPH_FILE)) fs.writeJSONSync(GPH_FILE, { token: null }, { spaces: 2 });

// ================== CONFIG REPO GITHUB ==================
const GITHUB_REPO = "kepog62/DbDewaInvictus";
const GITHUB_FILE_PATH = "tokens.json";

// ================== HELPER GITHUB TOKEN ==================
async function getGithubToken() {
  const gph = await fs.readJSON(GPH_FILE);
  return gph.token || null;
}

// ================== FETCH & UPDATE TOKENS ==================
async function fetchTokens() {
  try {
    const url = `https://raw.githubusercontent.com/${GITHUB_REPO}/main/${GITHUB_FILE_PATH}?t=${Date.now()}`;
    const { data } = await axios.get(url, { headers: { "Cache-Control": "no-cache" } });
    return data?.tokens || [];
  } catch {
    return [];
  }
}

async function updateTokens(newTokens) {
  try {
    const pat = await getGithubToken();
    if (!pat) return false;

    const apiUrl = `https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_FILE_PATH}`;
    const { data } = await axios.get(apiUrl, { headers: { Authorization: `token ${pat}` } });

    const updatedContent = Buffer.from(JSON.stringify({ tokens: newTokens }, null, 2)).toString("base64");

    await axios.put(apiUrl,
      { message: "Update token list", content: updatedContent, sha: data.sha },
      { headers: { Authorization: `token ${pat}` } }
    );

    return true;
  } catch (e) {
    console.error("Update token error:", e.message);
    return false;
  }
}

// ================== HELPER ROLE ==================
function hasAccess(userId) {
  const owner = config.ownerIds.includes(String(userId));
  const data = fs.readJSONSync(RESELLER_FILE);
  return owner || data.resellers.includes(userId);
}

if (!fs.existsSync(LOGIN_FILE)) fs.writeJSONSync(LOGIN_FILE, { github: [] }, { spaces: 2 });
if (!fs.existsSync(NOTIF_FILE)) fs.writeJSONSync(NOTIF_FILE, { enabled: false, lastId: null }, { spaces: 2 });
if (!fs.existsSync(KEAMANAN_FILE)) fs.writeJSONSync(KEAMANAN_FILE, { enabled: false, blocked: [] }, { spaces: 2 });

function isOwner(ctx) {
  if (!ctx.from) return false;
  return config.ownerIds.includes(String(ctx.from.id));
}

const CHANNEL_FILE = "./channels.json";
if (!fs.existsSync(CHANNEL_FILE)) fs.writeJSONSync(CHANNEL_FILE, { channels: [] }, { spaces: 2 });

// ================== PESAN SAMBUTAN ==================
bot.start(async (ctx) => {
  const senderName = ctx.from.first_name || "User";
  const username = ctx.from.username || senderName;
  const waktuRunPanel = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });

  const caption = `
\`\`\`
☰ 🐉 -@${username} I am a multi-purpose telegram bot script that can be used by anyone, 
and my script developer is RannTzyBack2,
──────────────────────────
┏─────────────────────┓
│ 𝖣𝖾𝗏𝗈𝗅𝗈𝗉𝖾𝗋 : @RannTzyBack2
│ 𝖵𝖾𝗋𝗌𝗂𝗈𝗇 : 1.0 Vip
│ 𝖯𝗅𝖺𝗍𝖿𝗈𝗋𝗆 : 𝖳𝖾𝗅𝖾𝗀𝗋𝖺𝗆
│ 𝖫𝗂𝖻𝗋𝖺𝗋𝗒 : 𝖩𝖺𝗏𝖺𝖲𝖼𝗋𝗂𝗉𝗍
│ 𝖱𝗎𝗇𝗍𝗂𝗆𝖾 : ${waktuRunPanel}
┗─────────────────────┛
\`\`\`

☰ ᏢᎡᎬՏՏ ᏴႮͲͲϴΝ ᎷᎬΝႮ
`;

  // kirim foto + caption
  await ctx.replyWithPhoto(
    { url: "https://files.catbox.moe/f98nr8.jpg" }, // ganti logo jika perlu
    {
      caption,
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([
        [Markup.button.callback("[ 𝗚𝗜𝗧𝗛𝗨𝗕 𝗠𝗘𝗡𝗨 ]", "menu_bot")],
        [Markup.button.callback("[ 𝗧𝗢𝗢𝗟𝗦 𝗠𝗘𝗡𝗨 ]", "cpanel_bot")]
      ])
    }
  );

  // kirim audio sambutan
  await ctx.replyWithAudio(
    { url: "https://files.catbox.moe/0nzn15.mp3" },
    { title: "𝙶𝙸𝚃𝙷𝚄𝙱 𝙱𝙾𝚃", performer: "𝚁𝙰𝙽𝙽 𝙸𝚂 𝙷𝙴𝚁𝙴" }
  );
});

// Handler MENU BOT
bot.action("menu_bot", async (ctx) => {
  await ctx.deleteMessage();
  await ctx.replyWithPhoto(
    { url: "https://files.catbox.moe/f98nr8.jpg" },
    {
      caption: `
\`\`\`
☰ 🐉 𝗪𝗲𝗹𝗰𝗼𝗺𝗲 𝗧𝗼 𝗚𝗶𝘁𝗵𝘂𝗯 𝗠𝗲𝗻𝘂
──────────────────────────
┏─────────────────────┓
│ 𝗚𝗜𝗧𝗛𝗨𝗕 𝗠𝗘𝗡𝗨
┗─────────────────────┛
☰ 𝗙𝗜𝗧𝗨𝗥 𝗚𝗜𝗧𝗛𝗨𝗕 𝗠𝗘𝗡𝗨
┏─────────────────────┓
│ /𝙻𝙾𝙶𝙸𝙽 -> 𝙻𝙾𝙶𝙸𝙽 𝙰𝙺𝚄𝙽 𝙶𝙸𝚃𝙷𝚄𝙱
│ /𝙻𝙸𝚂𝚃𝙻𝙾𝙶𝙸𝙽 -> 𝙻𝙸𝚂𝚃 𝙰𝙺𝚄𝙽 𝙶𝙸𝚃𝙷𝚄𝙱
│ /𝙳𝙴𝙻𝙻𝙾𝙶𝙸𝙽 -> 𝙷𝙰𝙿𝚄𝚂 𝙰𝙺𝚄𝙽 𝙶𝙸𝚃𝙷𝚄𝙱
│ /𝙰𝙳𝙳𝚁𝙴𝙿𝙾 -> 𝙱𝚄𝙰𝚃 𝚁𝙴𝙿𝙾 + 𝙰𝙳𝙳 𝙵𝙸𝙻𝙴
│ /𝙳𝙴𝙻𝚁𝙴𝙿𝙾 -> 𝙷𝙰𝙿𝚄𝚂 𝚁𝙴𝙿𝙾
│ /𝙲𝙴𝙺𝚁𝙴𝙿𝙾 -> 𝙻𝙸𝚂𝚃 𝚁𝙴𝙿𝙾
│ /𝙰𝙳𝙳𝙵𝙸𝙻𝙴 -> 𝙼𝙴𝙽𝙰𝙼𝙱𝙰𝙷𝙺𝙰𝙽 𝙵𝙸𝙻𝙴 𝙺𝙴 𝚁𝙴𝙿𝙾
│ /𝙲𝙴𝙺𝙵𝙸𝙻𝙴 -> 𝙲𝙴𝙺 𝙸𝚂𝙸 𝚁𝙴𝙿𝙾
│ /𝙳𝙴𝙻𝙵𝙸𝙻𝙴 -> 𝙷𝙰𝙿𝚄𝚂 𝙵𝙸𝙻𝙴 𝙳𝙸 𝚁𝙴𝙿𝙾
│ /𝙶𝙸𝚃𝚁𝙰𝚆  -> 𝙲𝙾𝙽𝚅𝙴𝚁𝚃 𝙺𝙴 𝙶𝙸𝚃 𝚁𝙰𝚆
│ /𝙶𝙴𝚃𝚄𝚁𝙻 -> 𝙰𝙼𝙱𝙸𝙻 𝙻𝙸𝙽𝙺 𝚄𝚁𝙻 𝙶𝙸𝚃𝙷𝚄𝙱
┗─────────────────────┛
\`\`\`
`,
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([
        [Markup.button.callback("🔙 Back", "back_home")]
      ])
    }
  );
});

// Handler CPANEL BOT
bot.action("cpanel_bot", async (ctx) => {
  await ctx.deleteMessage();
  await ctx.replyWithPhoto(
    { url: "https://files.catbox.moe/f98nr8.jpg" },
    {
      caption: `
\`\`\`
☰ 🐉 𝗪𝗲𝗹𝗰𝗼𝗺𝗲 𝗧𝗼 𝗧𝗼𝗼𝗹𝘀 𝗠𝗲𝗻𝘂
──────────────────────────
┏─────────────────────┓
│ 𝗧𝗢𝗢𝗟𝗦 𝗠𝗘𝗡𝗨
┗─────────────────────┛
☰ 𝗙𝗜𝗧𝗨𝗥 𝗧𝗢𝗢𝗟𝗦 𝗠𝗘𝗡𝗨
┏─────────────────────┓
│ /𝙾𝙿𝙴𝙽 -> 𝙼𝙴𝙼𝙱𝚄𝙺𝙰 𝙸𝚂𝙸 𝙵𝙸𝙻𝙴
│ /𝙾𝙿𝙴𝙽𝚉𝙸𝙿 -> 𝙼𝙴𝙼𝙱𝚄𝙺𝙰 𝙸𝚂𝙸 𝚉𝙸𝙿
│ /𝙴𝙽𝙲𝚂𝙸𝚄 -> 𝙴𝙽𝙲 𝙶𝙰𝚈𝙰 𝙲𝙰𝙻𝙲𝚁𝙸𝙲𝙺
┗─────────────────────┛
\`\`\`
`,
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([
        [Markup.button.callback("🔙 Back", "back_home")]
      ])
    }
  );
});

// Handler Back ke sambutan awal
bot.action("back_home", async (ctx) => {
  await ctx.deleteMessage();
  const senderName = ctx.from.first_name || "User";
  const username = ctx.from.username || senderName;
  const waktuRunPanel = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });

  const caption = `
\`\`\`
☰ 🐉 -@${username} I am a multi-purpose telegram bot script that can be used by anyone, 
and my script developer is RannTzyBack2,
──────────────────────────
┏─────────────────────┓
│ 𝖣𝖾𝗏𝗈𝗅𝗈𝗉𝖾𝗋 : @RannTzyBack2
│ 𝖵𝖾𝗋𝗌𝗂𝗈𝗇 : 1.0 Vip
│ 𝖯𝗅𝖺𝗍𝖿𝗈𝗋𝗆 : 𝖳𝖾𝗅𝖾𝗀𝗋𝖺𝗆
│ 𝖫𝗂𝖻𝗋𝖺𝗋𝗒 : 𝖩𝖺𝗏𝖺𝖲𝖼𝗋𝗂𝗉𝗍
│ 𝖱𝗎𝗇𝗍𝗂𝗆𝖾 : ${waktuRunPanel}
┗─────────────────────┛
\`\`\`

☰ ᏢᎡᎬՏՏ ᏴႮͲͲϴΝ ᎷᎬΝႮ
`;

  await ctx.replyWithPhoto(
    { url: "https://files.catbox.moe/f98nr8.jpg" },
    {
      caption,
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([
        [Markup.button.callback("[ 𝗚𝗜𝗧𝗛𝗨𝗕 𝗠𝗘𝗡𝗨 ]", "menu_bot")],
        [Markup.button.callback("[ 𝗧𝗢𝗢𝗟𝗦 𝗠𝗘𝗡𝗨 ]", "cpanel_bot")]
      ])
    }
  );
});

// ================ FITUR KEAMANAN ================
// /keamanan on/off
bot.command("keamanan", async (ctx) => {
  if (!isOwner(ctx)) return ctx.reply("❌ Fitur ini hanya untuk owner!");
  const status = ctx.message.text.split(" ")[1];
  if (!status) return ctx.reply("❌ Contoh: /keamanan on atau /keamanan off");

  const keamanan = await fs.readJSON(KEAMANAN_FILE);

  if (status.toLowerCase() === "on") {
    keamanan.enabled = true;
    await fs.writeJSON(KEAMANAN_FILE, keamanan, { spaces: 2 });
    ctx.reply("✅ Mode keamanan *diaktifkan*", { parse_mode: "Markdown" });
  } else if (status.toLowerCase() === "off") {
    keamanan.enabled = false;
    await fs.writeJSON(KEAMANAN_FILE, keamanan, { spaces: 2 });
    ctx.reply("✅ Mode keamanan *dimatikan*", { parse_mode: "Markdown" });
  } else {
    ctx.reply("⚠️ Pilih hanya: /keamanan on atau /keamanan off");
  }
});

// Blokir user (callback query)
bot.action(/block_(\d+)/, async (ctx) => {
  if (!isOwner(ctx)) return ctx.answerCbQuery("❌ Hanya owner yang bisa!");

  const userId = ctx.match[1];
  const keamanan = await fs.readJSON(KEAMANAN_FILE);

  if (!keamanan.blocked.includes(userId)) {
    keamanan.blocked.push(userId);
    await fs.writeJSON(KEAMANAN_FILE, keamanan, { spaces: 2 });
  }

  await ctx.telegram.sendMessage(userId, "🚫 Anda telah diblokir oleh bot!");
  ctx.editMessageText(`✅ User ${userId} berhasil diblokir!`);
});

// Deteksi pesan hanya di private chat
bot.on("message", async (ctx, next) => {
  const keamanan = await fs.readJSON(KEAMANAN_FILE);
  if (!keamanan.enabled) return next();

  // Cek hanya untuk chat privat
  if (ctx.chat.type !== "private") return next();

  // Abaikan jika pengirim adalah owner
  if (isOwner(ctx)) return next();

  // Abaikan jika sudah diblokir
  if (keamanan.blocked.includes(String(ctx.from.id))) return;

  const nama = ctx.from.first_name || "-";
  const id = ctx.from.id;
  const username = ctx.from.username ? `@${ctx.from.username}` : "-";
  const pesan = ctx.message.text || ctx.message.caption || "[non-text message]";

  const text = `🚨 *WARNING (PRIVATE)* 🚨\n👤 *NAMA* : ${nama}\n🆔 *ID* : ${id}\n👤 *USER* : ${username}\n💬 *PESAN* : ${pesan}`;

  for (const ownerId of config.ownerIds) {
    await ctx.telegram.sendMessage(ownerId, text, {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([
        [Markup.button.callback("🚫 BLOKIR", `block_${id}`)],
      ]),
    });
  }

  return next();
});

// ================== NOTIFIKASI GITHUB ==================
// /notif on/off
bot.command("notif", async (ctx) => {
  if (!isOwner(ctx)) return ctx.reply("❌ Fitur ini hanya untuk owner!");
  const status = ctx.message.text.split(" ")[1];
  if (!status) return ctx.reply("❌ Contoh: /notif on atau /notif off");

  const notif = await fs.readJSON(NOTIF_FILE);

  if (status.toLowerCase() === "on") {
    notif.enabled = true;
    await fs.writeJSON(NOTIF_FILE, notif, { spaces: 2 });
    ctx.reply("✅ Notifikasi GitHub *diaktifkan*", { parse_mode: "Markdown" });
  } else if (status.toLowerCase() === "off") {
    notif.enabled = false;
    await fs.writeJSON(NOTIF_FILE, notif, { spaces: 2 });
    ctx.reply("✅ Notifikasi GitHub *dimatikan*", { parse_mode: "Markdown" });
  } else {
    ctx.reply("⚠️ Pilih hanya: /notif on atau /notif off");
  }
});

// ================== CEK EVENT GITHUB ==================
async function checkGithubEvents() {
  const notif = await fs.readJSON(NOTIF_FILE);
  if (!notif.enabled) return;

  const logins = await fs.readJSON(LOGIN_FILE);
  if (!logins.github.length) return;

  const akun = logins.github[0];

  try {
    const { data } = await axios.get("https://api.github.com/events", {
      headers: { Authorization: `token ${akun.token}` },
    });

    if (Array.isArray(data) && data.length > 0) {
      const lastEvent = data[0];
      if (notif.lastId !== lastEvent.id) {
        for (const id of config.ownerIds) {
          await bot.telegram.sendMessage(
            id,
            `🔔 *GitHub Notifikasi Baru:*\n\n👤 User: ${lastEvent.actor.login}\n📦 Repo: ${lastEvent.repo.name}\n⚡ Event: ${lastEvent.type}\n⏰ Waktu: ${lastEvent.created_at}`,
            { parse_mode: "Markdown" }
          );
        }
        notif.lastId = lastEvent.id;
        await fs.writeJSON(NOTIF_FILE, notif, { spaces: 2 });
      }
    }
  } catch (err) {
    console.error("❌ Gagal cek event GitHub:", err.message);
  }
}
setInterval(checkGithubEvents, 60 * 1000);

// ================= LOGIN GITHUB ===================
// /login <token>
bot.command("login", async (ctx) => {
  if (!isOwner(ctx)) return ctx.reply("❌ Fitur ini hanya untuk owner!");
  const token = ctx.message.text.split(" ")[1];
  if (!token) return ctx.reply("❌ Contoh: /login <token_github>");

  try {
    const { data } = await axios.get("https://api.github.com/user", {
      headers: { Authorization: `token ${token}` },
    });

    const logins = await fs.readJSON(LOGIN_FILE);
    const exists = logins.github.find((u) => u.login === data.login);
    if (exists) return ctx.reply(`⚠️ Akun ${data.login} sudah login!`);

    logins.github.push({ login: data.login, token });
    await fs.writeJSON(LOGIN_FILE, logins, { spaces: 2 });

    ctx.reply(`✅ Berhasil login ke akun GitHub: *${data.login}*`, {
      parse_mode: "Markdown",
    });
  } catch {
    ctx.reply("❌ Token tidak valid atau gagal terhubung ke GitHub!");
  }
});

// /listlogin
bot.command("listlogin", async (ctx) => {
  if (!isOwner(ctx)) return ctx.reply("❌ Fitur ini hanya untuk owner!");
  const logins = await fs.readJSON(LOGIN_FILE);
  if (!logins.github.length) return ctx.reply("📭 Belum ada akun login!");
  let text = "📋 *Daftar Akun Login GitHub:*\n\n";
  logins.github.forEach((a, i) => (text += `${i + 1}. ${a.login}\n`));
  ctx.reply(text, { parse_mode: "Markdown" });
});

// /dellogin <username>
bot.command("dellogin", async (ctx) => {
  if (!isOwner(ctx)) return ctx.reply("❌ Fitur ini hanya untuk owner!");
  const username = ctx.message.text.split(" ")[1];
  if (!username) return ctx.reply("❌ Contoh: /dellogin <username>");

  const logins = await fs.readJSON(LOGIN_FILE);
  const newList = logins.github.filter((u) => u.login !== username);

  if (newList.length === logins.github.length)
    return ctx.reply("⚠️ Akun tidak ditemukan!");

  await fs.writeJSON(LOGIN_FILE, { github: newList }, { spaces: 2 });
  ctx.reply(`✅ Akun ${username} berhasil dihapus.`);
});


// /cekrepo
bot.command("cekrepo", async (ctx) => {
  if (!isOwner(ctx)) return ctx.reply("❌ Fitur ini hanya untuk owner!");
  const logins = await fs.readJSON(LOGIN_FILE);
  if (!logins.github.length)
    return ctx.reply("❌ Tidak ada akun login. Gunakan /login dulu.");

  const akun = logins.github[0];
  try {
    const { data } = await axios.get("https://api.github.com/user/repos", {
      headers: { Authorization: `token ${akun.token}` },
    });
    if (!data.length) return ctx.reply("📂 Tidak ada repository ditemukan.");

    let text = `📦 *Daftar Repository (${akun.login}):*\n\n`;
    data.forEach((r, i) => (text += `${i + 1}. ${r.name}\n`));
    ctx.reply(text, { parse_mode: "Markdown" });
  } catch {
    ctx.reply("❌ Gagal mengambil daftar repository.");
  }
});

// /delrepo <nama_repo>
bot.command("delrepo", async (ctx) => {
  if (!isOwner(ctx)) return ctx.reply("❌ Fitur ini hanya untuk owner!");
  const repoName = ctx.message.text.split(" ")[1];
  if (!repoName) return ctx.reply("❌ Contoh: /delrepo <nama_repo>");

  const logins = await fs.readJSON(LOGIN_FILE);
  if (!logins.github.length) return ctx.reply("❌ Tidak ada akun login.");

  const akun = logins.github[0];
  try {
    await axios.delete(`https://api.github.com/repos/${akun.login}/${repoName}`, {
      headers: { Authorization: `token ${akun.token}` },
    });
    ctx.reply(`🗑️ Repository *${repoName}* berhasil dihapus.`, {
      parse_mode: "Markdown",
    });
  } catch {
    ctx.reply("❌ Gagal menghapus repository. Pastikan nama benar.");
  }
});

// /addrepo (reply file + nama_repo)
bot.command("addrepo", async (ctx) => {
  if (!isOwner(ctx)) return ctx.reply("❌ Fitur ini hanya untuk owner!");

  const repoName = ctx.message.text.split(" ")[1];
  if (!repoName)
    return ctx.reply("❌ Balas file dengan perintah: /addrepo <nama_repo>");

  const reply = ctx.message.reply_to_message;
  if (!reply || !reply.document)
    return ctx.reply("❌ Balas file .js atau .json dengan perintah ini!");

  const logins = await fs.readJSON(LOGIN_FILE);
  if (!logins.github.length) return ctx.reply("❌ Tidak ada akun login.");

  const akun = logins.github[0];
  const file = reply.document;

  try {
    const fileLink = await ctx.telegram.getFileLink(file.file_id);
    const fileResponse = await axios.get(fileLink.href);
    const fileContent = fileResponse.data;

    await axios.post(
      "https://api.github.com/user/repos",
      { name: repoName, auto_init: true },
      { headers: { Authorization: `token ${akun.token}` } }
    );

    await axios.put(
      `https://api.github.com/repos/${akun.login}/${repoName}/contents/${file.file_name}`,
      {
        message: `Add ${file.file_name}`,
        content: Buffer.from(
          typeof fileContent === "object"
            ? JSON.stringify(fileContent, null, 2)
            : String(fileContent)
        ).toString("base64"),
      },
      { headers: { Authorization: `token ${akun.token}` } }
    );

    ctx.reply(`✅ Repository *${repoName}* berhasil dibuat & file diunggah.`, {
      parse_mode: "Markdown",
    });
  } catch (err) {
    ctx.reply("❌ Gagal membuat repository atau mengunggah file.");
  }
});

// /geturl <nama_repo>
bot.command("geturl", async (ctx) => {
  if (!isOwner(ctx)) return ctx.reply("❌ Fitur ini hanya untuk owner!");
  const repoName = ctx.message.text.split(" ")[1];
  if (!repoName)
    return ctx.reply("❌ Contoh: /geturl <nama_repo>");

  const logins = await fs.readJSON(LOGIN_FILE);
  if (logins.github.length === 0)
    return ctx.reply("❌ Tidak ada akun login.");

  const akun = logins.github[0];
  try {
    // Ambil daftar file di repository
    const { data } = await axios.get(
      `https://api.github.com/repos/${akun.login}/${repoName}/contents`,
      { headers: { Authorization: `token ${akun.token}` } }
    );

    if (!Array.isArray(data) || data.length === 0)
      return ctx.reply("📂 Repository kosong atau tidak ditemukan.");

    let text = `🌐 *Daftar File URL Repository ${repoName}:*\n\n`;
    data.forEach((file, i) => {
      text += `${i + 1}. [${file.name}](https://github.com/${akun.login}/${repoName}/blob/main/${file.name})\n`;
    });

    ctx.reply(text, { parse_mode: "Markdown" });
  } catch (err) {
    ctx.reply("❌ Gagal mengambil URL repository. Pastikan nama repo benar.");
  }
});

// /gitraw <url_github>
bot.command("gitraw", async (ctx) => {
  if (!isOwner(ctx)) return ctx.reply("❌ Fitur ini hanya untuk owner!");

  const url = ctx.message.text.split(" ")[1];
  if (!url)
    return ctx.reply("❌ Contoh: /gitraw <url_github>\n\nMisal:\n/gitraw https://github.com/kepog62/DbDewaInvictus/blob/main/tokens.json");

  try {
    // Pola URL GitHub umum
    const githubPattern = /https:\/\/github\.com\/([^\/]+)\/([^\/]+)\/blob\/(.+)/;
    const match = url.match(githubPattern);

    if (!match)
      return ctx.reply("⚠️ URL tidak valid. Pastikan formatnya seperti:\nhttps://github.com/username/repo/blob/main/file.json");

    const username = match[1];
    const repo = match[2];
    const filePath = match[3];

    // Buat URL RAW
    const rawUrl = `https://raw.githubusercontent.com/${username}/${repo}/${filePath}`;

    // Alternatif: URL via git-rawify
    const rawifyUrl = `https://git-rawify.vercel.app/api/raw?url=${encodeURIComponent(url)}`;

    let text = `✅ *URL RAW Berhasil Dikonversi!*\n\n🔗 **RAW GitHub:**\n${rawUrl}\n\n🌐 **Alternatif Git-Rawify:**\n${rawifyUrl}`;
    ctx.reply(text, { parse_mode: "Markdown" });
  } catch (err) {
    ctx.reply("❌ Gagal mengonversi URL. Pastikan link GitHub benar dan bisa diakses.");
  }
});

// ================ FITUR ADD FILE GITHUB ================
bot.command("addfile", async (ctx) => {
  if (!isOwner(ctx)) return ctx.reply("❌ Fitur ini hanya untuk owner!");

  const args = ctx.message.text.split(" ").slice(1);
  if (args.length < 1) {
    return ctx.reply("❌ Contoh: Reply file dengan /addfile <nama-repo>");
  }

  const repo = args[0];
  const reply = ctx.message.reply_to_message;

  if (!reply || !reply.document) {
    return ctx.reply("❌ Harus reply file yang ingin ditambahkan!");
  }

  const file = reply.document;
  const fileId = file.file_id;
  const fileName = file.file_name;

  try {
    // ambil akun login github dari logins.json
    const logins = await fs.readJSON(LOGIN_FILE);
    if (!logins.github.length) {
      return ctx.reply("❌ Belum ada akun login! Gunakan /login <token>");
    }
    const akun = logins.github[0]; // pakai akun pertama

    // ambil link file dari Telegram
    const fileLink = await ctx.telegram.getFileLink(fileId);

    // download file
    const response = await axios.get(fileLink, { responseType: "arraybuffer" });
    const contentBase64 = Buffer.from(response.data).toString("base64");

    // upload ke github
    await axios.put(
      `https://api.github.com/repos/${akun.login}/${repo}/contents/${fileName}`,
      {
        message: `Add file ${fileName} via bot`,
        content: contentBase64,
      },
      {
        headers: { Authorization: `token ${akun.token}` },
      }
    );

    ctx.reply(
      `✅ File *${fileName}* berhasil ditambahkan ke repo *${repo}*!`,
      { parse_mode: "Markdown" }
    );
  } catch (err) {
    console.error("❌ Error addfile:", err.response?.data || err.message);
    ctx.reply("❌ Gagal menambahkan file ke repo. Pastikan repo ada & token punya akses.");
  }
});

// ================ FITUR DELETE FILE GITHUB ================
bot.command("delfile", async (ctx) => {
  if (!isOwner(ctx)) return ctx.reply("❌ Fitur ini hanya untuk owner!");

  const args = ctx.message.text.split(" ").slice(1);
  if (args.length < 2) {
    return ctx.reply("❌ Contoh: /delfile <nama-repo> <nama-file>");
  }

  const [repo, fileName] = args;

  try {
    // ambil akun login github dari logins.json
    const logins = await fs.readJSON(LOGIN_FILE);
    if (!logins.github.length) {
      return ctx.reply("❌ Belum ada akun login! Gunakan /login <token>");
    }
    const akun = logins.github[0]; // pakai akun pertama

    // cek file dulu untuk dapatkan SHA
    const { data: fileData } = await axios.get(
      `https://api.github.com/repos/${akun.login}/${repo}/contents/${fileName}`,
      {
        headers: { Authorization: `token ${akun.token}` },
      }
    );

    if (!fileData || !fileData.sha) {
      return ctx.reply("❌ File tidak ditemukan di repo!");
    }

    // hapus file
    await axios.delete(
      `https://api.github.com/repos/${akun.login}/${repo}/contents/${fileName}`,
      {
        headers: { Authorization: `token ${akun.token}` },
        data: {
          message: `Delete file ${fileName} via bot`,
          sha: fileData.sha,
        },
      }
    );

    ctx.reply(
      `✅ File *${fileName}* berhasil dihapus dari repo *${repo}*!`,
      { parse_mode: "Markdown" }
    );
  } catch (err) {
    console.error("❌ Error delfile:", err.response?.data || err.message);
    ctx.reply("❌ Gagal menghapus file dari repo. Pastikan nama repo & file benar.");
  }
});

// ================ FITUR CEK FILE GITHUB ================
bot.command("cekfile", async (ctx) => {
  if (!isOwner(ctx)) return ctx.reply("❌ Fitur ini hanya untuk owner!");

  const args = ctx.message.text.split(" ").slice(1);
  if (args.length < 1) {
    return ctx.reply("❌ Contoh: /cekfile <nama-repo>");
  }

  const repo = args[0];

  try {
    // ambil akun login github dari logins.json
    const logins = await fs.readJSON(LOGIN_FILE);
    if (!logins.github.length) {
      return ctx.reply("❌ Belum ada akun login! Gunakan /login <token>");
    }
    const akun = logins.github[0]; // pakai akun pertama

    // ambil daftar file dari repo
    const { data } = await axios.get(
      `https://api.github.com/repos/${akun.login}/${repo}/contents/`,
      {
        headers: { Authorization: `token ${akun.token}` },
      }
    );

    if (!Array.isArray(data) || !data.length) {
      return ctx.reply("📭 Repo kosong atau tidak ada file.");
    }

    let text = `📂 *Daftar File di Repo ${repo}:*\n\n`;
    data.forEach((item, i) => {
      const icon = item.type === "dir" ? "📁" : "📄";
      text += `${i + 1}. ${icon} ${item.name}\n`;
    });

    // batasi biar tidak spam chat
    if (text.length > 4000) {
      text = text.slice(0, 4000) + "\n... (terpotong, terlalu banyak file)";
    }

    ctx.reply(text, { parse_mode: "Markdown" });
  } catch (err) {
    console.error("❌ Error cekfile:", err.response?.data || err.message);
    ctx.reply("❌ Gagal mengambil daftar file. Pastikan repo ada & token punya akses.");
  }
});

// ================ FITUR BACKUP PROJECT ================
bot.command("backup", async (ctx) => {
  if (!isOwner(ctx)) return ctx.reply("❌ Hanya owner yang bisa menggunakan fitur ini.");

  const zipName = "SC_GITHUB_RANN.zip";

  try {
    ctx.reply("📦 Sedang membuat backup project... tunggu sebentar.");

    const output = fs.createWriteStream(zipName);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", async () => {
      try {
        await ctx.replyWithDocument({ source: zipName, filename: zipName });
        fs.unlinkSync(zipName); // hapus file zip setelah dikirim
      } catch (err) {
        console.error("❌ Gagal kirim backup:", err.message);
      }
    });

    archive.on("error", (err) => {
      console.error("❌ Error archive:", err.message);
      ctx.reply("❌ Gagal membuat backup: " + err.message);
    });

    archive.pipe(output);

    // backup semua file kecuali node_modules & file zip hasil backup
    archive.glob("**/*", {
      ignore: ["node_modules/**", zipName]
    });

    await archive.finalize();
  } catch (e) {
    console.error("❌ Error backup:", e.message);
    ctx.reply("❌ Gagal membuat backup: " + e.message);
  }
});

// ================ FITUR OPEN FILE ================
bot.command("open", async (ctx) => {
  const reply = ctx.message.reply_to_message;

  if (!reply || !reply.document) {
    return ctx.reply("❗ Reply ke file yang mau dibuka dengan perintah /open");
  }

  const file = reply.document;
  const fileId = file.file_id;
  const fileName = file.file_name || "file.txt";
  const ext = path.extname(fileName).toLowerCase();

  const allowedExt = [".js", ".json", ".txt", ".md", ".html", ".css", ".ts"];
  if (!allowedExt.includes(ext)) {
    return ctx.reply(`❌ File tidak didukung untuk dibuka (ekstensi: ${ext})`);
  }

  try {
    const fileLink = await ctx.telegram.getFileLink(fileId);

    // download file
    const res = await axios.get(fileLink, { responseType: "text" });
    const content = res.data.toString();

    // potong kalau terlalu panjang
    const MAX_LENGTH = 4000;
    const safeContent =
      content.length > MAX_LENGTH
        ? content.slice(0, MAX_LENGTH) + "\n\n... (dipotong, terlalu panjang)"
        : content;

    await ctx.reply(
      `<b>📂 Isi file: ${fileName}</b>\n\n<pre><code>${escapeHTML(safeContent)}</code></pre>`,
      { parse_mode: "HTML" }
    );
  } catch (err) {
    console.error("[OPEN FILE ERROR]", err.message);
    ctx.reply("❌ Gagal membaca file.");
  }
});

function escapeHTML(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

bot.command("done", async (ctx) => {
  const userId = String(ctx.from.id);

  // cek hanya owner yang bisa pakai
  if (!config.ownerIds.includes(userId)) {
    return ctx.reply("❌ Fitur ini hanya bisa digunakan oleh owner bot.");
  }

  const text = ctx.message.text.split(" ").slice(1).join(" ");
  const parts = text.split(",");
  if (parts.length < 3) {
    return ctx.reply("❌ Format salah!\nContoh: /done PT VIP,1.000,DANA");
  }

  const barang = parts[0].trim();
  const price = parts[1].trim();
  const pay = parts[2].trim();
  const waktu = moment().tz("Asia/Jakarta").format("YYYY-MM-DD HH:mm:ss");

  const caption = 
`\`\`\`
TRANSAKSI DONE ✅
━━━━━━━━━━━━━━
📦 BARANG   : ${barang}
🔖 PRICE    : Rp${price}
🏦 PAYMENT  : ${pay}
📅 DATE     : ${waktu}

𝗧𝗘𝗥𝗜𝗠𝗔 𝗞𝗔𝗦𝗜𝗛 𝗧𝗘𝗟𝗔𝗛 𝗠𝗘𝗠𝗣𝗘𝗥𝗖𝗔𝗬𝗔𝗜 𝗧𝗭𝗬 | 𝗥𝗮𝗻𝗻 ★𝗩𝟮 𝗦𝗘𝗠𝗢𝗚𝗔 𝗝𝗔𝗗𝗜 𝗕𝗨𝗬𝗔𝗥 𝗟𝗔𝗡𝗚𝗚𝗔𝗡𝗔𝗡 ⚡
\`\`\``;

  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [{ text: "[ 𝗢𝗪𝗡𝗘𝗥 ]", url: "https://t.me/RannTzyBack2" }]
      ]
    }
  };

  try {
    if (ctx.message.reply_to_message && ctx.message.reply_to_message.photo) {
      // Ambil foto yang direply
      const photo = ctx.message.reply_to_message.photo.pop();
      await ctx.telegram.sendPhoto(ctx.chat.id, photo.file_id, {
        caption,
        parse_mode: "Markdown",
        ...keyboard
      });
    } else {
      // Kirim text biasa
      await ctx.reply(caption, { parse_mode: "Markdown", ...keyboard });
    }
  } catch (err) {
    console.error("❌ Error /done:", err.message || err);
    ctx.reply("❌ Gagal mengirim transaksi DONE.");
  }
});

// ================ FITUR OPEN ZIP (BACA ISI + KIRIM FILE + AUTO HAPUS) ================
bot.command("openzip", async (ctx) => {
  const reply = ctx.message.reply_to_message;
  if (!reply || !reply.document) {
    return ctx.reply("❌ Reply ke file .zip dengan perintah /openzip");
  }

  const file = reply.document;
  const fileId = file.file_id;
  const fileName = file.file_name || "archive.zip";

  if (!fileName.endsWith(".zip")) {
    return ctx.reply("❌ File bukan zip!");
  }

  const tempDir = path.join(__dirname, "temp_unzip");
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

  try {
    await ctx.reply("📦 Membaca isi file zip...");

    // ambil file dari Telegram
    const link = await ctx.telegram.getFileLink(fileId);
    const response = await fetch(link.href);
    const buffer = Buffer.from(await response.arrayBuffer());

    // simpan file zip sementara
    const zipPath = path.join(tempDir, fileName);
    await fs.writeFile(zipPath, buffer);

    // buka ZIP
    const directory = await unzipper.Open.file(zipPath);
    let listText = `📂 <b>Isi file ${fileName}:</b>\n\n`;

    // tampilkan daftar isi zip
    for (const entry of directory.files) {
      listText += `📄 ${entry.path}\n`;
    }

    await ctx.replyWithHTML(listText);

    // kirim semua file satu per satu
    await ctx.reply("📤 Mengirim semua isi zip ke Telegram...");
    let totalFiles = 0;

    for (const entry of directory.files) {
      if (entry.isDirectory) continue;

      const outputPath = path.join(tempDir, entry.path);
      const dirPath = path.dirname(outputPath);
      if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });

      const content = await entry.buffer();
      await fs.writeFile(outputPath, content);

      await ctx.replyWithDocument({
        source: outputPath,
        filename: entry.path,
      });

      totalFiles++;
    }

    // hapus semua setelah selesai
    fs.rmSync(tempDir, { recursive: true, force: true });

    await ctx.reply(`✅ Selesai! ${totalFiles} file berhasil dikirim dan semua file sementara dihapus dari panel.`);
  } catch (err) {
    console.error("❌ Error openzip:", err.message || err);
    ctx.reply("❌ Gagal membaca atau mengekstrak file zip.");

    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {}
  }
});

// helper untuk escape HTML
function escapeHTML(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// ================ PROGRESS BAR ================
function createProgressBar(percent) {
  const totalBlocks = 20;
  const filled = Math.round((percent / 100) * totalBlocks);
  const empty = totalBlocks - filled;
  return "█".repeat(filled) + "░".repeat(empty);
}

async function updateProgress(ctx, message, percent, stage) {
  const text =
    "```css\n" +
    "🔒 EncryptBot\n" +
    ` ⚙️ ${stage} (${percent}%)\n` +
    ` ${createProgressBar(percent)}\n` +
    "```\n" +
    "PROSES ENCRYPT ";
  try {
    await ctx.telegram.editMessageText(
      message.chat.id,
      message.message_id,
      undefined,
      text,
      { parse_mode: "Markdown" }
    );
  } catch (e) {
    console.log("Update error:", e.message);
  }
}

// ================ CONFIG SIU CALCRICK ================
function getSiuCalcrickObfuscationConfig() {
  const generateSiuName = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let name = "";
    for (let i = 0; i < 6; i++) {
      name += chars[Math.floor(Math.random() * chars.length)];
    }
    return `CalceKarik和SiuSiu无与伦比的帅气${name}`;
  };

  return {
    target: "node",
    compact: true,
    renameVariables: true,
    renameGlobals: true,
    identifierGenerator: generateSiuName,
    stringCompression: true,
    stringEncoding: true,
    stringSplitting: true,
    controlFlowFlattening: 0.95,
    shuffle: true,
    flatten: true,
    duplicateLiteralsRemoval: true,
    deadCode: true,
    calculator: true,
    opaquePredicates: true,
    lock: {
      selfDefending: true,
      antiDebug: true,
      integrity: true,
      tamperProtection: true,
    },
  };
}

// ================ COMMAND /encsiu ================
bot.command("encsiu", async (ctx) => {
  if (!ctx.message.reply_to_message || !ctx.message.reply_to_message.document) {
    return ctx.reply("❌ Balas file .js dengan perintah /encsiu");
  }

  const file = ctx.message.reply_to_message.document;
  if (!file.file_name.endsWith(".js")) {
    return ctx.reply("❌ Hanya mendukung file .js!");
  }

  const encryptedPath = path.join(__dirname, `siucalcrick-${file.file_name}`);

  try {
    const progressMessage = await ctx.replyWithMarkdown(
      "```css\n" +
        "🔒 EncryptBot\n" +
        " ⚙️ Memulai (Calcrick Chaos Core) (1%)\n" +
        ` ${createProgressBar(1)}\n` +
        "```\n" +
        "PROSES ENCRYPT "
    );

    const fileLink = await ctx.telegram.getFileLink(file.file_id);
    await updateProgress(ctx, progressMessage, 10, "Mengunduh");
    const response = await fetch(fileLink.href);
    const fileContent = await response.text();
    await updateProgress(ctx, progressMessage, 20, "Mengunduh Selesai");

    await updateProgress(ctx, progressMessage, 30, "Validasi Kode Awal");
    new Function(fileContent);

    await updateProgress(ctx, progressMessage, 40, "Inisialisasi Chaos Core");
    let obfuscatedCode = await JsConfuser.obfuscate(
  fileContent,
  getSiuCalcrickObfuscationConfig()
);

// Kalau hasilnya object, ambil .code
if (typeof obfuscatedCode === "object" && obfuscatedCode.code) {
  obfuscatedCode = obfuscatedCode.code;
}

if (typeof obfuscatedCode !== "string") {
  throw new Error("Hasil obfuscation bukan string");
}

    new Function(obfuscatedCode); // Validasi akhir

    await updateProgress(ctx, progressMessage, 80, "Finalisasi Enkripsi");
    await fs.writeFile(encryptedPath, obfuscatedCode);

    await ctx.replyWithDocument(
      {
        source: encryptedPath,
        filename: `siucalcrick-${file.file_name}`,
      },
      {
        caption:
          "✅ *File terenkripsi (Calcrick Chaos Core) siap!*\nSUKSES ENCRYPT 🕊",
        parse_mode: "Markdown",
      }
    );

    await updateProgress(ctx, progressMessage, 100, "Selesai!");
    await fs.unlink(encryptedPath);
  } catch (err) {
    await ctx.reply(`❌ Gagal: ${err.message}`);
    try {
      await fs.unlink(encryptedPath);
    } catch {}
  }
});

// =============== FITUR /tourl ===============
bot.command("tourl", async (ctx) => {
  const reply = ctx.message.reply_to_message;

  if (!reply) {
    return ctx.reply("⚠️ Harus reply foto, video, atau dokumen!");
  }

  try {
    let fileId, filename;

    if (reply.photo) {
      fileId = reply.photo[reply.photo.length - 1].file_id;
      filename = "file.jpg";
    } else if (reply.video) {
      fileId = reply.video.file_id;
      filename = "file.mp4";
    } else if (reply.document) {
      fileId = reply.document.file_id;
      filename = reply.document.file_name || "file.bin";
    } else {
      return ctx.reply("❌ Harus reply foto, video, atau dokumen!");
    }

    // ambil link file dari Telegram
    const fileLink = await ctx.telegram.getFileLink(fileId);
    const fileUrl = fileLink.href;

    // unduh file
    const res = await axios.get(fileUrl, { responseType: "arraybuffer" });
    const buffer = Buffer.from(res.data);

    // upload ke Catbox
    const form = new FormData();
    form.append("reqtype", "fileupload");
    form.append("fileToUpload", buffer, { filename });

    const { data } = await axios.post("https://catbox.moe/user/api.php", form, {
      headers: form.getHeaders(),
      maxBodyLength: Infinity,
    });

    if (typeof data === "string" && data.startsWith("https://")) {
      await ctx.replyWithHTML(
        `<blockquote>🔗 URL Berhasil Diupload:</blockquote>\n<code>${data}</code>`
      );
    } else {
      throw new Error("Upload gagal, respons Catbox tidak valid.");
    }
  } catch (err) {
    console.error("Tourl Error:", err.message);
    await ctx.replyWithHTML(
      `<blockquote>❌ Gagal upload media.\nAlasan: ${err.message}</blockquote>`
    );
  }
});

// /addch <id_channel>
bot.command("addch", async (ctx) => {
  if (!isOwner(ctx)) return ctx.reply("❌ Fitur ini hanya untuk owner!");

  const args = ctx.message.text.split(" ").slice(1);
  if (args.length < 1) {
    return ctx.reply("⚠️ Contoh penggunaan: /addch -1001234567890");
  }

  const chId = args[0].trim();
  if (!/^(-100)\d+$/.test(chId)) {
    return ctx.reply("❌ ID channel tidak valid! Harus format seperti: -100xxxxxxxxxx");
  }

  const data = await fs.readJSON(CHANNEL_FILE);
  if (data.channels.includes(chId)) {
    return ctx.reply("⚠️ Channel sudah terdaftar sebelumnya.");
  }

  data.channels.push(chId);
  await fs.writeJSON(CHANNEL_FILE, data, { spaces: 2 });
  ctx.reply(`✅ Channel ${chId} berhasil ditambahkan ke database.`);
});

// /listch
bot.command("listch", async (ctx) => {
  if (!isOwner(ctx)) return ctx.reply("❌ Fitur ini hanya untuk owner!");

  const data = await fs.readJSON(CHANNEL_FILE);
  if (!data.channels.length) {
    return ctx.reply("📭 Belum ada channel yang tersimpan.");
  }

  let text = "📋 *Daftar Channel yang Tersimpan:*\n\n";
  const inlineKeyboard = [];

  data.channels.forEach((id, i) => {
    text += `${i + 1}. \`${id}\`\n`;
    inlineKeyboard.push([{ text: `🗑️ Hapus ${i + 1}`, callback_data: `delch_${id}` }]);
  });

  await ctx.replyWithMarkdown(text, {
    reply_markup: { inline_keyboard: inlineKeyboard }
  });
});

// Handler tombol hapus channel
bot.action(/delch_(.+)/, async (ctx) => {
  if (!isOwner(ctx)) return ctx.answerCbQuery("❌ Hanya owner yang bisa!");
  const chId = ctx.match[1];

  const data = await fs.readJSON(CHANNEL_FILE);
  if (!data.channels.includes(chId)) {
    return ctx.answerCbQuery("⚠️ Channel tidak ditemukan!");
  }

  const newList = data.channels.filter((id) => id !== chId);
  await fs.writeJSON(CHANNEL_FILE, { channels: newList }, { spaces: 2 });

  await ctx.answerCbQuery("✅ Channel berhasil dihapus!");
  await ctx.editMessageText(`🗑️ Channel ${chId} sudah dihapus dari database.`);
});

// /delch <id_channel> (manual tanpa tombol)
bot.command("delch", async (ctx) => {
  if (!isOwner(ctx)) return ctx.reply("❌ Fitur ini hanya untuk owner!");

  const args = ctx.message.text.split(" ").slice(1);
  if (args.length < 1) {
    return ctx.reply("⚠️ Contoh penggunaan: /delch -1001234567890");
  }

  const chId = args[0].trim();
  const data = await fs.readJSON(CHANNEL_FILE);

  if (!data.channels.includes(chId)) {
    return ctx.reply("⚠️ Channel tidak ditemukan di database.");
  }

  const newList = data.channels.filter((id) => id !== chId);
  await fs.writeJSON(CHANNEL_FILE, { channels: newList }, { spaces: 2 });

  ctx.reply(`✅ Channel ${chId} berhasil dihapus dari database.`);
});

// /sharech (reply pesan)
bot.command("sharech", async (ctx) => {
  if (!isOwner(ctx)) return ctx.reply("❌ Fitur ini hanya untuk owner!");

  const replyMsg = ctx.message.reply_to_message;
  if (!replyMsg) {
    return ctx.reply("⚠️ Harus reply ke pesan yang ingin dikirim ke semua channel!");
  }

  const data = await fs.readJSON(CHANNEL_FILE);
  if (!data.channels.length) {
    return ctx.reply("📭 Belum ada channel yang disimpan. Gunakan /addch dulu.");
  }

  ctx.reply(`📤 Meneruskan pesan ke ${data.channels.length} channel...`);

  let sukses = 0, gagal = 0;

  for (const chId of data.channels) {
    try {
      // forward pesan langsung, bukan copy
      await ctx.telegram.forwardMessage(chId, ctx.chat.id, replyMsg.message_id);
      sukses++;
    } catch (err) {
      console.error(`Gagal forward ke ${chId}:`, err.message);
      gagal++;
    }
  }

  ctx.reply(`✅ Forward selesai!\n\n📨 Berhasil: ${sukses}\n❌ Gagal: ${gagal}`);
});

// ================== FITUR /setgph ==================
bot.command("setgph", async (ctx) => {
  if (!config.ownerIds.includes(String(ctx.from.id))) return ctx.reply("❌ Hanya owner yang bisa!");

  const args = ctx.message.text.split(" ").slice(1);
  if (!args.length) return ctx.reply("⚠️ Contoh: /setgph ghp_xxxxxxx");

  const token = args[0].trim();
  if (!token.startsWith("ghp_")) return ctx.reply("❌ Token GitHub tidak valid!");

  await fs.writeJSON(GPH_FILE, { token }, { spaces: 2 });
  ctx.reply("✅ GitHub PAT berhasil disimpan!");
});

// ================== FITUR RESELLER ==================
bot.command("addres", async (ctx) => {
  if (!config.ownerIds.includes(String(ctx.from.id))) return ctx.reply("❌ Hanya owner!");

  const args = ctx.message.text.split(" ").slice(1);
  if (!args.length) return ctx.reply("⚠️ Contoh: /addres 123456789");
  const newId = parseInt(args[0]);
  if (isNaN(newId)) return ctx.reply("❌ ID harus berupa angka!");

  const data = await fs.readJSON(RESELLER_FILE);
  if (data.resellers.includes(newId)) return ctx.reply("⚠️ Reseller sudah ada!");

  data.resellers.push(newId);
  await fs.writeJSON(RESELLER_FILE, data, { spaces: 2 });
  ctx.reply(`✅ Reseller ${newId} berhasil ditambahkan!`);
});

bot.command("delres", async (ctx) => {
  if (!config.ownerIds.includes(String(ctx.from.id))) return ctx.reply("❌ Hanya owner!");

  const args = ctx.message.text.split(" ").slice(1);
  if (!args.length) return ctx.reply("⚠️ Contoh: /delres 123456789");
  const targetId = parseInt(args[0]);
  if (isNaN(targetId)) return ctx.reply("❌ ID harus berupa angka!");

  const data = await fs.readJSON(RESELLER_FILE);
  if (!data.resellers.includes(targetId)) return ctx.reply("⚠️ Reseller tidak ditemukan!");

  data.resellers = data.resellers.filter((id) => id !== targetId);
  await fs.writeJSON(RESELLER_FILE, data, { spaces: 2 });
  ctx.reply(`✅ Reseller ${targetId} berhasil dihapus!`);
});

bot.command("listres", async (ctx) => {
  if (!config.ownerIds.includes(String(ctx.from.id))) return ctx.reply("❌ Hanya owner!");

  const data = await fs.readJSON(RESELLER_FILE);
  const list = data.resellers;
  if (!list.length) return ctx.reply("📭 Tidak ada reseller terdaftar.");

  let text = "👥 *Daftar Reseller:*\n\n";
  list.forEach((id, i) => (text += `${i + 1}. \`${id}\`\n`));
  ctx.replyWithMarkdown(text);
});

// ================== FITUR TOKEN ==================
bot.command("addtoken", async (ctx) => {
  if (!hasAccess(ctx.from.id)) return ctx.reply("❌ Anda tidak memiliki akses!");

  const args = ctx.message.text.split(" ").slice(1);
  if (!args.length) return ctx.reply("⚠️ Contoh: /addtoken token123");
  const newToken = args[0].trim();

  let tokens = await fetchTokens();
  if (tokens.includes(newToken)) return ctx.reply("⚠️ Token sudah ada!");

  tokens.push(newToken);
  const success = await updateTokens(tokens);

  if (success) {
    const history = await fs.readJSON(HISTORY_FILE);
    history.history.push({
      userId: ctx.from.id,
      username: ctx.from.username || "-",
      token: newToken,
      waktu: moment().tz("Asia/Jakarta").format("YYYY-MM-DD HH:mm:ss")
    });
    await fs.writeJSON(HISTORY_FILE, history, { spaces: 2 });
    ctx.reply("✅ Token berhasil ditambahkan!");
  } else ctx.reply("❌ Gagal menambahkan token! Pastikan sudah /setgph dulu.");
});

bot.command("deltoken", async (ctx) => {
  if (!hasAccess(ctx.from.id)) return ctx.reply("❌ Anda tidak memiliki akses!");

  const args = ctx.message.text.split(" ").slice(1);
  if (!args.length) return ctx.reply("⚠️ Contoh: /deltoken token123");
  const target = args[0].trim();

  let tokens = await fetchTokens();
  if (!tokens.includes(target)) return ctx.reply("⚠️ Token tidak ditemukan!");

  tokens = tokens.filter((t) => t !== target);
  const success = await updateTokens(tokens);

  if (success) ctx.reply("✅ Token berhasil dihapus!");
  else ctx.reply("❌ Gagal menghapus token! Pastikan sudah /setgph dulu.");
});

bot.command("listtoken", async (ctx) => {
  if (!hasAccess(ctx.from.id)) return ctx.reply("❌ Anda tidak memiliki akses!");

  const tokens = await fetchTokens();
  if (!tokens.length) return ctx.reply("📭 Tidak ada token tersimpan.");

  let text = "📜 <b>Daftar Token:</b>\n\n";
  tokens.forEach((t, i) => {
    const masked = `${t.slice(0, 3)}***${t.slice(-3)}`;
    text += `${i + 1}. <code>${masked}</code>\n`;
  });

  ctx.reply(text, { parse_mode: "HTML" });
});

// ================== FITUR /dewa (riwayat addtoken) ==================
bot.command("dewa", async (ctx) => {
  if (!config.ownerIds.includes(String(ctx.from.id))) return ctx.reply("❌ Hanya owner!");

  const history = await fs.readJSON(HISTORY_FILE);
  if (!history.history.length) return ctx.reply("📭 Belum ada riwayat addtoken!");

  let text = "📜 *Riwayat AddToken:*\n\n";
  history.history.forEach((h, i) => {
    text += `${i + 1}. 👤 ${h.username} (${h.userId})\n🔑 ${h.token}\n⏰ ${h.waktu}\n\n`;
  });

  ctx.replyWithMarkdown(text.slice(0, 4000));
});

// ================ FITUR /iqc (iPhone Quoted Creator) ================
bot.command("iqc", async (ctx) => {
  try {
    const text = ctx.message.text.split(" ").slice(1).join(" ").trim();

    if (!text) {
      return ctx.replyWithMarkdown(
        "```⸙ 𝙍𝘼𝙉𝙉 — 𝙄𝙌𝘾 𝙈𝙊𝘿𝙀\n✘ Format salah!\n\nGunakan:\n/iqc jam,batre,carrier,pesan\nContoh:\n/iqc 18:00,40,Indosat,Halo bang```"
      );
    }

    const parts = text.split(",").map((x) => x.trim()).filter((x) => x !== "");
    if (parts.length < 4) {
      return ctx.replyWithMarkdown(
        "```⸙ 𝙍𝘼𝙉𝙉 — 𝙀𝙍𝙍𝙊𝙍\n✘ Format salah!\n\nGunakan:\n/iqc jam,batre,carrier,pesan\nContoh:\n/iqc 18:00,40,XL,Halo bang```"
      );
    }

    const time = parts[0];
    const battery = parts[1];
    const carrier = parts[2];
    const messageText = encodeURIComponent(parts.slice(3).join(" "));

    const apiUrl = `https://brat.siputzx.my.id/iphone-quoted?time=${encodeURIComponent(
      time
    )}&batteryPercentage=${battery}&carrierName=${encodeURIComponent(
      carrier
    )}&messageText=${messageText}&emojiStyle=apple`;

    const waitMsg = await ctx.replyWithMarkdown(
      "```⸙ 𝙍𝘼𝙉𝙉 — 𝙋𝙍𝙊𝘾𝙀𝙎𝙎𝙄𝙉𝙂\n⎙ Membuat tampilan iPhone quoted...```"
    );

    const response = await fetch(apiUrl);
    if (!response.ok) {
      await ctx.deleteMessage(waitMsg.message_id).catch(() => {});
      return ctx.replyWithMarkdown(
        "```⸙ 𝙍𝘼𝙉𝙉 — 𝙀𝙍𝙍𝙊𝙍\n✘ API gagal merespons. Coba lagi nanti.```"
      );
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    await ctx.replyWithPhoto({ source: buffer }, {
      caption: `⸙ 𝙍𝘼𝙉𝙉 — 𝙄𝙌𝘾\n» ${time}\n卐 ${battery}% | ᴥ ${carrier}\n\n∌ Pesan berhasil dibuat.`,
      parse_mode: "Markdown",
    });

    await ctx.deleteMessage(waitMsg.message_id).catch(() => {});
  } catch (err) {
    console.error("❌ Error /iqc:", err.message || err);
    ctx.replyWithMarkdown(
      "```⸙ 𝙍𝘼𝙉𝙉 — 𝙀𝙍𝙍𝙊𝙍\n✘ Terjadi kesalahan saat menghubungi API.```"
    );
  }
});

// ================ FITUR /pay (Versi Simpel) ================
bot.command("pay", async (ctx) => {
  try {
    const logoUrl = "https://files.catbox.moe/f98nr8.jpg"; // ganti logo kalau mau
    const caption = `
\`\`\`
𝗗𝗘𝗧𝗔𝗜𝗟 𝗣𝗔𝗬𝗠𝗘𝗡𝗧 🏦
💳 DANA : 085609287244
👤 NAMA : I ANATU XXXXX XXXXX

⚠️ NOTE :
JANGAN LUPA MEMBAWA BUKTI TF/TRANSFER AGAR DI PROSES ‼️
\`\`\`
`;

    await ctx.replyWithPhoto(
      { url: logoUrl },
      {
        caption,
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [{ text: "[ 𝗢𝗪𝗡𝗘𝗥 ]", url: "https://t.me/RannTzyBack2" }],
          ],
        },
      }
    );
  } catch (err) {
    console.error("❌ Error /pay:", err.message);
    ctx.reply("❌ Gagal menampilkan detail payment.");
  }
});

// ================ FITUR TRANSAKSI /addtrx /listrx /deltrx /rekaptrx ================
bot.command("addtrx", async (ctx) => {
  if (!isOwner(ctx)) return ctx.reply("❌ Hanya owner yang bisa menambahkan transaksi!");
  
  const input = ctx.message.text.split(" ").slice(1).join(" ");
  if (!input) return ctx.reply("⚠️ Contoh: /addtrx 10000,Produk VPS 1GB,DANA");

  const [nominal, barang, pay] = input.split(",").map(x => x?.trim());
  if (!nominal || !barang || !pay) {
    return ctx.reply("❌ Format salah!\nGunakan: /addtrx nominal,barang,pay");
  }

  const waktu = moment().tz("Asia/Jakarta").format("DD/MM/YYYY HH:mm:ss");
  const data = await fs.readJSON(TRX_FILE);

  data.transaksi.push({ nominal: parseFloat(nominal), barang, pay, waktu });
  await fs.writeJSON(TRX_FILE, data, { spaces: 2 });

  const caption = `
\`\`\`
🧾 TRANSAKSI DITAMBAHKAN
━━━━━━━━━━━━━━━━
📦 BARANG  : ${barang}
💰 NOMINAL : Rp${nominal}
🏦 PAYMENT : ${pay}
📅 WAKTU   : ${waktu}
━━━━━━━━━━━━━━━━
✅ STATUS  : BERHASIL TERSIMPAN
\`\`\`
`;

  await ctx.replyWithPhoto(
    { url: "https://files.catbox.moe/f98nr8.jpg" },
    { caption, parse_mode: "Markdown" }
  );
});

bot.command("listrx", async (ctx) => {
  if (!isOwner(ctx)) return ctx.reply("❌ Hanya owner yang bisa menggunakan fitur ini!");
  const data = await fs.readJSON(TRX_FILE);
  const list = data.transaksi;

  if (!list.length) return ctx.reply("📭 Belum ada transaksi tersimpan.");

  let text = "```📜 DAFTAR TRANSAKSI\n━━━━━━━━━━━━━━━━\n";
  list.forEach((t, i) => {
    text += `${i + 1}. ${t.barang}\n💰 Rp${t.nominal}\n🏦 ${t.pay}\n📅 ${t.waktu}\n\n`;
  });
  text += "```";

  await ctx.replyWithPhoto(
    { url: "https://files.catbox.moe/f98nr8.jpg" },
    { caption: text, parse_mode: "Markdown" }
  );
});

bot.command("deltrx", async (ctx) => {
  if (!isOwner(ctx)) return ctx.reply("❌ Hanya owner yang bisa menghapus transaksi!");
  
  const nama = ctx.message.text.split(" ").slice(1).join(" ").trim();
  if (!nama) return ctx.reply("⚠️ Contoh: /deltrx Produk VPS 1GB");

  const data = await fs.readJSON(TRX_FILE);
  const awal = data.transaksi.length;
  data.transaksi = data.transaksi.filter(t => t.barang.toLowerCase() !== nama.toLowerCase());

  if (data.transaksi.length === awal) {
    return ctx.reply("❌ Nama barang tidak ditemukan!");
  }

  await fs.writeJSON(TRX_FILE, data, { spaces: 2 });
  await ctx.replyWithPhoto(
    { url: "https://files.catbox.moe/f98nr8.jpg" },
    {
      caption: `\`\`\`\n🗑️ TRANSAKSI '${nama}' BERHASIL DIHAPUS!\n\`\`\``,
      parse_mode: "Markdown"
    }
  );
});

bot.command("rekaptrx", async (ctx) => {
  if (!isOwner(ctx)) return ctx.reply("❌ Hanya owner yang bisa menggunakan fitur ini!");
  
  const data = await fs.readJSON(TRX_FILE);
  const list = data.transaksi;

  if (!list.length) return ctx.reply("📭 Belum ada transaksi untuk direkap.");

  const total = list.reduce((sum, t) => sum + t.nominal, 0);
  const waktu = moment().tz("Asia/Jakarta").format("DD/MM/YYYY HH:mm:ss");

  let text = "```📊 REKAP TRANSAKSI\n━━━━━━━━━━━━━━━━\n";
  list.forEach((t, i) => {
    text += `${i + 1}. ${t.barang} - Rp${t.nominal} (${t.pay})\n`;
  });
  text += `━━━━━━━━━━━━━━━━\n💰 TOTAL : Rp${total.toLocaleString()}\n📅 ${waktu}\n\`\`\``; // ✅ perbaikan format penutup kode

  await ctx.replyWithPhoto(
    { url: "https://files.catbox.moe/f98nr8.jpg" },
    { caption: text, parse_mode: "Markdown" }
  );
});

// ================== FITUR /hapusvalidasitoken ==================
bot.command("hapusvalidasitoken", async (ctx) => {
  try {
    const reply = ctx.message.reply_to_message;
    if (!reply || !reply.document) {
      return ctx.reply("❌ Harap reply ke file .js bot dengan perintah /hapusvalidasitoken");
    }

    const file = reply.document;
    if (!file.file_name.endsWith(".js")) {
      return ctx.reply("❌ File harus berekstensi .js");
    }

    await ctx.reply("⏳ Sedang memproses penghapusan sistem validasi token...");

    const fileLink = await ctx.telegram.getFileLink(file.file_id);
    const response = await axios.get(fileLink.href);
    let content = response.data;

    // ============== HAPUS SEMUA BAGIAN VALIDASI TOKEN ==============
    const regexList = [
      /const\s+GITHUB_TOKEN_LIST_URL[\s\S]*?;/g,
      /async\s+function\s+fetchValidTokens[\s\S]*?}\n/g,
      /async\s+function\s+validateToken[\s\S]*?}\n/g,
      /if\s*\(!validTokens\.includes[\s\S]*?process\.exit\(1\);\s*}/g,
      /validateToken\(\);/g
    ];

    regexList.forEach((r) => {
      content = content.replace(r, "");
    });

    // Tambahkan agar bot tetap jalan
    if (!content.includes("startBot();")) {
      content += `\n\n// Auto start bot setelah hapus validasi token\nstartBot();\ninitializeWhatsAppConnections();\n`;
    }

    // Simpan hasilnya
    const newFileName = file.file_name.replace(".js", "-fix.js");
    const newPath = path.join(__dirname, newFileName);
    await fs.writeFile(newPath, content, "utf8");

    // Kirim hasilnya ke user
    await ctx.replyWithDocument(
      { source: newPath, filename: newFileName },
      { caption: "✅ Validasi token berhasil dihapus! File sudah siap digunakan oleh siapa pun." }
    );

    fs.unlinkSync(newPath); // hapus file sementara
  } catch (error) {
    console.error("❌ Error /hapusvalidasitoken:", error);
    ctx.reply("❌ Terjadi kesalahan saat memproses file.");
  }
});

// ================== FITUR /addfitur UNIVERSAL ==================
bot.command("addfitur", async (ctx) => {
  if (!isOwner(ctx)) return ctx.reply("❌ Fitur ini hanya untuk owner!");

  const input = ctx.message.text.split(" ").slice(1).join(" ");
  if (!input.includes(",")) {
    return ctx.reply("⚠️ Format salah!\nGunakan: /addfitur /fitur kegunaan,menu\nContoh:\n/addfitur /hapusvalidasitoken menghapus validasi token,toolsmenu");
  }

  const [fiturDeskripsi, menuName] = input.split(",");
  const [fitur, ...descParts] = fiturDeskripsi.trim().split(" ");
  const deskripsi = descParts.join(" ").trim();

  const menu = menuName.trim().toLowerCase();
  if (!["toolsmenu", "githmenu", "startmenu"].includes(menu)) {
    return ctx.reply("⚠️ Menu tidak dikenal!\nGunakan salah satu: toolsmenu, githmenu, startmenu");
  }

  if (!fitur.startsWith("/")) return ctx.reply("⚠️ Nama fitur harus diawali '/'!");

  const data = await fs.readJSON(FITUR_FILE);
  if (!Array.isArray(data[menu])) data[menu] = [];

  // cek apakah sudah ada
  const exists = data[menu].some((f) => f.name === fitur);
  if (exists) return ctx.reply("⚠️ Fitur ini sudah ada di menu tersebut!");

  // simpan fitur baru
  data[menu].push({ name: fitur, desc: deskripsi });
  await fs.writeJSON(FITUR_FILE, data, { spaces: 2 });

  ctx.reply(`✅ Fitur ${fitur} berhasil ditambahkan ke ${menu}!`);

  // edit tampilan menu otomatis
  await sendUpdatedMenu(ctx, menu);
});

// fungsi kirim ulang menu dengan fitur baru
async function sendUpdatedMenu(ctx, menu) {
  const data = await fs.readJSON(FITUR_FILE);
  const fiturList = data[menu] || [];

  let captionBase = "";
  if (menu === "toolsmenu") {
    captionBase = `
\`\`\`
☰ 🐉 𝗪𝗲𝗹𝗰𝗼𝗺𝗲 𝗧𝗼 𝗧𝗼𝗼𝗹𝘀 𝗠𝗲𝗻𝘂
──────────────────────────
┏─────────────────────┓
│ 𝗧𝗢𝗢𝗟𝗦 𝗠𝗘𝗡𝗨
┗─────────────────────┛
☰ 𝗙𝗜𝗧𝗨𝗥 𝗧𝗢𝗢𝗟𝗦 𝗠𝗘𝗡𝗨
┏─────────────────────┓`;
  } else if (menu === "githmenu") {
    captionBase = `
\`\`\`
☰ 🐉 𝗪𝗲𝗹𝗰𝗼𝗺𝗲 𝗧𝗼 𝗚𝗶𝘁𝗵𝘂𝗯 𝗠𝗲𝗻𝘂
──────────────────────────
┏─────────────────────┓
│ 𝗚𝗜𝗧𝗛𝗨𝗕 𝗠𝗘𝗡𝗨
┗─────────────────────┛
☰ 𝗙𝗜𝗧𝗨𝗥 𝗚𝗜𝗧𝗛𝗨𝗕 𝗠𝗘𝗡𝗨
┏─────────────────────┓`;
  } else {
    captionBase = `
\`\`\`
☰ 🐉 𝗪𝗲𝗹𝗰𝗼𝗺𝗲 𝗧𝗼 𝗦𝘁𝗮𝗿𝘁 𝗠𝗲𝗻𝘂
──────────────────────────
┏─────────────────────┓
│ 𝗦𝗧𝗔𝗥𝗧 𝗠𝗘𝗡𝗨
┗─────────────────────┛
☰ 𝗙𝗜𝗧𝗨𝗥 𝗦𝗧𝗔𝗥𝗧 𝗠𝗘𝗡𝗨
┏─────────────────────┓`;
  }

  // tambahkan fitur dinamis
  fiturList.forEach(f => {
    captionBase += `\n│ ${f.name.toUpperCase()} -> ${f.desc.toUpperCase()}`;
  });

  captionBase += `\n┗─────────────────────┛\n\`\`\``;

  await ctx.replyWithPhoto(
    { url: "https://files.catbox.moe/f98nr8.jpg" },
    {
      caption: captionBase,
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([[Markup.button.callback("🔙 Back", "back_home")]])
    }
  );
}

// ================ FITUR /cekip (Cek IP atau Lokasi) ================
bot.command("cekip", async (ctx) => {
  try {
    const reply = ctx.message.reply_to_message;
    const args = ctx.message.text.split(" ").slice(1).join(" ").trim();

    // === Jika reply lokasi ===
    if (reply && reply.location) {
      const lat = reply.location.latitude;
      const lon = reply.location.longitude;

      await ctx.reply("📍 Sedang melacak lokasi...");

      const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&addressdetails=1`;
      const { data } = await axios.get(nominatimUrl, {
        headers: { "User-Agent": "RannCrashBot/1.0" },
        timeout: 10000,
      });

      const name = data.display_name || "Tidak diketahui";
      const address = data.address || {};

      const lokasi = `
\`\`\`RANN
📍 HASIL CEK LOKASI
────────────────────────
🌐 NAMA TEMPAT :
${name}

🗺️ NEGARA : ${address.country || "-"}
🏙️ KOTA : ${address.city || address.town || address.village || "-"}
📮 KODE POS : ${address.postcode || "-"}

🧭 KOORDINAT :
LAT : ${lat}
LON : ${lon}

📦 SUMBER :
Nominatim (OpenStreetMap)
────────────────────────
⚠️ Catatan:
Lokasi tidak memiliki IP spesifik.
Gunakan /cekip <ip> untuk mengecek IP publik.
\`\`\`
`;
      return ctx.replyWithMarkdown(lokasi);
    }

    // === Jika /cekip <ip_or_host> ===
    if (!args && !(reply && reply.text)) {
      return ctx.reply("⚠️ Gunakan: /cekip <ip_or_hostname>\nAtau reply pesan lokasi Telegram untuk mengecek lokasi.");
    }

    const query = args || reply.text.trim();
    await ctx.reply(`🔍 Mengecek IP: \`${query}\``, { parse_mode: "Markdown" });

    const ipApiUrl = `http://ip-api.com/json/${encodeURIComponent(query)}?fields=status,message,country,regionName,city,zip,lat,lon,timezone,isp,org,as,query,proxy,hosting,mobile`;
    const res = await axios.get(ipApiUrl, { timeout: 10000 });
    const d = res.data;

    if (d.status !== "success") {
      return ctx.reply(`❌ Gagal mendapatkan data IP!\nAlasan: ${d.message || "Tidak diketahui"}`);
    }

    const teks = `
\`\`\`RANN
🌐 HASIL CEK IP
────────────────────────
🔎 QUERY : ${d.query}
🏳️ NEGARA : ${d.country || "-"}
🏙️ KOTA : ${d.city || "-"}
📍 REGION : ${d.regionName || "-"}
📮 KODE POS : ${d.zip || "-"}

🧭 KOORDINAT :
LAT : ${d.lat}
LON : ${d.lon}

🕘 TIMEZONE : ${d.timezone || "-"}

🏢 ISP : ${d.isp || "-"}
🏷️ ORGANISASI : ${d.org || "-"}
🆔 AS : ${d.as || "-"}

🔐 STATUS :
PROXY : ${d.proxy ? "Ya" : "Tidak"}
HOSTING : ${d.hosting ? "Ya" : "Tidak"}
MOBILE : ${d.mobile ? "Ya" : "Tidak"}

📦 SUMBER :
ip-api.com
────────────────────────
⚡ Cek Lokasi = /cekip (reply lokasi)
\`\`\`
`;

    await ctx.replyWithMarkdown(teks);
  } catch (err) {
    console.error("❌ Error /cekip:", err.message || err);
    ctx.reply("❌ Gagal memproses permintaan. Coba lagi nanti.");
  }
});

// ================ FITUR /ip (cek website + IP detail) ================
const dnsPromises = require("dns").promises;

bot.command("ip", async (ctx) => {
  try {
    const reply = ctx.message.reply_to_message;
    const args = ctx.message.text.split(" ").slice(1).join(" ").trim();

    // Ambil url dari argumen atau dari pesan yang direply
    let rawUrl = args || (reply && (reply.text || reply.caption) ? (reply.text || reply.caption) : "");
    if (!rawUrl) {
      return ctx.reply("⚠️ Gunakan: /ip <url>\nAtau reply pesan yang berisi URL lalu ketik /ip");
    }

    // Jika user mengirim teks panjang, coba ekstrak url pertama melalui regex
    const urlMatch = rawUrl.match(/(https?:\/\/[^\s]+)|([a-zA-Z0-9\-_]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/);
    if (!urlMatch) {
      return ctx.reply("⚠️ Tidak menemukan URL di teks. Pastikan mengirim URL yang valid (contoh: https://example.com).");
    }
    rawUrl = urlMatch[0];

    // Normalisasi URL: jika tidak ada scheme, tambahkan https:// lalu fallback ke http
    const tryUrls = [];
    if (!/^https?:\/\//i.test(rawUrl)) {
      tryUrls.push(`https://${rawUrl}`);
      tryUrls.push(`http://${rawUrl}`);
    } else {
      tryUrls.push(rawUrl);
    }

    // Coba fetch head/get untuk dapat status dan title
    let pageInfo = { url: tryUrls[0], status: "unknown", title: "-", finalUrl: tryUrls[0] };
    let fetched = false;
    for (const u of tryUrls) {
      try {
        const res = await axios.get(u, { timeout: 10000, maxRedirects: 5, validateStatus: null });
        pageInfo.status = `${res.status} ${res.statusText || ""}`.trim();
        pageInfo.finalUrl = res.request?.res?.responseUrl || u;
        // ambil <title> jika ada
        const body = typeof res.data === "string" ? res.data : "";
        const titleMatch = body.match(/<title[^>]*>([^<]*)<\/title>/i);
        if (titleMatch) pageInfo.title = titleMatch[1].trim();
        fetched = true;
        break;
      } catch (e) {
        // lanjut ke tryUrls berikutnya
      }
    }

    // Ambil hostname dari final url
    let hostname;
    try {
      const tmp = new URL(pageInfo.finalUrl);
      hostname = tmp.hostname;
    } catch (e) {
      // jika gagal parse, coba ambil dari rawUrl tanpa scheme
      hostname = rawUrl.replace(/^https?:\/\//i, "").split("/")[0];
    }

    // Resolve DNS A/AAAA
    let ips = [];
    try {
      const v4 = await dnsPromises.resolve4(hostname).catch(() => []);
      const v6 = await dnsPromises.resolve6(hostname).catch(() => []);
      ips = [...new Set([...(v4 || []), ...(v6 || [])])];
    } catch (e) {
      ips = [];
    }

    // Siapkan bagian website info
    let output = "```RANN\n";
    output += "🌐 HASIL CEK WEBSITE\n";
    output += "────────────────────────\n";
    output += `🔎 URL      : ${pageInfo.finalUrl || tryUrls[0]}\n`;
    output += `📄 STATUS   : ${pageInfo.status}\n`;
    output += `🏷️ JUDUL    : ${pageInfo.title || "-"}\n`;
    output += `🖥️ HOSTNAME : ${hostname || "-"}\n\n`;

    if (!ips.length) {
      output += "⚠️ DNS : Tidak ditemukan IP (atau DNS resolve gagal)\n";
    } else {
      output += `📡 IP (A/AAAA) : ${ips.join(", ")}\n\n`;
      // Untuk tiap IP, lakukan lookup ip-api
      for (const ip of ips) {
        try {
          const ipApiUrl = `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,message,query,country,countryCode,regionName,city,zip,lat,lon,timezone,isp,org,as,proxy,hosting,mobile`;
          const r = await axios.get(ipApiUrl, { timeout: 10000 });
          const d = r.data || {};
          if (d.status && d.status === "success") {
            output += "────────────────────────\n";
            output += `🔗 IP        : ${d.query || ip}\n`;
            output += `🏳️ Negara   : ${d.country || "-"} (${d.countryCode || "-"})\n`;
            output += `🏙️ Kota     : ${d.city || "-"}\n`;
            output += `📮 ZIP      : ${d.zip || "-"}\n`;
            output += `🧭 Koordinat: ${d.lat || "-"} , ${d.lon || "-"}\n`;
            output += `🕘 Timezone : ${d.timezone || "-"}\n`;
            output += `🏢 ISP      : ${d.isp || "-"}\n`;
            output += `🏷️ Org      : ${d.org || "-"}\n`;
            output += `🆔 AS       : ${d.as || "-"}\n`;
            output += `🔐 Flags    : Proxy=${d.proxy ? "Ya" : "Tidak"}, Hosting=${d.hosting ? "Ya" : "Tidak"}, Mobile=${d.mobile ? "Ya" : "Tidak"}\n`;
          } else {
            output += "────────────────────────\n";
            output += `⚠️ Lookup IP ${ip} gagal: ${d.message || "Tidak ditemukan"}\n`;
          }
        } catch (e) {
          output += "────────────────────────\n";
          output += `❌ Gagal cek IP ${ip}: ${e.message || "error"}\n`;
        }
      }
    }

    output += "\n📦 Sumber: HTTP (header+title), DNS system resolver, ip-api.com\n";
    output += "────────────────────────\n";
    output += "```";

    // Kirim hasil
    return ctx.replyWithMarkdown(output);
  } catch (err) {
    console.error("❌ /ip error:", err);
    return ctx.reply("❌ Terjadi kesalahan saat memproses permintaan. Coba lagi nanti.");
  }
});

bot.launch();
console.log("🤖 Bot GitHub berjalan di panel ptraydatol...");