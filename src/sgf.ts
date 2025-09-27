import { SGFGoban } from "./goban";

export enum Tag { // TODO: Rename
	Annotations = "AN", // name of the person commenting the game.
	Application = "AP", // application that was used to create the SGF file (e.g. CGOban2,...).
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
	WhiteName = "PW", // name of the white player.
	Result = "RE", // result, usually in the format "B+R" (Black wins by resign) or "B+3.5" (black wins by 3.5).
	Round = "RO", // round (e.g.: 5th game).
	Rules = "RU", // ruleset (e.g.: Japanese).
	Source = "SO", // source of the SGF file.
	Size = "SZ", // size of the board, non-square boards are supported.
	TimeLimit = "TM", // time limit in seconds.
	User = "US", // name of the person who created the SGF file.
	WhiteRank = "WR", // rank of the White player.
	WhiteTeam = "WT", // name of the White team.

	Player = "PL", // color of player to start.

	AddBlack = "AB", // locations of Black stones to be placed on the board prior to the first move
	AddWhite = "AW", // locations of White stones to be placed on the board prior to the first move.
	Black = "B", // a move by Black at the location specified by the property value.
	White = "W", // a move by White at the location specified by the property value.

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
			// console.log(`${JSON.stringify(this)} w=${w}, h=${h}`);
			if (w > h) {
				n++;
				if (n % 2 == 0) {
					this.rowMin = Math.max(0, this.rowMin - 1);
				} else {
					this.rowMax = Math.min(size - 1, this.rowMax + 1);
				}
			} else if (w < h) {
				n++;
				if (n % 2 == 0) {
					this.colMin = Math.max(0, this.colMin - 1);
				} else {
					this.colMax = Math.min(size - 1, this.colMax + 1);
				}
			} else {
				return;
			}
		}
	}

	increase(size: number, n: number, minDistanceFromBorder: number) {
		if (this.colMin < minDistanceFromBorder) {
			this.colMin = 0;
		} else {
			this.colMin = Math.max(0, this.colMin - n);
		}

		if (this.rowMin < minDistanceFromBorder) {
			this.rowMin = 0;
		} else {
			this.rowMin = Math.max(0, this.rowMin - n);
		}

		if (this.colMax + minDistanceFromBorder >= size) {
			this.colMax = size - 1;
		} else {
			this.colMax = Math.min(size - 1, this.colMax + n);
		}

		if (this.rowMax + minDistanceFromBorder >= size) {
			this.rowMax = size - 1;
		} else {
			this.rowMax = Math.min(size - 1, this.rowMax + n);
		}
	}
}

export function expandCoordinatesRange(_coords: string | SGFCoordinate | string[] | undefined) {
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

	flattenToNode(target: SGFNode, enumerate = false): SGFNode {
		const path = this.findPath(target);
		if (!path?.length) {
			return new SGFNode([], []);
		}
		enumerate = true;
		console.log(`flattening with ${path?.length} nodes`);

		const rootPropertiesToKeep = {
			[Tag.Annotations]: true,
			[Tag.Application]: true,
			[Tag.BlackRank]: true,
			[Tag.BlackTeam]: true,
			[Tag.Copyright]: true,
			[Tag.Date]: true,
			[Tag.Event]: true,
			[Tag.FileFormat]: true,
			[Tag.Game]: true,
			[Tag.GameName]: true,
			[Tag.Handicap]: true,
			[Tag.Komi]: true,
			[Tag.Opening]: true,
			[Tag.Overtime]: true,
			[Tag.BlackName]: true,
			[Tag.Place]: true,
			[Tag.WhiteName]: true,
			[Tag.Result]: true,
			[Tag.Round]: true,
			[Tag.Rules]: true,
			[Tag.Source]: true,
			[Tag.Size]: true,
			[Tag.TimeLimit]: true,
			[Tag.User]: true,
			[Tag.WhiteRank]: true,
			[Tag.WhiteTeam]: true,
		} as {[tag: string]: boolean};

		const enumeratedLabels: {[coord: string]: number[]} = {};
		let n = 0;
		for (const tmpNode of path) {
			const [color, coord] = tmpNode.playerAndCoordinates();
			if (color && coord) {
				if (!enumeratedLabels[coord]) {
					enumeratedLabels[coord] = [];
				}
				n++;
				enumeratedLabels[coord].push(n);
			}
		}

		const newRootNode = new SGFNode();
		newRootNode.properties = this.properties.filter(p => rootPropertiesToKeep[p.name]);

		const targetTagsToCopy = [Tag.Comment, Tag.Triangle, Tag.Square, Tag.X, Tag.Circle, Tag.Label]
		for (const tag of targetTagsToCopy) {
			for (const val of target.getProperties(tag)||[]) {
				newRootNode.addProperty(tag, val);
			};
		}

		const goban = new SGFGoban();
		goban.applyNodes(...path)
		for (let row = 0; row < goban.size; row++) {
			for (let col = 0; col < goban.size; col ++) {
				const coord = rowColumnToCoordinate([row, col]);
				const color = goban.stoneAt(coord);
				if (color === SGFColor.BLACK) {
					// console.log(`Adding black to ${coord}`);
					newRootNode.addProperty(Tag.AddBlack, coord);
				}
				if (color === SGFColor.WHITE) {
					// console.log(`Adding white to ${coord}`);
					newRootNode.addProperty(Tag.AddWhite, coord);
				}
			}
		}
		newRootNode.children = target.children;

		const nextColor = target.getProperty(Tag.Player);
		if (!nextColor) {
			let [thisMoveColor] = target?.playerAndCoordinates() || [SGFColor.INVALID];
			let [nextMoveColor] = target?.firstChild()?.playerAndCoordinates() || [SGFColor.INVALID];
			if (nextMoveColor && nextMoveColor === SGFColor.WHITE) {
				newRootNode.setProperty(Tag.Player, SGFColor.WHITE);
			} else if (thisMoveColor && thisMoveColor === SGFColor.BLACK) {
				newRootNode.setProperty(Tag.Player, SGFColor.WHITE);
			}
		}

		if (enumerate) {
			for (const coord in enumeratedLabels) {
				for (const lb of enumeratedLabels[coord]) {
					newRootNode.addProperty(Tag.Label, `${coord}:${lb}`);
				}
			}
		}

		return newRootNode;
	}


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
			return path;
		}
		for (const child of this.children) {
			const subPath = child.findPath(subnode, path.slice());
			if (subPath) {
				return subPath;
			}
		}
		return [];
	}

	bounds(opts?: {includeNonStones: boolean}) {
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
			if (opts?.includeNonStones) {
				for (const e of node.getLabels() || []) {
					takenCoords.push(...expandCoordinatesRange(e.coord));
				}
				takenCoords.push(...expandCoordinatesRange(node.getProperty(Tag.Triangle)));
				takenCoords.push(...expandCoordinatesRange(node.getProperty(Tag.Circle)));
				takenCoords.push(...expandCoordinatesRange(node.getProperty(Tag.Square)));
				takenCoords.push(...expandCoordinatesRange(node.getProperty(Tag.X)));
			}
			for (const coord of takenCoords) {
				let [row, col] = coordinateToRowColumn(coord)
				console.log(`${coord} => row=${row}, col=${col}`);
				bounds.apply(row, col);
			}
		})
		return bounds;
	}

	findFirstProperty(p: Tag | string): string|undefined {
		let props = this.getProperties(p);
		if (!props) {
			return undefined;
		}
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

	getLabels() {
		const res: {coord: SGFCoordinate, label: string}[] = [];
		for (const prop of this.getProperties(Tag.Label)||[]) {
			const pos = prop.indexOf(":");
			if (pos > 0) {
				res.push({
					coord: prop.substring(0, pos),
					label: prop.substring(pos + 1)
				})
			}
		}
		return res;
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

	addProperty(prop: string, val: string) {
		for (const i in this.properties) {
			if (this.properties[i].name == prop) {
				this.properties[i].values.push(val);
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

	toSGFNode(): string {
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

	firstChild() {
		if (!this.children?.length) {
			return undefined;
		}
		return this.children[0];
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
		return [SGFColor.INVALID, ""];
	}

	mainLine() {
		const path: SGFNode[] = []
		let tmpNode: SGFNode = this;
		while (true) {
			if (tmpNode) {
				path.push(tmpNode);
				if (tmpNode.children?.[0]) {
					tmpNode = tmpNode.children[0];
				} else {
					break;
				}
			}
		}
		return path;
	}
}

export class SGFProperty {
	constructor(public name: string, public values: string[]) {}

	get value() {
		return this.values[0];
	}
}