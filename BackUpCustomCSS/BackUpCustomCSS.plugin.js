/**
 * @name BackUpCustomCSS
 * @displayName BackUpCustomCSS
 * @description Back up custom css in a seperate file. Hold shift and tap the save icon to open settings
 * @author doggybootsy
 * @source https://github.com/doggybootsy/BDPlugins/
 * @website https://doggybootsy.github.io/
 */
const {env: {DISCORD_RELEASE_CHANNEL}} = process,
      {showToast, React: {createElement}, showConfirmationModal, alert, Plugins: {get, folder}} = BdApi,
      {error} = console,
      {existsSync,mkdirSync,writeFile,rmdir,readFile} = require("fs"),
      {shell: {openPath}} = require('electron'),
      {join} = require("path"),
      Button = BdApi.findModuleByProps('DropdownSizes'),
      {ButtonLooks, ButtonColors} = BdApi.findModuleByProps("ButtonLooks")
module.exports = class BackUpCustomCSS{
    getName() {return "Back up custom CSS"}
    getVersion() {return "1.1.1"}
    backup() {
        if (!existsSync(join(folder, "BackUpCustomCSS"))) 
            mkdirSync(join(folder, "BackUpCustomCSS"))
        if (!existsSync(join(folder, "BackUpCustomCSS", DISCORD_RELEASE_CHANNEL))) 
            mkdirSync(join(folder, "BackUpCustomCSS", DISCORD_RELEASE_CHANNEL))
        readFile(join(folder, "..", "data", DISCORD_RELEASE_CHANNEL, "custom.css"), 'utf8', (err, data) => {
            if (err) {
                alert('Couldnt read custom css', `\`\`\`js\n${err}\n\`\`\``)
                error(err)
            } else {
                const date = new Date(),
                      time = `${date}`.split(" ")
                writeFile(join(folder, "BackUpCustomCSS", DISCORD_RELEASE_CHANNEL, `BackUpCustomCSS-(${time[0]} ${time[1]} ${time[2]}-${time[3]}-${date.getHours()}-${date.getMinutes()}-${date.getSeconds()} ${date.getMilliseconds()}).css`), `/*\n    CustomCSS backup ${time[0]} ${time[1]} ${time[2]} ${time[3]} ${time[4]}\n*/\n${data}`, function (err) {
                    if (err) {
                        alert('Couldnt backup css', `\`\`\`js\n${err}\n\`\`\``)
                        error(err)
                    }
                    else showToast("CSS successfully backed up", {type:"info", icon: true})
                })
            }
        })
    }
    removeAll() {
        showConfirmationModal("Want to delete all backup's?", 
                [
                    "You might not be able to get the backup's again"
                ],
                {
                danger: true,
                confirmText: "Delete",
                cancelText: "Go Back",
                onConfirm: () => {
                    rmdir(join(folder, "BackUpCustomCSS", DISCORD_RELEASE_CHANNEL), { recursive: true }, (err) => {
                        if (err) {
                            alert('Couldnt backup css', `\`\`\`js\n${err}\n\`\`\``)
                            error(err)
                        }
                        else showToast("Successfully deleted backup(s)", {type:"warning", icon: true})
                    })
                }
            }
        )
    }
    start() {
        if(global.ZeresPluginLibrary)
            ZeresPluginLibrary.PluginUpdater.checkForUpdate(this.getName(), this.getVersion(), "https://raw.githubusercontent.com/doggybootsy/BDPlugins/main/BackUpCustomCSS/BackUpCustomCSS.plugin.js")
        if (!existsSync(join(folder, "BackUpCustomCSS"))) 
            mkdirSync(join(folder, "BackUpCustomCSS"))
        if (!existsSync(join(folder, "BackUpCustomCSS", DISCORD_RELEASE_CHANNEL))) 
            mkdirSync(join(folder, "BackUpCustomCSS", DISCORD_RELEASE_CHANNEL))
    }
    stop() {
        if (document.getElementById("BackUpCustomCSS")) 
            document.getElementById("BackUpCustomCSS").remove()
    }
    getSettingsPanel() {
        return createElement("div", {
            children: [
                createElement("div", {
                    style: {display: "flex"},
                    children: [
                        createElement(Button, {
                            onClick: () => openPath(join(folder, "BackUpCustomCSS", DISCORD_RELEASE_CHANNEL))
                        }, "Open backup folder"),
                        createElement("div", {style: {width: "7rem"}}, ""),
                        createElement(Button, {
                            style: {width: "fit-content"},
                            onClick: () => this.backup()
                        }, "Backup Custom CSS")
                    ]
                }),
                createElement("div", {style: {height: "50px"}}, ""),
                createElement(Button, {
                    color: ButtonColors.RED,
                    look: ButtonLooks.OUTLINED,
                    onClick: () => this.removeAll()
                }, "Delete backup(s)")
            ]
        })
    }
    observer() {
        if (document.getElementById("bd-editor-controls") && !document.getElementById("BackUpCustomCSS")) {
            const ele = document.createElement('button')
            ele.id = "BackUpCustomCSS"
            ele.classList = "btn btn-primary"
            ele.innerHTML = '<svg viewBox="0 0 30 30" style="width: 18px; height: 18px;"><path d="M 7 2 C 5.895 2 5 2.895 5 4 L 5 18 C 5 19.105 5.895 20 7 20 L 23 20 C 24.105 20 25 19.105 25 18 L 25 4 C 25 2.895 24.105 2 23 2 L 7 2 z M 15 5 C 18.314 5 21 7.686 21 11 C 21 14.314 18.314 17 15 17 C 13.748245 17 12.586657 16.614505 11.625 15.958984 L 12.878906 14.078125 C 13.296906 13.451125 12.550828 12.703094 11.923828 13.121094 L 10.041016 14.376953 C 9.3849538 13.415043 9 12.252319 9 11 C 9 7.686 11.686 5 15 5 z M 15 10 C 14.448 10 14 10.448 14 11 C 14 11.552 14.448 12 15 12 C 15.552 12 16 11.552 16 11 C 16 10.448 15.552 10 15 10 z M 5 21.443359 L 5 26 C 5 27.105 5.895 28 7 28 L 23 28 C 24.105 28 25 27.105 25 26 L 25 21.443359 C 24.409 21.787359 23.732 22 23 22 L 7 22 C 6.268 22 5.591 21.787359 5 21.443359 z M 22 24 C 22.552 24 23 24.448 23 25 C 23 25.552 22.552 26 22 26 C 21.448 26 21 25.552 21 25 C 21 24.448 21.448 24 22 24 z"></path></svg>'
            ele.onclick = (e) => {
                document.getElementById("BackUpCustomCSS").style = "pointer-events: none !important;"
                setTimeout(() => document.getElementById("BackUpCustomCSS").style = "pointer-events: unset !important;", 500)
                if (e.shiftKey === true) showConfirmationModal('Back up custom CSS settings', get('BackUpCustomCSS').instance.getSettingsPanel(), {
                    confirmText: "Close",
                    cancelText: null
                })
                else if (e.ctrlKey === true || e.metaKey === true) openPath(join(folder, "BackUpCustomCSS", DISCORD_RELEASE_CHANNEL))
                else if (e.altKey === true) this.removeAll()
                else this.backup()
            }
            document.querySelector("#bd-editor-controls>.controls-section.controls-left").appendChild(ele)
        }
    }
}
