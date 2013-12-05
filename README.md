restdoc-renderer
================

Renderer for [RestDoc] REST API specifications.

Can be loaded as [requirejs] module with the name `restdoc-render`.

Example files
-------------
* [restdoc.html](restdoc.html) - basic HTML output
* [restdoc-AMD.html](restdoc-AMD.html) - basic HTML output (AMD version)
* [richrestdoc.html](richrestdoc.html) - HTML output with a TOC on the left side
* [richrestdoc-AMD.html](richrestdoc-AMD.html) - HTML output with a TOC on the left side (AMD version)

The files locally work in Firefox only as Chrome does not load files using the `file://` url.
See http://stackoverflow.com/a/13262673/873282 for a possible solution.

License
-------

Licensed under [Apache License, Version 2.0]

  [Apache License, Version 2.0]: http://www.apache.org/licenses/LICENSE-2.0.html
  [requirejs]: http://requirejs.org/
  [RestDoc]: http://restdoc.org/
