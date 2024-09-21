import type { Element, Node } from 'hast';
import { toString as hastToString } from 'hast-util-to-string';
import { codeToHast } from 'shiki';
import { visit } from 'unist-util-visit';

export function syntaxHighlight() {
  return async (tree: Node) => {
    const promises: Promise<void>[] = [];

    async function visitor(node: Element, index: number, parent: Element) {
      if (
        !parent ||
        index === null ||
        node.tagName !== 'pre' ||
        node.children.length === 0
      ) {
        return;
      }

      const codeNode = node.children[0];
      if (
        !codeNode ||
        codeNode.type !== 'element' ||
        codeNode.tagName !== 'code' ||
        !codeNode.properties
      ) {
        return;
      }

      const lang = getNodeLanguage(codeNode);
      if (typeof lang !== 'string') {
        return;
      }

      // Make themes.
      // Do any custom tweaks.
      let lightTheme = (await import('shiki/themes/material-theme-lighter.mjs'))
        .default;
      lightTheme = {
        ...lightTheme,
        colors: {
          ...lightTheme.colors,
          // 'editor.background': '#e5e5e5',
        },
      };
      let darkTheme = (await import('shiki/themes/material-theme-darker.mjs'))
        .default;
      darkTheme = {
        ...darkTheme,
        colors: {
          ...darkTheme.colors,
          // 'editor.background': '#171717',
        },
      };

      // Highlight code
      const sourceCode = hastToString(codeNode).trim();
      const hast = await codeToHast(sourceCode, {
        lang,
        themes: { light: lightTheme, dark: darkTheme },
      });

      // Insert highlighted AST into parent
      const hastPre = hast.children[0] as Element;
      parent.children.splice(index, 1, {
        ...hastPre,
      });
    }

    visit(tree, 'element', (node: Element, index: number, parent: Element) => {
      promises.push(visitor(node, index, parent));
    });
    await Promise.allSettled(promises);
  };
}

function getNodeLanguage(node: Element): string | undefined {
  if (!Array.isArray(node.properties.className)) {
    return undefined;
  }
  const prefix = 'language-';
  const language = node.properties.className.find(
    (d) => typeof d === 'string' && d.startsWith(prefix),
  ) as string | undefined;
  if (typeof language === 'string') {
    return language.slice(prefix.length);
  }
  return language;
}
