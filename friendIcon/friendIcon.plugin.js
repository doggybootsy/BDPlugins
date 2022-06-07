/**
 * @name friendIcon
 * @version 1.0.0
 * @author doggybootsy
 * @description Concept by immoral
 * @updateUrl https://raw.githubusercontent.com/doggybootsy/BDPlugins/main/friendIcon/friendIcon.plugin.js
 */

// update easily
async function updater(name) {
  // every 2 hrs run the updater
  setTimeout(() => updater(name), 1000 * 60 * 60 * 2)
  // Fetch file
  const result = await fetch(`https://raw.githubusercontent.com/doggybootsy/BDPlugins/main/${name}/${name}.plugin.js`)
  const content = await result.text()
  // If error
  if (content === "404: Not Found") return
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

const MessageHeader = BdApi.findModule(e => e.default?.displayName === "MessageHeader")
const dispatch = BdApi.findModuleByProps("dispatch", "dirtyDispatch")
const Tooltip = BdApi.findModuleByDisplayName("Tooltip")
const { Messages } = BdApi.findModule(e => e._events?.locale && Array.isArray(e._events?.locale))
const { getRelationshipType } = BdApi.findModuleByProps("getRelationshipType")
const { React } = BdApi

const relationShipTypes = [
  null,
  [BdApi.findModuleByDisplayName("PersonWaving"), Messages.FRIENDS],
  [BdApi.findModuleByDisplayName("Blocked"), Messages.BLOCKED],
  [BdApi.findModuleByDisplayName("PersonAdd"), Messages.FRIEND_REQUEST_ACCEPT],
  [BdApi.findModuleByDisplayName("Pending"), Messages.FRIENDS_SECTION_PENDING]
]

function icon({ author }) {
  const [relationShip, setRelationShip] = React.useState(getRelationshipType(author.id))
  const type = relationShipTypes[relationShip]
  React.useEffect(() => {
    function onRelationChange({ relationship }) {
      if (relationship.id === author.id) setRelationShip(getRelationshipType(author.id))
    }
    dispatch.subscribe("RELATIONSHIP_REMOVE", onRelationChange)
    dispatch.subscribe("RELATIONSHIP_ADD", onRelationChange)
    return () => {
      dispatch.unsubscribe("RELATIONSHIP_REMOVE", onRelationChange)
      dispatch.unsubscribe("RELATIONSHIP_ADD", onRelationChange)
    }
  })
  return type ? React.createElement(Tooltip, {
    text: type[1],
    children: (props) => React.createElement(type[0], {
      onMouseLeave: props.onMouseLeave,
      onMouseEnter: props.onMouseEnter,
      className: "friendIcon"
    })
  }) : false
}

const CSSBlockedLabel = relationShipTypes[2][1]
const css = `.friendIcon {
  display: inline-block;
  overflow: hidden;
  -o-object-fit: contain;
  object-fit: contain;
  margin-left: .25rem;
  vertical-align: top;
  position: relative;
  top: 1px;
  height: calc(1rem + 4px);
  width: calc(1rem + 4px);
  cursor: pointer;
} .friendIcon:hover {
  color: var(--text-normal)
} .friendIcon[aria-label="${CSSBlockedLabel}"] {
  color: var(--button-danger-background);
} .friendIcon[aria-label="${CSSBlockedLabel}"]:hover {
  color: var(--button-danger-background-hover);
} .friendIcon[aria-label="${CSSBlockedLabel}"]:active {
  color: var(--button-danger-background-active);
}`

module.exports = class friendIcon {
  start() {
    updater(this.constructor.name)
    BdApi.injectCSS("friendIcon", css)
    BdApi.Patcher.after("friendIcon", MessageHeader, "default", (_, [args], res) => {
      if (!Array.isArray(res.props.username)) res.props.username = [res.props.username]
      res.props.username.push(React.createElement(icon, { author: args.message.author }))
    })
  }
  stop() {
    BdApi.Patcher.unpatchAll("friendIcon")
    BdApi.clearCSS("friendIcon")
  }
}
