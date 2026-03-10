import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docsSidebar: [
    'intro',
    'quickstart',
    'architecture',
    'strategy-protocol',
    'deployment',
    'deployment-checklist',
    'secrets',
    {
      type: 'category',
      label: 'Standards',
      items: [
        'standards/backend-standards',
        'standards/component-standards',
        'standards/zustand-standards',
      ],
    },
  ],
};

export default sidebars;
