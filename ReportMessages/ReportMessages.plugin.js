/**
 * @name ReportMessages
 * @description Report messages within discord. 
 * @version 1.0.0
 * @author doggybootsy
 */
const MiniPopover = BdApi.findModule(m => m.default.displayName === "MiniPopover")
const RadioGroup = BdApi.findModuleByDisplayName("RadioGroup")
const { FormItem, FormText } = BdApi.findModuleByProps("FormItem", "FormText")
const { openModal } = BdApi.findModuleByProps("openModal", "openModalLazy")
const Anchor = BdApi.findModuleByDisplayName("Anchor")
const Button = BdApi.findModuleByProps("ButtonSizes")
const { report:reportAction } = BdApi.findModuleByProps("report", "submitReport")
const { getChannel } = BdApi.findModuleByProps("getDMFromUserId")
const { getCurrentUser } = BdApi.findModuleByProps("getCurrentUser")
const { isFriend } = BdApi.findModuleByProps("isFriend")
const { REPORT_MESSAGE, CANCEL, REPORT } = BdApi.findModule(e => e?.Messages && e?.Messages.REPORT_MESSAGE).Messages
const confirmModal = BdApi.findModuleByDisplayName("ConfirmModal")
const { React, React: { memo, useState } } = BdApi
const ReportModal = memo(({ Mprops, message }) => {
  const [reason, setReason] = useState(0)
  return (
    React.createElement(confirmModal, Object.assign({
      header: REPORT_MESSAGE.format({ name: message.author.username }),
      confirmButtonColor: Button.ButtonColors.RED,
      confirmText: REPORT,
      cancelText: CANCEL,
      className: "reportModalLargeModal",
      onConfirm: async () => {
        const reportData = {
          guild_id: getChannel(message.channel_id).guild_id,
          channel_id: message.channel_id,
          message_id: message.id,
          reason: reason
        }
        const { ok } = await reportAction(reportData)
        BdApi.showToast(ok ? "Message reported" : "Failed to report message", {
          type: ok ? "success" : "error"
        })
      },
      onCancel: () => {},
      children: [
        React.createElement(FormItem, {
          title: "Reason",
          children: [
            React.createElement(RadioGroup, {
              value: reason,
              options: [
                { 
                  name: "Illegal Content", 
                  desc: "Child Pornography, solicitation of minors, terrorism, threats of school shootings or criminal activity.", 
                  value: 0 
                },
                { 
                  name: "Harassment", 
                  desc: "Threats, stalking, bullying, sharing of personal information, impersonation or raiding.", 
                  value: 1 
                },
                { 
                  name: "Spam or Phishing links", 
                  desc: "Fake links, invites to servers via bot, malicious links or attachments.", 
                  value: 2 
                },
                { 
                  name: "Self Harm", 
                  desc: "Person is at risk at claiming intent of self-harm.", 
                  value: 3 
                },
                { 
                  name: "NSFW Content", 
                  desc: "Pornography or other adult content in a non-NSFW channel or unwanted DM.", 
                  value: 4 
                }
              ],
              onChange: (({value}) => setReason(value))
            }),
            React.createElement(FormText, {
              children: [
                "Reports are sent to the Discord Trust & Safety team", 
                React.createElement("strong", null, "- not the server owner. "), 
                "Creating false reports and/or spamming the report button may result in a suspension of reporting abilities. Learn more from the ", 
                React.createElement(Anchor, {
                  href: "https://discord.com/guidelines"
                }, "Discord Community Guidelines"),
                ".Thanks for keeping things safe and sound."
              ]
            })
          ]
        })
      ]
    }, Mprops))
  )
})
const Settings = memo(({  }) => {
  const [setting, seSetting] = useState(BdApi.getData("ReportMessages", "setting") ?? 2)
  return (
    React.createElement(FormItem, {
      title: "Safe Reporting",
      children: [
        React.createElement(RadioGroup, {
          value: setting,
          options: [
            {
              name: "No one can escape",
              desc: "You can report anyone.",
              value: 0,
              color: "hsl(359, calc(var(--saturation-factor, 1) * 82.6%), 59.4%)"
            },
            {
              name: "Keep me safe",
              desc: "You can report anyone, but yourself.",
              value: 1,
              color: "hsl(37, calc(var(--saturation-factor, 1) * 81.2%), 43.9%)"
            },
            {
              name: "My friends are nice",
              desc: "You can report anyone but yourself and your friends.",
              value: 2,
              color: "hsl(139, calc(var(--saturation-factor, 1) * 47.3%), 43.9%)"
            }
          ],
          onChange: (({value}) => {
            seSetting(value)
            BdApi.saveData("ReportMessages", "setting", value)
          })
        }),
        React.createElement(FormText, {
          children: "People that you can report."
        })
      ]
    })
  )
})
module.exports = class ReportMessages {
  getSettingsPanel() {
    return React.createElement(Settings)
  }
  start() {
    BdApi.injectCSS("ReportMessage", `
.reportModalLargeModal.small-3iVZYw {
  width: 670px;
  min-width: 670px;
  max-width: 670px;
  max-height: 720px;
  min-height: 200px; }
.reportModalLargeModal.small-3iVZYw [role="radiogroup"] {
  margin-bottom: 30px;
  display: grid;
  grid-template-columns: calc(50% - 5px) calc(50% - 5px);
  grid-gap: 10px; }
.reportModalLargeModal.small-3iVZYw [role="radiogroup"] > div {
  margin-bottom: 0; }
.reportModalLargeModal.small-3iVZYw [role="radiogroup"] > div:last-child {
  width: calc(200% + 10px); }`)
    const currentUserId = getCurrentUser().id
    function isDisabled(message) {
      const setting = BdApi.getData("ReportMessages", "setting") ?? 2
      if ((currentUserId === message.author.id) && (setting >= 1)) return true
      if (isFriend(message.author.id) && (setting === 2)) return true
      return false
    }
    BdApi.Patcher.after("ReportMessage", MiniPopover, "default", (_, res) => {
      if (!Boolean(res[0].children[res[0].children.length - 1]?.props?.message)) return 
      const ele = res[0].children[res[0].children.length - 1]
      const origType = ele.type
      ele.props.canReport = true
      ele.type = () => {
        const popUp = origType(ele.props)
        const lastPop = popUp.props.children[popUp.props.children.length - 1]
        if (lastPop === null) return popUp
        const oldPopout = lastPop.props.renderPopout
        lastPop.props.renderPopout = (props) => {
          const popout = oldPopout(props)
          const origPopType = popout.type
          popout.type = (prp) => {
            const MsgAct = origPopType(prp)
            const origMsgActType = MsgAct.type
            MsgAct.type = (pro) => {
              const MsgActions = origMsgActType(pro)
              const { children } = MsgActions.props.children.props.children.props
              const { message } = ele.props
              children.filter(child => child.key === "report")[0].props.action = () => openModal(props => React.createElement(ReportModal, { Mprops: props, message }))
              children.filter(child => child.key === "report")[0].props.disabled = isDisabled(message)
              return MsgActions
            }
            return MsgAct
          }
          return popout
        }
        return popUp
      }
    })
  }
  stop() { 
    BdApi.Patcher.unpatchAll("ReportMessage")
    BdApi.clearCSS("ReportMessage")
  }
}
