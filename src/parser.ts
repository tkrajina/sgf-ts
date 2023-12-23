import { SGFNode, SGFProperty } from "./sgf";

export function parseSGF(sgf: string) {
	return new SGFParser(sgf).parse();
}

export function parseSGFCollection(sgf: string) {
	const parser = new SGFParser(sgf);
	let node: SGFNode | undefined;
	const result: SGFNode[] = [];
	while (node = parser.parse()) {
		result.push(node);
		if (parser.unparsed().trim().length == 0) {
			break;
		}
	}
	return result;
}

export class SGFParser {
	str: string;
	position = 0;

	constructor(str: string) {
		this.str = str;
		this.position = 0;
	}

	readWhile(f: (prev: string, current: string, next: string) => boolean) {
		let res = "";
		while (f(this.str[this.position - 1], this.str[this.position], this.str[this.position + 1])) {
			res += this.str[this.position];
			this.position++;
		}
		return res;
	}

	readNext() {
		return this.str[this.position + 1];
	}

	read() {
		return this.str[this.position];
	}

	readAndNext() {
		const res = this.read();
		this.next();
		return res;
	}

	next() {
		this.position ++;
		return this.read();
	}

	previous() {
		this.position --
		return this.read();
	}


	debugPositionStr() {
		return `...${this.str.substring(this.position - 10, this.position)}<-- position ${this.position} -->${this.str[this.position]}${this.str.substring(this.position+1)}...`
	}

	readBranch() {
		this.skipWhitespaces();
		const ch = this.read();
		if (ch != "(") {
			throw new Error(`Invalid start of sgf (${ch}) at position ${this.position}`);
		}
	}

	readNode() {
		this.skipWhitespaces();
		// console.log(`Reading node from ${this.debugPositionStr()}`);

		if (this.read() != ";") {
			throw new Error(`"Move not starting with ';' in pos ${this.position}`);
		}
		this.next();
		this.skipWhitespaces();

		const tags: SGFProperty[] = [];
		const children: SGFNode[] = [];

		if (isAlpha(this.read())) {
			// console.log("properties: " + this.debugPositionStr())
			tags.push(...this.readProperties());
		} else {
			// console.log("no properties: " + this.debugPositionStr())
		}

		const node = new SGFNode(tags, children);

		this.skipWhitespaces();
		const ch = this.read();
		if (ch === ";") {
			// console.log("reading subnode: " + this.debugPositionStr());
			const subnode = this.readNode();
			children.push(subnode);
		} else if (ch === "(") {
			// console.log("reading subtrees: " + this.debugPositionStr());
			children.push(...this.readSubtrees())
		}

		return node;
	}

	readSubtrees() {
		var subtrees: SGFNode[] = [];
		for (let node = this.readNextSubtree(); !!node; node = this.readNextSubtree()) {
			//console.log(`tag: ${JSON.stringify(tag)}`)
			subtrees.push(node);
		}
		return subtrees;
	}

	parse(): SGFNode {
		const node = this.readNextSubtree();
		if (!node) {
			throw new Error("No SGF tree found");
		}
		return node;
	}

	unparsed(): string {
		return this.str.substring(this.position);
	}

	readNextSubtree() {
		this.skipWhitespaces();
		// console.log(`Reading subtree from ${this.debugPositionStr()}`);
		if (this.read() != "(") {
			return null;
		}
		this.next();

		const node = this.readNode();

		this.skipWhitespaces();
		if (this.read() != ")") {
			throw new Error(`Expected end of subtree in ${this.debugPositionStr()}`);
		}
		this.next();

		return node;
	}

	skipWhitespaces() {
		this.readWhile((_prev, curr, _next) => {
			return !!curr && curr.trim().length == 0;
		})
	}

	readProperty(): SGFProperty {
		// console.log(`reading property ${this.debugPositionStr()}`);
		this.skipWhitespaces();
		const tag = this.readWhile((_prev, curr, _next) => {
			return isAlpha(curr);
		})
		if (!tag) {
			return null;
		}

		this.skipWhitespaces();
		const values: string[] = [];

		while (true) {
			if (this.read() != "[") {
				break;
			}
			this.next();
			// console.log(`reading val from ${this.debugPositionStr()}`);
			const value = this.readWhile((_prev, curr, next) => {
				if (curr === undefined) {
					return false;
				}
				if (curr == "\\" && next == "]") {
					this.next();
				}
				return curr != "]";
			})
			if (this.read() != "]") {
				throw new Error(`property values closed with "]": ${this.debugPositionStr()}`);
			}
			values.push(value);
			this.next()
			this.skipWhitespaces();
		}

		if (values.length === 0) {
			throw new Error(`property values not found: ${this.debugPositionStr()}`);
		}
		this.skipWhitespaces();

		return new SGFProperty(tag, values);
	}

	readProperties() {
		const properties: SGFProperty[] = [];
		for (let tag = this.readProperty(); !!tag; tag = this.readProperty()) {
			properties.push(tag);
		}
		return properties;
	}

}

const alpha = "qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM";

export function isAlpha(ch: string) {
	return alpha.indexOf(ch) >= 0
}