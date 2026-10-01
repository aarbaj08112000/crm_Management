import fs from 'fs';
import path from 'path';

function replaceInDir(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceInDir(fullPath);
    } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js') || fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      const original = content;
      
      content = content.replace(/bg-\[\#5b21b6\]/g, 'bg-blue-600');
      content = content.replace(/hover:bg-\[\#4c1d95\]/g, 'hover:bg-blue-700');
      content = content.replace(/bg-\[\#5145f6\]/g, 'bg-blue-600');
      content = content.replace(/hover:bg-\[\#4135e6\]/g, 'hover:bg-blue-700');
      content = content.replace(/text-\[\#5145f6\]/g, 'text-blue-600');
      content = content.replace(/shadow-\[\#5145f6\]\/20/g, 'shadow-blue-600/20');
      
      content = content.replace(/bg-indigo-600/g, 'bg-blue-600');
      content = content.replace(/hover:bg-indigo-700/g, 'hover:bg-blue-700');
      content = content.replace(/text-indigo-600/g, 'text-blue-600');
      content = content.replace(/text-indigo-500/g, 'text-blue-500');
      content = content.replace(/text-indigo-400/g, 'text-blue-400');
      content = content.replace(/text-indigo-700/g, 'text-blue-700');
      content = content.replace(/bg-indigo-50/g, 'bg-blue-50');
      content = content.replace(/bg-indigo-100/g, 'bg-blue-100');
      content = content.replace(/border-indigo-200/g, 'border-blue-200');
      content = content.replace(/shadow-indigo-500\/20/g, 'shadow-blue-500/20');
      
      content = content.replace(/from-pink-500 via-purple-500 to-indigo-600/g, 'from-blue-400 via-blue-500 to-blue-600');
      content = content.replace(/shadow-\[0_0_20px_rgba\(217,70,239,0\.25\)\]/g, 'shadow-[0_0_20px_rgba(59,130,246,0.25)]');
      
      if (original !== content) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

replaceInDir(path.join(process.cwd(), 'app'));
replaceInDir(path.join(process.cwd(), 'components'));
