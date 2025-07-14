/**
 * HSML Multi-Language Lexer
 * Token definitions and lexical analysis for all four HSML languages
 */

// Core token types for all languages
export enum TokenType {
    // Literals
    NUMBER = 'NUMBER',
    STRING = 'STRING',
    IDENTIFIER = 'IDENTIFIER',
    BOOLEAN = 'BOOLEAN',
    
    // Spherical coordinates
    SPHERICAL_COORD = 'SPHERICAL_COORD',
    SOLID_ANGLE = 'SOLID_ANGLE',
    STERADIAN = 'STERADIAN',
    
    // Matter states
    SOLID = 'SOLID',
    LIQUID = 'LIQUID',
    GAS = 'GAS',
    PLASMA = 'PLASMA',
    
    // Operators
    PLUS = 'PLUS',
    MINUS = 'MINUS',
    MULTIPLY = 'MULTIPLY',
    DIVIDE = 'DIVIDE',
    POWER = 'POWER',
    ASSIGN = 'ASSIGN',
    EQUALS = 'EQUALS',
    NOT_EQUALS = 'NOT_EQUALS',
    LESS_THAN = 'LESS_THAN',
    GREATER_THAN = 'GREATER_THAN',
    LESS_EQUAL = 'LESS_EQUAL',
    GREATER_EQUAL = 'GREATER_EQUAL',
    
    // Delimiters
    LEFT_PAREN = 'LEFT_PAREN',
    RIGHT_PAREN = 'RIGHT_PAREN',
    LEFT_BRACE = 'LEFT_BRACE',
    RIGHT_BRACE = 'RIGHT_BRACE',
    LEFT_BRACKET = 'LEFT_BRACKET',
    RIGHT_BRACKET = 'RIGHT_BRACKET',
    SEMICOLON = 'SEMICOLON',
    COMMA = 'COMMA',
    DOT = 'DOT',
    COLON = 'COLON',
    
    // HSML-specific tokens
    ELEMENT_TAG = 'ELEMENT_TAG',
    CLOSE_TAG = 'CLOSE_TAG',
    SELF_CLOSING = 'SELF_CLOSING',
    ATTRIBUTE = 'ATTRIBUTE',
    
    // CSSS-specific tokens
    SELECTOR = 'SELECTOR',
    PROPERTY = 'PROPERTY',
    VALUE = 'VALUE',
    MATERIAL = 'MATERIAL',
    ANIMATION = 'ANIMATION',
    KEYFRAME = 'KEYFRAME',
    TRANSITION = 'TRANSITION',
    
    // ShapeScript-specific tokens
    BEHAVIOR = 'BEHAVIOR',
    PHYSICS = 'PHYSICS',
    FORCE = 'FORCE',
    CONSTRAINT = 'CONSTRAINT',
    COLLISION = 'COLLISION',
    INTERACTION = 'INTERACTION',
    EVENT = 'EVENT',
    
    // StyleBot-specific tokens
    BOT = 'BOT',
    AGENT = 'AGENT',
    PARALLEL = 'PARALLEL',
    DISTRIBUTED = 'DISTRIBUTED',
    RENDER = 'RENDER',
    OPTIMIZE = 'OPTIMIZE',
    CACHE = 'CACHE',
    
    // Keywords
    IF = 'IF',
    ELSE = 'ELSE',
    WHILE = 'WHILE',
    FOR = 'FOR',
    FUNCTION = 'FUNCTION',
    RETURN = 'RETURN',
    VAR = 'VAR',
    LET = 'LET',
    CONST = 'CONST',
    
    // Special tokens
    EOF = 'EOF',
    ERROR = 'ERROR',
    COMMENT = 'COMMENT',
    WHITESPACE = 'WHITESPACE'
}

// Token interface
export interface Token {
    type: TokenType;
    value: string;
    line: number;
    column: number;
    language: 'hsml' | 'csss' | 'shape' | 'styb';
}

// Spherical coordinate token
export interface SphericalCoordToken extends Token {
    type: TokenType.SPHERICAL_COORD;
    r: number;
    theta: number;
    phi: number;
}

// Solid angle token
export interface SolidAngleToken extends Token {
    type: TokenType.SOLID_ANGLE;
    omega: number;
    theta_min: number;
    theta_max: number;
    phi_min: number;
    phi_max: number;
}

// Matter state token
export interface MatterStateToken extends Token {
    type: TokenType.SOLID | TokenType.LIQUID | TokenType.GAS | TokenType.PLASMA;
    properties: {
        density?: number;
        temperature?: number;
        pressure?: number;
        conductivity?: number;
    };
}

export class HSMLMultiLexer {
    private source: string;
    private current: number = 0;
    private line: number = 1;
    private column: number = 1;
    private language: 'hsml' | 'csss' | 'shape' | 'styb';
    
    // Language-specific keywords
    private hsmlKeywords = new Set([
        'element', 'sphere', 'shell', 'point', 'group', 'container',
        'position', 'radius', 'material', 'behavior', 'style',
        'visible', 'interactive', 'matter', 'state'
    ]);
    
    private csssKeywords = new Set([
        'material', 'albedo', 'metallic', 'roughness', 'emission',
        'transparency', 'refraction', 'animation', 'keyframe',
        'transition', 'easing', 'duration', 'delay', 'repeat'
    ]);
    
    private shapeKeywords = new Set([
        'behavior', 'physics', 'force', 'gravity', 'collision',
        'constraint', 'interaction', 'event', 'trigger', 'response',
        'elastic', 'viscous', 'electromagnetic', 'thermal'
    ]);
    
    private stybKeywords = new Set([
        'bot', 'agent', 'parallel', 'distributed', 'render',
        'optimize', 'cache', 'performance', 'quality', 'lod',
        'frustum', 'occlusion', 'spatial', 'index'
    ]);
    
    constructor(source: string, language: 'hsml' | 'csss' | 'shape' | 'styb') {
        this.source = source;
        this.language = language;
    }
    
    // === LEXICAL ANALYSIS ===
    
    tokenize(): Token[] {
        const tokens: Token[] = [];
        
        while (!this.isAtEnd()) {
            const token = this.nextToken();
            if (token.type !== TokenType.WHITESPACE && token.type !== TokenType.COMMENT) {
                tokens.push(token);
            }
        }
        
        tokens.push(this.createToken(TokenType.EOF, ''));
        return tokens;
    }
    
    private nextToken(): Token {
        this.skipWhitespace();
        
        if (this.isAtEnd()) {
            return this.createToken(TokenType.EOF, '');
        }
        
        const char = this.peek();
        
        // Handle comments
        if (char === '/' && this.peekNext() === '/') {
            return this.handleComment();
        }
        
        // Handle numbers (including spherical coordinates)
        if (this.isDigit(char)) {
            return this.handleNumber();
        }
        
        // Handle identifiers and keywords
        if (this.isAlpha(char)) {
            return this.handleIdentifier();
        }
        
        // Handle strings
        if (char === '"' || char === "'") {
            return this.handleString();
        }
        
        // Handle spherical coordinates
        if (char === '(' && this.peekNext() === 'r') {
            return this.handleSphericalCoordinate();
        }
        
        // Handle solid angles
        if (char === 'Ω' || (char === 'O' && this.peekNext() === 'm')) {
            return this.handleSolidAngle();
        }
        
        // Handle operators and delimiters
        return this.handleOperator();
    }
    
    // === TOKEN HANDLERS ===
    
    private handleNumber(): Token {
        let value = '';
        let hasDecimal = false;
        
        while (this.isDigit(this.peek()) || this.peek() === '.') {
            if (this.peek() === '.') {
                if (hasDecimal) break;
                hasDecimal = true;
            }
            value += this.advance();
        }
        
        // Handle scientific notation
        if (this.peek() === 'e' || this.peek() === 'E') {
            value += this.advance();
            if (this.peek() === '+' || this.peek() === '-') {
                value += this.advance();
            }
            while (this.isDigit(this.peek())) {
                value += this.advance();
            }
        }
        
        return this.createToken(TokenType.NUMBER, value);
    }
    
    private handleIdentifier(): Token {
        let value = '';
        
        while (this.isAlphaNumeric(this.peek())) {
            value += this.advance();
        }
        
        // Check for keywords based on language
        const keywords = this.getKeywordsForLanguage();
        if (keywords.has(value.toLowerCase())) {
            return this.createToken(this.getKeywordTokenType(value), value);
        }
        
        // Check for matter states
        if (this.isMatterState(value)) {
            return this.createMatterStateToken(value);
        }
        
        return this.createToken(TokenType.IDENTIFIER, value);
    }
    
    private handleString(): Token {
        const quote = this.advance();
        let value = '';
        
        while (this.peek() !== quote && !this.isAtEnd()) {
            if (this.peek() === '\\') {
                this.advance(); // Skip escape character
                value += this.advance();
            } else {
                value += this.advance();
            }
        }
        
        if (this.isAtEnd()) {
            return this.createToken(TokenType.ERROR, 'Unterminated string');
        }
        
        this.advance(); // Consume closing quote
        return this.createToken(TokenType.STRING, value);
    }
    
    private handleSphericalCoordinate(): SphericalCoordToken {
        this.advance(); // Consume '('
        
        // Parse r component
        this.skipWhitespace();
        const r = this.parseNumber();
        
        this.skipWhitespace();
        if (this.advance() !== ',') {
            throw new Error('Expected comma in spherical coordinate');
        }
        
        // Parse theta component
        this.skipWhitespace();
        const theta = this.parseNumber();
        
        this.skipWhitespace();
        if (this.advance() !== ',') {
            throw new Error('Expected comma in spherical coordinate');
        }
        
        // Parse phi component
        this.skipWhitespace();
        const phi = this.parseNumber();
        
        this.skipWhitespace();
        if (this.advance() !== ')') {
            throw new Error('Expected closing parenthesis in spherical coordinate');
        }
        
        const token = this.createToken(TokenType.SPHERICAL_COORD, `(${r}, ${theta}, ${phi})`) as SphericalCoordToken;
        token.r = r;
        token.theta = theta;
        token.phi = phi;
        return token;
    }
    
    private handleSolidAngle(): SolidAngleToken {
        this.advance(); // Consume 'Ω' or 'O'
        
        if (this.peek() === 'm') {
            this.advance(); // Consume 'm'
        }
        
        this.skipWhitespace();
        if (this.advance() !== '(') {
            throw new Error('Expected opening parenthesis in solid angle');
        }
        
        // Parse solid angle components
        const omega = this.parseNumber();
        this.skipWhitespace();
        if (this.advance() !== ',') {
            throw new Error('Expected comma in solid angle');
        }
        
        const theta_min = this.parseNumber();
        this.skipWhitespace();
        if (this.advance() !== ',') {
            throw new Error('Expected comma in solid angle');
        }
        
        const theta_max = this.parseNumber();
        this.skipWhitespace();
        if (this.advance() !== ',') {
            throw new Error('Expected comma in solid angle');
        }
        
        const phi_min = this.parseNumber();
        this.skipWhitespace();
        if (this.advance() !== ',') {
            throw new Error('Expected comma in solid angle');
        }
        
        const phi_max = this.parseNumber();
        this.skipWhitespace();
        if (this.advance() !== ')') {
            throw new Error('Expected closing parenthesis in solid angle');
        }
        
        const token = this.createToken(TokenType.SOLID_ANGLE, `Ω(${omega}, ${theta_min}, ${theta_max}, ${phi_min}, ${phi_max})`) as SolidAngleToken;
        token.omega = omega;
        token.theta_min = theta_min;
        token.theta_max = theta_max;
        token.phi_min = phi_min;
        token.phi_max = phi_max;
        return token;
    }
    
    private handleComment(): Token {
        this.advance(); // Consume first '/'
        this.advance(); // Consume second '/'
        
        let value = '';
        while (this.peek() !== '\n' && !this.isAtEnd()) {
            value += this.advance();
        }
        
        return this.createToken(TokenType.COMMENT, value);
    }
    
    private handleOperator(): Token {
        const char = this.advance();
        
        switch (char) {
            case '(': return this.createToken(TokenType.LEFT_PAREN, char);
            case ')': return this.createToken(TokenType.RIGHT_PAREN, char);
            case '{': return this.createToken(TokenType.LEFT_BRACE, char);
            case '}': return this.createToken(TokenType.RIGHT_BRACE, char);
            case '[': return this.createToken(TokenType.LEFT_BRACKET, char);
            case ']': return this.createToken(TokenType.RIGHT_BRACKET, char);
            case ';': return this.createToken(TokenType.SEMICOLON, char);
            case ',': return this.createToken(TokenType.COMMA, char);
            case '.': return this.createToken(TokenType.DOT, char);
            case ':': return this.createToken(TokenType.COLON, char);
            case '+': return this.createToken(TokenType.PLUS, char);
            case '-': return this.createToken(TokenType.MINUS, char);
            case '*': return this.createToken(TokenType.MULTIPLY, char);
            case '/': return this.createToken(TokenType.DIVIDE, char);
            case '^': return this.createToken(TokenType.POWER, char);
            case '=': 
                if (this.peek() === '=') {
                    this.advance();
                    return this.createToken(TokenType.EQUALS, '==');
                }
                return this.createToken(TokenType.ASSIGN, char);
            case '!':
                if (this.peek() === '=') {
                    this.advance();
                    return this.createToken(TokenType.NOT_EQUALS, '!=');
                }
                return this.createToken(TokenType.ERROR, 'Unexpected character');
            case '<':
                if (this.peek() === '=') {
                    this.advance();
                    return this.createToken(TokenType.LESS_EQUAL, '<=');
                }
                return this.createToken(TokenType.LESS_THAN, char);
            case '>':
                if (this.peek() === '=') {
                    this.advance();
                    return this.createToken(TokenType.GREATER_EQUAL, '>=');
                }
                return this.createToken(TokenType.GREATER_THAN, char);
            default:
                return this.createToken(TokenType.ERROR, `Unexpected character: ${char}`);
        }
    }
    
    // === HELPER METHODS ===
    
    private getKeywordsForLanguage(): Set<string> {
        switch (this.language) {
            case 'hsml': return this.hsmlKeywords;
            case 'csss': return this.csssKeywords;
            case 'shape': return this.shapeKeywords;
            case 'styb': return this.stybKeywords;
        }
    }
    
    private getKeywordTokenType(keyword: string): TokenType {
        const lowerKeyword = keyword.toLowerCase();
        
        // HSML keywords
        if (['element', 'sphere', 'shell', 'point'].includes(lowerKeyword)) {
            return TokenType.ELEMENT_TAG;
        }
        
        // CSSS keywords
        if (['material', 'animation', 'keyframe', 'transition'].includes(lowerKeyword)) {
            return TokenType.MATERIAL;
        }
        
        // ShapeScript keywords
        if (['behavior', 'physics', 'force', 'collision'].includes(lowerKeyword)) {
            return TokenType.BEHAVIOR;
        }
        
        // StyleBot keywords
        if (['bot', 'agent', 'parallel', 'distributed'].includes(lowerKeyword)) {
            return TokenType.BOT;
        }
        
        return TokenType.IDENTIFIER;
    }
    
    private isMatterState(keyword: string): boolean {
        const lowerKeyword = keyword.toLowerCase();
        return ['solid', 'liquid', 'gas', 'plasma'].includes(lowerKeyword);
    }
    
    private createMatterStateToken(keyword: string): MatterStateToken {
        const token = this.createToken(
            keyword.toLowerCase() as TokenType.SOLID | TokenType.LIQUID | TokenType.GAS | TokenType.PLASMA,
            keyword
        ) as MatterStateToken;
        
        // Set default properties based on matter state
        switch (keyword.toLowerCase()) {
            case 'solid':
                token.properties = { density: 1000, temperature: 293.15, pressure: 101325 };
                break;
            case 'liquid':
                token.properties = { density: 1000, temperature: 293.15, pressure: 101325, conductivity: 0.6 };
                break;
            case 'gas':
                token.properties = { density: 1.225, temperature: 293.15, pressure: 101325 };
                break;
            case 'plasma':
                token.properties = { density: 1e-6, temperature: 10000, pressure: 101325, conductivity: 1e6 };
                break;
        }
        
        return token;
    }
    
    private parseNumber(): number {
        let value = '';
        while (this.isDigit(this.peek()) || this.peek() === '.') {
            value += this.advance();
        }
        return parseFloat(value);
    }
    
    private skipWhitespace(): void {
        while (this.isWhitespace(this.peek())) {
            if (this.advance() === '\n') {
                this.line++;
                this.column = 1;
            } else {
                this.column++;
            }
        }
    }
    
    private createToken(type: TokenType, value: string): Token {
        return {
            type,
            value,
            line: this.line,
            column: this.column,
            language: this.language
        };
    }
    
    private createErrorToken(message: string): Token {
        return {
            type: TokenType.ERROR,
            value: message,
            line: this.line,
            column: this.column,
            language: this.language
        };
    }
    
    // === UTILITY METHODS ===
    
    private advance(): string {
        const char = this.source[this.current];
        this.current++;
        this.column++;
        return char;
    }
    
    private peek(): string {
        if (this.isAtEnd()) return '\0';
        return this.source[this.current];
    }
    
    private peekNext(): string {
        if (this.current + 1 >= this.source.length) return '\0';
        return this.source[this.current + 1];
    }
    
    private isAtEnd(): boolean {
        return this.current >= this.source.length;
    }
    
    private isDigit(char: string): boolean {
        return char >= '0' && char <= '9';
    }
    
    private isAlpha(char: string): boolean {
        return (char >= 'a' && char <= 'z') || 
               (char >= 'A' && char <= 'Z') || 
               char === '_';
    }
    
    private isAlphaNumeric(char: string): boolean {
        return this.isAlpha(char) || this.isDigit(char);
    }
    
    private isWhitespace(char: string): boolean {
        return char === ' ' || char === '\t' || char === '\r' || char === '\n';
    }
} 