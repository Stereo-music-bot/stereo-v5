import { PreconditionOptions, PieceContext, Precondition as SapphirePrecondition, PreconditionResult } from "@sapphire/framework";
import type { TranslationManager } from "../..";
import type { Client } from "../../../";

export abstract class Precondition extends SapphirePrecondition {
	public client: Client;
	public translate: TranslationManager;

	public constructor(context: Precondition.Context, options: PreconditionOptions) {
		super(context, options);

		this.client = this.container.client as Client;
		this.translate = this.client.translationManager;
	}
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Precondition {
	export type Context = PieceContext;
	export type Result = PreconditionResult;
}
