/**
 * @name channelLocker
 * @description Allows you to look channels locally so you cant talk in them.
 * Based off of https://github.com/TaiAurori/channel-locker
 * @version 1.0.0
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
    this.setLocked(channelId, !orig)
    forceUpdate()
    setImmediate(() => {
      this.setLocked(channelId, orig)
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
      constructor(props) {
        super(props)
        this.state = {}
      }
      componentDidMount() { forceUpdate = this.forceUpdate.bind(this) }
      render() {
        if (_this.isLocked(channelId)) return _this.blockedChat()
        return this.props.res
      }
    }
  }

  start() {
    const CTA = this.generateCTA()
    BdApi.Patcher.after(this.constructor.name, ChannelTextAreaButtons, "type", (_, [props], res) => {
      const { children } = res.props
      let num = (getData("location")) ? 0 : children.length - children.filter(e => e.key === "submit").length
      if (props.type.analyticsName === "normal") children.splice(num, 0, React.createElement(ChannelTextAreaButton, {
        onClick: () => forceUpdate(this.setLocked(props.channel.id, true)),
        innerClassName: button,
        children: React.createElement(LockClosed)
      }))
    })
    BdApi.Patcher.instead(this.constructor.name, ChannelTextAreaContainer.type, "render", (_, [props], orig) => {
      const res = orig(props)
      channelId = props.channel.id
      if (props.type.analyticsName === "normal") return React.createElement(CTA, { res })
      return res
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
