import { coordinateToRowColumn, expandCoordinatesRange, rowColumnToCoordinate, SGFColor, SGFCoordinate, SGFNode, SGFRowColumn, Tag } from "./sgf";

export class SGFGoban {

	latestMove: SGFCoordinate;
	nextToPlay: SGFColor;

	size: number;
	goban: SGFColor[][] = [];
	comment: string;
	triangles: {[coord: SGFCoordinate]: boolean} = {};
	squares: {[coord: SGFCoordinate]: boolean} = {};
	crosses: {[coord: SGFCoordinate]: boolean} = {};
	circles: {[coord: SGFCoordinate]: boolean} = {};
	labels: {[coord: SGFCoordinate]: string} = {};

	constructor(public sizeOrNode: number | SGFNode = 19) {
		let size = 19;
		let node: SGFNode | undefined;
		if (sizeOrNode instanceof SGFNode) {
			node = sizeOrNode as SGFNode;
			size = parseInt((sizeOrNode as SGFNode).getProperty(Tag.Size)) || 19;
		} else {
			size = sizeOrNode as number;
		}
		this.size = size;
		for (let row = 0; row < size; row++) {
			const r: SGFColor[] = [];
			for (let col = 0; col < size; col ++) {
				r.push(SGFColor.NONE);
			}
			this.goban.push(r);
		}
		if (node) {
			this.apply(node);
		}
	}

	clone() {
		const res = new SGFGoban(this.size);
		res.goban = JSON.parse(JSON.stringify(this.goban));
		return res;
	}

	row(r: number) {
		const res: SGFColor[] = [];
		for (let i = 0; i < this.size; i++) {
			res.push(this.goban[r][i]);
		}
		return res;
	}

	column(c: number) {
		const res: SGFColor[] = [];
		for (let i = 0; i < this.size; i++) {
			res.push(this.goban[i][c]);
		}
		return res;
	}

	coordinateValid(row, column: number) {
		return row >= 0 && row < this.size && column >= 0 && column < this.size;
	}

	isStoneAt(coord: SGFCoordinate | SGFRowColumn): boolean {
		const stone = this.stoneAt(coord);
		return stone == SGFColor.WHITE || stone == SGFColor.BLACK;
	}

	stoneAt(coord: SGFCoordinate | SGFRowColumn): SGFColor {
		let row: number, column: number;
		if ((coord as SGFRowColumn).push) {
			[row, column] = coord as SGFRowColumn;
		} else {
			[row, column] = coordinateToRowColumn(coord as SGFCoordinate);
		}

		if (this.coordinateValid(row, column)) {
			return this.goban[row]?.[column] as SGFColor;
		}
		return SGFColor.INVALID;
	}

	addStones(color: SGFColor, ...coords: SGFCoordinate[]) {
		for (const coord of coords) {
			if (coord?.indexOf(":") > 0) {
				// Point list => square of points
				const parts = coord.split(":");
				let [r1, c1] = coordinateToRowColumn(parts[0]);
				let [r2, c2] = coordinateToRowColumn(parts[1]);
				for (let row = Math.min(r1, r2); row <= Math.max(r1, r2); row++) {
					for (let col = Math.min(c1, c2); col <= Math.max(c1, c2); col++) {
						if (this.coordinateValid(row, col)) {
							this.goban[row][col] = color;
						}
					}
				}
			} else {
				let [row, column] = coordinateToRowColumn(coord as SGFCoordinate);
				if (this.coordinateValid(row, column)) {
					this.goban[row][column] = color;
				}
			}
		}
	}

	playStone(color: SGFColor, coords: SGFCoordinate): SGFCoordinate[] {
		this.latestMove = coords;
		if (color === SGFColor.WHITE) {
			this.nextToPlay = SGFColor.BLACK;
		} else if (color === SGFColor.BLACK) {
			this.nextToPlay = SGFColor.WHITE;
		}

		if (!coords) {
			return; // pass
		}

		let removed: SGFCoordinate[] = [];
		let [row, column] = coordinateToRowColumn(coords);
		if (this.coordinateValid(row, column)) {
			this.goban[row][column] = color;
			const groupInfos = [
				this.getGroupInfo(rowColumnToCoordinate([row+1, column])),
				this.getGroupInfo(rowColumnToCoordinate([row-1, column])),
				this.getGroupInfo(rowColumnToCoordinate([row, column-1])),
				this.getGroupInfo(rowColumnToCoordinate([row, column+1])),
			]
			for (const gi of groupInfos) {
				if (gi.groupColor !== SGFColor.INVALID && gi.groupColor !== SGFColor.NONE && gi.groupColor !== color && gi.adjacentFreeSpaces.length == 0) {
					for (const stoneCoord of gi.groupStones) {
						const color = this.stoneAt(stoneCoord);
						if (color === SGFColor.WHITE || color === SGFColor.BLACK) {
							this.addStones(SGFColor.NONE, stoneCoord);
							removed.push(stoneCoord);
						}
					}
				}
			}
		}
		return removed;
	}

	apply(node: SGFNode): SGFCoordinate[] {
		const ab = node.getProperties(Tag.AddBlack) || [];
		const aw = node.getProperties(Tag.AddWhite) || [];

		this.addStones(SGFColor.WHITE, ...(aw as SGFCoordinate[]));
		this.addStones(SGFColor.BLACK, ...(ab as SGFCoordinate[]));

		this.triangles = {};
		this.squares = {};
		this.crosses = {};
		this.circles = {};
		this.labels = {};

		this.comment = node.getProperty(Tag.Comment);
		for (const tr of expandCoordinatesRange(node.getProperties(Tag.Triangle))) { this.triangles[tr] = true; }
		for (const tr of expandCoordinatesRange(node.getProperties(Tag.Square))) { this.squares[tr] = true; }
		for (const tr of expandCoordinatesRange(node.getProperties(Tag.X))) { this.crosses[tr] = true; }
		for (const tr of expandCoordinatesRange(node.getProperties(Tag.Circle))) { this.circles[tr] = true; }
		for (const lb of node.getProperties(Tag.Label)||[]) {
			const parts = lb.split(":");
			for (let coord of expandCoordinatesRange(parts[0])) {
				this.labels[coord] = parts[1];
			}
		}

		const b = node.getProperty(Tag.Black);
		const w = node.getProperty(Tag.White);
		const player = node.getProperty(Tag.Player)
		if (b !== undefined) {
			return this.playStone(SGFColor.BLACK, b as SGFCoordinate)
		} else if (w !== undefined) {
			return this.playStone(SGFColor.WHITE, w as SGFCoordinate)
		} else if (player) {
			this.nextToPlay = player as SGFColor;
		} else if (node.children?.length > 0) {
			const child = node.children[0];
			if (child.getProperty(Tag.Black)) {
				this.nextToPlay = SGFColor.BLACK;
			} else if (child.getProperty(Tag.White)) {
				this.nextToPlay = SGFColor.WHITE;
			}
		}
	}

	getGroupInfo(coord: SGFCoordinate): GroupInfo {
		const res = new GroupInfo(this.stoneAt(coord));
		this.fillGroupInfo(coord, res);
		return res;
	}

	private fillGroupInfo(coord: SGFCoordinate, res: GroupInfo): GroupInfo {
		if (res.groupColor === SGFColor.NONE || res.groupColor === SGFColor.INVALID) {
			return res;
		}

		if (res.groupStones.indexOf(coord) < 0) {
			res.groupStones.push(coord);
		}

		let [row, column] = coordinateToRowColumn(coord);
		const neighborsCoords = [
			rowColumnToCoordinate([row-1, column]), // UP
			rowColumnToCoordinate([row+1, column]), // DOWN
			rowColumnToCoordinate([row, column-1]), // LEFT
			rowColumnToCoordinate([row, column+1]) // RIGHT
		]
		for (const neighborCoord of neighborsCoords) {
			const neighborStone = this.stoneAt(neighborCoord);
			if (neighborStone === SGFColor.INVALID) {
				continue;
			}
			if (neighborStone === SGFColor.NONE) {
				if (res.adjacentFreeSpaces.indexOf(neighborCoord) < 0) {
					res.adjacentFreeSpaces.push(neighborCoord);
				}
			} else if (neighborStone === res.groupColor) {
				// Same color => group:
				if (res.groupStones.indexOf(neighborCoord) < 0) {
					res.groupStones.push(neighborCoord);
					this.fillGroupInfo(neighborCoord, res);
					// TODO: recursion
				}
			} else if (neighborStone !== res.groupColor) {
				if (res.adjacentStones.indexOf(neighborCoord) < 0) {
					res.adjacentStones.push(neighborCoord);
				}
			} else {
				//???
			}
		}

		return res;
	}

	debugStr() {
		return this.goban.map(row => row.join("")).join("\n");
	}
}

class GroupInfo {

	public groupStones: SGFCoordinate[] = [];
	public adjacentStones: SGFCoordinate[] = [];
	public adjacentFreeSpaces: SGFCoordinate[] = [];

	constructor(public groupColor: SGFColor) {}
}