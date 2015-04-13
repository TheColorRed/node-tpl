<!doctype>
<html>
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        <link rel="stylesheet" href="/css/main.css">
        <title>Template Demo</title>
    </head>
    <body>
        <p>
            {if 1 == 2}
                {if 1 < 2}
                    I am less than 2
                {/if}
            {elseif '$color' == 'blue'}
                This will show if color equals 'blue'.
            {elseif new Date().getHours() >= 12}
                Good afternoon!
            {else}
                If nothing worked then you are seeing this.
            {/if}
        </p>
        <ul>
            {for $row in $musketeers}
                <li>
                    {$row.name}
                    <ul>
                        <li>Age: {$row.age}</li>
                        <li>Favorite Color: {$row.color}</li>
                            {for $a in $animals}
                            <li>{$a.type}'s name: {$a.name}</li>
                            {/for}
                    </ul>
                </li>
            {/for}
        </ul>
        {include "templates/footer.tpl"}
    </body>
</html>