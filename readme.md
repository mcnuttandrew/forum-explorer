# Forum Viewer

This chrome extension enables users to explore forum structured data (specifically hackernews) in a top down manner. This allows for easy understanding of the flow of conversations over time.

To run in development mode  

```sh
yarn

yarn start
```
Point your browser to 8080

To create a build, make sure development mode is off (see constants file) and then run

```sh
./prepare-build.sh
```

TODO:
- Enable commenting (login/reply button/post button)
- experiment with force direct graphs?
- write tests
- search?
