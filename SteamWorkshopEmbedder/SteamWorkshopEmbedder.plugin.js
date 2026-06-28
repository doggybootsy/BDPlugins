/**
 * @name Steam Workshop Embed
 * @description Embed steam workshop items
 * @version 0.0.2
 * @author doggybootsy
 */

/**
 * @typedef {{
 * 		title: string,
 * 		author: {
 * 			name: string,
 * 			url: string,
 * 			avatar: string
 * 		},
 * 		color: number,
 * 		description: string,
 * 		subscriptions: number,
 * 		favorited: number,
 * 		followers: number,
 * 		tags: string[],
 * 		time: {
 * 			updated: number,
 * 			created: number
 * 		},
 * 		thumbnail: {
 * 			content_type: string,
 * 			width: number,
 * 			height: number,
 * 			placeholder: string,
 * 			url: string
 * 		},
 * 		id: string
 * }} WorkshopItem
 */

/**
 * @typedef {import("./bdapi")} BdApi
 */

function getWorkshopId(url) {
	if (
		url.hostname === "steamcommunity.com" &&
		url.pathname === "/sharedfiles/filedetails/"
	) {
		const id = url.searchParams.get("id");

		if (id && /^\d+$/.test(id)) {
			return id;
		}
	}

	if (
		url.protocol === "steam:" &&
		url.pathname.startsWith("url/CommunityFilePage/")
	) {
		const id = url.pathname.split("/").pop();

		if (id && /^\d+$/.test(id)) {
			return id;
		}
	}

	return null;
}

/**
 * 
 * @param {string} content 
 * @returns {string[]}
 */
function extrackWorkshopCodes(content) {
	/** @type {string[]} */
	const codes = [];

	let inInlineCode = false;
	let inCodeBlock = false;
	let text = "";

	for (let i = 0; i < content.length; i++) {
		if (content.startsWith("```", i)) {
			if (!inInlineCode) {
				if (!inCodeBlock) {
					extract(text);
					text = "";
				}

				inCodeBlock = !inCodeBlock;
				i += 2;
				continue;
			}
		}

		if (!inCodeBlock && content[i] === "`") {
			if (!inInlineCode) {
				extract(text);
				text = "";
			}

			inInlineCode = !inInlineCode;
			continue;
		}

		if (!inInlineCode && !inCodeBlock) {
			text += content[i];
		}
	}

	extract(text);

	return codes;

	function extract(text) {
		for (const match of text.matchAll(/(?<!<)https?:\/\/[^\s<>()]+/g)) {
			try {
				const id = getWorkshopId(new URL(match[0]));

				if (id) codes.push(id);
			} catch {}
		}

		for (const match of text.matchAll(/<steam:\/\/[^>\s]+>/g)) {
			try {
				const id = getWorkshopId(new URL(match[0].slice(1, -1)));

				if (id) codes.push(id);
			} catch {}
		}
	}
}

const MAX_EMBEDS = 10;

module.exports = (meta) => {
	const {Webpack, Patcher, Data, Logger} = new window.BdApi(meta.name);

	const {i18n, ChannelMessages, EmbedHandler} = Webpack.getBulkKeyed({
		i18n: {
			filter: Webpack.Filters.byKeys("intl")
		},
		ChannelMessages: {
			filter: Webpack.Filters.byKeys("_channelMessages")
		},
		EmbedHandler: {
			filter: Webpack.Filters.bySource("sketchfab"),
			map: {
				handle: Webpack.Filters.byStrings("embed_")
			}
		}
	});	

	/**
	 * 
	 * @param {WorkshopItem} workshopItem 
	 * @returns 
	 */
	function convertToDiscordEmbed(workshopItem) {
		return {
			author: {
				name: workshopItem.author.name,
				url: workshopItem.author.url,
				icon_url: workshopItem.author.avatar,
				proxy_icon_url: workshopItem.author.avatar
			},
			color: workshopItem.color,
			content_scan_version: 4,
			description: workshopItem.description,
			fields: [
				{
					inline: true,
					name: "Subscriptions",
					value: workshopItem.subscriptions.toString(),
				},
				{
					inline: true,
					name: "Favorited",
					value: workshopItem.favorited.toString(),
				},
				{
					inline: true,
					name: "Followers",
					value: workshopItem.followers.toString(),
				},
				{
					inline: false,
					name: "Tags",
					value: i18n.intl.data.formatList(workshopItem.tags)
				}
			],
			footer: {
				text: "Last Updated"
			},
			thumbnail: {
				...workshopItem.thumbnail,
				proxy_url: workshopItem.thumbnail.url,
				flags: 0
			},
			timestamp: new Date(workshopItem.time.updated * 1000),
			title: workshopItem.title,
			type: "rich",
			url: "https://steamcommunity.com/sharedfiles/filedetails/?id=" + workshopItem.id
		}
	}

	const workshop = {
		_cachePromises: {},
		_cacheSync: {},
		async fetch(code) {
			const res = await BdApi.Net.fetch(`https://doggybootsy.com/api/v1/plugins/SteamWorkshopEmbedder/${code}`);			

			return Object.assign(workshop._cacheSync[code] = convertToDiscordEmbed(await res.json()), {
				__SteamWorkshopEmbedder: code
			});
		},
		getSync(code) {
			return workshop._cacheSync[code];
		},
		getOrFetch(code) {
			return workshop._cachePromises[code] ??= workshop.fetch(code)
				.catch((e) => {
					Logger.error("Failed to fetch " + code, e);

					setTimeout(() => {
						delete workshop._cachePromises[code]
					}, 1000);
					throw e;
				});
		}
	}
	
	async function handleMessage(message, codes, isRaw) {
		await Promise.allSettled(codes.map(workshop.getOrFetch));

		const workshopEmbeds = codes.map(workshop.getSync).filter(x => x);

		if (!workshopEmbeds.length || message.embeds.length === MAX_EMBEDS) return;		

		if (isRaw) {
			const embeds = [...message.embeds];

			for (let key = 0; key < workshopEmbeds.length; key++) {
				if (embeds.findIndex(x => x.__SteamWorkshopEmbedder === workshopEmbeds[key].__SteamWorkshopEmbedder) !== -1) continue;
				if (embeds.length < MAX_EMBEDS) embeds.push(workshopEmbeds[key]);
			}

			if (embeds.length === message.embeds.length) return;

			Webpack.Stores.UserStore._dispatcher.dispatch({
				type: "MESSAGE_UPDATE",
				guildId: message.guild_id,
				message: {
					...message,
					embeds
				}
			});

			return;
		}

		const dWorkshopEmbeds = workshopEmbeds.map(x => EmbedHandler.handle(message.channel_id, message.id, x));

		for (let key = 0; key < dWorkshopEmbeds.length; key++) {
			if (message.embeds.findIndex(x => x.__SteamWorkshopEmbedder === dWorkshopEmbeds[key].__SteamWorkshopEmbedder) !== -1) continue;
			if (message.embeds.length < MAX_EMBEDS) message.embeds.push(dWorkshopEmbeds[key]);
		}

		Webpack.Stores.MessageStore.emitChange();
	}

	function handleEvent(event) {
		if ("message" in event) {
			const codes = extrackWorkshopCodes(event.message.content);

			if (codes.length) handleMessage(event.message, codes, typeof event.message.state !== "string");
		}
		if ("messages" in event) {
			for (let index = 0; index < event.messages.length; index++) {
				const message = event.messages[index];
				const codes = extrackWorkshopCodes(message.content);
	
				if (codes.length) handleMessage(message, codes, typeof message.state !== "string");
			}
		}
	}

	return {
		workshop,

		start() {
			Webpack.Stores.UserStore._dispatcher.subscribe("LOAD_MESSAGES_SUCCESS", handleEvent);
			Webpack.Stores.UserStore._dispatcher.subscribe("CACHE_LOADED", handleEvent);
			Webpack.Stores.UserStore._dispatcher.subscribe("LOCAL_MESSAGES_LOADED", handleEvent);
			Webpack.Stores.UserStore._dispatcher.subscribe("MESSAGE_UPDATE", handleEvent);
			Webpack.Stores.UserStore._dispatcher.subscribe("MESSAGE_CREATE", handleEvent);

			Patcher.after(EmbedHandler, "handle", (_, [__, ___, embed], res) => {
				if (typeof res === "object") res.__SteamWorkshopEmbedder = embed.__SteamWorkshopEmbedder;
			});

			Object.values(ChannelMessages._channelMessages)
				.flatMap(x => x._array).forEach(message => {
					if (!message?.content) return;

					
					
					const codes = extrackWorkshopCodes(message.content);

					if (codes.length) handleMessage(message, codes, false);
				});
		},
		stop() {
			Webpack.Stores.UserStore._dispatcher.unsubscribe("LOAD_MESSAGES_SUCCESS", handleEvent);
			Webpack.Stores.UserStore._dispatcher.unsubscribe("LOCAL_MESSAGES_LOADED", handleEvent);
			Webpack.Stores.UserStore._dispatcher.unsubscribe("CACHE_LOADED", handleEvent);
			Webpack.Stores.UserStore._dispatcher.unsubscribe("MESSAGE_UPDATE", handleEvent);
			Webpack.Stores.UserStore._dispatcher.unsubscribe("MESSAGE_CREATE", handleEvent);
			Patcher.unpatchAll();
			
			Object.values(ChannelMessages._channelMessages)
				.flatMap(x => x._array).forEach(message => {
					if (!message) return;

					for (let index = 0; index < message.embeds.length; index++) {
						const element = message.embeds[index];
						if (element.__SteamWorkshopEmbedder) {
							message.embeds.splice(index, 1);
							index--;
						}
					}
				});
			
			Webpack.Stores.MessageStore.emitChange()
		}
	}
}
