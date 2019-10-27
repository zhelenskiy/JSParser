const variables = new Map([["x", 0], ["y", 1], ["z", 2]]);
const operations = new Map([
    ["+", {func: (x, y) => x + y, n: 2}],
    ["-", {func: (x, y) => x - y, n: 2}],
    ["*", {func: (x, y) => x * y, n: 2}],
    ["/", {func: (x, y) => x / y, n: 2}],
    ["negate", {func: x => -x, n: 1}],
    ["atan", {func: x => Math.atan(x), n: 1}],
    ["atan2", {func: (y, x) => Math.atan2(y, x), n: 2}],
    ["min3", {func: (...items) => Math.min(...items), n: undefined}],
    ["max5", {func: (...items) => Math.max(...items), n: undefined}],
    ["sum", {func: (...items) => items.length >= 1 ? items.reduce((a, b) => a + b) : 0, n: undefined}],
    ["avg", {func: (...items) => operations.get("sum").func(...items) / items.length, n: undefined}]
]);


function ParsingError(message) {
    this.message = message;
}

ParsingError.prototype = Object.create(Error.prototype);
ParsingError.prototype.name = "ParsingError";
ParsingError.prototype.constructor = ParsingError;


const throwParsingError = (message, str, index) => {
    let s = "";
    for (let i = 0; i < index - 1; i++) {
        s += str[i] === '\t' ? '\t' : ' ';
    }
    throw new ParsingError(`${message}${str !== undefined ? `\n${str}\n${s}^` : ""}`);
};

function Evaluator(name, ...operands) {
    this.evaluate = (...vars) => operations.get(name).func(...(operands.map(operand => operand.evaluate(...vars))));
    this.operands = operands;
    this.stringRepresentation = name;
}

Evaluator.prototype.toString = function () {
    return [...this.operands, this.stringRepresentation].join(" ");
};

Evaluator.prototype.prefix = function () {
    let template = [this.stringRepresentation, ...this.operands.map(t => t.prefix())].join(" ");
    return operations.has(this.stringRepresentation)
        ? this.operands.length === 0
            ? `(${template} )`
            : `(${template})`
        : template;
};

const getFunction = name => function (...operands) {
    return new Evaluator(name, ...operands);
};

function Const(n) {
    let res = new Evaluator(n.toString());
    res.evaluate = () => n;
    return res;
}

function Variable(c) {
    const index = variables.get(c);
    let res = new Evaluator(c);
    res.evaluate = (...vars) => vars[index];
    return res;
}

const Add = getFunction('+');
const Subtract = getFunction('-');
const Multiply = getFunction('*');
const Divide = getFunction('/');
const Negate = getFunction("negate");
const ArcTan = getFunction("atan");
const ArcTan2 = getFunction("atan2");
const Min3 = getFunction("min3");
const Max5 = getFunction("max5");
const Sum = getFunction("sum");
const Avg = getFunction("avg");

const parsePrefix = (str) => {
    if (str === "") {
        throwParsingError("Empty string found!")
    }
    let stack = [[]];
    const tokens = str.replace(/[()]/g, ' $& ').trim().split(/\s+/);
    let index = 1;
    const tryGetEvaluator = (name, ...operands) => {
        if (operations.has(name) && operations.get(name).n !== undefined && operations.get(name).n !== operands.length) {
            throwParsingError(`${
                operations.get(name).n > operands.length ? `Not enough` : `Too much`
                } arguments for \"${name}\" at position ${index} found! (${operands.length} instead of ${operations.get(name).n})`, str, index)
        } else {
            return new Evaluator(name, ...operands);
        }
    };
    let operandExpected = true;
    let operatorExpected = true;
    let openingBracketExpected = true;
    tokens.forEach(token => {
        while (str[index - 1].match(/\s/)) {
            ++index;
        }
        if (token === "(") {
            if (!openingBracketExpected) {
                throwParsingError(`An unexpected opening parenthesis found at position ${index}!`, str, index);
            }
            operatorExpected = true;
            operandExpected = false;
            openingBracketExpected = false;
            stack.push([]);
        } else if (token === ")") {
            if (stack[stack.length - 1].length === 0) {
                throwParsingError(`An unexpected closing parenthesis found at position ${index}!`, str, index);
            }
            operandExpected = true;
            operatorExpected = false;
            openingBracketExpected = true;
            let evaluator;
            if (operations.has(stack[stack.length - 1][0])) {
                evaluator = tryGetEvaluator(...stack.pop())
            } else {
                evaluator = stack.pop().pop();
            }
            stack[stack.length - 1].push(evaluator);
        } else if (operations.has(token)) {
            if (!operatorExpected) {
                throwParsingError(`An operator \"${token}\" found at position ${index}, but not expected!`, str, index);
            }
            operandExpected = true;
            operatorExpected = false;
            openingBracketExpected = true;
            stack[stack.length - 1].push(token);
        } else if (variables.has(token)) {
            if (!operandExpected) {
                throwParsingError(`A variable \"${token}\" found at position ${index}, but not expected!`, str, index);
            }
            operandExpected = stack[stack.length - 1].length > 0;
            operatorExpected = false;
            openingBracketExpected = operandExpected;
            stack[stack.length - 1].push(new Variable(token));
        } else {
            const number = Number(token);
            if (Number.isNaN(number)) {
                throwParsingError(`An unknown token \"${token}\" found at position ${index}!`, str, index)
            }
            if (!operandExpected) {
                throwParsingError(`A number \"${token}\" found at position ${index}, but not expected!`, str, index);
            }
            operandExpected = stack[stack.length - 1].length > 0;
            operatorExpected = false;
            openingBracketExpected = operandExpected;
            stack[stack.length - 1].push(new Const(number));
        }
        index += token.length;
    });
    if (stack.length > 1) {
        throwParsingError(`A closing parenthesis expected at position ${index}!`, str, index)
    }
    if (stack[0].length === 1) {
        return stack.pop().pop();
    }
    if (!operations.has(stack[0][0])) {
        throwParsingError(`An unexpected token ${stack[0][stack[0].length - 1]} found at position ${index - stack[0][stack[0].length - 1].toString().length}!`, str, index - stack[0][stack[0].length - 1].toString().length);
    }
    return tryGetEvaluator(...stack.pop());
};
