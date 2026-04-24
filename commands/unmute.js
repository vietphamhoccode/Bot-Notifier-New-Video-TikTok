const { SlashCommandBuilder } = require('discord.js');
const { kiemTraQuyen } = require('../utils/permission');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unmute')
        .setDescription('Gỡ mute (timeout) một người dùng')
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('Chọn người dùng cần unmute')
                .setRequired(false)
        )
        .addStringOption(option =>
            option
                .setName('id')
                .setDescription('Hoặc nhập ID người dùng')
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

            // Gỡ timeout bằng cách set null
            await thanhVien.timeout(null, 'Được unmute');

            // Gửi DM (không nói ai unmute)
            try {
                await thanhVien.send(
                    `🔊 Bạn đã được gỡ mute trong server **${interaction.guild.name}**`
                );
            } catch {
                // Không gửi được DM thì bỏ qua
            }

            await interaction.reply({
                content: `✅ Đã unmute **${thanhVien.user.tag}**.`,
                flags: 64,
            });
        } catch (loi) {
            console.error('[Unmute] ❌ Lỗi:', loi.message);
            await interaction.reply({
                content: `❌ Không thể unmute người dùng: ${loi.message}`,
                flags: 64,
            });
        }
    },
};
