/**
 * @name RemoveNoRole
 * @author Doggybootsy
 * @description Remove the "NO ROLES" from user popouts
 * @version 2.0
 * @source https://github.com/doggybootsy/BDPlugins/
 */

const { Webpack, Patcher } = BdApi

const UserBody = Webpack.getModule(m => {
  if (!m.default) return
  const str = m.default.toString()
  return str.includes(".customStatusActivity") && str.includes(".getUserProfile") && str.includes("usernameIcon:")
})

const PermissionStore = Webpack.getModule(m => m.canManageUser && m.can)
const { useStateFromStores } = Webpack.getModule(m => m.useStateFromStores)

const { MANAGE_ROLES } = Webpack.getModule(m => m.Permissions?.MANAGE_ROLES).Permissions

module.exports = class { 
  start() {
    Patcher.after("RemoveNoRole", UserBody, "default", (that, [ props ], res) => {
      if (!props.guild || !res) return

      const canAddRoles = useStateFromStores([ PermissionStore ], () => PermissionStore.canManageUser(MANAGE_ROLES, props.user, props.guild))

      const Body = res.props.children.find(child => child.type.render)
      const RolesSection = Body.props.children.find(child => child?.type?.displayName === "RolesSection")

      if (RolesSection.props.guildMember.roles.length || canAddRoles) return

      Body.props.children.splice(Body.props.children.indexOf(RolesSection), 1)
    })
  }
  stop() {
    Patcher.unpatchAll("RemoveNoRole")
  }
}
