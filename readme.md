# Forum Viewer

This chrome extension enables users to explore forum structured data (specifically hackernews) in a top down manner. This allows for easy understanding of the flow of conversations over time.

To run in development mode  

```sh
yarn

yarn start
```
Point your browser to 8080. For topic modeling it is also necessary to have the model server running, this can be done by running

```sh
yarn serve
```

To create a build, make sure development mode is off (see constants file) run

```sh
./prepare-build.sh
```

TODO:
- experiment with force direct graphs?
- write tests
- search?
- persist settings
- automatic defaults
- add annotation mode (eg we highlight which posts we think are the most important)
