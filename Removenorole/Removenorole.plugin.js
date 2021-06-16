/**
 * @name Removenorole
 * @author Doggybootsy
 * @description Remove the "NO ROLES" from user popouts
 * @version 1.1
 */

module.exports = class Remove_no_role{
    start() {
        const remove_no_role_layer = document.querySelector('#app-mount>div+.layerContainer-yqaFcK');
        if (!remove_no_role_layer) return;
        remove_no_role_layer.setAttribute('Removenorole','')
        if(window.addEventListener) {
           // Normal browsers
           document.querySelector('#app-mount>div+.layerContainer-yqaFcK[Removenorole]').addEventListener('DOMSubtreeModified', contentChanged, false);
        }
        function contentChanged() {
            const remove_no_role = document.querySelector('[Removenorole] .root-3-B5F3:empty')
            if (!remove_no_role) return;
            remove_no_role.previousSibling.style.display = "none"
            remove_no_role.style.display = "none"
        }
    }
    stop() {
        document.querySelector('#app-mount>div+.layerContainer-yqaFcK').removeAttribute('Removenorole')
    }
}
