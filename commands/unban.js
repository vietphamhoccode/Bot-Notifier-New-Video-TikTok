const { SlashCommandBuilder } = require('discord.js');
const { kiemTraQuyen } = require('../utils/permission');
const { huyTimerUnban } = require('../utils/banManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unban')
        .setDescription('Unban một người dùng')
        .addStringOption(option =>
            option
                .setName('user')
                .setDescription('ID của người dùng cần unban')
                .setRequired(true)
        ),

    async execute(interaction, config) {
        const danhSachQuyen = (config.list_id_role_permission || []).map(String);

        if (!kiemTraQuyen(interaction.member, danhSachQuyen)) {
            return interaction.reply({
                content: '❌ Bạn không có quyền sử dụng lệnh này!',
                flags: 64,
            });
        }

        const userId = interaction.options.getString('user').trim();

        // Validate ID format
        if (!/^\d{17,20}$/.test(userId)) {
            return interaction.reply({
                content: '❌ ID không hợp lệ! ID phải là một dãy số (17-20 chữ số).',
                flags: 64,
            });
        }

        try {
            await interaction.guild.members.unban(userId, 'Được unban');

            // Hủy timer tự unban nếu có
            huyTimerUnban(userId);

            // Phản hồi ephemeral
            await interaction.reply({
                content: `✅ Đã unban người dùng có ID **${userId}**.`,
                flags: 64,
            });
        } catch (loi) {
            console.error('[Unban] ❌ Lỗi:', loi.message);

            if (loi.code === 10026) {
                await interaction.reply({
                    content: '❌ Người dùng này không bị ban!',
                    flags: 64,
                });
            } else {
                await interaction.reply({
                    content: `❌ Không thể unban: ${loi.message}`,
                    flags: 64,
                });
            }
        }
    },
};
