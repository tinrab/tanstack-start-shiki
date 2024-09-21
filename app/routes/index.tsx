import { createFileRoute } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/start';
import { serialize } from 'next-mdx-remote/serialize';
import { MDXRemote } from 'next-mdx-remote';
import { syntaxHighlight } from '~/lib/syntax-highlight';

const renderContent = createServerFn('GET', async () => {
  const mdx = await serialize(
    `---
life: 42
---

# Hello, World!

\`\`\`c
float Q_rsqrt( float number )
{
	long i;
	float x2, y;
	const float threehalfs = 1.5F;

	x2 = number * 0.5F;
	y  = number;
	i  = * ( long * ) &y;						// evil floating point bit level hacking
	i  = 0x5f3759df - ( i >> 1 );               // what the fuck?
	y  = * ( float * ) &i;
	y  = y * ( threehalfs - ( x2 * y * y ) );   // 1st iteration
//	y  = y * ( threehalfs - ( x2 * y * y ) );   // 2nd iteration, this can be removed

	return y;
}
\`\`\`
    `.trim(),
    {
      parseFrontmatter: true,
      mdxOptions: {
        rehypePlugins: [syntaxHighlight],
        format: 'mdx',
      },
    },
    false,
  );

  return {
    mdx,
  };
});

export const Route = createFileRoute('/')({
  component: Home,
  loader: async () => renderContent(),
  wrapInSuspense: true,
  headers: () => {
    return {
      'cache-control': 'public, max-age=3600',
    };
  },
});

function Home() {
  const data = Route.useLoaderData();

  return (
    <main className="mx-auto flex min-h-screen max-w-screen-lg flex-col px-4 py-8">
      <pre className="mb-4 text-muted-foreground">
        {JSON.stringify(data.mdx.frontmatter, null, 2)}
      </pre>
      <MDXRemote
        {...data.mdx}
        components={{
          h1: (props) => <h1 className="mb-4 font-bold text-3xl" {...props} />,
        }}
      />
    </main>
  );
}
