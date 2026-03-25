export const brand = {
  name: "Varit",
  shortName: "V",
  tagline: "Study Cards for your kid",
  sectionTitle: "Study Cards",
  description: "Collect and organize media to send to your kid daily",
} as const;

export const appMetadata = {
  title: `${brand.name} - ${brand.tagline}`,
  description: brand.description,
} as const;
