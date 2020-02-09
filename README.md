![NPM Version](https://badge.fury.io/js/braze.svg)

# Braze

Orchestrator of re-useable HTML components to generate a static site without having to rewrite common code.

## How to install

### Install globally

Run the command anywhere:

`npm install -g braze`

`sudo` prefix might be required on some computers.

### Install in a project

Run the command:

`npm install --save braze`

## Usage

### Configuration File

Start by creating a configuration file to tell braze where your components and HTML pages are.

Make sure the `braze.js` file is in your project root.

Example braze.js file: 

```javascript
module.exports = {
    // Static HTML files that use your components
    pagesDir: "./pages",

    // Directory to output compiled files to
    outputDir: "./dist",

    // Location of your .html component files (optional)
    componentsDir: "./components",

    // optional additonal properties to use in context when compiling
    props: {
        "appTitle": "The best app"
    },

    // if you want the output to be minified or not
    minifyOutput: true,

    helpers: {
        ucase: (string) => string.toUpperCase(),
    },
}
```

### Components

To use a define component use handlebars syntax like so:

```html
{{ navigation }}
{{ header }}
```

Where the string used between the `{{}}` is the base file name. For example the component file name `navigation.html` will available as `navigation`.

Components support all [Handlebars](https://handlebarsjs.com/guide) syntax including loops. For example:

**braze.js**
```javascript
module.exports = {
    "props": {
        "people": ["Sam", "John", "Alex"]
    }
}
```

**component HTML file**
```html
<ul>
    {{#each people}}
        <li>{{this}}</li>
    {{/each}}
</ul>
```

### Building

When ready to compile your pages with the components run the braze command (if installed globally):

`braze`

Or create a package.json script (if installed at project level):

```json
{
    "name": "my-project",
    "scripts": {
        "start": "node app.js",
        "build": "braze"
    }
}
```

and run the command `npm run build`.


### Using Helpers

To use helper functions in your HTML pages, define functions in your braze.js file like so:

```javascript
{
    props: {
        name: 'John',
    },
    helpers: {
        ucase: (string) => string.toUpperCase(),
    }
}
```

and in your HTML:

```html
{{ ucase name }}
```
