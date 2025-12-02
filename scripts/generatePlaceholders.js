import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const source = path.join(__dirname, '../public/assets/characters/pants.png');
const targets = ['body.png', 'hair.png', 'shirt.png'];

targets.forEach(target => {
    const dest = path.join(__dirname, '../public/assets/characters', target);
    if (!fs.existsSync(dest)) {
        fs.copyFileSync(source, dest);
        console.log(`Created placeholder ${target}`);
    } else {
        console.log(`${target} already exists`);
    }
});
