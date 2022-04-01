/**
 * @name ReportMessages
 * @description Report messages within discord. 
 * @version 1.0.0
 * @author doggybootsy
 */

const MiniPopover = BdApi.findModule(m => m.default.displayName === "MiniPopover")
const Flag = BdApi.findModuleByDisplayName("Flag")
const {
  showReportModalForMessage
} = BdApi.findModuleByProps("showReportModalForMessage", "showReportModalForGuild")
const Alert = BdApi.findModuleByDisplayName("Alert")
const { openModal } = BdApi.findModuleByProps("openModalLazy", "openModal")
const showedZlibPrompt = BdApi.getData("ReportMessages", "showedZlibPrompt")
const showedPrompt = BdApi.getData("ReportMessages", "showedZlibPrompt")
function alert(...body) {
  openModal(props => BdApi.React.createElement(Alert, {
    ...props, title: "ReportMessages", body
  }))
}

module.exports = class ReportMessages {
  get enabled() { return BdApi.Plugins.isEnabled("ReportMessages") }
  // use load and always stay patched because I use an async patch (and idk if theres a better way)
  async load() {
    // set the shown zlib prompt to 'true'
    BdApi.saveData("ReportMessages", "showedZlibPrompt", true)
    BdApi.saveData("ReportMessages", "showedPrompt", true)
    // show warning
    if (!showedPrompt) alert("Spam reporting messages can get you banned.")
    // patch 'MiniPopover' and enable the button
    BdApi.Patcher.after("ReportMessages", MiniPopover, "default", (_, args) => {
      if (!Boolean(args[0].children[args[0].children.length - 1]?.props?.message)) return 
      const ele = args[0].children[args[0].children.length - 1]
      if (!ele) return
      ele.props.canReport = this.enabled
    })
    // if no zlib prompt
    if (!window.ZLibrary?.DCM && !showedZlibPrompt) return alert("Install Zlibrary for more features.")
    // If zlib add the 'MessageContextMenu'
    const MessageContextMenu = await ZLibrary.DCM.getDiscordMenu("MessageContextMenu")
    BdApi.Patcher.after("ReportMessages", MessageContextMenu, "default", (_, [args], res) => {
      if (!this.enabled) return
      const ifDevmode = res.props.children.find(e => e.props?.children?.props?.id === "devmode-copy-id")
      res.props.children.splice(res.props.children.length - (ifDevmode ? 2 : 0), 0, 
        ZLibrary.DCM.buildMenuItem({
          label: "Report Message",
          danger: true,
          action: () => showReportModalForMessage(args.message),
          icon: () => BdApi.React.createElement(Flag)
        })
      )
    })
  }
  // So it doesnt error
  start() {}
  stop() {}
}
