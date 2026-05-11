export const fieldLimits = {
  order: {
    clientName: { min: 2, max: 120 },
    contactValue: { min: 3, max: 180 },
    serviceTitle: { max: 160 },
    comment: { min: 10, max: 2000 }
  },
  service: {
    title: { min: 2, max: 160 },
    slug: { min: 2, max: 180 },
    description: { min: 5, max: 800 },
    details: { max: 2000 },
    displayOrder: { min: 0, max: 10000 }
  },
  tag: {
    title: { min: 2, max: 120 },
    slug: { min: 2, max: 160 },
    description: { max: 800 }
  },
  page: {
    title: { min: 2, max: 180 },
    body: { min: 5, max: 4000 },
    blocks: { max: 8000 }
  },
  pageBlock: {
    key: { max: 80 },
    value: { max: 1200 }
  },
  project: {
    title: { min: 2, max: 180 },
    slug: { min: 2, max: 200 },
    shortDescription: { min: 5, max: 500 },
    fullDescription: { min: 20, max: 6000 },
    coverImageUrl: { max: 1200 }
  },
  image: {
    title: { max: 160 },
    caption: { max: 500 },
    sortOrder: { min: 0, max: 10000 }
  },
  login: {
    email: { max: 254 },
    password: { min: 6, max: 128 }
  }
} as const;
