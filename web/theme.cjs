const fs = require('fs');
const path = require('path');

const replacements = [
  // Colors
  { from: /#0e0e0e/gi, to: '#07050f' },
  { from: /#131313/gi, to: '#0e0a18' },
  { from: /#1c1b1b/gi, to: '#151025' },
  { from: /#201f1f/gi, to: '#1c1532' },
  { from: /#2a2a2a/gi, to: '#261c44' },
  { from: /#353534/gi, to: '#33255b' },
  
  // Text colors
  { from: /#e5e2e1/gi, to: '#f4f4fa' },
  { from: /#e0c0af/gi, to: '#e2dced' },
  { from: /#ddc2a2/gi, to: '#c8bcdf' },
  { from: /#a78b7c/gi, to: '#9a8dba' },
  { from: /#584235/gi, to: '#62557e' },

  // Orange theme -> Neon Cyber theme
  { from: /#FF7A00/gi, to: '#bc13fe' }, // Neon Purple
  { from: /#FFB68B/gi, to: '#00e5ff' }, // Cyan
  { from: /#FFDE56/gi, to: '#00ffb3' }, // Seafoam Green
  { from: /#321200/gi, to: '#ffffff' }, // text on primary
  
  // rgba overlaps
  { from: /rgba\(\s*255\s*,\s*122\s*,\s*0/gi, to: 'rgba(188, 19, 254' }, // neon purple RGB
  { from: /rgba\(\s*32,\s*31,\s*31/g, to: 'rgba(22, 15, 45' }, // glass backdrops
  { from: /rgba\(\s*19,\s*19,\s*19/g, to: 'rgba(14, 10, 24' },
  { from: /rgba\(\s*14,\s*14,\s*14/g, to: 'rgba(7, 5, 15' },
  { from: /rgba\(\s*147,\s*0,\s*10/g, to: 'rgba(255, 0, 85' }, // Error bg
  
  // classes
  { from: /btn-orange/g, to: 'btn-primary' }
];

const walks = function(dir, done) {
  let results = [];
  fs.readdir(dir, function(err, list) {
    if (err) return done(err);
    let pending = list.length;
    if (!pending) return done(null, results);
    list.forEach(function(file) {
      file = path.resolve(dir, file);
      fs.stat(file, function(err, stat) {
        if (stat && stat.isDirectory()) {
          walks(file, function(err, res) {
            results = results.concat(res);
            if (!--pending) done(null, results);
          });
        } else {
          results.push(file);
          if (!--pending) done(null, results);
        }
      });
    });
  });
};

walks('./src', function(err, results) {
  if (err) throw err;
  results.filter(f => f.endsWith('.css') || f.endsWith('.jsx')).forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    replacements.forEach(r => {
      content = content.replace(r.from, r.to);
    });

    // Special enhancements for glassmorphism
    if (file.endsWith('index.css')) {
      content = content.replace(
        /backdrop-filter:\s*blur\(20px\);/g, 
        'backdrop-filter: blur(24px) saturate(150%);'
      );
      content = content.replace(
        /-webkit-backdrop-filter:\s*blur\(20px\);/g, 
        '-webkit-backdrop-filter: blur(24px) saturate(150%);'
      );
    }

    if (content !== original) {
      fs.writeFileSync(file, content);
      console.log(`Updated ${path.basename(file)}`);
    }
  });
});
