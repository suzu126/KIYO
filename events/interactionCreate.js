module.exports = {
    name: "interactionCreate",

    async execute(interaction, client) {
        if (!interaction.isButton()) return;

        const player = client.riffy.players.get(interaction.guild.id);
        if (!player) {
            return interaction.reply({ content: "❌ No music playing!", ephemeral: true });
        }

        switch (interaction.customId) {
            case "pause":
                player.pause(!player.paused);
                interaction.reply({ content: `⏯️ Pause toggled`, ephemeral: true });
                break;

            case "skip":
                player.stop();
                interaction.reply({ content: `⏭️ Skipped`, ephemeral: true });
                break;

            case "loop":
                player.setTrackRepeat(!player.trackRepeat);
                interaction.reply({ content: `🔁 Loop toggled`, ephemeral: true });
                break;

            case "shuffle":
                player.queue.shuffle();
                interaction.reply({ content: `🔀 Shuffled queue`, ephemeral: true });
                break;

            case "stop":
                player.destroy();
                interaction.reply({ content: `⏹️ Music stopped`, ephemeral: true });
                break;
        }
    }
};
