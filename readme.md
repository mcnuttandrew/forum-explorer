# Forum Explorer

Forum Explorer is a web application that provides a principled rethinking of the way in which we interact with async threaded conversations on the internet through the use of visualization. We focus on HackerNews because of its active community and advantageous api. The normal operation mode for this project is as a chrome extension, although it also can be operated as a standalone website. You can take a look at the theoretical justification for this work in [this extended abstract](https://www.mcnutt.in/assets/forum-explorer-paper.pdf) or take a look at the [poster that goes along with it](https://www.mcnutt.in/assets/forum-explorer-poster.pdf).

## Usage

The simplest usage is to simply install the distributed chrome extension (see dist.zip). To install it, unzip the file, open the extensions page in chrome (chrome://extensions/), select "Load Unpacked". The extension is now installed. To use simply navigate to any hacker news page from https://news.ycombinator.com/news and enjoy.

Slightly more complexly, the application can be run in development mode. To do so, download and cd into the repo. Make sure you have node version >= 9 installed.  

```sh
npm install

npm run start
```
Point your browser to 8080.

We make use of a caching micro-service hosted on Heroku to serve amortize the cost of building and serving our LDA topic models. If you are NOT okay with using this cloud resource, then you can run the service locally. To do so open a second terminal and run

```sh
npm run serve
```

## Creating builds

To create a chrome extension build, make sure DEV_MODE=false (see constants/index) and then run

```sh
./prepare-build.sh
```
You can then install this in chrome as above. Nb: this uses yarn for deterministic installs, so you should have that installed in order to create builds appropriately.

To create a web page build, make sure DEV_MODE=false and WEB_PAGE_MODE=true and the run

```sh
./prepare-site.sh
```

This will attempt to push up to a gh-pages hosting for whatever repository the remote is connected to.

## Interesting Conversations

Maybe you are at a loss of which pages to look at? Here are a few interesting ones:
- [A really big one 19029801](https://www.mcnutt.in/forum-explorer/?id=19029801)
- [The biggest one found so far 14952787](https://www.mcnutt.in/forum-explorer/?id=14952787)
- [A "show HN" post to see the author posting a lot 19028449](https://www.mcnutt.in/forum-explorer/?id=19028449)

## Contributions

Thoughts and PRs are always welcome. Make sure any changes you want to add run correctly in the the development environment, see above.
