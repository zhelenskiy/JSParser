# JSParser
Parses expressions such as `(+ x 3) * (negate y)`.

The result is functor that can be called with `2, 3`: `parsePrefix("(+ x 3) * (negate y)")(2, 3)`.

---

## The original task:

Design classes `Const`, `Variable`, `Add`, `Subtract`, `Multiply`, `Divide`, `Negate` to represent expressions with a single variable.
Example description of the expression `2x-3`:
```js
let expr = new Subtract (
    new Multiply (
        new Const (2),
        new Variable ("x")
    ),
    new Const (3)
);
```

The `evaluate(x)` method should perform the calculations of the form: When calculating such expression, each variable is substituted with the value `x` passed as a parameter to the evaluate function (at this stage, the variable names are ignored). Thus, the result of computing the above example should be number `7`.
The `toString()` method should return an expression entry in the reverse Polish entry. For example, `expr.toString()` should return `2 x * 3 -`.
