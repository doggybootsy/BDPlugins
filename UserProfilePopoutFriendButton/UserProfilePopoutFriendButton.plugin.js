/**
 * @name UserProfilePopoutFriendButton 
 * @version 1.0.2
 * @author doggybootsy
 * @description Adds the friend request button from user modals to user propouts
 * @updateUrl https://raw.githubusercontent.com/doggybootsy/BDPlugins/main/UserProfilePopoutFriendButton/UserProfilePopoutFriendButton.plugin.js
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
 }
 
 async function updator() {
   setTimeout(() => updator(), 1000 * 60 * 60)
 
   const result = await fetch("https://raw.githubusercontent.com/doggybootsy/BDPlugins/main/UserProfilePopoutFriendButton/UserProfilePopoutFriendButton.plugin.js")
   const content = await result.text()
   const meta = BdApi.Plugins.get("UserProfilePopoutFriendButton")
   
   const block = content.split("/**", 2)[1].split("*/", 1)[0]
   const out = {}
   let field = "", accum = ""
   for (const line of block.split(/[^\S\r\n]*?(?:\r\n|\n)[^\S\r\n]*?\*[^\S\r\n]?/)) {
     if (line.length === 0) continue
     if (line.charAt(0) === "@" && line.charAt(1) !== " ") {
       out[field] = accum
       const l = line.indexOf(" ")
       field = line.substr(1, l - 1)
       accum = line.substr(l + 1)
     } 
     else accum += " " + line.replace("\\n", "\n").replace(/^\\@/, "@")
   }
   out[field] = accum.trim()
   delete out[""]
   out.format = "jsdoc"
   
   const onlineVersion = Number(out.version.replaceAll(".", ""))
   const localVersion = Number(meta.version.replaceAll(".", ""))
 
   if (!(onlineVersion > localVersion)) return
 
   const { openModal } = BdApi.findModuleByProps("openModal", "openModalLazy")
   const Alert = BdApi.findModuleByDisplayName("Alert")
 
   openModal(props => React.createElement(Alert, {
     ...props,
     title: "UserProfilePopoutFriendButton",
     body: "Plugin is out of date!",
     cancelText: "Skip",
     confirmText: "Update",
     onConfirm: () => {
       require("fs").writeFileSync(require("path").join(__dirname, "UserProfilePopoutFriendButton.plugin.js"), content)
       location.reload()
     }
   }))
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
     updator()
   }
   stop() {
     BdApi.clearCSS(this.constructor.name)
     BdApi.Patcher.unpatchAll(this.constructor.name)
   }
 }
