const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { kiemTraQuyen } = require('../utils/permission');
const fs = require('fs');
const path = require('path');

const DUONG_DAN_CONFIG = path.join(__dirname, '..', 'config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('add_kenh')
        .setDescription('Thêm kênh TikTok vào danh sách theo dõi')
        .addStringOption(option =>
            option
                .setName('username')
                .setDescription('Username TikTok (không cần @)')
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

        // Kiểm tra trùng
        if (config.list_channel.includes(username)) {
            return interaction.reply({
                content: `⚠️ Kênh **@${username}** đã có trong danh sách rồi!`,
                flags: 64,
            });
        }

        // Thêm và lưu
        config.list_channel.push(username);
        fs.writeFileSync(DUONG_DAN_CONFIG, JSON.stringify(config, null, 4), 'utf-8');

        const embed = new EmbedBuilder()
            .setColor(0x25F4EE)
            .setTitle('✅ Đã Thêm Kênh TikTok')
            .setDescription(`Kênh **@${username}** đã được thêm vào danh sách theo dõi!`)
            .addFields({
                name: '📋 Tổng kênh',
                value: `${config.list_channel.length}`,
                inline: true,
            })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};
