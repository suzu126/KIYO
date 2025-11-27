const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');

const shiva = require('../../shiva');

const COMMAND_SECURITY_TOKEN = shiva.SECURITY_TOKEN;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Play a song or add to queue')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('Song name, URL, or search query')
                .setRequired(true)
        ),

    securityToken: COMMAND_SECURITY_TOKEN,

    async execute(interaction, client) {
        if (!shiva || !shiva.validateCore || !shiva.validateCore()) {
            const embed = new EmbedBuilder()
                .setDescription('❌ System core offline - Command unavailable')
                .setColor('#FF0000');
            return interaction.reply({ embeds: [embed], ephemeral: true }).catch(() => {});
        }

        await interaction.deferReply();

        const ConditionChecker = require('../../utils/checks');
        const PlayerHandler = require('../../utils/player');

        const query = interaction.options.getString('query');

        const checker = new ConditionChecker(client);
        const conditions = await checker.checkMusicConditions(
            interaction.guild.id,
            interaction.user.id,
            interaction.member.voice?.channelId
        );

        const errorMsg = checker.getErrorMessage(conditions, 'play');
        if (errorMsg) {
            return interaction.editReply({ content: errorMsg });
        }

        const playerHandler = new PlayerHandler(client);
        const player = await playerHandler.createPlayer(
            interaction.guild.id,
            interaction.member.voice.channelId,
            interaction.channel.id
        );

        const result = await playerHandler.playSong(player, query, interaction.user);

        if (result.type === 'track') {
            const track = result.track;

            const embed = new EmbedBuilder()
                .setColor("#2b2d31")
                .setTitle("🎶 Now Playing")
                .setDescription(`**${track.info.title}**`)
                .setThumbnail(track.info.artworkUrl || null)
                .addFields(
                    { name: "⏱ Duration", value: track.info.length ? `${Math.floor(track.info.length / 60000)}:${("0" + Math.floor((track.info.length % 60000) / 1000)).slice(-2)}` : "Unknown", inline: true },
                    { name: "🎤 Requested by", value: `<@${interaction.user.id}>`, inline: true }
                );

            // Buttons
            const controls = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('pause').setLabel('Pause').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('skip').setLabel('Skip').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('loop').setLabel('Loop').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('shuffle').setLabel('Shuffle').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('stop').setLabel('Stop').setStyle(ButtonStyle.Danger),
            );

            return interaction.editReply({ embeds: [embed], components: [controls] });
        }

        if (result.type === 'playlist') {
            const embed = new EmbedBuilder()
                .setDescription(`📃 Playlist added: **${result.name}**`)
                .setColor("#2b2d31");
            
            return interaction.editReply({ embeds: [embed] });
        }

        return interaction.editReply({ content: "❌ No results found!" });
    }
};
