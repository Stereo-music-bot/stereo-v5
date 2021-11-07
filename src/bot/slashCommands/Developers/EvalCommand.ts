import { SlashCommand } from "../../../client";
import { ApplyOptions } from "@sapphire/decorators";
import type { CommandInteraction } from "discord.js";
import Type from "@sapphire/type";
import { codeBlock } from "@sapphire/utilities";
import { inspect } from "util";

@ApplyOptions<SlashCommand.Options>({
	name: "eval",
	description: "Execute any JavaScript code (devs only)",
	preconditions: ["OwnerOnly"],
	arguments: [
		{
			name: "code",
			description: "Code to execute",
			type: "STRING",
			required: true
		},
		{
			name: "async",
			description: "If async should be enabled",
			type: "BOOLEAN",
			required: false
		},
		{
			name: "depth",
			description: "The inspect depth",
			type: "INTEGER",
			required: false
		},
		{
			name: "hidden",
			description: "Show hidden items",
			type: "BOOLEAN",
			required: false
		},
		{
			name: "silent",
			description: "If the response should be silent",
			type: "BOOLEAN",
			required: false
		}
	]
})
export default class PingCommand extends SlashCommand {
	public async run(interaction: CommandInteraction, args: SlashCommand.Args) {
		const code = args.getString("code", true);
		await interaction.deferReply({ ephemeral: args.getBoolean("silent") ?? false });

		const { result, success, type } = await this.eval(interaction, code, {
			async: args.getBoolean("async") ?? false,
			depth: Number(args.getInteger("depth")) ?? 0,
			showHidden: args.getBoolean("hidden") ?? false
		});

		const output = success ? codeBlock("js", result) : `**Error**: ${codeBlock("bash", result)}`;
		if (args.getBoolean("silent")) return interaction.followUp({ content: "Executed!", ephemeral: true });

		const typeFooter = `**Type**: ${codeBlock("typescript", type)}`;

		if (output.length > 2000)
			return interaction.followUp({
				files: [{ attachment: Buffer.from(output), name: "output.txt" }],
				content: `Output was too long... sent the result as a file.\n\n${typeFooter}`
			});

		return interaction.followUp(`${output}\n${typeFooter}`);
	}

	private async eval(commandInteraction: CommandInteraction, code: string, flags: { async: boolean; depth: number; showHidden: boolean }) {
		if (flags.async) code = `(async () => {\n${code}\n})();`;

		// @ts-ignore otherwise "interaction is not defined"
		const interaction = commandInteraction;
		let success = true;
		let result = null;

		try {
			// eslint-disable-next-line no-eval
			result = await eval(code);
		} catch (error) {
			result = error;
			success = false;
		}

		const type = new Type(result).toString();

		if (typeof result !== "string")
			result = inspect(result, {
				depth: flags.depth,
				showHidden: flags.showHidden
			});

		return { result, success, type };
	}
}
