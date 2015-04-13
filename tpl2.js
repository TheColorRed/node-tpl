var fs = require('fs');
var items = {};
var literal = {};
var cwd = __dirname;
var jstokens = [];

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
    console.log("Finished!");
    console.log(jstokens);
};

/**
 * Gets and returns the template.
 * @param {type} filename
 * @returns {string}
 */
exports.fetch = function(filename){
    var tpl = fs.readFileSync(getPath(filename), {encoding: 'utf8'});
    tpl = iterate(tpl);
//    tpl = getIncludes(tpl);
//    tpl = removeLiterals(tpl);
//    tpl = replaceForeach(tpl);
//    tpl = replaceIf(tpl);
//    tpl = replaceVars(tpl);
//    tpl = addLiterals(tpl);
    return tpl;
};

var iterator = 0;
iterate = function(tpl, depth){
    depth = typeof depth === "undefined" ? 0 : depth;
    // The current token block
    var token = "";
    var action = "";
    // Template delimiters
    var openDelim = "{";
    var closeDelim = "}";
    var inmarkup = false;
    var ifblock = 0;
    var forblock = 0;
    var prev = "";
    // Loop through each character in the template.
    for(var i = 0; i < tpl.length; i++){
        var char = tpl[i];
        // Found some markup
        if(char === openDelim && prev !== "\\" && !inmarkup){
            inmarkup = true;
            // This type of markup is an "if" block
            if(tpl.substr(i + 1, 2).toLowerCase() === "if"){
                ifblock++;
                depth++;
            }
            // This type of markup is a "for" block
            if(tpl.substr(i, 3).toLowerCase() === "for"){
                forblock++;
                depth++;
            }
        }
        // Add to the token
        if(inmarkup){
            token += char;
        }
        // Found the end of a markup group
        if(char === closeDelim && prev !== "\\" && inmarkup){
            // This is the end of an "if" block
            if(tpl.substr(i - 3, 3).toLowerCase() === "/if"){
                // If this is not a nested "if" block of the current template
                if(ifblock === 0){
                    var n = 0;
                    tpl = tpl.replace(token, function(){
                        var location = "__if__" + n + "__";
                        jstokens.push({
                            id: n,
                            location: location,
                            token: tokenToJS(token, "if")
                        });
                        return location;
                    });
                    i = i - token.length;
                    token = "";
                    inmarkup = false;
                }
                ifblock--;
                ifblock = ifblock < 0 ? 0 : ifblock;
            }
            if(tpl.substr(i - 4, 4).toLowerCase() === "/for"){
                if(forblock === 0){
                    var n = 0;
                    tpl = tpl.replace(token, function(){
                        var location = "__for__" + n + "__";
                        var rep = repForVars(token, n);
                        jstokens.push({
                            id: n,
                            key: rep.key,
                            obj: rep.obj,
                            location: location,
                            token: tokenToJS(rep.tpl, "for"),
                            vars: rep.vars
                        });
                        return location;
                    });
                    i = i - token.length + 1;
                    token = "";
                    inmarkup = false;
                }
                forblock--;
                forblock = forblock < 0 ? 0 : forblock;
            }
        }
        prev = char;
//        console.log(i + ": " + tpl[i] + ": " + char)
    }
    for(var i in jstokens){
        var location = jstokens[i].location;
        var token = jstokens[i].token;
        var id = jstokens[i].id;
        var vars = typeof jstokens[i].vars !== "undefined" ? jstokens[i].vars : [];
        try{
            if(location.indexOf("for") !== -1){
                var key = jstokens[i].key;
                var obj = jstokens[i].obj;
                for(var i in vars){
                    token = token.replace("__var__" + id + "__" + vars[i].id + "__", repVars(vars[i].token));
                }
                token = "result = '';for(var i in items." + obj + "){var " + key + " = items." + obj + "[i];result += '" + token + "'};";
            }
            console.log(token);
            eval(token);
            if(typeof result !== "undefined"){
                tpl = tpl.replace(location, result);
            }
        }catch(e){
            console.log(e.message);
        }
    }
    return tpl;
};

tokenToJS = function(tpl, type){
    if(type === "if"){
        tpl = tpl.replace(/\{|\}/g, function(match){
            return match === "}" ? "{" : "}";
        });
        tpl = tpl.replace(/\}(if)\s+?/ig, "$1(");
        tpl = tpl.replace(/\}\/(if|for)\{/ig, "}");
        tpl = tpl.replace(/elseif\s+?/ig, "else if(");
        tpl = tpl.replace(/\{/ig, "){");
        tpl = tpl.replace(/else\)\{/ig, "else{");
        tpl = "var result='';" + tpl;
        tpl = tpl.replace(/([^{}]+)(\})/g, function(dta, m1, m2){
            return ("result = '" + m1.trim().replace(/'/g, "\\'") + "';" + m2);
        });
        tpl = tpl.replace(/result = '';/g, "");
//    console.log(tpl);
    }else if(type === "for"){
        var pos = tpl.lastIndexOf("{/for}");
        tpl = tpl.substr(0, pos);
        tpl = tpl.replace(/\{for.+/i, "");
        tpl = tpl.replace(/'/g, "\\'");
        tpl = tpl.replace(/\n/g, "\\\n");
    }
    return tpl;
};

esc = function(str){
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
};

repVars = function(tpl){
    tpl = tpl.replace(/\{\$([^{}]+?)\}/ig, function(match, m1){
        var pos = m1.indexOf(".");
        if(pos === -1){
            return "' + i + '";
        }
        return "' + " + m1 + " + '";
    });
    return tpl;
};

repForVars = function(tpl, count){
    var n = 0;
    var vars = [];
    var key = "";
    var obj;
    tpl = tpl.replace(/\{for[^{}]+?\}/ig, function(val){
        var c = 0;
        return val.replace(/\$(.+?)(\s|\})/ig, function(item, m1){
            if(c === 0){
                key = m1;
            }else if(c === 1){
                obj = m1;
            }
            c++;
            return "";
        });
    });
    tpl = tpl.replace(/\{\$[^{}]+?\}/g, function(item){
        var location = "__var__" + count + "__" + n + "__";
        vars.push({
            id: n,
            location: location,
            token: item
        });
        n++;
        return location;
    });
    return {tpl: tpl, vars: vars, key: key, obj: obj};
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
 * Replaces placeholders.
 * @param {type} tpl
 * @param {boolean} hasBraces
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