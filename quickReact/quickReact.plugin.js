/**
 * @name quickReact
 * @description Quickly react to messages. 
 * @version 1.0.6
 * @author doggybootsy
 */

const { React, Webpack } = BdApi

const MiniPopover = Webpack.getModule(m => m.default?.displayName === "MiniPopover")
const Tooltip = Webpack.getModule(m => m.displayName === "Tooltip")
const { Text } = Webpack.getModule(m => typeof m.Text === "function" && m.__esModule)
const EmojiPicker = Webpack.getModule(m => m.type?.render?.displayName === "EmojiPicker")
const EmojiSpriteSheet = Webpack.getModule(m => {
  const stringed = m.type?.toString()
  if (!stringed) return false
  return stringed.includes("useSpriteSheet") && stringed.includes("getEmojiURL")
})

const allEmojis = Webpack.getModule(m => m.EMOJI_NAME_RE && m.all).all()
const { getCurrentUser } = Webpack.getModule(m => m.getCurrentUser)
const ReactionModule = Webpack.getModule(m => m.addReaction)

let emoji = BdApi.getData("quickReact", "emoji")
if (!emoji) {
  emoji = [
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
}

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

async function react({ id, channel_id }) {
  const reactions = await ReactionModule.getReactions(channel_id, id, emoji[0])

  if (reactions.find(({ id }) => id === getCurrentUser().id)) 
    return ReactionModule.removeReaction(channel_id, id, emoji[0])
  ReactionModule.addReaction(channel_id, id, emoji[0])
}

const listeners = new Set()

function Picker({ setEmoji }) {
  return React.createElement(EmojiPicker, {
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
    inEmojiPicker: false,
    persistSearch: true,
    pickerIntention: 2
  })
}

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


module.exports = class quickReact {
  start() {
    
    BdApi.injectCSS("quickReact", "#quickReact > #emoji-picker-tab-panel > :first-child { width: 100% }")
    
    BdApi.Patcher.after("quickReact", MiniPopover, "default", (_, args, res) => {
      if (!args[0].children[args[0].children.length - 1]?.props?.message) return 
      const child = res.props.children.find(e => e)
      if (!child) return 

      const oldType = child.type
      child.type = (...args) => {
        const res = Reflect.apply(oldType, this, args)

        if (!args[0].canReact) return res

        const [ whatEmoji, setEmoji ] = React.useState(emoji[1])

        React.useEffect(() => {
          function listener(emoji) { setEmoji(emoji) }
          listeners.add(listener)
          return () => listeners.delete(listener)
        })

        if (whatEmoji) res.props.children.unshift(
          React.createElement(Tooltip, {
            text: whatEmoji.emojiName,
            children: (ttProps) => React.createElement(MiniPopover.Button, {
              ...ttProps,
              children: React.createElement(Emoji, {
                emoji: whatEmoji
              }),
              onClick: () => react(args[0].message)
            })
          })
        )

        return res
      }
    })
  }
  async stop() {
    
    for (const listener of [...listeners]) listener(false)
    
    BdApi.Patcher.unpatchAll("quickReact")
    BdApi.clearCSS("quickReact")
  }
  getSettingsPanel() { return React.createElement(settings) }
}
