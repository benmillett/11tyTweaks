import meta from "../_data/metadata.js";

export default {
		outputPath: "/feed/atom.xml",
		script: "pretty.js",
		collection: {
			name: "post",
			limit: "5"
		},
		metadata: {
			language: meta.language,
			title: "Blog | " + meta.title,
			subtitle: meta.blogDescription,
			author: {
				name: meta.author.name,
				email: meta.author.email
			}
		}
};
