/**
 * @name SMS Style Messages
 * @author Doggybootsy
 * @version 1.0.0
 * @description Puts your messages to the right
 */

const { Patcher, DOM } = new BdApi("SMS Style Messages");

const UserStore = BdApi.Webpack.getModule(m => m.getCurrentUser && m.getName);

let currentUserId = UserStore.getCurrentUser().id;
function listener() { currentUserId = UserStore.getCurrentUser().id; };

const safeMessageTypes = [
  0, 18, 19
];

let type;
function patch() {
  Patcher.after(type, "type", (that, [ props ], res) => {
    if (props.message?.author?.id !== currentUserId) return;
    if (!safeMessageTypes.includes(props.message.type)) return;
    const tree = BdApi.Utils.findInTree(res.props, (node) => node?.type === "li");
    if (tree) tree.props["data-is-current-user"] = "";
  });
  forceUpdateMessages();
};

const classes = Object.assign(
  { }, 
  BdApi.Webpack.getModule(m => m.avatar && m.repliedMessage),
  BdApi.Webpack.getModule(m => m.container && m.embedWrapper),
  BdApi.Webpack.getModule(m => m.messageListItem && m.systemMessage),
  BdApi.Webpack.getModule(m => m.blockquoteContainer && m.markup),
  BdApi.Webpack.getModule(m => m.mediaAttachmentsContainer)
);

function getType() {
  if (type) return;
  const node = document.querySelector(`[class^="${classes.messageListItem}"]`);
  if (!node) return;
  const instance = BdApi.ReactUtils.getInternalInstance(node); 
  const { elementType } = instance.return.return;
  type = elementType;
  patch();
};

const css = `li[data-is-current-user] > div {
  padding-left: 48px !important;
  padding-right: 72px !important;
}
li[data-is-current-user] .${classes.avatar} {
  right: 16px;
  left: unset;
}
li[data-is-current-user] .${classes.messageContent} {
  text-align: right;
}
li[data-is-current-user] pre,
li[data-is-current-user] table {
  text-align: left;
}
li[data-is-current-user] .${classes.blockquoteContainer} {
  flex-direction: row-reverse;
}
li[data-is-current-user] .${classes.latin24CompactTimeStamp} {
  left: unset !important;
  right: 0;
  text-align: left !important;
}
li[data-is-current-user] .${classes.container} {
  direction: rtl;
}
li[data-is-current-user] .${classes.container} > :not(.${classes.mediaAttachmentsContainer}):not(.${classes.giftCodeContainer}) {
  direction: ltr;
}
li[data-is-current-user] .${classes.header} {
  display: flex !important;
  justify-content: flex-end;
}
li[data-is-current-user] .${classes.repliedMessage} {
  justify-content: flex-end;
}
li[data-is-current-user] .${classes.repliedMessage}:before {
  right: calc(var(--avatar-size)/2*-1 + var(--gutter)*-1);
  left: 100%;
  margin-left: var(--reply-spacing);
  margin-right: calc(var(--spine-width)*-1/2);
  border-right: var(--spine-width) solid var(--interactive-muted);
  border-left: 0 solid var(--interactive-muted);
  border-top-left-radius: 0;
  border-top-right-radius: 6px;
}
li[data-is-current-user] .${classes.hasThread}:after {
  border-left: none;
  border-right: 2px solid var(--interactive-muted);
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 8px;
  right: 2.2rem !important;
  left: unset !important
}
li[data-is-current-user] .${classes.buttonContainer} {
  top: -1em;
}
li[data-is-current-user] .${classes.automodMessage}:before, 
li[data-is-current-user] .${classes.ephemeral}:before, 
li[data-is-current-user] .${classes.highlighted}:before, 
li[data-is-current-user] .${classes.mentioned}:before, 
li[data-is-current-user] .${classes.replying}:before {
  right: 0;
  left: unset;
}`;

function forceUpdateMessages() {
  const nodes = document.querySelectorAll(`.${classes.messageListItem}`);

  const owners = Array.from(nodes, (node) => BdApi.ReactUtils.getOwnerInstance(node)).filter(m => m);

  for (const owner of new Set(owners)) {
    const { render } = owner;
    // Hopefully this wont kill the chat area when hotswapping
    if (render.toString() === "() => null") continue;
    owner.render = () => null;
    owner.forceUpdate(() => {
      owner.render = render;
      owner.forceUpdate();
    });
  };
};

module.exports = class {
  observer() {
    getType();
  };
  start() {
    if (type) patch();
    else getType();
    UserStore.addChangeListener(listener);
    DOM.addStyle(css);
  };
  stop() {
    UserStore.removeChangeListener(listener);
    Patcher.unpatchAll();
    DOM.removeStyle();
    forceUpdateMessages();
  };
}
