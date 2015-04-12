node-tpl is an easy to use, fast, templating tool to template anything you want, from webpages to emails.

## Basic usage

### Add placeholder items
```js
var tpl = require('tpl');

tpl.assign("musketeers", {
    "Athos": {color: "red", age: "20"},
    "Aramis": {color: "green", age: "30"},
    "Porthos": {color: "blue", age: "12"},
    "D'Artagnan": {color: "black", age: "25"}
});

tpl.display("templates/myfile.tpl");
```

### Create the html template
```html
<!doctype>
<html>
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        <link rel="stylesheet" href="/css/main.css">
        <title>Template Demo</title>
    </head>
    <body>
        <p>
            {if new Date().getHours() >= 12}
                Good afternoon!
            {else}
                Good morning!
            {/if}
        </p>
        <ul>
            {for $row in $musketeers}
                <li>
                    {$row}
                    <ul>
                        <li>Age: {$row.age}</li>
                        <li>Favorite Color: {$row.color}</li>
                    </ul>
                </li>
            {/for}
        </ul>
    </body>
</html>
```
## API Documentation

### Variables

Variables are items that link to a variable within the template markup, they are added by using the `assign` method.

**Note:** Assigning a variable **2** or more times will overwrite the previous variable.

```js
tpl.assign("variable", "My variable value");
tpl.assign("variable", ["Red", "White", "Blue"]);
```

Variables can hold an array of items, including (but not limited to):

* strings
* integers
* objects
* arrays

### Fetch

Fetch allows you to fetch a template and replace its values; it then gets returned back to the script. With the value you can do anything you please, such as send it in an email.

```js
tpl.assign("name", {first: "Billy", last: "Bob"});
var body = tpl.fetch("templates/email.tpl");
console.log(body);
```

### Display

Display allows you to fetch a template and it automatically gets displayed through `process.stdout.write`.

```js
tpl.assign("name", {first: "Billy", last: "Bob"});
tpl.display("templates/page1.tpl");
```

## Markup Documentation
### Variables

Variables are prefixed with a `$` and are between `{` and `}`. To access an array/object item use `.` to get the value from array/object.

```
{$variable}
{$variable.array_item}
{for $var in $variable}
{if $var == $another_var}
{elseif $var == $another_var}
```

### If statements

If statements are blocks that perform tests on a list of statements. Once one validates as true its contents will be displayed.

```html
<p>
    {if 1 == 2}
        This should never be displayed.
    {elseif '$color' == 'blue'}
        This will show if color equals "blue".
    {elseif new Date().getHours() >= 12}
        Good afternoon!
    {else}
        If nothing worked then you are seeing this.
    {/if}
</p>
```

If it is after hour `11`, and `$color` does not equal `blue`, and well `1` never equals `2`, we would then get this output:

```html
<p>
    Good afternoon!
</p>
```

### For statements

For statements loop through a list of array items or an object and display them on a page.

```html
<div class="column">
    {for $row in $store_items}
        <div class="row">
            <h2><a href="/item/{$row.id}">{$row.title}</a></h2>
            <p>{$row.description}</p>
            <p><small>{$row.updated}</small></p>
        </div>
    {/for}
</div>
```

We might then get something like this as output:

```html
<div class="column">
    <div class="row">
        <h2><a href="/item/1">White Socks</a></h2>
        <p>Cotton white socks</p>
        <p><small>2015/01/01</small></p>
    </div>
    <div class="row">
        <h2><a href="/item/2">Blue Socks</a></h2>
        <p>Cotton blue socks</p>
        <p><small>2015/01/25</small></p>
    </div>
    <div class="row">
        <h2><a href="/item/3">Black Socks</a></h2>
        <p>Silk black socks</p>
        <p><small>2015/02/12</small></p>
    </div>
</div>
```

### Literals

A literal is a way to force the engine not to replace markup, because sometimes you don't always want to replace blocks, such as JavaScript in a browser, because they can sometimes mean the same.

For example, take this template markup:

```html
<script>
    $(".rows").each(function(){$(this).remove()});
</script>
```

When the template markup is replaced, you will get this new javascript:

```html
<script>
    $(".rows").each(function());
</script>
```

Not only is it invalid JavaScript, but it isn't what you wanted.

We can fix that by placing `{literal}`'s around that block of code and it won't change like this:

```html
{literal}
<script>
    $(".rows").each(function(){$(this).remove()});
</script>
{/literal}
```

Now what gets output is exactly what we wanted because we told the engine not to replace it.

```html
<script>
    $(".rows").each(function(){$(this).remove()});
</script>
```

## Changelog

* 0.0.1 - 4/10/15
  * Initialization
* 0.0.2 - 4/10/15
  * Documentation update
* 0.0.3 - 4/11/15
  * Added support for if/elseif/else
* 0.0.4 - 4/11/15
  * Documentation update
  * Enhancements
  * Added extra npm tags
* 0.0.5 - 4/11/15
  * Added support for literal's
  * Added npm repository