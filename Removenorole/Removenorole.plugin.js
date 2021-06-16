/**
 * @name Removenorole
 * @author Doggybootsy
 * @description Remove the "NO ROLES" from user popouts
 * @version 1.1
 */


module.exports = class Remove_no_role{
    start() {
        document.querySelector('#app-mount>div+.layerContainer-yqaFcK').setAttribute('Removenorole','')
        if(window.addEventListener) {
           // Normal browsers
           document.querySelector('#app-mount>div+.layerContainer-yqaFcK[Removenorole]').addEventListener('DOMSubtreeModified', Remove_no_role, false);
        }
        function Remove_no_role() {
            const remove_no_role = document.querySelector('[Removenorole] .userPopout-xaxa6l .root-3-B5F3:empty')
            if (!remove_no_role) return;
            remove_no_role.previousSibling.style.display = "none"
            remove_no_role.style.display = "none"
        }
    }
    stop() {
        document.querySelector('#app-mount>div+.layerContainer-yqaFcK').removeAttribute('Removenorole')
    }
}
