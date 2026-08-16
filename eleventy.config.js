import { IdAttributePlugin, InputPathToUrlTransformPlugin, HtmlBasePlugin } from "@11ty/eleventy";
import pluginSyntaxHighlight from "@11ty/eleventy-plugin-syntaxhighlight";
import pluginNavigation from "@11ty/eleventy-navigation";
import { feedPlugin } from "@11ty/eleventy-plugin-rss";

import pluginFilters from "./_config/filters.js";
import metadata from "./_data/metadata.js";

export default function (eleventyConfig) {
	eleventyConfig.addPassthroughCopy({
		"./public/": "/",
		"./node_modules/prismjs/themes/prism-tomorrow.css": "/css/prism-dark.css",
	});

	eleventyConfig.addWatchTarget("public/**/*.css");

	eleventyConfig.addPlugin(pluginSyntaxHighlight, {
		preAttributes: {
			"data-language": (context) => context.language,
		},
		codeAttributes: {
			tabindex: 0,
		},
	});
	eleventyConfig.addPlugin(pluginNavigation);
	eleventyConfig.addPlugin(HtmlBasePlugin);
	eleventyConfig.addPlugin(InputPathToUrlTransformPlugin);

	eleventyConfig.addPlugin(feedPlugin, {
		type: "atom",
		outputPath: "/feed.xml",
		collection: { name: "posts", limit: 20 },
		metadata: {
			language: metadata.language,
			title: metadata.title,
			subtitle: metadata.description,
			base: `${metadata.url}/`,
			author: metadata.author,
		},
	});

	eleventyConfig.addPlugin(IdAttributePlugin);
	eleventyConfig.addPlugin(pluginFilters);

	eleventyConfig.addCollection("posts", function (collectionApi) {
		return collectionApi.getFilteredByGlob("content/posts/*.md");
	});

	return {
		templateFormats: ["md", "njk", "html", "liquid", "11ty.js"],
		markdownTemplateEngine: "njk",
		htmlTemplateEngine: "njk",
		dir: {
			input: "content",
			includes: "../_includes",
			data: "../_data",
			output: "_site",
		},
	};
}
