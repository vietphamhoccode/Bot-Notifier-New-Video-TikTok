const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { kiemTraQuyen } = require('../utils/permission');
const fs = require('fs');
const path = require('path');

const DUONG_DAN_CONFIG = path.join(__dirname, '..', 'config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('xoa_kenh')
        .setDescription('Xóa kênh TikTok khỏi danh sách theo dõi')
        .addStringOption(option =>
            option
                .setName('username')
                .setDescription('Username TikTok cần xóa (không cần @)')
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

        let username = interaction.options.getString('username').trim();
        if (username.startsWith('@')) username = username.slice(1);

        const viTri = config.list_channel.indexOf(username);
        if (viTri === -1) {
            return interaction.reply({
                content: `⚠️ Kênh **@${username}** không có trong danh sách!`,
                flags: 64,
            });
        }

        // Xóa và lưu
        config.list_channel.splice(viTri, 1);
        fs.writeFileSync(DUONG_DAN_CONFIG, JSON.stringify(config, null, 4), 'utf-8');

        const embed = new EmbedBuilder()
            .setColor(0xFE2C55)
            .setTitle('🗑️ Đã Xóa Kênh TikTok')
            .setDescription(`Kênh **@${username}** đã được xóa khỏi danh sách!`)
            .addFields({
                name: '📋 Còn lại',
                value: `${config.list_channel.length} kênh`,
                inline: true,
            })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};
