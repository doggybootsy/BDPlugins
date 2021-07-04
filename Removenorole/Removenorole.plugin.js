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
        if (document.querySelector('.userPopout-xaxa6l .root-3-B5F3:empty')) {
            document.querySelector('.userPopout-xaxa6l .root-3-B5F3:empty').previousSibling.style.display = "none";
            document.querySelector('.userPopout-xaxa6l .root-3-B5F3:empty').style.display = "none";
        };
        if (document.querySelector('.userPopout-xaxa6l .root-3-B5F3[style]:not(:empty)')) {
            document.querySelector('.userPopout-xaxa6l .root-3-B5F3[style]:not(:empty)').previousSibling.removeAttribute('style')
            document.querySelector('.userPopout-xaxa6l .root-3-B5F3[style]:not(:empty)').removeAttribute('style')
        };
    };

    start() {};
    stop() {};
}
