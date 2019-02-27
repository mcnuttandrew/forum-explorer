./prepare-build.sh
mv .gitignore .gitignore-temp
mv .gitignore-website .gitignore
git branch -D gh-pages
git branch gh-pages
git checkout gh-pages
git add --a
git commit -m 'bump website'
# git push --set-upstream origin gh-pages -f
# mv .gitignore .gitignore-website
# mv .gitignore-temp .gitignore
