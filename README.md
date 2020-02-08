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

```json
{
    "pagesDir": "./pages",
    "outputDir": "./dist",
    "components": [
        {
            "name": "navigation",
            "path": "./components/navigation.html"
        },
        {
            "name": "header",
            "path": "./components/header.html"
        }
    ]
}
```

To use a define component use handlebars syntax like so:

```html
{{ navigation }}

{{ header }}
```

When ready to compile your pages with the components run the braze command:

`braze`

Or create a package.json script:

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
