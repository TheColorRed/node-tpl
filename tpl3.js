var fs = require('fs');
var items = {};
var literal = {};
var cwd = __dirname;

/**
 * Sets the current working directory
 * @param {string} cd
 * @returns {undefined}
 */
exports.setcwd = function(cd){
    cwd = cd;
};

/**
 * Assigns a value to a key that will be replaced in the template
 * @param {string} key
 * @param {object} value
 * @returns {bool}
 */
exports.assign = function(key, value){
    value = typeof value !== "undefined" ? value : "";
    items[key] = value;
    return true;
};

/**
 * Gets a template and outputs the result
 * @param {string} filename
 * @returns {string}
 */
exports.display = function(filename){
    process.stdout.write(this.fetch(filename));
};

/**
 * Gets and returns the template.
 * @param {type} filename
 * @returns {string}
 */
exports.fetch = function(filename){
    var tpl = fs.readFileSync(getPath(filename), {encoding: 'utf8'});
//    tpl = getIncludes(tpl);
    tpl = iterate(tpl);
    return tpl;
};

iterate = function(tpl){
    var token = "";
    var tokens = [];
    var odelim = "{";
    var cdelim = "}";
    var inmarkup = false;
    for(var i in tpl){
        var char = tpl[i];
        if(char === odelim && tpl.substr(i - 1, 1) !== "\\" && !inmarkup){
            inmarkup = true;
        }
        if(inmarkup){
            token += char;
        }
        if(char === cdelim && tpl.substr(i - 1, 1) !== "\\" && inmarkup){
            inmarkup = false;
            tokens.push(token);
            token = "";
        }
    }
    return tpl;
};

getIncludes = function(tpl){
    var reg = /\{include\s+?['"](.+?)['"]\}/ig;
    var matches = tpl.match(reg);
    var n = 0;
    var includes = 0;
    tpl = tpl.replace(reg, function(){
        includes++;
        return "__include_" + (n++) + "__";
    });
    n = 0;
    for(var i in matches){
        var filename = /['"](.+?)['"]/ig.exec(matches[i]);
        if(filename[1]){
            var fname = replaceVars(filename[1], false);
            var file = fs.readFileSync(getPath(fname), {encoding: 'utf8'});
            tpl = tpl.replace("__include_" + n + "__", file);
        }
        n++;
    }
    if(includes > 0){
        tpl = getIncludes(tpl);
    }
    return tpl;
};
/**
 * Resolves a path to full path based on the cwd.
 * Examples:
 *      ./mytpl.tpl = /cwd/mytpl.tpl
 *      /mytpl.tpl  = /mytpl.tpl
 * @param {type} file
 * @todo Handle paths that contain "../"
 * @returns {String}
 */
getPath = function(file){
    var firstChar = file.charAt(0);
    var secondChar = file.charAt(1);
    if(firstChar !== "/" && firstChar !== "."){
        return cwd + "/" + file;
    }else if(firstChar === "." && secondChar === "/"){
        return cwd + "/" + file.substr(2);
    }else{
        return file;
    }
};