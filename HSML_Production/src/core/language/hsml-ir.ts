/**
 * HSML Intermediate Representation
 * Unified IR for all four HSML languages with spherical coordinate optimization
 */

import { ASTNode, ASTNodeType } from './hsml-parser.js';

// IR Node Types
export enum IRNodeType {
    // Program structure
    IR_PROGRAM = 'IR_PROGRAM',
    IR_MODULE = 'IR_MODULE',
    IR_FUNCTION = 'IR_FUNCTION',
    IR_BLOCK = 'IR_BLOCK',
    
    // Expressions
    IR_BINARY_OP = 'IR_BINARY_OP',
    IR_UNARY_OP = 'IR_UNARY_OP',
    IR_CALL = 'IR_CALL',
    IR_LOAD = 'IR_LOAD',
    IR_STORE = 'IR_STORE',
    IR_LITERAL = 'IR_LITERAL',
    IR_TEMP = 'IR_TEMP',
    
    // Control flow
    IR_IF = 'IR_IF',
    IR_WHILE = 'IR_WHILE',
    IR_FOR = 'IR_FOR',
    IR_RETURN = 'IR_RETURN',
    IR_BREAK = 'IR_BREAK',
    IR_CONTINUE = 'IR_CONTINUE',
    
    // HSML-specific
    IR_HSML_ELEMENT = 'IR_HSML_ELEMENT',
    IR_HSML_ATTRIBUTE = 'IR_HSML_ATTRIBUTE',
    IR_HSML_RENDER = 'IR_HSML_RENDER',
    
    // CSSS-specific
    IR_CSSS_RULE = 'IR_CSSS_RULE',
    IR_CSSS_DECLARATION = 'IR_CSSS_DECLARATION',
    IR_CSSS_MATERIAL = 'IR_CSSS_MATERIAL',
    IR_CSSS_ANIMATION = 'IR_CSSS_ANIMATION',
    IR_CSSS_KEYFRAME = 'IR_CSSS_KEYFRAME',
    
    // ShapeScript-specific
    IR_SHAPE_PHYSICS = 'IR_SHAPE_PHYSICS',
    IR_SHAPE_FORCE = 'IR_SHAPE_FORCE',
    IR_SHAPE_CONSTRAINT = 'IR_SHAPE_CONSTRAINT',
    IR_SHAPE_EVENT = 'IR_SHAPE_EVENT',
    
    // StyleBot-specific
    IR_STYB_BOT = 'IR_STYB_BOT',
    IR_STYB_AGENT = 'IR_STYB_AGENT',
    IR_STYB_RENDER = 'IR_STYB_RENDER',
    IR_STYB_OPTIMIZE = 'IR_STYB_OPTIMIZE',
    
    // Spherical coordinate operations
    IR_SPHERICAL_OP = 'IR_SPHERICAL_OP',
    IR_SOLID_ANGLE_OP = 'IR_SOLID_ANGLE_OP',
    IR_MATTER_STATE_OP = 'IR_MATTER_STATE_OP',
    
    // Optimization hints
    IR_OPTIMIZE_HINT = 'IR_OPTIMIZE_HINT',
    IR_PARALLEL_HINT = 'IR_PARALLEL_HINT',
    IR_CACHE_HINT = 'IR_CACHE_HINT'
}

// Base IR Node interface
export interface IRNode {
    type: IRNodeType;
    id: string;
    sourceLanguage: 'hsml' | 'csss' | 'shape' | 'styb';
    metadata: Map<string, any>;
    dependencies: Set<string>;
    optimizationHints: OptimizationHint[];
}

// Optimization hints
export interface OptimizationHint {
    type: 'parallel' | 'cache' | 'vectorize' | 'inline' | 'constant_fold';
    priority: number;
    parameters: Map<string, any>;
}

// Program IR
export interface IRProgram extends IRNode {
    type: IRNodeType.IR_PROGRAM;
    functions: IRFunction[];
    globalVariables: IRVariable[];
    modules: IRModule[];
    entryPoint: string;
}

// Module IR
export interface IRModule extends IRNode {
    type: IRNodeType.IR_MODULE;
    name: string;
    imports: string[];
    exports: string[];
    functions: IRFunction[];
    variables: IRVariable[];
}

// Function IR
export interface IRFunction extends IRNode {
    type: IRNodeType.IR_FUNCTION;
    name: string;
    parameters: IRParameter[];
    returnType: IRType;
    body: IRBlock;
    isPure: boolean;
    sideEffects: Set<string>;
}

// Parameter IR
export interface IRParameter {
    name: string;
    type: IRType;
    defaultValue?: IRExpression;
}

// Block IR
export interface IRBlock extends IRNode {
    type: IRNodeType.IR_BLOCK;
    statements: IRStatement[];
    variables: IRVariable[];
    scope: string;
}

// Variable IR
export interface IRVariable {
    name: string;
    type: IRType;
    isConstant: boolean;
    initialValue?: IRExpression;
    scope: string;
}

// Type system
export interface IRType {
    baseType: 'number' | 'string' | 'boolean' | 'spherical_coord' | 'solid_angle' | 'matter_state' | 'vector' | 'matrix' | 'function';
    dimensions?: number[];
    properties?: Map<string, IRType>;
    constraints?: Map<string, any>;
}

// Expression IR
export interface IRExpression extends IRNode {
    type: IRNodeType.IR_BINARY_OP | IRNodeType.IR_UNARY_OP | IRNodeType.IR_CALL | IRNodeType.IR_LOAD | IRNodeType.IR_LITERAL | IRNodeType.IR_TEMP;
    resultType: IRType;
    isConstant: boolean;
    constantValue?: any;
}

// Binary operation IR
export interface IRBinaryOp extends IRExpression {
    type: IRNodeType.IR_BINARY_OP;
    operator: string;
    left: IRExpression;
    right: IRExpression;
    sphericalOptimization?: SphericalOptimization;
}

// Unary operation IR
export interface IRUnaryOp extends IRExpression {
    type: IRNodeType.IR_UNARY_OP;
    operator: string;
    operand: IRExpression;
}

// Function call IR
export interface IRCall extends IRExpression {
    type: IRNodeType.IR_CALL;
    functionName: string;
    arguments: IRExpression[];
    isBuiltin: boolean;
    sphericalOptimization?: SphericalOptimization;
}

// Load/store operations
export interface IRLoad extends IRExpression {
    type: IRNodeType.IR_LOAD;
    variable: string;
    index?: IRExpression;
}

export interface IRStore extends IRNode {
    type: IRNodeType.IR_STORE;
    variable: string;
    value: IRExpression;
    index?: IRExpression;
}

// Literal IR
export interface IRLiteral extends IRExpression {
    type: IRNodeType.IR_LITERAL;
    value: any;
    sphericalCoordinate?: SphericalCoordinateIR;
    solidAngle?: SolidAngleIR;
    matterState?: MatterStateIR;
}

// Temporary variable IR
export interface IRTemp extends IRExpression {
    type: IRNodeType.IR_TEMP;
    tempId: string;
    sourceExpression: IRExpression;
}

// Statement IR
export interface IRStatement extends IRNode {
    type: IRNodeType.IR_IF | IRNodeType.IR_WHILE | IRNodeType.IR_FOR | IRNodeType.IR_RETURN | IRNodeType.IR_BREAK | IRNodeType.IR_CONTINUE;
}

// Control flow IR
export interface IRIf extends IRStatement {
    type: IRNodeType.IR_IF;
    condition: IRExpression;
    consequent: IRBlock;
    alternate?: IRBlock;
}

export interface IRWhile extends IRStatement {
    type: IRNodeType.IR_WHILE;
    condition: IRExpression;
    body: IRBlock;
}

export interface IRFor extends IRStatement {
    type: IRNodeType.IR_FOR;
    init?: IRStatement;
    condition?: IRExpression;
    update?: IRStatement;
    body: IRBlock;
}

export interface IRReturn extends IRStatement {
    type: IRNodeType.IR_RETURN;
    value?: IRExpression;
}

// HSML-specific IR
export interface IRHSMLElement extends IRNode {
    type: IRNodeType.IR_HSML_ELEMENT;
    tagName: string;
    attributes: IRHSMLAttribute[];
    children: IRHSMLElement[];
    renderInstructions: IRHSMLRender[];
    sphericalPosition?: SphericalCoordinateIR;
    material?: string;
    behavior?: string;
}

export interface IRHSMLAttribute extends IRNode {
    type: IRNodeType.IR_HSML_ATTRIBUTE;
    name: string;
    value: IRExpression;
    isSphericalCoordinate: boolean;
}

export interface IRHSMLRender extends IRNode {
    type: IRNodeType.IR_HSML_RENDER;
    target: string;
    quality: IRExpression;
    priority: number;
    sphericalOptimization: SphericalOptimization;
}

// CSSS-specific IR
export interface IRCSSSRule extends IRNode {
    type: IRNodeType.IR_CSSS_RULE;
    selectors: string[];
    declarations: IRCSSSDeclaration[];
    material?: IRCSSSMaterial;
    animation?: IRCSSSAnimation;
}

export interface IRCSSSDeclaration extends IRNode {
    type: IRNodeType.IR_CSSS_DECLARATION;
    property: string;
    value: IRExpression;
    important: boolean;
}

export interface IRCSSSMaterial extends IRNode {
    type: IRNodeType.IR_CSSS_MATERIAL;
    name: string;
    properties: Map<string, IRExpression>;
    matterState: MatterStateIR;
    sphericalOptimization: SphericalOptimization;
}

export interface IRCSSSAnimation extends IRNode {
    type: IRNodeType.IR_CSSS_ANIMATION;
    name: string;
    keyframes: IRCSSSKeyframe[];
    duration: IRExpression;
    easing: string;
}

export interface IRCSSSKeyframe extends IRNode {
    type: IRNodeType.IR_CSSS_KEYFRAME;
    percentage: number;
    declarations: IRCSSSDeclaration[];
}

// ShapeScript-specific IR
export interface IRShapePhysics extends IRNode {
    type: IRNodeType.IR_SHAPE_PHYSICS;
    forces: IRShapeForce[];
    constraints: IRShapeConstraint[];
    events: IRShapeEvent[];
    matterState: MatterStateIR;
    sphericalOptimization: SphericalOptimization;
}

export interface IRShapeForce extends IRNode {
    type: IRNodeType.IR_SHAPE_FORCE;
    forceType: 'gravity' | 'elastic' | 'viscous' | 'electromagnetic';
    magnitude: IRExpression;
    direction: SphericalCoordinateIR;
    sphericalOptimization: SphericalOptimization;
}

export interface IRShapeConstraint extends IRNode {
    type: IRNodeType.IR_SHAPE_CONSTRAINT;
    constraintType: 'spherical_surface' | 'radial_range' | 'angular_cone';
    parameters: Map<string, IRExpression>;
}

export interface IRShapeEvent extends IRNode {
    type: IRNodeType.IR_SHAPE_EVENT;
    trigger: string;
    response: IRExpression;
    conditions: IRExpression[];
}

// StyleBot-specific IR
export interface IRStyleBot extends IRNode {
    type: IRNodeType.IR_STYB_BOT;
    name: string;
    agents: IRStyleBotAgent[];
    parallel: boolean;
    renderTasks: IRStyleBotRender[];
    optimizeTasks: IRStyleBotOptimize[];
}

export interface IRStyleBotAgent extends IRNode {
    type: IRNodeType.IR_STYB_AGENT;
    name: string;
    renderTasks: IRStyleBotRender[];
    optimizeTasks: IRStyleBotOptimize[];
    parallel: boolean;
}

export interface IRStyleBotRender extends IRNode {
    type: IRNodeType.IR_STYB_RENDER;
    target: string;
    quality: IRExpression;
    priority: number;
    sphericalOptimization: SphericalOptimization;
}

export interface IRStyleBotOptimize extends IRNode {
    type: IRNodeType.IR_STYB_OPTIMIZE;
    optimizationType: 'performance' | 'memory' | 'quality' | 'spherical';
    parameters: Map<string, IRExpression>;
    target: string;
}

// Spherical coordinate IR
export interface SphericalCoordinateIR {
    r: IRExpression;
    theta: IRExpression;
    phi: IRExpression;
    isNormalized: boolean;
    optimizationHints: OptimizationHint[];
}

export interface SolidAngleIR {
    omega: IRExpression;
    theta_min: IRExpression;
    theta_max: IRExpression;
    phi_min: IRExpression;
    phi_max: IRExpression;
    isNormalized: boolean;
}

export interface MatterStateIR {
    state: 'solid' | 'liquid' | 'gas' | 'plasma';
    properties: Map<string, IRExpression>;
    physicsProperties: Map<string, IRExpression>;
}

// Spherical optimization
export interface SphericalOptimization {
    usePureSpherical: boolean;
    cacheResults: boolean;
    vectorize: boolean;
    parallelize: boolean;
    precision: 'single' | 'double' | 'extended';
    optimizationLevel: number;
}

// IR Builder class
export class HSMLIRBuilder {
    private tempCounter = 0;
    private nodeCounter = 0;
    private currentScope = 'global';
    private scopeStack: string[] = ['global'];
    
    // Symbol tables for different scopes
    private symbolTables = new Map<string, Map<string, IRVariable>>();
    private functionTable = new Map<string, IRFunction>();
    private typeTable = new Map<string, IRType>();
    
    constructor() {
        this.initializeBuiltinTypes();
    }
    
    // === IR CONSTRUCTION ===
    
    buildIR(ast: any): IRProgram {
        const functions: IRFunction[] = [];
        const globalVariables: IRVariable[] = [];
        const modules: IRModule[] = [];
        
        // Process AST and build IR
        this.processAST(ast, functions, globalVariables, modules);
        
        return {
            type: IRNodeType.IR_PROGRAM,
            id: this.generateNodeId(),
            sourceLanguage: 'hsml', // Will be determined from AST
            metadata: new Map(),
            dependencies: new Set(),
            optimizationHints: [],
            functions,
            globalVariables,
            modules,
            entryPoint: 'main'
        };
    }
    
    private processAST(ast: any, functions: IRFunction[], globalVariables: IRVariable[], modules: IRModule[]): void {
        // Process different AST node types
        switch (ast.type) {
            case ASTNodeType.PROGRAM:
                this.processProgram(ast, functions, globalVariables, modules);
                break;
            case ASTNodeType.HSML_ELEMENT:
                this.processHSMLElement(ast);
                break;
            case ASTNodeType.CSSS_RULE:
                this.processCSSSRule(ast);
                break;
            case ASTNodeType.SHAPE_BEHAVIOR:
                this.processShapeBehavior(ast);
                break;
            case ASTNodeType.STYB_BOT:
                this.processStyleBot(ast);
                break;
            default:
                this.processExpression(ast);
        }
    }
    
    // === HSML PROCESSING ===
    
    private processHSMLElement(element: any): IRHSMLElement {
        const attributes: IRHSMLAttribute[] = [];
        const children: IRHSMLElement[] = [];
        const renderInstructions: IRHSMLRender[] = [];
        
        // Process attributes
        for (const attr of element.attributes) {
            attributes.push(this.processHSMLAttribute(attr));
        }
        
        // Process children
        for (const child of element.children) {
            children.push(this.processHSMLElement(child));
        }
        
        // Generate render instructions
        renderInstructions.push(this.generateHSMLRender(element));
        
        return {
            type: IRNodeType.IR_HSML_ELEMENT,
            id: this.generateNodeId(),
            sourceLanguage: 'hsml',
            metadata: new Map(),
            dependencies: new Set(),
            optimizationHints: [],
            tagName: element.tagName,
            attributes,
            children,
            renderInstructions,
            sphericalPosition: this.extractSphericalPosition(attributes),
            material: this.extractMaterial(attributes),
            behavior: this.extractBehavior(attributes)
        };
    }
    
    private processHSMLAttribute(attr: any): IRHSMLAttribute {
        const value = this.processExpression(attr.value);
        const isSphericalCoordinate = this.isSphericalCoordinateAttribute(attr.name);
        
        return {
            type: IRNodeType.IR_HSML_ATTRIBUTE,
            id: this.generateNodeId(),
            sourceLanguage: 'hsml',
            metadata: new Map(),
            dependencies: new Set(),
            optimizationHints: [],
            name: attr.name,
            value,
            isSphericalCoordinate
        };
    }
    
    private generateHSMLRender(element: any): IRHSMLRender {
        return {
            type: IRNodeType.IR_HSML_RENDER,
            id: this.generateNodeId(),
            sourceLanguage: 'hsml',
            metadata: new Map(),
            dependencies: new Set(),
            optimizationHints: [],
            target: element.tagName,
            quality: this.createLiteral(1.0),
            priority: 1,
            sphericalOptimization: this.createSphericalOptimization()
        };
    }
    
    // === CSSS PROCESSING ===
    
    private processCSSSRule(rule: any): IRCSSSRule {
        const declarations: IRCSSSDeclaration[] = [];
        
        for (const decl of rule.declarations) {
            declarations.push(this.processCSSSDeclaration(decl));
        }
        
        return {
            type: IRNodeType.IR_CSSS_RULE,
            id: this.generateNodeId(),
            sourceLanguage: 'csss',
            metadata: new Map(),
            dependencies: new Set(),
            optimizationHints: [],
            selectors: rule.selectors.map((s: any) => s.selector),
            declarations,
            material: this.extractMaterialFromDeclarations(declarations),
            animation: this.extractAnimationFromDeclarations(declarations)
        };
    }
    
    private processCSSSDeclaration(decl: any): IRCSSSDeclaration {
        const value = this.processExpression(decl.value);
        
        return {
            type: IRNodeType.IR_CSSS_DECLARATION,
            id: this.generateNodeId(),
            sourceLanguage: 'csss',
            metadata: new Map(),
            dependencies: new Set(),
            optimizationHints: [],
            property: decl.property,
            value,
            important: decl.important
        };
    }
    
    // === ShapeScript PROCESSING ===
    
    private processShapeBehavior(behavior: any): IRShapePhysics {
        const forces: IRShapeForce[] = [];
        const constraints: IRShapeConstraint[] = [];
        const events: IRShapeEvent[] = [];
        
        for (const physics of behavior.physics) {
            for (const force of physics.forces) {
                forces.push(this.processShapeForce(force));
            }
            
            for (const constraint of physics.constraints) {
                constraints.push(this.processShapeConstraint(constraint));
            }
        }
        
        for (const event of behavior.events) {
            events.push(this.processShapeEvent(event));
        }
        
        return {
            type: IRNodeType.IR_SHAPE_PHYSICS,
            id: this.generateNodeId(),
            sourceLanguage: 'shape',
            metadata: new Map(),
            dependencies: new Set(),
            optimizationHints: [],
            forces,
            constraints,
            events,
            matterState: this.processMatterState(behavior.matterState) as unknown as MatterStateIR,
            sphericalOptimization: this.createSphericalOptimization()
        };
    }
    
    private processShapeForce(force: any): IRShapeForce {
        const magnitude = this.processExpression(force.magnitude);
        const direction = this.processSphericalCoordinate(force.direction);
        
        return {
            type: IRNodeType.IR_SHAPE_FORCE,
            id: this.generateNodeId(),
            sourceLanguage: 'shape',
            metadata: new Map(),
            dependencies: new Set(),
            optimizationHints: [],
            forceType: force.type,
            magnitude,
            direction: direction as unknown as SphericalCoordinateIR,
            sphericalOptimization: this.createSphericalOptimization()
        };
    }
    
    // === StyleBot PROCESSING ===
    
    private processStyleBot(bot: any): IRStyleBot {
        const agents: IRStyleBotAgent[] = [];
        const renderTasks: IRStyleBotRender[] = [];
        const optimizeTasks: IRStyleBotOptimize[] = [];
        
        for (const agent of bot.agents) {
            agents.push(this.processStyleBotAgent(agent));
        }
        
        return {
            type: IRNodeType.IR_STYB_BOT,
            id: this.generateNodeId(),
            sourceLanguage: 'styb',
            metadata: new Map(),
            dependencies: new Set(),
            optimizationHints: [],
            name: bot.name,
            agents,
            parallel: bot.parallel,
            renderTasks,
            optimizeTasks
        };
    }
    
    private processStyleBotAgent(agent: any): IRStyleBotAgent {
        const renderTasks: IRStyleBotRender[] = [];
        const optimizeTasks: IRStyleBotOptimize[] = [];
        
        for (const render of agent.render) {
            renderTasks.push(this.processStyleBotRender(render));
        }
        
        for (const optimize of agent.optimize) {
            optimizeTasks.push(this.processStyleBotOptimize(optimize));
        }
        
        return {
            type: IRNodeType.IR_STYB_AGENT,
            id: this.generateNodeId(),
            sourceLanguage: 'styb',
            metadata: new Map(),
            dependencies: new Set(),
            optimizationHints: [],
            name: agent.name,
            renderTasks,
            optimizeTasks,
            parallel: false
        };
    }
    
    // === EXPRESSION PROCESSING ===
    
    private processExpression(expr: any): IRExpression {
        switch (expr.type) {
            case ASTNodeType.BINARY_OPERATION:
                return this.processBinaryOperation(expr);
            case ASTNodeType.UNARY_OPERATION:
                return this.processUnaryOperation(expr);
            case ASTNodeType.CALL_EXPRESSION:
                return this.processCallExpression(expr);
            case ASTNodeType.LITERAL:
                return this.processLiteral(expr);
            case ASTNodeType.IDENTIFIER:
                return this.processIdentifier(expr);
            case ASTNodeType.SPHERICAL_COORDINATE:
                return this.processSphericalCoordinate(expr);
            case ASTNodeType.SOLID_ANGLE:
                return this.processSolidAngle(expr);
            case ASTNodeType.MATTER_STATE:
                return this.processMatterState(expr);
            default:
                return this.createTemp(expr);
        }
    }
    
    private processBinaryOperation(expr: any): IRBinaryOp {
        const left = this.processExpression(expr.left);
        const right = this.processExpression(expr.right);
        
        return {
            type: IRNodeType.IR_BINARY_OP,
            id: this.generateNodeId(),
            sourceLanguage: this.determineSourceLanguage(expr),
            metadata: new Map(),
            dependencies: new Set(),
            optimizationHints: [],
            operator: expr.operator,
            left,
            right,
            resultType: this.inferBinaryResultType(left, right, expr.operator),
            isConstant: left.isConstant && right.isConstant,
            constantValue: this.computeConstantBinaryOp(left, right, expr.operator),
            sphericalOptimization: this.createSphericalOptimization()
        };
    }
    
    private processUnaryOperation(expr: any): IRUnaryOp {
        const operand = this.processExpression(expr.operand);
        
        return {
            type: IRNodeType.IR_UNARY_OP,
            id: this.generateNodeId(),
            sourceLanguage: this.determineSourceLanguage(expr),
            metadata: new Map(),
            dependencies: new Set(),
            optimizationHints: [],
            operator: expr.operator,
            operand,
            resultType: this.inferUnaryResultType(operand, expr.operator),
            isConstant: operand.isConstant,
            constantValue: this.computeConstantUnaryOp(operand, expr.operator)
        };
    }
    
    private processCallExpression(expr: any): IRCall {
        const callee = this.processExpression(expr.callee);
        const arguments_ = expr.arguments.map((arg: any) => this.processExpression(arg));
        
        return {
            type: IRNodeType.IR_CALL,
            id: this.generateNodeId(),
            sourceLanguage: this.determineSourceLanguage(expr),
            metadata: new Map(),
            dependencies: new Set(),
            optimizationHints: [],
            functionName: this.extractFunctionName(callee),
            arguments: arguments_,
            isBuiltin: this.isBuiltinFunction(this.extractFunctionName(callee)),
            resultType: this.inferCallResultType(callee, arguments_),
            isConstant: false,
            sphericalOptimization: this.createSphericalOptimization()
        };
    }
    
    private processLiteral(expr: any): IRLiteral {
        return {
            type: IRNodeType.IR_LITERAL,
            id: this.generateNodeId(),
            sourceLanguage: this.determineSourceLanguage(expr),
            metadata: new Map(),
            dependencies: new Set(),
            optimizationHints: [],
            value: expr.value,
            resultType: this.inferLiteralType(expr.value),
            isConstant: true,
            constantValue: expr.value,
            sphericalCoordinate: this.extractSphericalCoordinate(expr),
            solidAngle: this.extractSolidAngle(expr),
            matterState: this.extractMatterState(expr)
        };
    }
    
    // === SPHERICAL COORDINATE PROCESSING ===
    
    private processSphericalCoordinate(coord: any): IRExpression {
        const r = this.processExpression(coord.r);
        const theta = this.processExpression(coord.theta);
        const phi = this.processExpression(coord.phi);
        
        // Create a special literal for spherical coordinates
        return {
            type: IRNodeType.IR_LITERAL,
            id: this.generateNodeId(),
            sourceLanguage: this.determineSourceLanguage(coord),
            metadata: new Map(),
            dependencies: new Set(),
            optimizationHints: [],
            sphericalCoordinate: { r, theta, phi, isNormalized: false, optimizationHints: [] }
        };
    }
    
    private processSolidAngle(angle: any): IRExpression {
        const omega = this.processExpression(angle.omega);
        const theta_min = this.processExpression(angle.theta_min);
        const theta_max = this.processExpression(angle.theta_max);
        const phi_min = this.processExpression(angle.phi_min);
        const phi_max = this.processExpression(angle.phi_max);
        
        return {
            type: IRNodeType.IR_LITERAL,
            id: this.generateNodeId(),
            sourceLanguage: this.determineSourceLanguage(angle),
            metadata: new Map(),
            dependencies: new Set(),
            optimizationHints: [],
            solidAngle: { omega, theta_min, theta_max, phi_min, phi_max, isNormalized: false }
        };
    }
    
    private processMatterState(state: any): IRExpression {
        const properties = new Map<string, IRExpression>();
        
        for (const [key, value] of Object.entries(state.properties)) {
            properties.set(key, this.processExpression(value as any));
        }
        
        return {
            type: IRNodeType.IR_LITERAL,
            id: this.generateNodeId(),
            sourceLanguage: this.determineSourceLanguage(state),
            metadata: new Map(),
            dependencies: new Set(),
            optimizationHints: [],
            matterState: state as unknown as MatterStateIR
        };
    }
    
    // === UTILITY METHODS ===
    
    private generateNodeId(): string {
        return `ir_node_${this.nodeCounter++}`;
    }
    
    private generateTempId(): string {
        return `temp_${this.tempCounter++}`;
    }
    
    private createTemp(sourceExpression: IRExpression): IRTemp {
        return {
            type: IRNodeType.IR_TEMP,
            id: this.generateNodeId(),
            sourceLanguage: sourceExpression.sourceLanguage,
            metadata: new Map(),
            dependencies: new Set(),
            optimizationHints: [],
            tempId: this.generateTempId(),
            sourceExpression,
            resultType: sourceExpression.resultType,
            isConstant: sourceExpression.isConstant,
            constantValue: sourceExpression.constantValue
        };
    }
    
    private createLiteral(value: any): IRLiteral {
        return {
            type: IRNodeType.IR_LITERAL,
            id: this.generateNodeId(),
            sourceLanguage: 'hsml',
            metadata: new Map(),
            dependencies: new Set(),
            optimizationHints: [],
            value,
            resultType: this.inferLiteralType(value),
            isConstant: true,
            constantValue: value
        };
    }
    
    private createSphericalOptimization(): SphericalOptimization {
        return {
            usePureSpherical: true,
            cacheResults: true,
            vectorize: true,
            parallelize: false,
            precision: 'double',
            optimizationLevel: 2
        };
    }
    
    // Type inference methods
    private inferBinaryResultType(left: IRExpression, right: IRExpression, operator: string): IRType {
        // Implement type inference logic
        return this.getType('number');
    }
    
    private inferUnaryResultType(operand: IRExpression, operator: string): IRType {
        // Implement type inference logic
        return operand.resultType;
    }
    
    private inferCallResultType(callee: IRExpression, arguments_: IRExpression[]): IRType {
        // Implement type inference logic
        return this.getType('number');
    }
    
    private inferLiteralType(value: any): IRType {
        if (typeof value === 'number') return this.getType('number');
        if (typeof value === 'string') return this.getType('string');
        if (typeof value === 'boolean') return this.getType('boolean');
        return this.getType('number');
    }
    
    // Builtin type initialization
    private initializeBuiltinTypes(): void {
        this.typeTable.set('number', { baseType: 'number' });
        this.typeTable.set('string', { baseType: 'string' });
        this.typeTable.set('boolean', { baseType: 'boolean' });
        this.typeTable.set('spherical_coord', { baseType: 'spherical_coord' });
        this.typeTable.set('solid_angle', { baseType: 'solid_angle' });
        this.typeTable.set('matter_state', { baseType: 'matter_state' });
    }
    
    private getType(typeName: string): IRType {
        return this.typeTable.get(typeName) || { baseType: 'number' };
    }
    
    // Additional utility methods (implementations would be added as needed)
    private determineSourceLanguage(node: any): 'hsml' | 'csss' | 'shape' | 'styb' { return 'hsml'; }
    private extractFunctionName(callee: IRExpression): string { return 'unknown'; }
    private isBuiltinFunction(name: string): boolean { return false; }
    private computeConstantBinaryOp(left: IRExpression, right: IRExpression, operator: string): any { return null; }
    private computeConstantUnaryOp(operand: IRExpression, operator: string): any { return null; }
    private extractSphericalCoordinate(literal: any): SphericalCoordinateIR | undefined { return undefined; }
    private extractSolidAngle(literal: any): SolidAngleIR | undefined { return undefined; }
    private extractMatterState(literal: any): MatterStateIR | undefined { return undefined; }
    private isSphericalCoordinateAttribute(name: string): boolean { return name === 'position'; }
    private extractSphericalPosition(attributes: IRHSMLAttribute[]): SphericalCoordinateIR | undefined { return undefined; }
    private extractMaterial(attributes: IRHSMLAttribute[]): string | undefined { return undefined; }
    private extractBehavior(attributes: IRHSMLAttribute[]): string | undefined { return undefined; }
    private extractMaterialFromDeclarations(declarations: IRCSSSDeclaration[]): IRCSSSMaterial | undefined { return undefined; }
    private extractAnimationFromDeclarations(declarations: IRCSSSDeclaration[]): IRCSSSAnimation | undefined { return undefined; }
    private processShapeConstraint(constraint: any): IRShapeConstraint { return {} as IRShapeConstraint; }
    private processShapeEvent(event: any): IRShapeEvent { return {} as IRShapeEvent; }
    private processStyleBotRender(render: any): IRStyleBotRender { return {} as IRStyleBotRender; }
    private processStyleBotOptimize(optimize: any): IRStyleBotOptimize { return {} as IRStyleBotOptimize; }
    private processIdentifier(expr: any): IRExpression { return {} as IRExpression; }
    private processProgram(ast: any, functions: IRFunction[], globalVariables: IRVariable[], modules: IRModule[]): void {}
} 