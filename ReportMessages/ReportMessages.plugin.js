/**
 * @name ReportMessages
 * @description Report messages within discord. 
 * @version 1.0.0
 * @author doggybootsy
 */

const MiniPopover = BdApi.findModule(m => m.default.displayName === "MiniPopover")
module.exports = class ReportMessages {
  start() {
    BdApi.Patcher.after(this.constructor.name, MiniPopover, "default", (_, res) => {
      if (!Boolean(res[0].children[res[0].children.length - 1]?.props?.message)) return 
      const ele = res[0].children[res[0].children.length - 1]
      if (!ele) return
      ele.props.canReport = true
    })
  }
  stop() {
    BdApi.Patcher.unpatchAll(this.constructor.name)
  }
}
