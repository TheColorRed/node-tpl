var fs = require('fs');
var items = {};
var literal = {};
var cwd = __dirname;

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
 * Sets the current working directory
 * @param {string} cd
 * @returns {undefined}
 */
exports.setcwd = function(cd){
    cwd = cd;
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
    tpl = removeLiterals(tpl);
    tpl = replaceForeach(tpl);
    tpl = replaceIf(tpl);
    tpl = replaceVars(tpl);
    tpl = addLiterals(tpl);
    return tpl;
};

/**
 * Remove the litterals from the template and save them to add back later
 * @param {string} tpl
 * @returns {string}
 */
removeLiterals = function(tpl){
    var reg = /\{literal\}([\s\S]+?)\{\/literal\}/ig;
    var matches = tpl.match(reg);
    var n = 0;
    tpl = tpl.replace(reg, function(){
        return "__literal_" + (n++) + "__";
    });
    n = 0;
    for(var i in matches){
        literal[n] = matches[i].replace(/\{\/?literal\}/ig, "");
    }
    return tpl;
};

/**
 * Add the literals back into the template
 * @param {string} tpl
 * @returns {string}
 */
addLiterals = function(tpl){
    for(var i in literal){
        tpl = tpl.replace("__literal_" + i + "__", literal[i]);
    }
    return tpl;
};

/**
 * Replaces placeholders.
 * @param {type} tpl
 * @returns {string}
 */
replaceVars = function(tpl, hasBraces){
    hasBraces = typeof hasBraces === "undefined" ? true : hasBraces;
    var reg = hasBraces ? /\{\$(.+?)\}/ig : /\$(\S+)?/ig;
    var matches = tpl.match(reg);
    var n = 0;
    tpl = tpl.replace(reg, function(){
        return "__var_" + (n++) + "__";
    });
    n = 0;
    for(var i in matches){
        var clean = matches[i].replace(/\{|\}|\$/g, "");
        var key = clean.split(".")[0];
        var value = "";
        if(items[key]){
            value = getValue(items[key], clean, items[key]);
        }
        tpl = tpl.replace("__var_" + n + "__", value);
        n++;
    }
    return tpl;
};

/**
 * Replaces if statements
 * @param {string} tpl
 * @returns {string}
 */
replaceIf = function(tpl){
    var reg = /\{if(.+?)\}([\s\S]+?)\{\/if\}/ig;
    var matches = tpl.match(reg);
    var n = 0;
    tpl = tpl.replace(reg, function(){
        return "__if_block_" + (n++) + "__";
    });
    n = 0;
    // Loop through each block
    for(var i in matches){
        var str = matches[i];
        var results = [];

        str.match(/\{[^{}]+/g).forEach(function(a, b){
            results[b] = [a.replace(/(?:if|else|elseif|\/if|\{)\s?/ig, '')];
            results[b][0] === '' && results[b].splice(0, 1);
        });
        str.match(/[^{}]+\{/g).forEach(function(a, b){
            results[b].push(a.substring(0, a.length - 1).trim());
        });
        results.pop();
        var value = "";
        for(var j in results){
            var item = results[j];
            if(item.length > 1){
                var test = replaceVars(item[0], false);
                if(eval(test)){
                    value = item[1];
                    break;
                }
            }
            if(item.length === 1){
                value = item[0];
                break;
            }
        }
        tpl = tpl.replace("__if_block_" + n + "__", value);
        n++;
    }
    return tpl;
};

/**
 * Replaces loops
 * @param {string} tpl
 * @returns {string}
 */
replaceForeach = function(tpl){
    var reg = /\{for\s+\$(\w+?)\s+in\s+\$(\w+?)\}([\s\S]+?)\{\/for\}/ig;
    var matches = tpl.match(reg);
    var n = 0;
    tpl = tpl.replace(reg, function(){
        return "__for_block_" + (n++) + "__";
    });
    n = 0;
    // Loop through each block
    for(var i in matches){
        var block = matches[i];
        var blocks = /\{for\s+\$(\w+?)\s+in\s+\$(\w+?)\}([\s\S]+?)\{\/for\}/ig;
        var data = blocks.exec(block);

        var blockkey = data[1];
        var blockobj = data[2];
        var blocktpl = data[3];
        var newblock = "";
        // Replace each object in the block
        for(var j in items[blockobj]){
            var tmpblocktpl = blocktpl;
            var arritems = tmpblocktpl.match(/\{\$(.+?)\}/g);
            var itemsblock = tmpblocktpl;
            for(var k in arritems){
                var clean = arritems[k].replace("{$", "").replace("}", "");
                var value = getValue(items[blockobj][j], clean, j);
                itemsblock = itemsblock.replace(arritems[k], value);
            }
            newblock += itemsblock;
        }
        tpl = tpl.replace("__for_block_" + n + "__", newblock);
        n++;
    }
    return tpl;
};

/**
 *
 * @param {object} o
 * @param {string} s
 * @param {string} d
 * @returns {obejct}
 */
getValue = function(o, s, d){
    s = s.replace(/\[(\w+)\]/g, '.$1'); // convert indexes to properties
    s = s.replace(/^\./, '');           // strip a leading dot
    var a = s.split('.');
    a.shift();
    if(a.length === 0){
        return d;
    }
    for(var i = 0, n = a.length; i < n; ++i){
        var k = a[i];
        if(k in o){
            o = o[k];
        }else{
            return;
        }
    }
    return o;
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