/**
 * @name Removenorole
 * @author Doggybootsy
 * @description Remove the "NO ROLES" from user popouts
 * @version 1.2
 * @source https://github.com/doggybootsy/BDPlugins/blob/main/Removenorole/Removenorole.plugin.js
 * @website https://doggybootsy.github.io/
 */

module.exports = class Remove_no_role{
    start() {
        document.querySelector('#app-mount>div+.layerContainer-yqaFcK').setAttribute('Removenorole','')
        if(window.addEventListener) {
           // Normal browsers
           document.querySelector('#app-mount>div+.layerContainer-yqaFcK[Removenorole]').addEventListener('DOMSubtreeModified', Remove_no_role, false);
        }
        function Remove_no_role() {
            if (document.querySelector('#app-mount>div+.layerContainer-yqaFcK').innerHTML.includes('userPopout-')) {

                const remove_no_role = document.querySelector('[Removenorole] .userPopout-xaxa6l .root-3-B5F3:empty')
                if (!remove_no_role) return;
                document.querySelector('[Removenorole] .userPopout-xaxa6l .root-3-B5F3:empty').previousSibling.style.display = "none"
                document.querySelector('[Removenorole] .userPopout-xaxa6l .root-3-B5F3:empty').style.display = "none"
            }
        }
    }
    stop() {
        document.querySelector('#app-mount>div+.layerContainer-yqaFcK').removeAttribute('Removenorole')
    }
}
