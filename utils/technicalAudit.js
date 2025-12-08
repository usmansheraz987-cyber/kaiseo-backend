// utils/technicalAudit.js
module.exports = function technicalAudit(extracted, html) {
  const issues = [];

  // === CANONICAL ===
  if (!extracted.canonical) {
    issues.push("Canonical tag missing");
  }

  // === H1 CHECK ===
  const h1s = extracted.headings?.h1 || [];
  if (h1s.length === 0) issues.push("No H1 tag found");
  if (h1s.length > 1) issues.push("Multiple H1 tags detected");

  // === TITLE LENGTH ===
  if (!extracted.title) {
    issues.push("Missing <title> tag");
  } else {
    const len = extracted.title.length;
    if (len < 20) issues.push("Title is too short (<20 chars)");
    if (len > 60) issues.push("Title is too long (>60 chars)");
  }

  // === META DESCRIPTION ===
  if (!extracted.metaDescription) {
    issues.push("Missing meta description");
  } else {
    const len = extracted.metaDescription.length;
    if (len < 50) issues.push("Meta description too short (<50 chars)");
    if (len > 160) issues.push("Meta description too long (>160 chars)");
  }

  // === OG TAGS ===
  if (!extracted.ogTitle) issues.push("Missing Open Graph OG:title");
  if (!extracted.ogDescription) issues.push("Missing Open Graph OG:description");

  // === ROBOTS ===
  if (!extracted.robots) issues.push("Missing meta robots tag");

  // === STRUCTURED DATA ===
  if (!html.includes("application/ld+json")) {
    issues.push("Missing JSON-LD structured data");
  }

  // === IMAGE ALT ATTRIBUTES ===
  const images = extracted.images || [];
  const missingAlt = images.filter(img => !img.alt || img.alt.trim() === "");
  if (missingAlt.length > 0) {
    issues.push(`${missingAlt.length} images missing ALT attribute`);
  }

  // === BROKEN LINKS (basic check by status) ===
  const broken = [
    ...extracted.internalLinks.filter(l => l.status >= 400),
    ...extracted.externalLinks.filter(l => l.status >= 400)
  ];
  if (broken.length > 0) {
    issues.push(`${broken.length} broken links detected`);
  }

  // === EMPTY OR THIN CONTENT ===
  if (extracted.wordCount < 200) {
    issues.push("Thin content: fewer than 200 words");
  }

  // === DUPLICATE TITLE/OG ===
  if (extracted.title === extracted.ogTitle) {
    issues.push("Title and OG:title are identical (low optimization)");
  }

  // === HTTPS CHECK ===
  if (extracted.canonical && !extracted.canonical.startsWith("https://")) {
    issues.push("Canonical URL is not HTTPS");
  }

  return {
    issues,
    passed: issues.length === 0
  };
};
