/**
 * @name channelLocker
 * @description Allows you to look channels locally so you cant talk in them.
 * Based off of https://github.com/TaiAurori/channel-locker
 * @version 1.0.1
 * @author doggybootsy
 */

const { React } = BdApi

const { wrapper, content, buttonContainer, title } = BdApi.findModuleByProps("wrapper", "text", "countdown")
const Button = BdApi.findModuleByProps("BorderColors", "Hovers")
const Header = BdApi.findModuleByProps("Sizes", "Tags")
const ChannelTextAreaButtons = BdApi.findModule(m => m.type && m.type.displayName === "ChannelTextAreaButtons")
const ChannelTextAreaButton = BdApi.findModule(m => m.type?.displayName === "ChannelTextAreaButton")
const ChannelTextAreaContainer = BdApi.findModule(e => e?.type?.render?.displayName === "ChannelTextAreaContainer")
const { button } = BdApi.findModuleByProps("button", "sticker")
const LockClosed = BdApi.findModuleByDisplayName("LockClosed")
const SwitchItem = BdApi.findModuleByDisplayName("SwitchItem")
const getData = BdApi.getData.bind(null, "channelLocker")
const setData = BdApi.setData.bind(null, "channelLocker")
let forceUpdate = () => {}
let channelId

setData("channels", getData("channels") ?? [])
setData("location", getData("location") ?? true)
setData("iconOrString", getData("iconOrString") ?? true)

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

module.exports = class channelLocker {
  isLocked(id) {
    return getData("channels").find(e => e === id) ?? false
  }
  setLocked(id, value) {
    let data = getData("channels")
    if (!value) data.splice(data.indexOf(id), 1)
    else data.push(id)
    setData("channels", data)
  }

  updateIcons() {
    // Confusing but working way to rerender the buttons
    const orig = this.isLocked(channelId)
    if (!orig) return
    this.setLocked(channelId, false)
    forceUpdate()
    setImmediate(() => {
      this.setLocked(channelId, true)
      forceUpdate()
    })
  }

  blockedChat() {
    return React.createElement("div", {
      className: wrapper,
      children: [
        React.createElement("div", {
          className: content,
          children: React.createElement(Header, {
            size: Header.Sizes.SIZE_16,
            className: title,
            children: "You currently have this channel locked locally."
          })
        }),
        React.createElement("div", {
          className: buttonContainer,
          children: React.createElement(Button, {
            size: Button.Sizes[(getData("iconOrString")) ? "SMALL" : "ICON"],
            color: Button.Colors.PRIMARY,
            onClick: () => forceUpdate(this.setLocked(channelId, false)),
            children: (getData("iconOrString")) ? "Unlock" : React.createElement(LockClosed)
          })
        })
      ]
    })
  }
  
  generateCTA() {
    let _this = this
    if (this.cta) return this.cta
    return this.cta = class extends React.Component {
      componentDidMount() { forceUpdate = this.forceUpdate.bind(this) }
      render() {
        if (_this.isLocked(channelId)) return _this.blockedChat()
        return this.props.res
      }
    }
  }

  start() {
    updater(this.constructor.name)
    const CTA = this.generateCTA()
    BdApi.Patcher.after(this.constructor.name, ChannelTextAreaButtons, "type", (_, [props], res) => {
      if (!res) return
      const { children } = res.props
      let num = (getData("location")) ? 0 : children.length - children.filter(e => e.key === "submit").length
      if (props.type.analyticsName !== "normal") return
      children.splice(num, 0, React.createElement(ChannelTextAreaButton, {
        onClick: () => forceUpdate(this.setLocked(props.channel.id, true)),
        innerClassName: button,
        children: React.createElement(LockClosed)
      }))
    })
    BdApi.Patcher.instead(this.constructor.name, ChannelTextAreaContainer.type, "render", (_, [props], orig) => {
      const res = orig(props)
      if (props.type.analyticsName !== "normal") return res
      channelId = props.channel.id
      return React.createElement(CTA, { res })
    })
  }
  stop() { BdApi.Patcher.unpatchAll(this.constructor.name) }
  getSettingsPanel() {
    return React.createElement(() => {
      const [ico, setICO] = React.useState(getData("iconOrString"))
      const [loc, setLoc] = React.useState(getData("location"))
      return React.createElement(React.Fragment, {
        children: [
          React.createElement(SwitchItem, {
            value: ico,
            onChange: (val) => {
              setICO(val)
              setData("iconOrString", val)
            },
            note: "Makes the button to unlock the channel be a icon or string. String is true | Icon is false",
          }, "Unlock button be icon or string"),
          React.createElement(SwitchItem, {
            value: loc,
            onChange: (val) => {
              setLoc(val)
              setData("location", val)
              this.updateIcons()
            },
            note: "Makes the lock icon be at the very front instead of the end.",
          }, "Have the lock icon be at the start")
        ]
      })
    })
  }
}
