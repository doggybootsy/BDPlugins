/**
 * @name RemoveNoRole
 * @author Doggybootsy
 * @description Remove the "NO ROLES" from user popouts
 * @version 1.6
 * @source https://github.com/doggybootsy/BDPlugins/
 * @website https://doggybootsy.github.io/
 */

const classes = Object.assign({}, BdApi.Webpack.getModule(m => m.userPopoutInner && m.userPopoutInner), BdApi.Webpack.getModule(m => m.root && m.addButton))

const addButton = classes.addButton.split(" ")[0]
const root = classes.root.split(" ")[0]
const userPopoutInner = classes.userPopoutInner.split(" ")[0]

module.exports = class Remove_no_role {  
  observer() {
    const node = document.querySelector(`.${userPopoutInner} .${root}`)
    if (!node) return
    const children = Array.from(node.children).filter(m => !m.classList.contains(addButton))
    if (children.length) return node.parentElement.style.display = ""
    node.parentElement.style.display = "none"
  }

  start() {}
  stop() {}
}
