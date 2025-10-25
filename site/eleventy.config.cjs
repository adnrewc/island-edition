const { resolve } = require('path');
const eleventyNavigationPlugin = require('@11ty/eleventy-navigation');
const { minify } = require('html-minifier-terser');
const { DateTime } = require('luxon');

module.exports = function (eleventyConfig) {
  const assetPath = resolve(__dirname, 'src/assets');
  const includesPath = resolve(__dirname, 'src/_includes');
  const isProduction = process.env.ELEVENTY_ENV === 'production';

  eleventyConfig.addPlugin(eleventyNavigationPlugin);
  eleventyConfig.addWatchTarget(`${assetPath}/css/`);
  eleventyConfig.addWatchTarget(includesPath);
  eleventyConfig.addPassthroughCopy({ [assetPath]: 'assets' });

  eleventyConfig.addNunjucksFilter('date', (value, format = 'MMMM d, yyyy') => {
    if (!value) return '';
    const date = DateTime.fromISO(value, { zone: 'utc' });
    if (!date.isValid) {
      return value;
    }
    return date.toFormat(format);
  });

  eleventyConfig.addNunjucksFilter('dateRss', (value) => {
    if (!value) return '';
    const date = DateTime.fromISO(value, { zone: 'utc' });
    return date.isValid ? date.toRFC2822() : value;
  });

  eleventyConfig.addTransform('html-minify', async function (content, outputPath) {
    if (!isProduction || !outputPath?.endsWith('.html')) {
      return content;
    }

    return minify(content, {
      collapseWhitespace: true,
      removeComments: true,
      removeRedundantAttributes: true,
      useShortDoctype: true,
      minifyCSS: true,
      minifyJS: true
    });
  });

  eleventyConfig.addShortcode('preload', (href) => {
    return `<link rel="preload" href="${href}" as="style">`;
  });

  eleventyConfig.setServerOptions({
    watch: [
      resolve(__dirname, 'src/pages'),
      includesPath,
      resolve(__dirname, 'src/issues')
    ]
  });

  return {
    dir: {
      input: 'src',
      includes: '_includes',
      data: 'data',
      layouts: '_includes',
      output: '_site'
    },
    htmlTemplateEngine: 'njk',
    markdownTemplateEngine: 'njk'
  };
};
