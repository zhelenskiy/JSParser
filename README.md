# JSParser
Parses expressions such as `(+ x 3) * (negate y)`.

The result is functor that can be called with `2, 3`: `parsePrefix("(+ x 3) * (negate y)")(2, 3)`
