import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEO = ({
  title,
  description,
  keywords,
  ogImage,
  ogType = 'website',
  canonical,
  noindex = false,
}) => {
  const siteUrl = process.env.REACT_APP_BACKEND_URL?.replace('/api', '') || 'https://geeessopticals.com';
  const brandName = 'Gee Ess Opticals';
  const defaultDescription = 'Shop premium eyewear online at Gee Ess Opticals. Discover stylish glasses, sunglasses, and frames from top brands. Quality eyewear for men, women, and kids.';
  const defaultKeywords = 'eyewear online, glasses, sunglasses, premium frames, eyeglasses, optical store, designer frames, prescription glasses';
  const defaultOgImage = 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=1200&h=630&fit=crop';

  const fullTitle = title ? `${title} | ${brandName}` : brandName;
  const fullDescription = description || defaultDescription;
  const fullKeywords = keywords ? `${keywords}, ${defaultKeywords}` : defaultKeywords;
  const fullOgImage = ogImage || defaultOgImage;
  const fullCanonical = canonical || window.location.href;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={fullDescription} />
      <meta name="keywords" content={fullKeywords} />
      {noindex && <meta name="robots" content="noindex,nofollow" />}
      <link rel="canonical" href={fullCanonical} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={fullCanonical} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={fullDescription} />
      <meta property="og:image" content={fullOgImage} />
      <meta property="og:site_name" content={brandName} />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={fullCanonical} />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={fullDescription} />
      <meta property="twitter:image" content={fullOgImage} />

      {/* Additional SEO */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
      <meta name="language" content="English" />
      <meta name="author" content={brandName} />
    </Helmet>
  );
};

export default SEO;
