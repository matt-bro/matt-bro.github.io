import { DateTime } from "luxon";

export default function(eleventyConfig) {
	eleventyConfig.addFilter("htmlDateString", (dateObj) => {
		return DateTime.fromJSDate(dateObj, { zone: "utc" }).toFormat('yyyy-LL-dd');
	});

	eleventyConfig.addFilter("groupByYear", (posts) => {
		const years = new Map();
		for (const post of posts || []) {
			const year = DateTime.fromJSDate(post.date, { zone: "utc" }).toFormat("yyyy");
			if (!years.has(year)) years.set(year, []);
			years.get(year).push(post);
		}
		return [...years].map(([year, posts]) => ({ year, posts })).reverse();
	});

	eleventyConfig.addFilter("head", (array, n) => {
		if(!Array.isArray(array) || array.length === 0) {
			return [];
		}
		if( n < 0 ) {
			return array.slice(n);
		}

		return array.slice(0, n);
	});

	eleventyConfig.addFilter("min", (...numbers) => {
		return Math.min.apply(null, numbers);
	});
};
