import { readdirSync, readFileSync } from "fs";
import Client from "../Client";
import dotprop from "dot-prop";
import { join } from "path";

export default class languageHandler {
	public languages: Record<string, Record<string, string>> = {};
	constructor(public client: Client) {}

	public loadAll() {
		this.languages = this.read(join(process.cwd(), "languages"));
	}

	public translate(
		id: string | null | undefined,
		path: string,
		vars: Record<string, unknown> = {}
	): string {
		const language = this.client.config.get(id ?? "")?.language ?? "english";
		const emojis = Object.keys(this.client.constants.emojis).reduce(
			(o, key) =>
				Object.assign(o, {
					[`emoji.${key}`]: (this.client.constants.emojis as Record<string, string>)[key],
				}),
			{}
		);

		return this.get(language, path, { ...emojis, ...vars });
	}

	public get(language: string, _path: string, vars: Record<string, unknown> = {}): string {
		const lang = this.languages[language];
		if (!lang) return `Lanuage ${language} was not found`;

		const [_file, path] = _path.split(":");
		const parsed = this.parse(lang[_file]);

		let data = dotprop.get(parsed, path) as string;
		if (typeof data !== "string" || !data.length) return `${_path} is not a valid language path`;

		for (const key of Object.keys(vars))
			data = data.replace(new RegExp(`{${key}}`, "gi"), `${vars[key]}`);

		const res = data ?? `${_path} is not a valid language path`;
		return res.length > 2e3 ? res.slice(0, 2e3 - 3) + "..." : res;
	}

	private parse(file: string) {
		const data = readFileSync(file, { encoding: "utf8" });
		return JSON.parse(data);
	}

	private read(dir: string): Record<string, Record<string, string>> {
		const data: Record<string, Record<string, string>> = {};

		for (const language of readdirSync(dir)) {
			const final = join(dir, language);
			const files = readdirSync(final);

			data[language] = files.reduce(
				(o, key) => Object.assign(o, { [key.split(".")[0]]: join(final, key) }),
				{}
			);
		}

		return data;
	}
}
