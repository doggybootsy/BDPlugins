/**
 * @name FriendsSince
 * @author Doggybootsy
 * @description Shows the date of when and a friend became friends
 * @version 1.0.14
 * @source https://github.com/doggybootsy/BDPlugins/
 */

module.exports = (meta) => {
	const {Patcher, Webpack, Utils, React, Hooks, UI} = new BdApi(meta.name);

	const h = React.createElement;

	const UserProfileModalV2Promise = Webpack.waitForModule(Webpack.Filters.byStrings("UserProfileModalV2", "MODAL_V2", "USER_PROFILE_MODAL_V2"), {
		defaultExport: false
	});

	function findInReactTree(tree, filter) {
		return Utils.findInTree(tree, filter, {walkable: ["props", "children"]});
	}

	function getCreatedAt(value, lang) {
		if (null == value || "" === value) return null;
		const data = new Date(value);
		return !(data instanceof Date) || isNaN(data.getTime()) ? null : data.toLocaleDateString(lang, {
			month: "short",
			day: "numeric",
			year: "numeric"
		});
	}

	let Section;
	let Text;

	UserProfileModalV2Promise.then(() => {
		({Section, TextBase: {Text}} = Webpack.getBulkKeyed({
			Section: {
				filter: Webpack.Filters.byStrings("()(", "text-xs/medium", "headingColor")
			},
			TextBase: {
				filter: Webpack.Filters.bySource("data-text-variant"),
				searchDefault: false,
				map: {
					Text: () => true
				}
			},
		}));
	});

	function useHeading(locale) {
		return React.useMemo(() => {
			switch (locale) {
				case "da": return "Venner siden";
				case "de": return "Freunde seit";
				case "en-GB": return "Friends since";
				case "en-US": return "Friends since";
				case "es-ES": return "Amigos desde";
				case "es-419": return "Amigos desde";
				case "fr": return "Amis depuis";
				case "hr": return "Prijatelji od";
				case "it": return "Amici dal";
				case "lt": return "Draugai nuo";
				case "hu": return "Barátok amióta";
				case "nl": return "Vrienden sinds";
				case "no": return "Venner siden";
				case "pl": return "Znajomi od";
				case "pt-BR": return "Amigos desde";
				case "ro": return "Prieteni din";
				case "fi": return "Ystäviä alkaen";
				case "sv-SE": return "Vänner sedan";
				case "vi": return "Bạn bè từ";
				case "tr": return "Arkadaşlar desde";
				case "cs": return "Přátelé od";
				case "el": return "Φίλοι από";
				case "bg": return "Приятели от";
				case "ru": return "Друзья с";
				case "uk": return "Друзі з";
				case "hi": return "दोस्त तब से";
				case "th": return "เป็นเพื่อนกันตั้งแต่";
				case "zh-CN": return "成为好友自";
				case "ja": return "友達になった日";
				case "zh-TW": return "成為好友自";
				case "ko": return "친구가 된 날짜";
				default: return "Friends since";
			}
		}, [locale]);
	}

	function FriendsSince({userId}) {
		const since = Hooks.useStateFromStores(Webpack.Stores.RelationshipStore, () => {
			if (!Webpack.Stores.RelationshipStore.isFriend(userId)) return null;

			return Webpack.Stores.RelationshipStore.getSince(userId);
		});

		const locale = Hooks.useStateFromStores(Webpack.Stores.LocaleStore, () => Webpack.Stores.LocaleStore.locale);

		const time = React.useMemo(() => since && getCreatedAt(since, locale), [since, locale]);

		const heading = useHeading(locale);

		if (!time) return null;

		return h(Section, {
			heading,
			children: h(Text, {
				variant: "text-xs/medium",
				children: time
			})
		});
	}

	const [race, reject] = (() => {
		let reject;
		return [
			(promise) => Promise.race([
				promise,
				{
					then: (r) => reject = r
				}
			]),
			(reason) => reject(reason)
		];
	})();

	return {
		async start() {
			const UserProfileModalV2 = await race(UserProfileModalV2Promise);

			if (!UserProfileModalV2) {
				UI.showToast("FriendsSince failed to load!.", {type: "error"});
				return;
			}

			Patcher.after(UserProfileModalV2, "A", (_, [props], ret) => {
				const profileBody = findInReactTree(ret, (e) => e?.className?.includes("profileBody"));

				if (!profileBody) return;

				const index = profileBody.children.findIndex((e) => React.isValidElement(e) && e.props.heading && e.props?.children?.props?.userId);

				if (index === -1) return;

				profileBody.children.splice(index + 1, 0,
					h(FriendsSince, {userId: props.user.id})
				);
			});
		},
		stop() {
			reject();
			Patcher.unpatchAll();
		}
	};
};
