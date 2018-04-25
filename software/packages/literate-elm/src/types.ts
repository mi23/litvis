// tslint:disable-next-line:no-implicit-dependencies
import { Position } from "unist";

export interface ElmSymbol {
  name: string;
  type?: string;
}

export interface Dependencies {
  [packageName: string]: string;
}

export interface EnvironmentSpec {
  /**
   * Elm package dependencies as name=>version pairs
   *
   * Acceptable version formats:
   * - MAJOR
   * - MAJOR.MINOR
   * - MAJOR.MINOR.PATCH
   * - "latest"
   */
  dependencies: Dependencies;

  /**
   * absolute paths to source directories
   *
   * This is an advanced feature, which is only needed in literate-elm programs
   * to test local development copies of Elm packages
   */
  sourceDirectories: string[];
}

export enum EnvironmentStatus {
  INITIALIZING = "initializing",
  READY = "ready",
  ERROR = "error",
}

export interface EnvironmentMetadata {
  version: string;
  status: EnvironmentStatus;
  createdAt: number;
  usedAt: number;
  errorMessage?: string;
}

export interface Environment {
  metadata: EnvironmentMetadata;
  spec: EnvironmentSpec;
  workingDirectory: string;
}

export interface Program {
  environment: Environment;
  codeNodes: CodeNode[];
  expressionNodes: ExpressionNode[];
}

export enum ProgramResultStatus {
  SUCCEEDED = "succeeded",
  FAILED = "fail",
}

export enum MessageSeverity {
  ERROR = "error",
  WARNING = "warning",
  INFO = "info",
}

export interface Message {
  text: string;
  position: Position;
  fileIndex: number;
  severity: MessageSeverity;
  node: CodeNode | ExpressionNode | null;
}

export interface SucceededProgramResult {
  program: Program;
  status: ProgramResultStatus.SUCCEEDED;
  messages: Message[];
  evaluatedExpressions: EvaluatedExpression[];
  debugLog: string;
}

export interface FailedProgramResult {
  program: Program;
  status: ProgramResultStatus.FAILED;
  messages: Message[];
}

export type ProgramResult = SucceededProgramResult | FailedProgramResult;

export interface CodeNode {
  text: string;
  position: Position;
  fileIndex?: number;
}

export interface ExpressionNode {
  text: string;
  position: Position;
  fileIndex?: number;
}

export interface EvaluatedExpression {
  node: ExpressionNode;
  value: any;
  valueStringRepresentation: string;
}
