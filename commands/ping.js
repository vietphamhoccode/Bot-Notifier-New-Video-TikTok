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

        await interaction.reply({ content: '@everyone', embeds: [embed] });
    },
};
