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

Start by creating a configuration file to tell braze where your components and HTML pages are.

Make sure the `braze.json` file is in your project root.

Example braze.json file: 

```javascript
{
    // Static HTML files that use your components
    "pagesDir": "./pages",

    // Directory to output compiled files to
    "outputDir": "./dist",

    // Location of your .html component files (optional)
    "componentsDir": "./components",

    // optional additonal properties to use in context when compiling
    "props": {
        "appTitle": "The best app"
    }
}
```

To use a define component use handlebars syntax like so:

```html
{{ navigation }}

{{ header }}
```

Where the string used between the `{{}}` is the base file name. For example the component file name `navigation.html` will available as `navigation`.

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
