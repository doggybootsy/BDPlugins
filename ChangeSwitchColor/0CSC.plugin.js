/**
 * @name ChangeSwitchColor 
 * @version 1.0.0
 * @author doggybootsy
 * @description Change discords switch color to a preset or a custom color
 */

const BdApi = new window.BdApi("CSC");
const { React, Webpack, Data, DOM, Patcher } = BdApi;
const { Filters } = Webpack;

function getModuleAndKey(filter) {
  let module;
  const value = BdApi.Webpack.getModule((e, m) => filter(e) ? (module = m) : false, { searchExports: true });
  if (!module) return;
  return [module.exports, Object.keys(module.exports).find(k => module.exports[k] === value)];
};

// SwitchItem
const [ SwitchItemModule, SwitchItemKey ] = getModuleAndKey(m => m.displayName?.includes("withDefaultColorContext") && String(m({}).props.children().type).includes("checked"));
// Color Modules
const ColorDetailsContext = Webpack.getModule(m => m._currentValue && "colorDetails" in m._currentValue);
const AppColorStore = Webpack.getModule(m => m.getName?.() === "AppColorStore");
// React Setting Components
const ColorPicker = Webpack.getModule(m => Filters.byStrings(".Messages.PICK_A_COLOR_FROM_THE_PAGE")(m.type), { searchExports: true });
const Dropdown = Webpack.getModule(Filters.byStrings("[\"value\",\"onChange\"]"), { searchExports: true });
const Switch = Webpack.getModule(Filters.byStrings("htmlFor:", ".Messages.LEARN_MORE"));
// To replace the colors in the context
const allColors = Object.assign({}, AppColorStore.getAllColors());
// Color Dropdowns
const colors = Object.entries(AppColorStore.getAllColors()).map(([ k, v ]) => ({ value: k, label: `${k}: ${v.hex}` }));
colors.push({ value: "#3e82e5", label: "BetterDiscord: #3e82e5" });
// Settings
function getSetting(checked) {
  const key = checked ? "status-green-600" : "primary-dark-400";
  const saved = Data.load(key);
  if (saved) return saved;
  return key;
}
function setSetting(checked, value) {
  const key = checked ? "status-green-600" : "primary-dark-400";
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
  .CSC-settings > div:last-child > div { margin-bottom: 10px }
  .CSC-settings > div:first-child { border: none; box-shadow: none; padding: 0; }
  .bd-switch input:checked+.bd-switch-body { --switch-color: ${checked.hex}; }
  .bd-switch-body { --switch-color: ${unchecked.hex}; }`)
}
function setColors() {
  const checked = getColor(getSetting(true));
  const unchecked = getColor(getSetting(false));

  allColors["status-green-600"] = checked;
  allColors["primary-dark-400"] = unchecked;

  updateCSS(checked, unchecked);
  
  [...listeners].map(m => m());
}
setColors();
// Settings
function DemoSwitch() {
  const [ checked, setChecked ] = React.useState(true);

  return React.createElement(Switch, {
    children: "Demo Switch",
    value: checked,
    onChange: () => setChecked(!checked)
  })
}

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
          React.createElement(DemoSwitch),
          React.createElement(Switch, {
            children: `Editing ${checked ? "Checked" : "Unchecked"} Switches`,
            value: checked, 
            onChange: () => setChecked(!checked)
          }),
          React.createElement(Dropdown, {
            onChange: (v) => {
              setSetting(checked, v);
              forceUpdate();
              setColors();
            },
            options: colors,
            value: savedColor
          })
        ]
      })
    ]
  })
}

module.exports = class CSC {
  start() {
    // Hook a listener to allow us to forceUpdate and provide a custom context value
    Patcher.after(SwitchItemModule, SwitchItemKey, (that, [ props ], res) => {
      useListener();

      return React.createElement(ColorDetailsContext.Provider, {
        value: { colorDetails: allColors },
        children: res.props.children()
      })
    })
  };
  stop() {
    DOM.removeStyle();
    Patcher.unpatchAll();
  };
  getSettingsPanel() {
    return React.createElement(SettingsPanel);
  };
}
