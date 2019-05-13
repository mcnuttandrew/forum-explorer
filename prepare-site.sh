git branch -D prep-deploy
git branch prep-deploy
git checkout prep-deploy
node scripts/set-webpage-mode.js true
git add --a
git commit -m 'deploy'
./prepare-build.sh
mv .gitignore .gitignore-temp
mv .gitignore-website .gitignore
git branch -D gh-pages
git branch gh-pages
git checkout gh-pages
git add --a
git commit -m 'bump website'
git push --set-upstream origin gh-pages -f
mv .gitignore .gitignore-website
mv .gitignore-temp .gitignore
git add --a
git stash
git checkout master
