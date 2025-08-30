/**
 * @name SendAndForget
 * @description Don't follow forwarded messages after sending them. Port of [Vendicated/Vencord#3558](<https://github.com/Vendicated/Vencord/pull/3558>)
 * @author DoggyBootsy
 * @version 1.0.2
 */

/** @type {import("betterdiscord").PluginCallback} */
module.exports = (meta) => {
	const { React, Webpack, Patcher, Utils } = new window.BdApi(meta.name);

	const ForwardModalCTX = React.createContext();

	class SendAndForget {
		async patchForwardModal() {
			const [ module, key ] = Webpack.getWithKey(m => typeof m === "function", {
				target: await Webpack.waitForModule(Webpack.Filters.bySource(".ToastType.FORWARD"))
			});			
			
			Patcher.instead(module, key, (that, args, original) => {
				const [state, setState] = React.useState(false);

				const undo = Patcher.instead(React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE.H, "useCallback", (that, args, useCallback) => {
					if (args[0].toString().includes(".getMessage(")) {
						const orig = args[0];
						args[0] = function() {							
							if (arguments[0].length > 1 || state) return orig.apply(this, arguments);

							if (arguments.length === 1) {
								arguments[1] = {};
								arguments.length = 2;
							}							

							arguments[1].transitionToDestination = false;

							return orig.apply(this, arguments);
						}

						args[1] = [
							...args[1],
							state
						]
					}

					
					
					return useCallback.apply(that, args);
				});

				const ret = original.apply(that, args);

				undo();

				return React.createElement(ForwardModalCTX.Provider, {
					value: [
						state, setState
					],
					children: ret
				});
			});
		}

		async patchForwardModalFooter() {
			const [ module, key ] = Webpack.getWithKey(Webpack.Filters.byStrings(".ForwardContextMessage", ".footerWarningWrapper"), {
				target: await Webpack.waitForModule(Webpack.Filters.bySource(".ForwardContextMessage", ".footerWarningWrapper"))
			});

			let SwitchItem = Webpack.getBySource("M5.13231 6.72963L6.7233 5.13864L14.855 13.2704L13.264 14.8614L5.13231 6.72963Z");
			if (typeof SwitchItem === "object") SwitchItem = Object.values(SwitchItem)[0];

			const TooltipWrapper = Webpack.getByStrings('["children","className","element"]', {searchExports: true});

			Patcher.after(module, key, (that, [{selectedDestinations}], res) => {
				const footerButtons = Utils.findInTree(res, m => String(m?.className).startsWith("footerButtons_"), {
					walkable: [
						"props", 
						"children"
					]
				});

				const value = React.use(ForwardModalCTX);

				if (!value || !footerButtons) return;

				const [ checked, onChange ] = value;				

				footerButtons.children.splice(1, 0, React.createElement(TooltipWrapper, {
					text: "Follow Forward",
					children: React.createElement(SwitchItem, {
						checked,
						onChange,
						disabled: selectedDestinations.length > 1
					})
				}));
			});
		}

		start() {
			this.patchForwardModal();
			this.patchForwardModalFooter();
		}
		stop() {
			Patcher.unpatchAll();
		}
	}

	return new SendAndForget();
}
