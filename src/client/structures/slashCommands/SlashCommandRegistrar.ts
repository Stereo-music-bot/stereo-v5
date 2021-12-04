import { SlashCommand, SlashCommandStore } from ".";
import { ApplicationCommandData, Collection } from "discord.js";
import Logger from "../Logger";
import Client from "../../Client";

export class SlashCommandRegistrar {
	private logger = new Logger({ name: "Registrar" });

	private slashStore!: SlashCommandStore;

	private hidden!: Collection<string, SlashCommand>;
	private global!: Collection<string, SlashCommand>;

	public constructor(private client: Client) {}

	public async refresh(): Promise<void> {
		this.slashStore = this.client.stores.get("slashCommands");

		const [hidden, global] = this.slashStore.partition((c) => c.ownerOnly);
		this.hidden = hidden;
		this.global = global;

		if (process.env.NODE_ENV === "development") {
			await this.testGuildRegister(true);
			await this.supportGuildRegister(true);
		} else {
			await this.testGuildRegister(false);
			await this.supportGuildRegister(false);
			await this.globalRegister();
		}
	}

	public async testGuildRegister(full = false): Promise<void> {
		const guild = this.client.guilds.cache.get(process.env.TEST_GUILD as string);
		if (!guild) {
			this.logger.warn(
				`Guild "${process.env.TEST_GUILD}" not found, cannot refresh the slash commands.`
			);
			return;
		}

		const _commands = full ? this.slashStore : this.hidden;
		const commands = _commands.map<ApplicationCommandData>((slash) => ({
			description: slash.description,
			name: slash.name,
			defaultPermission: slash.defaultPermission,
			options: slash.arguments,
		}));

		await guild.commands.set(commands);
		this.logger.info("Successfully refreshed slash commands for test guild.");
	}

	public async supportGuildRegister(full = false): Promise<void> {
		const guild = this.client.guilds.cache.get(process.env.SUPPORT_GUILD as string);
		if (!guild) {
			this.logger.warn(
				`Guild "${process.env.SUPPORT_GUILD}" not found, cannot refresh the slash commands.`
			);
			return;
		}

		const _commands = full ? this.slashStore : this.hidden;
		const commands = _commands.map<ApplicationCommandData>((slash) => ({
			description: slash.description,
			name: slash.name,
			defaultPermission: slash.defaultPermission,
			options: slash.arguments,
		}));

		await guild.commands.set(commands);
		this.logger.info("Successfully refreshed slash commands for support guild.");
	}

	public async globalRegister(): Promise<void> {
		const commands = this.global.map<ApplicationCommandData>((slash) => ({
			description: slash.description,
			name: slash.name,
			defaultPermission: slash.defaultPermission,
			options: slash.arguments,
			type: "MESSAGE",
		}));

		if (!this.client.application) {
			this.logger.fatal("No client.application class, unable to refresh global slash commands!");
			return;
		}

		await this.client.application.commands.set(commands);
		this.logger.debug("Successfully refreshed global slash commands.");
	}
}
