/**
 * @name FriendsSince
 * @author Doggybootsy
 * @description Shows the date of when and a friend became friends
 * @version 1.1.0
 * @source https://github.com/doggybootsy/BDPlugins/
 */

"use strict";
const { Webpack, Patcher, React, Utils, UI, Logger } = BdApi;
const HEADING_BY_LOCALE = Object.freeze({
	"da": "Venner siden",
	"de": "Freunde seit",
	"en-GB": "Friends since",
	"en-US": "Friends since",
	"es-ES": "Amigos desde",
	"es-419": "Amigos desde",
	"fr": "Amis depuis",
	"hr": "Prijatelji od",
	"it": "Amici dal",
	"lt": "Draugai nuo",
	"hu": "Barátok amióta",
	"nl": "Vrienden sinds",
	"no": "Venner siden",
	"pl": "Znajomi od",
	"pt-BR": "Amigos desde",
	"ro": "Prieteni din",
	"fi": "Ystäviä alkaen",
	"sv-SE": "Vänner sedan",
	"vi": "Bạn bè từ",
	"tr": "Arkadaşlar desde",
	"cs": "Přátelé od",
	"el": "Φίλοι από",
	"bg": "Приятели от",
	"ru": "Друзья с",
	"uk": "Друзі з",
	"hi": "दोस्त तब से",
	"th": "เป็นเพื่อนกันตั้งแต่",
	"zh-CN": "成为好友自",
	"ja": "友達になった日",
	"zh-TW": "成為好友自",
	"ko": "친구가 된 날짜"
});
function getUseStateFromStores() {
	const mangled = Webpack.getMangled(
		m => m.Store,
		{ useStateFromStores: Webpack.Filters.byStrings("useStateFromStores") },
		{ raw: true }
	);
	if (mangled?.useStateFromStores) return mangled.useStateFromStores;
	const useSyncExternalStore = React.useSyncExternalStore;
	return (stores, selector) => {
		if (!stores?.every?.(s => s?.addChangeListener && s?.removeChangeListener) || !useSyncExternalStore) {
			return selector();
		}
		const subscribe = (onStoreChange) => {
			for (const s of stores) s.addChangeListener(onStoreChange);
			return () => { for (const s of stores) s.removeChangeListener(onStoreChange); };
		};
		const getSnapshot = () => selector();
		return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
	};
}
function formatSinceDate(value, locale) {
	if (value == null || value === "") return null;
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return null;
	return date.toLocaleDateString(locale || "en-US", {
		month: "short",
		day: "numeric",
		year: "numeric"
	});
}
function findProfileBody(tree) {
	return Utils.findInTree(
		tree,
		n => n && typeof n.className === "string" && n.className.includes("profileBody"),
		{ walkable: ["props", "children"] }
	);
}
const useStateFromStores = getUseStateFromStores();
function FriendsSinceSection({ userId, RelationshipStore, LocaleStore, Section, Text }) {
	const since = useStateFromStores([RelationshipStore], () => {
		if (!RelationshipStore?.isFriend?.(userId)) return null;
		return RelationshipStore.getSince?.(userId) ?? null;
	});
	if (!since) return null;
	const locale = useStateFromStores([LocaleStore], () => {
		return LocaleStore?.locale ?? "en-US";
	});
	const dateLabel = React.useMemo(
		() => formatSinceDate(since, locale),
		[since, locale]
	);
	if (!dateLabel) return null;
	const heading = HEADING_BY_LOCALE[locale] ?? HEADING_BY_LOCALE["en-US"];
	return React.createElement(Section, {
		heading: heading
	},
		React.createElement(Text, {
			variant: "text-sm/normal"
		}, dateLabel)
	);
}
module.exports = class FriendsSince {
	constructor(meta) {
		this.meta = meta;
		this.abortController = null;
		this.RelationshipStore = null;
		this.LocaleStore = null;
		this.Section = null;
		this.Text = null;
	}
	start() {
		if (this.abortController) {
			this.abortController.abort();
			this.abortController = null;
		}
		this.RelationshipStore = Webpack.getStore("RelationshipStore");
		this.LocaleStore = Webpack.getStore("LocaleStore");
		this.Section = Webpack.getByStrings(".section", "text-xs/medium", "headingColor");
		const TextModule = Webpack.getBySource("data-text-variant");
		if (TextModule?.render) {
			this.Text = TextModule;
		} else if (TextModule) {
			this.Text = Object.values(TextModule)[0];
		} else {
			this.Text = null;
		}
		if (!this.RelationshipStore || !this.LocaleStore) {
			Logger.error(this.meta.name, "Required stores not found (RelationshipStore / LocaleStore).");
			UI.showToast(`${this.meta.name}: failed to find required data stores.`, { type: "error" });
			return;
		}
		if (!this.Section || !this.Text) {
			Logger.error(this.meta.name, "Required UI components not found (Section / Text).");
			UI.showToast(`${this.meta.name}: failed to find required UI components.`, { type: "error" });
			return;
		}
		this.abortController = new AbortController();
		this._init(this.abortController.signal).catch(err => {
			if (err?.name === "AbortError") return;
			Logger.error(this.meta.name, "Failed to initialize FriendsSince.", err);
			UI.showToast(`${this.meta.name}: failed to initialize. See console for details.`, { type: "error" });
		});
	}
	stop() {
		if (this.abortController) {
			this.abortController.abort();
			this.abortController = null;
		}
		Patcher.unpatchAll(this.meta.name);
		this.Section = null;
		this.Text = null;
	}
	async _init(signal) {
		const filter = Webpack.Filters.byStrings("UserProfileModalV2", "USER_PROFILE_MODAL_V2", "MODAL_V2");
		const UserProfileModule = await Webpack.waitForModule(filter, {
			defaultExport: false,
			signal
		});
		if (signal?.aborted) return;
		if (!UserProfileModule?.Z || typeof UserProfileModule.Z !== "function") {
			Logger.error(this.meta.name, "UserProfileModal module not in expected shape.", UserProfileModule);
			UI.showToast(`${this.meta.name}: could not hook user profile.`, { type: "error" });
			return;
		}
		Patcher.after(this.meta.name, UserProfileModule, "Z", (_, [props], returnValue) => {
			try {
				const body = findProfileBody(returnValue);
				if (!body || !Array.isArray(body.children)) return;
				const userId = props?.user?.id;
				if (!userId) return;
				const index = body.children.findIndex(
					child => React.isValidElement(child) &&
						child.props?.heading &&
						child.props?.children?.props?.userId
				);
				if (index === -1) return;
				const alreadyInjected = body.children.some(
					child => React.isValidElement(child) &&
						child.type === FriendsSinceSection
				);
				if (alreadyInjected) return;
				body.children.splice(
					index + 1,
					0,
					React.createElement(FriendsSinceSection, {
						key: `friends-since-${userId}`,
						userId,
						RelationshipStore: this.RelationshipStore,
						LocaleStore: this.LocaleStore,
						Section: this.Section,
						Text: this.Text
					})
				);
			} catch (error) {
				Logger.error(this.meta.name, "Failed to inject FriendsSince section.", error);
			}
		});
	}
};
