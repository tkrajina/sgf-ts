export enum Tag { // TODO: Rename
	AddBlack = "AB", // locations of Black stones to be placed on the board prior to the first move
	AddWhite = "AW", // locations of White stones to be placed on the board prior to the first move.
	Annotations = "AN", // name of the person commenting the game.
	Application = "AP", // application that was used to create the SGF file (e.g. CGOban2,...).
	Black = "B", // a move by Black at the location specified by the property value.
	BlackRank = "BR", // rank of the Black player.
	BlackTeam = "BT", // na1Gme of the Black team.
	Comment = "C", // a comment.
	Copyright = "CP", // copyright information.
	Date = "DT", // date of the game.
	Event = "EV", // name of the event (e.g. 58th Honinbō Title Match).
	FileFormat = "FF", // version of SGF specification governing this SGF file.
	Game = "GM", // type of game represented by this SGF file. A property value of 1 refers to Go.
	GameName = "GN", // name of the game record.
	Handicap = "HA", // the number of handicap stones given to Black. Placement of the handicap stones are set using the AB property.
	Komi = "KM", // komi.
	Opening = "ON", // information about the opening (Fuseki), rarely used in any file.
	Overtime = "OT", // overtime system.
	BlackName = "PB", // name of the black player.
	Place = "PC", // place where the game was played (e.g.: Tokyo).
	Player = "PL", // color of player to start.
	WhiteName = "PW", // name of the white player.
	Result = "RE", // result, usually in the format "B+R" (Black wins by resign) or "B+3.5" (black wins by 3.5).
	Round = "RO", // round (e.g.: 5th game).
	Rules = "RU", // ruleset (e.g.: Japanese).
	Source = "SO", // source of the SGF file.
	Size = "SZ", // size of the board, non-square boards are supported.
	TimeLimit = "TM", // time limit in seconds.
	User = "US", // name of the person who created the SGF file.
	White = "W", // a move by White at the location specified by the property value.
	WhiteRank = "WR", // rank of the White player.
	WhiteTeam = "WT", // name of the White team.

	// Additional
	Triangle = "TR",
	Square   = "SQ",
	Circle   = "CR",
	X        = "MA",
	Label    = "LB",

}

export class Bounds {
	constructor(public rowMax = NaN, public rowMin = NaN, public colMax = NaN, public colMin = NaN) {
	}

	apply(row: number, col: number) {
		this.rowMin = isNaN(this.rowMin) ? row : Math.min(this.rowMin, row);
		this.rowMax = isNaN(this.rowMax) ? row : Math.max(this.rowMax, row);
		this.colMin = isNaN(this.colMin) ? col : Math.min(this.colMin, col);
		this.colMax = isNaN(this.colMax) ? col : Math.max(this.colMax, col);
		console.log(`apply ${row}, ${col} => ${JSON.stringify(this)}`);
	}

	makeSquare(size: number) {
		let w = 0;
		let h = 1;
		let n = 0;
		while (w !== h) {
			if (n > 50) {
				return;
			}
			w = this.colMax - this.colMin;
			h = this.rowMax - this.rowMin;
			if (w > h) {
				n++;
				if (n % 2 == 0) {
					this.rowMin = Math.max(0, this.rowMin - 1);
				} else {
					this.rowMax = Math.min(size, this.rowMax + 1);
				}
			} else if (w < h) {
				n++;
				if (n % 2 == 0) {
					this.colMin = Math.max(0, this.colMin - 1);
				} else {
					this.colMax = Math.min(size, this.colMax + 1);
				}
			} else {
				return;
			}
		}
	}

	increase(size: number, n: number, minDistanceFromBorder: number) {
		this.colMin = Math.max(0, this.colMin - n);
		this.colMax = Math.min(size - 1, this.colMax + n);
		this.rowMin = Math.max(0, this.rowMin - n);
		this.rowMax = Math.min(size - 1, this.rowMax + n);

		if (this.colMin < minDistanceFromBorder) {
			this.colMin = 0;
		}
		if (this.rowMin < minDistanceFromBorder) {
			this.rowMin = 0;
		}
		if (this.colMax > size - minDistanceFromBorder) {
			this.colMax = size - 1;
		}
		if (this.rowMax < size - minDistanceFromBorder) {
			this.colMax = size - 1;
		}
	}
}

export function expandCoordinatesRange(_coords: string | SGFCoordinate | string[]) {
	if (!_coords) {
		return [];
	}

	const res: SGFCoordinate[] = [];

	if (!(_coords as string[])?.push) {
		_coords = [_coords as string];
	}
	for (let coord of _coords) {
		const parts = (coord as string).split(":");
		if (parts.length == 2) {
			console.log(parts[0], parts[1])
			let [x1, y1] = coordinateToRowColumn(parts[0]);
			let [x2, y2] = coordinateToRowColumn(parts[1]);
			console.log(x1, y1, x2, y2)
			const minX = Math.min(x1, x2);
			const maxX = Math.max(x1, x2);
			const minY = Math.min(y1, y2);
			const maxY = Math.max(y1, y2);
			for (let x = minX; x <= maxX; x++) {
				for (let y = minY; y <= maxY; y++) {
					res.push(rowColumnToCoordinate([x, y]));
				}
			}
		} else {
			res.push(coord);
		}
	}
	return res;
}


export enum SGFColor {
	BLACK = "B",
	WHITE = "W",
	NONE = ".",
	INVALID = " "
}

export type SGFCoordinate = string;
export type SGFRowColumn = [number, number];

export function coordinateToRowColumn(c: SGFCoordinate): SGFRowColumn {
	const row = c.charCodeAt(0);
	const col = c.charCodeAt(1);
	return [col - 97, row - 97,] as SGFRowColumn;
}

export function rowColumnToCoordinate(c: SGFRowColumn): SGFCoordinate {
	return String.fromCharCode(97+c[1]) + String.fromCharCode(97+c[0]);
}

export class SGFNode {

	constructor(public properties: SGFProperty[] = [], public children: SGFNode[] = []) {}

	/** Walk through the subtree, if f() return `false` -> stop "walking". */
	walkWhile(f: (lastNode: SGFNode, path: SGFNode[]) => boolean, path?: SGFNode[]): boolean {
		if (!path) {
			path = [this];
		}
		if (!f(path[path.length - 1], path)) {
			return false;
		}
		for (const sub of this?.children||[]) {
			if (!sub.walkWhile(f, [...path, sub])) {
				return false;
			}
		}
		return true;
	}

	walkUntil(f: (lastNode: SGFNode, path: SGFNode[]) => boolean, path?: SGFNode[]) {
		this.walkWhile((node: SGFNode, path: SGFNode[]) => {
			return !f(node, path);
		})
	}

	walk(f: (node: SGFNode, subnode: SGFNode[]) => void) {
		this.walkWhile((node: SGFNode, path: SGFNode[]) => {
			f(node, path);
			return true;
		})
	}

	findPath(subnode: SGFNode, path?: SGFNode[]): SGFNode[] {
		if (!path) {
			path = [];
		}
		path.push(this);
		if (this == subnode) {
			return path;
		}
		if (!this.children?.length) {
			return null;
		}
		for (const child of this.children) {
			const subPath = child.findPath(subnode, path.slice());
			if (subPath) {
				return subPath;
			}
		}
		return null;
	}

	bounds() {
		const bounds = new Bounds();
		this.walk((node: SGFNode, path: SGFNode[]) => {
			const takenCoords = [];
			for (const tr of node.getProperties(Tag.AddWhite) || []) {
				takenCoords.push(...expandCoordinatesRange(tr))
			}
			for (const tr of node.getProperties(Tag.AddBlack) || []) {
				takenCoords.push(...expandCoordinatesRange(tr))
			}
			takenCoords.push(...expandCoordinatesRange(node.getProperty(Tag.Black)))
			takenCoords.push(...expandCoordinatesRange(node.getProperty(Tag.White)))
			for (const coord of takenCoords) {
				let [row, col] = coordinateToRowColumn(coord)
				bounds.apply(row, col);
			}
		})
		return bounds;
	}

	findFirstProperty(p: Tag | string) {
		let props = this.getProperties(p);
		if (props?.length > 0) {
			return props.find(s => !!s) || "";
		}
		for (const sub of this.children) {
			const prop = sub.findFirstProperty(p)
			if (prop) {
				return prop;
			}
		}
		return undefined;
	}

	/** Returnd undefined if not defined. */
	getProperties(prop: string) {
		let props: string[]|undefined = undefined;
		for (const i in this.properties) {
			if (this.properties[i].name === prop) {
				if (props === undefined) {
					props = [];
				}
				props.push(...this.properties[i].values);
			}
		}
		return props;
	}

	getComment() {
		return this.getProperty(Tag.Comment)
	}

	getComments() {
		return this.getProperties(Tag.Comment)
	}

	getProperty(prop: string) {
		for (const i in this.properties) {
			if (this.properties[i].name === prop) {
				return this.properties[i].value;
			}
		}
		return undefined;
	}

	setProperty(prop: string, val: string) {
		for (const i in this.properties) {
			if (this.properties[i].name == prop) {
				this.properties[i].values = [val];
				return;
			}
		}
		this.properties.push(new SGFProperty(prop, [val]));
	}

	setMove(color: SGFColor, coord: SGFCoordinate) {
		switch (color) {
			case SGFColor.WHITE:
				this.setProperty(Tag.White, coord)
				break;
			case SGFColor.BLACK:
				this.setProperty(Tag.Black, coord)
				break;
		}
	}

	toSGF() {
		return "(" + this.toSGFNode() + ")";
	}

	toSGFNode() {
		let sgf = ";";
		for (const prop of this.properties) {
			sgf += prop.name;
			for (const val of prop.values) {
				sgf += `[${val.replace(/\]/g, "\\]")}]`
			}
		}
		if (this.children.length == 0) {
			return sgf;
		} else if (this.children.length == 1) {
			return sgf + this.children[0].toSGFNode();
		} else {
			for (const child of this.children) {
				sgf += "(" + child.toSGFNode() + ")";
			}
		}
		return sgf;
	}

	appendNode(node: SGFNode) {
		this.children.push(node);
	}

	prependNode(node: SGFNode) {
		this.children.unshift(node);
	}

	playerAndCoordinates(): [SGFColor, string] {
		const b = this.getProperty(Tag.Black);
		if (b !== undefined)  {
			return [SGFColor.BLACK, b];
		}
		const w = this.getProperty(Tag.White);
		if (w !== undefined)  {
			return [SGFColor.WHITE, w];
		}
		return [undefined, undefined];
	}
}

export class SGFProperty {
	constructor(public name: string, public values: string[]) {}

	get value() {
		return this.values[0];
	}
}