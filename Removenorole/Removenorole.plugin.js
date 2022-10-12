/**
 * @name RemoveNoRole
 * @author Doggybootsy
 * @description Remove the "NO ROLES" from user popouts
 * @version 2.1
 * @source https://github.com/doggybootsy/BDPlugins/
 */

const { Patcher, Webpack } = new BdApi("RemoveNoRole")

const UserBody = Webpack.getModule(m => {
  if (!m.Z) return
  const str = m.Z.toString()
  return str.includes(".customStatusActivity") && str.includes(".getUserProfile") && str.includes("usernameIcon:")
})

const PermissionStore = Webpack.getModule(m => m.Z?.getName?.() === "PermissionStore").Z
const useStateFromStores = Webpack.getModule(m => m.toString().includes("useStateFromStores"))

let MANAGE_ROLES
Webpack.getModule(m => Object.values(m).find((data) => data?.MANAGE_ROLES && (MANAGE_ROLES = data.MANAGE_ROLES)))

module.exports = class { 
  start() {
    Patcher.after(UserBody, "Z", (that, [ props ], res) => {
      if (!props.guild || !res) return

      const canAddRoles = useStateFromStores([ PermissionStore ], () => PermissionStore.canManageUser(MANAGE_ROLES, props.user, props.guild))

      const Body = res.props.children.find(child => child.props.children);
      const Content = Body.props.children.find(child => child.type.render);

      const RolesSection = Content.props.children.find(child => child?.props?.guildMember && child?.props?.user)

      if (RolesSection.props.guildMember.roles.length || canAddRoles) return

      Content.props.children.splice(Content.props.children.indexOf(RolesSection), 1)
    })
  }
  stop() {
    Patcher.unpatchAll()
  }
}
