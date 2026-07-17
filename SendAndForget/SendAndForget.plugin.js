/**
 * @name SendAndForget
 * @description Don't follow forwarded messages after sending them. Port of [Vendicated/Vencord#3558](<https://github.com/Vendicated/Vencord/pull/3558>)
 * @author DoggyBootsy
 * @version 1.0.3
 */

/** @type {import("betterdiscord").PluginCallback} */
module.exports = (meta) => {
	const {React, Webpack, Patcher, Utils, Components} = new window.BdApi(meta.name);

	class SendAndForget {
		async patchForwardModal() {
			const [module, key] = Webpack.getWithKey(m => typeof m === "function", {
				target: await Webpack.waitForModule(Webpack.Filters.bySource("transitionToDestination:1==="))
			});

			const TooltipWrapper = Webpack.getByStrings('["children","className","element"]', {searchExports: true});

			Patcher.instead(module, key, (that, args, original) => {
				const [state, setState] = React.useState(false);

				const undo_useCallback = Patcher.instead(React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE.H, "useCallback", (that, args, useCallback) => {
					if (args[0].toString().includes(".getMessage(")) {
						const orig = args[0];
						args[0] = function () {
							if (arguments[0].length > 1 || state) return orig.apply(this, arguments);

							if (arguments.length === 1) {
								arguments[1] = {};
								arguments.length = 2;
							}

							arguments[1].transitionToDestination = false;

							return orig.apply(this, arguments);
						};

						args[1] = [
							...args[1],
							state
						];
					}

					return useCallback.apply(that, args);
				});

				let selected, setSelected;
				const undo_useState = Patcher.after(React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE.H, "useState", (that, [init], res) => {
					if (init === args[0].initialSelectedDestinations) {
						selected = res[0];
						setSelected = res[1];
					}
				});

				const ret = original.apply(that, args);

				const children = ret?.props?.children?.props?.children;
				if (typeof children === "function" && Array.isArray(selected)) {
					ret.props.children = React.cloneElement(ret.props.children, {
						children() {
							const child = children.apply(this, arguments);

							if (child?.props && Object.hasOwn(child.props, "actionBarInput")) {
								child.props.actionBarInput = React.createElement(Components.Flex, {align: Components.Flex.Align.CENTER}, [
									child.props.actionBarInput,
									React.createElement(Components.Tooltip, {
										text: "Follow Forward",
										children: p => React.createElement(Components.Flex.Child, {
											children: React.createElement("div", {
												...p,
												children: React.createElement(Components.SwitchInput, {
													checked: state,
													onChange: setState,
													disabled: !selected.length
												})
											})
										})
									})
								]);
							}

							return child;
						}
					});
				}

				undo_useCallback();
				undo_useState();

				return ret;
			});
		}

		start() {
			this.patchForwardModal();
		}
		stop() {
			Patcher.unpatchAll();
		}
	}

	return new SendAndForget();
};
