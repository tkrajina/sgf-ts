import { SGFGoban } from "./goban";
export var Tag;
(function (Tag) {
    Tag["Annotations"] = "AN";
    Tag["Application"] = "AP";
    Tag["BlackRank"] = "BR";
    Tag["BlackTeam"] = "BT";
    Tag["Comment"] = "C";
    Tag["Copyright"] = "CP";
    Tag["Date"] = "DT";
    Tag["Event"] = "EV";
    Tag["FileFormat"] = "FF";
    Tag["Game"] = "GM";
    Tag["GameName"] = "GN";
    Tag["Handicap"] = "HA";
    Tag["Komi"] = "KM";
    Tag["Opening"] = "ON";
    Tag["Overtime"] = "OT";
    Tag["BlackName"] = "PB";
    Tag["Place"] = "PC";
    Tag["WhiteName"] = "PW";
    Tag["Result"] = "RE";
    Tag["Round"] = "RO";
    Tag["Rules"] = "RU";
    Tag["Source"] = "SO";
    Tag["Size"] = "SZ";
    Tag["TimeLimit"] = "TM";
    Tag["User"] = "US";
    Tag["WhiteRank"] = "WR";
    Tag["WhiteTeam"] = "WT";
    Tag["Player"] = "PL";
    Tag["AddBlack"] = "AB";
    Tag["AddWhite"] = "AW";
    Tag["Black"] = "B";
    Tag["White"] = "W";
    // Additional
    Tag["Triangle"] = "TR";
    Tag["Square"] = "SQ";
    Tag["Circle"] = "CR";
    Tag["X"] = "MA";
    Tag["Label"] = "LB";
})(Tag || (Tag = {}));
export class Bounds {
    constructor(rowMax = NaN, rowMin = NaN, colMax = NaN, colMin = NaN) {
        this.rowMax = rowMax;
        this.rowMin = rowMin;
        this.colMax = colMax;
        this.colMin = colMin;
    }
    apply(row, col) {
        this.rowMin = isNaN(this.rowMin) ? row : Math.min(this.rowMin, row);
        this.rowMax = isNaN(this.rowMax) ? row : Math.max(this.rowMax, row);
        this.colMin = isNaN(this.colMin) ? col : Math.min(this.colMin, col);
        this.colMax = isNaN(this.colMax) ? col : Math.max(this.colMax, col);
        console.log(`apply ${row}, ${col} => ${JSON.stringify(this)}`);
    }
    makeSquare(size) {
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
                }
                else {
                    this.rowMax = Math.min(size - 1, this.rowMax + 1);
                }
            }
            else if (w < h) {
                n++;
                if (n % 2 == 0) {
                    this.colMin = Math.max(0, this.colMin - 1);
                }
                else {
                    this.colMax = Math.min(size - 1, this.colMax + 1);
                }
            }
            else {
                return;
            }
        }
    }
    increase(size, n, minDistanceFromBorder) {
        if (this.colMin < minDistanceFromBorder) {
            this.colMin = 0;
        }
        else {
            this.colMin = Math.max(0, this.colMin - n);
        }
        if (this.rowMin < minDistanceFromBorder) {
            this.rowMin = 0;
        }
        else {
            this.rowMin = Math.max(0, this.rowMin - n);
        }
        if (this.colMax + minDistanceFromBorder >= size) {
            this.colMax = size - 1;
        }
        else {
            this.colMax = Math.min(size - 1, this.colMax + n);
        }
        if (this.rowMax + minDistanceFromBorder >= size) {
            this.rowMax = size - 1;
        }
        else {
            this.rowMax = Math.min(size - 1, this.rowMax + n);
        }
    }
}
export function expandCoordinatesRange(_coords) {
    if (!_coords) {
        return [];
    }
    const res = [];
    if (!(_coords === null || _coords === void 0 ? void 0 : _coords.push)) {
        _coords = [_coords];
    }
    for (let coord of _coords) {
        const parts = coord.split(":");
        if (parts.length == 2) {
            console.log(parts[0], parts[1]);
            let [x1, y1] = coordinateToRowColumn(parts[0]);
            let [x2, y2] = coordinateToRowColumn(parts[1]);
            console.log(x1, y1, x2, y2);
            const minX = Math.min(x1, x2);
            const maxX = Math.max(x1, x2);
            const minY = Math.min(y1, y2);
            const maxY = Math.max(y1, y2);
            for (let x = minX; x <= maxX; x++) {
                for (let y = minY; y <= maxY; y++) {
                    res.push(rowColumnToCoordinate([x, y]));
                }
            }
        }
        else {
            res.push(coord);
        }
    }
    return res;
}
export var SGFColor;
(function (SGFColor) {
    SGFColor["BLACK"] = "B";
    SGFColor["WHITE"] = "W";
    SGFColor["NONE"] = ".";
    SGFColor["INVALID"] = " ";
})(SGFColor || (SGFColor = {}));
export function coordinateToRowColumn(c) {
    const row = c.charCodeAt(0);
    const col = c.charCodeAt(1);
    return [col - 97, row - 97,];
}
export function rowColumnToCoordinate(c) {
    return String.fromCharCode(97 + c[1]) + String.fromCharCode(97 + c[0]);
}
export class SGFNode {
    constructor(properties = [], children = []) {
        this.properties = properties;
        this.children = children;
    }
    flattenToNode(target, opts) {
        var _a;
        const path = this.findPath(target);
        if (!opts) {
            opts = { enumerate: false, propsToKeep: [] };
        }
        if (!(path === null || path === void 0 ? void 0 : path.length)) {
            return new SGFNode([], []);
        }
        console.log(`flattening with ${path === null || path === void 0 ? void 0 : path.length} nodes`);
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
        };
        if (opts.propsToKeep) {
            for (const p of opts.propsToKeep) {
                rootPropertiesToKeep[p] = true;
            }
        }
        const enumeratedLabels = {};
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
        const targetTagsToCopy = [Tag.Comment, Tag.Triangle, Tag.Square, Tag.X, Tag.Circle, Tag.Label];
        for (const tag of targetTagsToCopy) {
            for (const val of target.getProperties(tag) || []) {
                newRootNode.addProperty(tag, val);
            }
            ;
        }
        const goban = new SGFGoban();
        goban.applyNodes(...path);
        for (let row = 0; row < goban.size; row++) {
            for (let col = 0; col < goban.size; col++) {
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
            let [thisMoveColor] = (target === null || target === void 0 ? void 0 : target.playerAndCoordinates()) || [SGFColor.INVALID];
            let [nextMoveColor] = ((_a = target === null || target === void 0 ? void 0 : target.firstChild()) === null || _a === void 0 ? void 0 : _a.playerAndCoordinates()) || [SGFColor.INVALID];
            if (nextMoveColor && nextMoveColor === SGFColor.WHITE) {
                newRootNode.setProperty(Tag.Player, SGFColor.WHITE);
            }
            else if (thisMoveColor && thisMoveColor === SGFColor.BLACK) {
                newRootNode.setProperty(Tag.Player, SGFColor.WHITE);
            }
        }
        if (opts === null || opts === void 0 ? void 0 : opts.enumerate) {
            for (const coord in enumeratedLabels) {
                for (const lb of enumeratedLabels[coord]) {
                    newRootNode.addProperty(Tag.Label, `${coord}:${lb}`);
                }
            }
        }
        return newRootNode;
    }
    /** Walk through the subtree, if f() return `false` -> stop "walking". */
    walkWhile(f, path) {
        if (!path) {
            path = [this];
        }
        if (!f(path[path.length - 1], path)) {
            return false;
        }
        for (const sub of (this === null || this === void 0 ? void 0 : this.children) || []) {
            if (!sub.walkWhile(f, [...path, sub])) {
                return false;
            }
        }
        return true;
    }
    walkUntil(f, path) {
        this.walkWhile((node, path) => {
            return !f(node, path);
        });
    }
    walk(f) {
        this.walkWhile((node, path) => {
            f(node, path);
            return true;
        });
    }
    findPath(subnode, path) {
        var _a;
        if (!path) {
            path = [];
        }
        path.push(this);
        if (this == subnode) {
            return path;
        }
        if (!((_a = this.children) === null || _a === void 0 ? void 0 : _a.length)) {
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
    bounds(opts) {
        const bounds = new Bounds();
        this.walk((node, path) => {
            const takenCoords = [];
            for (const tr of node.getProperties(Tag.AddWhite) || []) {
                takenCoords.push(...expandCoordinatesRange(tr));
            }
            for (const tr of node.getProperties(Tag.AddBlack) || []) {
                takenCoords.push(...expandCoordinatesRange(tr));
            }
            takenCoords.push(...expandCoordinatesRange(node.getProperty(Tag.Black)));
            takenCoords.push(...expandCoordinatesRange(node.getProperty(Tag.White)));
            if (opts === null || opts === void 0 ? void 0 : opts.includeNonStones) {
                for (const e of node.getLabels() || []) {
                    takenCoords.push(...expandCoordinatesRange(e.coord));
                }
                takenCoords.push(...expandCoordinatesRange(node.getProperty(Tag.Triangle)));
                takenCoords.push(...expandCoordinatesRange(node.getProperty(Tag.Circle)));
                takenCoords.push(...expandCoordinatesRange(node.getProperty(Tag.Square)));
                takenCoords.push(...expandCoordinatesRange(node.getProperty(Tag.X)));
            }
            for (const coord of takenCoords) {
                let [row, col] = coordinateToRowColumn(coord);
                console.log(`${coord} => row=${row}, col=${col}`);
                bounds.apply(row, col);
            }
        });
        return bounds;
    }
    findFirstProperty(p) {
        let props = this.getProperties(p);
        if (props && props.length > 0) {
            return props.find(s => !!s) || "";
        }
        for (const sub of this.children) {
            const prop = sub.findFirstProperty(p);
            if (prop) {
                return prop;
            }
        }
        return undefined;
    }
    /** Returnd undefined if not defined. */
    getProperties(prop) {
        let props = undefined;
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
        const res = [];
        for (const prop of this.getProperties(Tag.Label) || []) {
            const pos = prop.indexOf(":");
            if (pos > 0) {
                res.push({
                    coord: prop.substring(0, pos),
                    label: prop.substring(pos + 1)
                });
            }
        }
        return res;
    }
    getComment() {
        return this.getProperty(Tag.Comment);
    }
    getComments() {
        return this.getProperties(Tag.Comment);
    }
    getProperty(prop) {
        for (const i in this.properties) {
            if (this.properties[i].name === prop) {
                return this.properties[i].value;
            }
        }
        return undefined;
    }
    setProperty(prop, val) {
        for (const i in this.properties) {
            if (this.properties[i].name == prop) {
                this.properties[i].values = [val];
                return;
            }
        }
        this.properties.push(new SGFProperty(prop, [val]));
    }
    addProperty(prop, val) {
        for (const i in this.properties) {
            if (this.properties[i].name == prop) {
                this.properties[i].values.push(val);
                return;
            }
        }
        this.properties.push(new SGFProperty(prop, [val]));
    }
    setMove(color, coord) {
        switch (color) {
            case SGFColor.WHITE:
                this.setProperty(Tag.White, coord);
                break;
            case SGFColor.BLACK:
                this.setProperty(Tag.Black, coord);
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
                sgf += `[${val.replace(/\]/g, "\\]")}]`;
            }
        }
        if (this.children.length == 0) {
            return sgf;
        }
        else if (this.children.length == 1) {
            return sgf + this.children[0].toSGFNode();
        }
        else {
            for (const child of this.children) {
                sgf += "(" + child.toSGFNode() + ")";
            }
        }
        return sgf;
    }
    appendNode(node) {
        this.children.push(node);
    }
    prependNode(node) {
        this.children.unshift(node);
    }
    firstChild() {
        var _a;
        if (!((_a = this.children) === null || _a === void 0 ? void 0 : _a.length)) {
            return undefined;
        }
        return this.children[0];
    }
    playerAndCoordinates() {
        const b = this.getProperty(Tag.Black);
        if (b !== undefined) {
            return [SGFColor.BLACK, b];
        }
        const w = this.getProperty(Tag.White);
        if (w !== undefined) {
            return [SGFColor.WHITE, w];
        }
        return [SGFColor.INVALID, ""];
    }
    mainLine() {
        var _a;
        const path = [];
        let tmpNode = this;
        while (true) {
            if (tmpNode) {
                path.push(tmpNode);
                if ((_a = tmpNode.children) === null || _a === void 0 ? void 0 : _a[0]) {
                    tmpNode = tmpNode.children[0];
                }
                else {
                    break;
                }
            }
        }
        return path;
    }
}
export class SGFProperty {
    constructor(name, values) {
        this.name = name;
        this.values = values;
    }
    get value() {
        return this.values[0];
    }
}
