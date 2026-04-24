const { Client, GatewayIntentBits, REST, Routes, Collection, ActivityType } = require('discord.js');
const fs = require('fs');
const path = require('path');

/* ============================
   Đọc cấu hình
   ============================ */

const DUONG_DAN_CONFIG = path.join(__dirname, 'config.json');
let config = JSON.parse(fs.readFileSync(DUONG_DAN_CONFIG, 'utf-8'));

function taiLaiConfig() {
    try {
        config = JSON.parse(fs.readFileSync(DUONG_DAN_CONFIG, 'utf-8'));
    } catch (loi) {
        console.error('[Config] ❌ Lỗi đọc config:', loi.message);
    }
}

/* ============================
   Nạp lệnh
   ============================ */

const lenhPing = require('./commands/ping');
const lenhThemKenh = require('./commands/add_kenh');
const lenhXoaKenh = require('./commands/xoa_kenh');

const danhSachLenh = new Collection();
danhSachLenh.set(lenhPing.data.name, lenhPing);
danhSachLenh.set(lenhThemKenh.data.name, lenhThemKenh);
danhSachLenh.set(lenhXoaKenh.data.name, lenhXoaKenh);

/* ============================
   Nạp dịch vụ
   ============================ */

const { kiemTraTatCaKenh } = require('./services/tiktok');

/* ============================
   Khởi tạo Discord Client
   ============================ */

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

/* ============================
   Đăng ký Slash Commands
   ============================ */

async function dangKyLenh() {
    const rest = new REST({ version: '10' }).setToken(config.botken_discord);
    const duLieuLenh = [
        lenhPing.data.toJSON(),
        lenhThemKenh.data.toJSON(),
        lenhXoaKenh.data.toJSON(),
    ];

    try {
        console.log('[Bot] 🔄 Đang đăng ký slash commands...');
        await rest.put(
            Routes.applicationGuildCommands(config.client_id, config.id_guild),
            { body: duLieuLenh },
        );
        console.log('[Bot] ✅ Đăng ký slash commands thành công!');
    } catch (loi) {
        console.error('[Bot] ❌ Lỗi đăng ký commands:', loi);
    }
}

/* ============================
   Chống check trùng lặp
   ============================ */

let dangKiemTra = false;

async function chayKiemTra() {
    if (dangKiemTra) {
        console.log('[Anti-Spam] ⏳ Previous check still running, skipping.');
        return;
    }

    dangKiemTra = true;
    try {
        taiLaiConfig();
        await kiemTraTatCaKenh(client, config);
    } catch (loi) {
        console.error('[TikTok] ❌ Lỗi kiểm tra:', loi.message);
    } finally {
        dangKiemTra = false;
    }
}

/* ============================
   Event: Bot sẵn sàng
   ============================ */

client.once('clientReady', async () => {
    console.log('═══════════════════════════════════════════');
    console.log(`[Bot] 🤖 ${client.user.tag} đã online!`);
    console.log(`[Bot] 📡 Theo dõi ${config.list_channel.length} kênh TikTok`);
    console.log(`[Bot] 📺 Kênh thông báo: ${config.channel_id_tiktok}`);
    console.log('═══════════════════════════════════════════');

    client.user.setActivity('TikTok 👀', { type: ActivityType.Watching });

    await dangKyLenh();

    console.log('[TikTok] 🚀 Bắt đầu theo dõi...');
    setTimeout(chayKiemTra, 5000);
    setInterval(chayKiemTra, 10 * 1000);
});

/* ============================
   Event: Xử lý lệnh
   ============================ */

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const lenh = danhSachLenh.get(interaction.commandName);
    if (!lenh) return;

    try {
        taiLaiConfig();
        await lenh.execute(interaction, config);
    } catch (loi) {
        console.error(`[Bot] ❌ Lỗi lệnh /${interaction.commandName}:`, loi);
        const thongBaoLoi = '❌ Đã xảy ra lỗi khi thực hiện lệnh!';
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: thongBaoLoi, flags: 64 });
        } else {
            await interaction.reply({ content: thongBaoLoi, flags: 64 });
        }
    }
});

/* ============================
   Đăng nhập
   ============================ */

client.login(config.botken_discord);
