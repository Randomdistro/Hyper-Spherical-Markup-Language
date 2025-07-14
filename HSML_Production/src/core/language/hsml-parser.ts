/**
 * HSML Multi-Language Parser
 * AST parsing for HSML, CSSS, ShapeScript, and StyleBot languages
 */

import { Token, TokenType, SphericalCoordToken, SolidAngleToken, MatterStateToken } from './hsml-lexer.js';

// AST Node Types
export enum ASTNodeType {
    // Program structure
    PROGRAM = 'PROGRAM',
    MODULE = 'MODULE',
    IMPORT = 'IMPORT',
    EXPORT = 'EXPORT',
    
    // HSML-specific nodes
    HSML_ELEMENT = 'HSML_ELEMENT',
    HSML_ATTRIBUTE = 'HSML_ATTRIBUTE',
    HSML_CONTENT = 'HSML_CONTENT',
    
    // CSSS-specific nodes
    CSSS_RULE = 'CSSS_RULE',
    CSSS_SELECTOR = 'CSSS_SELECTOR',
    CSSS_DECLARATION = 'CSSS_DECLARATION',
    CSSS_MATERIAL = 'CSSS_MATERIAL',
    CSSS_ANIMATION = 'CSSS_ANIMATION',
    CSSS_KEYFRAME = 'CSSS_KEYFRAME',
    
    // ShapeScript-specific nodes
    SHAPE_BEHAVIOR = 'SHAPE_BEHAVIOR',
    SHAPE_PHYSICS = 'SHAPE_PHYSICS',
    SHAPE_FORCE = 'SHAPE_FORCE',
    SHAPE_CONSTRAINT = 'SHAPE_CONSTRAINT',
    SHAPE_EVENT = 'SHAPE_EVENT',
    
    // StyleBot-specific nodes
    STYB_BOT = 'STYB_BOT',
    STYB_AGENT = 'STYB_AGENT',
    STYB_PARALLEL = 'STYB_PARALLEL',
    STYB_RENDER = 'STYB_RENDER',
    
    // Common nodes
    EXPRESSION = 'EXPRESSION',
    STATEMENT = 'STATEMENT',
    FUNCTION = 'FUNCTION',
    VARIABLE = 'VARIABLE',
    ASSIGNMENT = 'ASSIGNMENT',
    BINARY_OPERATION = 'BINARY_OPERATION',
    UNARY_OPERATION = 'UNARY_OPERATION',
    CALL_EXPRESSION = 'CALL_EXPRESSION',
    MEMBER_EXPRESSION = 'MEMBER_EXPRESSION',
    LITERAL = 'LITERAL',
    IDENTIFIER = 'IDENTIFIER',
    
    // Control flow
    IF_STATEMENT = 'IF_STATEMENT',
    WHILE_STATEMENT = 'WHILE_STATEMENT',
    FOR_STATEMENT = 'FOR_STATEMENT',
    RETURN_STATEMENT = 'RETURN_STATEMENT',
    
    // Spherical coordinate nodes
    SPHERICAL_COORDINATE = 'SPHERICAL_COORDINATE',
    SOLID_ANGLE = 'SOLID_ANGLE',
    MATTER_STATE = 'MATTER_STATE'
}

// Base AST Node interface
export interface ASTNode {
    type: ASTNodeType;
    start: number;
    end: number;
    language: 'hsml' | 'csss' | 'shape' | 'styb';
}

// Program node
export interface ProgramNode extends ASTNode {
    type: ASTNodeType.PROGRAM;
    body: ASTNode[];
    imports: ImportNode[];
    exports: ExportNode[];
}

// Import/Export nodes
export interface ImportNode extends ASTNode {
    type: ASTNodeType.IMPORT;
    module: string;
    imports: string[];
    alias?: string;
}

export interface ExportNode extends ASTNode {
    type: ASTNodeType.EXPORT;
    declaration: ASTNode;
}

// HSML-specific nodes
export interface HSMLElementNode extends ASTNode {
    type: ASTNodeType.HSML_ELEMENT;
    tagName: string;
    attributes: HSMLAttributeNode[];
    children: HSMLElementNode[];
    selfClosing: boolean;
    content?: string;
}

export interface HSMLAttributeNode extends ASTNode {
    type: ASTNodeType.HSML_ATTRIBUTE;
    name: string;
    value: ExpressionNode;
}

// CSSS-specific nodes
export interface CSSSRuleNode extends ASTNode {
    type: ASTNodeType.CSSS_RULE;
    selectors: CSSSSelectorNode[];
    declarations: CSSSDeclarationNode[];
}

export interface CSSSSelectorNode extends ASTNode {
    type: ASTNodeType.CSSS_SELECTOR;
    selector: string;
    specificity: number;
}

export interface CSSSDeclarationNode extends ASTNode {
    type: ASTNodeType.CSSS_DECLARATION;
    property: string;
    value: ExpressionNode;
    important: boolean;
}

export interface CSSSMaterialNode extends ASTNode {
    type: ASTNodeType.CSSS_MATERIAL;
    name: string;
    properties: CSSSDeclarationNode[];
    matterState: MatterStateNode;
}

export interface CSSSAnimationNode extends ASTNode {
    type: ASTNodeType.CSSS_ANIMATION;
    name: string;
    keyframes: CSSSKeyframeNode[];
    duration: ExpressionNode;
    easing: string;
}

export interface CSSSKeyframeNode extends ASTNode {
    type: ASTNodeType.CSSS_KEYFRAME;
    percentage: number;
    declarations: CSSSDeclarationNode[];
}

// ShapeScript-specific nodes
export interface ShapeBehaviorNode extends ASTNode {
    type: ASTNodeType.SHAPE_BEHAVIOR;
    name: string;
    physics: ShapePhysicsNode[];
    events: ShapeEventNode[];
}

export interface ShapePhysicsNode extends ASTNode {
    type: ASTNodeType.SHAPE_PHYSICS;
    forces: ShapeForceNode[];
    constraints: ShapeConstraintNode[];
    matterState: MatterStateNode;
}

export interface ShapeForceNode extends ASTNode {
    type: ASTNodeType.SHAPE_FORCE;
    forceType: 'gravity' | 'elastic' | 'viscous' | 'electromagnetic';
    magnitude: ExpressionNode;
    direction: SphericalCoordinateNode;
}

export interface ShapeConstraintNode extends ASTNode {
    type: ASTNodeType.SHAPE_CONSTRAINT;
    constraintType: 'spherical_surface' | 'radial_range' | 'angular_cone';
    parameters: Record<string, ExpressionNode>;
}

export interface ShapeEventNode extends ASTNode {
    type: ASTNodeType.SHAPE_EVENT;
    trigger: string;
    response: ExpressionNode;
}

// StyleBot-specific nodes
export interface StyleBotNode extends ASTNode {
    type: ASTNodeType.STYB_BOT;
    name: string;
    agents: StyleBotAgentNode[];
    parallel: boolean;
}

export interface StyleBotAgentNode extends ASTNode {
    type: ASTNodeType.STYB_AGENT;
    name: string;
    render: StyleBotRenderNode[];
    optimize: ExpressionNode[];
}

export interface StyleBotRenderNode extends ASTNode {
    type: ASTNodeType.STYB_RENDER;
    target: string;
    quality: ExpressionNode;
    priority: number;
}

// Expression nodes
export interface ExpressionNode extends ASTNode {
    type: ASTNodeType.EXPRESSION;
    expression: BinaryOperationNode | UnaryOperationNode | CallExpressionNode | MemberExpressionNode | LiteralNode | IdentifierNode;
}

export interface BinaryOperationNode extends ASTNode {
    type: ASTNodeType.BINARY_OPERATION;
    operator: string;
    left: ExpressionNode;
    right: ExpressionNode;
}

export interface UnaryOperationNode extends ASTNode {
    type: ASTNodeType.UNARY_OPERATION;
    operator: string;
    operand: ExpressionNode;
}

export interface CallExpressionNode extends ASTNode {
    type: ASTNodeType.CALL_EXPRESSION;
    callee: ExpressionNode;
    arguments: ExpressionNode[];
}

export interface MemberExpressionNode extends ASTNode {
    type: ASTNodeType.MEMBER_EXPRESSION;
    object: ExpressionNode;
    property: string;
}

export interface LiteralNode extends ASTNode {
    type: ASTNodeType.LITERAL;
    value: string | number | boolean;
    raw: string;
}

export interface IdentifierNode extends ASTNode {
    type: ASTNodeType.IDENTIFIER;
    name: string;
}

// Spherical coordinate nodes
export interface SphericalCoordinateNode extends ASTNode {
    type: ASTNodeType.SPHERICAL_COORDINATE;
    r: ExpressionNode;
    theta: ExpressionNode;
    phi: ExpressionNode;
}

export interface SolidAngleNode extends ASTNode {
    type: ASTNodeType.SOLID_ANGLE;
    omega: ExpressionNode;
    theta_min: ExpressionNode;
    theta_max: ExpressionNode;
    phi_min: ExpressionNode;
    phi_max: ExpressionNode;
}

export interface MatterStateNode extends ASTNode {
    type: ASTNodeType.MATTER_STATE;
    state: 'solid' | 'liquid' | 'gas' | 'plasma';
    properties: Record<string, ExpressionNode>;
}

// Control flow nodes
export interface IfStatementNode extends ASTNode {
    type: ASTNodeType.IF_STATEMENT;
    condition: ExpressionNode;
    consequent: ASTNode;
    alternate?: ASTNode;
}

export interface WhileStatementNode extends ASTNode {
    type: ASTNodeType.WHILE_STATEMENT;
    condition: ExpressionNode;
    body: ASTNode;
}

export interface ForStatementNode extends ASTNode {
    type: ASTNodeType.FOR_STATEMENT;
    init?: ASTNode;
    condition?: ExpressionNode;
    update?: ASTNode;
    body: ASTNode;
}

export interface ReturnStatementNode extends ASTNode {
    type: ASTNodeType.RETURN_STATEMENT;
    argument?: ExpressionNode;
}

// Parser class
export class HSMLMultiParser {
    private tokens: Token[];
    private current: number = 0;
    private language: 'hsml' | 'csss' | 'shape' | 'styb';
    
    constructor(tokens: Token[], language: 'hsml' | 'csss' | 'shape' | 'styb') {
        this.tokens = tokens;
        this.language = language;
    }
    
    // === MAIN PARSING METHODS ===
    
    parse(): ProgramNode {
        const body: ASTNode[] = [];
        const imports: ImportNode[] = [];
        const exports: ExportNode[] = [];
        
        while (!this.isAtEnd()) {
            try {
                const node = this.parseTopLevel();
                if (node) {
                    if (node.type === ASTNodeType.IMPORT) {
                        imports.push(node as ImportNode);
                    } else if (node.type === ASTNodeType.EXPORT) {
                        exports.push(node as ExportNode);
                    } else {
                        body.push(node);
                    }
                }
            } catch (error) {
                this.synchronize();
            }
        }
        
        return {
            type: ASTNodeType.PROGRAM,
            body,
            imports,
            exports,
            start: 0,
            end: this.tokens[this.tokens.length - 1]?.end || 0,
            language: this.language
        };
    }
    
    private parseTopLevel(): ASTNode | null {
        const token = this.peek();
        
        switch (token.type) {
            case TokenType.IDENTIFIER:
                return this.parseDeclaration();
            case TokenType.LEFT_BRACE:
                return this.parseBlock();
            case TokenType.IF:
                return this.parseIfStatement();
            case TokenType.WHILE:
                return this.parseWhileStatement();
            case TokenType.FOR:
                return this.parseForStatement();
            case TokenType.FUNCTION:
                return this.parseFunction();
            case TokenType.RETURN:
                return this.parseReturnStatement();
            default:
                return this.parseExpression();
        }
    }
    
    // === HSML PARSING ===
    
    private parseHSMLElement(): HSMLElementNode {
        const start = this.current;
        this.advance(); // consume '<'
        
        const tagName = this.consume(TokenType.IDENTIFIER, "Expected element tag name").value;
        const attributes: HSMLAttributeNode[] = [];
        
        // Parse attributes
        while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
            if (this.check(TokenType.IDENTIFIER)) {
                attributes.push(this.parseHSMLAttribute());
            } else {
                break;
            }
        }
        
        const selfClosing = this.check(TokenType.SELF_CLOSING);
        if (selfClosing) {
            this.advance();
            this.advance(); // consume '>'
            
            return {
                type: ASTNodeType.HSML_ELEMENT,
                tagName,
                attributes,
                children: [],
                selfClosing: true,
                start,
                end: this.current,
                language: 'hsml'
            };
        }
        
        this.advance(); // consume '>'
        
        const children: HSMLElementNode[] = [];
        let content: string | undefined;
        
        // Parse content and children
        while (!this.check(TokenType.CLOSE_TAG) && !this.isAtEnd()) {
            if (this.check(TokenType.LEFT_BRACE)) {
                children.push(this.parseHSMLElement());
            } else {
                // Parse text content
                const textToken = this.advance();
                if (textToken.type === TokenType.STRING) {
                    content = textToken.value;
                }
            }
        }
        
        if (this.check(TokenType.CLOSE_TAG)) {
            this.advance(); // consume '</'
            this.advance(); // consume tag name
            this.advance(); // consume '>'
        }
        
        return {
            type: ASTNodeType.HSML_ELEMENT,
            tagName,
            attributes,
            children,
            selfClosing: false,
            content,
            start,
            end: this.current,
            language: 'hsml'
        };
    }
    
    private parseHSMLAttribute(): HSMLAttributeNode {
        const start = this.current;
        const name = this.advance().value;
        
        this.consume(TokenType.COLON, "Expected ':' after attribute name");
        const value = this.parseExpression();
        
        return {
            type: ASTNodeType.HSML_ATTRIBUTE,
            name,
            value,
            start,
            end: this.current,
            language: 'hsml'
        };
    }
    
    // === CSSS PARSING ===
    
    private parseCSSSRule(): CSSSRuleNode {
        const start = this.current;
        const selectors: CSSSSelectorNode[] = [];
        
        // Parse selectors
        while (!this.check(TokenType.LEFT_BRACE) && !this.isAtEnd()) {
            selectors.push(this.parseCSSSSelector());
            if (this.check(TokenType.COMMA)) {
                this.advance();
            }
        }
        
        this.consume(TokenType.LEFT_BRACE, "Expected '{' after selectors");
        
        const declarations: CSSSDeclarationNode[] = [];
        while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
            declarations.push(this.parseCSSSDeclaration());
        }
        
        this.consume(TokenType.RIGHT_BRACE, "Expected '}' after declarations");
        
        return {
            type: ASTNodeType.CSSS_RULE,
            selectors,
            declarations,
            start,
            end: this.current,
            language: 'csss'
        };
    }
    
    private parseCSSSSelector(): CSSSSelectorNode {
        const start = this.current;
        const selector = this.advance().value;
        
        // Calculate specificity (simplified)
        const specificity = selector.split(/[.#]/).length;
        
        return {
            type: ASTNodeType.CSSS_SELECTOR,
            selector,
            specificity,
            start,
            end: this.current,
            language: 'csss'
        };
    }
    
    private parseCSSSDeclaration(): CSSSDeclarationNode {
        const start = this.current;
        const property = this.advance().value;
        
        this.consume(TokenType.COLON, "Expected ':' after property name");
        const value = this.parseExpression();
        
        let important = false;
        if (this.check(TokenType.IDENTIFIER) && this.peek().value === 'important') {
            this.advance();
            important = true;
        }
        
        this.consume(TokenType.SEMICOLON, "Expected ';' after declaration");
        
        return {
            type: ASTNodeType.CSSS_DECLARATION,
            property,
            value,
            important,
            start,
            end: this.current,
            language: 'csss'
        };
    }
    
    // === ShapeScript PARSING ===
    
    private parseShapeBehavior(): ShapeBehaviorNode {
        const start = this.current;
        this.consume(TokenType.BEHAVIOR, "Expected 'behavior' keyword");
        
        const name = this.consume(TokenType.IDENTIFIER, "Expected behavior name").value;
        
        this.consume(TokenType.LEFT_BRACE, "Expected '{' after behavior name");
        
        const physics: ShapePhysicsNode[] = [];
        const events: ShapeEventNode[] = [];
        
        while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
            if (this.check(TokenType.PHYSICS)) {
                physics.push(this.parseShapePhysics());
            } else if (this.check(TokenType.EVENT)) {
                events.push(this.parseShapeEvent());
            } else {
                this.advance(); // skip unknown tokens
            }
        }
        
        this.consume(TokenType.RIGHT_BRACE, "Expected '}' after behavior body");
        
        return {
            type: ASTNodeType.SHAPE_BEHAVIOR,
            name,
            physics,
            events,
            start,
            end: this.current,
            language: 'shape'
        };
    }
    
    private parseShapePhysics(): ShapePhysicsNode {
        const start = this.current;
        this.consume(TokenType.PHYSICS, "Expected 'physics' keyword");
        
        this.consume(TokenType.LEFT_BRACE, "Expected '{' after physics");
        
        const forces: ShapeForceNode[] = [];
        const constraints: ShapeConstraintNode[] = [];
        let matterState: MatterStateNode | undefined;
        
        while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
            if (this.check(TokenType.FORCE)) {
                forces.push(this.parseShapeForce());
            } else if (this.check(TokenType.CONSTRAINT)) {
                constraints.push(this.parseShapeConstraint());
            } else if (this.isMatterState(this.peek().value)) {
                matterState = this.parseMatterState();
            } else {
                this.advance();
            }
        }
        
        this.consume(TokenType.RIGHT_BRACE, "Expected '}' after physics body");
        
        return {
            type: ASTNodeType.SHAPE_PHYSICS,
            forces,
            constraints,
            matterState: matterState!,
            start,
            end: this.current,
            language: 'shape'
        };
    }
    
    // === StyleBot PARSING ===
    
    private parseStyleBot(): StyleBotNode {
        const start = this.current;
        this.consume(TokenType.BOT, "Expected 'bot' keyword");
        
        const name = this.consume(TokenType.IDENTIFIER, "Expected bot name").value;
        
        this.consume(TokenType.LEFT_BRACE, "Expected '{' after bot name");
        
        const agents: StyleBotAgentNode[] = [];
        let parallel = false;
        
        while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
            if (this.check(TokenType.PARALLEL)) {
                this.advance();
                parallel = true;
            } else if (this.check(TokenType.AGENT)) {
                agents.push(this.parseStyleBotAgent());
            } else {
                this.advance();
            }
        }
        
        this.consume(TokenType.RIGHT_BRACE, "Expected '}' after bot body");
        
        return {
            type: ASTNodeType.STYB_BOT,
            name,
            agents,
            parallel,
            start,
            end: this.current,
            language: 'styb'
        };
    }
    
    // === EXPRESSION PARSING ===
    
    private parseExpression(): ExpressionNode {
        return {
            type: ASTNodeType.EXPRESSION,
            expression: this.parseEquality(),
            start: this.current,
            end: this.current,
            language: this.language
        };
    }
    
    private parseEquality(): BinaryOperationNode | UnaryOperationNode | CallExpressionNode | MemberExpressionNode | LiteralNode | IdentifierNode {
        let expr = this.parseComparison();
        
        while (this.match(TokenType.EQUALS, TokenType.NOT_EQUALS)) {
            const operator = this.previous().value;
            const right = this.parseComparison();
            expr = {
                type: ASTNodeType.BINARY_OPERATION,
                operator,
                left: expr,
                right,
                start: expr.start,
                end: right.end,
                language: this.language
            };
        }
        
        return expr;
    }
    
    private parseComparison(): BinaryOperationNode | UnaryOperationNode | CallExpressionNode | MemberExpressionNode | LiteralNode | IdentifierNode {
        let expr = this.parseTerm();
        
        while (this.match(TokenType.LESS_THAN, TokenType.GREATER_THAN, TokenType.LESS_EQUAL, TokenType.GREATER_EQUAL)) {
            const operator = this.previous().value;
            const right = this.parseTerm();
            expr = {
                type: ASTNodeType.BINARY_OPERATION,
                operator,
                left: expr,
                right,
                start: expr.start,
                end: right.end,
                language: this.language
            };
        }
        
        return expr;
    }
    
    private parseTerm(): BinaryOperationNode | UnaryOperationNode | CallExpressionNode | MemberExpressionNode | LiteralNode | IdentifierNode {
        let expr = this.parseFactor();
        
        while (this.match(TokenType.PLUS, TokenType.MINUS)) {
            const operator = this.previous().value;
            const right = this.parseFactor();
            expr = {
                type: ASTNodeType.BINARY_OPERATION,
                operator,
                left: expr,
                right,
                start: expr.start,
                end: right.end,
                language: this.language
            };
        }
        
        return expr;
    }
    
    private parseFactor(): BinaryOperationNode | UnaryOperationNode | CallExpressionNode | MemberExpressionNode | LiteralNode | IdentifierNode {
        let expr = this.parseUnary();
        
        while (this.match(TokenType.MULTIPLY, TokenType.DIVIDE)) {
            const operator = this.previous().value;
            const right = this.parseUnary();
            expr = {
                type: ASTNodeType.BINARY_OPERATION,
                operator,
                left: expr,
                right,
                start: expr.start,
                end: right.end,
                language: this.language
            };
        }
        
        return expr;
    }
    
    private parseUnary(): UnaryOperationNode | CallExpressionNode | MemberExpressionNode | LiteralNode | IdentifierNode {
        if (this.match(TokenType.MINUS)) {
            const operator = this.previous().value;
            const right = this.parseUnary();
            return {
                type: ASTNodeType.UNARY_OPERATION,
                operator,
                operand: right,
                start: this.current,
                end: right.end,
                language: this.language
            };
        }
        
        return this.parseCall();
    }
    
    private parseCall(): CallExpressionNode | MemberExpressionNode | LiteralNode | IdentifierNode {
        let expr = this.parsePrimary();
        
        while (true) {
            if (this.match(TokenType.LEFT_PAREN)) {
                expr = this.finishCall(expr);
            } else if (this.match(TokenType.DOT)) {
                const name = this.consume(TokenType.IDENTIFIER, "Expected property name after '.'").value;
                expr = {
                    type: ASTNodeType.MEMBER_EXPRESSION,
                    object: expr,
                    property: name,
                    start: expr.start,
                    end: this.current,
                    language: this.language
                };
            } else {
                break;
            }
        }
        
        return expr;
    }
    
    private finishCall(callee: CallExpressionNode | MemberExpressionNode | LiteralNode | IdentifierNode): CallExpressionNode {
        const arguments_: ExpressionNode[] = [];
        
        if (!this.check(TokenType.RIGHT_PAREN)) {
            do {
                arguments_.push(this.parseExpression());
            } while (this.match(TokenType.COMMA));
        }
        
        this.consume(TokenType.RIGHT_PAREN, "Expected ')' after arguments");
        
        return {
            type: ASTNodeType.CALL_EXPRESSION,
            callee,
            arguments: arguments_,
            start: callee.start,
            end: this.current,
            language: this.language
        };
    }
    
    private parsePrimary(): LiteralNode | IdentifierNode | SphericalCoordinateNode | SolidAngleNode | MatterStateNode {
        if (this.match(TokenType.NUMBER, TokenType.STRING, TokenType.BOOLEAN)) {
            const token = this.previous();
            return {
                type: ASTNodeType.LITERAL,
                value: token.value,
                raw: token.value,
                start: token.start,
                end: token.end,
                language: this.language
            };
        }
        
        if (this.match(TokenType.SPHERICAL_COORD)) {
            return this.parseSphericalCoordinate();
        }
        
        if (this.match(TokenType.SOLID_ANGLE)) {
            return this.parseSolidAngle();
        }
        
        if (this.isMatterState(this.peek().value)) {
            return this.parseMatterState();
        }
        
        if (this.match(TokenType.IDENTIFIER)) {
            return {
                type: ASTNodeType.IDENTIFIER,
                name: this.previous().value,
                start: this.previous().start,
                end: this.previous().end,
                language: this.language
            };
        }
        
        throw new Error(`Unexpected token: ${this.peek().value}`);
    }
    
    // === SPHERICAL COORDINATE PARSING ===
    
    private parseSphericalCoordinate(): SphericalCoordinateNode {
        const start = this.current;
        this.consume(TokenType.LEFT_PAREN, "Expected '(' for spherical coordinate");
        
        this.consume(TokenType.IDENTIFIER, "Expected 'r'");
        this.consume(TokenType.COLON, "Expected ':' after 'r'");
        const r = this.parseExpression();
        
        this.consume(TokenType.COMMA, "Expected ',' after r value");
        this.consume(TokenType.IDENTIFIER, "Expected 'θ' or 'theta'");
        this.consume(TokenType.COLON, "Expected ':' after theta");
        const theta = this.parseExpression();
        
        this.consume(TokenType.COMMA, "Expected ',' after theta value");
        this.consume(TokenType.IDENTIFIER, "Expected 'φ' or 'phi'");
        this.consume(TokenType.COLON, "Expected ':' after phi");
        const phi = this.parseExpression();
        
        this.consume(TokenType.RIGHT_PAREN, "Expected ')' for spherical coordinate");
        
        return {
            type: ASTNodeType.SPHERICAL_COORDINATE,
            r,
            theta,
            phi,
            start,
            end: this.current,
            language: this.language
        };
    }
    
    private parseSolidAngle(): SolidAngleNode {
        const start = this.current;
        this.consume(TokenType.SOLID_ANGLE, "Expected 'Ω' for solid angle");
        
        this.consume(TokenType.LEFT_PAREN, "Expected '(' for solid angle");
        
        this.consume(TokenType.IDENTIFIER, "Expected 'ω' or 'omega'");
        this.consume(TokenType.COLON, "Expected ':' after omega");
        const omega = this.parseExpression();
        
        this.consume(TokenType.COMMA, "Expected ',' after omega value");
        this.consume(TokenType.IDENTIFIER, "Expected 'θ_min'");
        this.consume(TokenType.COLON, "Expected ':' after theta_min");
        const theta_min = this.parseExpression();
        
        this.consume(TokenType.COMMA, "Expected ',' after theta_min value");
        this.consume(TokenType.IDENTIFIER, "Expected 'θ_max'");
        this.consume(TokenType.COLON, "Expected ':' after theta_max");
        const theta_max = this.parseExpression();
        
        this.consume(TokenType.COMMA, "Expected ',' after theta_max value");
        this.consume(TokenType.IDENTIFIER, "Expected 'φ_min'");
        this.consume(TokenType.COLON, "Expected ':' after phi_min");
        const phi_min = this.parseExpression();
        
        this.consume(TokenType.COMMA, "Expected ',' after phi_min value");
        this.consume(TokenType.IDENTIFIER, "Expected 'φ_max'");
        this.consume(TokenType.COLON, "Expected ':' after phi_max");
        const phi_max = this.parseExpression();
        
        this.consume(TokenType.RIGHT_PAREN, "Expected ')' for solid angle");
        
        return {
            type: ASTNodeType.SOLID_ANGLE,
            omega,
            theta_min,
            theta_max,
            phi_min,
            phi_max,
            start,
            end: this.current,
            language: this.language
        };
    }
    
    private parseMatterState(): MatterStateNode {
        const start = this.current;
        const stateToken = this.advance();
        const state = stateToken.value as 'solid' | 'liquid' | 'gas' | 'plasma';
        
        const properties: Record<string, ExpressionNode> = {};
        
        if (this.match(TokenType.LEFT_BRACE)) {
            while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
                const propertyName = this.consume(TokenType.IDENTIFIER, "Expected property name").value;
                this.consume(TokenType.COLON, "Expected ':' after property name");
                const propertyValue = this.parseExpression();
                properties[propertyName] = propertyValue;
                
                if (this.check(TokenType.COMMA)) {
                    this.advance();
                }
            }
            this.consume(TokenType.RIGHT_BRACE, "Expected '}' after matter state properties");
        }
        
        return {
            type: ASTNodeType.MATTER_STATE,
            state,
            properties,
            start,
            end: this.current,
            language: this.language
        };
    }
    
    // === UTILITY METHODS ===
    
    private match(...types: TokenType[]): boolean {
        for (const type of types) {
            if (this.check(type)) {
                this.advance();
                return true;
            }
        }
        return false;
    }
    
    private check(type: TokenType): boolean {
        if (this.isAtEnd()) return false;
        return this.peek().type === type;
    }
    
    private advance(): Token {
        if (!this.isAtEnd()) this.current++;
        return this.previous();
    }
    
    private isAtEnd(): boolean {
        return this.peek().type === TokenType.EOF;
    }
    
    private peek(): Token {
        return this.tokens[this.current];
    }
    
    private previous(): Token {
        return this.tokens[this.current - 1];
    }
    
    private consume(type: TokenType, message: string): Token {
        if (this.check(type)) return this.advance();
        throw new Error(message);
    }
    
    private isMatterState(value: string): boolean {
        return ['solid', 'liquid', 'gas', 'plasma'].includes(value);
    }
    
    private synchronize(): void {
        this.advance();
        
        while (!this.isAtEnd()) {
            if (this.previous().type === TokenType.SEMICOLON) return;
            
            switch (this.peek().type) {
                case TokenType.FUNCTION:
                case TokenType.VAR:
                case TokenType.LET:
                case TokenType.CONST:
                case TokenType.IF:
                case TokenType.WHILE:
                case TokenType.FOR:
                case TokenType.RETURN:
                    return;
            }
            
            this.advance();
        }
    }
    
    // Additional parsing methods for control flow and declarations
    private parseDeclaration(): ASTNode {
        // Implementation for variable and function declarations
        return this.parseExpression();
    }
    
    private parseBlock(): ASTNode {
        // Implementation for block statements
        return this.parseExpression();
    }
    
    private parseIfStatement(): IfStatementNode {
        // Implementation for if statements
        return {
            type: ASTNodeType.IF_STATEMENT,
            condition: this.parseExpression(),
            consequent: this.parseExpression(),
            start: this.current,
            end: this.current,
            language: this.language
        };
    }
    
    private parseWhileStatement(): WhileStatementNode {
        // Implementation for while statements
        return {
            type: ASTNodeType.WHILE_STATEMENT,
            condition: this.parseExpression(),
            body: this.parseExpression(),
            start: this.current,
            end: this.current,
            language: this.language
        };
    }
    
    private parseForStatement(): ForStatementNode {
        // Implementation for for statements
        return {
            type: ASTNodeType.FOR_STATEMENT,
            init: undefined,
            condition: undefined,
            update: undefined,
            body: this.parseExpression(),
            start: this.current,
            end: this.current,
            language: this.language
        };
    }
    
    private parseFunction(): ASTNode {
        // Implementation for function declarations
        return this.parseExpression();
    }
    
    private parseReturnStatement(): ReturnStatementNode {
        // Implementation for return statements
        return {
            type: ASTNodeType.RETURN_STATEMENT,
            argument: undefined,
            start: this.current,
            end: this.current,
            language: this.language
        };
    }
} 