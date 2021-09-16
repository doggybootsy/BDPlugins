/**
 * @name ThemeAndPluginDownloader
 * @description Download themes and plugins straight from the channels
 * @version 1.0.0
 * @author doggybootsy
 */
module.exports = class ThemeAndPluginDownloader {
    getName() {return "Theme and Plugin downloader"}
    start() {
        const MiniPopover = BdApi.findModule((m) => m?.default?.displayName === "MiniPopover"), 
        TooltipWrapper = BdApi.findModuleByPrototypes("renderTooltip"),{React} = BdApi,
        getChannelId = BdApi.findModuleByProps("getLastSelectedChannelId", "getChannelId"), request = require("request"),fs = require("fs"),path = require("path")
        BdApi.Patcher.before("ThemeAndPluginDownloader-MiniPopover-Patch", MiniPopover, "default", (that, args, value) => {
            const page = (getChannelId.getChannelId() === "813903954991120385" || getChannelId.getChannelId() === "781600250858700870") ? "Plugins" : (getChannelId.getChannelId() === "813903993524715522" || getChannelId.getChannelId() === "781600198002081803") ? "Themes" : ""
            if (page != "") {
                const id = args[0].children[args[0].children.length - 1].props.message.embeds[0].rawDescription.split("=")[1].split(")")[0]
                args[0].children.splice(0,0, React.createElement(TooltipWrapper, {
                    text: `Download ${page === "Plugins" ? "plugin" : "theme"}`,
                    position: TooltipWrapper.Positions.TOP,
                    color: TooltipWrapper.Colors.PRIMARY,
                    children: (tipProps) => {
                        return React.createElement(MiniPopover.Button, Object.assign(tipProps, {
                            id: `Download-${page === "Plugins" ? "plugin" : "theme"}-${id}`,
                            onClick: () => {
                                request.get(`https://betterdiscord.app/gh-redirect?id=${id}`, async (err, res, body) => {
                                    if (err) {
                                        BdApi.alert(`Couldn't Fetch the ${page === "Plugins" ? "plugin" : "theme"}`)
                                        console.error(err)
                                    }
                                    else {
                                        const location = path.join(BdApi[page].folder, res.request.uri.href.split("/").pop())
                                        if (fs.existsSync(location)) BdApi.showToast(`${page === "Plugins" ? "plugin" : "theme"} already is added`, {type:"warning", icon: true})
                                        else await new Promise(r => fs.writeFile(location, body, r))
                                    }
                                })
                            },
                            children: [
                                React.createElement("svg", {
                                    viewBox: "0 0 24 24",
                                    width: "18",
                                    height: "18",
                                    children: [
                                        React.createElement("path", {
                                            fill: "currentColor",
                                            d: "M 10 2 L 10 11 L 6 11 L 12 17 L 18 11 L 14 11 L 14 2 L 10 2 z M 2 20 L 2 22 L 22 22 L 22 20 L 2 20 z"
                                        })
                                    ]
                                })
                            ]
                        }))
                    }
                }), React.createElement(MiniPopover.Separator))
            }
        })
    }
    stop() {
        BdApi.Patcher.unpatchAll("ThemeAndPluginDownloader-MiniPopover-Patch")
    }
}
