import { getCollection } from 'astro:content';

const escapeXml = (value) =>
	String(value)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');

const isoDate = (date) => date.toISOString().slice(0, 10);

const renderUrl = ({ loc, lastmod, changefreq, priority }) => {
	const parts = [
		'<url>',
		`<loc>${escapeXml(loc)}</loc>`,
		lastmod ? `<lastmod>${escapeXml(isoDate(lastmod))}</lastmod>` : '',
		changefreq ? `<changefreq>${escapeXml(changefreq)}</changefreq>` : '',
		priority ? `<priority>${escapeXml(priority)}</priority>` : '',
		'</url>',
	];

	return parts.filter(Boolean).join('');
};

export async function GET({ site }) {
	const posts = (await getCollection('blog')).sort(
		(a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
	);
	const latestPostDate = posts.reduce((latest, post) => {
		const postDate = post.data.updatedDate ?? post.data.pubDate;
		return postDate > latest ? postDate : latest;
	}, new Date(0));

	const urls = [
		{
			loc: new URL('/', site).toString(),
			changefreq: 'weekly',
			priority: '1.0',
		},
		{
			loc: new URL('/blog/', site).toString(),
			lastmod: latestPostDate,
			changefreq: 'weekly',
			priority: '0.9',
		},
		{
			loc: new URL('/about/', site).toString(),
			changefreq: 'monthly',
			priority: '0.7',
		},
		...posts.map((post) => ({
			loc: new URL(`/blog/${post.id}/`, site).toString(),
			lastmod: post.data.updatedDate ?? post.data.pubDate,
			changefreq: 'monthly',
			priority: '0.8',
		})),
	];

	return new Response(
		`<?xml version="1.0" encoding="UTF-8"?>` +
			`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">` +
			urls.map(renderUrl).join('') +
			`</urlset>`,
		{
			headers: {
				'Content-Type': 'application/xml; charset=utf-8',
			},
		},
	);
}
