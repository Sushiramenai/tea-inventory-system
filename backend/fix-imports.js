const fs = require('fs');
const path = require('path');

// Fix imports in all TypeScript files
function fixImports(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.includes('node_modules')) {
      fixImports(filePath);
    } else if (file.endsWith('.ts')) {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Replace Prisma enum imports with our constants
      content = content.replace(
        /import\s*{\s*([^}]*)\s*}\s*from\s*['"]@prisma\/client['"]/g,
        (match, imports) => {
          const enumsToReplace = ['UserRole', 'ProductCategory', 'ProductSizeFormat', 'MaterialCategory', 'MaterialUnit', 'RequestStatus', 'AuditAction'];
          const importsList = imports.split(',').map(i => i.trim());
          const prismaImports = importsList.filter(i => !enumsToReplace.includes(i));
          const enumImports = importsList.filter(i => enumsToReplace.includes(i));
          
          let result = '';
          if (prismaImports.length > 0) {
            result += `import { ${prismaImports.join(', ')} } from '@prisma/client'`;
          }
          if (enumImports.length > 0) {
            if (result) result += ';\n';
            result += `import { ${enumImports.join(', ')} } from '../constants/enums'`;
          }
          return result;
        }
      );
      
      // Write back the fixed content
      if (content !== fs.readFileSync(filePath, 'utf8')) {
        fs.writeFileSync(filePath, content);
        console.log(`Fixed imports in: ${filePath}`);
      }
    }
  });
}

// Run the fix
fixImports(path.join(__dirname, 'src'));
console.log('Import fixes completed!');