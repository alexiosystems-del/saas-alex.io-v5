try {
  const { franc } = require('franc-min');
  console.log('Detected:', franc('Hello world'));
} catch (e) {
  console.log('Require failed:', e.message);
  import('franc-min').then(({ franc }) => {
    console.log('Import worked:', franc('Hello world'));
  }).catch(err => {
    console.log('Import failed:', err.message);
  });
}
