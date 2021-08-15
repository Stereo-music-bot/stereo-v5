import type { CommandInteraction } from "discord.js";
import {
	Identifiers,
	SlashCommandPreconditionResult,
	SlashCommandPrecondition,
} from "../../../client/structures/slashCommands";

export class CorePrecondition extends SlashCommandPrecondition {
	public run(interaction: CommandInteraction): SlashCommandPreconditionResult {
		// `nsfw` is undefined in DMChannel, doing `=== true`
		// will result on it returning`false`.
		return Reflect.get(interaction.channel ?? {}, "nsfw") === true
			? this.ok()
			: this.error({
					identifier: Identifiers.PreconditionNSFW,
					message: "You cannot run this command outside NSFW channels.",
			  });
	}
}
