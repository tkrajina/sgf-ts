import { coordinateToRowColumn, expandCoordinatesRange, rowColumnToCoordinate, SGFColor, SGFNode, Tag } from "./sgf";
/** Just the goban stones and some basic utility methods. */
export class GobanPosition {
    constructor(size, goban) {
        this.size = size;
        this.goban = [];
        // console.log("size=" + size)
        this.size = size;
        if (goban) {
            this.goban = goban;
        }
        else {
            for (let row = 0; row < this.size; row++) {
                const r = [];
                for (let col = 0; col < this.size; col++) {
                    r.push(SGFColor.NONE);
                }
                this.goban.push(r);
            }
        }
    }
    row(r) {
        const res = [];
        for (let i = 0; i < this.size; i++) {
            res.push(this.goban[r][i]);
        }
        return res;
    }
    column(c) {
        const res = [];
        for (let i = 0; i < this.size; i++) {
            res.push(this.goban[i][c]);
        }
        return res;
    }
    coordinateValid(row, column) {
        return row >= 0 && row < this.size && column >= 0 && column < this.size;
    }
    isStoneAt(coord) {
        const stone = this.stoneAt(coord);
        return stone == SGFColor.WHITE || stone == SGFColor.BLACK;
    }
    stoneAt(coord) {
        var _a;
        let row, column;
        if (coord === null || coord === void 0 ? void 0 : coord.push) {
            [row, column] = coord;
        }
        else {
            [row, column] = coordinateToRowColumn(coord);
        }
        if (this.coordinateValid(row, column)) {
            return (_a = this.goban[row]) === null || _a === void 0 ? void 0 : _a[column];
        }
        return SGFColor.INVALID;
    }
    addStones(color, ...coords) {
        for (const coord of coords) {
            if ((coord === null || coord === void 0 ? void 0 : coord.indexOf(":")) > 0) {
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
            }
            else {
                let [row, column] = coordinateToRowColumn(coord);
                if (this.coordinateValid(row, column)) {
                    this.goban[row][column] = color;
                }
            }
        }
    }
    getGroupInfo(coord) {
        const res = new GroupInfo(this.stoneAt(coord));
        this.fillGroupInfo(coord, res);
        return res;
    }
    fillGroupInfo(coord, res) {
        if (res.groupColor === SGFColor.NONE || res.groupColor === SGFColor.INVALID) {
            return res;
        }
        if (res.groupStones.indexOf(coord) < 0) {
            res.groupStones.push(coord);
        }
        let [row, column] = coordinateToRowColumn(coord);
        const neighborsCoords = [
            rowColumnToCoordinate([row - 1, column]),
            rowColumnToCoordinate([row + 1, column]),
            rowColumnToCoordinate([row, column - 1]),
            rowColumnToCoordinate([row, column + 1]) // RIGHT
        ];
        for (const neighborCoord of neighborsCoords) {
            const neighborStone = this.stoneAt(neighborCoord);
            if (neighborStone === SGFColor.INVALID) {
                continue;
            }
            if (neighborStone === SGFColor.NONE) {
                if (res.adjacentFreeSpaces.indexOf(neighborCoord) < 0) {
                    res.adjacentFreeSpaces.push(neighborCoord);
                }
            }
            else if (neighborStone === res.groupColor) {
                // Same color => group:
                if (res.groupStones.indexOf(neighborCoord) < 0) {
                    res.groupStones.push(neighborCoord);
                    this.fillGroupInfo(neighborCoord, res);
                    // TODO: recursion
                }
            }
            else if (neighborStone !== res.groupColor) {
                if (res.adjacentStones.indexOf(neighborCoord) < 0) {
                    res.adjacentStones.push(neighborCoord);
                }
            }
            else {
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
    constructor(sizeOrNode = 19) {
        super("number" == typeof sizeOrNode ? sizeOrNode : parseInt(sizeOrNode.getProperty(Tag.Size) || "") || 19);
        this.sizeOrNode = sizeOrNode;
        this.nextToPlay = SGFColor.NONE;
        this.comment = "";
        this.triangles = {};
        this.squares = {};
        this.crosses = {};
        this.circles = {};
        this.labels = {};
        let node;
        if (sizeOrNode instanceof SGFNode) {
            node = sizeOrNode;
            this.applyNodes(node);
        }
    }
    clone() {
        const res = new SGFGoban(this.size);
        res.goban = JSON.parse(JSON.stringify(this.goban));
        return res;
    }
    playStone(color, coords) {
        if (!coords) {
            return []; // pass
        }
        const newPosition = new GobanPosition(this.size, JSON.parse(JSON.stringify(this.goban)));
        let removed = [];
        let [row, column] = coordinateToRowColumn(coords);
        if (newPosition.coordinateValid(row, column)) {
            newPosition.goban[row][column] = color;
            const groupInfos = [
                newPosition.getGroupInfo(rowColumnToCoordinate([row + 1, column])),
                newPosition.getGroupInfo(rowColumnToCoordinate([row - 1, column])),
                newPosition.getGroupInfo(rowColumnToCoordinate([row, column - 1])),
                newPosition.getGroupInfo(rowColumnToCoordinate([row, column + 1])),
            ];
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
        }
        else if (color === SGFColor.BLACK) {
            this.nextToPlay = SGFColor.WHITE;
        }
        return removed;
    }
    applyNodes(...nodes) {
        let res = [];
        for (const node of nodes) {
            res = this.applySingleNode(node);
        }
        return res;
    }
    applySingleNode(node) {
        var _a;
        const ab = node.getProperties(Tag.AddBlack) || [];
        const aw = node.getProperties(Tag.AddWhite) || [];
        this.addStones(SGFColor.WHITE, ...aw);
        this.addStones(SGFColor.BLACK, ...ab);
        this.triangles = {};
        this.squares = {};
        this.crosses = {};
        this.circles = {};
        this.labels = {};
        this.comment = node.getProperty(Tag.Comment) || "";
        for (const tr of expandCoordinatesRange(node.getProperties(Tag.Triangle))) {
            this.triangles[tr] = true;
        }
        for (const tr of expandCoordinatesRange(node.getProperties(Tag.Square))) {
            this.squares[tr] = true;
        }
        for (const tr of expandCoordinatesRange(node.getProperties(Tag.X))) {
            this.crosses[tr] = true;
        }
        for (const tr of expandCoordinatesRange(node.getProperties(Tag.Circle))) {
            this.circles[tr] = true;
        }
        for (const lb of node.getLabels() || []) {
            for (let coord of expandCoordinatesRange(lb.coord)) {
                this.labels[coord] = lb.label;
            }
        }
        let [color, coords] = node.playerAndCoordinates();
        if (coords) {
            const existingStone = this.stoneAt(coords);
            if (existingStone == SGFColor.BLACK || existingStone == SGFColor.WHITE) {
                throw new Error(`Already taken: ${coords}`);
            }
        }
        const player = node.getProperty(Tag.Player);
        if (color == SGFColor.BLACK) {
            return this.playStone(SGFColor.BLACK, coords);
        }
        else if (color == SGFColor.WHITE) {
            return this.playStone(SGFColor.WHITE, coords);
        }
        else if (player) {
            this.nextToPlay = player;
        }
        else if (((_a = node.children) === null || _a === void 0 ? void 0 : _a.length) > 0) {
            const child = node.children[0];
            if (child.getProperty(Tag.Black)) {
                this.nextToPlay = SGFColor.BLACK;
            }
            else if (child.getProperty(Tag.White)) {
                this.nextToPlay = SGFColor.WHITE;
            }
        }
        return [];
    }
}
class GroupInfo {
    constructor(groupColor) {
        this.groupColor = groupColor;
        this.groupStones = [];
        this.adjacentStones = [];
        this.adjacentFreeSpaces = [];
    }
}
