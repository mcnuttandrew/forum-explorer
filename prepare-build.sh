yarn
yarn build
rm -rf dist
mkdir dist
cp bundle.js ./dist/
cp manifest.json ./dist/
