# 🎵 TikTok Discord Notifier Bot

> Discord bot that monitors TikTok channels for new videos and live streams, then sends notifications to your server.

## 🇻🇳 Tiếng Việt

Bot Discord theo dõi các kênh TikTok, tự động thông báo video mới và phát trực tiếp vào kênh Discord chỉ định.

### ✨ Tính Năng

- 🎬 **Theo dõi video mới** — Kiểm tra video mới từ danh sách kênh TikTok, gửi thông báo kèm thumbnail
- 🔴 **Theo dõi Live** — Phát hiện khi kênh bắt đầu phát trực tiếp, gửi link live
- 📢 **Ping @everyone** — Mọi thông báo đều ping @everyone để không ai bỏ lỡ
- ⚡ **Slash Commands** — `/ping`, `/add_kenh`, `/xoa_kenh`, `/mute`, `/unmute`, `/ban`, `/unban`
- 🔇 **Quản lý thành viên** — Mute/Ban/Unban không để lại dấu vết (ephemeral)
- 🔒 **Phân quyền** — Chỉ các role được chỉ định mới dùng được lệnh
- 🛡️ **Anti-Spam** — Chống thông báo trùng lặp, cooldown live 10 phút

### 📁 Cấu Trúc

```
├── index.js              # Khởi tạo bot, đăng ký lệnh, vòng lặp theo dõi
├── config.json           # Cấu hình bot (token, kênh, quyền)
├── commands/
│   ├── ping.js           # /ping content — ping mọi người
│   ├── add_kenh.js       # /add_kenh username — thêm kênh TikTok
│   ├── xoa_kenh.js       # /xoa_kenh username — xóa kênh TikTok
│   ├── mute.js           # /mute — timeout người dùng
│   ├── unmute.js         # /unmute — gỡ timeout
│   ├── ban.js            # /ban — ban người dùng (có thời hạn hoặc vĩnh viễn)
│   └── unban.js          # /unban — unban người dùng
├── services/
│   └── tiktok.js         # Theo dõi video mới & live stream
├── utils/
│   ├── permission.js     # Kiểm tra quyền sử dụng lệnh
│   └── banManager.js     # Quản lý ban có thời hạn, tự unban
└── data/
    ├── cache.json        # Lưu trạng thái video & live đã thông báo
    └── bans.json         # Lưu ban có thời hạn (persist qua restart)
```

### 🚀 Cài Đặt

1. **Clone repo:**
```bash
git clone https://github.com/vietphamhoccode/Bot-Notifier-New-Video-TikTok
cd tiktok-discord-bot
```

2. **Cài đặt dependencies:**
```bash
npm install
```

3. **Cấu hình bot:**

Sao chép `config.example.json` thành `config.json` và điền thông tin:
```bash
cp config.example.json config.json
```

```json
{
    "botken_discord": "TOKEN_BOT_CỦA_BẠN",
    "client_id": "CLIENT_ID_CỦA_BOT",
    "id_guild": "ID_SERVER_DISCORD",
    "list_channel": [],
    "list_id_role_permission": ["ID_ROLE_ĐƯỢC_PHÉP"],
    "channel_id_tiktok": "ID_KÊNH_GỬI_THÔNG_BÁO"
}
```

| Trường | Mô tả |
|---|---|
| `botken_discord` | Token của bot Discord |
| `client_id` | Application ID của bot |
| `id_guild` | ID server Discord |
| `list_channel` | Danh sách username TikTok cần theo dõi |
| `list_id_role_permission` | Danh sách role ID được phép dùng lệnh (**phải là string**) |
| `channel_id_tiktok` | ID kênh Discord để gửi thông báo |

4. **Tạo thư mục data:**
```bash
mkdir data
echo {} > data/cache.json
```

5. **Chạy bot:**
```bash
node index.js
```

### 📝 Lệnh

| Lệnh | Mô tả |
|---|---|
| `/ping content:<nội dung>` | Ping @everyone với embed nội dung tùy chỉnh |
| `/add_kenh username:<tiktok>` | Thêm kênh TikTok vào danh sách theo dõi |
| `/xoa_kenh username:<tiktok>` | Xóa kênh TikTok khỏi danh sách |
| `/mute time:<phút> [user] [id] [reason]` | Timeout người dùng (không dấu vết) |
| `/unmute [user] [id]` | Gỡ timeout người dùng (không dấu vết) |
| `/ban time:<ngày> [user] [id] [reason]` | Ban người dùng, `time=0` = vĩnh viễn (không dấu vết) |
| `/unban user:<ID>` | Unban người dùng bằng ID (không dấu vết) |

> ⚠️ Tất cả lệnh đều yêu cầu role nằm trong `list_id_role_permission`.
>
> 🔒 Lệnh mute/ban/unban dùng **ephemeral reply** — chỉ người dùng lệnh thấy, không để lại dấu vết.

---

## 🇬🇧 English

A Discord bot that monitors TikTok channels and sends notifications when new videos are posted or when a channel goes live.

### ✨ Features

- 🎬 **New Video Tracking** — Detects new videos from tracked TikTok channels with thumbnail preview
- 🔴 **Live Stream Detection** — Alerts when a channel starts streaming live via [tiktok-live-connector](https://www.npmjs.com/package/tiktok-live-connector)
- 📢 **@everyone Ping** — All notifications mention @everyone
- ⚡ **Slash Commands** — `/ping`, `/add_kenh`, `/xoa_kenh`, `/mute`, `/unmute`, `/ban`, `/unban`
- � **Stealth Moderation** — Mute/Ban/Unban with ephemeral responses (no trace left)
- �🔒 **Role-based Permissions** — Only specified roles can use commands
- 🛡️ **Anti-Spam System** — Duplicate notification prevention, 10-minute live cooldown

### 🚀 Setup

1. **Clone & Install:**
```bash
git clone https://github.com/vietphamhoccode/Bot-Notifier-New-Video-TikTok
cd Bot-Notifier-New-Video-TikTok
npm install
```

2. **Configure:**

Copy `config.example.json` to `config.json` and fill in your values:
```bash
cp config.example.json config.json
```

| Field | Description |
|---|---|
| `botken_discord` | Your Discord bot token |
| `client_id` | Bot's Application ID |
| `id_guild` | Discord server (guild) ID |
| `list_channel` | Array of TikTok usernames to track |
| `list_id_role_permission` | Array of role IDs allowed to use commands (**must be strings**) |
| `channel_id_tiktok` | Discord channel ID for notifications |

3. **Create data directory:**
```bash
mkdir data
echo {} > data/cache.json
```

4. **Run:**
```bash
node index.js
```

### 📝 Commands

| Command | Description |
|---|---|
| `/ping content:<text>` | Ping @everyone with a custom embed message |
| `/add_kenh username:<tiktok>` | Add a TikTok channel to the watchlist |
| `/xoa_kenh username:<tiktok>` | Remove a TikTok channel from the watchlist |
| `/mute time:<minutes> [user] [id] [reason]` | Timeout a user (ephemeral, no trace) |
| `/unmute [user] [id]` | Remove timeout from a user (ephemeral, no trace) |
| `/ban time:<days> [user] [id] [reason]` | Ban a user, `time=0` = permanent (ephemeral, no trace) |
| `/unban user:<ID>` | Unban a user by ID (ephemeral, no trace) |

### 🛡️ Anti-Spam System

- **Video ID validation** — Only accepts IDs with 15-20 digits (filters invalid IDs)
- **Notification history** — Keeps track of last 20 notified videos per channel
- **Overlap prevention** — Lock mechanism prevents concurrent checks
- **Live cooldown** — 10-minute cooldown between live notifications per channel
- **Default safe** — Defaults to "not live" on network errors to prevent false alerts

### 🔧 Tech Stack

- [discord.js](https://discord.js.org/) — Discord API
- [tiktok-live-connector](https://www.npmjs.com/package/tiktok-live-connector) — TikTok live detection
- [axios](https://axios-http.com/) — HTTP requests for video scraping

### ⚠️ Notes

- TikTok aggressively blocks scraping. Video detection uses multiple fallback methods (HTML parsing, embed page, regex) but may occasionally miss updates.
- Live detection via `tiktok-live-connector` is reliable and does not require a browser.
- Role IDs in `list_id_role_permission` **must be strings** (quoted) because Discord snowflake IDs exceed JavaScript's `Number.MAX_SAFE_INTEGER`.
- **Server Members Intent** must be enabled in [Discord Developer Portal](https://discord.com/developers/applications) → Bot → Privileged Gateway Intents for mute/ban commands to work.

---

## 📄 License

MIT
