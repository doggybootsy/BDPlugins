/**
 * @name quickReact
 * @description Quickly react to messages. 
 * @version 1.0.0
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
    id: null
  },
  {
    alt: "⭐",
    emojiName: ":star:",
    name: ":star:",
    src: "/assets/141d49436743034a59dec6bd5618675d.svg"
  }
]
BdApi.setData("quickReact", "emoji", emoji)
// Emoji
function Emoji({ emoji, jumbo }) {
  return React.createElement("div", {
    id: "quickReactEmojiWrapper",
    style: emoji.url ? null : { zoom: ".7" },
    children: React.createElement(EmojiSpriteSheet, {
        rowIndex: 1,
        size: jumbo ? 48 : 32,
        emoji: allEmojis.find(e => e.allNamesString === emoji.emojiName),
        surrogateCodePoint: "",
        "aria-label": emoji.emojiName,
        useReducedMotion: false
      })
  })
}
// react to message easy
async function react({ id, channel_id }) {
  const reactions = await ReactionModule.getReactions(channel_id, id, emoji[0])

  if (reactions.find(({ id }) => id === getCurrentUser().id)) return ReactionModule.removeReaction(channel_id, id, emoji[0])
  ReactionModule.addReaction(channel_id, id, emoji[0])
}
// listeners to update the buttons
const listeners = new Set()
// Picker
function Picker({ setEmoji }) {
  return React.createElement(ExpressionPicker, {
    channel: null,
    onSelectEmoji(emojiInfo) {
      const newEmoji = [
        {
          animated: false,
          name: emojiInfo.surrogates,
          id: null
        },
        {
          alt: emojiInfo.surrogates,
          emojiName: emojiInfo.allNamesString,
          name: emojiInfo.allNamesString,
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
function Button({ ttProps, whatEmoji, setEmoji, message }) {
  const [shouldShow, setShouldShow] = React.useState(false)

  return React.createElement(Popout, {
    shouldShow,
    onRequestClose: () => setShouldShow(false),
    position: Popout.Positions.LEFT,
    animation: Popout.Animation.SCALE,
    renderPopout: () => React.createElement(Picker, { setEmoji: (emoji) => {
      setEmoji(emoji)
      setShouldShow(false)
    }}),
    children: (poProps) => {
      return React.createElement(MiniPopover.Button, {
        ...ttProps,
        ...poProps,
        children: React.createElement(Emoji, {
          emoji: whatEmoji
        }),
        onClick: () => react(message),
        onContextMenu() { setShouldShow(!shouldShow) }
      })
    }
  })
}

module.exports = class quickReact {
  start() {
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
          React.createElement(Tooltip, {
            text: whatEmoji.emojiName,
            children: (ttProps) => React.createElement(Button, {
              ttProps, whatEmoji, setEmoji, message: args[0].message
            })
          })
        )

        return res
      }
    })
  }
  stop() {
    // to rerenderer the elmenents
    for (const listener of [...listeners]) listener(false)
    // undo
    BdApi.Patcher.unpatchAll("quickReact")
    BdApi.injectCSS("quickReact")
  }
  getSettingsPanel() { return React.createElement(settings) }
}
