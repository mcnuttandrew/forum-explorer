./prepare-build.sh
mv .gitignore .gitignore-temp
mv .gitignore-website .gitignore
git branch -D gh-pages
git branch gh-pages
git checkout gh-pages
git add --a
git commit -m 'bump website'
