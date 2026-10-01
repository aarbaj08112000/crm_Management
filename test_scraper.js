const { runLocalScraper } = require('./lib/localScraper.js');
runLocalScraper({
  "searchStringsArray": ["industrial manufacturing companies in Pune"],
  "maxCrawledPlacesPerSearch": 2
}).then(console.log).catch(console.error);
