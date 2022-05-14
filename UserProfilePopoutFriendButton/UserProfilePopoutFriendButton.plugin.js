/**
 * @name UserProfilePopoutFriendButton 
 * @version 1.0.0
 * @author doggybootsy
 * @description Adds the friend request button from user modals to user propouts
 */

const UserPopout = BdApi.findModuleByProps("UserPopoutInfo")

let UserProfileFriendRequestButton = BdApi.findModuleByDisplayName("UserProfileFriendRequestButton")
let UserProfileActionsMenu = BdApi.findModuleByDisplayName("UserProfileActionsMenu")
let classes = BdApi.findModuleByProps("additionalActionsIcon")

const { React } = BdApi

const { getCurrentUser } = BdApi.findModuleByProps("getCurrentUser")
const { addRelationship, removeRelationship } = BdApi.findModuleByProps("addRelationship", "removeRelationship")
const privateChannel = BdApi.findModuleByProps("openPrivateChannel", "ensurePrivateChannel")
const OverflowMenu = BdApi.findModuleByDisplayName("OverflowMenu")
const Clickable = BdApi.findModuleByDisplayName("Clickable")
const { getRelationshipType } = BdApi.findModuleByProps("getRelationships")
const dispatch = BdApi.findModuleByProps("dispatch", "dirtyDispatch")
const { RelationshipTypes } = BdApi.findModuleByProps("RelationshipTypes")
const { openContextMenu } = BdApi.findModuleByProps("openContextMenuLazy")

function RelationStatusWrapper({ user, children }) {
  const [relationshipType, setRelationshipType] = BdApi.React.useState(getRelationshipType(user.id))
  // Subscribe to relationship add/remove
  BdApi.React.useEffect(() => {
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
}
webpackChunkdiscord_app.push([[Symbol()], {}, async (instance) => {
  await instance.e("16972")
  if (!UserProfileFriendRequestButton) UserProfileFriendRequestButton = instance("299993").default
  if (!classes) classes = instance("674198")
  await instance.e("41056")
  if (!UserProfileActionsMenu) UserProfileActionsMenu = instance("441056").default  
  webpackChunkdiscord_app.pop()
}])

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

function RequestButton({ user }) {
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
        React.createElement(Clickable, {
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
}

module.exports = class UserProfilePopoutFriendButton {
  start() {
    BdApi.injectCSS(this.constructor.name, `.UserProfilePopoutFriendRequest:not(:empty) { display: flex; align-items: center; margin-top: 8px }
.UserProfilePopoutFriendRequest > :first-child,
.UserProfilePopoutFriendRequest > .pendingIncoming-3g05VP > button { width: 100% }
.UserProfilePopoutFriendRequest > :first-child:last-child { margin-left: auto }`)
    BdApi.Patcher.after(
      this.constructor.name, 
      UserPopout, 
      "UserPopoutInfo", 
      (_, [{ user }], result) => {
        result.props.children.push(React.createElement(RequestButton, { user }))
      }
    )
  }
  stop() {
    BdApi.clearCSS(this.constructor.name)
    BdApi.Patcher.unpatchAll(this.constructor.name)
  }
}
