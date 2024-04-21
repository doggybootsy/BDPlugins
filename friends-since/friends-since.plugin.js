/**
 * @name FriendsSince
 * @author Doggybootsy
 * @description Shows the date of when and a friend became friends
 * @version 1.0.0
 * @source https://github.com/doggybootsy/BDPlugins/
 */

/** @type {[ (reason?: any) => void, () => AbortSignal ]} */
const [ abort, getSignal ] = (function() {
  let controller = new AbortController();

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
const Flux = BdApi.Webpack.getByKeys("useStateFromStores", "Store");
const userProfileUtils = BdApi.Webpack.getByKeys("getCreatedAtDate");
const RelationshipStore = BdApi.Webpack.getStore("RelationshipStore");

const I18n = BdApi.Webpack.getModule(m => m.Messages && Array.isArray(m._events.locale));

function getMessage() {
  switch (I18n.getLocale()) {
    default:
      return "Friends Since"
  }
}
// Can these all be lazy? idk just incase
const UserPopout = getLazyByStrings([ ",showCopiableUsername:", ",showBorder:" ], { defaultExport: false });
const UserModal = getLazyByStrings([ ",scrollToConnections:", ".userInfoSection,userId:" ], { defaultExport: false });
const Section = BdApi.React.lazy(() => getLazyByStrings([ ",lastSection:", ".lastSection]:" ], { defaultExport: false }));

let classes;
function FriendsSince({ userId, headingClassName, textClassName }) {
  classes ??= BdApi.Webpack.getByKeys("memberSinceWrapper", "discordIcon");

  const since = Flux.useStateFromStores([ RelationshipStore ], () => {
    const since = RelationshipStore.getSince(userId);

    if (since && RelationshipStore.isFriend(userId)) return userProfileUtils.getCreatedAtDate(since);
    return null;
  });

  if (!since) return null;

  return BdApi.React.createElement(BdApi.React.Fragment, {
    children: [
      BdApi.React.createElement(Components.Heading, {
        variant: "eyebrow",
        className: headingClassName,
        children: getMessage()
      }),
      BdApi.React.createElement("div", {
        className: classes.memberSinceContainer,
        children: BdApi.React.createElement(Components.Text, {
          variant: "text-sm/normal",
          className: textClassName,
          children: since
        })
      })
    ]
  })
}

let sectionClasses;
function FriendsSinceSection({ userId }) {
  sectionClasses ??= BdApi.Webpack.getByKeys("body", "title", "clydeMoreInfo");

  return BdApi.React.createElement(Section, {
    children: BdApi.React.createElement(FriendsSince, {
      userId,
      headingClassName: sectionClasses.title,
      textClassName: sectionClasses.body
    })
  });
}

const filterForPopout = BdApi.Webpack.Filters.byStrings(",guildMember:", ".title", ".body");
async function patchPopout() {
  const signal = getSignal();
  const module = await UserPopout;
  if (signal.aborted) return;
  
  BdApi.Patcher.after("friends-since", module, "default", (that, [ props ], res) => {
    const children = res?.props?.children?.[1]?.props?.children?.[2]?.props?.children;
    if (!children) return;

    const index = children.findIndex(m => filterForPopout(m?.type));
    if (!~index) return;

    children.splice(index + 1, 0, BdApi.React.createElement(FriendsSinceSection, { userId: props.user.id }));
  });
}

const filterForModal = BdApi.Webpack.Filters.byStrings(".default.Messages.USER_PROFILE_MEMBER_SINCE");
async function patchModal() {
  const signal = getSignal();
  const module = await UserModal;
  if (signal.aborted) return;
  
  BdApi.Patcher.after("friends-since", module, "default", (that, [ props ], res) => {
    const children = res?.props?.children?.[0]?.props?.children;
    if (!children) return;

    const index = children.findIndex(m => filterForModal(m?.type));
    if (!~index) return;

    children.splice(index + 1, 0, BdApi.React.createElement(FriendsSince, children[index].props));
  });
}

function onStart() {
  patchPopout();
  patchModal();
}
function onStop() {
  abort();
  BdApi.Patcher.unpatchAll("friends-since");
}

module.exports = () => {
  return { start: onStart, stop: onStop };
}
