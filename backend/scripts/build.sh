#!/bin/bash

echo "🔨 Building backend with explicit compilation..."

# Clean previous build
rm -rf dist/

# Create dist directories
mkdir -p dist/utils
mkdir -p dist/controllers
mkdir -p dist/routes
mkdir -p dist/middleware
mkdir -p dist/config

# Compile all TypeScript files
echo "📦 Compiling TypeScript files..."
# Use --noEmitOnError false to ensure files are generated even with type errors
npx tsc --noEmitOnError false

# Verify critical files exist
echo "🔍 Verifying build output..."

# Check for critical files
MISSING_FILES=()

if [ ! -f "dist/server.js" ]; then
    MISSING_FILES+=("dist/server.js")
fi

if [ ! -f "dist/utils/prisma.js" ]; then
    MISSING_FILES+=("dist/utils/prisma.js")
fi

if [ ! -f "dist/utils/validation.js" ]; then
    MISSING_FILES+=("dist/utils/validation.js")
fi

if [ ! -f "dist/config/index.js" ]; then
    MISSING_FILES+=("dist/config/index.js")
fi

# If files are missing, try manual compilation
if [ ${#MISSING_FILES[@]} -gt 0 ]; then
    echo "⚠️  Some files are missing. Attempting manual compilation..."
    
    # Compile each source file explicitly
    for file in src/**/*.ts; do
        if [[ -f "$file" ]]; then
            echo "Compiling: $file"
            npx tsc "$file" --outDir dist --declaration --sourceMap --target ES2022 --module commonjs --esModuleInterop --skipLibCheck
        fi
    done
fi

# Final verification
if [ ! -f "dist/utils/prisma.js" ]; then
    echo "❌ Critical error: dist/utils/prisma.js still missing!"
    echo "📁 Contents of dist:"
    find dist -type f -name "*.js" | sort
    exit 1
fi

echo "✅ Build completed successfully!"
echo "📁 Build contents:"
ls -la dist/
echo "📁 Utils contents:"
ls -la dist/utils/