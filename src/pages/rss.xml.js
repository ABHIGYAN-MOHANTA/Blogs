import { getCollection } from 'astro:content';
import rss from '@astrojs/rss';
import { SITE_AUTHOR, SITE_DESCRIPTION, SITE_LANGUAGE, SITE_TITLE } from '../consts';

const escapeXml = (value) =>
	String(value)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');

export async function GET(context) {
	const posts = (await getCollection('blog')).sort(
		(a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
	);
	const latestDate = posts.reduce((latest, post) => {
		const postDate = post.data.updatedDate ?? post.data.pubDate;
		return postDate > latest ? postDate : latest;
	}, new Date(0));

	return rss({
		title: SITE_TITLE,
		description: SITE_DESCRIPTION,
		site: context.site,
		xmlns: {
			atom: 'http://www.w3.org/2005/Atom',
			media: 'http://search.yahoo.com/mrss/',
		},
		customData:
			`<language>${escapeXml(SITE_LANGUAGE)}</language>` +
			`<lastBuildDate>${latestDate.toUTCString()}</lastBuildDate>` +
			`<atom:link href="${new URL('/rss.xml', context.site)}" rel="self" type="application/rss+xml" />`,
		items: posts.map((post) => ({
			title: post.data.title,
			description: post.data.description,
			pubDate: post.data.pubDate,
			link: `/blog/${post.id}/`,
			categories: post.data.tags,
			customData:
				`<dc:creator xmlns:dc="http://purl.org/dc/elements/1.1/">${escapeXml(SITE_AUTHOR)}</dc:creator>` +
				`<dcterms:modified xmlns:dcterms="http://purl.org/dc/terms/">${(post.data.updatedDate ?? post.data.pubDate).toISOString()}</dcterms:modified>` +
				(post.data.heroImage
					? `<media:content url="${escapeXml(new URL(post.data.heroImage.src, context.site))}" medium="image" width="${post.data.heroImage.width}" height="${post.data.heroImage.height}" />`
					: ''),
		})),
	});
}
