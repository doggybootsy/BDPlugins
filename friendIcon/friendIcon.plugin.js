/**
 * @name friendIcon
 * @version 1.0.6
 * @author doggybootsy
 * @description Show if a person is a friend, pending a friend request, sent a friend request or blocked
 * @updateUrl https://raw.githubusercontent.com/doggybootsy/BDPlugins/main/friendIcon/friendIcon.plugin.js
 */

const { React, Webpack } = BdApi

const MessageHeader = Webpack.getModule(e => e.default?.displayName === "MessageHeader")
const Tooltip = Webpack.getModule(m => m.displayName === "Tooltip")

const { Messages } = Webpack.getModule(e => e._events?.locale && Array.isArray(e._events?.locale))
const RelationshipStore = Webpack.getModule(m => m.getRelationshipType)
const { useStateFromStores } = Webpack.getModule(m => m.useStateFromStores)
const { messageListItem } = Webpack.getModule(m => m.messageListItem)

const relationShipTypes = [
  [ ],
  [
    Webpack.getModule(m => m.displayName === "PersonWaving"), 
    Messages.FRIENDS
  ],
  [
    Webpack.getModule(m => m.displayName === "Blocked"), 
    Messages.BLOCKED
  ],
  [
    Webpack.getModule(m => m.displayName === "PersonAdd"), 
    Messages.FRIEND_REQUEST_ACCEPT
  ],
  [
    Webpack.getModule(m => m.displayName === "Pending"), 
    Messages.FRIENDS_SECTION_PENDING
  ]
]

function Icon({ author }) {
  const [ icon, text ] = useStateFromStores([ RelationshipStore ], () => relationShipTypes[RelationshipStore.getRelationshipType(author.id)])
  
  return icon ? React.createElement(Tooltip, {
    text: text,
    children: (props) => React.createElement(icon, {
      onMouseLeave: props.onMouseLeave,
      onMouseEnter: props.onMouseEnter,
      className: "friendIcon"
    })
  }) : null
}

const cssBlockedLabel = JSON.stringify(Messages.BLOCKED)
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
} .friendIcon[aria-label=${cssBlockedLabel}] {
  color: var(--button-danger-background);
} .friendIcon[aria-label=${cssBlockedLabel}]:hover {
  color: var(--button-danger-background-hover);
} .friendIcon[aria-label=${cssBlockedLabel}]:active {
  color: var(--button-danger-background-active);
}`

module.exports = class friendIcon {
  start() {
    BdApi.injectCSS("friendIcon", css)
    BdApi.Patcher.after("friendIcon", MessageHeader, "default", (_, [args], res) => {
      if (!Array.isArray(res.props.username)) res.props.username = [res.props.username]
      res.props.username.push(React.createElement(Icon, { author: args.message.author }))
    })
    Array.from(document.querySelectorAll(`.${messageListItem}`), n => BdApi.getInternalInstance(n).child.memoizedProps.onMouseMove())
  }
  stop() {
    BdApi.Patcher.unpatchAll("friendIcon")
    BdApi.clearCSS("friendIcon")
  }
}
