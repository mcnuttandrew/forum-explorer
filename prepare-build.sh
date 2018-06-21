yarn
mv src/constants/test-data.json src/constants/test-data-large.json
mv src/constants/small-data.json src/constants/test-data.json
yarn build
rm -rf dist
mkdir dist
cp bundle.js ./dist/
cp manifest.json ./dist/
mv src/constants/test-data.json src/constants/small-data.json
mv src/constants/test-data-large.json src/constants/test-data.json
