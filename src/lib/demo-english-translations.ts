import { createTranslationLookup } from "@/lib/content-localization";

const rows = [
  {
    entityType: "page",
    entityId: "page-home",
    fields: {
      title: "Graphic design that helps brands communicate clearly",
      body:
        "A designer portfolio focused on identity, packaging, digital materials, and presentations. Every project starts with the business goal and visual clarity.",
      blocks: {
        cta: "Discuss a project",
        secondaryCta: "View portfolio"
      }
    }
  },
  {
    entityType: "page",
    entityId: "page-about",
    fields: {
      title: "About the designer",
      body:
        "I help small businesses, experts, and creative teams turn ideas into coherent visual systems, from logos and brand assets to presentations, social media, and print.",
      blocks: {
        experience: "5+ years in branding and commercial design",
        focus: "identity, packaging, digital, editorial"
      }
    }
  },
  {
    entityType: "page",
    entityId: "page-services",
    fields: {
      title: "Services",
      body:
        "Choose a focused task or build a complete package for a product launch, event, or brand refresh.",
      blocks: {}
    }
  },
  {
    entityType: "page",
    entityId: "page-contacts",
    fields: {
      title: "Contacts",
      body:
        "Send a project request through the form or contact me directly. I usually reply within one business day.",
      blocks: {
        email: "designer@example.com",
        telegram: "@portfolio_contact"
      }
    }
  },
  {
    entityType: "tag",
    entityId: "tag-branding",
    fields: { title: "Branding", description: "Projects with a complete brand identity system" }
  },
  {
    entityType: "tag",
    entityId: "tag-digital",
    fields: { title: "Digital", description: "Materials for online communication" }
  },
  {
    entityType: "tag",
    entityId: "tag-print",
    fields: { title: "Print", description: "Print and packaging materials" }
  },
  {
    entityType: "tag",
    entityId: "tag-minimal",
    fields: { title: "Minimal", description: "Restrained visual direction" }
  },
  {
    entityType: "service",
    entityId: "svc-brand",
    fields: {
      title: "Brand identity",
      description: "Logo, visual identity, and clear rules for brand communication.",
      details: "From a core mark to a complete asset system and practical usage guide."
    }
  },
  {
    entityType: "service_package",
    entityId: "pkg-brand-logo",
    fields: {
      title: "Logo",
      description: "Logo mark, color palette, and essential usage versions.",
      badge: "Start",
      bestFor: "A new project that needs a recognizable visual mark",
      outcome: "A launch-ready logo and core file set",
      includedItems: ["Logo", "Color palette", "Print and screen files"]
    }
  },
  {
    entityType: "service_package",
    entityId: "pkg-brand-style",
    fields: {
      title: "Visual identity",
      description: "Logo, typography, color palette, and key brand assets.",
      badge: "Recommended",
      bestFor: "Launching or refreshing a company image",
      outcome: "A ready identity for the main customer touchpoints",
      includedItems: ["Logo", "Typography", "Brand assets", "Short guide"]
    }
  },
  {
    entityType: "service_package",
    entityId: "pkg-brand-system",
    fields: {
      title: "Brand system",
      description: "An extended identity system with rules and reusable layouts.",
      badge: "Complete",
      bestFor: "A brand with several products and communication channels",
      outcome: "A scalable visual system",
      includedItems: ["Identity", "Brand guide", "Templates", "Asset system"]
    }
  },
  {
    entityType: "service_addon",
    entityId: "addon-brand-naming",
    fields: {
      title: "Naming",
      description: "Name directions reviewed for meaning, sound, and visual potential."
    }
  },
  {
    entityType: "service_addon",
    entityId: "addon-brand-template",
    fields: {
      title: "Team templates",
      description: "Editable templates for documents and publications."
    }
  },
  {
    entityType: "service",
    entityId: "svc-social",
    fields: {
      title: "Social media design",
      description: "A visual system for posts, covers, stories, and campaign assets.",
      details: "Reusable templates help teams publish consistently without losing the brand style."
    }
  },
  {
    entityType: "service_package",
    entityId: "pkg-social-start",
    fields: {
      title: "Starter",
      description: "Profile styling and a set of launch-ready publications.",
      badge: "Basic",
      bestFor: "Launching or carefully refreshing a profile",
      outcome: "A polished profile and the first ready-to-publish materials",
      includedItems: ["Avatar", "Covers", "6 post templates"]
    }
  },
  {
    entityType: "service_package",
    entityId: "pkg-social-system",
    fields: {
      title: "Content system",
      description: "A modular grid and templates for recurring content formats.",
      badge: "Recommended",
      bestFor: "Regular content across several formats",
      outcome: "A flexible system for preparing publications in-house",
      includedItems: ["Grid", "12 templates", "Covers", "Guide"]
    }
  },
  {
    entityType: "service_package",
    entityId: "pkg-social-month",
    fields: {
      title: "One-month support",
      description: "Publication design and format adaptations throughout one month.",
      badge: "Support",
      bestFor: "A team that needs regular design support",
      outcome: "A complete month of visual content",
      includedItems: ["Up to 20 posts", "Stories", "Covers", "Adaptations"]
    }
  },
  {
    entityType: "service_addon",
    entityId: "addon-social-ads",
    fields: { title: "Ad creatives", description: "Additional formats for advertising campaigns." }
  },
  {
    entityType: "service_addon",
    entityId: "addon-social-animation",
    fields: {
      title: "Post animation",
      description: "Simple animation for selected social media layouts."
    }
  },
  {
    entityType: "service",
    entityId: "svc-packaging",
    fields: {
      title: "Packaging and print",
      description: "Packaging, labels, and print materials prepared for production.",
      details: "Layouts follow the technical requirements of the selected printer or manufacturer."
    }
  },
  {
    entityType: "service_package",
    entityId: "pkg-packaging-item",
    fields: {
      title: "Single item",
      description: "Design for one package, label, or print item.",
      badge: "One task",
      bestFor: "A single product or promotional item",
      outcome: "A production-ready layout",
      includedItems: ["Concept", "Layout", "Prepress preparation"]
    }
  },
  {
    entityType: "service_package",
    entityId: "pkg-packaging-line",
    fields: {
      title: "Product line",
      description: "A packaging system for several flavors or product variants.",
      badge: "Recommended",
      bestFor: "A family of related products",
      outcome: "One visual system and a production file set",
      includedItems: ["Packaging system", "Up to 4 variants", "Production files"]
    }
  },
  {
    entityType: "service_package",
    entityId: "pkg-packaging-complex",
    fields: {
      title: "Complete set",
      description: "Packaging, labels, and supporting printed materials.",
      badge: "Complete",
      bestFor: "A product launch with several customer touchpoints",
      outcome: "A full packaging and print material set",
      includedItems: ["Packaging", "Labels", "Inserts", "POS materials"]
    }
  },
  {
    entityType: "service_addon",
    entityId: "addon-packaging-prepress",
    fields: {
      title: "Prepress review",
      description: "Review of dielines, bleed, and technical production requirements."
    }
  },
  {
    entityType: "service_addon",
    entityId: "addon-packaging-mockup",
    fields: {
      title: "Presentation mockups",
      description: "Photorealistic packaging images for websites and presentations."
    }
  },
  {
    entityType: "service",
    entityId: "svc-presentation",
    fields: {
      title: "Presentations",
      description: "Structure and visual design for sales, reports, and expert talks.",
      details: "The work covers visual logic, pacing, hierarchy, and emphasis."
    }
  },
  {
    entityType: "service_package",
    entityId: "pkg-presentation-10",
    fields: {
      title: "Up to 10 slides",
      description: "A concise deck for a talk, pitch, or proposal.",
      badge: "Short format",
      bestFor: "A pitch, meeting, or short presentation",
      outcome: "A ready presentation of up to 10 slides",
      includedItems: ["Structure", "Design", "Final file"]
    }
  },
  {
    entityType: "service_package",
    entityId: "pkg-presentation-20",
    fields: {
      title: "Up to 20 slides",
      description: "A detailed deck with diagrams and strong visual emphasis.",
      badge: "Recommended",
      bestFor: "Sales, reporting, or an expert presentation",
      outcome: "A coherent presentation of up to 20 slides",
      includedItems: ["Structure", "Design", "Diagrams", "Final file"]
    }
  },
  {
    entityType: "service_package",
    entityId: "pkg-presentation-system",
    fields: {
      title: "Template system",
      description: "A presentation plus an editable master-slide system for the team.",
      badge: "For teams",
      bestFor: "Regular in-house presentation production",
      outcome: "A template, slide library, and usage rules",
      includedItems: ["Master slides", "Block library", "Example deck", "Guide"]
    }
  },
  {
    entityType: "service_addon",
    entityId: "addon-presentation-copy",
    fields: {
      title: "Structure editing",
      description: "Help with shortening and organizing the source material."
    }
  },
  {
    entityType: "service_addon",
    entityId: "addon-presentation-animation",
    fields: {
      title: "Slide animation",
      description: "Careful transitions and staged element reveals."
    }
  },
  {
    entityType: "service",
    entityId: "svc-web",
    fields: {
      title: "Web design",
      description: "Prototype and visual design for a website or digital product.",
      details: "Layouts are prepared for development and include the key interface states."
    }
  },
  {
    entityType: "service_package",
    entityId: "pkg-web-landing",
    fields: {
      title: "Landing page",
      description: "A single-page website with key sections and responsive states.",
      badge: "Fast launch",
      bestFor: "A service, product, or event with one primary goal",
      outcome: "A development-ready landing page design",
      includedItems: ["Prototype", "Design", "Mobile version", "UI kit"]
    }
  },
  {
    entityType: "service_package",
    entityId: "pkg-web-corporate",
    fields: {
      title: "Corporate website",
      description: "A multi-page company website with a shared component system.",
      badge: "Recommended",
      bestFor: "A company with several services and content sections",
      outcome: "A system of key page layouts and responsive versions",
      includedItems: ["Prototype", "Up to 8 pages", "Responsive layouts", "UI kit"]
    }
  },
  {
    entityType: "service_package",
    entityId: "pkg-web-product",
    fields: {
      title: "Product interface",
      description: "User flows and interface design for a web service or account area.",
      badge: "Product",
      bestFor: "A digital service with an account area and complex flows",
      outcome: "A prototype and design for the key product scenarios",
      includedItems: ["User flows", "Prototype", "Interface", "Components"]
    }
  },
  {
    entityType: "service_addon",
    entityId: "addon-web-copy",
    fields: {
      title: "Content structure",
      description: "Headline editing and help with the content of key sections."
    }
  },
  {
    entityType: "service_addon",
    entityId: "addon-web-prototype",
    fields: {
      title: "Clickable prototype",
      description: "A connected interactive flow for presentation and testing."
    }
  },
  {
    entityType: "project",
    entityId: "project-north-coffee",
    fields: {
      title: "North Coffee Roasters",
      shortDescription: "Packaging and print system for a specialty coffee roaster.",
      fullDescription:
        "The coffee line uses color-coded packaging for flavor navigation together with a coordinated set of point-of-sale materials."
    }
  },
  {
    entityType: "project",
    entityId: "project-botanica",
    fields: {
      title: "Botanica Lab",
      shortDescription: "Identity and packaging for a natural skincare line.",
      fullDescription:
        "The visual system combines laboratory precision with a soft natural aesthetic across packaging and communication materials."
    }
  },
  {
    entityType: "project",
    entityId: "project-studio-frame",
    fields: {
      title: "Studio Frame",
      shortDescription: "A digital announcement and social media system for a photo studio.",
      fullDescription:
        "A modular grid and reusable templates let the team publish regularly while keeping the visual identity consistent."
    }
  },
  {
    entityType: "project",
    entityId: "project-urban-forum",
    fields: {
      title: "Urban Forum Deck",
      shortDescription: "Presentation design for an urban education forum.",
      fullDescription:
        "The slides follow a clear speaking narrative and combine large typography, maps, and structured information blocks."
    }
  },
  {
    entityType: "project",
    entityId: "project-atelier-nord",
    fields: {
      title: "Atelier Nord",
      shortDescription: "Restrained identity for an architecture studio.",
      fullDescription:
        "The mark, typography, and business materials create a calm and professional image for the architecture practice."
    }
  },
  {
    entityType: "project",
    entityId: "project-lumen-skincare",
    fields: {
      title: "Lumen Skincare",
      shortDescription: "Packaging and a landing page for a skincare line.",
      fullDescription:
        "The project combines tactile packaging, a calm palette, and a digital presentation of the product range."
    }
  },
  {
    entityType: "project",
    entityId: "project-mellow-bakery",
    fields: {
      title: "Mellow Bakery",
      shortDescription: "Warm packaging and social media design for an urban bakery.",
      fullDescription:
        "The system covers bakery packaging, seasonal materials, and publication templates in one friendly visual language."
    }
  },
  {
    entityType: "project",
    entityId: "project-vector-summit",
    fields: {
      title: "Vector Summit",
      shortDescription: "Identity and presentation system for a technology conference.",
      fullDescription:
        "High-contrast graphics connect posters, digital announcements, and speaker presentation templates."
    }
  },
  {
    entityType: "project",
    entityId: "project-arc-habitat",
    fields: {
      title: "Arc Habitat",
      shortDescription: "Corporate website and sales materials for a residential project.",
      fullDescription:
        "The web system presents architecture, layouts, and project benefits through large imagery and clear navigation."
    }
  },
  {
    entityType: "project",
    entityId: "project-terra-market",
    fields: {
      title: "Terra Market",
      shortDescription: "Identity and packaging for a local grocery store.",
      fullDescription:
        "A flexible label and print system brings products from different makers together under one store brand."
    }
  }
] as const;

const projectImageRows = rows
  .filter((row) => row.entityType === "project")
  .map((row) => ({
    entityType: "image" as const,
    entityId: `${row.entityId}-gallery-1`,
    fields: {
      title: row.fields.title,
      caption: `Project material: ${row.fields.title}`
    }
  }));

export const demoEnglishTranslations = createTranslationLookup([
  ...rows,
  ...projectImageRows
]);
