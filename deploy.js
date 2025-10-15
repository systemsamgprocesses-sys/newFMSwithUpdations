#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 FMS Deployment Script');
console.log('========================\n');

// Check if dist folder exists
if (!fs.existsSync('dist')) {
  console.log('📦 Building project...');
  try {
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✅ Build completed successfully!\n');
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

// Check for deployment options
console.log('🎯 Deployment Options:');
console.log('1. Vercel (Recommended for React apps)');
console.log('2. Netlify (Great alternative)');
console.log('3. GitHub Pages (Static hosting)');
console.log('4. Manual upload to any hosting provider\n');

console.log('📋 Quick Deploy Commands:');
console.log('• Vercel: npx vercel --prod');
console.log('• Netlify: npx netlify deploy --prod --dir=dist');
console.log('• GitHub Pages: npm run build && npx gh-pages -d dist\n');

console.log('💡 Your app is ready to deploy!');
console.log('   Frontend: dist/ folder');
console.log('   Backend: server.js (proxy server)');
console.log('   Config: vercel.json, netlify.toml\n');

console.log('🔥 Go make that empire, Krish!');
