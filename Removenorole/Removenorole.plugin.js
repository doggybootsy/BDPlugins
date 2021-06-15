/**
 * @name Removenorole
 * @author Doggybootsy
 * @description Remove the "NO ROLES" from user popouts
 * @version 1
 */

module.exports = class Remove_no_role{
    start() {
        BdApi.injectCSS("Removenorole", '.Removenorole{display: none;}')
        if(window.addEventListener) {
           // Normal browsers
           document.querySelector('#app-mount>div+.layerContainer-yqaFcK').addEventListener('DOMSubtreeModified', contentChanged, false);
        }
        function contentChanged() {
            const remove_no_role = document.querySelector('.root-3-B5F3:empty')
            if (!remove_no_role) return;
            remove_no_role.previousSibling.classList.add('Removenorole')
            remove_no_role.classList.add('Removenorole')
        }
    }
    stop() {
        BdApi.injectCSS("Removenorole", '')
    }
}
