/**
 * @name MobileForAll
 * @author Doggybootsy
 * @description Make the mobile indicator have priority instead of the VR or desktop indicators
 * @version 1.0.2
 * @source https://github.com/doggybootsy/BDPlugins/blob/main/mobile-for-all/MobileForAll.plugin.js
 */

module.exports = (meta) => {
	const BdApi = new window.BdApi(meta.name);

	const {Patcher} = BdApi;
	const {Filters, getBulkKeyed, Stores} = BdApi.Webpack;

	const {AvatarMask} = getBulkKeyed({
		AvatarMask: {
			filter: Filters.bySource(".AVATAR_STATUS_ROUND_40;"),
			searchDefault: false,
			map: {
				SmartAvatar: m => m.type,
				Avatar: Filters.byStrings("Math.ceil")
			}
		}
	});

	return {
		start() {
			Patcher.instead(Stores.PresenceStore, "isMobileOnline", (that, [userId]) => {
				const status = Stores.PresenceStore.getClientStatus(userId);

				return status && !!status.mobile && status.mobile !== "unknown";
			});

			Patcher.before(AvatarMask, "Avatar", (that, args) => {
				if (args[0]?.isMobile && args[0].status !== "unknown") {
					args[0] = {
						...args[0],
						status: "online",
						isVR: false
					};
				}
			});

			Patcher.after(AvatarMask.SmartAvatar, "type", (that, [props], ret) => {
				ret.type = AvatarMask.Avatar;
			});
		},
		stop() {
			Patcher.unpatchAll();
		}
	};
};
