import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Quantago Docs',
  tagline:
    'Platform guides, architecture notes, deployment references, and strategy runtime docs.',
  favicon: 'img/quantago-logo.png',

  future: {
    v4: true,
  },

  url: 'https://docs.quantago.co',
  baseUrl: '/',

  organizationName: 'adamhalasz',
  projectName: 'backtest',

  onBrokenLinks: 'throw',
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'throw',
    },
  },

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          path: '../../docs',
          routeBasePath: '/',
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/adamhalasz/backtest/edit/main/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/quantago-logo.png',
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'Quantago Docs',
      logo: {
        alt: 'Quantago Logo',
        src: 'img/quantago-logo.png',
      },
      items: [
        {
          type: 'doc',
          docId: 'intro',
          position: 'left',
          label: 'Docs',
        },
        {
          href: 'https://app.quantago.co',
          label: 'App',
          position: 'right',
        },
        {
          href: 'https://github.com/adamhalasz/backtest',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentation',
          items: [
            {
              label: 'Quick Start',
              to: '/quickstart',
            },
            {
              label: 'Architecture',
              to: '/architecture',
            },
            {
              label: 'Deployment',
              to: '/deployment',
            },
          ],
        },
        {
          title: 'Product',
          items: [
            {
              label: 'Landing',
              href: 'https://quantago.co',
            },
            {
              label: 'App',
              href: 'https://app.quantago.co',
            },
            {
              label: 'Admin',
              href: 'https://admin.quantago.co',
            },
            {
              label: 'API',
              href: 'https://api.quantago.co',
            },
          ],
        },
        {
          title: 'Repository',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/adamhalasz/backtest',
            },
            {
              label: 'Python SDK',
              href: 'https://github.com/adamhalasz/backtest/tree/main/sdks/python',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Quantago. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
