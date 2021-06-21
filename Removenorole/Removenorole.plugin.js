/**
 * @name RemoveNoRole
 * @author Doggybootsy
 * @description Remove the "NO ROLES" from user popouts
 * @version 1.4
 * @source https://github.com/doggybootsy/BDPlugins/
 * @website https://doggybootsy.github.io/
 */

module.exports = class Remove_no_role{
    getName() {
        return "Remove No Role";
    }

    observer (mutations) {
        const Remove_no_role_selector = document.querySelector('.userPopout-xaxa6l .root-3-B5F3:empty');
        if (document.body.contains(Remove_no_role_selector)) {
            Remove_no_role_selector.previousSibling.remove();
            Remove_no_role_selector.remove();
        };
    };

    start() {};
    stop() {};
}
