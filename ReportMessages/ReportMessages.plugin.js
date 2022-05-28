/**
 * @name ReportMessages
 * @description Report messages within discord. 
 * @version 1.0.1
 * @author doggybootsy
 */

// Modules
const { React } = BdApi
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
// Data
const getData = BdApi.getData.bind(this, "ReportMessages")
const setData = BdApi.saveData.bind(this, "ReportMessages")
const showedPrompt = getData("showedPrompt")
// update easily
async function updater(name) {
  // every 2 hrs run the updater
  setTimeout(() => updater(name), 1000 * 60 * 60 * 2)
  // Fetch file
  const result = await fetch(`https://raw.githubusercontent.com/doggybootsy/BDPlugins/main/${name}/${name}.plugin.js`)
  const content = await result.text()
  // Local
  const meta = BdApi.Plugins.get(name)
  const out = await new Promise(r => {
    // Read meta
    const block = content.split("/**", 2)[1].split("*/", 1)[0]
    const out = {}
    let field = "", accum = ""
    for (const line of block.split(/[^\S\r\n]*?(?:\r\n|\n)[^\S\r\n]*?\*[^\S\r\n]?/)) {
      if (line.length === 0) continue
      if (line.charAt(0) === "@" && line.charAt(1) !== " ") {
        out[field] = accum
        const l = line.indexOf(" ")
        field = line.substring(1, l - 1)
        accum = line.substring(l + 1)
      } 
      else accum += " " + line.replace("\\n", "\n").replace(/^\\@/, "@")
    }
    out[field] = accum.trim()
    delete out[""]
    out.format = "jsdoc"
    function resolve() {
      if (out.version) return r(out)
      setImmediate(() => resolve())
    }
    resolve()
  })
  // Get versions
  const onlineVersion = Number(out.version.replaceAll(".", ""))
  const localVersion = Number(meta.version.replaceAll(".", ""))
  // if the online version isnt higher return
  if (!(onlineVersion > localVersion)) return
  // Open alert asking to update
  function update() {
    const path = require("path").join(__dirname, "quickReact.plugin.js")
    require("fs").writeFileSync(path, content)
  }
  if (BdApi.showNotice) BdApi.showNotice(`Plugin update available for ${name}!`, {
    type: "warning",
    number: 0,
    buttons: [{
      label: "update",
      onClick: (close) => {
        close()
        update()
      }
    }]
  })
  else {
    const { openModal } = BdApi.findModuleByProps("openModal", "openModalLazy")
    const Alert = BdApi.findModuleByDisplayName("Alert")
    openModal(props => React.createElement(Alert, {
      ...props,
      title: name,
      body: "Plugin is out of date!",
      cancelText: "Skip",
      confirmText: "Update",
      onConfirm: () => update()
    }))
  }
}

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
  async start() {
    updater(this.constructor.name)
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
      if (ele) ele.props.canReport = getData("MA") ?? true
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
