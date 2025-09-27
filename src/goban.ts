import { coordinateToRowColumn, expandCoordinatesRange, rowColumnToCoordinate, SGFColor, SGFCoordinate, SGFNode, SGFRowColumn, Tag } from "./sgf";

/** Just the goban stones and some basic utility methods. */
export class GobanPosition {
	goban: SGFColor[][] = [];
	constructor(public readonly size: number, goban?: SGFColor[][]) {
		// console.log("size=" + size)
		this.size = size;
		if (goban) {
			this.goban = goban;
		} else {
			for (let row = 0; row < this.size; row++) {
				const r: SGFColor[] = [];
				for (let col = 0; col < this.size; col ++) {
					r.push(SGFColor.NONE);
				}
				this.goban.push(r);
			}
		}
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

	coordinateValid(row: number, column: number) {
		return row >= 0 && row < this.size && column >= 0 && column < this.size;
	}

	isStoneAt(coord: SGFCoordinate | SGFRowColumn): boolean {
		const stone = this.stoneAt(coord);
		return stone == SGFColor.WHITE || stone == SGFColor.BLACK;
	}

	stoneAt(coord: SGFCoordinate | SGFRowColumn): SGFColor {
		let row: number, column: number;
		if ((coord as SGFRowColumn)?.push) {
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

export class SGFGoban extends GobanPosition {

	latestMove: SGFCoordinate | undefined;
	nextToPlay: SGFColor = SGFColor.NONE;

	comment: string = "";
	triangles: {[coord: SGFCoordinate]: boolean} = {};
	squares: {[coord: SGFCoordinate]: boolean} = {};
	crosses: {[coord: SGFCoordinate]: boolean} = {};
	circles: {[coord: SGFCoordinate]: boolean} = {};
	labels: {[coord: SGFCoordinate]: string} = {};

	constructor(public sizeOrNode: number | SGFNode = 19) {
		super("number" == typeof sizeOrNode ? sizeOrNode as number : parseInt((sizeOrNode as SGFNode).getProperty(Tag.Size) || "") || 19);
		let node: SGFNode | undefined;
		if (sizeOrNode instanceof SGFNode) {
			node = sizeOrNode as SGFNode;
			this.applyNodes(node);
		}
	}

	clone() {
		const res = new SGFGoban(this.size);
		res.goban = JSON.parse(JSON.stringify(this.goban));
		return res;
	}

	playStone(color: SGFColor, coords: SGFCoordinate): SGFCoordinate[] {
		if (!coords) {
			return []; // pass
		}

		const newPosition = new GobanPosition(this.size, JSON.parse(JSON.stringify(this.goban)));
		let removed: SGFCoordinate[] = [];
		let [row, column] = coordinateToRowColumn(coords);
		if (newPosition.coordinateValid(row, column)) {
			newPosition.goban[row][column] = color;
			const groupInfos = [
				newPosition.getGroupInfo(rowColumnToCoordinate([row+1, column])),
				newPosition.getGroupInfo(rowColumnToCoordinate([row-1, column])),
				newPosition.getGroupInfo(rowColumnToCoordinate([row, column-1])),
				newPosition.getGroupInfo(rowColumnToCoordinate([row, column+1])),
			]
			for (const gi of groupInfos) {
				if (gi.groupColor !== SGFColor.INVALID && gi.groupColor !== SGFColor.NONE && gi.groupColor !== color && gi.adjacentFreeSpaces.length == 0) {
					for (const stoneCoord of gi.groupStones) {
						const color = newPosition.stoneAt(stoneCoord);
						if (color === SGFColor.WHITE || color === SGFColor.BLACK) {
							newPosition.addStones(SGFColor.NONE, stoneCoord);
							removed.push(stoneCoord);
						}
					}
				}
			}
		}

		// TODO: Check self-atari
		const playedStoneGroupInfo = newPosition.getGroupInfo(coords);
		if (playedStoneGroupInfo.groupStones.length > 0 && playedStoneGroupInfo.adjacentFreeSpaces.length == 0) {
			throw new Error("Suicide not allowed");
		}

		this.goban = newPosition.goban;

		this.latestMove = coords;
		if (color === SGFColor.WHITE) {
			this.nextToPlay = SGFColor.BLACK;
		} else if (color === SGFColor.BLACK) {
			this.nextToPlay = SGFColor.WHITE;
		}

		return removed;
	}

	applyNodes(...nodes: SGFNode[]): SGFCoordinate[] {
		let res: SGFCoordinate[] = [];
		for (const node of nodes) {
			res = this.applySingleNode(node);
		}
		return res;
	}

	private applySingleNode(node: SGFNode): SGFCoordinate[] {

		const ab = node.getProperties(Tag.AddBlack) || [];
		const aw = node.getProperties(Tag.AddWhite) || [];

		this.addStones(SGFColor.WHITE, ...(aw as SGFCoordinate[]));
		this.addStones(SGFColor.BLACK, ...(ab as SGFCoordinate[]));

		this.triangles = {};
		this.squares = {};
		this.crosses = {};
		this.circles = {};
		this.labels = {};

		this.comment = node.getProperty(Tag.Comment) || "";
		for (const tr of expandCoordinatesRange(node.getProperties(Tag.Triangle))) { this.triangles[tr] = true; }
		for (const tr of expandCoordinatesRange(node.getProperties(Tag.Square))) { this.squares[tr] = true; }
		for (const tr of expandCoordinatesRange(node.getProperties(Tag.X))) { this.crosses[tr] = true; }
		for (const tr of expandCoordinatesRange(node.getProperties(Tag.Circle))) { this.circles[tr] = true; }
		for (const lb of node.getLabels()||[]) {
			for (let coord of expandCoordinatesRange(lb.coord)) {
				this.labels[coord] = lb.label;
			}
		}

		let [color, coords] = node.playerAndCoordinates();
		if (coords) {
			const existingStone = this.stoneAt(coords)
			if (existingStone == SGFColor.BLACK || existingStone == SGFColor.WHITE) {
				throw new Error(`Already taken: ${coords}`);
			}
		}

		const player = node.getProperty(Tag.Player)
		if (color == SGFColor.BLACK) {
			return this.playStone(SGFColor.BLACK, coords)
		} else if (color == SGFColor.WHITE) {
			return this.playStone(SGFColor.WHITE, coords)
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
		return [];
	}

}

class GroupInfo {

	public groupStones: SGFCoordinate[] = [];
	public adjacentStones: SGFCoordinate[] = [];
	public adjacentFreeSpaces: SGFCoordinate[] = [];

	constructor(public groupColor: SGFColor) {}
}