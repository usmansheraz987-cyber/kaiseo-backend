function scoreSeo(extracted = {}, { readability = {}, keywords = [] } = {}) {
  // Categories with max points
  const categories = {
    metadata: 20,
    headings: 15,
    content: 20,
    readability: 10,
    links: 10,
    images: 10,
    technical: 15
  };

  const actions = [];

  // metadata
  let metaScore = 0;
  if (extracted.title) {
    const len = extracted.title.length;
    if (len >= 50 && len <= 70) metaScore += 20;
    else metaScore += 10, actions.push('Title length should be 50-70 characters.');
  } else actions.push('Missing title tag.');

  if (extracted.metaDescription) {
    const dlen = extracted.metaDescription.length;
    if (dlen >= 50 && dlen <= 160) metaScore += 10;
    else metaScore += 5, actions.push('Meta description length should be 50-160 characters.');
  } else actions.push('Missing meta description.');

  // cap metadata to 20
  metaScore = Math.min(metaScore, categories.metadata);

  // headings
  let headingScore = 0;
  const h1count = (extracted.headings || []).filter(h => h.tag === 'h1').length;
  if (h1count === 1) headingScore += 15;
  else if (h1count === 0) actions.push('No H1 found.');
  else actions.push('Multiple H1 tags found; use a single H1.');

  // content
  const wordCount = (extracted.wordText || '').split(/\s+/).filter(Boolean).length;
  let contentScore = 0;
  if (wordCount >= 300) contentScore = 20;
  else if (wordCount >= 150) contentScore = 10, actions.push('Content length is low; aim for 300+ words.');
  else actions.push('Very short content; add more useful text.');

  // readability
  let readScore = 0;
  if (readability && readability.flesch) {
    const flesch = readability.flesch;
    if (flesch >= 60) readScore = 10;
    else if (flesch >= 40) readScore = 6, actions.push('Readability is moderate; consider simpler sentences.');
    else actions.push('Content is hard to read; lower sentence complexity.');
  }

  // links
  let linkScore = 0;
  const internal = (extracted.internalLinks || []).length;
  const external = (extracted.externalLinks || []).length;
  if (internal >= 1) linkScore += 5;
  if (external >= 1) linkScore += 5;

  // images
  let imageScore = 0;
  const totalImages = (extracted.images || []).length;
  const missingAlt = (extracted.images || []).filter(i => !i.alt).length;
  if (totalImages === 0) actions.push('No images found; images with descriptive alt attributes help SEO.');
  else {
    imageScore = Math.max(0, 10 - Math.round((missingAlt / totalImages) * 10));
    if (missingAlt > 0) actions.push(`${missingAlt} images missing alt attributes.`);
  }

  // technical
  let techScore = 0;
  if (extracted.canonical) techScore += 5;
  if (extracted.robots) techScore += 5;
  if (extracted.schema) techScore += 5;
  if (!extracted.canonical) actions.push('Consider adding a canonical URL.');
  if (!extracted.robots) actions.push('Add robots meta tag if needed.');

  // combine with weights
  const totalPossible = Object.values(categories).reduce((a,b)=>a+b,0);
  const totalGot = metaScore + headingScore + contentScore + readScore + linkScore + imageScore + techScore;
  const normalized = Math.round((totalGot / totalPossible) * 100);

  return { score: normalized, categories: { meta: metaScore, headings: headingScore, content: contentScore, readability: readScore, links: linkScore, images: imageScore, technical: techScore }, actions };
}

module.exports = scoreSeo;
