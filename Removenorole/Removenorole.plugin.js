/**
 * @name RemoveNoRole
 * @author Doggybootsy
 * @description Remove the "NO ROLES" from user popouts
 * @version 1.5
 * @source https://github.com/doggybootsy/BDPlugins/
 * @website https://doggybootsy.github.io/
 */

 module.exports = class Remove_no_role{
    getName() {
        return "Remove No Role";
    }

    observer (mutations) {
        if (document.querySelector('.userPopout-2j1gM4 .root-jbEB5E:empty')) {
            document.querySelector('.userPopout-2j1gM4 .root-jbEB5E:empty').previousSibling.style.display = "none";
            document.querySelector('.userPopout-2j1gM4 .root-jbEB5E:empty').style.display = "none";
        };
        if (document.querySelector('.userPopout-2j1gM4 .root-jbEB5E[style]:not(:empty)')) {
            document.querySelector('.userPopout-2j1gM4 .root-jbEB5E[style]:not(:empty)').previousSibling.removeAttribute('style')
            document.querySelector('.userPopout-2j1gM4 .root-jbEB5E[style]:not(:empty)').removeAttribute('style')
        };
    };

    start() {};
    stop() {};
}
