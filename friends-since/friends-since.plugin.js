/**
 * @name FriendsSince
 * @author Doggybootsy
 * @description Shows the date of when and a friend became friends
 * @version 1.0.2
 * @source https://github.com/doggybootsy/BDPlugins/
 */

// @ts-check

/** @type {import("betterdiscord").PluginCallback} */
module.exports = (meta) => {
  /** @type {(name: string, data: any) => void} */
  function log(name, data) {
    data = [data].flat();
  
    console.log(
      `%c[${meta.name}]%c: ${name}`,
      "font-weight: bold;color: purple;",
      "",
      ...data
    );
  }
  
  /** @type {[ (reason?: any) => void, () => AbortSignal ]} */
  const [ abort, getSignal ] = (function() {
    let controller = new AbortController();
  
    /** @type {(reason?: any) => void} */
    function abort(reason) {
      controller.abort(reason);
      controller = new AbortController();
    }
  
    return [ abort, () => controller.signal ];
  })();
  /** @type {<T extends any = any>(strings: string[], options?: import("betterdiscord").BaseSearchOptions) => Promise<T>} */
  function getLazyByStrings(strings, options) {
    return BdApi.Webpack.waitForModule(BdApi.Webpack.Filters.byStrings(...strings), options);
  }
  
  const Components = BdApi.Webpack.getByKeys("Button", "Heading");
  const userProfileUtils = BdApi.Webpack.getByKeys("getCreatedAtDate");
  const RelationshipStore = BdApi.Webpack.getStore("RelationshipStore");
  
  const I18n = BdApi.Webpack.getModule(m => m.Messages && Array.isArray(m._events.locale));
  
  /** @type {(tree: any, searchFilter: (node: any) => boolean) => any} */
  function findInReactTree(tree, searchFilter) {
    return BdApi.Utils.findInTree(tree, searchFilter, {
      walkable: [ "props", "children" ]
    })
  }
  /** @type {(...strings: string[]) => any} */
  function getBySource(...strings) {
    const filter = BdApi.Webpack.Filters.byStrings(...strings);
  
    for (const key in BdApi.Webpack.modules) {
      if (Object.hasOwnProperty.call(BdApi.Webpack.modules, key)) {
        const element = BdApi.Webpack.modules[key];
        if (filter(element)) return BdApi.Webpack.getModule((exports, module, id) => id === key, { searchExports: false });
      }
    }
  }
  
  function getMessage() {
    switch (I18n.getLocale()) {
      default: return "Friends Since";
    }
  }
  
  // Can these all be lazy? idk just incase
  /** @type {Promise<{ default: (props: { user: { id: string } }) => React.ReactElement }>} */
  const UserPopout = getLazyByStrings([ ",showCopiableUsername:", ",showBorder:" ], { defaultExport: false });
  const UserModal = getLazyByStrings([ ",scrollToConnections:", ".userInfoSection,userId:" ], { defaultExport: false });
  const Section = BdApi.React.lazy(() => getLazyByStrings([ ",lastSection:", ".lastSection]:" ], { defaultExport: false }));

  class FriendsSince extends BdApi.React.Component {
    constructor(props) {
      super(props);

      this.listener = this.listener.bind(this);
      this.listener();
    }

    state = { hasError: false };
  
    /** @type {string | null} */
    since = null;

    listener() {
      const old = this.since;

      const since = RelationshipStore.getSince(this.props.userId);
  
      if (since && RelationshipStore.isFriend(this.props.userId)) this.since = userProfileUtils.getCreatedAtDate(since, I18n.getLocale());
      else this.since = null;

      if (old !== this.since) this.forceUpdate();
    }

    componentWillUnmount() {
      RelationshipStore.addChangeListener(this.listener);
    }
    componentDidMount() {
      RelationshipStore.removeChangeListener(this.listener);
    }

    componentDidCatch() {
      this.setState({
        hasError: true
      });
    }

    render() {
      if (this.state.hasError) return BdApi.React.createElement("div", {}, "React Error");
      if (this.since === null) return null;

      return BdApi.React.createElement("div", {
        children: [
          BdApi.React.createElement(Components.Heading, {
            variant: "eyebrow",
            className: this.props.headingClassName,
            children: getMessage()
          }),
          BdApi.React.createElement(Components.Text, {
            variant: "text-sm/normal",
            className: this.props.textClassName,
            children: this.since
          })
        ]
      })
    }
  }
  
  /** @type {Record<"title" | "body", string>} */
  let sectionClasses;
  /** @type {(props: { userId: string }) => React.ReactNode} */
  function FriendsSinceSection({ userId }) {  
    sectionClasses ??= BdApi.Webpack.getByKeys("body", "title", "clydeMoreInfo");
    if (!sectionClasses) return null;
  
    return BdApi.React.createElement(Section, {
      children: BdApi.React.createElement(FriendsSince, {
        userId,
        headingClassName: sectionClasses.title,
        textClassName: sectionClasses.body
      })
    });
  }
  
  const filterForPopout = BdApi.Webpack.Filters.byStrings(",guildId:", ".title", ".body");
  async function patchPopout() {
    const signal = getSignal();
    const module = await UserPopout;
    if (signal.aborted) return;

    BdApi.Patcher.after("friends-since", module, "default", (that, [ props ], res) => {
      let index = -1;
      const node = findInReactTree(res, (node) => {
        if (!BdApi.React.isValidElement(node)) return false;
        if (!Array.isArray(node.props.children)) return false;

        index = node.props.children.findIndex((child) => BdApi.React.isValidElement(child) && filterForPopout(child.type));

        if (~index) return true;
        return false;
      });

      if (!node) return;

      node.props.children.splice(index + 1, 0, BdApi.React.createElement(FriendsSinceSection, { userId: props.user.id }));
    });
  }
  
  const filterForModal = BdApi.Webpack.Filters.byStrings(".default.Messages.USER_PROFILE_MEMBER_SINCE");
  async function patchModal() {
    const signal = getSignal();
    const module = await UserModal;
    if (signal.aborted) return;
    
    BdApi.Patcher.after("friends-since", module, "default", (that, [ props ], res) => {
      /** @type {React.ReactElement[]} */
      const children = res?.props?.children?.[0]?.props?.children;
      if (!children) return;
  
      const index = children.findIndex(m => BdApi.React.isValidElement(m) && filterForModal(m.type));
      if (!~index) return;
  
      children.splice(
        index + 1, 
        0, 
        BdApi.React.createElement(
          FriendsSince, 
          children[index].props
        )
      );
    });
  }
  
  /** @type {{ default: (props: { user: { id: string } }) => React.ReactElement }} */
  const SidePanel = getBySource(".userProfileInnerThemedNonPremium");
  
  async function patchSidePanel() {
    BdApi.Patcher.after("friends-since", SidePanel, "default", (that, [ props ], res) => {
      /** @type {any} */
      let tree;
      /** @type {number} */
      let index = -1;
  
      findInReactTree(res.props, (node) => {
        if (!Array.isArray(node?.children)) return false;
        
        for (const element of node.children) {
          if (!BdApi.React.isValidElement(element)) continue;
          if (element.type !== BdApi.React.Fragment) continue;
  
          const $index = element.props.children.findIndex(m => BdApi.React.isValidElement(m) && typeof m.props.userId === "string" && m.type.toString().includes(",textClassName:"));
          if (!~$index) continue;
  
          tree = element;
          index = $index;
  
          return true;
        }
  
        return false;
      });
  
      if (!tree) return;
  
      tree.props.children.splice(index + 1, 0, BdApi.React.createElement(FriendsSinceSection, { userId: props.user.id }));
    });
  }

  return {
    start() {
      const then = performance.now();
  
      patchPopout();
      patchModal();
      patchSidePanel();
  
      log("Started", [ "|", `Took ${performance.now() - then}ms to start` ]);
    }, 
    stop() {
      log("Stopped", [ ]);
  
      abort();
      BdApi.Patcher.unpatchAll("friends-since");
    }
  };
};
