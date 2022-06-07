/**
 * @name UserProfilePopoutFriendButton 
 * @version 1.0.8
 * @author doggybootsy
 * @description Adds the friend request button from user modals to user propouts
 * @updateUrl https://raw.githubusercontent.com/doggybootsy/BDPlugins/main/UserProfilePopoutFriendButton/UserProfilePopoutFriendButton.plugin.js
 */

// Lazy loaded modules
let UserProfileFriendRequestButton = BdApi.findModuleByDisplayName("UserProfileFriendRequestButton")
let UserProfileActionsMenu = BdApi.findModuleByDisplayName("UserProfileActionsMenu")
let classes = BdApi.findModuleByProps("additionalActionsIcon")
// React
const { React } = BdApi
// Modules
const UserPopout = BdApi.findModuleByProps("UserPopoutInfo")
const { getCurrentUser } = BdApi.findModuleByProps("getCurrentUser")
const { addRelationship, removeRelationship } = BdApi.findModuleByProps("addRelationship", "removeRelationship")
const privateChannel = BdApi.findModuleByProps("openPrivateChannel", "ensurePrivateChannel")
const OverflowMenu = BdApi.findModuleByDisplayName("OverflowMenu")
const Clickable = BdApi.findModuleByDisplayName("Clickable")
const { getRelationshipType } = BdApi.findModuleByProps("getRelationships")
const dispatch = BdApi.findModuleByProps("dispatch", "dirtyDispatch")
const { RelationshipTypes } = BdApi.findModuleByProps("RelationshipTypes")
const { openContextMenu } = BdApi.findModuleByProps("openContextMenuLazy")
// Catcher Errors
function reactCatcher(elementType, elementProps) {
  class reactCatcher extends React.PureComponent {
    constructor(props) {
      super(props)
      this.state = { crashed: false }
    }
    static displayName = "UPPFB-Error-Boundary"
    componentDidCatch() { this.setState({ crashed: true }) }
    render() {
      return this.state.crashed ? React.createElement("div", {
        className: "UPPFB-React-Error"
      }, "React Error") : React.createElement(elementType, elementProps) 
    }
  }
  return React.createElement(reactCatcher)
}
// Make a function component and make it fancy
function makeFunctionalComponent(type, displayName) {
  displayName = `UPPFB-${displayName}`
  type.displayName = displayName + "-Child"
  return Object.assign((props) => reactCatcher(type, props), { displayName: displayName + "-Wrapper" })
}
// A simple wrapper for the relation status
const RelationStatusWrapper = makeFunctionalComponent(({ user, children }) => {
  const [relationshipType, setRelationshipType] = React.useState(getRelationshipType(user.id))
  // Subscribe to relationship add/remove
  React.useEffect(() => {
    function onRelationChange({ relationship }) {
      if (relationship.id === user.id) setRelationshipType(getRelationshipType(user.id))
    }
    dispatch.subscribe("RELATIONSHIP_REMOVE", onRelationChange)
    dispatch.subscribe("RELATIONSHIP_ADD", onRelationChange)
    return () => {
      dispatch.unsubscribe("RELATIONSHIP_REMOVE", onRelationChange)
      dispatch.unsubscribe("RELATIONSHIP_ADD", onRelationChange)
    }
  })
  return children(relationshipType)
}, "Relation-Status")

// Add lazy loaded modules if they dont exist
webpackChunkdiscord_app.push([[Symbol()], {}, async (instance) => {
  // If the button or the classes arent added load it
  if (!UserProfileFriendRequestButton || !classes) {
    await instance.e("16972")
    UserProfileFriendRequestButton = instance("299993").default
    classes = instance("674198")
  }
  // If 'UserProfileActionsMenu' doesnt exist add it
  if (!UserProfileActionsMenu) {
    await instance.e("41056")
    UserProfileActionsMenu = instance("441056").default
  }  
  webpackChunkdiscord_app.pop()
}])
// Open the 'UserProfileActionsMenu' Menu
function openMenu(event, user) {
  openContextMenu(event, (event) => {
    return React.createElement(RelationStatusWrapper, {
      user,
      children: relationshipType => React.createElement(UserProfileActionsMenu, {
        ...event, user, relationshipType,
        onRemoveFriend: () => removeRelationship(user.id),
        onBlock:() => addRelationship({
          userId: user.id,
          context: { location: "User Profile" },
          type: RelationshipTypes.BLOCKED
        }),
        onMessage: async () => {
          await privateChannel.ensurePrivateChannel(user.id)
          return privateChannel.openPrivateChannel(user.id)
        }
      })
    })
  })
}
// Request Button
const RequestButton = makeFunctionalComponent(function({ user }) {
  // 'UserProfileFriendRequestButton' has a 'isCurrentUser' prop to not show the button
  const isCurrentUser = getCurrentUser().id === user.id
  return React.createElement(RelationStatusWrapper, {
    user, children: relationshipType => React.createElement("div", {
      className: "UserProfilePopoutFriendRequest",
      children: [
        React.createElement(UserProfileFriendRequestButton, {
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
            return privateChannel.openPrivateChannel(user.id)
          }
        }),
        isCurrentUser ? false : React.createElement(Clickable, {
          onClick: (event) => openMenu(event, user),
          role: "button",
          tabIndex: 0,
          tag: "div",
          children: React.createElement(OverflowMenu, {
            className: classes.additionalActionsIcon
          })
        })
      ]
    })
  })
}, "RequestButton")
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

module.exports = class UserProfilePopoutFriendButton {
  start() {
    this.stopUpdater = updater(this.constructor.name)
    // CSS
    BdApi.injectCSS(this.constructor.name, `.UserProfilePopoutFriendRequest:not(:empty) { display: flex; align-items: center; margin-top: 8px }
.UserProfilePopoutFriendRequest > :first-child,
.UserProfilePopoutFriendRequest > .pendingIncoming-3g05VP > button { width: 100% }
.UserProfilePopoutFriendRequest > :first-child:last-child { margin-left: auto }
.UPPFB-React-Error { color: red; text-align: center; padding: 6px; margin-top: 10px; background: var(--background-primary); border-radius: 6px }`)
    // The patch
    BdApi.Patcher.after(this.constructor.name, UserPopout, "UserPopoutInfo", (_, [{ user }], result) => {
      result.props.children.push(React.createElement(RequestButton, { user }))
    })
  }
  async stop() {
    // Remove css and patch
    BdApi.clearCSS(this.constructor.name)
    BdApi.Patcher.unpatchAll(this.constructor.name)
    void (await this.stopUpdater)()
  }
}
