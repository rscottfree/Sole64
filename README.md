# SOLE 64 - Simple Operating and Learning Environment

_This is an old Chrome App I created (when that was a thing) that has since been converted to run as a static web application._

I wanted to create an application that made learning computer programming as accessible, with immediate access to the programming environment, an easy-to-learn Basic-like programming language, and a manual to get your started. Inspiration was taken from my own experience on the Commodore 64.

![screenshot](sole64screenshot.png)

## Demo
You can see the app running here: [https://rscottfree.github.io/Sole64/sole64.html](https://rscottfree.github.io/Sole64/sole64.html)

## Implementation
The Basic-like language is transpiled to JavaScript and executed.

The text and 2D graphics modes are rendered to Canvas elements, and there is a third 3D graphics mode using Three.js that is rendered in a WebGL context.

The user manual can be accessed within the app by typing `help` and hitting return.

The original Chrome App has special APIs which this version of the app cannot use; some functionality has been removed. The original app also had a backend component in Google App Engine that could load & save user files to the cloud, and load tutorials; these have been removed.

----

## Run Locally
_requires Node.js & NPM_

Clone the repository
```
npm install
npm start
```
Navigate to http://localhost:8080/sole64.html
