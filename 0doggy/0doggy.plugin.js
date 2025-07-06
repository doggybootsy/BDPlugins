/**
 * @name Doggy
 * @version 0.0.4
 */

/**
 * @param {() => void} callback
 * @param {? () => void} onError
 * @param {? () => void} onFinal
 */
async function iife(callback, onError = console.error, onFinal) {
    try {
        const ret = callback();
        if (ret instanceof Promise) await ret;
    } catch (error) {
        const ret = onError(error);
        if (ret instanceof Promise) await ret;
    } finally {
        onFinal?.();
    }
}

iife.once = function(name, ...args) {
    const doggy = window[Symbol.for("doggy::iife")] ??= {};

    if (name in doggy) return doggy[name];

    doggy[name] = iife(...args);
}

window.doggy ??= {};

if (BdApi.React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE) {
    Object.defineProperty(BdApi.ReactDOM, "findDOMNode", {
        configurable: true,
        get: () => (
            BdApi.ReactDOM.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE.findDOMNode
        )
    });

    BdApi.ReactDOM.render = function(node, jsx, opts) {
        node.$$_doggy_root_$$ = BdApi.ReactDOM.createRoot(node, opts);
        node.$$_doggy_root_$$.render(jsx);
    }
    BdApi.ReactDOM.unmount = function(node) {
        node?.$$_doggy_root_$$?.unmount();
    }
}

/** @type {import("betterdiscord").PluginCallback} */
module.exports = (meta) => {
    const { Patcher, Data, DOM, React, ContextMenu, UI } = new window.BdApi(meta.name);

    /**
     * @template {T}
     * @param {T} foo
     * @returns {T} 
     */
    function assertVoid(foo) {
        if (foo == null) {
            throw new Error("Assert Void Failed!");
        }

        return foo;
    }

    const Webpack = (function() {
        let require;
        webpackChunkdiscord_app.push([
            { some: () => true },
            {},
            r => typeof r.b === "string" ? (require = r) : void 0
        ]);

        /**
         * @type {import("betterdiscord").Webpack & {
         *      getById(id): any;
         * }}
         */
        const webpack = {
            getById(id) {
                return assertVoid(BdApi.Webpack.getModule((e, m) => m.id == id, { raw: true }));
            },
            require,
            cache: require.c
        }

        Object.setPrototypeOf(webpack, BdApi.Webpack);

        return webpack;
    })();
    const Filters = Webpack.Filters;

    const { createElement, useState, useRef, createRef, Component, useSyncExternalStore, useEffect, useLayoutEffect } = React;

    /**
     * @type {<T extends string>(modules: Record<T, import("betterdiscord").ModuleQuery>) => Record<T, any>}
     */
    const getBulk = (modules) => {
        const keys = Object.keys(modules);
        const bulk = Webpack.getBulk(...Object.values(modules));

        return Object.fromEntries(keys.map((key, i) => [ key, bulk[i] ]));
    }

    const { onStop, onStart } = (function() {
        let insideOnStart = false;

        /**
         * @param {() => void} callback
         * @param {boolean}
         */
        function onStop(callback, once = insideOnStart) {
            const undo = () => onStop._callbacks.delete(newCallback);

            function newCallback() {
                if (once) undo();
                callback();
            }

            onStop._callbacks.add(newCallback);
            return undo;
        }
        onStop._callbacks = new Set();

        /**
         * @param {() => void} callback
         * @param {boolean} [once=false]
         */
        function onStart(callback, once = false) {
            const undo = () => onStart._callbacks.delete(newCallback);

            function newCallback() {
                try {
                    insideOnStart = true;
                    callback();
                }
                finally {
                    insideOnStart = false;
                    if (once) undo();
                }
            }

            onStart._callbacks.add(newCallback);
            return undo;
        }
        onStart._callbacks = new Set();

        return {
            onStop, onStart
        }
    })();

    (function() {
        const jsx = Webpack.getModule(m => m.jsx && m.jsxs);
        const React = Webpack.getModule(m => m.createElement);

        const components = new Set();
        
        const seen = new WeakSet();
        function patch(instance, [type, props], node) {
            if (!["object", "function"].includes(typeof type)) return;

            if (seen.has(type)) return node;
            seen.add(type);

            return node;
        }

        onStart(() => {
            Patcher.after(jsx, "jsx", patch);
            Patcher.after(jsx, "jsxs", patch);
            Patcher.after(React, "createElement", patch);
        });

        onStop(() => {
            components.clear();
        });
    })();

    const FluxDispatcher = Webpack.getByKeys("_dispatch");
    const dispatch = (type, data = {}) => FluxDispatcher.dispatch({...data, type});

    const { TypingModule, UploadButton } = getBulk({
        TypingModule: {
            filter: x => x.startTyping
        },
        UploadButton: {
            filter: Filters.byStrings("hasCurrentUserSentMessageSinceAppStart", "ACTIVITIES_CHAT_BUTTON_NUX_V2"),
            defaultExport: false
        }
    });

    const { Button, SwitchInput, SettingItem, SettingGroup: $SettingGroup } = BdApi.Components;

    /**
     * 
     * @param {import("betterdiscord").SettingGroupProps} props 
     * @returns 
     */
    function SettingGroup(props) {
        const groups = Storage.get("setting-group");

        return h($SettingGroup, {
            ...props,
            shown: React.useMemo(() => {
                if ("shown" in props) return props.shown;
                if (!props.collapsible) return true;
                
                if (!props.id) return false;

                return groups[props.id] ?? false;
            }, [groups, props.shown, props.collapsible, props.id]),
            onDrawerToggle: React.useCallback(v => {
                if (!props.id) return;

                Storage.set("setting-group", {
                    ...Storage.get("setting-group"),
                    [props.id]: v
                });
            }, [groups, props.id])
        })
    }

    const h = React.createElement;

    /**
     * @returns {HTMLDivElement}
     */
    function appMount() {
        if (document.contains(appMount.node)) return appMount.node;
        return appMount.node = document.getElementById("app-mount");
    }

    /** @type {import("buffer")["Buffer"]} */
    const Buffer = Webpack.getByKeys("TYPED_ARRAY_SUPPORT", { searchExports: true });

    const Storage = (function() {
        const defaultSettings = {
            /** @type {Record<string, boolean>} */
            "silent-typing": {},
            /** @type {{ "show-user-header": boolean, "mini-status": boolean }} */
            "user-action-profile": {},
            /** @type {{ "role-gradient": boolean }} */
            "always-animate": {},
            /** @type {Record<string, boolean>} */
            "setting-group": {}
        };

        /** @type {typeof defaultSettings} */
        let settings = Object.assign({}, defaultSettings, Data.load("settings"));

        /** @type {Record<keyof typeof settings, Set<() => void>>} */
        const listeners = {};

        /**
         * @template {keyof typeof settings} T
         * @param {T} key
         * @param {typeof settings[T]} value
         */
        function set(key, value) {
            settings[key] = value;

            if (typeof listeners[key] === "object") {
                for (const element of listeners[key]) {
                    element();
                }
            }

            Data.save("settings", settings);
        }

        function deleteP(key) {
            settings[key] = defaultSettings[key];

            if (typeof listeners[key] === "object") {
                for (const element of listeners[key]) {
                    element();
                }
            }

            Data.save("settings", settings);
        }

        /**
         *
         * @param {keyof typeof settings} key
         */
        function use(key) {
            if (BdApi.Hooks?.useData) {
                BdApi.Hooks.useData(meta.name, key);
                return settings[key];
            }
            
            const [ value, setValue ] = React.useState(() => settings[key]);

            React.useInsertionEffect(() => {
                function listener() {
                    setValue(() => settings[key]);
                }

                listeners[key] ??= new Set();
                listeners[key].add(listener);

                return () => listeners[key].delete(listener);
            }, [ ]);

            return value;
        }

        function get(key) {
            return settings[key];
        }

        const constructProxy = () => new Proxy(settings, {
            set(target, prop, value) {
                set(prop, value);
            },
            defineProperty() {
                return false;
            },
            deleteProperty(target, prop) {
                deleteP(prop);
            },
            setPrototypeOf() { return false; }
        });

        let proxy = constructProxy();

        function clear() {
            settings = Object.assign({}, defaultSettings);
            proxy = constructProxy();
        }

        const cache = {};
        /**
         * @template {keyof typeof settings} T
         * @template {typeof settings[T]} R
         * @param {T} key
         * @return {{
         *      use(): R,
         *      delete(): void,
         *      set(value: R): void,
         *      get(): R,
         *      value: R
         * }}
         */
        function bind(key) {
            return cache[key] ??= {
                use() { return use(key); },
                get() { return get(key); },
                delete() { return deleteP(key); },
                set(value) { return set(key, value); },
                get value() {
                    return get(key);
                },
                set value(value) {
                    return set(key, value);
                }
            }
        }

        return {
            get proxy() {return proxy},
            set proxy(v) {
                settings = Object.assign(v, defaultSettings);
                proxy = constructProxy();
            },
            get, set, delete: deleteP, use, clear, bind
        }
    })();

    const Utils = (function() {
        // 'Iterator.from' polyfill like thing
        function iteratorFrom(iterator) {
            if (typeof window.Iterator === "function") {
                return window.Iterator.from(iterator);
            }

            const generator = iterator[Symbol.iterator]();

            const data = {};
            Object.defineProperty(data, "next", {
                enumerable: false,
                writable: true,
                configurable: true,
                value: generator.next.bind(generator)
            });
            Object.defineProperty(data, Symbol.toStringTag, {
                enumerable: false,
                writable: false,
                configurable: true,
                value: "Array Iterator"
            });

            const proto = {};
            Object.defineProperty(proto, Symbol.iterator, {
                enumerable: false,
                writable: true,
                configurable: true,
                value: function*() {
                    let result;
                    while ((result = generator.next(), !result.done)) yield result.value;
                }
            });

            Object.setPrototypeOf(data, proto);

            return Object.setPrototypeOf({}, data);
        }

        class ENodeList {
            /**
             * @param {Iterable<Node>} nodes
             */
            constructor(nodes = []) {
                let count = 0;
                for (const node of nodes) {
                    if (node instanceof Node) {
                        this[count++] = node;
                        this.#nodes.push(node);
                    }
                }
            }

            /**
             * @type {Node[]}
             */
            #nodes = [];

            /**
             * @param {string} selector
             * @returns {Element | null}
             */
            querySelector(selector) {
                return this.#nodes.find(node => node instanceof Element && node.matches(selector)) || null;
            }
            /**
             * @param {string} selector
             * @returns {Element[]}
             */
            querySelectorAll(selector) {
                return this.#nodes.filter(node => node instanceof Element && node.matches(selector));
            }
            /**
             * @param {string} id
             * @returns {Element | null}
             */
            getElementById(id) {
                return this.#nodes.find(node => node instanceof Element && node.id === id) || null;
            }

            get length() { return this.#nodes.length; }

            *values() {
                yield* this.#nodes;
            }
            *keys() {
                for (let index = 0; index < this.#nodes.length; index++) {
                    yield index;
                }
            }
            *entries() {
                for (let index = 0; index < this.#nodes.length; index++) {
                    yield [ index, this.#nodes[index] ];
                }
            }

            item(index) {
                return this.#nodes[index];
            }

            /**
             * @param {(value: Node, index: number, array: Node[]) => void} callbackfn
             * @param {? any} thisArg
             * @returns {void}
             */
            forEach(callbackfn, thisArg) {
                return this.#nodes.forEach(callbackfn, thisArg);
            }

            [Symbol.iterator]() {
                return this.#nodes[Symbol.iterator]();
            }
        }

        /**
         *
         * @param {? Node} node
         * @param {? boolean} reversed
         * @returns {ENodeList}
         */
        function parents(node, reversed = false) {
            const nodes = [];
            while (node?.parentNode) {
                nodes.push(node.parentElement);
                node = node.parentElement;
            }

            if (reversed) {
                nodes.reverse();
            }

            return new ENodeList(nodes);
        }

        function forceUpdateApp() {
            const key = Object.keys(appMount()).find(m => m.startsWith("__reactContainer$"));
            const root = appMount()[key];

            let container = root.child;

            while (!container.stateNode?.isReactComponent) {
                container = container.child;
            }

            const component = container.stateNode;
            const { render } = component;

            component.render = () => null;

            component.forceUpdate(() => {
                component.render = render;
                component.forceUpdate();
            });
        }

        function findInReactTree(tree, filter) {
            return BdApi.Utils.findInTree(tree, filter, { walkable: [ "props", "children" ]})
        }

        /**
         * @param {(time: DOMHighResTimeStamp, undo: () => void) => void} callback\
         * @returns {() => void}
         */
        function requestAnimationFrames(callback) {
            const undo = () => cancelAnimationFrame(id);

            let id = requestAnimationFrame(function frame(time) {
                id = requestAnimationFrame(frame);

                callback(time, undo);
            });

            return undo;
        }

        /**
         * @template T
         * @param {T} initialState
         * @returns {[
         *      accessor: (forceNoUseHook?: boolean) => T,
         *      setter: (value: (() => T) | T) => T,
         *      addChangeListener: (callback: (value: T) => void) => () => void
         * ]}
         */
        function createState(initialState) {
            let currentState = initialState;
            const listeners = new Set();

            function accessor(forceNoUseHook = false) {
              if (forceNoUseHook || !String(React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE.H.useSyncExternalStore).includes("349")) {
                return currentState;
              }

              return useSyncExternalStore((onChange) => {
                listeners.add(onChange);
                return () => listeners.delete(onChange)
              }, () => currentState);
            }

            function setter(value) {
              if (typeof value === "function") value = value(currentState);
              currentState = value;

              for (const listener of listeners) listener();

              return currentState;
            }

            function addChangeListener(callback) {
              function callbackWrapper() {
                try {
                  callback(currentState);
                }
                catch (error) {}
              }

              listeners.add(callbackWrapper);
              return () => void listeners.delete(callbackWrapper);
            }

            const state = [
              accessor,
              setter,
              addChangeListener
            ];

            return state;
        }

        /** @type {() => [ abort: (reason?: any) => void, getSignal: () => AbortSignal ]} */
        function createAbort() {
            let controller = new AbortController();
            function abort(reason) {
                controller.abort(reason);
                controller = new AbortController();
            }
            return [abort, () => controller.signal];
        }


        return {
            forceUpdateApp, findInReactTree, requestAnimationFrames,
            createState, createAbort, parents, ENodeList, iteratorFrom,
            ...BdApi.DOM,
            ...BdApi.Utils,
            ...BdApi.ReactUtils
        }
    })();

    const CSS = (function() {
        const styles = new Set();
        onStop(() => {
            for (const element of styles) {
                BdApi.DOM.removeStyle(`${meta.name}-${element}`);
            }

            styles.clear();
        });

        let i = 0;

        return {
            /**
             *
             * @param {string} id
             * @param {string} css
             */
            addStyle(id, css) {
                if (arguments.length === 1) {
                    css = id;
                    id = "db-" + i++
                }

                id = `${meta.name}-${id}`;

                if (styles.has(id)) return () => this.removeStyle(id);

                BdApi.DOM.addStyle(id, css);
                styles.add(id);

                return () => this.removeStyle(id);
            },
            removeStyle(id) {
                BdApi.DOM.removeStyle(`${meta.name}-${id}`);
            }
        }
    })();

    const [access, setter] = Utils.createState(0);

    /**
     * @template {Record<PropertyKey, any>} T
     * @param {T | (() => T)} obj 
     * @param {? boolean} nested 
     * @returns {T}
     */
    function useReactiveObject(obj, nested = true) {
        const [, forceUpdate] = React.useReducer(r => r + 1, 0);
        
        return React.useMemo(() => {
            const map = new WeakMap();
            
            function proxy(obj) {
                const proxied = new Proxy(obj, {
                    get(target, prop, r) {
                        const ret = Reflect.get(target, prop, r);

                        if (!nested) {
                            return ret;
                        }

                        if ((typeof ret === "object" && ret !== null) || typeof ret === "function") {
                            let value = map.get(ret);
                            if (!value) {
                                value = proxy(ret);
                            }

                            return value;
                        }

                        return ret;
                    },
                    set(target, prop, newValue, r) {
                        if (Reflect.set(target, prop, newValue, r)) {
                            forceUpdate();
                            return true;
                        }

                        return false;
                    }
                });

                map.set(obj, proxied);
                map.set(proxied, proxied);

                return proxied;
            }

            return proxy(typeof obj === "function" ? obj() : obj);
        }, []);
    }

    function Settings({ onClose }) {
        const uap = Storage.use("user-action-profile");
        const aa = Storage.use("always-animate");

        const state = useReactiveObject({
            foo: 123,
            bar: {
                baz: 123
            }
        });

        return [
            h(SettingGroup, {
                name: "User Action Profile",
                id: "user-action-profile",
                collapsible: true,
                children: [
                    h(SettingItem, {
                        name: "Mini Status",
                        note: "Minifies the status",
                        inline: true,
                        children: h(SwitchInput, {
                            value: uap["mini-status"],
                            onChange: (v) => {
                                Storage.set("user-action-profile", Object.assign({}, uap, { "mini-status": v }));
                            }
                        })
                    }),
                    h(SettingItem, {
                        name: "Show User Header",
                        note: "Shows the user header",
                        inline: true,
                        children: h(SwitchInput, {
                            value: uap["show-user-header"] ?? true,
                            onChange: (v) => {
                                Storage.set("user-action-profile", Object.assign({}, uap, { "show-user-header": v }));
                            }
                        })
                    }),
                ]
            }),
            h(SettingGroup, {
                name: "Always Animate",
                id: "always-animate",
                collapsible: true,
                children: [
                    h(SettingItem, {
                        name: "Gradient Roles",
                        note: "Always animate holographic roles",
                        inline: true,
                        children: h(SwitchInput, {
                            value: aa["role-gradient"] ?? true,
                            onChange: (v) => {
                                Storage.set("always-animate", Object.assign({}, aa, { "role-gradient": v }));
                            }
                        })
                    })
                ]
            }),
            h(SettingGroup, {
                name: "Experimental",
                id: "experimental",
                collapsible: true,
                children: [
                    h("div", {
                        children: [
                            h("div", {style: {color: "red"}}, "useReactiveObject"),
                            h("div", {
                                style: {
                                    display: "flex",
                                    flexDirection: "row-reverse",
                                    justifyContent: "space-between"
                                },
                                children: [
                                    h(Button, {
                                        children: "+",
                                        onClick() {
                                            state.foo++;
                                        }
                                    }),
                                    h(Button, {
                                        children: state.foo
                                    }),
                                    h(Button, {
                                        children: "-",
                                        onClick() {
                                            state.foo--;
                                        }
                                    }),
                                ]
                            })
                        ]
                    }),
                    h(Button, {
                        children: access(),
                        onClick() {
                            setter(r => r + 1);
                        }
                    })
                ]
            }),
            h(Button, {
                children: "Close",
                onClick: onClose
            })
        ]
    }

    const LayerManager = {
        push(component) {
            FluxDispatcher.dispatch({
                type: "LAYER_PUSH",
                component
            });
        },
        pop() {
            FluxDispatcher.dispatch({
                type: "LAYER_POP"
            });
        },
        popAll() {
            FluxDispatcher.dispatch({
                type: "LAYER_POP_ALL"
            });
        }
    };

    {Utils.LayerManager = LayerManager};

    iife(() => {
        const silentTyping = Storage.bind("silent-typing");

        onStart(() => {
            function KeyboardSlash(props) {
                return h("svg", {
                    width: props.width ?? 24,
                    height: props.height ?? 24,
                    viewBox: "0 0 24 24",
                    className: props.className,
                    children: [
                        h("path", {
                            fillRule: "evenodd",
                            clipRule: "evenodd",
                            fill: "currentColor",
                            d: "M12.426 5.25783H3.00063C2.20481 5.25783 1.44159 5.57396 0.878863 6.13669C0.316136 6.69942 0 7.46264 0 8.25845V15.76C0 16.5558 0.316136 17.3191 0.878863 17.8818C1.44159 18.4445 2.20481 18.7606 3.00063 18.7606H4.63016L6.36272 15.7598C6.16197 15.7526 6.00125 15.5874 6.00125 15.3849V14.6348C6.00125 14.5353 6.04077 14.4399 6.11111 14.3696C6.18145 14.2992 6.27685 14.2597 6.37633 14.2597H7.22878L10.5054 8.5844C10.5162 8.50306 10.5534 8.42697 10.612 8.36831C10.6236 8.35671 10.6359 8.34595 10.6488 8.33606L12.426 5.25783ZM13.1555 14.2597L18.3527 5.25783H21.0044C21.8002 5.25783 22.5634 5.57396 23.1261 6.13669C23.6889 6.69942 24.005 7.46264 24.005 8.25845V15.76C24.005 16.5558 23.6889 17.3191 23.1261 17.8818C22.5634 18.4445 21.8002 18.7606 21.0044 18.7606H10.5568L11.5789 16.9903L12.2892 15.76H14.628C14.7275 15.76 14.8229 15.7205 14.8933 15.6502C14.9636 15.5798 15.0031 15.4844 15.0031 15.3849V14.6348C15.0031 14.5353 14.9636 14.4399 14.8933 14.3696C14.8229 14.2992 14.7275 14.2597 14.628 14.2597H13.1555ZM19.5041 9.38369V8.63353C19.5041 8.53405 19.5436 8.43865 19.6139 8.36831C19.6843 8.29797 19.7797 8.25845 19.8791 8.25845H20.6293C20.7288 8.25845 20.8242 8.29797 20.8945 8.36831C20.9649 8.43865 21.0044 8.53405 21.0044 8.63353V9.38369C21.0044 9.48316 20.9649 9.57857 20.8945 9.64891C20.8242 9.71925 20.7288 9.75877 20.6293 9.75877H19.8791C19.6721 9.75877 19.5041 9.59073 19.5041 9.38369ZM3.11048 11.3689C3.18082 11.2986 3.27623 11.2591 3.3757 11.2591H4.12586C4.22534 11.2591 4.32074 11.2986 4.39108 11.3689C4.46142 11.4393 4.50094 11.5347 4.50094 11.6342V12.3843C4.50094 12.4838 4.46142 12.5792 4.39108 12.6495C4.32074 12.7199 4.22534 12.7594 4.12586 12.7594H3.3757C3.16866 12.7594 3.00063 12.5914 3.00063 12.3843V11.6342C3.00063 11.5347 3.04014 11.4393 3.11048 11.3689ZM6.00125 12.3843V11.6342C6.00125 11.5347 6.04077 11.4393 6.11111 11.3689C6.18145 11.2986 6.27685 11.2591 6.37633 11.2591H7.12649C7.22596 11.2591 7.32136 11.2986 7.39171 11.3689C7.46205 11.4393 7.50156 11.5347 7.50156 11.6342V12.3843C7.50156 12.4838 7.46205 12.5792 7.39171 12.6495C7.32136 12.7199 7.22596 12.7594 7.12649 12.7594H6.37633C6.16929 12.7594 6.00125 12.5914 6.00125 12.3843ZM19.6139 11.3689C19.6843 11.2986 19.7797 11.2591 19.8791 11.2591H20.6293C20.7288 11.2591 20.8242 11.2986 20.8945 11.3689C20.9649 11.4393 21.0044 11.5347 21.0044 11.6342V12.3843C21.0044 12.4838 20.9649 12.5792 20.8945 12.6495C20.8242 12.7199 20.7288 12.7594 20.6293 12.7594H19.8791C19.6721 12.7594 19.5041 12.5914 19.5041 12.3843V11.6342C19.5041 11.5347 19.5436 11.4393 19.6139 11.3689ZM19.6139 14.3696C19.6843 14.2992 19.7797 14.2597 19.8791 14.2597H20.6293C20.7288 14.2597 20.8242 14.2992 20.8945 14.3696C20.9649 14.4399 21.0044 14.5353 21.0044 14.6348V15.3849C21.0044 15.4844 20.9649 15.5798 20.8945 15.6502C20.8242 15.7205 20.7288 15.76 20.6293 15.76H19.8791C19.6721 15.76 19.5041 15.592 19.5041 15.3849V14.6348C19.5041 14.5353 19.5436 14.4399 19.6139 14.3696ZM15.113 11.3689C15.1833 11.2986 15.2787 11.2591 15.3782 11.2591H17.6287C17.7282 11.2591 17.8236 11.2986 17.8939 11.3689C17.9642 11.4393 18.0038 11.5347 18.0038 11.6342V12.3843C18.0038 12.4838 17.9642 12.5792 17.8939 12.6495C17.8236 12.7199 17.7282 12.7594 17.6287 12.7594H15.3782C15.1712 12.7594 15.0031 12.5914 15.0031 12.3843V11.6342C15.0031 11.5347 15.0426 11.4393 15.113 11.3689ZM16.5034 15.3849V14.6348C16.5034 14.5353 16.543 14.4399 16.6133 14.3696C16.6836 14.2992 16.779 14.2597 16.8785 14.2597H17.6287C17.7282 14.2597 17.8236 14.2992 17.8939 14.3696C17.9642 14.4399 18.0038 14.5353 18.0038 14.6348V15.3849C18.0038 15.4844 17.9642 15.5798 17.8939 15.6502C17.8236 15.7205 17.7282 15.76 17.6287 15.76H16.8785C16.6715 15.76 16.5034 15.592 16.5034 15.3849ZM16.6133 8.36831C16.6836 8.29797 16.779 8.25845 16.8785 8.25845H17.6287C17.7282 8.25845 17.8236 8.29797 17.8939 8.36831C17.9642 8.43865 18.0038 8.53405 18.0038 8.63353V9.38369C18.0038 9.48316 17.9642 9.57857 17.8939 9.64891C17.8236 9.71925 17.7282 9.75877 17.6287 9.75877H16.8785C16.6715 9.75877 16.5034 9.59073 16.5034 9.38369V8.63353C16.5034 8.53405 16.543 8.43865 16.6133 8.36831ZM7.50156 9.38369V8.63353C7.50156 8.53405 7.54108 8.43865 7.61142 8.36831C7.68176 8.29797 7.77716 8.25845 7.87664 8.25845H8.6268C8.72627 8.25845 8.82168 8.29797 8.89202 8.36831C8.96236 8.43865 9.00188 8.53405 9.00188 8.63353V9.38369C9.00188 9.48316 8.96236 9.57857 8.89202 9.64891C8.82168 9.71925 8.72627 9.75877 8.6268 9.75877H7.87664C7.6696 9.75877 7.50156 9.59073 7.50156 9.38369ZM3.11048 8.36831C3.18082 8.29797 3.27623 8.25845 3.3757 8.25845H5.62617C5.72565 8.25845 5.82105 8.29797 5.89139 8.36831C5.96173 8.43865 6.00125 8.53405 6.00125 8.63353V9.38369C6.00125 9.48316 5.96173 9.57857 5.89139 9.64891C5.82105 9.71925 5.72565 9.75877 5.62617 9.75877H3.3757C3.16866 9.75877 3.00063 9.59073 3.00063 9.38369V8.63353C3.00063 8.53405 3.04014 8.43865 3.11048 8.36831ZM3.00063 15.3849V14.6348C3.00063 14.5353 3.04014 14.4399 3.11048 14.3696C3.18082 14.2992 3.27623 14.2597 3.3757 14.2597H4.12586C4.22534 14.2597 4.32074 14.2992 4.39108 14.3696C4.46142 14.4399 4.50094 14.5353 4.50094 14.6348V15.3849C4.50094 15.4844 4.46142 15.5798 4.39108 15.6502C4.32074 15.7205 4.22534 15.76 4.12586 15.76H3.3757C3.16866 15.76 3.00063 15.592 3.00063 15.3849Z"
                        }),
                        h("path", {
                            className: "silent-typing-strike",
                            fill: "var(--status-danger)",
                            d: "M17.5611 3.16855L16.0795 2.31311L4.81056 21.8314L6.29223 22.6869L9.11697 17.8078L9.94301 16.3636L11.0611 14.4269L13.513 10.1802L17.5611 3.16855Z"
                        })
                    ]
                })
            }
            function Keyboard(props) {
                return h("svg", {
                    width: props.width ?? 24,
                    height: props.height ?? 24,
                    viewBox: "0 0 24 14",
                    className: props.className,
                    children: [
                        h("path", {
                            fill: "currentColor",
                            d: "M0 3.25845C0 2.46264 0.316136 1.69942 0.878863 1.13669C1.44159 0.573964 2.20481 0.257828 3.00063 0.257828H21.0044C21.8002 0.257828 22.5634 0.573964 23.1261 1.13669C23.6889 1.69942 24.005 2.46264 24.005 3.25845V10.76C24.005 11.5558 23.6889 12.3191 23.1261 12.8818C22.5634 13.4445 21.8002 13.7606 21.0044 13.7606H3.00063C2.20481 13.7606 1.44159 13.4445 0.878863 12.8818C0.316136 12.3191 0 11.5558 0 10.76V3.25845ZM19.5041 3.63353V4.38369C19.5041 4.59073 19.6721 4.75877 19.8791 4.75877H20.6293C20.7288 4.75877 20.8242 4.71925 20.8945 4.64891C20.9649 4.57857 21.0044 4.48316 21.0044 4.38369V3.63353C21.0044 3.53405 20.9649 3.43865 20.8945 3.36831C20.8242 3.29797 20.7288 3.25845 20.6293 3.25845H19.8791C19.7797 3.25845 19.6843 3.29797 19.6139 3.36831C19.5436 3.43865 19.5041 3.53405 19.5041 3.63353ZM3.3757 6.25908C3.27623 6.25908 3.18082 6.2986 3.11048 6.36894C3.04014 6.43928 3.00063 6.53468 3.00063 6.63416V7.38431C3.00063 7.59136 3.16866 7.75939 3.3757 7.75939H4.12586C4.22534 7.75939 4.32074 7.71987 4.39108 7.64953C4.46142 7.57919 4.50094 7.48379 4.50094 7.38431V6.63416C4.50094 6.53468 4.46142 6.43928 4.39108 6.36894C4.32074 6.2986 4.22534 6.25908 4.12586 6.25908H3.3757ZM6.00125 6.63416V7.38431C6.00125 7.59136 6.16929 7.75939 6.37633 7.75939H7.12649C7.22596 7.75939 7.32137 7.71987 7.39171 7.64953C7.46205 7.57919 7.50156 7.48379 7.50156 7.38431V6.63416C7.50156 6.53468 7.46205 6.43928 7.39171 6.36894C7.32137 6.2986 7.22596 6.25908 7.12649 6.25908H6.37633C6.27685 6.25908 6.18145 6.2986 6.11111 6.36894C6.04077 6.43928 6.00125 6.53468 6.00125 6.63416ZM9.37695 6.25908C9.27748 6.25908 9.18207 6.2986 9.11173 6.36894C9.04139 6.43928 9.00188 6.53468 9.00188 6.63416V7.38431C9.00188 7.59136 9.16991 7.75939 9.37695 7.75939H10.1271C10.2266 7.75939 10.322 7.71987 10.3923 7.64953C10.4627 7.57919 10.5022 7.48379 10.5022 7.38431V6.63416C10.5022 6.53468 10.4627 6.43928 10.3923 6.36894C10.322 6.2986 10.2266 6.25908 10.1271 6.25908H9.37695ZM12.0025 6.63416V7.38431C12.0025 7.59136 12.1705 7.75939 12.3776 7.75939H13.1277C13.2272 7.75939 13.3226 7.71987 13.393 7.64953C13.4633 7.57919 13.5028 7.48379 13.5028 7.38431V6.63416C13.5028 6.53468 13.4633 6.43928 13.393 6.36894C13.3226 6.2986 13.2272 6.25908 13.1277 6.25908H12.3776C12.2781 6.25908 12.1827 6.2986 12.1124 6.36894C12.042 6.43928 12.0025 6.53468 12.0025 6.63416ZM19.8791 6.25908C19.7797 6.25908 19.6843 6.2986 19.6139 6.36894C19.5436 6.43928 19.5041 6.53468 19.5041 6.63416V7.38431C19.5041 7.59136 19.6721 7.75939 19.8791 7.75939H20.6293C20.7288 7.75939 20.8242 7.71987 20.8945 7.64953C20.9649 7.57919 21.0044 7.48379 21.0044 7.38431V6.63416C21.0044 6.53468 20.9649 6.43928 20.8945 6.36894C20.8242 6.2986 20.7288 6.25908 20.6293 6.25908H19.8791ZM19.8791 9.2597C19.7797 9.2597 19.6843 9.29922 19.6139 9.36956C19.5436 9.4399 19.5041 9.53531 19.5041 9.63478V10.3849C19.5041 10.592 19.6721 10.76 19.8791 10.76H20.6293C20.7288 10.76 20.8242 10.7205 20.8945 10.6502C20.9649 10.5798 21.0044 10.4844 21.0044 10.3849V9.63478C21.0044 9.53531 20.9649 9.4399 20.8945 9.36956C20.8242 9.29922 20.7288 9.2597 20.6293 9.2597H19.8791ZM15.3782 6.25908C15.2787 6.25908 15.1833 6.2986 15.113 6.36894C15.0426 6.43928 15.0031 6.53468 15.0031 6.63416V7.38431C15.0031 7.59136 15.1712 7.75939 15.3782 7.75939H17.6287C17.7282 7.75939 17.8236 7.71987 17.8939 7.64953C17.9642 7.57919 18.0038 7.48379 18.0038 7.38431V6.63416C18.0038 6.53468 17.9642 6.43928 17.8939 6.36894C17.8236 6.2986 17.7282 6.25908 17.6287 6.25908H15.3782ZM16.5034 9.63478V10.3849C16.5034 10.592 16.6715 10.76 16.8785 10.76H17.6287C17.7282 10.76 17.8236 10.7205 17.8939 10.6502C17.9642 10.5798 18.0038 10.4844 18.0038 10.3849V9.63478C18.0038 9.53531 17.9642 9.4399 17.8939 9.36956C17.8236 9.29922 17.7282 9.2597 17.6287 9.2597H16.8785C16.779 9.2597 16.6836 9.29922 16.6133 9.36956C16.543 9.4399 16.5034 9.53531 16.5034 9.63478ZM16.8785 3.25845C16.779 3.25845 16.6836 3.29797 16.6133 3.36831C16.543 3.43865 16.5034 3.53405 16.5034 3.63353V4.38369C16.5034 4.59073 16.6715 4.75877 16.8785 4.75877H17.6287C17.7282 4.75877 17.8236 4.71925 17.8939 4.64891C17.9642 4.57857 18.0038 4.48316 18.0038 4.38369V3.63353C18.0038 3.53405 17.9642 3.43865 17.8939 3.36831C17.8236 3.29797 17.7282 3.25845 17.6287 3.25845H16.8785ZM13.5028 3.63353V4.38369C13.5028 4.59073 13.6708 4.75877 13.8779 4.75877H14.628C14.7275 4.75877 14.8229 4.71925 14.8933 4.64891C14.9636 4.57857 15.0031 4.48316 15.0031 4.38369V3.63353C15.0031 3.53405 14.9636 3.43865 14.8933 3.36831C14.8229 3.29797 14.7275 3.25845 14.628 3.25845H13.8779C13.7784 3.25845 13.683 3.29797 13.6127 3.36831C13.5423 3.43865 13.5028 3.53405 13.5028 3.63353ZM10.8773 3.25845C10.7778 3.25845 10.6824 3.29797 10.612 3.36831C10.5417 3.43865 10.5022 3.53405 10.5022 3.63353V4.38369C10.5022 4.59073 10.6702 4.75877 10.8773 4.75877H11.6274C11.7269 4.75877 11.8223 4.71925 11.8926 4.64891C11.963 4.57857 12.0025 4.48316 12.0025 4.38369V3.63353C12.0025 3.53405 11.963 3.43865 11.8926 3.36831C11.8223 3.29797 11.7269 3.25845 11.6274 3.25845H10.8773ZM7.50156 3.63353V4.38369C7.50156 4.59073 7.6696 4.75877 7.87664 4.75877H8.6268C8.72627 4.75877 8.82168 4.71925 8.89202 4.64891C8.96236 4.57857 9.00188 4.48316 9.00188 4.38369V3.63353C9.00188 3.53405 8.96236 3.43865 8.89202 3.36831C8.82168 3.29797 8.72627 3.25845 8.6268 3.25845H7.87664C7.77716 3.25845 7.68176 3.29797 7.61142 3.36831C7.54108 3.43865 7.50156 3.53405 7.50156 3.63353ZM3.3757 3.25845C3.27623 3.25845 3.18082 3.29797 3.11048 3.36831C3.04014 3.43865 3.00063 3.53405 3.00063 3.63353V4.38369C3.00063 4.59073 3.16866 4.75877 3.3757 4.75877H5.62617C5.72565 4.75877 5.82105 4.71925 5.89139 4.64891C5.96173 4.57857 6.00125 4.48316 6.00125 4.38369V3.63353C6.00125 3.53405 5.96173 3.43865 5.89139 3.36831C5.82105 3.29797 5.72565 3.25845 5.62617 3.25845H3.3757ZM3.00063 9.63478V10.3849C3.00063 10.592 3.16866 10.76 3.3757 10.76H4.12586C4.22534 10.76 4.32074 10.7205 4.39108 10.6502C4.46142 10.5798 4.50094 10.4844 4.50094 10.3849V9.63478C4.50094 9.53531 4.46142 9.4399 4.39108 9.36956C4.32074 9.29922 4.22534 9.2597 4.12586 9.2597H3.3757C3.27623 9.2597 3.18082 9.29922 3.11048 9.36956C3.04014 9.4399 3.00063 9.53531 3.00063 9.63478ZM6.37633 9.2597C6.27685 9.2597 6.18145 9.29922 6.11111 9.36956C6.04077 9.4399 6.00125 9.53531 6.00125 9.63478V10.3849C6.00125 10.592 6.16929 10.76 6.37633 10.76H14.628C14.7275 10.76 14.8229 10.7205 14.8933 10.6502C14.9636 10.5798 15.0031 10.4844 15.0031 10.3849V9.63478C15.0031 9.53531 14.9636 9.4399 14.8933 9.36956C14.8229 9.29922 14.7275 9.2597 14.628 9.2597H6.37633Z"
                        })
                    ]
                })
            }

            function useSetting(channelId) {
                const value = silentTyping.use();
                if (channelId in value) return value[channelId];
                return true;
            }

            function getSetting(channelId) {
                const value = silentTyping.get();
                if (channelId in value) return value[channelId];
                return true;
            }

            function toggle(channelId) {
                const value = silentTyping.get();

                silentTyping.set({
                    ...value,
                    [channelId]: channelId in value ? !value[channelId] : false
                });
            }

            function OmniMenu($props) {
                const res = OmniMenu.__type($props);
                const setting = useSetting($props.channel.id);

                const item = res.props.children.filter(Boolean)[0];

                if (!item) return;

                const props = Utils.findInReactTree(item.props.label, m => m?.className);

                res.props.children.push(
                    h(ContextMenu.Separator),
                    h(ContextMenu.Item, {
                        id: "toggle-silent-typing",
                        action: () => toggle($props.channel.id),
                        dontCloseOnActionIfHoldingShiftKey: true,
                        label: h("div", {
                            className: props.className,
                            children: [
                                {
                                    ...props.children[0],
                                    type: setting ? KeyboardSlash : Keyboard
                                },
                                h("div", {
                                    ...props.children[1].props,
                                    children: setting ? "Disable Silent Typing" : "Enable Silent Typing"
                                })
                            ]
                        })
                    })
                );

                return res;
            }

            Patcher.before(UploadButton, "Z", (that, [ props ]) => {
                if (!props) return;

                const tooltip = props.children;
                const isEnabled = useSetting(props.channel.id);

                props.children = React.cloneElement(tooltip, {
                    children: (...args) => {
                        const res = tooltip.props.children(...args);

                        if (isEnabled) {
                            res.props.className = `${res.props.className} doggy-silent-typing`;
                        }
                        else {
                            res.props.className = res.props.className.replace(" doggy-silent-typing", "");
                        }

                        return res;
                    },
                    renderPopout: (...args) => {
                        const res = tooltip.props.renderPopout(...args);

                        if (!res) return;
                        if (res.type.__type) return;

                        OmniMenu.__type = res.type;

                        return {
                            ...res,
                            type: OmniMenu,
                        };
                    }
                });
            });

            Patcher.instead(TypingModule, "startTyping", (that, args, original) => {
                if (getSetting(args[0])) return;

                original(...args);
            });

            CSS.addStyle(`.doggy-silent-typing svg circle:first-child + path { color: red; }`)
        });
    });

    iife(() => {
        
    });

    iife(() => {
        return;

        onStart(() => {         
               
            Patcher.after(Webpack.getByKeys("Channel", "GuildName", { raw: true }).exports, "Z", console.log);
        });
    })

    iife(() => {
        const moment = Webpack.getModule(m => m.isMoment);

        onStart(() => {
            Patcher.instead(...Webpack.getWithKey(Filters.byStrings("().localeData(),", '<2?"nextDay":"sameElse"', "L LT")), (that, [ timestamp ]) => {
                return moment(timestamp).calendar(null, {
                    sameDay: "[Today at] LT",
                    nextDay: "[Tomorrow at] LT",
                    nextWeek: "dddd [at] LT",
                    lastDay: "[Yesterday at] LT",
                    lastWeek: "[Last] dddd [at] LT",
                    sameElse: "M/DD/YYYY h:mm A"
                });
            });
        });
    });

    iife(() => {
        let SettingsView = Webpack.getByPrototypeKeys("getPredicateSections");

        !async function() {
            if (!SettingsView) {
                const regex = /{createPromise:\(\)=>n\.e\("\d+"\)\.then\(n\.bind\(n,\d+\)\),webpackId:\d+,name:"UserSettings"}/;
                let object = {
                    createPromise: () => Promise.reject()
                }

                for (const key in Webpack.modules) {            
                    if (Object.prototype.hasOwnProperty.call(Webpack.modules, key)) {
                        const match = String(Webpack.modules[key]).match(regex);

                        if (match) {
                            object = eval(`(n=>(${match[0]}))`)(Webpack.require);

                            break;
                        }
                    }
                }

                await object.createPromise();
                
                SettingsView = Webpack.getByPrototypeKeys("getPredicateSections");
            }
        }();
        
        const getSettingSections = (onSetSection = () => {}) => {
            let sections = [];

            SettingsView.prototype.getPredicateSections.call({
                _reactInternals: {
                    onSetSection
                },
                props: {
                    sections: {
                        filter: () => ({
                            findIndex: () => 1,
                            splice: (...args) => {
                                const section = args.at(-1);
                                sections.push(section);
                            }
                        })
                    }
                }
            });

            return sections.slice(1);
        }

        function shallowCompareArrays(arr1, arr2) {
            return arr1.length === arr2.length && arr1.every((val, index) => val === arr2[index]);
        }

        function Icon({addon, setSection, manager}) {
            const [ isEnabled, setEnabled ] = useState(() => manager.isEnabled(addon.id));

            useEffect(() => {
                const interval = setInterval(() => {
                    setEnabled(manager.isEnabled(addon.id));
                }, 50);

                return () => clearInterval(interval);
            });

            return h("div", {
                style: {
                    display: "flex",
                    flexDirection: "row-reverse",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: 4
                },
                children: [
                    addon.filename !== "0doggy.plugin.js" && h(SwitchInput, {
                        value: isEnabled, 
                        onChange: () => {
                            manager[isEnabled ? "disable" : "enable"](addon.id);
                            setEnabled(manager.isEnabled(addon.id));
                        },
                        internalState: false
                    }),
                    addon.instance?.getSettingsPanel && [
                        h("svg", {
                            viewBox: "0 0 24 24",
                            width: 24,
                            height: 24,
                            strokeLinecap: "round",
                            strokeWidth: 2,
                            strokeLineJoin: 2,
                            className: "lucide lucide-settings",
                            stroke: "currentColor",
                            fill: "none",
                            onClick: () => {
                                if (manager.isEnabled(addon.id)) {
                                    setSection(addon.filename);
                                }
                                else {
                                    BdApi.UI.showToast(
                                        `${addon.name} is not enabled!`,
                                        { type: "warning", forceShow: true }
                                    );
                                }
                            },
                            children: [
                                h("path", {
                                    d: "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"
                                }),
                                h("circle", {
                                    cx: 12,
                                    cy: 12,
                                    r: 3
                                })
                            ]
                        })
                    ]
                ]
            })
        }

        function getBDSetting(groupKey, settingKey, reactive = false) {
            const sections = getSettingSections();

            const groups = sections[1].element().type(sections[1].element().props).props.children[1];

            const group = groups.find(m => m.props.id === groupKey);
            if (!group) return { value: null, disabled: null };

            const groupRes = Utils.wrapInHooks(group.type)(group.props);

            const settingItem = groupRes.props.children[0].find(m => m.props.id === settingKey);

            let setting = { value: null, disabled: null };
            if (!settingItem) return setting;

            if (reactive) settingItem.type(settingItem.props);

            Utils.wrapInHooks(settingItem.type, { useCallback: v => setting = v() })(settingItem.props);

            return setting;
        }
        
        function BetterDiscord() {            
            const sections = React.useMemo(() => getSettingSections((section) => setSection(section)));
            const [section, setSection] = useState(() => sections.at(1).section);

            const [plugins, setPlugins] = useState(() => {
                return Object.fromEntries(BdApi.Plugins.getAll().map((plugin) => [ plugin.filename, plugin ]));
            });
            const [themes, setThemes] = useState(() => {
                return Object.fromEntries(BdApi.Themes.getAll().map((theme) => [ theme.filename, theme ]));
            });

            useEffect(() => {
                let lastPlugins = BdApi.Plugins.getAll();
                let lastThemes = BdApi.Themes.getAll();

                let interval = setInterval(() => {
                    if (!shallowCompareArrays(lastPlugins, lastPlugins = BdApi.Plugins.getAll())) {
                        setPlugins(Object.fromEntries(lastPlugins.map((plugin) => [ plugin.filename, plugin ])));
                    }
                    if (!shallowCompareArrays(lastThemes, lastThemes = BdApi.Themes.getAll())) {
                        setThemes(Object.fromEntries(lastThemes.map((theme) => [ theme.filename, theme ])));
                    }
                }, 50);

                return () => clearInterval(interval);
            }, []);

            const themeSections = React.useMemo(() => {
                const values = Object.values(themes);
                if (!values.length) return [];

                return [
                    { section: "DIVIDER" },
                    { section: "HEADER", label: sections.find(m => m.className === "bd-themes-tab").label },
                    ...values.sort((a, b) => a.name.localeCompare(b.name)).map((theme) => {
                        const item = { 
                            section: theme.filename,
                            label: theme.name,
                            icon: h(Icon, { addon: theme, setSection, manager: BdApi.Themes }),
                            element: () => [
                                h("h2", { className: "bd-settings-title" }, theme.name),
                                h("div", {
                                    children: h("pre", {
                                        children: h("code", {}, theme.css)
                                    })
                                })
                            ],
                            onClick: () => {}
                        };

                        return item;
                    })
                ]
            }, [themes]);

            const isAddonStoreEnabled = getBDSetting("store", "bdAddonStore", true);
            
            const communitySections = React.useMemo(() => {
                if (!isAddonStoreEnabled.value) return [];

                return [
                    { section: "DIVIDER" },
                    { section: "HEADER", label: "Community" },
                    {
                        section: "bd-plugin-store",
                        label: "Plugin Store",
                        element: () => {
                            const panel = sections[4].element();

                            const storeResult = Utils.wrapInHooks(panel.props.children.type, {
                                useState: () => [true, () => true]
                            })(panel.props.children.props);

                            return storeResult;
                        }
                    },
                    {
                        section: "bd-theme-store",
                        label: "Theme Store",
                        element: () => {
                            const panel = sections[5].element();

                            const storeResult = Utils.wrapInHooks(panel.props.children.type, {
                                useState: () => [true, () => true]
                            })(panel.props.children.props);

                            return storeResult;
                        }
                    }
                ]
            }, [isAddonStoreEnabled]);

            return h(SettingsView, {
                sections: [
                    ...sections.slice(0, -2),
                    ...communitySections,
                    { section: "DIVIDER" },
                    { section: "HEADER", label: sections.find(m => m.className === "bd-plugins-tab").label },
                    ...Object.values(plugins).sort((a, b) => a.filename === "0doggy.plugin.js" ? -1 : b.filename === "0doggy.plugin.js" ? 1 : a.name.localeCompare(b.name)).map((plugin) => {
                        const item = { 
                            section: plugin.filename,
                            label: plugin.name,
                            icon: h(Icon, { addon: plugin, setSection, manager: BdApi.Plugins }),
                            element: () => [
                                h("h2", { className: "bd-settings-title" }, plugin.name),
                                plugin.instance.getSettingsPanel()
                            ],
                            onClick: () => {}
                        };

                        return item;
                    }),
                    ...themeSections
                ],
                section,
                onSetSection: setSection,
                onClose: LayerManager.pop,
                title: "BetterDiscord"
            });
        }

        doggy.openBetterDiscordLayer = () => {
            LayerManager.push(() => h(BetterDiscord));
        };

        let id;
        const scrollers = BdApi.Webpack.getModule((e, m) => {
            if (BdApi.Webpack.modules[m.id].toString().includes(".customTheme)")) {
                return id = m.id;
            }
        });
        const AdvancedScrollerNone = scrollers[BdApi.Webpack.modules[id].toString().match(/,(.{1,3}):\(\)=>(.{1,3}),.+?\2=\(0,.{1,3}\..{1,3}\)\((.{1,3})\.none,\3\.fade,\3\.customTheme\)/)[1]];

        const topSectionFilter = Filters.byStrings(".isCurrentUserGuest(");
        const dmsFilter = Filters.byStrings(".getPrivateChannelsVersion()");

        function DashboardButton() {
            return h("div", {
                id: "betterdiscord-dashboard",
                children: h("button", {
                    onClick: doggy.openBetterDiscordLayer,
                    children: h("svg", {
                        viewBox: "0 0 2000 2000",
                        width: 20,
                        height: 20,
                        children: [
                            h("path", {
                                fill: "currentColor",
                                d: "M1402.2,631.7c-9.7-353.4-286.2-496-642.6-496H68.4v714.1l442,398V490.7h257c274.5,0,274.5,344.9,0,344.9H597.6v329.5h169.8c274.5,0,274.5,344.8,0,344.8h-699v354.9h691.2c356.3,0,632.8-142.6,642.6-496c0-162.6-44.5-284.1-122.9-368.6C1357.7,915.8,1402.2,794.3,1402.2,631.7z"
                            }),
                            h("path", {
                                fill: "currentColor",
                                d: "M1262.5,135.2L1262.5,135.2l-76.8,0c26.6,13.3,51.7,28.1,75,44.3c70.7,49.1,126.1,111.5,164.6,185.3c39.9,76.6,61.5,165.6,64.3,264.6l0,1.2v1.2c0,141.1,0,596.1,0,737.1v1.2l0,1.2c-2.7,99-24.3,188-64.3,264.6c-38.5,73.8-93.8,136.2-164.6,185.3c-22.6,15.7-46.9,30.1-72.6,43.1h72.5c346.2,1.9,671-171.2,671-567.9V716.7C1933.5,312.2,1608.7,135.2,1262.5,135.2z"
                            }),
                        ]
                    })
                })
            });
        }

        const map = new WeakMap();

        onStart(() => {
            CSS.addStyle(`
                #betterdiscord-dashboard {
                    width: 100%;
                    height: 30px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                #betterdiscord-dashboard button {
                    display: flex;
                    background-color: var(--background-mod-subtle);
                    color: var(--text-default);
                    transition: scale .15s ease-out, background-color .15s ease-out, color .15s ease-out;
                    align-items: center;
                    display: flex;
                    justify-content: center;
                    width: var(--guildbar-avatar-size);
                    padding: 5px;
                    border-radius: 8px;
                }
                #betterdiscord-dashboard button:hover {
                    background-color: var(--bg-brand);
                    color: var(--white);
                }

                :is(#bd-plugin-store-tab, #bd-theme-store-tab) .bd-addon-title :last-child {
                    padding-left: 0;
                }
                :is(#bd-plugin-store-tab, #bd-theme-store-tab) .bd-addon-title :first-child {
                    pointer-events: none;
                    padding-right: 1ch;
                }
                :is(#bd-plugin-store-tab, #bd-theme-store-tab) .bd-addon-title > :not(span) {
                    display: none;
                }
            `);

            Patcher.before(AdvancedScrollerNone, "render", (that, [props]) => {
                const index = props.children.findIndex((child) => React.isValidElement(child) ? topSectionFilter(child.type) : false);

                if (~index) {
                    let newType = map.get(props.children[index].type);
                    if (!newType) {
                        const type = props.children[index].type;

                        newType = (props) => {
                            const result = type(props);

                            const index = result.props.children.findIndex(m => dmsFilter(m?.type));
                            
                            if (~index) {
                                result.props.children.splice(index, 0, h(DashboardButton));
                            }
                            else {
                                result.props.children.unshift(index, 0, h(DashboardButton));
                            }

                            return result;
                        }
                        
                        map.set(type, newType);
                        map.set(newType, newType);
                    }
                    
                    props.children[index].type = newType;
                }
                else {
                    // Fallback
                    props.children.unshift(h(DashboardButton));
                }
            });
        });
    });

    iife(() => {
        onStart(() => {
            CSS.addStyle(`
                h3.${Webpack.getByKeys("membersGroup").membersGroup}:has(svg) {
                    & ~ div:not([class]) {display: none}

                    display: none;
                }
            `);
        });
    });

    iife(() => {
        // https://github.com/GooseMod/OpenAsar/blob/e88eebf440866a06f3eca3b4fe2a8cc07818ee61/src/mainWindow.js#L98

        onStart(() => {
            const post = typeof scheduler === "object" ? scheduler.postTask.bind(scheduler) : window.queueMicrotask;

            Patcher.instead(Element.prototype, "removeChild", (that, args, original) => {
                if (typeof args[0].className === "string" && (args[0].className.indexOf("activity") !== -1)) {
                    post(() => original.apply(that, args));

                    return;
                }

                return original.apply(that, args);
            });
        })
    });

    function experimentPlugin(experimentId, bucket) {
        let experimentBucket;
        onStart(() => {
            if (!experimentPlugin._once) {
                experimentPlugin._once = true;

                const node = Object.values(FluxDispatcher._actionHandlers._dependencyGraph.nodes).find(m => m.name === "ExperimentStore");

                Patcher.instead(node.actionHandler, "OVERLAY_INITIALIZE", (that, args, original) => {
                    original({
                        user: { flags: 1 },
                        serializedExperimentStore: Webpack.Stores.ExperimentStore.getSerializedState()
                    });
                });

                node.actionHandler.OVERLAY_INITIALIZE();
            }

            experimentBucket = Webpack.Stores.ExperimentStore.getUserExperimentBucket(experimentId);

            FluxDispatcher.dispatch({
                type: "EXPERIMENT_OVERRIDE_BUCKET",
                experimentId,
                experimentBucket: bucket
            });
        });

        onStop(() => {
            experimentPlugin._once = false;

            FluxDispatcher.dispatch({
                type: "EXPERIMENT_OVERRIDE_BUCKET",
                experimentId,
                experimentBucket
            });
        });
    }

    if (!window.console.$_doggy) {
        window.console.$_doggy = true;

        const ctx = typeof console.context === "function" && console.context();

        window.console = new Proxy(window.console, {
            get(target, key) {
                let ret = ctx?.[key] || Reflect.get(...arguments);

                if (typeof ret === "function") {
                    if ("__REACT_DEVTOOLS_ORIGINAL_METHOD__" in ret) ret = ret.__REACT_DEVTOOLS_ORIGINAL_METHOD__;
                }

                return ret;
            }
        });
    } 

    // experimentPlugin("2021-09_favorites_server", 3);
    // experimentPlugin("2024-05_desktop_visual_refresh", -1);

    iife(() => {
        const [module, key] = Webpack.getWithKey(Webpack.Filters.byStrings(".PlatformTypes.WINDOWS", "leading:"), {
            target: Webpack.getBySource("data-windows")
        });

        const ToolbarModule = Webpack.getModule(Webpack.Filters.combine(Webpack.Filters.byKeys("Icon", "Divider"), Webpack.Filters.byStrings("section")), { raw: true }).exports;

        const [access, set, onChange] = Utils.createState(window.doggy?.__headerBar);

        onChange((value) => {
            window.doggy.__headerBar = value;
        });

        const VOIDTYPE = () => {};
        onStart(() => {
            Patcher.after(module, key, (that, [props], res) => {
                if (props.windowKey) {
                    return;
                }
                        
                set(() => res.props.children[2]);

                if (BdApi.Plugins.isEnabled("Affinities.plugin.js")) {
                    res.type = VOIDTYPE;
                    return res;
                }

                return null;
            });

            Patcher.before(ToolbarModule, "ZP", (that, [props]) => {
                const children = [];
                const value = access();

                const isOk = React.isValidElement(value) && Array.isArray(value.props.children);
                let index = -1;
                if (isOk) {
                    index = value.props.children.findIndex((child) => React.isValidElement(child) && "windowKey" in child.props);
                }

                if (index !== -1) {
                    const before = value.props.children.slice(0, index);
                    const after = value.props.children.slice(index);

                    props.toolbar = [
                        props.toolbar,
                        before,
                        children,
                        after
                    ];
                }
                else {
                    props.toolbar = [
                        props.toolbar,
                        children,
                        value
                    ];
                }

                props.toolbar.props = {
                    children
                };
            });

            CSS.addStyle(
                `    
.visual-refresh .${Webpack.getByKeys("base", "sidebar").base} {
    display: grid;
    grid-template-columns: [start] min-content [guildsEnd] min-content [channelsEnd] 1fr [end];
    grid-template-rows: [titleBarEnd] min-content [noticeEnd] 1fr [end];
    grid-template-areas:
        "guildsList notice notice"
        "guildsList channelsList page"
}

body:not(.bd-frame) section.title_f75fb0 {
    -webkit-app-region: drag;
}`
            );
        });
    });

    iife(() => {
        const Messages = Webpack.getByStrings("SUMMARIES_UNREAD_BAR_VIEWED,{num_unread_summaries:", { defaultExport: false });

        let MessageType = window.doggy?.__MessageType;
        onStart(() => {
            function patch() {
                window.doggy.__MessageType = MessageType;

                Patcher.after(MessageType, "type", (that, [props], res) => {
                    if (!props.__db) return;

                    const li = Utils.findInReactTree(res, m => m?.type === "li");

                    li.props["data-group-end"] = props.__db.last;
                    li.props["data-group-start"] = props.__db.first;
                    li.props.className = `messageListItem ${li.props.className}`;                    

                    if (typeof props.message?.author?.id === "string") {
                        li.props["data-group-author-id"] = props.message.author.id;
                        li.props["data-group-is-author"] = props.message.author.id === Webpack.Stores.UserStore.getCurrentUser().id;
                    }

                    li.props["data-message-is-reply"] = props.message.messageReference?.type === 0;
                    li.props["data-message-is-forward"] = props.message.messageReference?.type === 1;

                    li.props["data-message-type"] = props.message.type;
                });
            }

            if (typeof MessageType === "object") {
                patch();
            }

            Patcher.after(Messages, "Z", (that, [props], res) => {
                if (!Array.isArray(res.channelStreamMarkup)) return;

                const channelStreamMarkup = res.channelStreamMarkup.filter((ret) => React.isValidElement(ret) && typeof ret.props.groupId === "string");
                if (!channelStreamMarkup.length) return;

                for (let index = 0; index < channelStreamMarkup.length; index++) {
                    const element = channelStreamMarkup[index];
                    const next = channelStreamMarkup[index + 1];
                    const pre = channelStreamMarkup[index - 1];

                    let first = true;
                    if (typeof pre === "object") {
                        first = pre.props.groupId !== element.props.groupId;
                    }

                    let last = false;
                    if (!next) last = true;
                    else if (element.props.groupId !== next.props.groupId) last = true;

                    element.props.__db = { last, first };
                }

                if (typeof MessageType === "undefined") {
                    MessageType = channelStreamMarkup[0].type;
                    patch();
                }
            });

            CSS.addStyle(`
                .messageListItem::before {
                    content: "";
                    background: var(--bg-overlay-app-frame, var(--background-surface-high));
                    position: absolute;
                    left: 64px;
                    right: 20px;
                    top: 0;
                    bottom: 0;
                }

                .messageListItem img + h3 {
                    height: 40px;
                    place-content: center;
                }

                .messageListItem[data-group-start="true"]::before {
                    top: 36px;
                    border-top-left-radius: 6px;
                    border-top-right-radius: 6px;
                }

                .messageListItem[data-group-start="true"][data-message-is-reply="true"]::before {
                    top: 62px;
                }

                .messageListItem[data-message-start="7"]::before {
                    top: 0px;
                }

                .messageListItem[data-group-end="true"]::before {
                    bottom: -4px;
                    border-bottom-left-radius: 6px;
                    border-bottom-right-radius: 6px;
                }

                .messageListItem > div[aria-roledescription="Message"] {
                    background: none !important;
                }

                .isHeader__040f0:not(.isReply__040f0) {
                    top: 0;
                }

                .altText__0f481 {
                    display: none;
                }

                .welcomeCTA_f5d1e2 {
                    display: none;
                }
            `)
        });
    });

    iife(() => {
        return;
        
        const header = BdApi.Webpack.getModule(m => String(m.type).includes("data-has-banner"));

        onStart(() => {
            Patcher.after(header, "type", (that, props, res) => {
                return React.cloneElement(res, {
                    children: e => {
                        const ret = res.props.children(e);

                        const header = Utils.findInReactTree(ret, r => r?.type === "header");
                        if (header) {
                            header.props.children.unshift(
                                h("div", {
                                    className: "db-sidebar-collapse",
                                    onClick: (e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        
                                        document.body.toggleAttribute("data-sidebar-collapsed");
                                    },
                                    children: [
                                        h("svg", {
                                            width: "18px",
                                            height: "18px",
                                            fill: "none",
                                            viewBox: "0 0 24 24",
                                            children: h("path", {
                                                d: "M17.3 18.7a1 1 0 0 0 1.4-1.4L13.42 12l5.3-5.3a1 1 0 0 0-1.42-1.4L12 10.58l-5.3-5.3a1 1 0 0 0-1.4 1.42L10.58 12l-5.3 5.3a1 1 0 1 0 1.42 1.4L12 13.42l5.3 5.3Z",
                                                fill: "currentColor"
                                            })
                                        }),
                                    ]
                                })
                            );
                        }
                        

                        return ret;
                    }
                })
            });

            CSS.addStyle(`
                .db-sidebar-collapse {
                    color: var(--interactive-normal);
                    display: flex;
                    padding: 2px;
                    border-radius: 3px;
                    margin-right: 8px;
                }
                .db-sidebar-collapse:hover {
                    background: var(--background-modifier-hover);
                    color: var(--interactive-hover);
                }
                .db-sidebar-collapse:active {
                    background: var(--background-modifier-active);
                    color: var(--interactive-active);
                }

                body[data-sidebar-collapsed] {
                    --custom-guild-sidebar-width: var(--custom-guild-list-width) !important;
                }
                body:not([data-sidebar-collapsed]) {
                    --custom-guild-sidebar-width: calc(var(--custom-guild-list-width) + 240px) !important;
                }

                div[class^="sidebarList_"] + div[class^="sidebarResizeHandle_"] {
                    display: none;
                }

                [data-sidebar-collapsed] div[class^=avatarWrapper_] + div[class^=buttons_] {
                    display: none;
                }
            `)
        });
    });

    iife(() => {
        const [module, key] = Webpack.getWithKey(Filters.byStrings(".roleStyle);return(", "{roleStyle:"), {
            target: Webpack.getBySource(".roleStyle);return(", "{roleStyle:", { searchDefault: false })
        });

        const shouldAnimate = (existing) => {
            const alwaysAnimate = Storage.get("always-animate");

            if (typeof alwaysAnimate["role-gradient"] === "boolean") {
                if (alwaysAnimate["role-gradient"]) return true;
                return existing;
            }

            return true;
        }

        onStart(() => {
            Patcher.before(module, key, (that, [props]) => {
                props.animateRoleGradient = shouldAnimate(props.animateRoleGradient);
            });

            Patcher.after(Webpack.getByStrings(".zalgo]:", ".compact]:", { defaultExport: false }), "Z", (that, args, res) => {
                res.props.value.animate = shouldAnimate(res.props.value.animate);
            });
        });
    });

    var amdRequire;(function() {
        const commonjs = window.require;
        AMDLoader.init();
        amdRequire = window.require;
        window.require = commonjs;
    })();

    iife(() => {
        return;
        const {promise, resolve} = Promise.withResolvers();

        if (typeof window.monaco === "object") resolve(window.monaco);
        else amdRequire(["vs/editor/editor.main"], resolve);

        const SimpleMarkdownWrapper = Webpack.getByKeys("parse", "defaultRules", "parseTopic");

        class MonacoEditor extends Component {
            constructor(props) {
                super(props);
            }

            ref = createRef();
            state = { loaded: false };

            componentDidMount() {
                promise.then((m) => this.onResolve(m));

                this.onStop = onStop(() => {
                    this.setState({ disabled: true });
                });
            }
            componentWillUnmount() {
                this.onResolve = () => {};
                this.editor?.dispose();
                this.onStop?.();
            }

            onResolve(monaco) {
                this.setState({ loaded: true });
                
                let lang = this.props.lang.toLowerCase();
                switch (lang) {
                    case "js":
                    case "jsx":
                        lang = "javascript";
                        break;
                    case "tx":
                    case "tsx":
                        lang = "typescript";
                        break;
                    case "py":
                        lang = "python";
                        break;
                }
                
                this.editor = monaco.editor.create(this.ref.current, {
                    readOnly: true,
                    language: lang,
                    value: this.props.content,
                    theme: "vs-dark",
                    automaticLayout: true
                });

                // autoresize
                const resize = () => {
                    const height = this.editor.getContentHeight();                    
                    this.ref.current.style.height = `calc(${Math.min(Math.max(height, 15 * 3), 400)}px + 1rem)`;
                    this.editor.layout();
                };

                resize();
            }

            render() {
                if (this.state.disabled) return this.props.children;
                return [
                    h("div", {ref: this.ref, style: {height: "100%", overflow: "hidden", position: "relative", borderRadius: 6, isolation: "isolate"}}),
                    !this.state.loaded && this.props.children
                ];
            }
        }

        onStart(() => {
            Patcher.after(SimpleMarkdownWrapper.defaultRules.codeBlock, "react", (instance, [props, _, {key}], children) => {
                return (
                    h(MonacoEditor, {key, ...props, children})
                )
            });
        });
    });

    iife(() => {
        const ModuleActions = Webpack.getMangled("onCloseRequest:null!=", {
            openModal: Filters.byStrings("onCloseRequest:null!="),
            closeModal: Filters.byStrings(".setState", ".getState()[")
        });

        const filter = Filters.byRegex(/...(props|.{1,3}),\s*addon:\s*this,\s*install:/);

        onStart(() => {
            Patcher.instead(ModuleActions, "openModal", (that, args, original) => {
                if (filter(args[0])) {
                    // TODO: Make the install modal be more immersive
                    // Maybe push a layer???

                    console.log(args);
                }
                
                return Reflect.apply(original, that, args);
            });
        });
    });

    iife(() => {
        function forceUpdateApp() {
            const appMount = document.getElementById("app-mount");

            const reactContainerKey = Object.keys(appMount).find(m => m.startsWith("__reactContainer$"));

            let container = appMount[reactContainerKey];

            while (!container.stateNode?.isReactComponent) {
                container = container.child;
            }

            const undo = Patcher.instead(container.stateNode, "render", () => null);

            container.stateNode.forceUpdate(() => {
                undo();
                container.stateNode.forceUpdate();
            });
        }

        onStart(forceUpdateApp);
        onStop(forceUpdateApp);
    });

    iife(() => {
        window.doggy.killUpdater?.();

        const [abort, getSignal] = Utils.createAbort();
        window.doggy.killUpdater = () => abort();

        onStart(async () => {
            const signal = getSignal();

            const request = await fetch("https://raw.githubusercontent.com/doggybootsy/BDPlugins/refs/heads/main/0doggy/0doggy.plugin.js", { signal });
            const text = await request.text();

            if (signal.aborted) ret;

            const match = text.match(/@version (\d+\.\d+\.\d+)/);
            
            let hasUpdate = false;
            if (!match) hasUpdate = true;
            else hasUpdate = Utils.semverCompare(meta.version, match[1]) === 1;

            if (hasUpdate) {
                UI.showNotification({
                    id: "doggy::updater",
                    title: "Update Ready",
                    content: "0doggy.plugin.js has a update ready",
                    type: "info",
                    actions: [{
                        label: "Update",
                        onClick: () => require("fs").writeFileSync(__filename, text)
                    }],
                })
            }
        });

        onStop(abort);
    });

    iife(() => {
        const MessageQueue = Webpack.getByKeys("enqueue", "logger");

        onStart(() => {
            Patcher.before(MessageQueue, "enqueue", (that, args) => {
                if (!args[0]?.message?.content) return;                

                args[0].message.content = args[0].message.content.replace(
                    /(https?:\/\/)(x|twitter|fxtwitter)(\.com\/\w+\/status\/\d+)/gmi,
                    "$1fxtwitter$3"
                );
            });
        });
    });

    iife(() => {
        const UserProfile = Webpack.getByStrings("switch-accounts", "PRESS_SWITCH_ACCOUNTS", { defaultExport: false });

        onStart(() => {
            CSS.addStyle("#account-panel-user-info :where(.avatar__75742) {\
    left: 12px;\
    top: 57px;}\
#account-panel-user-info .referenceContainer_ab8609 {\
    margin-left: 109px;\
    margin-right: 12px;\
    margin-top: -10px;\
}\
#account-panel-user-info .container_ab8609 {\
    left: 105px;\
    top: calc(var(--custom-user-profile-banner-height) - 7px);\
}\
:root #account-panel-user-info {\
    --custom-user-profile-banner-height: 105px;\
}\
#account-panel svg[width='12'] {width: 14px!important;height: 14px!important; padding: 2px}");
            
            Patcher.after(UserProfile, "Z", (that, [props], res) => {                
                const uap = Storage.use("user-action-profile");

                const header = Utils.findInReactTree(res, r => String(r?.props?.className).startsWith("header_"));
                const menus = Utils.findInReactTree(res, r => String(r?.className).startsWith("menus_"));
                
                const statusPicker = Utils.findInReactTree(menus, m => m?.props?.id === "set-status");
                const accountSwitcher = Utils.findInReactTree(menus, m => m?.props?.id === "switch-accounts");
                const copyUid = Utils.findInReactTree(menus, m => m?.props?.id === "copy-user-id");      

                const menu = h(ContextMenu.Menu, {
                    navId: "account-panel",
                    onClose: props.onClose,
                    children: [
                        (uap["show-user-header"] ?? true) && h(ContextMenu.Item, {
                            render: () => header,
                            id: "user-info"
                        }),
                        h(ContextMenu.Item, {
                            render: () => h("div", { style: { margin: 4 }}),
                            id: "user-spacer"
                        }),
                        uap["mini-status"] ? h(ContextMenu.Item, {
                            ...statusPicker.props,
                            icon: null,
                            label: h("div", {
                                style: {
                                    display: "flex",
                                    gap: 8,
                                    alignItems: "center"
                                },
                                children: [
                                    h(statusPicker.props.icon),
                                    statusPicker.props.label
                                ]
                            }),
                            action: () => BdApi.Utils.findInTree(BdApi.ReactUtils.wrapInHooks(BdApi.Webpack.getByStrings("onCloseProfile:", "trackUserProfileAction:"))({}), r => String(r?.onClick).includes("PRESS_EDIT_CUSTOM_STATUS")).onClick(),
                            children: statusPicker.props.renderSubmenu({closePopout: props.onClose}).props.children
                        }) : [
                            statusPicker.props.renderSubmenu({closePopout: props.onClose}).props.children,
                            h(ContextMenu.Separator)
                        ],
                        h(ContextMenu.Item, {
                            ...accountSwitcher.props,
                            icon: null,
                            label: h("div", {
                                style: {
                                    display: "flex",
                                    gap: 8,
                                    alignItems: "center"
                                },
                                children: [
                                    h(accountSwitcher.props.icon, {size: "sm"}),
                                    accountSwitcher.props.label
                                ]
                            }),
                            action: accountSwitcher.props.onClick,
                            children: accountSwitcher.props.renderSubmenu({closePopout: props.onClose}).props.children
                        }),
                        copyUid && [
                            h(ContextMenu.Separator),
                            h(ContextMenu.Item, {
                                ...copyUid.props, 
                                icon: null,
                                label: h("div", {
                                    style: {
                                        display: "flex",
                                        gap: 8,
                                        alignItems: "center"
                                    },
                                    children: [
                                        h(copyUid.props.icon, {size: "sm"}),
                                        copyUid.props.label
                                    ]
                                }),
                                action: copyUid.props.onClick
                            }),
                        ]
                    ]
                });

                return menu;
            });
        });
    });

    return (function() {
        window.doggy.Storage = Storage;

        window.doggy.Utils = Utils;
        window.doggy.Webpack = Webpack;

        window.doggy.require = require;

        if (window.doggy.setSettings) {
            window.doggy.setSettings(Settings);
        }

        class UpdatableSettings extends Component {
            ref = createRef();

            componentDidMount() {
                window.doggy.setSettings = (Settings) => {
                    this.setState({ Settings });

                    UpdatableSettings.prototype.state.Settings = Settings;
                }

                const fiber = Utils.getInternalInstance(this.ref.current);
                
                if (!fiber) return;

                const { memoizedProps } = Utils.findInTree(fiber, (fiber) => fiber?.memoizedProps?.onClose, {
                    walkable: [ "return" ]
                });

                this.onClose = memoizedProps.onClose;
                if (this.close) this.onClose();
            }

            onClose = () => {
                this.close = true;
            }

            componentWillUnmount() {
                delete window.doggy.setSettings;
            }

            render() {
                return h("div", { ref: this.ref }, h(this.state.Settings, { onClose: () => this.onClose() }));
            }
        }

        UpdatableSettings.prototype.state = { Settings };
        
        window.doggy.instance = {
            start() {
                for (const element of onStart._callbacks) {
                    element();
                }
            },
            stop() {
                for (const element of onStop._callbacks) {
                    element();
                }

                DOM.removeStyle();
                Patcher.unpatchAll();
            },
            getSettingsPanel() {
                return h(UpdatableSettings);
            }
        }

        return window.doggy.plugin ??= new Proxy(window.doggy.instance, Object.fromEntries(Reflect.ownKeys(Reflect).map((key) => [ key, (t, ...args) => Reflect[key](window.doggy.instance, ...args) ])));
    })();
}
