const { EmbedBuilder } = require('discord.js');
const { WebcastPushConnection } = require('tiktok-live-connector');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

/* ============================
   Cấu hình & Hằng số
   ============================ */

const DUONG_DAN_CACHE = path.join(__dirname, '..', 'data', 'cache.json');

const DANH_SACH_UA = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0',
];

function layUserAgentNgauNhien() {
    return DANH_SACH_UA[Math.floor(Math.random() * DANH_SACH_UA.length)];
}

/* ============================
   Cache - Lưu trữ dữ liệu
   ============================ */

function docCache() {
    try {
        return JSON.parse(fs.readFileSync(DUONG_DAN_CACHE, 'utf-8'));
    } catch {
        return {};
    }
}

function luuCache(duLieu) {
    fs.writeFileSync(DUONG_DAN_CACHE, JSON.stringify(duLieu, null, 2), 'utf-8');
}

/* ============================
   Video - Kiểm tra video mới
   ============================ */

/** Video ID hợp lệ phải có 15-20 chữ số */
function laVideoIdHopLe(id) {
    return /^\d{15,20}$/.test(id);
}

/**
 * Lấy danh sách video + thông tin user từ TikTok
 * Thử nhiều phương pháp: HTML → Embed → oEmbed
 */
async function layThongTinKenh(username) {
    const ketQua = { videos: [], tenHienThi: username, anhDaiDien: null };

    // --- Cách 1: Lấy HTML trang profile ---
    try {
        const { data: html } = await axios.get(`https://www.tiktok.com/@${username}`, {
            headers: {
                'User-Agent': layUserAgentNgauNhien(),
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Cache-Control': 'no-cache',
            },
            timeout: 15000,
        });

        // Parse dữ liệu từ __UNIVERSAL_DATA_FOR_REHYDRATION__
        const khoiDuLieu = html.match(/<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([\s\S]*?)<\/script>/);
        if (khoiDuLieu) {
            try {
                const duLieu = JSON.parse(khoiDuLieu[1]);
                const phamVi = duLieu?.['__DEFAULT_SCOPE__'];
                const thongTinUser = phamVi?.['webapp.user-detail']?.userInfo;

                if (thongTinUser) {
                    ketQua.tenHienThi = thongTinUser.user?.nickname || username;
                    ketQua.anhDaiDien = thongTinUser.user?.avatarThumb || null;
                }

                // Lấy danh sách video từ SEO data
                const danhSachVid = phamVi?.['seo.abtest']?.vidList;
                if (danhSachVid?.length > 0) {
                    for (const vidId of danhSachVid) {
                        const id = String(vidId);
                        if (laVideoIdHopLe(id)) {
                            ketQua.videos.push({
                                id,
                                url: `https://www.tiktok.com/@${username}/video/${id}`,
                                moTa: '',
                            });
                        }
                    }
                }
            } catch { }
        }

        // Parse từ SIGI_STATE (cấu trúc cũ)
        if (ketQua.videos.length === 0) {
            const sigiKhoi = html.match(/<script id="SIGI_STATE"[^>]*>([\s\S]*?)<\/script>/);
            if (sigiKhoi) {
                try {
                    const sigiData = JSON.parse(sigiKhoi[1]);
                    const danhSachItem = sigiData?.ItemModule;
                    if (danhSachItem) {
                        ketQua.videos = Object.keys(danhSachItem)
                            .filter(id => laVideoIdHopLe(id))
                            .map(id => ({
                                id,
                                url: `https://www.tiktok.com/@${username}/video/${id}`,
                                moTa: danhSachItem[id]?.desc || '',
                                thoiGianTao: danhSachItem[id]?.createTime || 0,
                            }))
                            .sort((a, b) => (b.thoiGianTao || 0) - (a.thoiGianTao || 0));
                    }
                } catch { }
            }
        }

        // Regex tìm link video trong HTML
        if (ketQua.videos.length === 0) {
            const tenThoat = username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const mauTimKiem = new RegExp(`/@${tenThoat}/video/(\\d{15,20})`, 'g');
            const tapHopId = new Set();
            let ketQuaTimKiem;
            while ((ketQuaTimKiem = mauTimKiem.exec(html)) !== null) {
                tapHopId.add(ketQuaTimKiem[1]);
            }
            ketQua.videos = [...tapHopId].map(id => ({
                id,
                url: `https://www.tiktok.com/@${username}/video/${id}`,
                moTa: '',
            }));
        }

        if (ketQua.videos.length > 0) {
            console.log(`[TikTok] ✅ @${username}: ${ketQua.videos.length} video, mới nhất: ${ketQua.videos[0].id}`);
        }
    } catch (loi) {
        console.log(`[TikTok] ⚠️ Lỗi khi lấy HTML @${username}: ${loi.message}`);
    }

    // --- Cách 2: Embed page (dự phòng) ---
    if (ketQua.videos.length === 0) {
        try {
            const { data: embedHtml } = await axios.get(`https://www.tiktok.com/embed/@${username}`, {
                headers: { 'User-Agent': layUserAgentNgauNhien() },
                timeout: 15000,
            });
            const tenThoat = username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const mau = new RegExp(`/@${tenThoat}/video/(\\d{15,20})`, 'g');
            const tapHopId = new Set();
            let kq;
            while ((kq = mau.exec(embedHtml)) !== null) tapHopId.add(kq[1]);

            if (tapHopId.size > 0) {
                ketQua.videos = [...tapHopId].map(id => ({
                    id,
                    url: `https://www.tiktok.com/@${username}/video/${id}`,
                    moTa: '',
                }));
                console.log(`[TikTok] ✅ Embed @${username}: ${ketQua.videos.length} video`);
            }
        } catch { }
    }

    // --- Lấy tên hiển thị từ oEmbed ---
    if (ketQua.tenHienThi === username) {
        try {
            const { data } = await axios.get(
                `https://www.tiktok.com/oembed?url=https://www.tiktok.com/@${username}`,
                { timeout: 10000 }
            );
            ketQua.tenHienThi = data.author_name || username;
        } catch { }
    }

    if (ketQua.videos.length === 0) {
        console.log(`[TikTok] ⚠️ Không tìm thấy video @${username}`);
    }

    return ketQua;
}

/**
 * Lấy thumbnail + mô tả video từ oEmbed API
 */
async function layThumbnailVideo(linkVideo) {
    try {
        const { data } = await axios.get(
            `https://www.tiktok.com/oembed?url=${encodeURIComponent(linkVideo)}`,
            { timeout: 10000 }
        );
        return {
            thumbnail: data.thumbnail_url || null,
            tieuDe: data.title || '',
            tenTacGia: data.author_name || '',
        };
    } catch {
        return { thumbnail: null, tieuDe: '', tenTacGia: '' };
    }
}

/* ============================
   Live - Kiểm tra phát trực tiếp
   ============================ */

/**
 * Kiểm tra kênh có đang live không
 * Dùng tiktok-live-connector: connect thành công = đang live
 */
async function kiemTraLive(username) {
    try {
        const ketNoi = new WebcastPushConnection(username, {
            processInitialData: false,
            enableExtendedGiftInfo: false,
        });

        await ketNoi.connect();
        ketNoi.disconnect();

        console.log(`[TikTok Live] 🔴 @${username} đang LIVE!`);
        return { dangLive: true };
    } catch (loi) {
        const thongBao = loi.message || '';
        const laOffline = thongBao.includes('offline')
            || thongBao.includes('ended')
            || thongBao.includes("isn't online")
            || thongBao.includes('LIVE_HAS_ENDED')
            || thongBao.includes('user_not_found')
            || thongBao.includes('room_id')
            || thongBao.includes('19881007');

        if (!laOffline) {
            console.log(`[TikTok Live] ⚠️ @${username}: ${thongBao}`);
        }

        return { dangLive: false };
    }
}

/* ============================
   Embed - Tạo thông báo
   ============================ */

function taoEmbedVideo(username, tenHienThi, linkVideo, moTa, anhDaiDien, thumbnail) {
    const embed = new EmbedBuilder()
        .setColor(0xFE2C55)
        .setTitle(`🎬 Video Mới Từ @${tenHienThi}`)
        .setURL(linkVideo)
        .setDescription(moTa
            ? `> ${moTa.substring(0, 200)}${moTa.length > 200 ? '...' : ''}`
            : '📹 Video mới trên TikTok!')
        .addFields({ name: '🔗 Link Video', value: linkVideo })
        .setFooter({ text: `TikTok • @${username}` })
        .setTimestamp();

    if (anhDaiDien) embed.setThumbnail(anhDaiDien);
    if (thumbnail) embed.setImage(thumbnail);

    return embed;
}

function taoEmbedLive(username, tenHienThi, anhDaiDien) {
    const linkLive = `https://www.tiktok.com/@${username}/live`;

    const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle(`🔴 LIVE! @${tenHienThi} đang phát trực tiếp!`)
        .setURL(linkLive)
        .setDescription(`**@${tenHienThi}** đang live trên TikTok! Vào xem ngay! 🎉`)
        .addFields({ name: '🔗 Link Live', value: linkLive })
        .setFooter({ text: `TikTok Live • @${username}` })
        .setTimestamp();

    if (anhDaiDien) embed.setThumbnail(anhDaiDien);

    return embed;
}

/* ============================
   Vòng lặp theo dõi chính
   ============================ */

const THOI_GIAN_COOLDOWN_LIVE = 10 * 60 * 1000; // 10 phút

async function kiemTraTatCaKenh(client, config) {
    if (!config.list_channel || config.list_channel.length === 0) return;

    const cache = docCache();
    const kenhDiscord = await client.channels.fetch(config.channel_id_tiktok).catch(() => null);

    if (!kenhDiscord) {
        console.error(`[TikTok] ❌ Không tìm thấy kênh Discord: ${config.channel_id_tiktok}`);
        return;
    }

    console.log(`\n[TikTok] ⏰ Checking ${config.list_channel.length} channels... (${new Date().toLocaleTimeString()})`);

    for (const username of config.list_channel) {
        try {
            // Khởi tạo cache nếu chưa có
            if (!cache[username]) {
                cache[username] = {
                    lastVideoId: null,
                    notifiedVideoIds: [],
                    isLive: false,
                    lastLiveNotify: 0,
                };
            }
            if (!cache[username].notifiedVideoIds) cache[username].notifiedVideoIds = [];
            if (!cache[username].lastLiveNotify) cache[username].lastLiveNotify = 0;

            /* --- Kiểm tra video mới --- */

            const thongTin = await layThongTinKenh(username);

            if (thongTin.videos.length > 0) {
                const videoMoiNhat = thongTin.videos[0];

                const laVideoMoi = laVideoIdHopLe(videoMoiNhat.id)
                    && videoMoiNhat.id !== cache[username].lastVideoId
                    && !cache[username].notifiedVideoIds.includes(videoMoiNhat.id);

                if (laVideoMoi) {
                    if (cache[username].lastVideoId !== null) {
                        // Phát hiện video mới → gửi thông báo
                        console.log(`[Anti-Spam] ✅ NEW video @${username}: ${videoMoiNhat.url}`);

                        const oembed = await layThumbnailVideo(videoMoiNhat.url);
                        const moTa = videoMoiNhat.moTa || oembed.tieuDe || '';
                        const embed = taoEmbedVideo(
                            username, thongTin.tenHienThi,
                            videoMoiNhat.url, moTa,
                            thongTin.anhDaiDien, oembed.thumbnail,
                        );

                        await kenhDiscord.send({
                            content: `@everyone 🎬 **@${thongTin.tenHienThi}** vừa đăng video mới trên TikTok!`,
                            embeds: [embed],
                        });

                        // Đánh dấu đã thông báo
                        cache[username].notifiedVideoIds.push(videoMoiNhat.id);
                        if (cache[username].notifiedVideoIds.length > 20) {
                            cache[username].notifiedVideoIds = cache[username].notifiedVideoIds.slice(-20);
                        }
                    } else {
                        console.log(`[Anti-Spam] 📌 First time @${username}: saved ${videoMoiNhat.id}`);
                    }

                    cache[username].lastVideoId = videoMoiNhat.id;
                } else {
                    console.log(`[Anti-Spam] ✔️ @${username}: no new video (${videoMoiNhat.id})`);
                }
            }

            /* --- Kiểm tra live --- */

            const trangThaiLive = await kiemTraLive(username);
            const tenHienThi = thongTin?.tenHienThi || username;
            const anhDaiDien = thongTin?.anhDaiDien || null;
            const bayGio = Date.now();

            if (trangThaiLive.dangLive && !cache[username].isLive) {
                // Cooldown: chỉ thông báo nếu cách lần trước ≥ 10 phút
                if (bayGio - cache[username].lastLiveNotify > THOI_GIAN_COOLDOWN_LIVE) {
                    console.log(`[Anti-Spam] 🔴 @${username} STARTED LIVE!`);

                    const embed = taoEmbedLive(username, tenHienThi, anhDaiDien);
                    await kenhDiscord.send({
                        content: `@everyone 🔴 **@${tenHienThi}** đang phát trực tiếp trên TikTok!`,
                        embeds: [embed],
                    });
                    cache[username].lastLiveNotify = bayGio;
                } else {
                    console.log(`[Anti-Spam] ⏳ @${username} live but cooldown active`);
                }
                cache[username].isLive = true;
            } else if (!trangThaiLive.dangLive && cache[username].isLive) {
                console.log(`[Anti-Spam] ⚫ @${username} ended live`);
                cache[username].isLive = false;
            }

            // Delay giữa các kênh
            await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (loi) {
            console.error(`[TikTok] ❌ Lỗi @${username}:`, loi.message);
        }
    }

    luuCache(cache);
    console.log(`[TikTok] ✅ Check complete.\n`);
}

module.exports = { kiemTraTatCaKenh };
