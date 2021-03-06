/**
 * @name BackupCustomCSS
 * @description Back up custom css in a seperate file. Hold shift and tap the save icon to open settings
 * @version 1.2.8
 * @author doggybootsy
 * @source https://github.com/doggybootsy/BDPlugins/
 * @website https://doggybootsy.github.io/
 */

let {env: {DISCORD_RELEASE_CHANNEL}, platform} = process,
  {React} = BdApi,
  {existsSync,mkdirSync,writeFile,rmdir,readFile} = require("fs"),
  {shell: {openPath}} = require("electron"),
  {join} = require("path"),
  {ButtonLooks, ButtonColors, ButtonSizes} = Button = BdApi.findModuleByProps("ButtonLooks", "ButtonColors", "ButtonSizes"),
  SwitchItem = BdApi.findModuleByDisplayName("SwitchItem"),
  {ModalRoot, ModalSize: {MEDIUM}, ModalContent, ModalFooter, ModalHeader} = BdApi.findModuleByProps("ModalRoot"),
  FormTitle = BdApi.findModuleByDisplayName("FormTitle"),
  {openModal} = BdApi.findModuleByProps("openModal"),
  {DONE, DELETE, CANCEL} = BdApi.findModule(m => m.Messages && (m.Messages.OKAY && m.Messages.OKAY !== "")).Messages,
  TextInput = BdApi.findModule(m=>m?.defaultProps?.type==="text"),
  {FormItem, FormText} = BdApi.findModuleByProps("FormItem", "FormText"),
  dummmypath = platform === "win32" ? BdApi.Plugins.folder.split("\\") : BdApi.Plugins.folder.split("/"),
  setData = (d,v) => BdApi.saveData("BackupCustomCSS", d, v),
  getData = (d, pv) => BdApi.loadData("BackupCustomCSS", d) ?? pv
class Switch extends React.Component {
  constructor(props) {
    super(props)
    this.state = { toggled: props.value }
  }
  render() {
    return React.createElement(SwitchItem, {
      value: this.state.toggled,
      children: this.props.children,
      note: this.props.note,
      onChange: (value) => {
        this.setState({ toggled: value })
        setData(this.props.id, value)
        if(document.getElementById("BackupCustomCSS")) document.getElementById("BackupCustomCSS").remove()
      }
    })
  } 
}
class Group extends React.Component {
  constructor(props) {
    super(props)
    this.state = { toggled: false }
  }
  render() {
    return React.createElement("div", {
      className: "settings-group",
      style: {marginBottom: "30px"},
      children: [
        React.createElement("h2", {
          className: "settings-group-title",
          children: React.createElement(FormItem, {
            title: `KEYBINDS (Group -- ${this.state.toggled ? "opened" : "closed"})`
          }),
          onClick: () => this.setState({toggled: !this.state.toggled})
        }),
        React.createElement("div", {
          className: "settings-group-content",
          style: {display: this.state.toggled ? null : "none"},
          children: this.props.children
        }),
      ]
    })
  } 
}
class SettingsPanel extends React.Component {
  constructor() {
    super(...arguments)
    this.state = {Path: getData("saveLocation", BdApi.Plugins.folder), ResetButtonHover: false}
  }
  render() {
    return React.createElement("div", {
      id: "BackupCustomCSS-Settings",
      children: [
        React.createElement("div", {
          style: {display: "flex"},
          children: [
            React.createElement(Button.default, {
              onClick: () => {
                this.props.instance.checkIf()
                openPath(join(this.state.Path, "BackupCustomCSS", DISCORD_RELEASE_CHANNEL))
              }
            }, "Open backup folder"),
            React.createElement("div", {style: {width: "16.90rem"}}),
            React.createElement(Button.default, {
              onClick: () => this.props.instance.backup()
            }, "Backup Custom CSS")
          ]
        }),
        React.createElement("div", {style: {height: "30px"}}),
        React.createElement(Group, {
          children: [
            React.createElement(Switch, {
              id: "QuickSettings",
              value: getData("QuickSettings", true), 
              children: "Open settings keybind",
              note: "Quickly open the settings page"
            }),
            React.createElement(Switch, {
              id: "QuickDelete",
              value: getData("QuickDelete", true), 
              children: "Delete backup's keybind",
              note: "Quickly open the delete backup's promp"
            }),
            React.createElement(Switch, {
              id: "QuickOpen",
              value: getData("QuickOpen", true), 
              children: "Open backups keybind",
              note: "Quickly open the backups folder"
            })
          ]
        }),
        React.createElement("div", {
          style: {marginBottom: "30px"},
          children: [
            React.createElement("div", {
              style: {display: "flex"},
              children: [
                // Code mostly stolen from stern
                React.createElement(FormItem, {
                  title: "Custom backup location",
                  style: {width: "100%",marginRight: "10px"},
                  children: [
                    React.createElement(TextInput, {
                      placeholder: platform === "win32" ? ` ${dummmypath[0]}\\${dummmypath[1]}\\${dummmypath[2]}\\` : `/${dummmypath[1]}/${dummmypath[2]}/`,
                      value: this.state.Path,
                      onChange: e => {
                        this.setState({Path: e})
                        setData("saveLocation", e)
                      }
                    }),
                    React.createElement(FormText, {
                      children: "Enter full path or it may not work as intended to",
                      type: "description"
                    })
                  ]
                }),
                // End
                React.createElement(Button.default, {
                  style: {marginTop: "24px"},
                  color: this.state.ResetButtonHover === false ? ButtonColors.GREEN : ButtonColors.RED,
                  look: this.state.ResetButtonHover === false ? ButtonLooks.OUTLINED : ButtonLooks.FILLED,
                  onMouseOver: () => this.setState({ResetButtonHover: true}),
                  onMouseOut: () => this.setState({ResetButtonHover: false}),
                  onClick: () => {
                    this.setState({Path: BdApi.Plugins.folder})
                    BdApi.saveData("BackupCustomCSS", "saveLocation", BdApi.Plugins.folder)
                  },
                }, "Reset")
              ]
            })
          ]
        }),
        React.createElement("div", {
          style: {display: "flex"},
          children: [
            React.createElement(Button.default, {
              color: ButtonColors.RED,
              look: ButtonLooks.OUTLINED,
              size: ButtonSizes.SMALL,
              onClick: () => this.props.instance.removeAll()
            }, "Delete All Backup's")
          ]
        })
      ]
    })
  }
}
module.exports = class BackupCustomCSS{
  getName() {return "Backup custom CSS"}
  checkIf() {
    const folder = getData("saveLocation", BdApi.Plugins.folder)
    try {
      if(!existsSync(join(folder, "BackupCustomCSS"))) mkdirSync(join(folder, "BackupCustomCSS"))
      if(!existsSync(join(folder, "BackupCustomCSS", DISCORD_RELEASE_CHANNEL))) mkdirSync(join(folder, "BackupCustomCSS", DISCORD_RELEASE_CHANNEL))
    } catch (err) {
      this._error("You have entered a invalid path, the path has been reset.", err)
      setData("saveLocation", BdApi.Plugins.folder)
    }
  }
  getSettingsPanel() {return React.createElement(SettingsPanel, {instance: this})}
  showSettingsModal() {
    openModal(props => {
      return React.createElement(ModalRoot, Object.assign({size: MEDIUM, className: "bd-addon-modal"}, props),
        React.createElement(ModalHeader, {separator: false, className: "bd-addon-modal-header"},React.createElement(FormTitle, {tag: "h4"}, `${this.getName()} Settings`)),
        React.createElement(ModalContent, {className: "bd-addon-modal-settings"}, this.getSettingsPanel()),
        React.createElement(ModalFooter, {className: "bd-addon-modal-footer"},React.createElement(Button.default, {onClick: props.onClose, className: "bd-button"}, DONE))
      )}
    )
  }
  _error(txt,err) {
    BdApi.alert(this.getName(), [txt, `\`\`\`js\n${err}\n\`\`\``, " ", "If this keeps happening make an issue on the github"])
    console.error(err)
  }
  backup() {
    this.checkIf()
    readFile(join(BdApi.Plugins.folder, "..", "data", DISCORD_RELEASE_CHANNEL, "custom.css"), "utf8", (err, data) => {
      if(err) this.error("Couldnt read custom css", err)
      else {
        const date = new Date(), time = `${date}`.split(" "), folder = getData("saveLocation", BdApi.Plugins.folder)
        writeFile(join(folder, "BackupCustomCSS", DISCORD_RELEASE_CHANNEL, `BackupCustomCSS-(${time[0]} ${time[1]} ${time[2]}-${time[3]}-${date.getHours()}-${date.getMinutes()}-${date.getSeconds()}-${date.getMilliseconds()}).css`), `/*\n    Backup data\n    time: ${date}\n    UnixTimestamp: ${date.getTime()}\n*/\n${data}`, function (err) {
          if(err) this.error("Couldnt backup css", err)
          else BdApi.showToast("CSS successfully backed up", {type:"info", icon: true})
        })
      }
    })
  }
  removeAll() {
    BdApi.showConfirmationModal("Want to delete all backup's?", ["You might not be able to get the backup's again"], {
        danger: true,
        confirmText: DELETE,
        cancelText: CANCEL,
        onConfirm: () => {
          const folder = getData("saveLocation", BdApi.Plugins.folder)
          rmdir(join(folder, "BackupCustomCSS", DISCORD_RELEASE_CHANNEL), { recursive: true }, (err) => {
            if(err) this.error("Couldnt delete the css", err)
            else BdApi.showToast("Successfully deleted backup(s)", {type:"warning", icon: true})
          })
        }
      }
    )
  }
  start() {
    if(window.powercord != null) 
      BdApi.alert(this.getName(), "This plugin doesnt support powercord.")
    if(global.ZeresPluginLibrary != null) 
      global.ZeresPluginLibrary.PluginUpdater.checkForUpdate(this.getName(), "1.2.2", "https://raw.githubusercontent.com/doggybootsy/BDPlugins/main/BackupCustomCSS/BackupCustomCSS.plugin.js")
    this.checkIf()
  }
  stop() {if(document.getElementById("BackupCustomCSS")) document.getElementById("BackupCustomCSS").remove()}
  observer() {
    if(!document.getElementById("BackupCustomCSS") && (document.getElementById("bd-floating-editor") || document.getElementById("bd-customcss-editor"))) {
      const ele = document.createElement("button")
      ele.id = "BackupCustomCSS"
      ele.classList = "btn btn-primary"
      ele.innerHTML = "<svg viewBox=\"0 0 30 30\" style=\"width: 18px; height: 18px;\"><path d=\"M 7 2 C 5.895 2 5 2.895 5 4 L 5 18 C 5 19.105 5.895 20 7 20 L 23 20 C 24.105 20 25 19.105 25 18 L 25 4 C 25 2.895 24.105 2 23 2 L 7 2 z M 15 5 C 18.314 5 21 7.686 21 11 C 21 14.314 18.314 17 15 17 C 13.748245 17 12.586657 16.614505 11.625 15.958984 L 12.878906 14.078125 C 13.296906 13.451125 12.550828 12.703094 11.923828 13.121094 L 10.041016 14.376953 C 9.3849538 13.415043 9 12.252319 9 11 C 9 7.686 11.686 5 15 5 z M 15 10 C 14.448 10 14 10.448 14 11 C 14 11.552 14.448 12 15 12 C 15.552 12 16 11.552 16 11 C 16 10.448 15.552 10 15 10 z M 5 21.443359 L 5 26 C 5 27.105 5.895 28 7 28 L 23 28 C 24.105 28 25 27.105 25 26 L 25 21.443359 C 24.409 21.787359 23.732 22 23 22 L 7 22 C 6.268 22 5.591 21.787359 5 21.443359 z M 22 24 C 22.552 24 23 24.448 23 25 C 23 25.552 22.552 26 22 26 C 21.448 26 21 25.552 21 25 C 21 24.448 21.448 24 22 24 z\"></path></svg>"
      ele.onclick = (e) => {
        const folder = getData("saveLocation", BdApi.Plugins.folder)
        if(e.shiftKey === true && getData("QuickSettings", true) === true) this.showSettingsModal()
        else if(e.ctrlKey === true || e.metaKey === true && getData("QuickOpen", true) === true) openPath(join(folder, "BackupCustomCSS", DISCORD_RELEASE_CHANNEL))
        else if(e.altKey === true && getData("QuickDelete", true) === true) this.removeAll()
        else this.backup()
      }
      document.querySelector("#bd-editor-controls>.controls-section.controls-left").appendChild(ele)
    }
  }
}
