/**
 * @name RemoveNoRole
 * @author Doggybootsy
 * @description Remove the "NO ROLES" from user popouts
 * @version 2.2
 * @source https://github.com/doggybootsy/BDPlugins/
 */

/** @type {import("betterdiscord").PluginCallback} */
module.exports = (meta) => {
  const [ UserRolesList, Flux, PermissionStore, PermissionBits ] = BdApi.Webpack.getBulk({
    filter: BdApi.Webpack.Filters.byStrings(".default.Messages.ROLES_LIST", ".rolePillBorder]", "disableBorderColor:!0", "return null"),
    defaultExport: false
  }, {
    filter: BdApi.Webpack.Filters.byKeys("useStateFromStores", "Store")
  }, {
    filter: BdApi.Webpack.Filters.byStoreName("PermissionStore")
  }, {
    filter: (m) => typeof m.MANAGE_ROLES === "bigint",
    searchExports: true
  });

  return {
    start() {
      BdApi.Patcher.after(meta.name, UserRolesList, "default", (that, [ props ], res) => {
        if (!props.guild || !props.user) return;

        const canAddRoles = Flux.useStateFromStores([ PermissionStore ], () => PermissionStore.canManageUser(PermissionBits.MANAGE_ROLES, props.user, props.guild));
        
        if (props.guildMember.roles.length || canAddRoles) return;

        return false;
      });
    },
    stop() {
      BdApi.Patcher.unpatchAll(meta.name);
    }
  };
};
