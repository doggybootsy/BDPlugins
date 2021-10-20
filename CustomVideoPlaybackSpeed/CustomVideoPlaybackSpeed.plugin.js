/**
 * @name CustomVideoPlaybackSpeed
 * @description Change video playback speed
 * @version 1.0.0
 * @author doggybootsy
 * @source https://github.com/doggybootsy/BDPlugins/
 * @website https://doggybootsy.github.io/
 */


const { React } = BdApi
const MenuItem = BdApi.findModuleByProps("MenuItem")
const MessageContextMenu = BdApi.findModule((m) => m?.default?.displayName === "MessageContextMenu")
const MenuCustomItem = BdApi.findModuleByDisplayName("MenuCustomItem")
const { wrapper:wrapperClass } = BdApi.findModuleByProps("wrapper", "video")
const Markdown = BdApi.findModuleByDisplayName("Markdown")

const Clickable = BdApi.findModuleByDisplayName("Clickable")
const TextInput = BdApi.findModuleByDisplayName("TextInput")
const Subtract = BdApi.findModuleByDisplayName("Subtract")
const Plus = BdApi.findModuleByDisplayName("Plus")

class NumberInputStepper extends React.PureComponent {
  constructor(props) {
    super(props)
    this.state = { value: this.props.value }
  }
  render() {
    function valueCheck(value, funct) {
      if (value < 10.1 && value > -0.1) funct()
    }
    return React.createElement("div", {
      className: "actions-6rRvry",
      children: [
        React.createElement(Clickable, {
          className: "iconWrapper-3LVgIo",
          role: "Button",
          tabIndex: -1,
          tag: "div",
          onClick: () => {
            const value = (((this.props.value * 10) - 1) / 10)
            valueCheck(value, () => {
              this.setState({ value })
              this.props.onChange(value)
            })
          },
          children: React.createElement(Subtract, {className: "icon-TYbVk4"})
        }),
        React.createElement(TextInput, {
          autoFocus: false,
          disabled: false,
          inputClassName: "value-IR9osW",
          maxLength: 999,
          name: "",
          placeholder: "",
          size: "default",
          type: "text",
          value: this.state.value,
          onChange: (value) => {
            if(!/[^0-9.]/g.test(value)) {
              valueCheck(value, () => {
                this.setState({ value })
                this.props.onChange(value)
              })
            }
          }
        }),
        React.createElement(Clickable, {
          className: "iconWrapper-3LVgIo",
          role: "Button",
          tabIndex: -1,
          tag: "div",
          onClick: () => {
            const value = (((this.props.value * 10) + 1) / 10)
            valueCheck(value, () => {
              this.setState({ value })
              this.props.onChange(value)
            })
          },
          children: React.createElement(Plus, {className: "icon-TYbVk4"})
        })
      ]
    })
  }
}

function parents(element, selector = "") {
  const parents = [];
  if (selector) while (element.parentElement && element.parentElement.closest(selector)) parents.push(element = element.parentElement.closest(selector));
  else while (element.parentElement) parents.push(element = element.parentElement);
  return parents;
}

// Why cant life be simple
// Wont work with out this part
class videoStepper extends React.PureComponent {
  constructor(props) {
    super(props)
    this.state = { speed: this.props.videoEle.playbackRate }
  }
  render() {
    return React.createElement(React.Fragment, {
      children: [
        React.createElement(Markdown, null, "Change video speed"),
        React.createElement(NumberInputStepper, {
          value: this.state.speed,
          minValue: 0,
          maxValue: 10,
          onChange: (val) => {
            this.props.videoEle.playbackRate = val
            this.setState({ speed: val })
          }
        })
      ]
    })
  }
}

module.exports = class CustomVideoPlaybackSpeed {
  start() {
    BdApi.Patcher.after("PlayBackSpeed-Patch", MessageContextMenu, "default", (_, args, value) => {
      const [props] = args
      const ele = parents(props.target).filter(ee => ee.classList[1] == wrapperClass)
      if (ele.length) {
        value.props.children.push(
          React.createElement(MenuItem.MenuSeparator), 
          React.createElement(MenuItem.MenuItem, {
            id: "Playback-Spead",
            label: "Playback Spead",
            children: [
              React.createElement(MenuItem.MenuGroup, {
                contents: [
                  React.createElement(MenuCustomItem, {
                    id: "PlayBackSpeedStepper",
                    children: () => React.createElement(videoStepper , {videoEle: ele[0].children[1]})
                  })
                ],
                children: []
              })  
            ]
          })
        )
      }
      return value;
    })
  }
  stop() {BdApi.Patcher.unpatchAll("PlayBackSpeed-Patch")}
}
