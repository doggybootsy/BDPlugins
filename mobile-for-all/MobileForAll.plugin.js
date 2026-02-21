/**
 * @name MobileForAll
 * @author Doggybootsy
 * @description Make the mobile indicator have priority instead of the VR or desktop indicators
 * @version 1.0.2
 * @source https://github.com/doggybootsy/BDPlugins/blob/main/mobile-for-all/MobileForAll.plugin.js
 */

module.exports = (meta) => {
	const BdApi = new window.BdApi(meta.name);

	const {Patcher, React, ReactUtils} = BdApi;
	const {Filters, getBulkKeyed, Stores} = BdApi.Webpack;

	const {Mask, StatusIndicatorMask, AvatarMask, Sizes, IndicatorSizes} = getBulkKeyed({
		Mask: {
			filter: m => typeof m === "function" && m.Masks
		},
		StatusIndicatorMask: {
			filter: Filters.bySource(".Masks.STATUS_ONLINE_MOBILE"),
			searchDefault: false,
			map: {
				getMaskId: Filters.byStrings(".Masks.STATUS_ONLINE_MOBILE"),
				getStatusBackgroundColor: Filters.byStrings(".IDLE", ".HIGH")
			}
		},
		AvatarMask: {
			filter: Filters.bySource(".AVATAR_STATUS_ROUND_40;"),
			searchDefault: false,
			map: {
				// Idk man
				SmartAvatar: m => m.type,
				Avatar: Filters.byStrings("Math.ceil"),
				getRect: m => m.length > 1,
				AvatarImg: m => m.render
			}
		},
		Sizes: {
			filter: m => m.SIZE_16 && m.SIZE_120,
			searchExports: true
		},
		IndicatorSizes: {
			filter: Filters.bySource("SIZE_40:Object"),
			searchDefault: false,
			map: {
				getDimensions: m => typeof m === "function" && !String(m).includes("number")
			}
		}
	});

	function getMaskId(status, size, isMobile, isTyping) {
		if (null == status)
			return Mask.Masks.AVATAR_DEFAULT;

		if (isTyping)
			switch (size) {
				case Sizes.SIZE_16:
					return Mask.Masks.AVATAR_STATUS_TYPING_16;
				case Sizes.SIZE_20:
					return Mask.Masks.AVATAR_STATUS_TYPING_20;
				case Sizes.SIZE_24:
					return Mask.Masks.AVATAR_STATUS_TYPING_24;
				case Sizes.SIZE_32:
					return Mask.Masks.AVATAR_STATUS_TYPING_32;
				case Sizes.SIZE_40:
					return Mask.Masks.AVATAR_STATUS_TYPING_40;
				case Sizes.SIZE_44:
					return Mask.Masks.AVATAR_STATUS_TYPING_44;
				case Sizes.SIZE_48:
					return Mask.Masks.AVATAR_STATUS_TYPING_48;
				case Sizes.SIZE_56:
					return Mask.Masks.AVATAR_STATUS_TYPING_56;
				case Sizes.SIZE_72:
					return Mask.Masks.AVATAR_STATUS_TYPING_72;
				case Sizes.SIZE_80:
					return Mask.Masks.AVATAR_STATUS_TYPING_80;
				case Sizes.SIZE_96:
					return Mask.Masks.AVATAR_STATUS_TYPING_96;
				case Sizes.SIZE_120:
					return Mask.Masks.AVATAR_STATUS_TYPING_120;
			}

		if (isMobile)
			switch (size) {
				case Sizes.SIZE_16:
					return Mask.Masks.AVATAR_STATUS_MOBILE_16;
				case Sizes.SIZE_20:
					return Mask.Masks.AVATAR_STATUS_MOBILE_20;
				case Sizes.SIZE_24:
					return Mask.Masks.AVATAR_STATUS_MOBILE_24;
				case Sizes.SIZE_32:
					return Mask.Masks.AVATAR_STATUS_MOBILE_32;
				case Sizes.SIZE_40:
					return Mask.Masks.AVATAR_STATUS_MOBILE_40;
				case Sizes.SIZE_44:
					return Mask.Masks.AVATAR_STATUS_MOBILE_44;
				case Sizes.SIZE_48:
					return Mask.Masks.AVATAR_STATUS_MOBILE_48;
				case Sizes.SIZE_56:
					return Mask.Masks.AVATAR_STATUS_MOBILE_56;
				case Sizes.SIZE_72:
					return Mask.Masks.AVATAR_STATUS_MOBILE_72;
				case Sizes.SIZE_80:
					return Mask.Masks.AVATAR_STATUS_MOBILE_80;
				case Sizes.SIZE_96:
					return Mask.Masks.AVATAR_STATUS_MOBILE_96;
				case Sizes.SIZE_120:
					return Mask.Masks.AVATAR_STATUS_MOBILE_120;
			}

		switch (size) {
			case Sizes.SIZE_16:
				return Mask.Masks.AVATAR_STATUS_ROUND_16;
			case Sizes.SIZE_20:
				return Mask.Masks.AVATAR_STATUS_ROUND_20;
			case Sizes.SIZE_24:
				return Mask.Masks.AVATAR_STATUS_ROUND_24;
			case Sizes.SIZE_32:
				return Mask.Masks.AVATAR_STATUS_ROUND_32;
			case Sizes.SIZE_40:
				return Mask.Masks.AVATAR_STATUS_ROUND_40;
			case Sizes.SIZE_44:
				return Mask.Masks.AVATAR_STATUS_ROUND_44;
			case Sizes.SIZE_48:
				return Mask.Masks.AVATAR_STATUS_ROUND_48;
			case Sizes.SIZE_56:
				return Mask.Masks.AVATAR_STATUS_ROUND_56;
			case Sizes.SIZE_72:
				return Mask.Masks.AVATAR_STATUS_ROUND_72;
			case Sizes.SIZE_80:
				return Mask.Masks.AVATAR_STATUS_ROUND_80;
			case Sizes.SIZE_96:
				return Mask.Masks.AVATAR_STATUS_ROUND_96;
			case Sizes.SIZE_120:
				return Mask.Masks.AVATAR_STATUS_ROUND_120;
		}

		throw Error(`getMaskId(): Unsupported type, size: ${size}, status: ${status}, isMobile: ${isMobile ? "true" : "false"}`);
	}

	function getDecorationMaskId(status, size, isMobile, isTyping) {
		if (null == status)
			return null;

		if (isTyping)
			switch (size) {
				case Sizes.SIZE_16:
					return Mask.Masks.AVATAR_DECORATION_STATUS_TYPING_16;
				case Sizes.SIZE_20:
					return Mask.Masks.AVATAR_DECORATION_STATUS_TYPING_20;
				case Sizes.SIZE_24:
					return Mask.Masks.AVATAR_DECORATION_STATUS_TYPING_24;
				case Sizes.SIZE_32:
					return Mask.Masks.AVATAR_DECORATION_STATUS_TYPING_32;
				case Sizes.SIZE_40:
					return Mask.Masks.AVATAR_DECORATION_STATUS_TYPING_40;
				case Sizes.SIZE_44:
					return Mask.Masks.AVATAR_DECORATION_STATUS_TYPING_44;
				case Sizes.SIZE_48:
					return Mask.Masks.AVATAR_DECORATION_STATUS_TYPING_48;
				case Sizes.SIZE_56:
					return Mask.Masks.AVATAR_DECORATION_STATUS_TYPING_56;
				case Sizes.SIZE_72:
					return Mask.Masks.AVATAR_DECORATION_STATUS_TYPING_72;
				case Sizes.SIZE_80:
					return Mask.Masks.AVATAR_DECORATION_STATUS_TYPING_80;
				case Sizes.SIZE_96:
					return Mask.Masks.AVATAR_DECORATION_STATUS_TYPING_96;
				case Sizes.SIZE_120:
					return Mask.Masks.AVATAR_DECORATION_STATUS_TYPING_120;
			}

		if (isMobile)
			switch (size) {
				case Sizes.SIZE_16:
					return Mask.Masks.AVATAR_DECORATION_STATUS_MOBILE_16;
				case Sizes.SIZE_20:
					return Mask.Masks.AVATAR_DECORATION_STATUS_MOBILE_20;
				case Sizes.SIZE_24:
					return Mask.Masks.AVATAR_DECORATION_STATUS_MOBILE_24;
				case Sizes.SIZE_32:
					return Mask.Masks.AVATAR_DECORATION_STATUS_MOBILE_32;
				case Sizes.SIZE_40:
					return Mask.Masks.AVATAR_DECORATION_STATUS_MOBILE_40;
				case Sizes.SIZE_44:
					return Mask.Masks.AVATAR_DECORATION_STATUS_MOBILE_44;
				case Sizes.SIZE_48:
					return Mask.Masks.AVATAR_DECORATION_STATUS_MOBILE_48;
				case Sizes.SIZE_56:
					return Mask.Masks.AVATAR_DECORATION_STATUS_MOBILE_56;
				case Sizes.SIZE_72:
					return Mask.Masks.AVATAR_DECORATION_STATUS_MOBILE_72;
				case Sizes.SIZE_80:
					return Mask.Masks.AVATAR_DECORATION_STATUS_MOBILE_80;
				case Sizes.SIZE_96:
					return Mask.Masks.AVATAR_DECORATION_STATUS_MOBILE_96;
				case Sizes.SIZE_120:
					return Mask.Masks.AVATAR_DECORATION_STATUS_MOBILE_120;
			}

		switch (size) {
			case Sizes.SIZE_16:
				return Mask.Masks.AVATAR_DECORATION_STATUS_ROUND_16;
			case Sizes.SIZE_20:
				return Mask.Masks.AVATAR_DECORATION_STATUS_ROUND_20;
			case Sizes.SIZE_24:
				return Mask.Masks.AVATAR_DECORATION_STATUS_ROUND_24;
			case Sizes.SIZE_32:
				return Mask.Masks.AVATAR_DECORATION_STATUS_ROUND_32;
			case Sizes.SIZE_40:
				return Mask.Masks.AVATAR_DECORATION_STATUS_ROUND_40;
			case Sizes.SIZE_44:
				return Mask.Masks.AVATAR_DECORATION_STATUS_ROUND_44;
			case Sizes.SIZE_48:
				return Mask.Masks.AVATAR_DECORATION_STATUS_ROUND_48;
			case Sizes.SIZE_56:
				return Mask.Masks.AVATAR_DECORATION_STATUS_ROUND_56;
			case Sizes.SIZE_72:
				return Mask.Masks.AVATAR_DECORATION_STATUS_ROUND_72;
			case Sizes.SIZE_80:
				return Mask.Masks.AVATAR_DECORATION_STATUS_ROUND_80;
			case Sizes.SIZE_96:
				return Mask.Masks.AVATAR_DECORATION_STATUS_ROUND_96;
			case Sizes.SIZE_120:
				return Mask.Masks.AVATAR_DECORATION_STATUS_ROUND_120;
		}

		return null;
	}

	function getBackgroundRect(e, t, n, isWhat) {
		let l = AvatarMask.getRect(t, n, isWhat)
			, u = StatusIndicatorMask.getStatusBackgroundColor(n, e);

		if (!isWhat.isMobile) {
			let n = l.height / 2 + t.stroke
				, i = l.x + t.status / 2;

			return React.createElement("circle", {
				style: {
					opacity: u
				},
				fill: e,
				r: n,
				cx: i,
				cy: i
			});
		}

		let d = l.height + 2 * t.stroke
			, _ = l.width + 2 * t.stroke
			, f = l.x - t.stroke
			, h = l.y - t.stroke;

		return React.createElement("rect", {
			fill: e,
			height: d,
			width: _,
			style: {
				opacity: u
			},
			x: f,
			y: h,
			rx: t.stroke
		});
	}

	const nodePatcher = ReactUtils.createNodePatcher();

	return {
		start() {
			Patcher.before(StatusIndicatorMask, "getMaskId", (that, args) => {
				if (args[1]?.isMobile) {
					args[0] = "online";

					args[1] = {
						...args[1],
						isVR: false
					};
				}
			});

			Patcher.before(AvatarMask, "getRect", (that, args) => {
				if (args[2]?.isMobile) {
					args[1] = "online";

					args[2] = {
						...args[2],
						isVR: false
					};
				}
			});

			Patcher.instead(Stores.PresenceStore, "isMobileOnline", (that, [userId]) => {
				const status = Stores.PresenceStore.getClientStatus(userId);

				return status && !!status.mobile && (status.mobile !== "unknown" || status.mobile === "offline");
			});

			Patcher.after(AvatarMask, "Avatar", (that, [props], ret) => {
				const propsRef = React.useRef(props);
				propsRef.current = props;

				if (typeof ret?.props?.children?.props?.children?.[1]?.props?.mask === "string" && props.status !== "unknown") {
					ret.props.children.props.children[1].props.mask = `url(#${getMaskId(
						props.status, props.size, props.isMobile, props.isTyping, props.isVR
					)})`;
				}

				if (ret?.props?.children?.props?.children?.[2]) {
					ret.props.children.props.children[2] = getBackgroundRect(props.statusBackdropColor, IndicatorSizes.getDimensions(props.size), props.status !== "unknown" ? props.status : null, {
						isMobile: props.isMobile,
						isTyping: props.isTyping,
						isVR: props.isVR
					});
				}

				if (typeof ret?.props?.children?.props?.children?.[3]?.props?.children?.props?.children?.[0]?.props === "object") {
					Object.assign(ret.props.children.props.children[3].props.children.props.children[0].props,
						AvatarMask.getRect(IndicatorSizes.getDimensions(props.size), props.status !== "unknown" ? props.status : null, {
							isMobile: props.isMobile,
							isTyping: props.isTyping,
							isVR: props.isVR
						})
					);
				}

				ret.props.__mfaParentProps = propsRef;
				nodePatcher.patch(ret, (_, res) => {
					const props = _.__mfaParentProps?.current;

					if (props && res?.props?.children?.[1]?.props?.children?.props?.mask) {
						const mask = getDecorationMaskId(props.status, props.size, props.isMobile, props.isTyping);

						if (mask) res.props.children[1].props.children.props.mask = `url(#${mask})`;
					}
				});
			});

			Patcher.after(AvatarMask.SmartAvatar, "type", (that, [props], ret) => {
				ret.type = AvatarMask.Avatar;
			});
		},
		stop() {
			Patcher.unpatchAll();
			nodePatcher.dispose();
		}
	};
};
