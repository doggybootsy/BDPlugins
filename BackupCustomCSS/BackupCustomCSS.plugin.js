/**
 * @name BackupCustomCSS
 * @description Back up custom css in a seperate file. Hold shift and tap the save icon to open settings
 * @version 1.2.4
 * @author doggybootsy
 * @source https://github.com/doggybootsy/BDPlugins/
 * @website https://doggybootsy.github.io/
 */

let {env: {DISCORD_RELEASE_CHANNEL}, platform} = process,
    {showToast, React: {createElement, Component}, showConfirmationModal, alert, saveData, loadData, Plugins} = BdApi,
    {existsSync,mkdirSync,writeFile,rmdir,readFile} = require("fs"),
    {shell: {openPath}} = require("electron"),
    {join} = require("path"),
    Button = BdApi.findModuleByProps("DropdownSizes"),
    {ButtonLooks, ButtonColors, ButtonSizes} = BdApi.findModuleByProps("ButtonLooks"),
    Buttons = BdApi.findModuleByProps("ButtonLooks"),
    SwitchItem = BdApi.findModuleByDisplayName("SwitchItem"),
    {ModalRoot, ModalSize: {MEDIUM}, ModalContent, ModalFooter, ModalHeader} = BdApi.findModuleByProps("ModalRoot"),
    FormTitle = BdApi.findModuleByDisplayName("FormTitle"),
    {openModal} = BdApi.findModuleByProps("openModal"),
    {DONE} = BdApi.findModuleByProps("Messages").Messages,
    TextInput = BdApi.findModule(m=>m?.defaultProps?.type==="text"),
    folder = loadData("BackupCustomCSS", "saveLocation") ?? Plugins.folder,
    {FormItem, FormText} = BdApi.findModuleByProps("FormItem", "FormText")
class SwitchComponent extends Component {
    constructor(props) {
        super(props)
        this.state = { toggled: props.value }
    }
    render() {
        return createElement(SwitchItem, {
            value: this.state.toggled,
            children: this.props.children,
            note: this.props.note,
            onChange: (value) => {
                this.setState({ toggled: value })
                saveData("BackupCustomCSS", this.props.id, value)
                if(document.getElementById("BackupCustomCSS")) document.getElementById("BackupCustomCSS").remove()
            }
        })
    } 
}
class SettingsPanel extends Component {
    constructor() {
        super(...arguments)
        this.state = {Path: folder}
    }
    render() {
        return createElement("div", {
			id: "BackupCustomCSS-Settings",
            children: [
                createElement("div", {
                    style: {display: "flex"},
                    children: [
                        createElement(Button, {
                            onClick: () => {
                                this.props.instance.checkIf()
                                openPath(join(this.state.Path, "BackupCustomCSS", DISCORD_RELEASE_CHANNEL))
                            }
                        }, "Open backup folder"),
                        createElement("div", {style: {width: "17rem"}}),
                        createElement(Button, {
                            onClick: () => this.props.instance.backup()
                        }, "Backup Custom CSS")
                    ]
                }),
                createElement("div", {style: {height: "30px"}}),
                createElement(SwitchComponent, {
					id: "Keybind",
					value: loadData("BackupCustomCSS", "Keybind") ?? true, 
					children: "Click keybinds",
					note: `Clicking backup and holding either ${platform === "darwin" ? "⇧/⌘/⌥ (shift/command/option)" : "shift/crtl/alt"} will do more`,
				}),
                createElement(SwitchComponent, {
					id: "QuickDelete",
					value: loadData("BackupCustomCSS", "QuickDelete") ?? true, 
					children: "Quickly delete backup's keybind",
					note: "Quickly open the delete backup's promp"
				}),
                createElement("div", {
                    style: {marginBottom: "30px"},
                    children: [
                        createElement("div", {
                            style: {display: "flex"},
                            children: [
                                // Code mostly stolen from stern
                                createElement(FormItem, {
                                    title: "Custom backup location",
                                    style: {width: "100%",marginRight: "10px"},
                                    children: [
                                        createElement(TextInput, {
                                            placeholder: platform === "darwin" ? "/Users/" : "C:\\Users\\",
                                            value: this.state.Path,
                                            onChange: e => {
                                                this.setState({Path: e})
                                                saveData("BackupCustomCSS", "saveLocation", e)
                                            }
                                        }),
                                        createElement(FormText, {
                                            children: "Enter full path or it may not work as intended to",
                                            type: "description"
                                        })
                                    ]
                                    // End
                                }),
                                createElement(Buttons.default, {
                                    className: "bd-button",
                                    style: {marginTop: "24px"},
                                    onClick: () => {
                                        this.setState({Path: Plugins.folder})
                                        saveData("BackupCustomCSS", "saveLocation", Plugins.folder)
                                    },
                                }, "Reset")
                            ]
                        })
                    ]
                }),
                createElement("div", {
                    style: {display: "flex"},
					children: [
                        createElement("div", {style: {width: "28rem"}}),
                        createElement(Button, {
							color: ButtonColors.RED,
							look: ButtonLooks.OUTLINED,
							size: ButtonSizes.SMALL,
							onClick: () => this.props.instance.removeAll()
						}, "Delete backup's")
					]
				})
            ]
        })
    }
}
module.exports = class BackupCustomCSS{
    getName() {return "Backup custom CSS"}
    checkIf() {
        try {
            if(!existsSync(join(folder, "BackupCustomCSS"))) mkdirSync(join(folder, "BackupCustomCSS"))
            if(!existsSync(join(folder, "BackupCustomCSS", DISCORD_RELEASE_CHANNEL))) mkdirSync(join(folder, "BackupCustomCSS", DISCORD_RELEASE_CHANNEL))
        } catch (e) {
            saveData("BackupCustomCSS", "saveLocation", Plugins.folder)
        }
    }
    getSettingsPanel() {return createElement(SettingsPanel, {instance: this})}
    showSettingsModal() {
        openModal(props => {
            return createElement(ModalRoot, Object.assign({size: MEDIUM, className: "bd-addon-modal"}, props),
                createElement(ModalHeader, {separator: false, className: "bd-addon-modal-header"},createElement(FormTitle, {tag: "h4"}, `${this.getName()} Settings`)),
                createElement(ModalContent, {className: "bd-addon-modal-settings"}, this.getSettingsPanel()),
                createElement(ModalFooter, {className: "bd-addon-modal-footer"},createElement(Buttons.default, {onClick: props.onClose, className: "bd-button"}, DONE))
            )}
        )
    }
    _error(txt,err) {
        alert(this.getName(), [txt, `\`\`\`js\n${err}\n\`\`\``, "If this keeps happening make an issue on the github"])
        console.error(err)
    }
    backup() {
        this.checkIf()
        readFile(join(Plugins.folder, "..", "data", DISCORD_RELEASE_CHANNEL, "custom.css"), "utf8", (err, data) => {
            if(err) this.error("Couldnt read custom css", err)
            else {
                const date = new Date(), time = `${date}`.split(" ")
                writeFile(join(folder, "BackupCustomCSS", DISCORD_RELEASE_CHANNEL, `BackupCustomCSS-(${time[0]} ${time[1]} ${time[2]}-${time[3]}-${date.getHours()}-${date.getMinutes()}-${date.getSeconds()}-${date.getMilliseconds()}).css`), `/*\n    Backup data\n    time: ${date}\n    UnixTimestamp: ${date.getTime()}\n*/\n${data}`, function (err) {
                    if(err) this.error("Couldnt backup css", err)
                    else showToast("CSS successfully backed up", {type:"info", icon: true})
                })
            }
        })
    }
    removeAll() {
        showConfirmationModal("Want to delete all backup's?", 
                ["You might not be able to get the backup's again"],
                {
                danger: true,
                confirmText: "Delete",
                cancelText: "Go Back",
                onConfirm: () => {
                    rmdir(join(folder, "BackupCustomCSS", DISCORD_RELEASE_CHANNEL), { recursive: true }, (err) => {
                        if(err) this.error("Couldnt delete the css", err)
                        else showToast("Successfully deleted backup(s)", {type:"warning", icon: true})
                    })
                }
            }
        )
    }
    start() {
        if(window.powercord != null) alert(this.getName(), "This plugin doesnt support powercord.")
        if(global.ZeresPluginLibrary) global.ZeresPluginLibrary.PluginUpdater.checkForUpdate(this.getName(), Plugins.get("BackupCustomCSS").version, "https://raw.githubusercontent.com/doggybootsy/BDPlugins/main/BackupCustomCSS/BackupCustomCSS.plugin.js")
        this.checkIf()
    }
    stop() {
        if(document.getElementById("BackupCustomCSS")) document.getElementById("BackupCustomCSS").remove()
    }
    observer() {
        if(document.getElementById("bd-editor-controls") && !document.getElementById("BackupCustomCSS")) {
            const ele = document.createElement("button")
            ele.id = "BackupCustomCSS"
            ele.classList = "btn btn-primary"
            ele.innerHTML = "<svg viewBox=\"0 0 30 30\" style=\"width: 18px; height: 18px;\"><path d=\"M 7 2 C 5.895 2 5 2.895 5 4 L 5 18 C 5 19.105 5.895 20 7 20 L 23 20 C 24.105 20 25 19.105 25 18 L 25 4 C 25 2.895 24.105 2 23 2 L 7 2 z M 15 5 C 18.314 5 21 7.686 21 11 C 21 14.314 18.314 17 15 17 C 13.748245 17 12.586657 16.614505 11.625 15.958984 L 12.878906 14.078125 C 13.296906 13.451125 12.550828 12.703094 11.923828 13.121094 L 10.041016 14.376953 C 9.3849538 13.415043 9 12.252319 9 11 C 9 7.686 11.686 5 15 5 z M 15 10 C 14.448 10 14 10.448 14 11 C 14 11.552 14.448 12 15 12 C 15.552 12 16 11.552 16 11 C 16 10.448 15.552 10 15 10 z M 5 21.443359 L 5 26 C 5 27.105 5.895 28 7 28 L 23 28 C 24.105 28 25 27.105 25 26 L 25 21.443359 C 24.409 21.787359 23.732 22 23 22 L 7 22 C 6.268 22 5.591 21.787359 5 21.443359 z M 22 24 C 22.552 24 23 24.448 23 25 C 23 25.552 22.552 26 22 26 C 21.448 26 21 25.552 21 25 C 21 24.448 21.448 24 22 24 z\"></path></svg>"
            ele.onclick = (e) => {
                if(loadData("BackupCustomCSS", "Keybind") === true) {
                    if(e.shiftKey === true) this.showSettingsModal()
                    else if(e.ctrlKey === true || e.metaKey === true) openPath(join(folder, "BackupCustomCSS", DISCORD_RELEASE_CHANNEL))
                    else if(e.altKey === true && loadData("BackupCustomCSS", "QuickDelete") === true) this.removeAll()
                    else this.backup()
                }
                else this.backup()
            }
            document.querySelector("#bd-editor-controls>.controls-section.controls-left").appendChild(ele)
        }
    }
}
