"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SGFGoban = exports.GobanPosition = exports.isAlpha = exports.SGFParser = exports.parseSGFCollection = exports.parseSGF = exports.SGFProperty = exports.SGFNode = exports.rowColumnToCoordinate = exports.coordinateToRowColumn = exports.SGFColor = exports.expandCoordinatesRange = exports.Bounds = exports.Tag = void 0;
var Tag;
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
})(Tag || (exports.Tag = Tag = {}));
var Bounds = /** @class */ (function () {
    function Bounds(rowMax, rowMin, colMax, colMin) {
        if (rowMax === void 0) { rowMax = NaN; }
        if (rowMin === void 0) { rowMin = NaN; }
        if (colMax === void 0) { colMax = NaN; }
        if (colMin === void 0) { colMin = NaN; }
        this.rowMax = rowMax;
        this.rowMin = rowMin;
        this.colMax = colMax;
        this.colMin = colMin;
    }
    Bounds.prototype.apply = function (row, col) {
        this.rowMin = isNaN(this.rowMin) ? row : Math.min(this.rowMin, row);
        this.rowMax = isNaN(this.rowMax) ? row : Math.max(this.rowMax, row);
        this.colMin = isNaN(this.colMin) ? col : Math.min(this.colMin, col);
        this.colMax = isNaN(this.colMax) ? col : Math.max(this.colMax, col);
        console.log("apply ".concat(row, ", ").concat(col, " => ").concat(JSON.stringify(this)));
    };
    Bounds.prototype.makeSquare = function (size) {
        var w = 0;
        var h = 1;
        var n = 0;
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
    };
    Bounds.prototype.increase = function (size, n, minDistanceFromBorder) {
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
    };
    return Bounds;
}());
exports.Bounds = Bounds;
function expandCoordinatesRange(_coords) {
    if (!_coords) {
        return [];
    }
    var res = [];
    if (!(_coords === null || _coords === void 0 ? void 0 : _coords.push)) {
        _coords = [_coords];
    }
    for (var _i = 0, _coords_1 = _coords; _i < _coords_1.length; _i++) {
        var coord = _coords_1[_i];
        var parts = coord.split(":");
        if (parts.length == 2) {
            console.log(parts[0], parts[1]);
            var _a = coordinateToRowColumn(parts[0]), x1 = _a[0], y1 = _a[1];
            var _b = coordinateToRowColumn(parts[1]), x2 = _b[0], y2 = _b[1];
            console.log(x1, y1, x2, y2);
            var minX = Math.min(x1, x2);
            var maxX = Math.max(x1, x2);
            var minY = Math.min(y1, y2);
            var maxY = Math.max(y1, y2);
            for (var x = minX; x <= maxX; x++) {
                for (var y = minY; y <= maxY; y++) {
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
exports.expandCoordinatesRange = expandCoordinatesRange;
var SGFColor;
(function (SGFColor) {
    SGFColor["BLACK"] = "B";
    SGFColor["WHITE"] = "W";
    SGFColor["NONE"] = ".";
    SGFColor["INVALID"] = " ";
})(SGFColor || (exports.SGFColor = SGFColor = {}));
function coordinateToRowColumn(c) {
    var row = c.charCodeAt(0);
    var col = c.charCodeAt(1);
    return [col - 97, row - 97,];
}
exports.coordinateToRowColumn = coordinateToRowColumn;
function rowColumnToCoordinate(c) {
    return String.fromCharCode(97 + c[1]) + String.fromCharCode(97 + c[0]);
}
exports.rowColumnToCoordinate = rowColumnToCoordinate;
var SGFNode = /** @class */ (function () {
    function SGFNode(properties, children) {
        if (properties === void 0) { properties = []; }
        if (children === void 0) { children = []; }
        this.properties = properties;
        this.children = children;
    }
    SGFNode.prototype.flattenToNode = function (target, enumerate) {
        var _a;
        var _b;
        if (enumerate === void 0) { enumerate = false; }
        var path = this.findPath(target);
        if (!(path === null || path === void 0 ? void 0 : path.length)) {
            return;
        }
        enumerate = true;
        console.log("flattening with ".concat(path === null || path === void 0 ? void 0 : path.length, " nodes"));
        var rootPropertiesToKeep = (_a = {},
            _a[Tag.Annotations] = true,
            _a[Tag.Application] = true,
            _a[Tag.BlackRank] = true,
            _a[Tag.BlackTeam] = true,
            _a[Tag.Copyright] = true,
            _a[Tag.Date] = true,
            _a[Tag.Event] = true,
            _a[Tag.FileFormat] = true,
            _a[Tag.Game] = true,
            _a[Tag.GameName] = true,
            _a[Tag.Handicap] = true,
            _a[Tag.Komi] = true,
            _a[Tag.Opening] = true,
            _a[Tag.Overtime] = true,
            _a[Tag.BlackName] = true,
            _a[Tag.Place] = true,
            _a[Tag.WhiteName] = true,
            _a[Tag.Result] = true,
            _a[Tag.Round] = true,
            _a[Tag.Rules] = true,
            _a[Tag.Source] = true,
            _a[Tag.Size] = true,
            _a[Tag.TimeLimit] = true,
            _a[Tag.User] = true,
            _a[Tag.WhiteRank] = true,
            _a[Tag.WhiteTeam] = true,
            _a);
        var enumeratedLabels = {};
        var n = 0;
        for (var _i = 0, path_1 = path; _i < path_1.length; _i++) {
            var tmpNode = path_1[_i];
            var _c = tmpNode.playerAndCoordinates(), color = _c[0], coord = _c[1];
            if (color && coord) {
                if (!enumeratedLabels[coord]) {
                    enumeratedLabels[coord] = [];
                }
                n++;
                enumeratedLabels[coord].push(n);
            }
        }
        var newRootNode = new SGFNode();
        newRootNode.properties = this.properties.filter(function (p) { return rootPropertiesToKeep[p.name]; });
        var targetTagsToCopy = [Tag.Comment, Tag.Triangle, Tag.Square, Tag.X, Tag.Circle, Tag.Label];
        for (var _d = 0, targetTagsToCopy_1 = targetTagsToCopy; _d < targetTagsToCopy_1.length; _d++) {
            var tag = targetTagsToCopy_1[_d];
            for (var _e = 0, _f = target.getProperties(tag) || []; _e < _f.length; _e++) {
                var val = _f[_e];
                newRootNode.addProperty(tag, val);
            }
            ;
        }
        var goban = new SGFGoban();
        goban.applyNodes.apply(goban, path);
        for (var row = 0; row < goban.size; row++) {
            for (var col = 0; col < goban.size; col++) {
                var coord = rowColumnToCoordinate([row, col]);
                var color = goban.stoneAt(coord);
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
        var nextColor = target.getProperty(Tag.Player);
        if (!nextColor) {
            var thisMoveColor = ((target === null || target === void 0 ? void 0 : target.playerAndCoordinates()) || [SGFColor.INVALID])[0];
            var nextMoveColor = (((_b = target === null || target === void 0 ? void 0 : target.firstChild()) === null || _b === void 0 ? void 0 : _b.playerAndCoordinates()) || [SGFColor.INVALID])[0];
            if (nextMoveColor && nextMoveColor === SGFColor.WHITE) {
                newRootNode.setProperty(Tag.Player, SGFColor.WHITE);
            }
            else if (thisMoveColor && thisMoveColor === SGFColor.BLACK) {
                newRootNode.setProperty(Tag.Player, SGFColor.WHITE);
            }
        }
        if (enumerate) {
            for (var coord in enumeratedLabels) {
                for (var _g = 0, _h = enumeratedLabels[coord]; _g < _h.length; _g++) {
                    var lb = _h[_g];
                    newRootNode.addProperty(Tag.Label, "".concat(coord, ":").concat(lb));
                }
            }
        }
        return newRootNode;
    };
    /** Walk through the subtree, if f() return `false` -> stop "walking". */
    SGFNode.prototype.walkWhile = function (f, path) {
        if (!path) {
            path = [this];
        }
        if (!f(path[path.length - 1], path)) {
            return false;
        }
        for (var _i = 0, _a = (this === null || this === void 0 ? void 0 : this.children) || []; _i < _a.length; _i++) {
            var sub = _a[_i];
            if (!sub.walkWhile(f, __spreadArray(__spreadArray([], path, true), [sub], false))) {
                return false;
            }
        }
        return true;
    };
    SGFNode.prototype.walkUntil = function (f, path) {
        this.walkWhile(function (node, path) {
            return !f(node, path);
        });
    };
    SGFNode.prototype.walk = function (f) {
        this.walkWhile(function (node, path) {
            f(node, path);
            return true;
        });
    };
    SGFNode.prototype.findPath = function (subnode, path) {
        var _a;
        if (!path) {
            path = [];
        }
        path.push(this);
        if (this == subnode) {
            return path;
        }
        if (!((_a = this.children) === null || _a === void 0 ? void 0 : _a.length)) {
            return null;
        }
        for (var _i = 0, _b = this.children; _i < _b.length; _i++) {
            var child = _b[_i];
            var subPath = child.findPath(subnode, path.slice());
            if (subPath) {
                return subPath;
            }
        }
        return null;
    };
    SGFNode.prototype.bounds = function () {
        var bounds = new Bounds();
        this.walk(function (node, path) {
            var takenCoords = [];
            for (var _i = 0, _a = node.getProperties(Tag.AddWhite) || []; _i < _a.length; _i++) {
                var tr = _a[_i];
                takenCoords.push.apply(takenCoords, expandCoordinatesRange(tr));
            }
            for (var _b = 0, _c = node.getProperties(Tag.AddBlack) || []; _b < _c.length; _b++) {
                var tr = _c[_b];
                takenCoords.push.apply(takenCoords, expandCoordinatesRange(tr));
            }
            takenCoords.push.apply(takenCoords, expandCoordinatesRange(node.getProperty(Tag.Black)));
            takenCoords.push.apply(takenCoords, expandCoordinatesRange(node.getProperty(Tag.White)));
            for (var _d = 0, takenCoords_1 = takenCoords; _d < takenCoords_1.length; _d++) {
                var coord = takenCoords_1[_d];
                var _e = coordinateToRowColumn(coord), row = _e[0], col = _e[1];
                console.log("".concat(coord, " => row=").concat(row, ", col=").concat(col));
                bounds.apply(row, col);
            }
        });
        return bounds;
    };
    SGFNode.prototype.findFirstProperty = function (p) {
        var props = this.getProperties(p);
        if ((props === null || props === void 0 ? void 0 : props.length) > 0) {
            return props.find(function (s) { return !!s; }) || "";
        }
        for (var _i = 0, _a = this.children; _i < _a.length; _i++) {
            var sub = _a[_i];
            var prop = sub.findFirstProperty(p);
            if (prop) {
                return prop;
            }
        }
        return undefined;
    };
    /** Returnd undefined if not defined. */
    SGFNode.prototype.getProperties = function (prop) {
        var props = undefined;
        for (var i in this.properties) {
            if (this.properties[i].name === prop) {
                if (props === undefined) {
                    props = [];
                }
                props.push.apply(props, this.properties[i].values);
            }
        }
        return props;
    };
    SGFNode.prototype.getLabels = function () {
        var res = [];
        for (var _i = 0, _a = this.getProperties(Tag.Label) || []; _i < _a.length; _i++) {
            var prop = _a[_i];
            var pos = prop.indexOf(":");
            if (pos > 0) {
                res.push({
                    coord: prop.substring(0, pos),
                    label: prop.substring(pos + 1)
                });
            }
        }
        return res;
    };
    SGFNode.prototype.getComment = function () {
        return this.getProperty(Tag.Comment);
    };
    SGFNode.prototype.getComments = function () {
        return this.getProperties(Tag.Comment);
    };
    SGFNode.prototype.getProperty = function (prop) {
        for (var i in this.properties) {
            if (this.properties[i].name === prop) {
                return this.properties[i].value;
            }
        }
        return undefined;
    };
    SGFNode.prototype.setProperty = function (prop, val) {
        for (var i in this.properties) {
            if (this.properties[i].name == prop) {
                this.properties[i].values = [val];
                return;
            }
        }
        this.properties.push(new SGFProperty(prop, [val]));
    };
    SGFNode.prototype.addProperty = function (prop, val) {
        for (var i in this.properties) {
            if (this.properties[i].name == prop) {
                this.properties[i].values.push(val);
                return;
            }
        }
        this.properties.push(new SGFProperty(prop, [val]));
    };
    SGFNode.prototype.setMove = function (color, coord) {
        switch (color) {
            case SGFColor.WHITE:
                this.setProperty(Tag.White, coord);
                break;
            case SGFColor.BLACK:
                this.setProperty(Tag.Black, coord);
                break;
        }
    };
    SGFNode.prototype.toSGF = function () {
        return "(" + this.toSGFNode() + ")";
    };
    SGFNode.prototype.toSGFNode = function () {
        var sgf = ";";
        for (var _i = 0, _a = this.properties; _i < _a.length; _i++) {
            var prop = _a[_i];
            sgf += prop.name;
            for (var _b = 0, _c = prop.values; _b < _c.length; _b++) {
                var val = _c[_b];
                sgf += "[".concat(val.replace(/\]/g, "\\]"), "]");
            }
        }
        if (this.children.length == 0) {
            return sgf;
        }
        else if (this.children.length == 1) {
            return sgf + this.children[0].toSGFNode();
        }
        else {
            for (var _d = 0, _e = this.children; _d < _e.length; _d++) {
                var child = _e[_d];
                sgf += "(" + child.toSGFNode() + ")";
            }
        }
        return sgf;
    };
    SGFNode.prototype.appendNode = function (node) {
        this.children.push(node);
    };
    SGFNode.prototype.prependNode = function (node) {
        this.children.unshift(node);
    };
    SGFNode.prototype.firstChild = function () {
        var _a;
        if (!((_a = this.children) === null || _a === void 0 ? void 0 : _a.length)) {
            return undefined;
        }
        return this.children[0];
    };
    SGFNode.prototype.playerAndCoordinates = function () {
        var b = this.getProperty(Tag.Black);
        if (b !== undefined) {
            return [SGFColor.BLACK, b];
        }
        var w = this.getProperty(Tag.White);
        if (w !== undefined) {
            return [SGFColor.WHITE, w];
        }
        return [undefined, undefined];
    };
    SGFNode.prototype.mainLine = function () {
        var _a;
        var path = [];
        var tmpNode = this;
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
    };
    return SGFNode;
}());
exports.SGFNode = SGFNode;
var SGFProperty = /** @class */ (function () {
    function SGFProperty(name, values) {
        this.name = name;
        this.values = values;
    }
    Object.defineProperty(SGFProperty.prototype, "value", {
        get: function () {
            return this.values[0];
        },
        enumerable: false,
        configurable: true
    });
    return SGFProperty;
}());
exports.SGFProperty = SGFProperty;
function parseSGF(sgf) {
    return new SGFParser(sgf).parse();
}
exports.parseSGF = parseSGF;
function parseSGFCollection(sgf) {
    var parser = new SGFParser(sgf);
    var node;
    var result = [];
    while (node = parser.parse()) {
        result.push(node);
        if (parser.unparsed().trim().length == 0) {
            break;
        }
    }
    return result;
}
exports.parseSGFCollection = parseSGFCollection;
var SGFParser = /** @class */ (function () {
    function SGFParser(str) {
        this.position = 0;
        this.str = str;
        this.position = 0;
    }
    SGFParser.prototype.readWhile = function (f) {
        var res = "";
        while (f(this.str[this.position - 1], this.str[this.position], this.str[this.position + 1])) {
            res += this.str[this.position];
            this.position++;
        }
        return res;
    };
    SGFParser.prototype.readNext = function () {
        return this.str[this.position + 1];
    };
    SGFParser.prototype.read = function () {
        return this.str[this.position];
    };
    SGFParser.prototype.readAndNext = function () {
        var res = this.read();
        this.next();
        return res;
    };
    SGFParser.prototype.next = function () {
        this.position++;
        return this.read();
    };
    SGFParser.prototype.previous = function () {
        this.position--;
        return this.read();
    };
    SGFParser.prototype.debugPositionStr = function () {
        return "...".concat(this.str.substring(this.position - 10, this.position), "<-- position ").concat(this.position, " -->").concat(this.str[this.position]).concat(this.str.substring(this.position + 1), "...");
    };
    SGFParser.prototype.readBranch = function () {
        this.skipWhitespaces();
        var ch = this.read();
        if (ch != "(") {
            throw new Error("Invalid start of sgf (".concat(ch, ") at position ").concat(this.position));
        }
    };
    SGFParser.prototype.readNode = function () {
        this.skipWhitespaces();
        // console.log(`Reading node from ${this.debugPositionStr()}`);
        if (this.read() != ";") {
            throw new Error("\"Move not starting with ';' in pos ".concat(this.position));
        }
        this.next();
        this.skipWhitespaces();
        var tags = [];
        var children = [];
        if (isAlpha(this.read())) {
            // console.log("properties: " + this.debugPositionStr())
            tags.push.apply(tags, this.readProperties());
        }
        else {
            // console.log("no properties: " + this.debugPositionStr())
        }
        var node = new SGFNode(tags, children);
        this.skipWhitespaces();
        var ch = this.read();
        if (ch === ";") {
            // console.log("reading subnode: " + this.debugPositionStr());
            var subnode = this.readNode();
            children.push(subnode);
        }
        else if (ch === "(") {
            // console.log("reading subtrees: " + this.debugPositionStr());
            children.push.apply(children, this.readSubtrees());
        }
        return node;
    };
    SGFParser.prototype.readSubtrees = function () {
        var subtrees = [];
        for (var node = this.readNextSubtree(); !!node; node = this.readNextSubtree()) {
            //console.log(`tag: ${JSON.stringify(tag)}`)
            subtrees.push(node);
        }
        return subtrees;
    };
    SGFParser.prototype.parse = function () {
        var node = this.readNextSubtree();
        if (!node) {
            throw new Error("No SGF tree found");
        }
        return node;
    };
    SGFParser.prototype.unparsed = function () {
        return this.str.substring(this.position);
    };
    SGFParser.prototype.readNextSubtree = function () {
        this.skipWhitespaces();
        // console.log(`Reading subtree from ${this.debugPositionStr()}`);
        if (this.read() != "(") {
            return null;
        }
        this.next();
        var node = this.readNode();
        this.skipWhitespaces();
        if (this.read() != ")") {
            throw new Error("Expected end of subtree in ".concat(this.debugPositionStr()));
        }
        this.next();
        return node;
    };
    SGFParser.prototype.skipWhitespaces = function () {
        this.readWhile(function (_prev, curr, _next) {
            return !!curr && curr.trim().length == 0;
        });
    };
    SGFParser.prototype.readProperty = function () {
        var _this = this;
        // console.log(`reading property ${this.debugPositionStr()}`);
        this.skipWhitespaces();
        var tag = this.readWhile(function (_prev, curr, _next) {
            return isAlpha(curr);
        });
        if (!tag) {
            return null;
        }
        this.skipWhitespaces();
        var values = [];
        while (true) {
            if (this.read() != "[") {
                break;
            }
            this.next();
            // console.log(`reading val from ${this.debugPositionStr()}`);
            var value = this.readWhile(function (_prev, curr, next) {
                if (curr === undefined) {
                    return false;
                }
                if (curr == "\\" && next == "]") {
                    _this.next();
                }
                return curr != "]";
            });
            if (this.read() != "]") {
                throw new Error("property values closed with \"]\": ".concat(this.debugPositionStr()));
            }
            values.push(value);
            this.next();
            this.skipWhitespaces();
        }
        if (values.length === 0) {
            throw new Error("property values not found: ".concat(this.debugPositionStr()));
        }
        this.skipWhitespaces();
        return new SGFProperty(tag, values);
    };
    SGFParser.prototype.readProperties = function () {
        var properties = [];
        for (var tag = this.readProperty(); !!tag; tag = this.readProperty()) {
            properties.push(tag);
        }
        return properties;
    };
    return SGFParser;
}());
exports.SGFParser = SGFParser;
var alpha = "qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM";
function isAlpha(ch) {
    return alpha.indexOf(ch) >= 0;
}
exports.isAlpha = isAlpha;
/** Just the goban stones and some basic utility methods. */
var GobanPosition = /** @class */ (function () {
    function GobanPosition(size, goban) {
        this.size = size;
        this.goban = [];
        // console.log("size=" + size)
        this.size = size;
        if (goban) {
            this.goban = goban;
        }
        else {
            for (var row = 0; row < this.size; row++) {
                var r = [];
                for (var col = 0; col < this.size; col++) {
                    r.push(SGFColor.NONE);
                }
                this.goban.push(r);
            }
        }
    }
    GobanPosition.prototype.row = function (r) {
        var res = [];
        for (var i = 0; i < this.size; i++) {
            res.push(this.goban[r][i]);
        }
        return res;
    };
    GobanPosition.prototype.column = function (c) {
        var res = [];
        for (var i = 0; i < this.size; i++) {
            res.push(this.goban[i][c]);
        }
        return res;
    };
    GobanPosition.prototype.coordinateValid = function (row, column) {
        return row >= 0 && row < this.size && column >= 0 && column < this.size;
    };
    GobanPosition.prototype.isStoneAt = function (coord) {
        var stone = this.stoneAt(coord);
        return stone == SGFColor.WHITE || stone == SGFColor.BLACK;
    };
    GobanPosition.prototype.stoneAt = function (coord) {
        var _a, _b;
        var _c;
        var row, column;
        if (coord === null || coord === void 0 ? void 0 : coord.push) {
            _a = coord, row = _a[0], column = _a[1];
        }
        else {
            _b = coordinateToRowColumn(coord), row = _b[0], column = _b[1];
        }
        if (this.coordinateValid(row, column)) {
            return (_c = this.goban[row]) === null || _c === void 0 ? void 0 : _c[column];
        }
        return SGFColor.INVALID;
    };
    GobanPosition.prototype.addStones = function (color) {
        var coords = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            coords[_i - 1] = arguments[_i];
        }
        for (var _a = 0, coords_1 = coords; _a < coords_1.length; _a++) {
            var coord = coords_1[_a];
            if ((coord === null || coord === void 0 ? void 0 : coord.indexOf(":")) > 0) {
                // Point list => square of points
                var parts = coord.split(":");
                var _b = coordinateToRowColumn(parts[0]), r1 = _b[0], c1 = _b[1];
                var _c = coordinateToRowColumn(parts[1]), r2 = _c[0], c2 = _c[1];
                for (var row = Math.min(r1, r2); row <= Math.max(r1, r2); row++) {
                    for (var col = Math.min(c1, c2); col <= Math.max(c1, c2); col++) {
                        if (this.coordinateValid(row, col)) {
                            this.goban[row][col] = color;
                        }
                    }
                }
            }
            else {
                var _d = coordinateToRowColumn(coord), row = _d[0], column = _d[1];
                if (this.coordinateValid(row, column)) {
                    this.goban[row][column] = color;
                }
            }
        }
    };
    GobanPosition.prototype.getGroupInfo = function (coord) {
        var res = new GroupInfo(this.stoneAt(coord));
        this.fillGroupInfo(coord, res);
        return res;
    };
    GobanPosition.prototype.fillGroupInfo = function (coord, res) {
        if (res.groupColor === SGFColor.NONE || res.groupColor === SGFColor.INVALID) {
            return res;
        }
        if (res.groupStones.indexOf(coord) < 0) {
            res.groupStones.push(coord);
        }
        var _a = coordinateToRowColumn(coord), row = _a[0], column = _a[1];
        var neighborsCoords = [
            rowColumnToCoordinate([row - 1, column]),
            rowColumnToCoordinate([row + 1, column]),
            rowColumnToCoordinate([row, column - 1]),
            rowColumnToCoordinate([row, column + 1]) // RIGHT
        ];
        for (var _i = 0, neighborsCoords_1 = neighborsCoords; _i < neighborsCoords_1.length; _i++) {
            var neighborCoord = neighborsCoords_1[_i];
            var neighborStone = this.stoneAt(neighborCoord);
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
    };
    GobanPosition.prototype.debugStr = function () {
        return this.goban.map(function (row) { return row.join(""); }).join("\n");
    };
    return GobanPosition;
}());
exports.GobanPosition = GobanPosition;
var SGFGoban = /** @class */ (function (_super) {
    __extends(SGFGoban, _super);
    function SGFGoban(sizeOrNode) {
        if (sizeOrNode === void 0) { sizeOrNode = 19; }
        var _this = _super.call(this, "number" == typeof sizeOrNode ? sizeOrNode : parseInt(sizeOrNode.getProperty(Tag.Size)) || 19) || this;
        _this.sizeOrNode = sizeOrNode;
        _this.triangles = {};
        _this.squares = {};
        _this.crosses = {};
        _this.circles = {};
        _this.labels = {};
        var node;
        if (sizeOrNode instanceof SGFNode) {
            node = sizeOrNode;
            _this.applyNodes(node);
        }
        return _this;
    }
    SGFGoban.prototype.clone = function () {
        var res = new SGFGoban(this.size);
        res.goban = JSON.parse(JSON.stringify(this.goban));
        return res;
    };
    SGFGoban.prototype.playStone = function (color, coords) {
        if (!coords) {
            return; // pass
        }
        var newPosition = new GobanPosition(this.size, JSON.parse(JSON.stringify(this.goban)));
        var removed = [];
        var _a = coordinateToRowColumn(coords), row = _a[0], column = _a[1];
        if (newPosition.coordinateValid(row, column)) {
            newPosition.goban[row][column] = color;
            var groupInfos = [
                newPosition.getGroupInfo(rowColumnToCoordinate([row + 1, column])),
                newPosition.getGroupInfo(rowColumnToCoordinate([row - 1, column])),
                newPosition.getGroupInfo(rowColumnToCoordinate([row, column - 1])),
                newPosition.getGroupInfo(rowColumnToCoordinate([row, column + 1])),
            ];
            for (var _i = 0, groupInfos_1 = groupInfos; _i < groupInfos_1.length; _i++) {
                var gi = groupInfos_1[_i];
                if (gi.groupColor !== SGFColor.INVALID && gi.groupColor !== SGFColor.NONE && gi.groupColor !== color && gi.adjacentFreeSpaces.length == 0) {
                    for (var _b = 0, _c = gi.groupStones; _b < _c.length; _b++) {
                        var stoneCoord = _c[_b];
                        var color_1 = newPosition.stoneAt(stoneCoord);
                        if (color_1 === SGFColor.WHITE || color_1 === SGFColor.BLACK) {
                            newPosition.addStones(SGFColor.NONE, stoneCoord);
                            removed.push(stoneCoord);
                        }
                    }
                }
            }
        }
        // TODO: Check self-atari
        var playedStoneGroupInfo = newPosition.getGroupInfo(coords);
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
    };
    SGFGoban.prototype.applyNodes = function () {
        var nodes = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            nodes[_i] = arguments[_i];
        }
        var res;
        for (var _a = 0, nodes_1 = nodes; _a < nodes_1.length; _a++) {
            var node = nodes_1[_a];
            res = this.applySingleNode(node);
        }
        return res;
    };
    SGFGoban.prototype.applySingleNode = function (node) {
        var _a;
        var ab = node.getProperties(Tag.AddBlack) || [];
        var aw = node.getProperties(Tag.AddWhite) || [];
        this.addStones.apply(this, __spreadArray([SGFColor.WHITE], aw, false));
        this.addStones.apply(this, __spreadArray([SGFColor.BLACK], ab, false));
        this.triangles = {};
        this.squares = {};
        this.crosses = {};
        this.circles = {};
        this.labels = {};
        this.comment = node.getProperty(Tag.Comment);
        for (var _i = 0, _b = expandCoordinatesRange(node.getProperties(Tag.Triangle)); _i < _b.length; _i++) {
            var tr = _b[_i];
            this.triangles[tr] = true;
        }
        for (var _c = 0, _d = expandCoordinatesRange(node.getProperties(Tag.Square)); _c < _d.length; _c++) {
            var tr = _d[_c];
            this.squares[tr] = true;
        }
        for (var _e = 0, _f = expandCoordinatesRange(node.getProperties(Tag.X)); _e < _f.length; _e++) {
            var tr = _f[_e];
            this.crosses[tr] = true;
        }
        for (var _g = 0, _h = expandCoordinatesRange(node.getProperties(Tag.Circle)); _g < _h.length; _g++) {
            var tr = _h[_g];
            this.circles[tr] = true;
        }
        for (var _j = 0, _k = node.getLabels() || []; _j < _k.length; _j++) {
            var lb = _k[_j];
            for (var _l = 0, _m = expandCoordinatesRange(lb.coord); _l < _m.length; _l++) {
                var coord = _m[_l];
                this.labels[coord] = lb.label;
            }
        }
        var _o = node.playerAndCoordinates(), color = _o[0], coords = _o[1];
        if (coords) {
            var existingStone = this.stoneAt(coords);
            if (existingStone == SGFColor.BLACK || existingStone == SGFColor.WHITE) {
                throw new Error("Already taken");
            }
        }
        var player = node.getProperty(Tag.Player);
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
            var child = node.children[0];
            if (child.getProperty(Tag.Black)) {
                this.nextToPlay = SGFColor.BLACK;
            }
            else if (child.getProperty(Tag.White)) {
                this.nextToPlay = SGFColor.WHITE;
            }
        }
    };
    return SGFGoban;
}(GobanPosition));
exports.SGFGoban = SGFGoban;
var GroupInfo = /** @class */ (function () {
    function GroupInfo(groupColor) {
        this.groupColor = groupColor;
        this.groupStones = [];
        this.adjacentStones = [];
        this.adjacentFreeSpaces = [];
    }
    return GroupInfo;
}());
var BACKGROUND_COLOR = "#ebb063";
var AUTOPLAY_INTERVAL = 400;
var coordinatesLetters = "abcdefghjklmnopqrst";
var correctWords = ["correct", "točno", "+", "right"];
function applyStyle(el, style) {
    if (style) {
        for (var _i = 0, _a = Object.keys(style); _i < _a.length; _i++) {
            var key = _a[_i];
            el.style[key] = style[key];
        }
    }
}
function getElement(prefix, id) {
    id = prefix + "_" + id;
    return document.getElementById(id);
}
function getOrCreateElement(prefix, name, id, style, innerHTML) {
    id = prefix + "_" + id;
    var el = document.getElementById(id);
    var created = false;
    if (!el) {
        created = true;
        el = document.createElement(name);
    }
    if (id) {
        el.id = id;
    }
    applyStyle(el, style);
    if (innerHTML) {
        el.innerHTML = innerHTML;
    }
    return { element: el, created: created };
}
function createElement(prefix, name, id, style) {
    var el = getOrCreateElement(prefix, name, id);
    applyStyle(el.element, style);
    return el;
}
var GobanViewerMode;
(function (GobanViewerMode) {
    GobanViewerMode["PLAY"] = "PLAY";
    GobanViewerMode["PROBLEM"] = "PROBLEM";
    GobanViewerMode["GUESS_MOVE"] = "GUESS_MOVE";
})(GobanViewerMode || (GobanViewerMode = {}));
var AbstractGobanViewer = /** @class */ (function () {
    function AbstractGobanViewer(elementId, node) {
        this.elementId = elementId;
        var rootElement = document.getElementById(this.elementId);
        if (!rootElement) {
            alert("no goban element found by  " + elementId);
            return;
        }
        if (!node) {
            var sgf = rootElement.innerText.trim();
            try {
                node = parseSGF(sgf);
            }
            catch (e) {
                alert("no sgf found");
                return;
            }
        }
        this.rootNode = node;
        this.currentNode = node;
    }
    AbstractGobanViewer.prototype.draw = function (opts) {
        var _this = this;
        opts.onClick = function (row, col, color) {
            _this.onClick(row, col, color);
        };
        this.positionViewer = new GobanPositionViewer(this.elementId, this.rootNode.findPath(this.currentNode), opts);
        this.goban = this.positionViewer.goban;
        this.updateComment();
        this.updateNextToPlay();
    };
    AbstractGobanViewer.prototype.updateComment = function () {
        var c = getElement(this.elementId, "comment");
        if (c) {
            var comment = this.getCommentAndDirectives(this.currentNode).comment;
            c.innerHTML = (comment === null || comment === void 0 ? void 0 : comment.split("\n").filter(function (line) { return (line === null || line === void 0 ? void 0 : line[0]) !== "!"; }).join("<br/>")) || "";
        }
    };
    AbstractGobanViewer.prototype.reset = function () {
        this.goTo(this.rootNode);
    };
    AbstractGobanViewer.prototype.goTo = function (node) {
        var _a;
        if (!node) {
            return;
        }
        this.positionViewer.setBgLabel("");
        this.currentNode = node;
        var path = this.rootNode.findPath(node);
        this.goban = new SGFGoban();
        (_a = this.goban).applyNodes.apply(_a, path);
        this.positionViewer.draw(this.goban);
        this.updateComment();
        this.updateNextToPlay();
    };
    AbstractGobanViewer.prototype.updateNextToPlay = function () {
        var turnEl = getElement(this.elementId, "turn");
        if (turnEl) {
            turnEl.style.backgroundColor = BACKGROUND_COLOR;
            if (this.goban.nextToPlay === SGFColor.BLACK) {
                turnEl.style.color = "black";
            }
            else if (this.goban.nextToPlay === SGFColor.WHITE) {
                turnEl.style.color = "white";
            }
        }
    };
    AbstractGobanViewer.prototype.getPropertyOrCommandDirective = function (name, node) {
        var directives = this.getCommentAndDirectives(node).directives;
        if (directives[name.toUpperCase()]) {
            return directives[name.toUpperCase()];
        }
        return node.getProperty(name.toUpperCase());
    };
    AbstractGobanViewer.prototype.getCommentAndDirectives = function (node) {
        var commentCleaned = [];
        var directives = {};
        var comments = node.getProperties(Tag.Comment);
        if ((comments === null || comments === void 0 ? void 0 : comments.length) > 0) {
            for (var _i = 0, comments_1 = comments; _i < comments_1.length; _i++) {
                var comment = comments_1[_i];
                console.log("comment:" + comment);
                for (var _a = 0, _b = comment.split("\n"); _a < _b.length; _a++) {
                    var line = _b[_a];
                    line = line.trim();
                    console.log("line:" + line);
                    if ((line === null || line === void 0 ? void 0 : line[0]) === "!") {
                        line = line.substring(1);
                        var parts = line.split(/\s+/);
                        var key = parts.shift().toUpperCase();
                        var val = parts.join(" ").trim();
                        directives[key] = val || "true";
                    }
                    else {
                        commentCleaned.push(line);
                    }
                }
            }
        }
        return { comment: commentCleaned.join("\n"), directives: directives };
    };
    return AbstractGobanViewer;
}());
var ProblemGobanViewer = /** @class */ (function (_super) {
    __extends(ProblemGobanViewer, _super);
    function ProblemGobanViewer(elementId, node, opts) {
        var _this = this;
        var _a;
        _this = _super.call(this, elementId, node) || this;
        _this.initialSkip = 0;
        _this.showSolution = false;
        _this.autoPlayColor = undefined;
        _this.animationSpeed = 1;
        _this.solutionPathLengths = [];
        _this.opts = opts || {};
        _this.parseDirectives();
        if (_this.initialSkip > 0) {
            var goban = new SGFGoban();
            var tmpNode = _this.rootNode;
            for (var i = 0; i < _this.initialSkip; i++) {
                goban.applyNodes(tmpNode);
                tmpNode = (_a = tmpNode.children) === null || _a === void 0 ? void 0 : _a[0];
            }
            _this.rootNode = _this.rootNode.flattenToNode(tmpNode);
            _this.rootNode.children = tmpNode.children;
            _this.currentNode = _this.rootNode;
        }
        _this.fillSolutionsMetadata(_this.rootNode);
        var color = _this.rootNode.playerAndCoordinates()[0];
        _this.autoPlayColor = color;
        _super.prototype.draw.call(_this, __assign({ mode: GobanViewerMode.PROBLEM }, _this.opts));
        return _this;
    }
    ;
    ProblemGobanViewer.prototype.resetAnimation = function () {
        clearInterval(this.autoPlayTimeout);
        clearTimeout(this.autoPlayTimeout);
        this.autoPlayTimeout = null;
    };
    ProblemGobanViewer.prototype.parseDirectives = function () {
        for (var _i = 0, _a = this.rootNode.mainLine(); _i < _a.length; _i++) {
            var node = _a[_i];
            var crop = this.getPropertyOrCommandDirective("crop", node);
            if (crop) {
                if (crop == "auto" || crop == "square") {
                    this.opts.crop = crop;
                }
                else {
                    var parts = crop.trim().split(/[\s,]+/) || ["0", "0", "0", "0"];
                    var cropTop = parseFloat(parts[0]) || 0;
                    var cropRight = parseFloat(parts[1]) || 0;
                    var cropBottom = parseFloat(parts[2]) || 0;
                    var cropLeft = parseFloat(parts[3]) || 0;
                    this.opts.crop = [cropTop, cropRight, cropBottom, cropLeft];
                }
            }
            var speed = this.getPropertyOrCommandDirective("speed", node);
            if (speed) {
                var s = parseFloat(speed);
                this.opts.animationSpeed = !s || isNaN(s) ? 1 : s;
                this.animationSpeed = this.opts.animationSpeed;
            }
            var start = this.getPropertyOrCommandDirective("start", node);
            var skip = this.getPropertyOrCommandDirective("skip", node);
            if (skip) {
                this.initialSkip = parseInt(skip) || 0;
                console.log("skip ".concat(skip, " => ").concat(this.initialSkip, " moves"));
            }
            var anki = this.getPropertyOrCommandDirective("anki", node);
            if (anki) {
                var mainLine = this.rootNode.mainLine();
                var n = mainLine.length;
                var ankiFrom = parseInt(anki);
                if (!isNaN(ankiFrom)) {
                    if (ankiFrom > 0) {
                        ankiFrom = -ankiFrom;
                    }
                    this.initialSkip = n + ankiFrom - 1;
                    console.log("(anki) skip ".concat(anki, " => ").concat(this.initialSkip, " moves"));
                }
            }
            console.log("crop=".concat(crop, ", speed=").concat(speed, ", start=").concat(start, ", skip=").concat(skip, ", anki=").concat(anki));
        }
    };
    ProblemGobanViewer.prototype.fillSolutionsMetadata = function (node) {
        var _this = this;
        var solutionFound = 0;
        this.solutionPathLengths = [];
        node.walk(function (node, path) {
            var _a, _b, _c;
            if (!((_a = node.children) === null || _a === void 0 ? void 0 : _a.length)) {
                var isSolution = false;
                var com = node === null || node === void 0 ? void 0 : node.getComment();
                for (var _i = 0, correctWords_1 = correctWords; _i < correctWords_1.length; _i++) {
                    var word = correctWords_1[_i];
                    if (((_c = (_b = com === null || com === void 0 ? void 0 : com.trim()) === null || _b === void 0 ? void 0 : _b.toLowerCase()) === null || _c === void 0 ? void 0 : _c.indexOf(word)) == 0) {
                        isSolution = true;
                        for (var _d = 0, path_3 = path; _d < path_3.length; _d++) {
                            var e = path_3[_d];
                            e.pathToSolution = true;
                            solutionFound++;
                        }
                    }
                }
                if (isSolution) {
                    node.solution = true;
                    _this.solutionPathLengths.push(path.length);
                    solutionFound++;
                }
                else {
                    node.failure = true;
                }
            }
        });
        if (!solutionFound) {
            console.log("Solution is not specified in the SGF => assume main line is solution");
            var path = this.rootNode.mainLine();
            for (var _i = 0, path_2 = path; _i < path_2.length; _i++) {
                node = path_2[_i];
                node.pathToSolution = true;
            }
            path[path.length - 1].solution = true;
            this.solutionPathLengths.push(path.length);
        }
    };
    ProblemGobanViewer.prototype.reset = function () {
        this.positionViewer.setBgLabel("");
        _super.prototype.reset.call(this);
    };
    ProblemGobanViewer.prototype.toggleShowSolution = function () {
        this.showSolution = !this.showSolution;
        if (this.showSolution) {
            this.markSolutions();
        }
        else {
            this.goTo(this.currentNode);
        }
    };
    ProblemGobanViewer.prototype.goTo = function (node) {
        var _a, _b;
        _super.prototype.goTo.call(this, node);
        if (node === null || node === void 0 ? void 0 : node.solution) {
            this.positionViewer.setBgLabel("✓", "green", { opacity: 0.6 });
            (_b = (_a = this.opts) === null || _a === void 0 ? void 0 : _a.onCorrect) === null || _b === void 0 ? void 0 : _b.call(_a, this.currentNode);
        }
        else if (node === null || node === void 0 ? void 0 : node.failure) {
            this.positionViewer.setBgLabel("✗", "red", { opacity: 0.6 });
        }
        else if (node === null || node === void 0 ? void 0 : node.offPath) {
            this.positionViewer.setBgLabel("?", "gray", { opacity: 0.25 });
        }
        this.markSolutions();
    };
    ProblemGobanViewer.prototype.markSolutions = function () {
        var node = this.currentNode;
        if (this.showSolution) {
            for (var _i = 0, _a = (node === null || node === void 0 ? void 0 : node.children) || []; _i < _a.length; _i++) {
                var subnode = _a[_i];
                var _b = subnode.playerAndCoordinates(), color = _b[0], coords = _b[1];
                var _c = coordinateToRowColumn(coords), row = _c[0], col = _c[1];
                if ((subnode === null || subnode === void 0 ? void 0 : subnode.pathToSolution) || (subnode === null || subnode === void 0 ? void 0 : subnode.solution)) {
                    this.positionViewer.drawLabel(row, col, "✓", { color: "green", fontScale: .9 });
                }
                else {
                    this.positionViewer.drawLabel(row, col, "✗", { color: "red", fontScale: .9 });
                }
            }
        }
    };
    ProblemGobanViewer.prototype.onClick = function (row, col, color) {
        var _this = this;
        var _a;
        if (this.autoPlayTimeout) {
            return;
        }
        var coord = rowColumnToCoordinate([row, col]);
        var _loop_1 = function (i) {
            var child = this_1.currentNode.children[i];
            var _b = child.playerAndCoordinates(), _ = _b[0], childCoord = _b[1];
            if (coord == childCoord) {
                if (child === null || child === void 0 ? void 0 : child.pathToSolution) {
                    console.log("yes");
                }
                this_1.goTo(child);
                if (!this_1.showSolution) {
                    this_1.autoPlayTimeout = setTimeout(function () {
                        var _a;
                        _this.autoPlayTimeout = null;
                        if (!((_a = child.children) === null || _a === void 0 ? void 0 : _a.length)) {
                            return;
                        }
                        var first = (child.children || []).find((function (sub) {
                            if (sub.pathToSolution) {
                                return true;
                            }
                        }));
                        if (first) {
                            _this.goTo(first);
                        }
                        _this.goTo(child.children[0]);
                    }, 2 * 250);
                }
                return { value: void 0 };
            }
        };
        var this_1 = this;
        for (var i in ((_a = this.currentNode) === null || _a === void 0 ? void 0 : _a.children) || []) {
            var state_1 = _loop_1(i);
            if (typeof state_1 === "object")
                return state_1.value;
        }
        var node = (new SGFNode());
        node.offPath = true;
        node.setProperty(Tag.Comment, "Wrong (off path)");
        node.setMove(color, coord);
        try {
            this.goban.applyNodes(node); // TODO: Check for errors
            this.currentNode.appendNode(node);
            this.goTo(node);
        }
        catch (e) {
            console.error(e);
        }
    };
    ProblemGobanViewer.prototype.next = function () {
        var _a;
        if (this.autoPlayTimeout) {
            return;
        }
        var node = (_a = this.currentNode.children) === null || _a === void 0 ? void 0 : _a[0];
        if (!node) {
            return;
        }
        this.goTo(node);
    };
    ProblemGobanViewer.prototype.animate = function (nodes, interval) {
        var _this = this;
        if (interval === void 0) { interval = AUTOPLAY_INTERVAL; }
        this.resetAnimation();
        if (this.autoPlayTimeout) {
            return;
        }
        var i = 0;
        this.autoPlayTimeout = setInterval(function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.goTo(nodes[i]);
                i++;
                if (i >= nodes.length) {
                    clearInterval(this.autoPlayTimeout);
                    this.autoPlayTimeout = null;
                }
                return [2 /*return*/];
            });
        }); }, interval / this.animationSpeed);
    };
    ProblemGobanViewer.prototype.animateSolution = function (interval) {
        if (interval === void 0) { interval = AUTOPLAY_INTERVAL; }
        var firstSolution;
        this.rootNode.walkUntil(function (node, path) {
            if (node === null || node === void 0 ? void 0 : node.solution) {
                firstSolution = path;
                return true;
            }
            return false;
        });
        if (firstSolution) {
            this.animate(firstSolution, interval);
        }
    };
    ProblemGobanViewer.prototype.previous = function () {
        if (this.autoPlayTimeout) {
            return;
        }
        var path = this.rootNode.findPath(this.currentNode);
        if (((path === null || path === void 0 ? void 0 : path.length) || 0) <= 1) {
            return;
        }
        path.pop();
        this.goTo(path[path.length - 1]);
    };
    return ProblemGobanViewer;
}(AbstractGobanViewer));
var GobanPositionViewer = /** @class */ (function () {
    function GobanPositionViewer(elementId, nodeOrNodes, opts) {
        this.elementId = elementId;
        this.size = 19;
        /** Side of the goban including the cropped parts */
        this.width = 80; // This can change when cropping and zooming
        this.unit = "vmin";
        this.cropTop = 0;
        this.cropRight = 0;
        this.cropBottom = 0;
        this.cropLeft = 0;
        /** Elements to be deleted before every position change */
        this.temporaryElements = [];
        this.coordinates = false;
        var node;
        var nodes;
        if (nodeOrNodes.pop) {
            nodes = nodeOrNodes;
            node = nodes[0];
        }
        else {
            node = nodeOrNodes;
            nodes = [node];
        }
        this.idPrefix = elementId;
        this.width = (opts === null || opts === void 0 ? void 0 : opts.side) || 80;
        this.originalWidth = this.width;
        this.unit = (opts === null || opts === void 0 ? void 0 : opts.unit) || "vmin";
        this.rootElement = document.getElementById(this.elementId);
        if (opts === null || opts === void 0 ? void 0 : opts.crop) {
            if (opts.crop == "auto" || opts.crop == "square") {
                var bounds = node.bounds();
                // alert(JSON.stringify(bounds))
                bounds.increase(this.size, 2, 6);
                // alert(JSON.stringify(bounds))
                if (opts.crop == "square") {
                    bounds.makeSquare(this.size);
                }
                // alert(JSON.stringify(bounds))
                var top_1 = bounds.rowMin;
                var left = bounds.colMin;
                var right = this.size - bounds.colMax - 1;
                var bottom = this.size - bounds.rowMax - 1;
                // alert(`${top} ${right} ${bottom} ${left}`);
                this.cropTop = this.cropFactor(top_1);
                this.cropRight = this.cropFactor(right);
                this.cropBottom = this.cropFactor(bottom);
                this.cropLeft = this.cropFactor(left);
                // alert(this.cropTop + "," + this.cropRight + "," + this.cropBottom + "," + this.cropLeft);
            }
            else {
                this.cropTop = this.cropFactor(opts.crop[0] || 0);
                this.cropRight = this.cropFactor(opts.crop[1] || 0);
                this.cropBottom = this.cropFactor(opts.crop[2] || 0);
                this.cropLeft = this.cropFactor(opts.crop[3] || 0);
            }
        }
        this.onClick = opts === null || opts === void 0 ? void 0 : opts.onClick;
        this.coordinates = opts === null || opts === void 0 ? void 0 : opts.coordinates;
        if (!this.rootElement) {
            alert("no goban element found");
            return;
        }
        this.size = parseInt(node.findFirstProperty(Tag.Size)) || 19;
        this.drawGoban();
        var goban = new SGFGoban();
        goban.applyNodes.apply(goban, nodes);
        this.draw(goban);
    }
    GobanPositionViewer.prototype.cropFactor = function (cropFactor) {
        if (!cropFactor) {
            return 0;
        }
        if (cropFactor >= 1) {
            var res_1 = cropFactor / this.size; // - 0.25 / this.size;
            console.log("".concat(cropFactor, " -> ").concat(res_1));
            return res_1;
        }
        var res = Math.round(this.size * cropFactor) / this.size; // - .25 / this.size;
        console.log("".concat(cropFactor, " -> ").concat(res));
        return res;
    };
    GobanPositionViewer.prototype.gobanWidth = function () {
        return (1 - this.cropRight - this.cropLeft) * this.width;
    };
    GobanPositionViewer.prototype.gobanHeight = function () {
        return (1 - this.cropTop - this.cropBottom) * this.width;
    };
    GobanPositionViewer.prototype.drawGoban = function () {
        this.width = Math.min(this.originalWidth / (1 - this.cropLeft - this.cropRight), this.originalWidth / (1 - this.cropTop - this.cropBottom));
        this.bandWidth = this.width / this.size;
        var w = (this.coordinates ? 2 * this.bandWidth : 0) + this.gobanWidth();
        var h = (this.coordinates ? 2 * this.bandWidth : 0) + this.gobanHeight();
        var withCoordinatesDiv = getOrCreateElement(this.idPrefix, "div", "goban-coordinates", {
            overflow: "hidden",
            backgroundColor: BACKGROUND_COLOR,
            position: "relative",
            width: "".concat(w).concat(this.unit),
            height: "".concat(h).concat(this.unit),
            display: "flex",
            alignItems: "center",
            justifyItems: "center",
            textAlign: "center",
            alignContent: "center",
            justifyContent: "center",
            fontSize: "".concat(Math.min(w, h) * .75).concat(this.unit)
        }).element;
        this.bgLabelDiv = getOrCreateElement(this.elementId, "div", "bgtext", {
            alignSelf: "center",
            justifySelf: "center"
        }).element;
        withCoordinatesDiv.appendChild(this.bgLabelDiv);
        // Used to crop the overflow:
        var cropContainerDiv = getOrCreateElement(this.idPrefix, "div", "goban-container", {
            position: "absolute",
            overflow: "hidden",
            width: "".concat(this.gobanWidth()).concat(this.unit),
            height: "".concat(this.gobanHeight()).concat(this.unit),
            top: this.coordinates ? "".concat(this.bandWidth).concat(this.unit) : "0px",
            left: this.coordinates ? "".concat(this.bandWidth).concat(this.unit) : "0px",
            margin: "1px",
        }).element;
        this.gobanDiv = getOrCreateElement(this.idPrefix, "div", "goban_div", {
            width: "".concat(this.width).concat(this.unit),
            height: "".concat(this.width).concat(this.unit),
            position: "relative",
            top: "".concat((-this.cropTop) * this.width).concat(this.unit),
            left: "".concat((-this.cropLeft) * this.width).concat(this.unit),
        }).element;
        // this.gobanDiv.onmouseleave = (e: MouseEvent) => {
        // 	e.preventDefault();
        // 	console.log("out of the goban");
        // };
        this.rootElement.innerHTML = "";
        cropContainerDiv.appendChild(this.gobanDiv);
        withCoordinatesDiv.appendChild(cropContainerDiv);
        this.rootElement.appendChild(withCoordinatesDiv);
        // const emptyBorder = .5 * this.side / this.size;
        for (var index = 0; index < this.size; index++) {
            this.gobanDiv.appendChild(getOrCreateElement(this.idPrefix, "div", "vertical-".concat(index), {
                position: "absolute",
                height: "".concat(this.width - this.bandWidth).concat(this.unit),
                width: "0.5px",
                color: "black",
                top: "".concat(this.bandWidth / 2).concat(this.unit),
                left: "".concat(this.width * index / this.size + this.bandWidth / 2.).concat(this.unit),
                backgroundColor: "black"
            }).element);
            this.gobanDiv.appendChild(getOrCreateElement(this.idPrefix, "div", "horizontal-".concat(index), {
                position: "absolute",
                width: "".concat(this.width - this.bandWidth).concat(this.unit),
                height: "0.5px",
                color: "black",
                left: "".concat(this.bandWidth / 2).concat(this.unit),
                top: "".concat(this.width * index / this.size + this.bandWidth / 2.).concat(this.unit),
                backgroundColor: "black"
            }).element);
        }
        this.drawHoshi();
        if (this.coordinates) {
            this.drawCoordinates(withCoordinatesDiv);
        }
    };
    GobanPositionViewer.prototype.setBgLabel = function (str, color, opts) {
        if (color === void 0) { color = "black"; }
        applyStyle(this.bgLabelDiv, { color: color, opacity: (opts === null || opts === void 0 ? void 0 : opts.opacity) === undefined ? "1" : "" + opts.opacity });
        this.bgLabelDiv.innerHTML = str;
    };
    GobanPositionViewer.prototype.drawCoordinates = function (withCoordinatesDiv) {
        if (!this.coordinates) {
            return;
        }
        for (var i = 0; i < this.size; i++) {
            var top_2 = (i + 1) * this.bandWidth - this.cropTop * this.width;
            var baseStyle = {
                position: "absolute",
                display: "flex",
                alignItems: "center",
                justifyItems: "center",
                textAlign: "center",
                alignContent: "center",
                justifyContent: "center",
                flexGrow: "1",
                width: "".concat(this.bandWidth).concat(this.unit),
                height: "".concat(this.bandWidth).concat(this.unit),
                fontSize: "".concat(this.bandWidth / 3).concat(this.unit),
                color: "black"
            };
            console.log("label=".concat(coordinatesLetters.charAt(i).toUpperCase() || "".concat(i), " top=").concat(top_2, ", height=").concat(this.gobanHeight(), " band=").concat(this.bandWidth));
            if (0 < top_2 && top_2 <= this.gobanHeight()) {
                withCoordinatesDiv.appendChild(getOrCreateElement(this.idPrefix, "div", "coordinate-".concat(i, "-left"), __assign(__assign({}, baseStyle), { top: "".concat(top_2).concat(this.unit), left: "0px" }), "".concat(this.size - i)).element);
                withCoordinatesDiv.appendChild(getOrCreateElement(this.idPrefix, "div", "coordinate-".concat(i, "-right"), __assign(__assign({}, baseStyle), { top: "".concat(top_2).concat(this.unit), right: "0px" }), "".concat(this.size - i)).element);
            }
            var left = (i + 1) * this.bandWidth - this.cropLeft * this.width;
            if (0 < left && left <= this.gobanWidth()) {
                withCoordinatesDiv.appendChild(getOrCreateElement(this.idPrefix, "div", "coordinate-".concat(i, "-top"), __assign(__assign({}, baseStyle), { top: "0px", left: "".concat(left).concat(this.unit) }), coordinatesLetters.charAt(i).toUpperCase() || "".concat(i)).element);
                withCoordinatesDiv.appendChild(getOrCreateElement(this.idPrefix, "div", "coordinate-".concat(i, "-bottom"), __assign(__assign({}, baseStyle), { bottom: "0px", left: "".concat(left).concat(this.unit) }), coordinatesLetters.charAt(i).toUpperCase() || "".concat(i)).element);
            }
        }
    };
    GobanPositionViewer.prototype.drawHoshi = function () {
        var hoshiPositions = [];
        switch (this.size) {
            case 19:
                hoshiPositions = [
                    [3, 3], [3, 9], [3, 15],
                    [9, 3], [9, 9], [9, 15],
                    [15, 3], [15, 9], [15, 15],
                ];
                break;
            case 13:
                hoshiPositions = [
                    [3, 3], [3, 9],
                    [6, 6],
                    [9, 3], [9, 9],
                ];
                break;
            case 9:
                hoshiPositions = [
                    [2, 2], [2, 6],
                    [6, 2], [6, 6],
                ];
                break;
        }
        for (var _i = 0, hoshiPositions_1 = hoshiPositions; _i < hoshiPositions_1.length; _i++) {
            var pos = hoshiPositions_1[_i];
            this.drawIntersectionDot("hoshi", pos[0], pos[1], { opacity: 1, radious: this.bandWidth / 5, color: "black" });
        }
    };
    GobanPositionViewer.prototype.drawIntersectionDot = function (idPrefix, row, col, params) {
        var _this = this;
        var div = getOrCreateElement(this.idPrefix, "div", "".concat(idPrefix, "-intersection-").concat(row, "-").concat(col), {
            justifyContent: "center",
            alignContent: "center",
            display: "flex",
            flexDirection: "row",
            position: "absolute",
            width: "".concat(this.bandWidth).concat(this.unit),
            height: "".concat(this.bandWidth).concat(this.unit),
            top: "".concat(row * this.bandWidth).concat(this.unit),
            left: "".concat(col * this.bandWidth).concat(this.unit)
        }).element;
        div.appendChild(getOrCreateElement(this.idPrefix, "div", "innext-hoshi-".concat(row, "-").concat(col), {
            opacity: params.opacity ? params.opacity : 1,
            backgroundColor: params.color ? params.color : "black",
            borderRadius: "".concat(params.radious).concat(this.unit),
            alignSelf: "center",
            justifySelf: "center",
            justifyContent: "center",
            width: "".concat(params.radious).concat(this.unit),
            height: "".concat(params.radious).concat(this.unit)
        }).element);
        this.gobanDiv.appendChild(div);
        this.gobanDiv.onmouseleave = this.onMouseLeaveGoban.bind(this);
        this.gobanDiv.onmouseup = function (e) {
            var _a;
            if (_this.mouseOverRow !== undefined && _this.mouseOverCol !== undefined) {
                (_a = _this === null || _this === void 0 ? void 0 : _this.onClick) === null || _a === void 0 ? void 0 : _a.call(_this, _this.mouseOverRow, _this.mouseOverCol, _this.goban.nextToPlay);
                _this.showCoordinate();
            }
        };
        return div;
    };
    GobanPositionViewer.prototype.showCoordinate = function () {
        clearTimeout(this.coordinateTimeout);
        var el = getElement(this.elementId, "coordinate_clicked");
        if (el) {
            var coord = rowColumnToCoordinate([this.mouseOverRow, this.mouseOverCol]);
            el.innerHTML = "".concat(coordinatesLetters.charAt(this.mouseOverCol).toUpperCase()).concat(this.size - this.mouseOverRow, " / ").concat(coord);
        }
        this.coordinateTimeout = setTimeout(function () {
            el.innerHTML = "";
        }, 1000);
    };
    GobanPositionViewer.prototype.draw = function (goban) {
        for (var _i = 0, _a = this.temporaryElements; _i < _a.length; _i++) {
            var el = _a[_i];
            el.remove();
        }
        this.goban = goban;
        for (var row = 0; row < this.size; row++) {
            console.log(JSON.stringify(this.goban.goban[row]));
            for (var col = 0; col < this.size; col++) {
                this.drawStone(row, col);
            }
        }
        if (this.goban.latestMove) {
            var _b = coordinateToRowColumn(this.goban.latestMove), row = _b[0], col = _b[1];
            /*
                <IntersectionDot radious={bandWidth / 3}
                    color={props.goban.stoneAt(props.goban.latestMove) == SGFColor.BLACK ? "white" : "black"}
                    bandWidth={bandWidth} unit={unit} />}
            */
            this.temporaryElements.push(this.drawIntersectionDot("lastpt", row, col, {
                color: this.goban.stoneAt(this.goban.latestMove) == SGFColor.BLACK ? "white" : "black",
                radious: this.bandWidth / 3,
            }));
        }
        for (var coord in this.goban.labels) {
            var _c = coordinateToRowColumn(coord), row = _c[0], col = _c[1];
            var color = this.goban.stoneAt(coord) == SGFColor.BLACK ? "white" : "black";
            this.drawLabel(row, col, this.goban.labels[coord], { color: color });
        }
        for (var coord in this.goban.triangles) {
            var _d = coordinateToRowColumn(coord), row = _d[0], col = _d[1];
            var color = this.goban.stoneAt(coord) == SGFColor.BLACK ? "white" : "black";
            this.drawLabel(row, col, "△", { color: color });
        }
        for (var coord in this.goban.squares) {
            var _e = coordinateToRowColumn(coord), row = _e[0], col = _e[1];
            var color = this.goban.stoneAt(coord) == SGFColor.BLACK ? "white" : "black";
            this.drawLabel(row, col, "□", { color: color });
        }
        for (var coord in this.goban.crosses) {
            var _f = coordinateToRowColumn(coord), row = _f[0], col = _f[1];
            var color = this.goban.stoneAt(coord) == SGFColor.BLACK ? "white" : "black";
            this.drawLabel(row, col, "×", { color: color });
        }
        for (var coord in this.goban.circles) {
            var _g = coordinateToRowColumn(coord), row = _g[0], col = _g[1];
            var color = this.goban.stoneAt(coord) == SGFColor.BLACK ? "white" : "black";
            this.drawLabel(row, col, "○", { color: color });
        }
    };
    GobanPositionViewer.prototype.getStoneElement = function (row, col) {
        return document.getElementById("".concat(this.idPrefix, "_stone-").concat(row, "-").concat(col));
    };
    GobanPositionViewer.prototype.drawStone = function (row, col) {
        var _this = this;
        var _a, _b;
        var color = (_b = (_a = this.goban.goban) === null || _a === void 0 ? void 0 : _a[row]) === null || _b === void 0 ? void 0 : _b[col];
        var cssColor = "";
        switch (color) {
            case SGFColor.BLACK:
                cssColor = "black";
                break;
            case SGFColor.WHITE:
                cssColor = "white";
                break;
            case SGFColor.NONE, SGFColor.INVALID:
                cssColor = "";
                break;
        }
        var stoneElement = getOrCreateElement(this.idPrefix, "div", "stone-".concat(row, "-").concat(col), {
            display: "flex",
            justifyContent: "center",
            alignContent: "center",
            // opacity: props?.opacity ? props.opacity : undefined,
            position: "absolute",
            width: "".concat(this.bandWidth).concat(this.unit),
            height: "".concat(this.bandWidth).concat(this.unit),
            top: "".concat(row * this.bandWidth).concat(this.unit),
            left: "".concat(col * this.bandWidth).concat(this.unit),
        });
        if (this.getStoneElement(row, col) == stoneElement.element) {
            console.error("stone element id invalid!");
        }
        if (stoneElement.created) {
            this.gobanDiv.appendChild(stoneElement.element);
            stoneElement.element.row = row;
            stoneElement.element.col = col;
            stoneElement.element.onmouseenter = function (e) {
                var se = e.currentTarget;
                if ((se === null || se === void 0 ? void 0 : se.row) !== undefined && (se === null || se === void 0 ? void 0 : se.col) !== undefined) {
                    _this.onMouseEnter(row, col);
                }
            };
        }
        if (cssColor) {
            applyStyle(stoneElement.element, {
                borderRadius: "".concat(this.bandWidth / 1).concat(this.unit),
                backgroundColor: cssColor,
            });
        }
        else {
            applyStyle(stoneElement.element, {
                backgroundColor: null,
            });
        }
    };
    GobanPositionViewer.prototype.onMouseEnter = function (row, col) {
        if (row != this.mouseOverRow || col != this.mouseOverCol) {
            console.log("on ".concat(row, ",").concat(col));
            this.mouseOverRow = row;
            this.mouseOverCol = col;
            var nextColor = void 0;
            if (this.goban.nextToPlay == SGFColor.WHITE) {
                nextColor = "white";
            }
            else if (this.goban.nextToPlay == SGFColor.BLACK) {
                nextColor = "black";
            }
            var el = getOrCreateElement(this.idPrefix, "div", "next-stone", {
                display: "flex",
                justifyContent: "center",
                alignContent: "center",
                position: "absolute",
                width: "".concat(this.bandWidth).concat(this.unit),
                height: "".concat(this.bandWidth).concat(this.unit),
                top: "".concat(row * this.bandWidth).concat(this.unit),
                left: "".concat(col * this.bandWidth).concat(this.unit),
                visibility: "visible",
                borderRadius: "".concat(this.bandWidth / 1).concat(this.unit),
                backgroundColor: nextColor,
                opacity: "0.4",
            });
            if (el.created) {
                this.gobanDiv.appendChild(el.element);
                this.tmpHoverStone = el.element;
            }
        }
    };
    GobanPositionViewer.prototype.onMouseLeaveGoban = function () {
        console.log("out of goban");
        this.mouseOverCol = undefined;
        this.mouseOverRow = undefined;
        applyStyle(this.tmpHoverStone, {
            visibility: "hidden",
        });
    };
    GobanPositionViewer.prototype.drawLabel = function (row, column, label, opts) {
        this.drawStone(row, column);
        console.log("Label ".concat(label, " on ").concat(row, ",").concat(column));
        var stoneDiv = this.getStoneElement(row, column);
        var div = getOrCreateElement(this.idPrefix, "div", "label-".concat(row, "-").concat(column), {
            color: opts.color,
            display: "flex",
            alignSelf: "center",
            justifySelf: "center",
            textAlign: "center",
            flexGrow: "1",
            justifyContent: "center",
            fontSize: "".concat(this.bandWidth * ((opts === null || opts === void 0 ? void 0 : opts.fontScale) || 0.6)).concat(this.unit)
        }).element;
        div.innerHTML = label;
        stoneDiv.appendChild(div);
        this.temporaryElements.push(div);
    };
    return GobanPositionViewer;
}());
