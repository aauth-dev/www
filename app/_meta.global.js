export default {
  '*': {
    theme: {
      footer: false,
      timestamp: false,
    },
  },
  index: {
    title: 'AAuth',
    type: 'page',
    display: 'hidden',
    theme: {
      layout: 'full',
      footer: false,
      timestamp: false,
      toc: false,
      sidebar: false,
      breadcrumb: false,
      pagination: false,
      typesetting: 'default',
    },
  },
  explainer: {
    title: 'Explainer',
    type: 'page',
    items: {
      index: 'Overview',
      'why-aauth': 'Why AAuth',
      'how-it-works': 'How It Works',
      'vs-oauth': 'AAuth vs OAuth/OIDC',
      'design-rationale': 'Design Rationale',
    },
  },
  specs: {
    title: 'Specifications',
    type: 'page',
    items: {
      index: 'Overview',
      'signature-key': 'Signature-Key',
      headers: 'AAuth Headers',
      protocol: 'AAuth Protocol',
      mission: 'AAuth Mission',
      r3: 'AAuth R3',
    },
  },
  blog: {
    title: 'Articles',
    type: 'page',
  },
  implementations: {
    title: 'Implementations',
    type: 'page',
  },
  github: {
    title: 'GitHub ↗',
    type: 'page',
    href: 'https://github.com/dickhardt/AAuth',
    newWindow: true,
  },
}
