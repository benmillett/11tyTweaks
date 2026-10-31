# Using pretty-atom-feed.js

This is my version of the [pretty-atom-feed.js](https://github.com/11ty/eleventy-base-blog/blob/100bde185fdcf717396931eff66e5a27fe07c8d6/content/feed/pretty-atom-feed.js) used in the @11ty/eleventy-base-blog.

It adds an RSS icon and formats the `help` section and recent posts differently.

## Implementation

**You only need `pretty-atom-feed.js` from this repo if you've already added the 11ty RSS plugin.**

1. Put the `pretty-atom-feed.js` in the same folder that will house your `feed.xml`. (You may be replacing an existing file depending on your starting point.)

2. Make sure to passthrough the file
	```
	…
	eleventyConfig.addPassthroughCopy("./content/feed/pretty-atom-feed.js");
	…
	```

3. Add the `script` line to the `export` section of your `eleventy.config.js`. Example:

	```
	…
	eleventyConfig.addPlugin(feedPlugin, {
		…
		outputPath: "/feed/feed.xml",
		script: "pretty-atom-feed.js",
		…
	```

4. Update the CSS variables to your preferred colors.

## Screenshot

<img width="1746" height="1694" alt="PrettyFeedScreenshot" src="https://github.com/user-attachments/assets/e6cf0796-0033-4e33-affa-b1ebd3186475" />

### Screenshot caveats:
- Colors shown here are the defaults set by the variables
- Timestamp formatting will vary based on what is used in your feed.xml
- Your feed title will be used, not "Blog | Ben Millett"

---

## Note
In my own implementation, I use a customized `atom.njk` to create the feed xml, so my set-up looks like this:
- I just add an import and basic plugin call to `eleventy.config.js`. (I use `pluginRSS` instead of `feedPlugin` in the Eleventy Base example.)
	```
	import pluginRss from "@11ty/eleventy-plugin-rss";
	…
	export …
	…
	eleventyConfig.addPlugin(pluginRss);
	…
	```
	
- `/feed/feed.11tydata.js` references the `pretty-atom-feed.js`:
	```
	export default {
	outputPath: "/feed/atom.xml",
	script: "pretty-atom-feed.js",
	…
	```
