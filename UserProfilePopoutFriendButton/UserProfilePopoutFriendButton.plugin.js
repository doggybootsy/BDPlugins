/**
 * @name UserProfilePopoutFriendButton 
 * @version 1.1.2
 * @author doggybootsy
 * @description Adds the friend request button from user modals to user propouts
 * @updateUrl https://raw.githubusercontent.com/doggybootsy/BDPlugins/main/UserProfilePopoutFriendButton/UserProfilePopoutFriendButton.plugin.js
 */

const { React, Webpack, Patcher, ReactDOM, clearCSS, injectCSS } = BdApi

const RelationshipStore = Webpack.getModule(m => m.getRelationshipType)
const UserStore = Webpack.getModule(m => m.getCurrentUser && m.getUser)
const privateChannel = Webpack.getModule(m => m.openPrivateChannel && m.ensurePrivateChannel)
const { addRelationship, removeRelationship } = Webpack.getModule(m => m.addRelationship && m.removeRelationship)
const { useStateFromStores } = Webpack.getModule(m => m.useStateFromStores)

const Clickable = Webpack.getModule(m => m.displayName === "Clickable")
const OverflowMenu = Webpack.getModule(m => m.displayName === "OverflowMenu")
const SwitchItem = Webpack.getModule(m => m.displayName === "SwitchItem")

const { section } = Webpack.getModule(m => m.section && m.lastSection)
  
const UserPopoutContainer = Webpack.getModule(m => m.type?.displayName === "UserPopoutContainer")
const ModalApi = Webpack.getModule(m => m.closeModal && m.openModal)
const MenuApi = Webpack.getModule(m => m.closeContextMenu && m.openContextMenu)
const { RelationshipTypes } = Webpack.getModule(m => m.RelationshipTypes)

const UserBody = Webpack.getModule(m => {
  if (!m.default) return
  const str = m.default.toString()
  return str.includes(".customStatusActivity") && str.includes(".getUserProfile") && str.includes("usernameIcon:")
})

const Filters = {
  UserProfileActionsMenu: m => {
    if (!m.default) return
    const str = m.default.toString()
    return str.includes("AnalyticsLocationProvider") && !str.includes("pendingColors") && !m.default.displayName && !m.LocationContext
  },
  UserProfileFriendRequestButton: m => m.displayName === "UserProfileFriendRequestButton",
  classes: m => m.additionalActionsIcon && m.customStatus,
  otherClasses: m => m.avatar && m.guildMemberProfileTooltipNitroWheel,
  actionClasses: m => m.pendingIncoming && m.actionButton
}

const otherClasses = Webpack.getModule(Filters.otherClasses)

const asyncModules = async () => {
  const cache = {
    UserProfileActionsMenu: Webpack.getModule(Filters.UserProfileActionsMenu), 
    UserProfileFriendRequestButton: Webpack.getModule(Filters.UserProfileFriendRequestButton), 
    classes: Webpack.getModule(Filters.classes),
    actionClasses: Webpack.getModule(Filters.actionClasses)
  }
  if (Object.values(cache).filter(m => m).length === 4) return cache

  function fakeRenderAndClick(element, selector) {
    const node = document.createElement("div")
    ReactDOM.render(element, node)
    if (!cache.classes) cache.classes = Webpack.getModule(Filters.classes)
    if (selector) {
      const query = node.querySelector(selector())
      if (query) query.click()
    }
    ReactDOM.unmountComponentAtNode(node)
  }

  const undoModal = Patcher.instead("UserProfilePopoutFriendButton", ModalApi, "openModalLazy", (that, [ promise ]) => {
    const res = promise()
  
    return res.then((ReactMemo) => {
      const str = ReactMemo.toString()
      if (!(str.includes("user:") && str.includes("autoFocusNote:") && str.includes("friendToken:") && str.includes("initialSection:"))) return ModalApi.openModal(props => React.createElement(ReactMemo, props))
      undoModal()

      fakeRenderAndClick(React.createElement(ReactMemo), () => `.${cache.classes.relationshipButtons} > :last-child`)
    })
  })
  
  const undoMenu = Patcher.instead("UserProfilePopoutFriendButton", MenuApi, "openContextMenuLazy", (that, [ event, promise ], orig) => {
    const res = promise()
  
    res.then((ReactMemo) => {
      const str = ReactMemo.toString()
      if (!(str.includes("onRemoveFriend:") && str.includes("onMessage:") && str.includes("user:") && str.includes("relationshipType:"))) return orig(event, promise)

      undoMenu()
      fakeRenderAndClick(React.createElement(ReactMemo))
    })
  })
  
  fakeRenderAndClick(React.createElement(UserPopoutContainer, {
    userId: Object.keys(RelationshipStore.getRelationships())[0]
  }), () => `.${otherClasses.avatarWrapper}`)
  
  const all = Promise.all([
    Webpack.waitForModule(Filters.UserProfileFriendRequestButton),
    Webpack.waitForModule(Filters.UserProfileActionsMenu)
  ])

  const [ UserProfileFriendRequestButton ] = await all

  return {
    // Same module id but differnt export than the awaited one
    UserProfileActionsMenu: Webpack.getModule(Filters.UserProfileActionsMenu), 
    UserProfileFriendRequestButton, 
    classes: cache.classes,
    actionClasses: Webpack.getModule(Filters.actionClasses)
  }
}

// Not all modules just the async ones
const modules = {
  async: asyncModules()
}

modules.async.then(m => Object.entries(m).map(([k,v]) => modules[k] = v))

function RequestButton({ user, onClose }) {
  const { relationshipType, isCurrentUser } = useStateFromStores([ RelationshipStore, UserStore ], () => ({
    relationshipType: RelationshipStore.getRelationshipType(user.id),
    isCurrentUser: UserStore.getCurrentUser().id === user.id
  }))

  return React.createElement("div", {
    className: `${section} UserProfilePopoutFriendRequest`,
    children: [
      React.createElement(modules.UserProfileFriendRequestButton, {
        isCurrentUser,
        user,
        relationshipType,
        onAddFriend: () => addRelationship({
          userId: user.id,
          context: { location: "User Profile" }
        }),
        onIgnoreFriend: () => removeRelationship(user.id, { location: "User Profile" }),
        onSendMessage: async () => {
          await privateChannel.ensurePrivateChannel(user.id)
          privateChannel.openPrivateChannel(user.id)
          onClose()
        }
      }),
      isCurrentUser ? false : React.createElement(Clickable, {
        onClick: (event) => MenuApi.openContextMenu(event, (props) => {
          return React.createElement(Menu, { props, user, onClose })
        }),
        role: "button",
        tabIndex: 0,
        tag: "div",
        children: React.createElement(OverflowMenu, {
          className: modules.classes.additionalActionsIcon
        })
      })
    ]
  })
}

function Menu({ props, user, onClose }) {
  const { relationshipType } = useStateFromStores([ RelationshipStore ], () => ({
    relationshipType: RelationshipStore.getRelationshipType(user.id)
  }))
  
  return React.createElement(modules.UserProfileActionsMenu.default, {
    ...props, 
    user, 
    relationshipType,
    onRemoveFriend: () => removeRelationship(user.id),
    onBlock:() => addRelationship({
      userId: user.id,
      context: { location: "User Profile" },
      type: RelationshipTypes.BLOCKED
    }),
    onMessage: async () => {
      await privateChannel.ensurePrivateChannel(user.id)
      privateChannel.openPrivateChannel(user.id)
      onClose()
    }
  }) 
}

const css = `.UserProfilePopoutFriendRequest:not(:empty) { display: flex; align-items: center }
.UserProfilePopoutFriendRequest > :first-child,
.UserProfilePopoutFriendRequest > .{{pendingIncoming}} > button { width: 100% }
.UserProfilePopoutFriendRequest > :first-child:last-child { margin-left: auto }`

let shouldShowDMUser = BdApi.getData("UserProfilePopoutFriendButton", "shouldShowDMUser") ?? false
function Settings() {
  const [ val, setVal ] = React.useState(shouldShowDMUser)

  return React.createElement(SwitchItem, {
    value: val,
    children: "Show DM user section",
    onChange: (val) => {
      setVal(val)
      BdApi.setData("UserProfilePopoutFriendButton", "shouldShowDMUser", val)
      shouldShowDMUser = val
    }
  })
}

module.exports = class UserProfilePopoutFriendButton {
  stopped = true
  getSettingsPanel() { return React.createElement(Settings) }
  start() {
    this.stopped = false

    Patcher.after("UserProfilePopoutFriendButton", UserBody, "default", (that, [ props ], res) => {
      if (!res) return
      let i = res.props.children.indexOf(res.props.children.find(child => child.props.customStatusActivity))
      if (!~i) i++
      res.props.children.splice(i + 1, 0, React.createElement(RequestButton, { user: props.user, onClose: props.onClose }))
      if (!shouldShowDMUser) res.props.children.find(child => child.type.render).props.children.pop()
    })

    if (this.actionClasses) injectCSS("UserProfilePopoutFriendButton", css.replace("{{pendingIncoming}}", this.actionClasses.pendingIncoming))
    else modules.async.then(m => this.stopped ? null : (this.actionClasses = m.actionClasses) && injectCSS("UserProfilePopoutFriendButton", css.replace("{{pendingIncoming}}", this.actionClasses.pendingIncoming)))
  }
  stop() {
    Patcher.unpatchAll("UserProfilePopoutFriendButton")
    clearCSS("UserProfilePopoutFriendButton")
    this.stopped = true
  }
}
