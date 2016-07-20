// (C) Copyright 2014-2016 Hewlett Packard Enterprise Development LP

var path = require('path');
var fs = require('fs');

/**
* The css content file might have import paths that only exists
* inside the default theme.
* This function will replace those paths to be the default one,
* instead of the one from the theme (which does not exist)
**/
function applyDefaultPathForUnexistingFiles (cssContent, themePath) {
  const themePathRegex = /('|")(\$\(?themePath\)?)(.*)('|")/g;
  const imports = cssContent.match(themePathRegex);

  let content = cssContent;
  if (imports) {
    imports.forEach(function(atImport) {
      const localThemeRegex = /('|")(\$\(?themePath\)?)(.*)('|")/;
      const importGroup = localThemeRegex.exec(atImport);
      const filePath = importGroup[3];
      var componentPath = path.join(themePath, filePath);

      try {
        fs.accessSync(componentPath);
      } catch (e) {
        content = content.replace(atImport, '"grommet/styles/' + filePath + '"');
      }
    });
  }

  return content;
}

function themeLoader (content) {
  this.addDependency(this.resourcePath);

  var cssFile = path.basename(this.resourcePath);
  var baseFolder = path.basename(path.dirname(this.resourcePath));
  let callback = this.async();

  var themePath = this.options.grommetTheme ?
    this.options.grommetTheme.themePath :
    undefined;

  if (themePath) {
    var componentPath = path.join(themePath, baseFolder, cssFile);

    fs.readFile(componentPath, function (err, data) {
      if (err) {
        callback(null, applyDefaultPathForUnexistingFiles(content, themePath));
      } else {
        //return the theme content
        if (baseFolder === 'components') {
          content = content + data.toString();
          callback(null, applyDefaultPathForUnexistingFiles(content, themePath));
        } else {
          content = '@import "grommet/styles/base/' + cssFile + '";' + data.toString();
          callback(null, applyDefaultPathForUnexistingFiles(content, themePath));
        }
      }
    });
  } else {
    callback(null, applyDefaultPathForUnexistingFiles(content, themePath));
  }
};

module.exports = themeLoader;
