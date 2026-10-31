import markdownIt from "markdown-it";
import mdfigcaption from "markdown-it-image-figures";
import { eleventyImageTransformPlugin } from "@11ty/eleventy-img";
import Image from "@11ty/eleventy-img";
import { Util } from "@11ty/eleventy-img";
import sharp from "sharp";
import fs from "node:fs";
import poison from "eleventy-plugin-poison";
import eleventyPluginFeathericons from 'eleventy-plugin-feathericons';
import { DateTime } from "luxon";
import pluginRss from "@11ty/eleventy-plugin-rss";
import sitemap from "@quasibit/eleventy-plugin-sitemap";
import EleventyPluginRobotsTxt from "eleventy-plugin-robotstxt";
import * as pagefind from "pagefind";
import * as path from "node:path";
import { transform } from "lightningcss";
import syntaxHighlight from "@11ty/eleventy-plugin-syntaxhighlight";


export default async function(eleventyConfig) {
	let mdOptions = {
		html: true
	};
	let figoptions = {
		dataType: true,
		figcaption: true
	};
	const md = markdownIt(mdOptions).use(mdfigcaption, figoptions);

	// Images
	eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
		formats: ["webp", "auto"],
		widths: [600,1200,2000],
		urlPath: "/images/",
		outputDir: ".cache/@11ty/images/",
		defaultAttributes: {
			loading: 'lazy',
			sizes: 'auto',
			decoding: 'async',
		},
		sharpOptions: {
			animated: true,
		},
	});
	// Figure gallery from https://www.alpower.com/blog/adding-figures-with-captions-to-images-in-markdown-with-eleventy
	eleventyConfig.setLibrary("md", md);
	// modified from https://github.com/mendhak/eleventy-satisfactory/blob/main/_configs/gallery.shortcode.js
	eleventyConfig.addPairedShortcode("gallery", (data, caption = "", clss = "") => {
		if (caption === "") {
			return `<figure data-type="image" class="gallery ${clss}"><div class="imgrow">${md.renderInline(data)}</div></figure>`;
		} else {
			return `<figure data-type="image" class="gallery ${clss}"><div class="imgrow">${md.renderInline(data)}</div><figcaption>${md.renderInline(caption)}</figcaption></figure>`;
		}
	});
	eleventyConfig.addPairedShortcode("gallerySwipe", (content, name, imgPerCol) => {
		if (imgPerCol === undefined) {
			const nImg = (content.match(/<a /g) || []).length;
			imgPerCol = 1;
			if (nImg % 2 == 0) {
				imgPerCol = 2;
			} else if (nImg > 1) {
				imgPerCol = 3;
			}
		}
		return `<link rel="stylesheet" href="../../css/photoswipe.css">
			<style>
				.eleventy-plugin-gallery { display: grid; gap: calc(0.25 * var(--rhythm-unit)); align-items: center;
					a:hover { opacity: .8; }
					picture { aspect-ratio: 1/1; display: block; }
					img { width: 100%; height: 100%; object-fit: contain; }
				}
			</style>
			<section class="eleventy-plugin-gallery" id="gallery-${name}" style="grid-template-columns: repeat(${imgPerCol}, 1fr);">
				${content}
			</section>
			<script type="module" eleventy:ignore>
				import PhotoSwipeLightbox from '../../js/photoswipe-lightbox.esm.min.js';
				import PhotoSwipe from '../../js/photoswipe.esm.min.js';
				const lightbox = new PhotoSwipeLightbox({ gallery: '#gallery-${name}', children: 'a', pswpModule: PhotoSwipe, preload: [1, 1] });
				lightbox.init();
			</script>
			`.replace(/(\r\n|\n|\r)/gm, "");
	});
	eleventyConfig.addShortcode("galleryImg", async function( src, alt, previewWidth = 400, ) {
		let lightboxImageWidth = 2000;
		src = Util.normalizeImageSource({ input: this.eleventy.directories.input, inputPath: this.page.inputPath, }, src, );
		const metadata = await sharp(src).metadata();
		if (metadata.height > metadata.width) { lightboxImageWidth = 800; }
		const options = {
			formats: ["auto"],
			widths: [previewWidth, lightboxImageWidth],
			urlPath: "/images/",
			outputDir: ".cache/@11ty/images/",
		};
		const genMetadata = await Image(src, options);
		if (genMetadata.jpeg.length == 1) { genMetadata.jpeg.splice(0, 0, genMetadata.jpeg[0]); }
		const output = `
			<a href="${genMetadata.jpeg[1].url}" data-pswp-width="${genMetadata.jpeg[1].width}" data-pswp-height="${genMetadata.jpeg[1].height}" target="_blank" title="${alt}">
				<picture><img src="${genMetadata.jpeg[0].url}" alt="${alt}" eleventy:ignore/></picture>
			</a>
			`.replace(/(\r\n|\n|\r)/gm, "");
		return output;
	});

	// Video, adapted from https://github.com/samwarnick/samwarnick.com/blob/860f9fb2f79f30b8296f4d6b39afcd9cfa1a6fc1/.eleventy.js#L72-L101
	eleventyConfig.addShortcode("youtube", function (url) {
		const youtubeRegex = /https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)(?<id>[a-zA-Z0-9_-]{11})(?:.*[?&]t=(?<timestamp>\d+))?/;
		const match = url.match(youtubeRegex);
		if (match) {
			const { id, timestamp } = match.groups;
			return `<div class="lite-youtube"><script type="module" src="/js/lite-youtube.js"></script><lite-youtube videoId="${id}" videoStartAt="${timestamp ?? 0}" posterquality="maxresdefault">
					<a href="${url}" rel="noopener noreferrer">Watch this video on YouTube</a>
				</lite-youtube></div>`;
		}
	});
	eleventyConfig.addFilter("replaceWebComponents", function (content) {
		return (
			content
				.replace(
					/<script\stype="module"\ssrc="https:\/\/example.com\/assets\/js\/lite-youtube\.js"><\/script>/gs, () => {return ""})
				.replace(
					/<lite-youtube\s+videoId="([^"]+)"(?:\s+videoStartAt="([^"]+)")?[^>]*>.*?<\/lite-youtube>/gs,
					(match, videoId, startTime) => {
						const startParam = startTime ? `&start=${startTime}` : "";
						return `<iframe src="https://www.youtube.com/embed/${videoId}?feature=oembed${startParam}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; 	picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`;
					},
				)
		);
	});

	// Type things
	eleventyConfig.addPlugin(syntaxHighlight);
	eleventyConfig.addPlugin(eleventyPluginFeathericons, { "width": 21, "height": 21, "stroke-width": 1.5, });
	eleventyConfig.addPlugin(poison, { includeCSS: true });
	eleventyConfig.addFilter("deslug", (text) => { return text.replace(/-/gi, " "); });
	eleventyConfig.addFilter("widont", (text) => {
    var inline_tags = 'a|span|i|b|em|strong|acronym|caps|sub|sup|abbr|big|small|code|cite|tt'
    var word = '(?:<(?:'+inline_tags+')[^>]*?>)*?[^\\s<>]+(?:<\\/(?:'+inline_tags+')[^>]*?>)*?'
    var re_widont = RegExp(
      '(\\s+'+word+'\\s+'+word+')'+                      // matching group 1, 2 * space and a word with a possible bordering tag
      '(?:\\s+)'+                                              // one or more space characters
      '('+                                                     // matching group 2
        '(('+word+')|('+'[^\\s]+'+'))'+                        // word OR not-space characters
        '(?:\\s*<\\/(?:a'+inline_tags+')[^>]*?>\\s*\\.*)*?'+   // one or more inline closing tags +- space
        '(?:\\s*?<\\/(?:p|h[1-6]|li|dt|dd)>|$)'+               // allowed closing tags or end of line
      ')', 'gi');
    return text.replace(re_widont, '$1&nbsp;$2');
	});
	// Date things
	eleventyConfig.addShortcode("currentYear", () => `${new Date().getFullYear()}`);
	eleventyConfig.addFilter("postDate", dateObj => { return DateTime.fromJSDate(dateObj).setZone("America/Chicago").toFormat('d LLL yyyy') });
	eleventyConfig.addFilter("postDayMonth", dateObj => { return DateTime.fromJSDate(dateObj).setZone("America/Chicago").toFormat('d LLL') });
	eleventyConfig.addFilter("datetimeString", dateObj => { return DateTime.fromJSDate(dateObj).setZone("America/Chicago"); });

	// Lists and tags
	eleventyConfig.addCollection("postsByYear", (collection) => {
		const posts = collection.getFilteredByTag('post').reverse();
		const years = posts.map(post => post.date.getFullYear());
		const uniqueYears = [...new Set(years)];
		const postsByYear = uniqueYears.reduce((prev, year) => {
			const filteredPosts = posts.filter(post => post.date.getFullYear() === year);
			return [
				...prev,
				[year, filteredPosts.reverse()]
			]
		}, []);
		return postsByYear;
	});
  eleventyConfig.addCollection("postsByWptags", (collection) => {
		const posts = collection.getFilteredByTag('post');
		const wptagsList = new Set();
		posts.map( item => {
			if (item.data.wptags) {
				item.data.wptags.map( wptag => wptagsList.add(wptag));
			}
		});
		const uniqueWptags = [...new Set(wptagsList)].sort();
		const postsByWptags = uniqueWptags.reduce((prev, wptag) => {
			let filteredPosts = posts.filter(post => post.data.wptags !== undefined );
			filteredPosts = filteredPosts.filter(post => post.data.wptags.includes(wptag));
			return [...prev,[wptag, filteredPosts]];
		}, []);
		return postsByWptags;
  });
	eleventyConfig.addFilter("exclude", (collection, stringToFilter) => { return (collection ?? []).filter(item => item !== stringToFilter) });
	eleventyConfig.addFilter("getKeys", target => { return Object.keys(target); });
	eleventyConfig.addFilter("sortAlphabetically", strings => (strings || []).sort((b, a) => b.localeCompare(a)) );
	eleventyConfig.addFilter("filterTagList", function filterTagList(tags) { return (tags || []).filter(tag => ["all", "post", "postsByWptags", "postsByYear", "private"].indexOf(tag) === -1); });
	eleventyConfig.addFilter("headQuantity", (array, n) => {
		if(!Array.isArray(array) || array.length === 0) {  return []; }
		if( n < 0 ) { return array.slice(n); }
		return array.slice(0, n);
	});

	// OG/meta items
	eleventyConfig.addShortcode("coverImageMkr", async function(src) {
		src = './content/images/' + src;
		const metadata = await Image(src, {
			formats: ["webp"],
			widths: [1200],
			urlPath: "/images/",
			outputDir: ".cache/@11ty/images/",
		});
		// take the first entry for the first format.
		const data = Object.values(metadata)[0][0];
		return data.url;
	});
	// modified from https://tylersticka.com/journal/simple-eleventy-3-excerpts/
	eleventyConfig.addGlobalData("eleventyComputed.excerpt", () => (data) => {
    let content = data.page.rawInput;
    if (data.page.templateSyntax.includes('md')) {
      content = md.render(content);
    }
    const matches = content.match(/<p>(.+[\.\?\!\)":])<\/p>/);
		if (matches) {
      return matches[0];
    }
		return null;
  });

	// Behind the scenes
	eleventyConfig.addPlugin(pluginRss);
	eleventyConfig.addPlugin(sitemap, {
		sitemap: {
			hostname: "https://example.com",
		},
	});
	const eleventyPluginRobotsTxtOptions = {
		rules: new Map([
			[
				["AI2Bot", "Ai2Bot-Dolma", "aiHitBot", "Amazonbot", "anthropic-ai", "Applebot-Extended", "Bytespider", "CCBot", "ClaudeBot", "cohere-ai", "cohere-training-data-crawler", "DuckAssistBot", "FacebookBot", "Google-Extended", "GoogleOther", "GoogleOther-Image", "GoogleOther-Video", "GPTBot", "img2dataset", "Meta-ExternalAgent", "MyCentralAIScraperBot", "omgili", "omgilibot", "Quora-Bot", "TikTokSpider", "YouBot"],
				[{ disallow: "/" }]
			],
			["*", [
				{ allow: "/" },
				{ disallow: "/css/" },
				{ disallow: "/files/" },
				{ disallow: "/font/" },
				{ disallow: "/js/" },
				{ disallow: "/images/" }
			]],
		]),
		sitemapURL: "https://example.com/sitemap.xml"
	};
	eleventyConfig.addPlugin(EleventyPluginRobotsTxt, eleventyPluginRobotsTxtOptions);

	// pagefind
	const pageFindPath = path.join("pagefind");
	const { index } = await pagefind.createIndex({
		// rootSelector: "main",
	});
	eleventyConfig.addTransform("pagefind-index", async function(content) {
		await index.addHTMLFile({
			url: this.page.url,
			content
		});
		return content;
	});
	eleventyConfig.on("eleventy.after", async function({ directories }) {
		const finalFile = path.join(directories.output, pageFindPath)
		await index.writeFiles({
			outputPath: finalFile
		});
	});

	// Build things
	eleventyConfig.addPreprocessor("drafts", "*", (data, content) => {
		if (data.draft) {
			data.title = `${data.title} (draft)`;
		}
		if (data.draft && process.env.ELEVENTY_RUN_MODE === "build") {
			return false;
		}
	});
	eleventyConfig.addFilter("cssmin", function (inputCode) {
		if (process.env.ELEVENTY_RUN_MODE === "build") {
			let { code } = transform({
				code: Buffer.from(inputCode),
				minify: true,
				sourceMap: false
			});
			return code;
		}
		return `${inputCode}`;
	});
	// caching adjustment from https://github.com/11ty/image/issues/285
	eleventyConfig.on("eleventy.after", () => {
		fs.cpSync(".cache/@11ty/images/", path.join(eleventyConfig.directories.output, "/images/"), { recursive: true });
	 });

	eleventyConfig.addPassthroughCopy(
		"./content/feed/pretty.js",
	);
	eleventyConfig.addPassthroughCopy({
		"./content/assets": "/",
		"./node_modules/photoswipe/dist/photoswipe-lightbox.esm.min.js": "/js/photoswipe-lightbox.esm.min.js",
		"./node_modules/photoswipe/dist/photoswipe.esm.min.js": "/js/photoswipe.esm.min.js",
		"./node_modules/photoswipe/dist/photoswipe.css": "/css/photoswipe.css",
		"./node_modules/littlefoot/dist/littlefoot.js": "/js/littlefoot.js",
	});

	return {
		templateFormats: [
			"md",
			"njk",
			"html",
			"11ty.js",
		],
		markdownTemplateEngine: "njk",
		htmlTemplateEngine: "njk",
		dir: {
			input: "content",
			includes: "_includes",
			data: "_data",
			output: "_site",
		}
	};
};
