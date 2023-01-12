/**
 * @name ChangeSwitchColors
 * @version 1.0.3
 * @author doggybootsy
 * @description Change discords checked and unchecked switch colors
 */

const BdApi = new window.BdApi("CSC");
const { React, Webpack, Data, DOM, Patcher, ReactUtils } = BdApi;
const { Filters } = Webpack;

function getModuleAndKey(filter) {
  let module;
  const value = Webpack.getModule((e, m) => filter(e) ? (module = m) : false, { searchExports: true });
  if (!module) return;
  return [module.exports, Object.keys(module.exports).find(k => module.exports[k] === value)];
};
// SwitchItem Classes
const classes = Webpack.getModule(m => m.container && m.slider);
// SwitchItem
const [ SwitchItemModule, SwitchItemKey ] = getModuleAndKey(m => m.displayName?.includes("withDefaultColorContext") && String(m({}).props.children().type).includes("checked"));
// Color Modules
const ColorDetailsContext = Webpack.getModule(m => m._currentValue && "colorDetails" in m._currentValue);
const AppColorStore = Webpack.getModule(m => m.getName?.() === "AppColorStore");
// React Setting Components
const ColorPicker = Webpack.getModule(m => Filters.byStrings(".Messages.PICK_A_COLOR_FROM_THE_PAGE")(m.type), { searchExports: true });
const Dropdown = Webpack.getModule(Filters.byStrings("[\"value\",\"onChange\"]"), { searchExports: true });
const Switch = Webpack.getModule(Filters.byStrings("htmlFor:", ".Messages.LEARN_MORE"));
// RS
const ReactSpring = Webpack.getModule(m => m.useSpring);
// To replace the colors in the context
const allColors = Object.assign({}, AppColorStore.getAllColors());
// Color Dropdowns
const colors = Object.entries(AppColorStore.getAllColors()).map(([ k, v ]) => ({ value: k, label: `${k}: ${v.hex}` }));
colors.push({ value: "#3e82e5", label: "BetterDiscord: #3e82e5" });
// util
const getKey = checked => checked ? "status-green-600" : "primary-dark-400";
// Settings
function getSetting(checked) {
  const key = getKey(checked);
  const saved = Data.load(key);
  if (saved) return saved;
  return key;
}
function setSetting(checked, value) {
  const key = getKey(checked);
  Data.save(key, value);
}
// Color Util
function intToHex(int) {
  const hex = int.toString(16);
  const filler = Array(6 - hex.length).fill("0").join("");
  return `#${filler}${hex}`;
};
function hexToHsla(hex) {
  hex = hex.replace(/^#/, "");
  const r = parseInt(hex.substr(0,2), 16) / 255;
  const g = parseInt(hex.substr(2,2), 16) / 255;
  const b = parseInt(hex.substr(4,2), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h;
  let s;
  let l = (max + min) / 2;

  if(max == min) h = s = 0;
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch(max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return { h: h * 360, s, l, a: 1 };
}
function getColor(color) {
  const app = AppColorStore.getColor(color);
  if (app) return app;
  return { hex: color, hsl: hexToHsla(color) }
}
// Hooks
function useForceUpdate() {
  const [ state, setState ] = React.useState(Symbol());
  return [ state, () => setState(Symbol()) ]
}
const listeners = new Set();
function useListener() {
  const [, forceUpdate] = useForceUpdate();
  
  React.useEffect(() => {
    listeners.add(forceUpdate);
    return () => listeners.delete(forceUpdate);
  }, []);
};
// Apply color
function updateCSS(checked, unchecked) {
  DOM.removeStyle();

  DOM.addStyle(`.CSC-settings { display: grid; grid-template-columns: 50% 50%; } 
  .CSC-settings > div:last-child > div:not(:last-child) { margin-bottom: 10px }
  .CSC-settings > div:first-child { border: none; box-shadow: none; padding: 0; }
  .bd-switch input:checked+.bd-switch-body { --switch-color: ${checked.hex}; }
  .bd-switch-body { --switch-color: ${unchecked.hex}; }
  .csc-preview { height: 62px; border-radius: 3px; display: flex; justify-content: center; align-items: center; cursor: pointer }`)
}
function setColors() {
  const checked = getColor(getSetting(true));
  const unchecked = getColor(getSetting(false));

  allColors["status-green-600"] = checked;
  allColors["primary-dark-400"] = unchecked;

  updateCSS(checked, unchecked);
  
  Array.from(listeners, listener => listener());
}
// Demos
function DemoSwitch() {
  const [ checked, setChecked ] = React.useState(true);
  const [ disabled, setDisabled ] = React.useState(false);

  return React.createElement("div", {
    onContextMenu: () => setDisabled(!disabled),
    children: React.createElement(Switch, {
      children: "Demo Switch",
      disabled,
      value: checked,
      onChange: () => setChecked(!checked)
    })
  })
}
function DemoLarge({ hook }) {
  const [ disabled, setDisabled ] = React.useState(false);
  const [ checked, setChecked ] = React.useState(false);
  const [ heldDown, setHeldDown ] = React.useState(false);
  
  const color = React.useMemo(() => ({ checked: getColor(getSetting(true)), unchecked: getColor(getSetting(false)) }), [ hook ]);

  const style = ReactSpring.useSpring({
    config: {
      mass: 1,
      tension: 250
    },
    opacity: disabled ? .3 : 1,
    state: heldDown ? checked ? .7 : .3 : checked ? 1 : 0
  });

  return React.createElement(ReactSpring.animated.div, {
    className: "csc-preview", 
    onMouseDown() { !disabled && setHeldDown(!0); },
    onMouseUp() { setHeldDown(false); },
    onMouseLeave() { setHeldDown(false); },
    onContextMenu() { setDisabled(!disabled); },
    onClick() { !disabled && setChecked(!checked); },
    style: {
      opacity: style.opacity,
      backgroundColor: style.state.to({
        output: [color.unchecked.hex, color.checked.hex]
      })
    },
    children: React.createElement("div", {
      children: [
        React.createElement("div", {
          children: `Disabled: ${disabled}`
        }),
        React.createElement("div", {
          children: `Checked: ${checked}`
        }),React.createElement("div", {
          children: `Held Down: ${heldDown}`
        })
      ]
    })
  })
}
// Settings
function SettingsPanel() {
  const [ hook, forceUpdate ] = useForceUpdate();
  const [ checked, setChecked ] = React.useState(true);
  const savedColor = React.useMemo(() => getSetting(checked), [ checked, hook ]);
  const color = React.useMemo(() => getColor(savedColor), [ checked, hook ]);

  return React.createElement("div", {
    className: "CSC-settings",
    children: [
      React.createElement(ColorPicker, {
        onChange: (int) => {
          const hex = intToHex(int);
          setSetting(checked, hex);
          forceUpdate();
          setColors();
        },
        value: parseInt(color.hex.replace("#", ""), 16)
      }),
      React.createElement("div", {
        children: [
          React.createElement(DemoLarge, { hook }),
          React.createElement(DemoSwitch),
          React.createElement(Switch, {
            children: `Editing ${checked ? "Checked" : "Unchecked"} Switches`,
            value: checked, 
            onChange: () => setChecked(!checked)
          }),
          React.createElement(Dropdown, {
            onChange: (v) => {
              setSetting(checked, v === null ? getKey(checked) : v);
              forceUpdate();
              setColors();
            },
            options: colors,
            value: savedColor,
            closeOnSelect: false,
            clearable: true,
            hideIcon: true,
            placeholder: `Custom: ${color.hex}`
          })
        ]
      })
    ]
  })
}
// Rerender switches
function forceUpdateInstances(instance) {
  const render = instance.render;
  instance.render = () => null;
  instance.forceUpdate();
  setTimeout(() => {
    instance.render = render;
    instance.forceUpdate();
  });
}
function forceUpdate() {
  Array.from(new Set(Array.from(document.querySelectorAll(`.${classes.container}`), ReactUtils.getOwnerInstance)), (instance) => {
    // Addon policy for plugins #5
    if (String(Object.getOwnPropertyDescriptor(Object.getPrototypeOf(instance), "render")?.set).includes("BetterDiscord")) return;
    forceUpdateInstances(instance);
  });
}

//
const insideFunctionalComponent = () => !React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentDispatcher.current.useRef.toString().includes("Error");

module.exports = class CSC {
  start() {
    setColors();
    // Hook a listener to allow us to forceUpdate and provide a custom context value
    Patcher.after(SwitchItemModule, SwitchItemKey, (that, [ ], res) => {
      if (!insideFunctionalComponent()) return;

      useListener();
      return React.createElement(ColorDetailsContext.Provider, {
        value: { colorDetails: allColors },
        children: res.props.children()
      })
    })
    // ForceUpdate
    forceUpdate();
  };
  stop() {
    DOM.removeStyle();
    Patcher.unpatchAll();
    forceUpdate();
  };
  getSettingsPanel() {
    return React.createElement(SettingsPanel);
  };
}