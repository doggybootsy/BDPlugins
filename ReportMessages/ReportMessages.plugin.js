/**
 * @name ReportMessages
 * @description Report messages within discord. 
 * @version 1.0.0
 * @author doggybootsy
 */

// Modules
const { Messages } = BdApi.findAllModules(e => e.Messages)[1]
const MiniPopover = BdApi.findModule(m => m.default.displayName === "MiniPopover")
const Flag = BdApi.findModuleByDisplayName("Flag")
const {
  showReportModalForMessage
} = BdApi.findModuleByProps("showReportModalForMessage", "showReportModalForGuild")
const Alert = BdApi.findModuleByDisplayName("Alert")
const { openModal } = BdApi.findModuleByProps("openModalLazy", "openModal")
const Switch = BdApi.findModuleByDisplayName("SwitchItem")
const Tooltip = BdApi.findModuleByDisplayName("Tooltip")
const Markdown = BdApi.findModule((m) => m?.displayName === "Markdown" && m.rules)
const { React } = BdApi
// Data
const getData = BdApi.getData.bind(this, "ReportMessages")
const setData = BdApi.saveData.bind(this, "ReportMessages")
const showedPrompt = getData("showedPrompt")

module.exports = class ReportMessages {
  getName() { return Messages.REPORT_MESSAGE_MENU_OPTION }
  get enabled() { return BdApi.Plugins.isEnabled("ReportMessages") }
  alert(...body) {
    openModal(props => React.createElement(Alert, {
      ...props, title: "ReportMessages", 
      body: body.map((c) => typeof(c) === "string" ? React.createElement(Markdown, {}, c) : c)
    }))
  }
  async load() {
    // set the shown prompt to 'true'
    setData("showedPrompt", true)
    // if no zlib prompt
    if (!window.ZLibrary?.DCM && !showedPrompt) return this.alert("Install **Zlibrary** for more features.", "**Warning**: Spam reporting can get you banned.")
    // show warning
    if (!showedPrompt) this.alert("Spam reporting can get you banned.")
  }
  // So it doesnt error
  async start() {
    // patch 'MiniPopover' and enable the button
    BdApi.Patcher.after("ReportMessages", MiniPopover, "default", (_, args, res) => {
      if (!args[0].children[args[0].children.length - 1]?.props?.message) return 
      const child = res.props.children.find(e => e)
      if (child) {
        const oldType = child.type
        child.type = (...args) => {
          const res = Reflect.apply(oldType, this, args)
          if (getData("MP") ?? true) res.props.children.unshift(
            React.createElement(Tooltip, {
              text: Messages.REPORT_MESSAGE_MENU_OPTION,
              children: (ttProps) => React.createElement(MiniPopover.Button, {
                ...ttProps,
                children: React.createElement(Flag),
                onClick: () => showReportModalForMessage(child.props.message)
              })
            })
          )
          return res
        }
      }
      const ele = args[0].children[args[0].children.length - 1]
      if (ele) ele.props.canReport = getData("MCN") ?? true
    })
    // If no zlib return
    if (!window.ZLibrary?.DCM && this.hasStarted) return
    this.hasStarted = true
    // If zlib add the 'MessageContextMenu'
    const MessageContextMenu = await ZLibrary.DCM.getDiscordMenu("MessageContextMenu")
    BdApi.Patcher.after("ReportMessages", MessageContextMenu, "default", (_, [args], res) => {
      if (!this.enabled || !(getData("MCN") ?? true)) return
      const ifDevmode = res.props.children.find(e => e.props?.children?.props?.id === "devmode-copy-id")
      res.props.children.splice(ifDevmode ? res.props.children.indexOf(ifDevmode) : res.props.children.length, 0, 
        ZLibrary.DCM.buildMenuItem({
          label: "Report Message",
          danger: true,
          action: () => showReportModalForMessage(args.message),
          icon: () => React.createElement(Flag)
        })
      )
    })
  }
  stop() { BdApi.Patcher.unpatchAll("ReportMessages") }
  getSettingsPanel() {
    return React.createElement(() => {
      const [MCN, setMCN] = React.useState(getData("MCN") ?? true)
      const [mn, setMN] = React.useState(getData("MA") ?? true)
      const [MP, setMP] = React.useState(getData("MP") ?? true)

      return React.createElement(React.Fragment, {
        children: [
          React.createElement(Switch, {
            value: MCN,
            onChange: (value) => {
              setMCN(value)
              setData("MCN", value)
            },
            children: "Message Context Menu",
            disabled: !window.ZLibrary
          }),
          React.createElement(Switch, {
            value: mn,
            onChange: (value) => {
              setMN(value)
              setData("MA", value)
            },
            children: "Message Actions"
          }),
          React.createElement(Switch, {
            value: MP,
            onChange: (value) => {
              setMP(value)
              setData("MP", value)
            },
            children: "Mini Popover"
          })
        ]
      })
    })
  }
}
