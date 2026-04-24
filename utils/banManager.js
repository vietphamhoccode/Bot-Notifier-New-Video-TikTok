const fs = require('fs');
const path = require('path');

const DUONG_DAN_BANS = path.join(__dirname, '..', 'data', 'bans.json');

// Đọc danh sách ban từ file
function docDanhSachBan() {
    try {
        if (!fs.existsSync(DUONG_DAN_BANS)) return [];
        return JSON.parse(fs.readFileSync(DUONG_DAN_BANS, 'utf-8'));
    } catch {
        return [];
    }
}

// Ghi danh sách ban vào file
function ghiDanhSachBan(danhSach) {
    fs.writeFileSync(DUONG_DAN_BANS, JSON.stringify(danhSach, null, 4), 'utf-8');
}

// Lưu ban có thời hạn
function luuBan(userId, guildId, thoiGianUnban) {
    const danhSach = docDanhSachBan();
    // Xóa nếu đã tồn tại
    const danhSachMoi = danhSach.filter(b => b.userId !== userId);
    danhSachMoi.push({ userId, guildId, thoiGianUnban });
    ghiDanhSachBan(danhSachMoi);
}

// Xóa ban khỏi danh sách
function xoaBan(userId) {
    const danhSach = docDanhSachBan();
    const danhSachMoi = danhSach.filter(b => b.userId !== userId);
    ghiDanhSachBan(danhSachMoi);
}

// Map lưu timer đang chạy
const timerDangChay = new Map();

// Đặt timer unban
function datTimerUnban(client, userId, guildId, thoiGianUnban) {
    // Xóa timer cũ nếu có
    if (timerDangChay.has(userId)) {
        clearTimeout(timerDangChay.get(userId));
    }

    const thoiGianCon = thoiGianUnban - Date.now();
    if (thoiGianCon <= 0) {
        // Đã quá hạn, unban ngay
        thucHienUnban(client, userId, guildId);
        return;
    }

    // Giới hạn setTimeout tối đa ~24.8 ngày (2^31 - 1 ms)
    const MAX_TIMEOUT = 2147483647;
    const thoiGianDat = Math.min(thoiGianCon, MAX_TIMEOUT);

    const timer = setTimeout(() => {
        timerDangChay.delete(userId);
        if (thoiGianCon > MAX_TIMEOUT) {
            // Nếu còn dư, đặt timer tiếp
            datTimerUnban(client, userId, guildId, thoiGianUnban);
        } else {
            thucHienUnban(client, userId, guildId);
        }
    }, thoiGianDat);

    timerDangChay.set(userId, timer);
}

// Thực hiện unban
async function thucHienUnban(client, userId, guildId) {
    try {
        const guild = await client.guilds.fetch(guildId);
        await guild.members.unban(userId, 'Hết thời hạn ban');
        console.log(`[Ban] ✅ Đã tự động unban user ${userId}`);
    } catch (loi) {
        console.error(`[Ban] ❌ Lỗi tự động unban ${userId}:`, loi.message);
    }
    xoaBan(userId);
}

// Hủy timer unban (khi unban thủ công)
function huyTimerUnban(userId) {
    if (timerDangChay.has(userId)) {
        clearTimeout(timerDangChay.get(userId));
        timerDangChay.delete(userId);
    }
    xoaBan(userId);
}

// Khôi phục tất cả timer khi bot khởi động
function napLaiTimer(client) {
    const danhSach = docDanhSachBan();
    let dem = 0;
    for (const ban of danhSach) {
        datTimerUnban(client, ban.userId, ban.guildId, ban.thoiGianUnban);
        dem++;
    }
    if (dem > 0) {
        console.log(`[Ban] 🔄 Đã khôi phục ${dem} timer tự unban`);
    }
}

module.exports = { luuBan, xoaBan, datTimerUnban, huyTimerUnban, napLaiTimer };
