/**
 * @name quickReact
 * @description Quickly react to messages. 
 * @version 1.0.5
 * @author doggybootsy
 */

const { React } = BdApi
// React elements
const MiniPopover = BdApi.findModule(m => m.default.displayName === "MiniPopover")
const Tooltip = BdApi.findModuleByDisplayName("Tooltip")
const { Text } = BdApi.findModule(m => typeof m.Text === "function" && m.__esModule)
const ExpressionPicker = BdApi.findModule(m => {
  const stringed = m.type?.toString()
  if (!stringed) return false
  return stringed.includes("pickerIntention") && stringed.includes("inExpressionPicker")
})
const EmojiSpriteSheet = BdApi.findModule(m => {
  const stringed = m.type?.toString()
  if (!stringed) return false
  return stringed.includes("useSpriteSheet") && stringed.includes("getEmojiURL")
})
const Popout = BdApi.findModuleByDisplayName("Popout")
// Emojis
const allEmojis = BdApi.findModuleByProps("EMOJI_NAME_RE").all()
// CurrentUser store
const { getCurrentUser } = BdApi.findModuleByProps("getCurrentUser")
// Reactions
const ReactionModule = BdApi.findModuleByProps("addReaction")
// emoji
let emoji = BdApi.getData("quickReact", "emoji") ?? [
  {
    animated: false,
    name: "⭐",
    surrogateCodePoint: "",
    id: null
  },
  {
    alt: "⭐",
    emojiName: ":star:",
    name: ":star:",
    surrogateCodePoint: "",
    src: "/assets/141d49436743034a59dec6bd5618675d.svg"
  }
]
BdApi.setData("quickReact", "emoji", emoji)
// Emoji
function Emoji({ emoji, jumbo }) {
  let emojiInfo = {}
  allEmojis.find(e => {
    if (e.allNamesString === emoji.emojiName) {
      emojiInfo = e
      return true
    }
    if (!e.hasDiversity) return
    for (const child of Object.values(e.diversityChildren))
      if (child.allNamesString === emoji.emojiName) {
        emojiInfo = child
        return true
      }
  })
  return React.createElement("div", {
    id: "quickReactEmojiWrapper",
    style: { zoom: ".7" },
    children: React.createElement(EmojiSpriteSheet, {
        rowIndex: 1,
        size: jumbo ? 48 : 32,
        emoji: emojiInfo,
        surrogateCodePoint: emoji.surrogateCodePoint,
        "aria-label": emoji.emojiName,
        useReducedMotion: false
      })
  })
}
// react to message easy
async function react({ id, channel_id }) {
  const reactions = await ReactionModule.getReactions(channel_id, id, emoji[0])

  if (reactions.find(({ id }) => id === getCurrentUser().id)) 
    return ReactionModule.removeReaction(channel_id, id, emoji[0])
  ReactionModule.addReaction(channel_id, id, emoji[0])
}
// listeners to update the buttons
const listeners = new Set()
// Picker
function Picker({ setEmoji }) {
  return React.createElement(ExpressionPicker, {
    channel: null,
    onSelectEmoji(emojiInfo) {
      const scp = Object.keys(emojiInfo.diversityChildren)[Number(emojiInfo.name.split("-").pop())] ?? ""

      const newEmoji = [
        {
          animated: false,
          name: scp ? emojiInfo.diversityChildren[scp].surrogates : emojiInfo.surrogates,
          surrogateCodePoint: scp,
          id: null
        },
        {
          alt: emojiInfo.surrogates,
          emojiName: emojiInfo.allNamesString,
          name: emojiInfo.name,
          surrogateCodePoint: scp,
          src: emojiInfo.url
        }
      ]
      BdApi.setData("quickReact", "emoji", newEmoji)
      emoji = newEmoji
      for (const listener of [...listeners]) listener(newEmoji[1])
      setEmoji(newEmoji[1])
    },
    emojiSize: 32,
    inExpressionPicker: false,
    persistSearch: true,
    pickerIntention: 2
  })
}
// settings
function settings() {
  const [whatEmoji, setEmoji] = React.useState(emoji[1])
  
  return React.createElement("div", {
    id: "quickReact",
    children: [
      React.createElement(Text, {
        children: "Current Emoji"
      }),
      React.createElement(Emoji, {
        emoji: whatEmoji,
        jumbo: true
      }),
      React.createElement("div", { style: { margin: 10 }}),
      React.createElement(Picker, { setEmoji })
    ]
  })
}
// button
const Button = React.memo(function({ whatEmoji, setEmoji, message }) {
  const [shouldShow, setShouldShow] = React.useState(false)

  return React.createElement(Tooltip, {
    text: whatEmoji.emojiName,
    children: (ttProps) => React.createElement(Popout, {
      shouldShow,
      onRequestClose: () => {
        setShouldShow(false)
      },
      position: Popout.Positions.LEFT,
      animation: Popout.Animation.NONE,
      renderPopout: () => React.createElement(Picker, {
        setEmoji: (emoji) => {
          setEmoji(emoji)
          setShouldShow(false)
        }}
      ),
      children: (poProps) => {
        return React.createElement(MiniPopover.Button, {
          ...ttProps,
          ...poProps,
          children: React.createElement(Emoji, {
            emoji: whatEmoji
          }),
          onClick: () => react(message),
          onContextMenu: () => {
            setShouldShow(!shouldShow)
          }
        })
      }
    })
  })
})
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
    const path = require("path").resolve(__dirname, __filename)
    require("fs").writeFileSync(path, content)
  }
  if (BdApi.showNotice) return BdApi.showNotice(`Plugin update available for ${name}!`, {
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
    const { openModal, closeModal } = BdApi.findModuleByProps("openModal", "openModalLazy")
    const Alert = BdApi.findModuleByDisplayName("Alert")
    const id = openModal(props => React.createElement(Alert, {
      ...props,
      title: name,
      body: "Plugin is out of date!",
      cancelText: "Skip",
      confirmText: "Update",
      onConfirm: () => update()
    }))
    return () => closeModal(id)
  }
}
// Plugin
module.exports = class quickReact {
  load() { this.stopUpdater = () => {} }
  start() {
    this.stopUpdater = updater(this.constructor.name)
    // css for settings
    BdApi.injectCSS("quickReact", "#quickReact > #emoji-picker-tab-panel > :first-child { width: 100% }")
    // Patch
    BdApi.Patcher.after("quickReact", MiniPopover, "default", (_, args, res) => {
      if (!args[0].children[args[0].children.length - 1]?.props?.message) return 
      const child = res.props.children.find(e => e)
      if (!child) return 

      const oldType = child.type
      child.type = (...args) => {
        const res = Reflect.apply(oldType, this, args)

        if (!args[0].canReact) return res

        const [whatEmoji, setEmoji] = React.useState(emoji[1])

        React.useEffect(() => {
          function listener(emoji) { setEmoji(emoji) }
          listeners.add(listener)
          return () => listeners.delete(listener)
        })

        if (whatEmoji) res.props.children.unshift(
          React.createElement(Button, {
            whatEmoji, setEmoji, message: args[0].message
          })
        )

        return res
      }
    })
  }
  async stop() {
    // to rerenderer the elmenents
    for (const listener of [...listeners]) listener(false)
    // undo
    BdApi.Patcher.unpatchAll("quickReact")
    BdApi.clearCSS("quickReact")
    void (await this.stopUpdater)()
  }
  getSettingsPanel() { return React.createElement(settings) }
}
