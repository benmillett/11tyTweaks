// Renders the Atom feed as a readable page without XSLT, see #264.
const HTML = "http://www.w3.org/1999/xhtml";
const ATOM = "http://www.w3.org/2005/Atom";
const SVG = "http://www.w3.org/2000/svg";

function h(name, attrs = {}, ...children) {
	let el = document.createElementNS(HTML, name);
	for(let [key, value] of Object.entries(attrs)) {
		el.setAttribute(key, value);
	}
	el.append(...children);
	return el;
}

function s(name, attrs = {}, ...children) {
	let el = document.createElementNS(SVG, name);
	for(let [key, value] of Object.entries(attrs)) {
		el.setAttribute(key, value);
	}
	el.append(...children);
	return el;
}

function child(parent, name) {
	return [...parent.children].find(el => el.namespaceURI === ATOM && el.localName === name);
}

// The script runs before the entries are parsed.
document.addEventListener("DOMContentLoaded", () => {
	let feed = document.documentElement;
	let title = child(feed, "title")?.textContent || "";
	let siteUrl = [...feed.children].find(el => el.localName === "link" && !el.hasAttribute("rel"))?.getAttribute("href");

	let entries = [...feed.children].filter(el => el.localName === "entry").map(entry => {
		let updated = child(entry, "updated")?.textContent;
		return h("div", {},
			h("h3", {},
				h("a", { href: child(entry, "link")?.getAttribute("href") || "" }, child(entry, "title")?.textContent || ""),
			),
			updated ? h("small", {}, ` ${new Date(updated).toLocaleDateString()}`) : "",
		);
	});

	let html = h("html", { lang: feed.getAttribute("xml:lang") || "en" },
		h("head", {},
			h("title", {}, title),
			h("meta", { name: "viewport", content: "width=device-width, initial-scale=1" }),
			h("style", {}, `:root { --colorText: #111; --colorAccent: #3a3; --colorAccentAlt: #fff; --colorGrey: #777; }
			* { box-sizing: border-box; }
html { font-family: sans-serif; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; }
header, nav, section { display: block; margin-block: 18px;}
svg:not(:root) { overflow: hidden; }
body { min-width: 500px; max-width: 700px; width: 50vw; margin: 0 auto; padding: 36px 27px; font-family: system-ui, 'Helvetica Neue', Helvetica, Arial, 'Segoe UI', Roboto, Cantarell, sans-serif; font-size: 16px; line-height: 1.5; color: var(--colorText); background-color: var(--colorAccentAlt);
	@media (max-width: 430px){ min-width: unset; width: 100vw; padding-top: 9px; }
}
a { color: var(--colorAccent); background-color: transparent; text-decoration: none;
	&:hover { text-decoration: underline; }
	&:active, &a:hover { outline-width: 0; }
}
nav {  margin-left: -18px; margin-right: -18px; padding: 18px; background-color: var(--colorAccent); color: var(--colorAccentAlt); border-radius: 3px;
	p { margin: 0 0 9px; }
	p:last-of-type { margin-bottom: 0; }
	a { color: var(--colorAccentAlt); text-decoration: underline; }
 }
h1 { margin: 36px 0 18px; font-size: 32px; font-weight: 600;
	svg { vertical-align: text-bottom; vertical-align: center; vertical-align: central; margin-right: 9px; }
}
h2 { margin-bottom: 0; font-size: 27px; font-weight: 600; }
h3 { margin-bottom: 0; font-size: 20px; font-weight: 600; }
small { font-size: 90%; color: var(--colorGrey); }
`),
		),
		h("body", {},
			h("header",{},
				h("h1", {},
					s("svg", { 'aria-hidden': "true", xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", stroke: "currentColor", 'stroke-linejoin': "round", class: "feather feather-rss feather-x", height: "36", width: "36", 'stroke-width': "2", 'stroke-linecap': "round", fill: "none" }, s("path", { d: "M4 11a9 9 0 0 1 9 9" }), s("path", { d: "M4 4a16 16 0 0 1 16 16" }), s("circle", { cx: "5", cy: "19", r: "1" })),
					title
				),
				siteUrl ? h("p", {}, h("a", { href: siteUrl }, "Visit Website →")) : "",
			),
			h("nav", {},
				h("p", {}, "This is an RSS feed, also known as a web or Atom feed. ", "Visit ", h("a", { href: "https://aboutfeeds.com" }, "About Feeds"), " to learn how to get started with free newsreaders."),
				h("p", {}, h("strong", {}, "Subscribe by copying the URL from the address bar into your newsreader.")),
			),
			h("h2", {}, "Recent posts"),
			h("small", {}, "This preview only shows titles. The actual feed contains the full content."),
			h("section", {}, ...entries),
		)
	);

	document.replaceChild(html, feed);
});
