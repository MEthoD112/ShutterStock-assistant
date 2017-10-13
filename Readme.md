### INSTRUCTIONS

1. Insert your shutterstock portfolio first page url in parse.js and create in root folders images(folder for local images) and previews(folder for previews downloading from shutterstock).
2. Run **npm run parse** for parsing portfolio. Result: /data/previews.json.
3. Run **npm run downloadPreviews** for downloading previews. Result: /previews/.
4. Run **npm run getPreviewsHash** for getting hashes for previews. Result: /data/previewsWithHash.json .
5. Run **npm run getLocalImagesHashes** for getting hashes for local images. Result: /data/imagesWithHash.json .
6. Run **npm run compare** will find the same images and previews. Result: /data/compare.json .