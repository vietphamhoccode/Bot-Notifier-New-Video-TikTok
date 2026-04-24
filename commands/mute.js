const { SlashCommandBuilder } = require('discord.js');
const { kiemTraQuyen } = require('../utils/permission');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mute')
        .setDescription('Timeout (mute) một người dùng')
        .addIntegerOption(option =>
            option
                .setName('time')
                .setDescription('Thời gian mute (phút)')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(40320) // 28 ngày = 40320 phút
        )
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('Chọn người dùng cần mute')
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
                .setDescription('Lý do mute')
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
        const thoiGianPhut = interaction.options.getInteger('time');

        // Lấy ID người dùng
        const userId = nguoiDung ? nguoiDung.id : idNhap;

        if (!userId) {
            return interaction.reply({
                content: '❌ Bạn phải chọn người dùng hoặc nhập ID!',
                flags: 64,
            });
        }

        try {
            const thanhVien = await interaction.guild.members.fetch(userId);

            if (!thanhVien) {
                return interaction.reply({
                    content: '❌ Không tìm thấy người dùng trong server!',
                    flags: 64,
                });
            }

            // Không cho mute bot hoặc người có quyền cao hơn
            if (!thanhVien.moderatable) {
                return interaction.reply({
                    content: '❌ Không thể mute người dùng này (quyền cao hơn bot)!',
                    flags: 64,
                });
            }

            const thoiGianMs = thoiGianPhut * 60 * 1000;
            await thanhVien.timeout(thoiGianMs, liDo);

            // Gửi DM cho người bị mute (không nói ai mute)
            try {
                await thanhVien.send(
                    `🔇 Bạn đã bị mute trong server **${interaction.guild.name}**\n` +
                    `📝 Lý do: ${liDo}\n` +
                    `⏱️ Thời gian: ${thoiGianPhut} phút`
                );
            } catch {
                // Không gửi được DM thì bỏ qua
            }

            // Phản hồi ephemeral - chỉ người dùng lệnh thấy
            await interaction.reply({
                content: `✅ Đã mute **${thanhVien.user.tag}** trong ${thoiGianPhut} phút.\n📝 Lý do: ${liDo}`,
                flags: 64,
            });
        } catch (loi) {
            console.error('[Mute] ❌ Lỗi:', loi.message);
            await interaction.reply({
                content: `❌ Không thể mute người dùng: ${loi.message}`,
                flags: 64,
            });
        }
    },
};
