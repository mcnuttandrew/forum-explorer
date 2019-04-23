yarn
mv src/constants/test-data.json src/constants/test-data-large.json
mv src/constants/small-data.json src/constants/test-data.json
yarn build
cp manifest.json ./dist/
cp app-bundle.js ./dist/
cp background-bundle.js ./dist/
mv src/constants/test-data.json src/constants/small-data.json
mv src/constants/test-data-large.json src/constants/test-data.json
