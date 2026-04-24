const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { kiemTraQuyen } = require('../utils/permission');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Ping mọi người với nội dung tùy chỉnh')
        .addStringOption(option =>
            option
                .setName('content')
                .setDescription('Nội dung thông báo')
                .setRequired(true)
        ),

    async execute(interaction, config) {
        const danhSachQuyen = (config.list_id_role_permission || []).map(String);

        if (!kiemTraQuyen(interaction.member, danhSachQuyen)) {
            return interaction.reply({
                content: '❌ Bạn không có quyền sử dụng lệnh này!',
                flags: 64, // Ephemeral
            });
        }

        const noiDung = interaction.options.getString('content');

        const embed = new EmbedBuilder()
            .setColor(0xFF0050)
            .setTitle('📢 Thông Báo')
            .setDescription(noiDung)
            .setFooter({
                text: `Gửi bởi ${interaction.user.displayName}`,
                iconURL: interaction.user.displayAvatarURL(),
            })
            .setTimestamp();

        // Gửi @everyone riêng để Discord ping thông báo
        await interaction.channel.send('@everyone');
        // Gửi embed riêng
        await interaction.channel.send({ embeds: [embed] });
        // Phản hồi ephemeral cho người dùng lệnh
        await interaction.reply({ content: '✅ Đã gửi thông báo!', flags: 64 });
    },
};
