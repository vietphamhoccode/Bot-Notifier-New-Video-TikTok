const { SlashCommandBuilder } = require('discord.js');
const { kiemTraQuyen } = require('../utils/permission');
const { luuBan, datTimerUnban } = require('../utils/banManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Ban một người dùng khỏi server')
        .addIntegerOption(option =>
            option
                .setName('time')
                .setDescription('Thời gian ban (ngày), 0 = vĩnh viễn')
                .setRequired(true)
                .setMinValue(0)
        )
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('Chọn người dùng cần ban')
                .setRequired(false)
        )
        .addStringOption(option =>
            option
                .setName('id')
                .setDescription('Hoặc nhập ID người dùng')
                .setRequired(false)
        )
        .addStringOption(option =>
            option
                .setName('reason')
                .setDescription('Lý do ban')
                .setRequired(false)
        ),

    async execute(interaction, config) {
        const danhSachQuyen = (config.list_id_role_permission || []).map(String);

        if (!kiemTraQuyen(interaction.member, danhSachQuyen)) {
            return interaction.reply({
                content: '❌ Bạn không có quyền sử dụng lệnh này!',
                flags: 64,
            });
        }

        const nguoiDung = interaction.options.getUser('user');
        const idNhap = interaction.options.getString('id');
        const liDo = interaction.options.getString('reason') || 'Không có lý do';
        const thoiGianNgay = interaction.options.getInteger('time');

        // Lấy ID người dùng
        const userId = nguoiDung ? nguoiDung.id : idNhap;

        if (!userId) {
            return interaction.reply({
                content: '❌ Bạn phải chọn người dùng hoặc nhập ID!',
                flags: 64,
            });
        }

        try {
            // Thử lấy member để gửi DM trước khi ban
            let thanhVien = null;
            try {
                thanhVien = await interaction.guild.members.fetch(userId);
            } catch {
                // User có thể không trong server
            }

            const loaiBan = thoiGianNgay === 0 ? 'vĩnh viễn' : `${thoiGianNgay} ngày`;

            // Gửi DM trước khi ban (không nói ai ban)
            if (thanhVien) {
                if (!thanhVien.bannable) {
                    return interaction.reply({
                        content: '❌ Không thể ban người dùng này (quyền cao hơn bot)!',
                        flags: 64,
                    });
                }

                try {
                    await thanhVien.send(
                        `🔨 Bạn đã bị ban khỏi server **${interaction.guild.name}**\n` +
                        `📝 Lý do: ${liDo}\n` +
                        `⏱️ Thời hạn: ${loaiBan}`
                    );
                } catch {
                    // Không gửi được DM thì bỏ qua
                }
            }

            // Thực hiện ban
            await interaction.guild.members.ban(userId, {
                reason: liDo,
                deleteMessageSeconds: 0,
            });

            // Nếu ban có thời hạn, lưu timer
            if (thoiGianNgay > 0) {
                const thoiGianUnban = Date.now() + (thoiGianNgay * 24 * 60 * 60 * 1000);
                luuBan(userId, interaction.guild.id, thoiGianUnban);
                datTimerUnban(interaction.client, userId, interaction.guild.id, thoiGianUnban);
            }

            // Lấy tag hiển thị
            const tenHienThi = thanhVien
                ? thanhVien.user.tag
                : (nguoiDung ? nguoiDung.tag : userId);

            // Phản hồi ephemeral
            await interaction.reply({
                content: `✅ Đã ban **${tenHienThi}** (${loaiBan}).\n📝 Lý do: ${liDo}`,
                flags: 64,
            });
        } catch (loi) {
            console.error('[Ban] ❌ Lỗi:', loi.message);
            await interaction.reply({
                content: `❌ Không thể ban người dùng: ${loi.message}`,
                flags: 64,
            });
        }
    },
};
