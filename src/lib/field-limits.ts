export const fieldLimits = {
  order: {
    clientName: { min: 1, max: 120 },
    contactValue: { min: 1, max: 180 },
    serviceTitle: { max: 160 },
    resultDescription: { min: 10, max: 2000 },
    stylePreferences: { min: 3, max: 1000 },
    materials: { max: 1200 },
    desiredDeadline: { max: 160 },
    comment: { min: 1, max: 2000 }
  },
  servicePackage: {
    title: { min: 2, max: 120 },
    description: { max: 800 },
    badge: { max: 80 },
    bestFor: { max: 240 },
    outcome: { max: 240 },
    includedItem: { max: 180 },
    includedItems: { max: 12 },
    price: { min: 0, max: 10000000 },
    durationDays: { min: 1, max: 365 },
    displayOrder: { min: 0, max: 10000 }
  },
  serviceAddon: {
    title: { min: 2, max: 120 },
    description: { max: 800 },
    price: { min: 0, max: 10000000 },
    durationDays: { min: 0, max: 365 },
    displayOrder: { min: 0, max: 10000 }
  },
  orderContract: {
    finalPrice: { min: 0, max: 10000000 },
    finalDurationDays: { min: 1, max: 365 },
    workScope: { min: 10, max: 3000 },
    materials: { max: 2000 },
    managerComment: { max: 2000 }
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
