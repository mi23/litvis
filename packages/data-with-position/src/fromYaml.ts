import * as isNull from "lodash.isnull";
import * as ast from "yaml-ast-parser";
import { kindKey, positionKey } from "./keys";
import { DataWithPosition, Kind, Position } from "./types";

// The following code is inspired by
// https://github.com/yldio/pseudo-yaml-ast

const isBetween = (start, pos, end) => pos <= end && pos >= start;

const calculatePosition = (input: string, { start, end }) => {
  const lines = input.split(/\n/);

  const position: Position = {
    start: {
      line: -1,
      column: -1,
    },
    end: {
      line: -1,
      column: -1,
    },
  };

  let sum = 0;

  for (const i of lines.keys()) {
    const line = lines[i];
    const ls = sum;
    const le = sum + line.length;

    if (position.start.line === -1 && isBetween(ls, start, le)) {
      position.start.line = i + 1;
      position.start.column = start - ls + 1;
    }

    if (position.end.line === -1 && isBetween(ls, end, le)) {
      position.end.line = i + 1;
      position.end.column = end - ls + 1;
    }

    sum = le + 1; // +1 because the break is also a char
  }

  return position;
};

const wrappedScalar = (Constructor, kind: Kind, value, position) => {
  const v = new Constructor(value);
  v[positionKey] = position;
  v[kindKey] = kind;
  return v;
};

const returnNull = () => null;
const wrappedNull = (position) => ({
  [positionKey]: position,
  [kindKey]: "null",
  valueOf: returnNull as any,
});

const visitors = {
  MAP: (node: ast.YamlMap, input, ctx) =>
    Object.assign(walk(node.mappings, input), {
      [positionKey]: calculatePosition(input, {
        start: node.startPosition,
        end: node.endPosition,
      }),
      [kindKey]: "object",
    }),
  MAPPING: (node: ast.YAMLMapping, input, ctx) => {
    const value = walk([node.value], input);

    if (isNull(node.value)) {
      return Object.assign(ctx, {
        [node.key.value]: wrappedNull(
          calculatePosition(input, {
            start: node.startPosition,
            end: node.endPosition,
          }),
        ),
      });
    }

    value[positionKey] = calculatePosition(input, {
      start: node.startPosition,
      end: node.endPosition,
    });

    return Object.assign(ctx, {
      [node.key.value]: value,
    });
  },
  SCALAR: (node: ast.YAMLScalar, input) => {
    const position = calculatePosition(input, {
      start: node.startPosition,
      end: node.endPosition,
    });

    if (typeof node.valueObject === "boolean") {
      return wrappedScalar(Boolean, "boolean", node.valueObject, position);
    } else if (typeof node.valueObject === "number") {
      return wrappedScalar(Number, "number", node.valueObject, position);
    } else if (isNull(node.valueObject) || isNull(node.value)) {
      return wrappedNull(position);
    }
    return wrappedScalar(String, "string", node.value, position);
  },
  SEQ: (node: ast.YAMLSequence, input) => {
    const items = walk(node.items, input, []);

    items[positionKey] = calculatePosition(input, {
      start: node.startPosition,
      end: node.endPosition,
    });
    items[kindKey] = "array";

    return items;
  },
};

const walk = (nodes: ast.YAMLNode[], input, ctx = {}) => {
  const onNode = (node, ctx2, fallback) => {
    const visitor = node
      ? visitors[ast.Kind[node.kind]]
      : visitors[ast.Kind.SCALAR];
    return visitor ? visitor(node, input, ctx2) : fallback;
  };

  const walkObj = () =>
    nodes.reduce((sum, node) => {
      return onNode(node, sum, sum);
    }, ctx);

  const walkArr = () =>
    nodes.map((node) => onNode(node, ctx, null), ctx).filter(Boolean);

  return Array.isArray(ctx) ? walkArr() : walkObj();
};

export default (input: string): DataWithPosition =>
  walk([ast.load(input)], input);
