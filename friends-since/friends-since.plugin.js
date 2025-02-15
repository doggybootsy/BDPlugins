/**
 * @name FriendsSince
 * @author Doggybootsy
 * @description Shows the date of when and a friend became friends
 * @version 1.0.6
 * @source https://github.com/doggybootsy/BDPlugins/
 */

// @ts-check

/** @type {import("betterdiscord").PluginCallback} */
module.exports = (meta) => {
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

  let Text = BdApi.Webpack.getBySource("data-text-variant", "=\"div\",selectable:", { defaultExport: false });
  if (!Text.render) Text = Object.values(Text)[0];

  const RelationshipStore = BdApi.Webpack.getStore("RelationshipStore");
  
  const {intl} = BdApi.Webpack.getModule(m => m.intl);
  
  function getMessage() {
    switch (intl.currentLocale) {
      default: return "Friends Since";
    }
  }

  let Section;
  
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
      try {
        const old = this.since;
  
        const since = RelationshipStore.getSince(this.props.userId);
    
        if (since && RelationshipStore.isFriend(this.props.userId)) {
          const date = new Date(since);
          this.since = !(date instanceof Date) || isNaN(date.getTime()) ? null : date.toLocaleDateString(intl.currentLocale, {
            month: "short",
            day: "numeric",
            year: "numeric"
          });
        }
        else this.since = null;
  
        if (old !== this.since) this.forceUpdate();
      } catch (error) {
        console.log(error);
        
        this.setState({ hasError: true });
      }
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

    static getDerivedStateFromError(error) {
      return { hasError: true };
    }

    render() {
      if (this.state.hasError) return BdApi.React.createElement("div", {}, "React Error");
      if (this.since === null) return null;

      return BdApi.React.createElement(Section, {
        heading: getMessage(),
        headingColor: this.props.sidePanel ? "header-primary" : undefined,
        children: [
          BdApi.React.createElement(Text, {
            variant: "text-sm/normal",
            children: this.since
          })
        ]
      })
    }
  }

  /** @type {{ Z: Function, ZP: Function, default: React.FunctionComponent<{ user: { id: string } }> }} */
  let UserModalContent;
  /**
   * @param {AbortSignal} signal 
   */
  async function patchUserModal(signal) {
    if (!UserModalContent) {
      UserModalContent = await BdApi.Webpack.waitForModule(BdApi.Webpack.Filters.byStrings("3fe7U1"), { defaultExport: false });
      
      if (!("default" in UserModalContent)) {
        Object.defineProperty(UserModalContent, "default", {
          get() {
            return UserModalContent.Z || UserModalContent.ZP;
          },
          set(value) {
            if ("Z" in UserModalContent) UserModalContent.Z = value;
            if ("ZP" in UserModalContent) UserModalContent.ZP = value;
          }
        });
      };
    }

    if (signal.aborted) return;

    BdApi.Patcher.after("friends-since", UserModalContent, "default", (instance, [ props ], res) => {
      if (!BdApi.React.isValidElement(res)) return;      

      const children = res.props.children;
      const index = children.findIndex((value) => BdApi.React.isValidElement(value) && "heading" in value.props && BdApi.React.isValidElement(value.props.children) && "tooltipDelay" in value.props.children.props);

      if (~index) {
        Section = children[index].type;        
        
        children.splice(
          index + 1, 0, 
          BdApi.React.createElement(FriendsSince, {
            userId: props.user.id
          })
        );
      }
    });
  }

  /** @type {{ Z: Function, ZP: Function, default: React.FunctionComponent<{ user: { id: string } }> }} */
  let UserSidePanel;
  /**
   * @param {AbortSignal} signal 
   */
  async function patchSidePanel(signal) {
    if (!UserSidePanel) {
      UserSidePanel = await BdApi.Webpack.waitForModule(BdApi.Webpack.Filters.byStrings("61W33d", "UserProfilePanelBody"), { defaultExport: false });

      if (!("default" in UserSidePanel)) {
        Object.defineProperty(UserSidePanel, "default", {
          get() {
            return UserSidePanel.Z || UserSidePanel.ZP;
          },
          set(value) {
            if ("Z" in UserSidePanel) UserSidePanel.Z = value;
            if ("ZP" in UserSidePanel) UserSidePanel.ZP = value;
          }
        });
      };
    }

    if (signal.aborted) return;

    BdApi.Patcher.after("friends-since", UserSidePanel, "default", (instance, [ props, abc ], res) => {
      if (!BdApi.React.isValidElement(res)) return;

      const background = res.props.children.find((value) => String(value?.props?.className).includes("overlay_"));
      if (!background) return;
      
      const index = background.props.children.findIndex((value) => BdApi.React.isValidElement(value) && "heading" in value.props);

      if (~index) {        
        Section = background.props.children[index].type;
        
        background.props.children.push(
          // index + 1, 0, 
          BdApi.React.createElement(FriendsSince, {
            userId: props.user.id,
            sidePanel: true
          })
        );
      }
    });
  }

  return {
    start() {
      const signal = getSignal();
      patchUserModal(signal);
      patchSidePanel(signal);
    }, 
    stop() {
      abort();
      BdApi.Patcher.unpatchAll("friends-since");
    }
  };
};
