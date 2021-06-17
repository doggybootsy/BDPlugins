/**
 * @name RemoveNoRole
 * @author Doggybootsy
 * @description Remove the "NO ROLES" from user popouts
 * @version 1.3
 * @source https://github.com/doggybootsy/BDPlugins/
 * @website https://doggybootsy.github.io/
 */

module.exports = class Remove_no_role{
    getName() {
      return "Remove No Role";
    }
    start() {
        document.querySelector('#app-mount>div+.layerContainer-yqaFcK').setAttribute('removenorole','')
        if(window.addEventListener) {
           // Normal browsers
           document.querySelector('#app-mount>div+.layerContainer-yqaFcK[removenorole]').addEventListener('DOMSubtreeModified', Remove_no_role, false);
        }
        function Remove_no_role() {
            if (document.body.contains(document.querySelector('[removenorole] .root-3-B5F3:empty'))) {
                document.querySelector('[removenorole] .userPopout-xaxa6l .root-3-B5F3:empty').previousSibling.setAttribute('style','display: none !important')
                document.querySelector('[removenorole] .userPopout-xaxa6l .root-3-B5F3:empty').setAttribute('style','display: none !important')
            }
        }
    }
    stop() {
        document.querySelector('#app-mount>div+.layerContainer-yqaFcK').removeAttribute('removenorole')
    }
}
