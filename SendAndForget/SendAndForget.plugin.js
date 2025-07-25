/**
 * @name SendAndForget
 * @description Don't follow forwarded messages after sending them. Port of [Vendicated/Vencord#3558](<https://github.com/Vendicated/Vencord/pull/3558>)
 * @author DoggyBootsy
 * @version 1.0.0
 */


module.exports = class SendAndForget {
	start() {
		const [ module, key ] = BdApi.Webpack.getWithKey(m => typeof m === "function", {
			target: BdApi.Webpack.getBySource(".ToastType.FORWARD")
		});

		BdApi.Patcher.instead("SendAndForget", module, key, (that, args, original) => {
			const undo = BdApi.Patcher.instead("SendAndForget", BdApi.React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE.H, "useCallback", (that, args, orig) => {
				if (args[0].toString().includes(".getMessage(")) {
					const orig = args[0];
					args[0] = function() {
						if (arguments.length === 1) {
							arguments[1] = {};
							arguments.length = 2;
						}

						arguments[1].transitionToDestination = false;

						return orig.apply(this, arguments);
					}
				}
				
				return orig.apply(that, args);
			});

			const ret = original.apply(that, args);

			undo();

			return ret;
		});
	}
	stop() {
		BdApi.Patcher.unpatchAll("SendAndForget");
	}
}
